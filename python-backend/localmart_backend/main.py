import asyncio
import base64
import datetime
import json
import logging
import os
from typing import List, Dict, Set
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Response, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .uber_direct import UberDirectClient
from .pocketbase_service import PocketBaseService

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PocketBase service
pb_service = PocketBaseService('http://pocketbase:8090')

# Get Uber Direct credentials from environment
UBER_CUSTOMER_ID = os.getenv('LOCALMART_UBER_DIRECT_CUSTOMER_ID')
UBER_CLIENT_ID = os.getenv('LOCALMART_UBER_DIRECT_CLIENT_ID')
UBER_CLIENT_SECRET = os.getenv('LOCALMART_UBER_DIRECT_CLIENT_SECRET')

# Initialize Uber Direct client
uber_client = UberDirectClient(UBER_CUSTOMER_ID, UBER_CLIENT_ID, UBER_CLIENT_SECRET)

# Track active deliveries
active_deliveries: Set[str] = set()

@contextmanager
def user_auth_context(token: str):
    """Context manager to handle user authentication state"""
    try:
        pb_service.set_token(token)
        yield
    finally:
        pb_service.clear_token()

def get_token_from_request(request: Request) -> str:
    """Extract and validate the auth token from a request"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    return auth_header.split(' ')[1]

def decode_jwt(token):
    # Split the token into parts
    parts = token.split('.')
    if len(parts) != 3:
        return "Not a valid JWT token format"

    # Decode the payload (second part)
    try:
        # Add padding if needed
        padding = len(parts[1]) % 4
        if padding:
            parts[1] += '=' * (4 - padding)

        payload = base64.b64decode(parts[1])
        return json.loads(payload)
    except Exception as e:
        return f"Error decoding token: {str(e)}"

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str
    passwordConfirm: str
    name: str

class DeliveryQuoteRequest(BaseModel):
    store_id: str
    item_id: str
    delivery_address: Dict

app = FastAPI(
    title="LocalMart Backend",
    description="Backend API for LocalMart application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.on_event("startup")
async def startup_event():
    """Print all routes on startup with clickable URLs"""
    host = "http://localhost:8000"  # Default FastAPI host
    print("\n🚀 Available routes:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            url = f"{host}{route.path}"
            print(f"{methods:20} {url}")
    print()

### ROUTES

@app.get("/", response_model=Dict)
async def hello_world():
    return {"message": "Hello World from LocalMart Backend!"}

@app.get("/api/v0/stores", response_model=List[Dict])
async def list_stores():
    """List all stores"""
    try:
        # Get all records from the stores collection
        stores = pb_service.get_list('stores', 1, 50)

        # Convert Record objects to simplified dictionaries
        return [serialize_store(store) for store in stores.items]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Issue fetching stores"
        )

@app.get("/api/v0/stores/{store_id}", response_model=Dict)
async def get_store(store_id: str):
    """Get a single store by ID"""
    try:
        # Get the store record
        store = pb_service.get_one('stores', store_id)
        return serialize_store(store)
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Store not found: {str(e)}"
        )

@app.get("/api/v0/stores/{store_id}/items", response_model=List[Dict])
async def list_store_items(store_id: str):
    """List all items for a specific store"""
    try:
        # Get all records from the store_items collection for this store
        items = pb_service.get_list(
            'store_items',
            1, 50,
            query_params={
                "filter": f'store = "{store_id}"'
            }
        )

        # Convert Record objects to simplified dictionaries
        return [serialize_store_item(item) for item in items.items]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Issue fetching store items: {str(e)}"
        )

@app.post("/api/v0/delivery/quote", response_model=Dict)
async def get_delivery_quote(request: DeliveryQuoteRequest):
    """Get a delivery quote from Uber Direct"""
    try:
        # Get store details
        store = pb_service.get_one('stores', request.store_id)

        # Get item details
        item = pb_service.get_one('store_items', request.item_id)
        item_price_cents = int(item.price * 100)  # Convert to cents

        # Prepare addresses
        pickup_address = {
            'street_address': [store.street_1],
            'city': store.city,
            'state': store.state,
            'zip_code': store.zip,
            'country': 'US'
        }

        # Calculate time windows
        now = datetime.datetime.now(datetime.timezone.utc)
        pickup_ready = now + datetime.timedelta(minutes=15)
        pickup_deadline = pickup_ready + datetime.timedelta(hours=1)
        dropoff_ready = pickup_ready + datetime.timedelta(minutes=30)
        dropoff_deadline = dropoff_ready + datetime.timedelta(hours=1)

        # Get quote from Uber Direct
        quote_data = await uber_client.get_delivery_quote(
            pickup_address=pickup_address,
            dropoff_address=request.delivery_address,
            pickup_ready=pickup_ready,
            pickup_deadline=pickup_deadline,
            dropoff_ready=dropoff_ready,
            dropoff_deadline=dropoff_deadline,
            item_price_cents=item_price_cents
        )

        return {
            'fee': quote_data['fee'],
            'currency': quote_data['currency'],
            'estimated_delivery_time': quote_data['dropoff_eta']
        }

    except Exception as e:
        logger.error(f"Delivery quote error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get delivery quote: {str(e)}"
        )

@app.post("/api/v0/orders", response_model=Dict)
async def create_order(request: Dict):
    """Create a new order with basic status tracking"""
    try:
        # Create the order in PocketBase with simplified fields
        order = pb_service.create('orders', {
            'user': request['user_id'],
            'store': request['store_id'],
            'status': 'pending',  # Initial status
            'subtotal_amount': request['subtotal_amount'],
            'tax_amount': request['tax_amount'],
            'delivery_fee': request['delivery_fee'],
            'total_amount': request['total_amount'],
            'delivery_address': request['delivery_address'],
            'customer_notes': request.get('customer_notes', ''),
            'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        })

        # Create order items
        for item in request['items']:
            pb_service.create('order_items', {
                'order': order.id,
                'store_item': item['store_item_id'],
                'quantity': item['quantity'],
                'price_at_time': item['price'],
                'total_price': item['price'] * item['quantity']
            })

        return {
            'order_id': order.id,
            'status': 'pending',
            'message': 'Order created successfully'
        }

    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}"
        )

@app.get("/api/v0/orders", response_model=List[Dict])
async def get_user_orders(request: Request):
    """Get orders for the authenticated user"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    with user_auth_context(token):
        # Get user's orders
        orders = pb_service.get_list(
            'orders',
            query_params={
                "filter": f'user = "{user_id}"',
                "sort": "-created",
                "expand": "order_items(order).store_item,order_items(order).store_item.store,user"
            }
        )

        # Format orders for response
        formatted_orders = []
        for order in orders.items:
            # Group items by store
            stores_dict = {}

            # Get all order items for this order
            order_items = order.expand.get('order_items(order)', [])

            for item in order_items:
                if not hasattr(item, 'expand') or not item.expand.get('store_item'):
                    continue

                store_item = item.expand['store_item']
                if not hasattr(store_item, 'expand') or not store_item.expand.get('store'):
                    continue

                store = store_item.expand['store']
                store_id = store.id

                if store_id not in stores_dict:
                    stores_dict[store_id] = {
                        'store': {
                            'id': store.id,
                            'name': store.name
                        },
                        'items': []
                    }

                stores_dict[store_id]['items'].append({
                    'id': item.id,
                    'name': store_item.name,
                    'quantity': item.quantity,
                    'price': item.price_at_time
                })

            # Get user info from expanded user record
            user = order.expand.get('user', {})
            customer_name = user.name if user else "Unknown"
            
            # Format user's address
            delivery_address = {
                'street_address': [user.street_1] + ([user.street_2] if user.street_2 else []),
                'city': user.city,
                'state': user.state,
                'zip_code': user.zip,
                'country': 'US'
            } if user else None

            formatted_order = {
                'id': order.id,
                'created': order.created,
                'status': order.status,
                'delivery_fee': order.delivery_fee,
                'total_amount': order.total_amount,
                'customer_name': customer_name,
                'delivery_address': delivery_address,
                'stores': list(stores_dict.values())
            }
            formatted_orders.append(formatted_order)

        return formatted_orders

