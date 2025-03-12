"""Utility functions for the API routes."""

from fastapi import HTTPException, Request
from typing import Dict
import base64
import json

def get_token_from_request(request: Request) -> str:
    """Extract and validate the auth token from a request"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    return auth_header.split(' ')[1]

def decode_jwt(token):
    """Decode a JWT token into its parts."""
    # Split the token into parts
    parts = token.split('.')
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    # Decode the payload (middle part)
    try:
        # Add padding if needed
        payload = parts[1]
        padding = len(payload) % 4
        if padding:
            payload += '=' * (4 - padding)
        
        decoded = base64.b64decode(payload).decode('utf-8')
        return json.loads(decoded)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to decode token: {str(e)}")

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