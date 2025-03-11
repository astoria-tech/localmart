import logging
import requests
from typing import Dict, Optional, Tuple
import time
import os
from .config import Config

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for geocoding addresses using Google Maps Geocoding API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the geocoding service
        
        Args:
            api_key: Google Maps API key. If not provided, will try to get from config or environment variable.
        """
        self.api_key = api_key or Config.GOOGLE_MAPS_API_KEY or os.environ.get('GOOGLE_MAPS_API_KEY')
        if not self.api_key:
            logger.warning("No Google Maps API key provided. Geocoding will not work.")
        
        self.base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        # Google Maps API has rate limits, but they're much higher than Nominatim
        # Still, let's add a small delay between requests to be safe
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < 0.2:  # 5 requests per second should be safe
            time.sleep(0.2 - time_since_last_request)
        
        self.last_request_time = time.time()
    
    def geocode_address(self, 
                        street: str, 
                        city: str, 
                        state: str, 
                        zip_code: str, 
                        country: str = "USA") -> Optional[Tuple[float, float]]:
        """
        Geocode an address to get latitude and longitude using Google Maps API
        
        Args:
            street: Street address
            city: City
            state: State
            zip_code: ZIP code
            country: Country (default: USA)
            
        Returns:
            Tuple of (latitude, longitude) if successful, None otherwise
        """
        if not self.api_key:
            logger.error("Cannot geocode: No Google Maps API key provided")
            return None
            
        # Format the address for the API
        address = f"{street}, {city}, {state} {zip_code}, {country}"
        
        # Apply rate limiting
        self._rate_limit()
        
        try:
            # Make the request to Google Maps Geocoding API
            response = requests.get(
                self.base_url,
                params={
                    "address": address,
                    "key": self.api_key
                }
            )
            
            # Check if the request was successful
            if response.status_code != 200:
                logger.error(f"Geocoding request failed with status code {response.status_code}")
                return None
            
            # Parse the response
            result = response.json()
            
            # Check if we got any results and the status is OK
            if result['status'] != 'OK' or not result.get('results'):
                logger.warning(f"No geocoding results found for address: {address}. Status: {result['status']}")
                return None
            
            # Extract the latitude and longitude
            location = result['results'][0]['geometry']['location']
            lat = float(location['lat'])
            lng = float(location['lng'])
            
            return (lat, lng)
            
        except Exception as e:
            logger.error(f"Error geocoding address: {str(e)}")
            return None 