from meilisearch_python_sdk import Client
import os
import logging

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        self.url = os.getenv("MEILI_URL", "http://localhost:7700")
        self.api_key = os.getenv("MEILI_MASTER_KEY", "masterKey123")
        self.client = Client(self.url, self.api_key)
        self.index_name = "lands"

    def _get_index(self):
        return self.client.index(self.index_name)

    def initialize_index(self):
        """Configure index settings (filterable attributes, sortable attributes, etc.)"""
        try:
            index = self._get_index()
            index.update_filterable_attributes([
                "status", "owner_id", "region", "price"
            ])
            index.update_sortable_attributes([
                "price", "created_at", "size_sqm"
            ])
            index.update_searchable_attributes([
                "title", "description", "location_text", "region"
            ])
            logger.info("MeiliSearch index configured successfully.")
        except Exception as e:
            logger.error(f"Failed to configure MeiliSearch index: {e}")

    def index_document(self, document: dict):
        """Add or update a document in the index"""
        try:
            index = self._get_index()
            # Ensure ID is a string for MeiliSearch
            if "id" in document:
                document["id"] = str(document["id"])
            index.add_documents([document])
            logger.info(f"Indexed document {document.get('id')}")
        except Exception as e:
            logger.error(f"Failed to index document: {e}")

    def delete_document(self, document_id: str):
        """Remove a document from the index"""
        try:
            index = self._get_index()
            index.delete_document(document_id)
            logger.info(f"Deleted document {document_id} from index")
        except Exception as e:
            logger.error(f"Failed to delete document from index: {e}")

    def search(self, query: str, filters: dict = None, filter_str: str = None, limit: int = 20, offset: int = 0):
        """Search the index"""
        try:
            index = self._get_index()
            params = {
                "limit": limit,
                "offset": offset
            }
            
            if filter_str:
                params["filter"] = filter_str
            elif filters:
                filter_list = []
                for k, v in filters.items():
                    if isinstance(v, str):
                        filter_list.append(f'{k} = "{v}"')
                    else:
                        filter_list.append(f'{k} = {v}')
                params["filter"] = " AND ".join(filter_list)
            
            return index.search(query, params)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {"hits": [], "estimatedTotalHits": 0}

search_service = SearchService()
