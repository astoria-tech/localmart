"""Pydantic models for the API routes."""

from typing import Dict, Optional
from pydantic import BaseModel

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