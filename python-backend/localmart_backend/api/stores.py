"""Store-related routes for the LocalMart API."""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, List

from ..pocketbase import create_client as pb
from ..api.models import StoreItem
from ..api.utils import get_token_from_request, decode_jwt
from ..api.serializers import serialize_store, serialize_store_item
from ..geocoding import GeocodingService

# Initialize geocoding service
geocoding_service = GeocodingService()

router = APIRouter(tags=["stores"])

@router.get("/api/v0/stores", response_model=List[Dict])
async def list_stores(request: Request = None):
    """List all stores"""
    try:
        # Check if request has authorization header
        is_admin = False
        if request and request.headers.get('authorization'):
            try:
                token = get_token_from_request(request)
                user = pb().get_user_from_token(token)
                is_admin = 'admin' in (getattr(user, 'roles', []) or [])
            except Exception:
                # If token validation fails, continue as non-admin
                pass
        
        # Get all records from the stores collection
        stores = pb().get_list('stores', 1, 50)

        # Convert Record objects to simplified dictionaries
        return [serialize_store(store) for store in stores.items]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Issue fetching stores"
        )

@router.get("/api/v0/stores/{store_id}", response_model=Dict)
async def get_store(store_id: str):
    """Get a single store by ID"""
    try:
        # Get the store record
        store = pb().get_one('stores', store_id)
        return serialize_store(store)
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Store not found: {str(e)}"
        )

@router.get("/api/v0/stores/{store_id}/items", response_model=List[Dict])
async def list_store_items(store_id: str):
    """List all items for a specific store"""
    try:
        # Get all records from the store_items collection for this store
        items = pb().get_list(
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

@router.post("/api/v0/stores/{store_id}/items", response_model=Dict)
async def create_store_item(store_id: str, item: StoreItem, request: Request):
    try:
        token = get_token_from_request(request)
        user = pb().get_user_from_token(token)

        # Check if user has admin role for the store or is a global admin
        if not 'admin' in user.roles:
            store_roles = pb(token).get_list(
                'store_roles',
                1, 1, 
                query_params={
                    "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
                }
            )
            if not store_roles.items:
                raise HTTPException(status_code=403, detail="Not authorized to manage store items")

        # Create the item
        new_item = pb(token).create('store_items', {
            'name': item.name,
            'price': item.price,
            'description': item.description,
            'store': store_id
        })

        return serialize_store_item(new_item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/api/v0/stores/{store_id}/items/{item_id}", response_model=Dict)
async def update_store_item(store_id: str, item_id: str, item: StoreItem, request: Request):
    token = get_token_from_request(request)

    # Check if user has admin role for the store or is a global admin
    user = pb(token).get_user_from_token(token)

    if not 'admin' in user.roles:
        store_roles = pb(token).get_list(
            'store_roles',
            1, 1, 
            query_params={
                "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
            }
        )
        if not store_roles.items:
            raise HTTPException(status_code=403, detail="Not authorized to manage store items")

    # Verify item belongs to store
    existing_item = pb(token).get_one('store_items', item_id)
    if existing_item.store != store_id:
        raise HTTPException(status_code=404, detail="Item not found in store")

    # Update the item
    updated_item = pb(token).update('store_items', item_id, {
        'name': item.name,
        'price': item.price,
        'description': item.description
    })

    return serialize_store_item(updated_item)

@router.delete("/api/v0/stores/{store_id}/items/{item_id}")
async def delete_store_item(store_id: str, item_id: str, request: Request):
    try:
        token = get_token_from_request(request)
        user = pb(token).get_user_from_token(token)

        # Check if user has admin role for the store or is a global admin
        if not 'admin' in user.roles:
            store_roles = pb(token).get_list(
                'store_roles',
                1, 1, 
                query_params={
                    "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
                }
            )
            if not store_roles.items:
                raise HTTPException(status_code=403, detail="Not authorized to manage store items")

        # Verify item belongs to store
        existing_item = pb(token).get_one('store_items', item_id)
        if existing_item.store != store_id:
            raise HTTPException(status_code=404, detail="Item not found in store")

        # Delete the item
        pb(token).delete('store_items', item_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/v0/stores/{store_id}/roles", response_model=Dict)
async def get_store_roles(store_id: str, request: Request):
    """Get the current user's roles for a specific store"""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    try:
        # Check if user is a global admin first
        user = pb(token).get_user_from_token(token)
        if 'admin' in (getattr(user, 'roles', []) or []):
            return {"roles": ["admin"]}

        # Get store roles for this user and store
        store_roles = pb(token).get_list(
            'store_roles',
            query_params={
                "filter": f'user = "{user_id}" && store = "{store_id}"',
                "expand": "role"
            }
        )
        
        roles = [sr.role for sr in store_roles.items]
        return {"roles": roles}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch store roles: {str(e)}"
        )

@router.post("/api/v0/stores/{store_id}/geocode", response_model=Dict)
async def geocode_store_address(store_id: str, request: Request):
    """Geocode a store's address and update the store record"""
    token = get_token_from_request(request)
    user = pb(token).get_user_from_token(token)
    
    # Check if user has admin role for the store or is a global admin
    if not 'admin' in user.roles:
        store_roles = pb(token).get_list(
            'store_roles',
            1, 1, 
            query_params={
                "filter": f'user="{user.id}" && store="{store_id}" && role="admin"'
            }
        )
        if not store_roles.items:
            raise HTTPException(status_code=403, detail="Not authorized to manage this store")
    
    try:
        # Get the store
        store = pb(token).get_one('stores', store_id)
        
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
        updated_store = pb(token).update('stores', store_id, {
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to geocode store address: {str(e)}"
        )