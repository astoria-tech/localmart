import base64
import datetime
import json
import logging
import os
from typing import List, Dict, Set, Optional
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import stripe

from .pocketbase_service import PocketBaseService
from .config import Config
from .geocoding_service import GeocodingService

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PocketBase service with environment variable or default
POCKETBASE_URL = os.getenv('POCKETBASE_URL', 'http://pocketbase:8090')
logger.info(f"Initializing PocketBase with URL: {POCKETBASE_URL}")
pb_service = PocketBaseService(POCKETBASE_URL)

# Get Uber Direct credentials from environment
UBER_CUSTOMER_ID = Config.UBER_CUSTOMER_ID
UBER_CLIENT_ID = Config.UBER_CLIENT_ID
UBER_CLIENT_SECRET = Config.UBER_CLIENT_SECRET

# Track active deliveries
active_deliveries: Set[str] = set()

# Initialize Stripe
stripe.api_key = Config.STRIPE_SECRET_KEY

# Initialize Stripe webhook secret
STRIPE_WEBHOOK_SECRET = Config.STRIPE_WEBHOOK_SECRET

# Initialize geocoding service
geocoding_service = GeocodingService()  # Will get API key from environment variable

@contextmanager
def user_auth_context(token: Optional[str]):
    """Context manager to handle user authentication for PocketBase operations"""
    if not token:
        raise HTTPException(status_code=401, detail="No authorization token")
    
    try:
        # Verify the user's token
        token = token.split(' ')[1] if token.startswith('Bearer ') else token
        user = pb_service.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        yield user
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

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
    first_name: str
    last_name: str

class DeliveryQuoteRequest(BaseModel):
    store_id: str
    item_id: str
    delivery_address: Dict

class StoreItem(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

app = FastAPI(
    title="LocalMart Backend",
    description="Backend API for LocalMart application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:3000",

        # Staging
        "https://localmart-frontend.fly.dev",
        "https://demo.localmart.nyc",

        # Production
        "https://localmart-frontend-prod.fly.dev",
        "https://localmart.nyc"
    ],
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
        # Get the payment method within the user's auth context
        with user_auth_context(request.get('token')) as user:
            payment_method = pb_service.get_one('payment_methods', request['payment_method_id'])
            if not payment_method:
                raise HTTPException(status_code=400, detail="Invalid payment method")

            # Get the customer
            customers = pb_service.get_list(
                'stripe_customers',
                query_params={"filter": f'user = "{request["user_id"]}"'}
            )
            if not customers.items:
                raise HTTPException(status_code=400, detail="No Stripe customer found")
            
            stripe_customer_id = customers.items[0].stripe_customer_id

            # Create a payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=int(request['total_amount'] * 100),  # Convert to cents
                currency='usd',
                customer=stripe_customer_id,
                payment_method=payment_method.stripe_payment_method_id,
                off_session=True,
                confirm=True,
            )

            # Create the order in PocketBase with simplified fields
            order = pb_service.create('orders', {
                'user': request['user_id'],
                'store': request['store_id'],
                'status': 'pending',  # Initial status
                'payment_status': 'pending',  # Initial payment status
                'payment_method': payment_method.id,  # Link to payment method
                'stripe_payment_intent_id': payment_intent.id,
                'subtotal_amount': request['subtotal_amount'],
                'tax_amount': request['tax_amount'],
                'delivery_fee': request['delivery_fee'],
                'total_amount': request['total_amount'],
                'delivery_address': {
                    **request['delivery_address'],
                    'customer_name': f"{user.first_name} {user.last_name}".strip(),
                    'customer_phone': getattr(user, 'phone_number', None),
                    'latitude': request['delivery_address'].get('latitude', getattr(user, 'latitude', None)),
                    'longitude': request['delivery_address'].get('longitude', getattr(user, 'longitude', None))
                },
                'customer_notes': request.get('customer_notes', ''),
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
                'payment_intent_client_secret': payment_intent.client_secret,
                'message': 'Order created successfully'
            }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating order: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create order: {str(e)}"
        )

