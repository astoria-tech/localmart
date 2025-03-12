"""Payment-related routes for the LocalMart API."""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Dict, List
import stripe
import json
import logging

from ..pocketbase import create_client as pb, create_admin_client as pb_admin
from ..api.utils import get_token_from_request
from ..config import Config

# Initialize logging
logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = Config.STRIPE_SECRET_KEY

# Initialize Stripe webhook secret
STRIPE_WEBHOOK_SECRET = Config.STRIPE_WEBHOOK_SECRET

router = APIRouter(tags=["payment"])

@router.post("/api/v0/payment/setup-intent")
async def create_setup_intent(request: Request):
    """Create a setup intent for saving a payment method."""
    try:
        token = get_token_from_request(request)
        client = pb(token)
        
        user = client.get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = user.id
        
        # Create a setup intent
        setup_intent = stripe.SetupIntent.create(
            usage="off_session",
            metadata={"user_id": user_id}
        )
        
        return {
            "client_secret": setup_intent.client_secret
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v0/payment/cards")
async def save_payment_method(payment_data: dict, request: Request):
    """Save a payment method for a user."""
    try:
        token = get_token_from_request(request)
        user = pb().get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        payment_method_id = payment_data.get('payment_method_id')
        if not payment_method_id:
            raise HTTPException(status_code=400, detail="Payment method ID is required")

        # Get or create Stripe Customer
        customers = pb(token).get_list(
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
            pb_admin().create('stripe_customers', {
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
            existing_cards = pb(token).get_list(
                'payment_methods',
                1, 50, 
                {"filter": f'user = "{user.id}" && is_default = true'}
            )
            for card in existing_cards.items:
                pb(token).update('payment_methods', card.id, {"is_default": False})

        # Save the card to PocketBase
        pb(token).create('payment_methods', card_data)

        return {"status": "success"}

    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error saving payment method: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save payment method")

@router.get("/api/v0/payment/cards")
async def get_payment_methods(request: Request):
    """Get payment methods for a user."""
    try:
        token = get_token_from_request(request)
        user = pb(token).get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get cards from PocketBase
        cards = pb(token).get_list(
            'payment_methods',
            1, 50,
            {"filter": f'user = "{user.id}"'}
        )

        return cards.items

    except Exception as e:
        print(f"Error fetching payment methods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment methods")

@router.delete("/api/v0/payment/cards/{card_id}")
async def delete_payment_method(card_id: str, request: Request):
    """Delete a payment method for a user."""
    try:
        token = get_token_from_request(request)
        user = pb(token).get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get the card from PocketBase
        card = pb(token).get_one('payment_methods', card_id)
        if not card or card.user != user.id:
            raise HTTPException(status_code=404, detail="Card not found")

        # Delete the payment method from Stripe
        stripe.PaymentMethod.detach(card.stripe_payment_method_id)

        # Delete the card from PocketBase
        pb(token).delete('payment_methods', card_id)

        return {"status": "success"}

    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error deleting payment method: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete payment method")

@router.post("/api/v0/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
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
            orders = pb_admin().get_list(
                'orders',
                query_params={
                    "filter": f'stripe_payment_intent_id = "{payment_intent["id"]}"'
                }
            )
            if orders.items:
                order = orders.items[0]

                print("Updating order payment status to succeeded:")
                print(order)

                pb_admin().update('orders', order.id, {
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
            orders = pb_admin().get_list(
                'orders',
                query_params={
                    "filter": f'stripe_payment_intent_id = "{payment_intent["id"]}"'
                }
            )
            if orders.items:
                order = orders.items[0]
                pb_admin().update('orders', order.id, {
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