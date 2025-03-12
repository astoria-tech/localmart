"""Collection of all API routes for the LocalMart backend."""

from fastapi import APIRouter

from .auth import router as auth_router, user_router
from .stores import router as stores_router
from .orders import router as orders_router
from .payment import router as payment_router

# Create a main router that includes all other routers
router = APIRouter()

# Include all routers
router.include_router(auth_router)
router.include_router(user_router)
router.include_router(stores_router)
router.include_router(orders_router)
router.include_router(payment_router) 