@app.get("/api/v0/orders", response_model=List[Dict])
async def get_all_orders(request: Request):
    """Get all orders (admin only)"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)

    # Verify user is admin
    user = pb_service.get_user_from_token(token)
    if not 'admin' in (getattr(user, 'roles', []) or []):
        raise HTTPException(status_code=403, detail="Admin access required")

    with user_auth_context(token):
        # Get all orders
        orders = pb_service.get_list(
            'orders',
            query_params={
                "sort": "-created",
                "expand": "order_items_via_order.store_item,order_items_via_order.store_item.store"
            }
        )

        # Format orders for response
        formatted_orders = []
        for order in orders.items:
            # Group items by store
            stores_dict = {}

            # Get all order items for this order
            order_items = order.expand.get('order_items_via_order', [])

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
                            'name': store.name,
                            'latitude': getattr(store, 'latitude', None),
                            'longitude': getattr(store, 'longitude', None)
                        },
                        'items': []
                    }

                stores_dict[store_id]['items'].append({
                    'id': item.id,
                    'name': store_item.name,
                    'quantity': item.quantity,
                    'price': item.price_at_time
                })

            delivery_address = order.delivery_address if hasattr(order, 'delivery_address') else None

            formatted_order = {
                'id': order.id,
                'created': order.created,
                'status': order.status,
                'payment_status': order.payment_status,
                'delivery_fee': order.delivery_fee,
                'total_amount': order.total_amount,
                'tax_amount': order.tax_amount,
                'delivery_address': delivery_address,
                'stores': list(stores_dict.values())
            }
            formatted_orders.append(formatted_order)

        return formatted_orders

@app.get("/api/v0/user/orders", response_model=List[Dict])
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
                "expand": "order_items_via_order.store_item,order_items_via_order.store_item.store"
            }
        )

        # Format orders for response
        formatted_orders = []
        for order in orders.items:
            # Group items by store
            stores_dict = {}

            # Get all order items for this order
            order_items = order.expand.get('order_items_via_order', [])

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
                            'name': store.name,
                            'latitude': getattr(store, 'latitude', None),
                            'longitude': getattr(store, 'longitude', None)
                        },
                        'items': []
                    }

                stores_dict[store_id]['items'].append({
                    'id': item.id,
                    'name': store_item.name,
                    'quantity': item.quantity,
                    'price': item.price_at_time
                })

            delivery_address = order.delivery_address if hasattr(order, 'delivery_address') else None

            formatted_order = {
                'id': order.id,
                'created': order.created,
                'status': order.status,
                'payment_status': order.payment_status,
                'delivery_fee': order.delivery_fee,
                'total_amount': order.total_amount,
                'tax_amount': order.tax_amount,
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
        logger.info(f"Attempting to create user with email: {user.email}")
        # Create user record
        record = pb_service.create('users', {
            'email': user.email,
            'password': user.password,
            'passwordConfirm': user.passwordConfirm,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.email,  # Use email as username since PocketBase requires it
        })
        logger.info("User record created successfully")

        # After creation, authenticate to get the token
        logger.info("Attempting to authenticate new user")
        auth_data = pb_service.auth_with_password(
            'users',
            user.email,
            user.password
        )
        logger.info("User authenticated successfully")

        return {
            "token": auth_data.token,
            "user": {
                "id": auth_data.record.id,
                "email": auth_data.record.email,
                "first_name": auth_data.record.first_name,
                "last_name": auth_data.record.last_name,
                "roles": getattr(auth_data.record, 'roles', []),
            }
        }
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        logger.error(f"Request data: {user}")
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
                "first_name": auth_data.record.first_name,
                "last_name": auth_data.record.last_name,
                "roles": getattr(auth_data.record, 'roles', []),
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
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
                'email': user.email,
                'phone_number': getattr(user, 'phone_number', ''),
                'street_1': getattr(user, 'street_1', ''),
                'street_2': getattr(user, 'street_2', ''),
                'city': getattr(user, 'city', ''),
                'state': getattr(user, 'state', ''),
                'zip': getattr(user, 'zip', ''),
                'latitude': getattr(user, 'latitude', None),
                'longitude': getattr(user, 'longitude', None)
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
            # Check if we need to geocode the address
            should_geocode = all([
                body.get('street_1'),
                body.get('city'),
                body.get('state'),
                body.get('zip')
            ])
            
            update_data = {
                'first_name': body.get('first_name'),
                'last_name': body.get('last_name'),
                'phone_number': body.get('phone_number'),
                'street_1': body.get('street_1'),
                'street_2': body.get('street_2'),
                'city': body.get('city'),
                'state': body.get('state'),
                'zip': body.get('zip')
            }
            
            # Geocode the address if all required fields are present
            if should_geocode:
                try:
                    coordinates = geocoding_service.geocode_address(
                        street=body.get('street_1'),
                        city=body.get('city'),
                        state=body.get('state'),
                        zip_code=body.get('zip')
                    )
                    
                    if coordinates:
                        lat, lon = coordinates
                        update_data['latitude'] = lat
                        update_data['longitude'] = lon
                        logger.info(f"Geocoded address for user {user_id}: ({lat}, {lon})")
                except Exception as e:
                    logger.error(f"Error geocoding address for user {user_id}: {str(e)}")
                    # Continue with the update even if geocoding fails
            
            user = pb_service.update('users', user_id, update_data)
            
            return {
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
                'email': user.email,
                'phone_number': getattr(user, 'phone_number', ''),
                'street_1': getattr(user, 'street_1', ''),
                'street_2': getattr(user, 'street_2', ''),
                'city': getattr(user, 'city', ''),
                'state': getattr(user, 'state', ''),
                'zip': getattr(user, 'zip', ''),
                'latitude': getattr(user, 'latitude', None),
                'longitude': getattr(user, 'longitude', None)
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
    # Note: PocketBase field is 'zip' but we send as 'zip_code' to the frontend
    return {
        "id": store.id,
        "name": store.name,
        "street_1": store.street_1,
        "street_2": store.street_2,
        "city": store.city,
        "state": store.state,
        "zip_code": store.zip,  # PocketBase field is 'zip' but we send as 'zip_code'
        "latitude": getattr(store, 'latitude', None),
        "longitude": getattr(store, 'longitude', None)
    }

def serialize_store_item(item) -> Dict:
    """Enhanced serializer for store items"""
    return {
        'id': item.id,
        'name': item.name,
        'price': float(item.price),
        'description': item.description if hasattr(item, 'description') else None,
        'store': item.store
    }

@app.post("/api/v0/payment/setup-intent")
async def create_setup_intent(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token")

    try:
        # Verify the user's token
        token = authorization.split(' ')[1] if authorization.startswith('Bearer ') else authorization
        user = pb_service.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Create a SetupIntent
        setup_intent = stripe.SetupIntent.create(
            payment_method_types=['card'],
            usage='off_session',  # Allow using this payment method for future payments
        )

        return {"clientSecret": setup_intent.client_secret}

    except Exception as e:
        print(f"Error creating setup intent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create setup intent")

@app.post("/api/v0/payment/cards")
async def save_payment_method(payment_data: dict, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token")

    try:
        # Verify the user's token
        token = authorization.split(' ')[1] if authorization.startswith('Bearer ') else authorization
        user = pb_service.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        payment_method_id = payment_data.get('payment_method_id')
        if not payment_method_id:
            raise HTTPException(status_code=400, detail="Payment method ID is required")

        # Get or create Stripe Customer
        customers = pb_service.get_list(
            'stripe_customers',
            query_params={"filter": f'user = "{user.id}"'}
        )
        
        if customers.items:
            stripe_customer_id = customers.items[0].stripe_customer_id
        else:
            # Create new Stripe customer
            stripe_customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}".strip(),
                metadata={"user_id": user.id}
            )
            stripe_customer_id = stripe_customer.id
            
            # Save customer ID to PocketBase
            pb_service.create('stripe_customers', {
                "user": user.id,
                "stripe_customer_id": stripe_customer_id
            })

        # Attach payment method to customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=stripe_customer_id,
        )

        # Get payment method details from Stripe
        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)

        # Create a record in PocketBase
        card_data = {
            "user": user.id,
            "stripe_payment_method_id": payment_method_id,
            "last4": payment_method.card.last4,
            "brand": payment_method.card.brand,
            "exp_month": payment_method.card.exp_month,
            "exp_year": payment_method.card.exp_year,
            "is_default": True  # First card added will be default
        }

        # If this is the default card, update other cards to not be default
        if card_data["is_default"]:
            existing_cards = pb_service.pb.collection('payment_methods').get_list(
                1, 50, 
                {"filter": f'user = "{user.id}" && is_default = true'}
            )
            for card in existing_cards.items:
                pb_service.pb.collection('payment_methods').update(card.id, {"is_default": False})

        # Save the card to PocketBase
        pb_service.pb.collection('payment_methods').create(card_data)

        return {"status": "success"}

    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error saving payment method: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save payment method")

@app.get("/api/v0/payment/cards")
async def get_payment_methods(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token")

    try:
        # Verify the user's token
        token = authorization.split(' ')[1] if authorization.startswith('Bearer ') else authorization
        user = pb_service.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get cards from PocketBase
        cards = pb_service.pb.collection('payment_methods').get_list(
            1, 50,
            {"filter": f'user = "{user.id}"'}
        )

        return cards.items

    except Exception as e:
        print(f"Error fetching payment methods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment methods")

@app.delete("/api/v0/payment/cards/{card_id}")
async def delete_payment_method(card_id: str, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token")

    try:
        # Verify the user's token
        token = authorization.split(' ')[1] if authorization.startswith('Bearer ') else authorization
        user = pb_service.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get the card from PocketBase
        card = pb_service.pb.collection('payment_methods').get_one(card_id)
        if not card or card.user != user.id:
            raise HTTPException(status_code=404, detail="Card not found")

        # Delete the payment method from Stripe
        stripe.PaymentMethod.detach(card.stripe_payment_method_id)

        # Delete the card from PocketBase
        pb_service.pb.collection('payment_methods').delete(card_id)

        return {"status": "success"}

    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error deleting payment method: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete payment method")

@app.post("/api/v0/webhooks/stripe")
async def stripe_webhook(request: Request):
    # Get the webhook payload
    payload = await request.body()
    
    # In development (when using stripe-cli), we skip signature verification
    # In production, we verify the signature
    if STRIPE_WEBHOOK_SECRET:
        # Get the Stripe signature from headers
        sig_header = request.headers.get('stripe-signature')
        try:
            # Verify the webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Development mode - parse the payload without verification
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Handle specific event types
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # Update order payment status to succeeded
        try:
            logger.info(f"Processing payment_intent.succeeded for intent {payment_intent['id']}")
            orders = pb_service.get_list(
                'orders',
                query_params={
                    "filter": f'stripe_payment_intent_id = "{payment_intent["id"]}"'
                }
            )
            if orders.items:
                order = orders.items[0]
                pb_service.update('orders', order.id, {
                    'payment_status': 'succeeded'
                })
                logger.info(f"Updated order {order.id} payment status to succeeded")
            else:
                logger.warning(f"No order found for payment intent {payment_intent['id']}")
        except Exception as e:
            logger.error(f"Error updating order payment status: {str(e)}")
            logger.error("Full payment intent object:")
            logger.error(json.dumps(payment_intent, indent=2))

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        # Update order payment status to failed
        try:
            logger.info(f"Processing payment_intent.payment_failed for intent {payment_intent['id']}")
            orders = pb_service.get_list(
                'orders',
                query_params={
                    "filter": f'stripe_payment_intent_id = "{payment_intent["id"]}"'
                }
            )
            if orders.items:
                order = orders.items[0]
                pb_service.update('orders', order.id, {
                    'payment_status': 'failed'
                })
                logger.info(f"Updated order {order.id} payment status to failed")
            else:
                logger.warning(f"No order found for payment intent {payment_intent['id']}")
        except Exception as e:
            logger.error(f"Error updating order payment status: {str(e)}")
            logger.error("Full payment intent object:")
            logger.error(json.dumps(payment_intent, indent=2))

    return {"status": "success"}

@app.get("/api/v0/stores/{store_id}/roles", response_model=Dict)
async def get_store_roles(store_id: str, request: Request):
    """Get the current user's roles for a specific store"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    with user_auth_context(token):
        try:
            # Check if user is a global admin first
            user = pb_service.get_user_from_token(token)
            if 'admin' in (getattr(user, 'roles', []) or []):
                return {"roles": ["admin"]}

            # Get store roles for this user and store
            store_roles = pb_service.get_list(
                'store_roles',
                query_params={
                    "filter": f'user = "{user_id}" && store = "{store_id}"',
                    "expand": "role"
                }
            )
            
            roles = [sr.role for sr in store_roles.items]
            return {"roles": roles}
        except Exception as e:
            logger.error(f"Error fetching store roles: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch store roles: {str(e)}"
            )

