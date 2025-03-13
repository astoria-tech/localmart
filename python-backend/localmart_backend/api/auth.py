"""Authentication routes for the LocalMart API."""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Dict
import logging

from ..pocketbase import create_client as pb
from ..api.models import UserLogin, UserSignup
from ..api.utils import get_token_from_request, decode_jwt
from ..geocoding import GeocodingService
from ..api.serializers import serialize_auth_response, serialize_user_profile

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

        return serialize_auth_response(auth_data)
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

        return serialize_auth_response(auth_data)
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
        return serialize_user_profile(user)
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
                    update_data['latitude'] = coordinates['lat']
                    update_data['longitude'] = coordinates['lng']
            except Exception as e:
                logger.error(f"Geocoding error: {str(e)}")
                # Continue without coordinates if geocoding fails
        
        # Remove None values from update_data
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        # Update the user record
        updated_user = pb(token).update('users', user_id, update_data)

        # Return the updated profile
        return serialize_user_profile(updated_user)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user profile: {str(e)}"
        )