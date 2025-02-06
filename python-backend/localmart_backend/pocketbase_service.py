import logging
from typing import Dict, List, Any, Optional
from pocketbase import PocketBase

logger = logging.getLogger(__name__)

class PocketBaseService:
    def __init__(self, url: str = 'http://pocketbase:8090'):
        self.url = url
        self.client = PocketBase(url)

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