@app.get("/api/v0/stores/{store_id}/orders", response_model=List[Dict])
async def get_store_orders(store_id: str, request: Request):
    """Get orders for a specific store (requires store admin role)"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    with user_auth_context(token):
        try:
            # Check if user is a global admin or store admin
            user = pb_service.get_user_from_token(token)
            is_global_admin = 'admin' in (getattr(user, 'roles', []) or [])
            
            if not is_global_admin:
                # Check store roles
                store_roles = pb_service.get_list(
                    'store_roles',
                    query_params={
                        "filter": f'user = "{user_id}" && store = "{store_id}" && role = "admin"'
                    }
                )
                
                if not store_roles.items:
                    raise HTTPException(
                        status_code=403,
                        detail="You don't have permission to view this store's orders"
                    )

            # Get all orders with expanded order items and store items
            orders = pb_service.get_list(
                'orders',
                query_params={
                    "sort": "-created",
                    "expand": "order_items_via_order.store_item,order_items_via_order.store_item.store",
                    "filter": f'order_items_via_order.store_item.store = "{store_id}"'
                }
            )

            # Format orders for response
            formatted_orders = []
            for order in orders.items:
                stores_dict = {}
                order_items = order.expand.get('order_items_via_order', [])

                # Process items for this store
                for item in order_items:
                    if not hasattr(item, 'expand') or not item.expand.get('store_item'):
                        continue

                    store_item = item.expand['store_item']
                    if not hasattr(store_item, 'expand') or not store_item.expand.get('store'):
                        continue

                    store = store_item.expand['store']
                    store_id_key = store.id
                    if store_id_key not in stores_dict:
                        stores_dict[store_id_key] = {
                            'store': {
                                'id': store.id,
                                'name': store.name,
                                'latitude': getattr(store, 'latitude', None),
                                'longitude': getattr(store, 'longitude', None)
                            },
                            'items': []
                        }

                    stores_dict[store_id_key]['items'].append({
                        'id': item.id,
                        'name': store_item.name,
                        'quantity': item.quantity,
                        'price': item.price_at_time
                    })

                delivery_address = order.delivery_address if hasattr(order, 'delivery_address') else None

                formatted_order = {
                    'id': order.id,
                    'created': order.created,
                    'status': order.status,
                    'payment_status': order.payment_status,
                    'delivery_fee': order.delivery_fee,
                    'total_amount': order.total_amount,
                    'tax_amount': order.tax_amount,
                    'delivery_address': delivery_address,
                    'stores': list(stores_dict.values())
                }
                formatted_orders.append(formatted_order)

            return formatted_orders
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching store orders: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch store orders: {str(e)}"
            )

@app.post("/api/v0/stores/{store_id}/items", response_model=Dict)
async def create_store_item(store_id: str, item: StoreItem, request: Request):
    try:
        token = get_token_from_request(request)
        with user_auth_context(token) as user:
            # Check if user has admin role for the store or is a global admin
            if not 'admin' in user.roles:
                store_roles = pb_service.pb.collection('store_roles').get_list(
                    1, 1, 
                    query_params={
                        "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
                    }
                )
                if not store_roles.items:
                    raise HTTPException(status_code=403, detail="Not authorized to manage store items")

            # Create the item
            new_item = pb_service.pb.collection('store_items').create({
                'name': item.name,
                'price': item.price,
                'description': item.description,
                'store': store_id
            })

            return serialize_store_item(new_item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/v0/stores/{store_id}/items/{item_id}", response_model=Dict)
async def update_store_item(store_id: str, item_id: str, item: StoreItem, request: Request):
    token = get_token_from_request(request)
    with user_auth_context(token) as user:
        # Check if user has admin role for the store or is a global admin
        if not 'admin' in user.roles:
            store_roles = pb_service.pb.collection('store_roles').get_list(
                1, 1, 
                query_params={
                    "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
                }
            )
            if not store_roles.items:
                raise HTTPException(status_code=403, detail="Not authorized to manage store items")

        # Verify item belongs to store
        existing_item = pb_service.pb.collection('store_items').get_one(item_id)
        if existing_item.store != store_id:
            raise HTTPException(status_code=404, detail="Item not found in store")

        # Update the item
        updated_item = pb_service.pb.collection('store_items').update(item_id, {
            'name': item.name,
            'price': item.price,
            'description': item.description
        })

        return serialize_store_item(updated_item)

@app.delete("/api/v0/stores/{store_id}/items/{item_id}")
async def delete_store_item(store_id: str, item_id: str, request: Request):
    try:
        token = get_token_from_request(request)
        with user_auth_context(token) as user:
            # Check if user has admin role for the store or is a global admin
            if not 'admin' in user.roles:
                store_roles = pb_service.pb.collection('store_roles').get_list(
                    1, 1, 
                    query_params={
                        "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
                    }
                )
                if not store_roles.items:
                    raise HTTPException(status_code=403, detail="Not authorized to manage store items")

            # Verify item belongs to store
            existing_item = pb_service.pb.collection('store_items').get_one(item_id)
            if existing_item.store != store_id:
                raise HTTPException(status_code=404, detail="Item not found in store")

            # Delete the item
            pb_service.pb.collection('store_items').delete(item_id)
            return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v0/stores/{store_id}/geocode", response_model=Dict)
async def geocode_store_address(store_id: str, request: Request):
    """Geocode a store's address and update the store record"""
    token = get_token_from_request(request)
    
    with user_auth_context(token) as user:
        # Check if user has admin role for the store or is a global admin
        if not 'admin' in user.roles:
            store_roles = pb_service.pb.collection('store_roles').get_list(
                1, 1, 
                query_params={
                    "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
                }
            )
            if not store_roles.items:
                raise HTTPException(status_code=403, detail="Not authorized to manage this store")
        
        try:
            # Get the store
            store = pb_service.get_one('stores', store_id)
            
            # Check if we have all the required address fields
            if not all([
                getattr(store, 'street_1', None),
                getattr(store, 'city', None),
                getattr(store, 'state', None),
                getattr(store, 'zip', None)  # PocketBase field is 'zip'
            ]):
                raise HTTPException(
                    status_code=400, 
                    detail="Store address is incomplete. Please update the store address first."
                )
            
            # Geocode the address
            coordinates = geocoding_service.geocode_address(
                street=getattr(store, 'street_1', ''),
                city=getattr(store, 'city', ''),
                state=getattr(store, 'state', ''),
                zip_code=getattr(store, 'zip', '')
            )
            
            if not coordinates:
                raise HTTPException(
                    status_code=400,
                    detail="Could not geocode the store address. Please check the address and try again."
                )
            
            # Update the store with the coordinates
            lat, lon = coordinates
            updated_store = pb_service.update('stores', store_id, {
                'latitude': lat,
                'longitude': lon
            })
            
            return {
                'id': updated_store.id,
                'name': updated_store.name,
                'latitude': getattr(updated_store, 'latitude', None),
                'longitude': getattr(updated_store, 'longitude', None),
                'message': 'Store coordinates updated successfully'
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error geocoding store address: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to geocode store address: {str(e)}"
            )