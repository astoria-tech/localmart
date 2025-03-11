import logging
import base64
import json
from typing import Dict, List, Any, Optional
from pocketbase import PocketBase
from .config import Config

logger = logging.getLogger(__name__)

class PocketBaseService:
    def __init__(self, url: str = Config.POCKETBASE_URL):
        self.url = url
        self.client = PocketBase(url)
        self.pb = self.client  # Alias for compatibility

    def set_token(self, token: str) -> None:
        """Set the auth token for subsequent requests"""
        self.client.auth_store.save(token, None)

    def clear_token(self) -> None:
        """Clear the auth token"""
        self.client.auth_store.clear()

    def get_list(
        self,
        collection: str,
        page: int = 1,
        per_page: int = 50,
        query_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get a list of records from a collection"""
        try:
            result = self.client.collection(collection).get_list(
                page,
                per_page,
                query_params=query_params or {}
            )
            return result
        except Exception as e:
            logger.error(f"Error fetching records from {collection}: {str(e)}")
            raise

    def get_one(
        self,
        collection: str,
        record_id: str,
        query_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get a single record from a collection"""
        try:
            result = self.client.collection(collection).get_one(
                record_id,
                query_params=query_params or {}
            )
            return result
        except Exception as e:
            logger.error(f"Error fetching record {record_id} from {collection}: {str(e)}")
            raise

    def create(
        self,
        collection: str,
        data: Dict[str, Any],
        query_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a record in a collection"""
        try:
            result = self.client.collection(collection).create(
                data,
                query_params=query_params or {}
            )
            return result
        except Exception as e:
            logger.error(f"Error creating record in {collection}: {str(e)}")
            raise

    def update(
        self,
        collection: str,
        record_id: str,
        data: Dict[str, Any],
        query_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update a record in a collection"""
        try:
            result = self.client.collection(collection).update(
                record_id,
                data,
                query_params=query_params or {}
            )
            return result
        except Exception as e:
            logger.error(f"Error updating record {record_id} in {collection}: {str(e)}")
            raise

    def delete(
        self,
        collection: str,
        record_id: str,
        query_params: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Delete a record from a collection"""
        try:
            self.client.collection(collection).delete(
                record_id,
                query_params=query_params or {}
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting record {record_id} from {collection}: {str(e)}")
            raise

    def auth_with_password(
        self,
        collection: str,
        email: str,
        password: str
    ) -> Dict[str, Any]:
        """Authenticate a user with email and password"""
        try:
            result = self.client.collection(collection).auth_with_password(
                email,
                password
            )
            return result
        except Exception as e:
            logger.error(f"Error authenticating user {email}: {str(e)}")
            raise

    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information from a JWT token"""
        try:
            # Set the token for this request
            self.set_token(token)

            # Get the decoded token data
            parts = token.split('.')
            if len(parts) != 3:
                logger.error("Invalid JWT token format")
                return None

            # Decode the payload (second part)
            try:
                # Add padding if needed
                padding = len(parts[1]) % 4
                if padding:
                    parts[1] += '=' * (4 - padding)

                payload = base64.b64decode(parts[1])
                token_data = json.loads(payload)
            except Exception as e:
                logger.error(f"Error decoding token: {str(e)}")
                return None

            # Get user ID from token
            user_id = token_data.get('id')
            if not user_id:
                logger.error("No user ID in token")
                return None

            # Get user from database
            user = self.get_one('users', user_id)
            return user

        except Exception as e:
            logger.error(f"Error getting user from token: {str(e)}")
            self.clear_token()  # Only clear token on error
            return None

def create_client(token: Optional[str] = None):
    _pb = PocketBaseService(Config.POCKETBASE_URL)
    if token:
        _pb.set_token(token)
    return _pb

def create_admin_client():
    _pb = PocketBaseService(Config.POCKETBASE_URL)
    _pb.client.admins.auth_with_password(Config.POCKETBASE_ADMIN_EMAIL, Config.POCKETBASE_ADMIN_PASSWORD)
    print("Admin client created")
    return _pb