@app.patch("/api/v0/orders/{order_id}/status", response_model=Dict)
async def update_order_status(order_id: str, request: Request):
    """Update the status of an order"""
    token = get_token_from_request(request)
    
    try:
        body = await request.json()
        status = body.get('status')
    except Exception as e:
        logger.error(f"Error parsing request body: {e}")
        raise HTTPException(status_code=400, detail="Invalid request body")

    if not status:
        raise HTTPException(status_code=400, detail="Status is required")

    valid_statuses = ['pending', 'confirmed', 'picked_up', 'delivered', 'cancelled']
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    with user_auth_context(token):
        try:
            data = {
                'status': status,
                'updated': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            
            order = pb_service.update('orders', order_id, data)
            
            return {
                'order_id': order.id,
                'status': status,
                'message': 'Order status updated successfully'
            }
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update order status: {str(e)}"
            )

### AUTH ROUTES

@app.post("/api/v0/auth/signup", response_model=Dict)
async def signup(user: UserSignup):
    """Create a new user account"""
    try:
        # Create user record
        record = pb_service.create('users', {
            'email': user.email,
            'password': user.password,
            'passwordConfirm': user.passwordConfirm,
            'name': user.name,
            'username': user.email,  # Use email as username since PocketBase requires it
        })

        # After creation, authenticate to get the token
        auth_data = pb_service.auth_with_password(
            'users',
            user.email,
            user.password
        )

        return {
            "token": auth_data.token,
            "user": {
                "id": auth_data.record.id,
                "email": auth_data.record.email,
                "name": auth_data.record.name,
            }
        }
    except Exception as e:
        print(f"Signup error: {str(e)}")  # Add debug logging
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@app.post("/api/v0/auth/login", response_model=Dict)
async def login(user: UserLogin):
    """Log in an existing user"""
    try:
        auth_data = pb_service.auth_with_password(
            'users',
            user.email,
            user.password
        )

        return {
            "token": auth_data.token,
            "user": {
                "id": auth_data.record.id,
                "email": auth_data.record.email,
                "name": auth_data.record.name,
            }
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

@app.get("/api/v0/auth/profile", response_model=Dict)
async def get_profile(request: Request):
    """Get the current user's profile"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    with user_auth_context(token):
        try:
            user = pb_service.get_one('users', user_id)
            return {
                'name': user.name,
                'email': user.email,
                'street_1': getattr(user, 'street_1', ''),
                'street_2': getattr(user, 'street_2', ''),
                'city': getattr(user, 'city', ''),
                'state': getattr(user, 'state', ''),
                'zip': getattr(user, 'zip', '')
            }
        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch user profile: {str(e)}"
            )

@app.patch("/api/v0/auth/profile", response_model=Dict)
async def update_profile(request: Request):
    """Update the current user's profile"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request body")

    with user_auth_context(token):
        try:
            user = pb_service.update('users', user_id, {
                'name': body.get('name'),
                'street_1': body.get('street_1'),
                'street_2': body.get('street_2'),
                'city': body.get('city'),
                'state': body.get('state'),
                'zip': body.get('zip')
            })
            
            return {
                'name': user.name,
                'email': user.email,
                'street_1': getattr(user, 'street_1', ''),
                'street_2': getattr(user, 'street_2', ''),
                'city': getattr(user, 'city', ''),
                'state': getattr(user, 'state', ''),
                'zip': getattr(user, 'zip', '')
            }
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update user profile: {str(e)}"
            )

### UTILS

def serialize_store(store) -> Dict:
    """Extract store fields from a store record"""
    return {
        "id": store.id,
        "name": store.name,
        "street_1": store.street_1,
        "street_2": store.street_2,
        "city": store.city,
        "state": store.state,
        "zip_code": store.zip  # PocketBase field is 'zip' but we send as 'zip_code'
    }

def serialize_store_item(item) -> Dict:
    """Extract item fields from a store item record"""
    return {
        "id": item.id,
        "name": item.name,
        "price": item.price
    }
