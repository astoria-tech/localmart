"""Serialization functions for API responses."""

from typing import Dict, List, Optional

def serialize_store(store) -> Dict:
    """Serialize a store object to a dictionary."""
    return {
        "id": getattr(store, "id", ""),
        "name": getattr(store, "name", ""),
        "description": getattr(store, "description", ""),
        "address": getattr(store, "address", {}),
        "hours": getattr(store, "hours", {}),
        "phone": getattr(store, "phone", ""),
        "email": getattr(store, "email", ""),
        "created": getattr(store, "created", ""),
        "updated": getattr(store, "updated", "")
    }

def serialize_store_item(item) -> Dict:
    """Serialize a store item object to a dictionary."""
    return {
        "id": getattr(item, "id", ""),
        "name": getattr(item, "name", ""),
        "price": getattr(item, "price", 0.0),
        "description": getattr(item, "description", ""),
        "created": getattr(item, "created", ""),
        "updated": getattr(item, "updated", "")
    }

def serialize_order(order) -> Dict:
    """Serialize an order object with expanded items to a dictionary."""
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
    
    return {
        'id': order.id,
        'created': order.created,
        'status': order.status,
        'payment_status': order.payment_status,
        'delivery_fee': order.delivery_fee,
        'total_amount': order.total_amount,
        'tax_amount': order.tax_amount,
        'delivery_address': delivery_address,
        'scheduled_delivery_start': getattr(order, 'scheduled_delivery_start', None),
        'scheduled_delivery_end': getattr(order, 'scheduled_delivery_end', None),
        'stores': list(stores_dict.values())
    }

def serialize_user(user) -> Dict:
    """Serialize a user object to a dictionary."""
    return {
        "id": getattr(user, "id", ""),
        "email": getattr(user, "email", ""),
        "first_name": getattr(user, "first_name", ""),
        "last_name": getattr(user, "last_name", ""),
        "roles": getattr(user, "roles", []),
    }

def serialize_user_profile(user) -> Dict:
    """Serialize a user profile object to a dictionary."""
    return {
        'first_name': getattr(user, 'first_name', ''),
        'last_name': getattr(user, 'last_name', ''),
        'email': getattr(user, 'email', ''),
        'phone_number': getattr(user, 'phone_number', ''),
        'street_1': getattr(user, 'street_1', ''),
        'street_2': getattr(user, 'street_2', ''),
        'city': getattr(user, 'city', ''),
        'state': getattr(user, 'state', ''),
        'zip': getattr(user, 'zip', ''),
        'latitude': getattr(user, 'latitude', None),
        'longitude': getattr(user, 'longitude', None)
    }

def serialize_auth_response(auth_data) -> Dict:
    """Serialize an authentication response to a dictionary."""
    return {
        "token": auth_data.token,
        "user": serialize_user(auth_data.record)
    }

def serialize_payment_method(payment_method) -> Dict:
    """Serialize a payment method object to a dictionary."""
    return {
        "id": getattr(payment_method, "id", ""),
        "user": getattr(payment_method, "user", ""),
        "stripe_payment_method_id": getattr(payment_method, "stripe_payment_method_id", ""),
        "last4": getattr(payment_method, "last4", ""),
        "brand": getattr(payment_method, "brand", ""),
        "exp_month": getattr(payment_method, "exp_month", 0),
        "exp_year": getattr(payment_method, "exp_year", 0),
        "is_default": getattr(payment_method, "is_default", False),
        "created": getattr(payment_method, "created", ""),
        "updated": getattr(payment_method, "updated", "")
    } 