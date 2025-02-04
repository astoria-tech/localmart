import asyncio
import base64
import datetime
import json
import logging
import os
from typing import List, Dict, Set

from fastapi import FastAPI, HTTPException, Response, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pocketbase import PocketBase
from pydantic import BaseModel

from .uber_direct import UberDirectClient

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PocketBase client
pb = PocketBase('http://pocketbase:8090')

# Get Uber Direct credentials from environment
UBER_CUSTOMER_ID = os.getenv('LOCALMART_UBER_DIRECT_CUSTOMER_ID')
UBER_CLIENT_ID = os.getenv('LOCALMART_UBER_DIRECT_CLIENT_ID')
UBER_CLIENT_SECRET = os.getenv('LOCALMART_UBER_DIRECT_CLIENT_SECRET')

# Initialize Uber Direct client
uber_client = UberDirectClient(UBER_CUSTOMER_ID, UBER_CLIENT_ID, UBER_CLIENT_SECRET)

# Track active deliveries
active_deliveries: Set[str] = set()

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

async def poll_delivery_status(delivery_id: str, order_id: str):
    """Poll Uber Direct API for delivery status updates"""
    try:
        while delivery_id in active_deliveries:
            delivery_data = await uber_client.get_delivery_status(delivery_id)
            status = delivery_data['status']

            # Update order status in PocketBase
            pb.collection('orders').update(order_id, {
                'status': status
            })

            # Create status update record
            pb.collection('order_status_updates').create({
                'order': order_id,
                'status': status,
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'details': delivery_data
            })

            # Remove from active deliveries if in terminal state
            if status in ['delivered', 'cancelled']:
                active_deliveries.remove(delivery_id)
                logger.info(f"Delivery {delivery_id} completed with status: {status}")
                break

            # Poll every 30 seconds
            await asyncio.sleep(30)
    except Exception as e:
        logger.error(f"Error polling delivery {delivery_id}: {str(e)}")
        active_deliveries.remove(delivery_id)

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
    item_id: str  # Add item_id to get the price
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
        stores = pb.collection('stores').get_list(1, 50)

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
        store = pb.collection('stores').get_one(store_id)
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
        items = pb.collection('store_items').get_list(
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
        store = pb.collection('stores').get_one(request.store_id)

        # Get item details
        item = pb.collection('store_items').get_one(request.item_id)
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
async def create_order(
    background_tasks: BackgroundTasks,
    request: Dict
):
    """Create a new order and initiate Uber delivery"""
    try:
        # First create the order in PocketBase
        order = pb.collection('orders').create({
            'user': request['user_id'],
            'store': request['store_id'],
            'status': 'pending',
            'delivery_address': request['delivery_address'],
            'subtotal_amount': request['subtotal_amount'],
            'tax_amount': request['tax_amount'],
            'delivery_fee': request['delivery_fee'],
            'total_amount': request['total_amount'],
            'estimated_delivery_time': request['estimated_delivery_time'],
            'pickup_ready_time': request['pickup_ready_time'],
            'pickup_deadline_time': request['pickup_deadline_time'],
            'dropoff_ready_time': request['dropoff_ready_time'],
            'dropoff_deadline_time': request['dropoff_deadline_time']
        })

        # Create order items
        for item in request['items']:
            pb.collection('order_items').create({
                'order': order.id,
                'store_item': item['store_item_id'],
                'quantity': item['quantity'],
                'price_at_time': item['price'],
                'total_price': item['price'] * item['quantity']
            })

        # Get store details
        store = pb.collection('stores').get_one(request['store_id'])

        # Prepare pickup address
        pickup_address = {
            'street_address': [store.street_1],
            'city': store.city,
            'state': store.state,
            'zip_code': store.zip,
            'country': 'US'
        }

        # Prepare manifest items
        manifest_items = [
            {
                'name': item['name'],
                'quantity': item['quantity'],
                'price': int(item['price'] * 100)
            }
            for item in request['items']
        ]

        # Create delivery in Uber Direct
        delivery_data = await uber_client.create_delivery(
            pickup_address=pickup_address,
            dropoff_address=request['delivery_address'],
            pickup_ready=request['pickup_ready_time'],
            pickup_deadline=request['pickup_deadline_time'],
            dropoff_ready=request['dropoff_ready_time'],
            dropoff_deadline=request['dropoff_deadline_time'],
            total_amount=request['total_amount'],
            manifest_items=manifest_items
        )

        # Update order with Uber delivery details
        pb.collection('orders').update(order.id, {
            'uber_delivery_id': delivery_data['id'],
            'uber_tracking_url': delivery_data['tracking_url'],
            'status': 'confirmed'
        })

        # Start polling for updates
        active_deliveries.add(delivery_data['id'])
        background_tasks.add_task(
            poll_delivery_status,
            delivery_data['id'],
            order.id
        )

        return {
            'order_id': order.id,
            'uber_delivery_id': delivery_data['id'],
            'tracking_url': delivery_data['tracking_url']
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
    # Get auth token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(' ')[1]
    logger.info(f"Received token in orders endpoint: {token[:20]}...")  # Log first 20 chars of token

    decoded_token = decode_jwt(token)
    print("Decoded token payload:", json.dumps(decoded_token, indent=2))

    # FIXME: Multiple sessions need to be tested, this may just be using the last logged in user
    user_id = decoded_token['id']

    # Get user's orders
    orders = pb.collection('orders').get_list(
        1, 50,  # Get up to 50 orders
        query_params={
            "filter": f'user = "{user_id}"',
            "sort": "-created",
            "expand": "store,order_items"
        }
    )

    # Format orders for response
    formatted_orders = []
    for order in orders.items:
        formatted_order = {
            'id': order.id,
            'created': order.created,
            'status': order.status,
            'delivery_fee': order.delivery_fee,
            'total_amount': order.total_amount,
            'uber_tracking_url': order.uber_tracking_url,
            'store': {
                'id': order.expand.store.id,
                'name': order.expand.store.name
            } if order.expand.get('store') else None,
            'items': [
                {
                    'id': item.id,
                    'name': item.name,
                    'quantity': item.quantity,
                    'price': item.price_at_time
                }
                for item in order.expand.get('order_items', [])
            ]
        }
        formatted_orders.append(formatted_order)

    return formatted_orders

### AUTH ROUTES

@app.post("/api/v0/auth/signup", response_model=Dict)
async def signup(user: UserSignup):
    """Create a new user account"""
    try:
        # Create user record
        record = pb.collection('users').create({
            'email': user.email,
            'password': user.password,
            'passwordConfirm': user.passwordConfirm,
            'name': user.name,
            'username': user.email,  # Use email as username since PocketBase requires it
        })

        # After creation, authenticate to get the token
        auth_data = pb.collection('users').auth_with_password(
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
        auth_data = pb.collection('users').auth_with_password(
            user.email,
            user.password
        )
        logger.info(f"Login successful. Token type: {type(auth_data.token)}")
        logger.info(f"Token: {auth_data.token[:20]}...")  # Log first 20 chars of token

        response_data = {
            "token": auth_data.token,
            "user": {
                "id": auth_data.record.id,
                "email": auth_data.record.email,
                "name": auth_data.record.name,
            }
        }
        return response_data
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
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
        "state": store.state
    }

def serialize_store_item(item) -> Dict:
    """Extract item fields from a store item record"""
    return {
        "id": item.id,
        "name": item.name,
        "price": item.price
    }
