"""Order-related routes for the LocalMart API."""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, List, Set
import datetime
import logging
import stripe

from ..pocketbase import create_client as pb, create_admin_client as pb_admin
from ..api.models import DeliveryQuoteRequest
from ..uber_direct import UberDirectClient
from ..config import Config
from ..api.utils import get_token_from_request, decode_jwt

# Initialize Uber Direct client
UBER_CUSTOMER_ID = Config.UBER_CUSTOMER_ID
UBER_CLIENT_ID = Config.UBER_CLIENT_ID
UBER_CLIENT_SECRET = Config.UBER_CLIENT_SECRET
uber_client = UberDirectClient(
    customer_id=UBER_CUSTOMER_ID,
    client_id=UBER_CLIENT_ID,
    client_secret=UBER_CLIENT_SECRET
)

# Track active deliveries
active_deliveries: Set[str] = set()

router = APIRouter(tags=["orders"])
logger = logging.getLogger(__name__)

@router.post("/api/v0/delivery/quote", response_model=Dict)
async def get_delivery_quote(request: DeliveryQuoteRequest):
    """Get a delivery quote from Uber Direct"""
    try:
        # Get store details
        store = pb().get_one('stores', request.store_id)

        # Get item details
        item = pb().get_one('store_items', request.item_id)
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get delivery quote: {str(e)}"
        )

@router.post("/api/v0/orders", response_model=Dict)
async def create_order(request: Dict, req: Request):
    """Create a new order with basic status tracking"""
    token = request.get('token')
    user = pb(token).get_user_from_token(token)

    try:
        # Get the payment method within the user's auth context
        payment_method = pb(token).get_one('payment_methods', request['payment_method_id'])
        if not payment_method:
            raise HTTPException(status_code=400, detail="Invalid payment method")

        # Get the customer
        customers = pb(token).get_list(
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
        order = pb(token).create('orders', {
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
            pb(token).create('order_items', {
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

@router.get("/api/v0/orders", response_model=List[Dict])
async def get_all_orders(request: Request):
    """Get all orders (admin only)"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)

    # Verify user is admin
    user = pb(token).get_user_from_token(token)
    if not 'admin' in (getattr(user, 'roles', []) or []):
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get all orders
    orders = pb(token).get_list(
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

@router.get("/api/v0/user/orders", response_model=List[Dict])
async def get_user_orders(request: Request):
    """Get orders for the authenticated user"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    # Get user's orders
    orders = pb(token).get_list(
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

@router.patch("/api/v0/orders/{order_id}/status", response_model=Dict)
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

    try:
        data = {
            'status': status,
            'updated': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        order = pb(token).update('orders', order_id, data)
        
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

@router.get("/api/v0/stores/{store_id}/orders", response_model=List[Dict])
async def get_store_orders(store_id: str, request: Request):
    """Get orders for a specific store (requires store admin role)"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    try:
        # Check if user is a global admin or store admin
        user = pb(token).get_user_from_token(token)
        is_global_admin = 'admin' in (getattr(user, 'roles', []) or [])
        
        if not is_global_admin:
            # Check store roles
            store_roles = pb(token).get_list(
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
        orders = pb(token).get_list(
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