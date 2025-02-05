import os
import json
import httpx
import logging
import datetime
from typing import Dict, List

logger = logging.getLogger(__name__)

class UberDirectClient:
    """Client for interacting with the Uber Direct API"""
    
    def __init__(self, customer_id: str, client_id: str, client_secret: str):
        self.customer_id = customer_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = "https://api.uber.com/v1"
        self.auth_url = "https://auth.uber.com/oauth/v2/token"

    async def _get_access_token(self) -> str:
        """Get OAuth access token from Uber"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.auth_url,
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'grant_type': 'client_credentials',
                    'scope': 'eats.deliveries'
                }
            )
            data = response.json()
            return data['access_token']

    async def get_delivery_quote(
        self,
        pickup_address: Dict,
        dropoff_address: Dict,
        pickup_ready: datetime.datetime,
        pickup_deadline: datetime.datetime,
        dropoff_ready: datetime.datetime,
        dropoff_deadline: datetime.datetime,
        item_price_cents: int
    ) -> Dict:
        """Get a delivery quote from Uber Direct"""
        access_token = await self._get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f'{self.base_url}/customers/{self.customer_id}/delivery_quotes',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                },
                json={
                    "pickup_address": json.dumps(pickup_address),
                    "dropoff_address": json.dumps(dropoff_address),
                    "pickup_ready_dt": pickup_ready.isoformat(),
                    "pickup_deadline_dt": pickup_deadline.isoformat(),
                    "dropoff_ready_dt": dropoff_ready.isoformat(),
                    "dropoff_deadline_dt": dropoff_deadline.isoformat(),
                    "manifest_total_value": item_price_cents,
                    "pickup_phone_number": "+15555555555",
                    "dropoff_phone_number": "+15555555555"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Uber API error: {response.text}")
                raise Exception("Failed to get delivery quote from Uber")
            
            return response.json()

    async def create_delivery(
        self,
        pickup_address: Dict,
        dropoff_address: Dict,
        pickup_ready: str,
        pickup_deadline: str,
        dropoff_ready: str,
        dropoff_deadline: str,
        total_amount: float,
        manifest_items: List[Dict]
    ) -> Dict:
        """Create a new delivery in Uber Direct"""
        access_token = await self._get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f'{self.base_url}/customers/{self.customer_id}/deliveries',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                },
                json={
                    'pickup_address': json.dumps(pickup_address),
                    'dropoff_address': json.dumps(dropoff_address),
                    'pickup_ready_dt': pickup_ready,
                    'pickup_deadline_dt': pickup_deadline,
                    'dropoff_ready_dt': dropoff_ready,
                    'dropoff_deadline_dt': dropoff_deadline,
                    'manifest_total_value': int(total_amount * 100),
                    'pickup_phone_number': '+15555555555',
                    'dropoff_phone_number': '+15555555555',
                    'manifest_items': manifest_items
                }
            )

            if response.status_code != 200:
                logger.error(f"Uber API error: {response.text}")
                raise Exception(f"Failed to create Uber delivery: {response.text}")
            
            return response.json()

    async def get_delivery_status(self, delivery_id: str) -> Dict:
        """Get the status of a delivery from Uber Direct"""
        access_token = await self._get_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f'{self.base_url}/customers/{self.customer_id}/deliveries/{delivery_id}',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if response.status_code != 200:
                logger.error(f"Uber API error: {response.text}")
                raise Exception("Failed to get delivery status from Uber")
            
            return response.json() 