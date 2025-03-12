"""Authentication routes for the LocalMart API."""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Dict
import logging

from ..pocketbase import create_client as pb
from ..api.models import UserLogin, UserSignup
from ..api.utils import get_token_from_request, decode_jwt
from ..geocoding import GeocodingService

router = APIRouter(prefix="/api/v0/auth", tags=["auth"])
geocoding_service = GeocodingService()
logger = logging.getLogger(__name__)

@router.post("/signup", response_model=Dict)
async def signup(user: UserSignup):
    """Create a new user account"""
    try:
        # Create user record
        record = pb().create('users', {
            'email': user.email,
            'password': user.password,
            'passwordConfirm': user.passwordConfirm,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.email,  # Use email as username since PocketBase requires it
        })

        # After creation, authenticate to get the token
        auth_data = pb().auth_with_password(
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
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/login", response_model=Dict)
async def login(user: UserLogin):
    """Log in an existing user"""
    try:
        auth_data = pb().auth_with_password(
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
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

# User profile routes
user_router = APIRouter(prefix="/api/v0/user", tags=["user"])

@user_router.get("/profile", response_model=Dict)
async def get_profile(request: Request):
    """Get the current user's profile."""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    try:
        user = pb(token).get_one('users', user_id)
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user profile: {str(e)}"
        )

@user_router.patch("/profile", response_model=Dict)
async def update_profile(request: Request):
    """Update the current user's profile."""
    token = get_token_from_request(request)
    decoded_token = decode_jwt(token)
    user_id = decoded_token['id']

    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request body")

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
        
        user = pb(token).update('users', user_id, update_data)
        
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