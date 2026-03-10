"""
Tests for land property CRUD operations
"""
import pytest
import time
from httpx import AsyncClient
from uuid import UUID

from app.models import LandStatus


@pytest.mark.asyncio
class TestPropertyCRUD:
    """Land property CRUD operation tests"""
    
    async def test_create_property_success(self, client: AsyncClient, test_user_data, test_property_data):
        """Test creating a new property listing"""
        # Ensure 'uploads' directory exists for mock storage
        import os
        os.makedirs("uploads/survey_plans", exist_ok=True)
        os.makedirs("uploads/title_deeds", exist_ok=True)

        # Register user
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create property - Use multipart form as required by the endpoint
        from io import BytesIO

        files = {
            "survey_plan": ("survey.jpg", BytesIO(b"dummy survey content"), "image/jpeg"),
            "title_deed": ("deed.jpg", BytesIO(b"dummy deed content"), "image/jpeg"),
        }

        form_data = {
            "title": test_property_data["title"],
            "description": test_property_data["description"],
            "price": "5000000.0",
            "size_sqm": "5000.0",
            "region": "Western Area",
            "district": "Freetown",
            "latitude": "8.4847",
            "longitude": "-13.2344",
            "spousal_consent": "false"
        }

        # Add optional land photo to files
        files["land_photo"] = ("photo.jpg", BytesIO(b"dummy photo content"), "image/jpeg")

        response = await client.post(
            "/api/v1/land",
            data=form_data,
            files=files,
            headers=headers
        )
        
        if response.status_code != 201:
            print(f"Land create failed: {response.status_code} - {response.text}")

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == test_property_data["title"]
        assert "id" in data
        assert "parcel_id" in data
        assert "trust_score" in data
    
    async def test_create_property_unauthorized(self, client: AsyncClient, test_property_data):
        """Test creating property without authentication"""
        # Form data required by the endpoint
        data = {
            "title": test_property_data["title"],
            "description": test_property_data["description"],
            "price": "5000000.0",
            "size_sqm": "5000.0",
            "region": "Western Area",
            "district": "Freetown",
            "latitude": "8.4847",
            "longitude": "-13.2344",
        }

        response = await client.post(
            "/api/v1/land",
            data=data
        )
        
        # 401 is returned if no credentials provided
        assert response.status_code in [401, 403]
    
    async def test_get_property_success(self, client: AsyncClient, test_user_data, test_property_data):
        """Test retrieving property details"""
        # Register user and create property
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        create_response = await client.post(
            "/api/v1/land",
            json=test_property_data,
            headers=headers
        )
        property_id = create_response.json()["id"]
        
        # Get property details
        response = await client.get(
            f"/api/v1/land/{property_id}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"Get failed: {response.status_code} - {response.text}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == property_id
        assert data["title"] == test_property_data["title"]
    
    async def test_get_property_not_found(self, client: AsyncClient):
        """Test retrieving non-existent property"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        response = await client.get(f"/api/v1/land/{fake_id}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    async def test_update_property_success(self, client: AsyncClient, test_user_data, test_property_data):
        """Test updating property listing"""
        # Register and create property
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        create_response = await client.post(
            "/api/v1/land",
            json=test_property_data,
            headers=headers
        )
        property_id = create_response.json()["id"]
        
        # Update property
        update_data = {
            "title": "Updated Title",
            "price": 6000000.0,
            "status": "pending"
        }
        
        response = await client.put(
            f"/api/v1/land/{property_id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["price"] == update_data["price"]
    
    async def test_update_property_unauthorized(self, client: AsyncClient, test_user_data, test_property_data):
        """Test updating property as non-owner"""
        # Create property with user 1
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token1 = register_response.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {access_token1}"}
        
        create_response = await client.post(
            "/api/v1/land",
            json=test_property_data,
            headers=headers1
        )
        property_id = create_response.json()["id"]
        
        # Try to update with user 2
        user2_data = {
            "email": "user2@example.com",
            "name": "User 2",
            "phone": "+234 702 234 5678",
            "password": "TestPassword123!",
            "role": "buyer"
        }
        
        register_response2 = await client.post(
            "/api/v1/auth/register",
            json=user2_data
        )
        access_token2 = register_response2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {access_token2}"}
        
        response = await client.put(
            f"/api/v1/land/{property_id}",
            json={"title": "Hacked Title"},
            headers=headers2
        )
        
        assert response.status_code == 403
        assert "only land owner" in response.json()["detail"]
    
    async def test_delete_property_success(self, client: AsyncClient, test_user_data, test_property_data):
        """Test deleting property listing"""
        # Register and create property
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        create_response = await client.post(
            "/api/v1/land",
            json=test_property_data,
            headers=headers
        )
        property_id = create_response.json()["id"]
        
        # Delete property
        response = await client.delete(
            f"/api/v1/land/{property_id}",
            headers=headers
        )
        
        assert response.status_code == 204
        
        # Verify deletion
        get_response = await client.get(f"/api/v1/land/{property_id}")
        assert get_response.status_code == 404
    
    async def test_delete_property_unauthorized(self, client: AsyncClient, test_user_data, test_property_data):
        """Test deleting property as non-owner"""
        # Create property
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        create_response = await client.post(
            "/api/v1/land",
            json=test_property_data,
            headers=headers
        )
        property_id = create_response.json()["id"]
        
        # Try to delete with different user
        user2_data = {
            "email": "user2@example.com",
            "name": "User 2",
            "phone": "+234 702 234 5678",
            "password": "TestPassword123!",
            "role": "buyer"
        }
        
        register_response2 = await client.post(
            "/api/v1/auth/register",
            json=user2_data
        )
        access_token2 = register_response2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {access_token2}"}
        
        response = await client.delete(
            f"/api/v1/land/{property_id}",
            headers=headers2
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestPropertySearch:
    """Property search and filtering tests"""
    
    async def test_search_properties_empty(self, client: AsyncClient):
        """Test searching properties with no results"""
        response = await client.get("/api/v1/land?region=NonExistent")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []
    
    async def test_search_properties_by_price_range(self, client: AsyncClient, test_user_data, test_property_data):
        """Test searching properties by price range"""
        # Create properties
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create multiple properties
        for i in range(3):
            prop_data = test_property_data.copy()
            prop_data["price"] = (i + 1) * 5000000
            await client.post("/api/v1/land", json=prop_data, headers=headers)
        
        # Search by price range
        response = await client.get(
            "/api/v1/land?min_price=4000000&max_price=12000000"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
    
    async def test_search_properties_pagination(self, client: AsyncClient, test_user_data, test_property_data):
        """Test pagination in property search"""
        # Create multiple properties
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        for i in range(5):
            prop_data = test_property_data.copy()
            prop_data["title"] = f"Property {i}"
            await client.post("/api/v1/land", json=prop_data, headers=headers)
        
        # Test pagination
        response = await client.get("/api/v1/land?page=1&page_size=2")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["items"]) <= 2
        assert "has_next" in data
        assert "has_prev" in data
    
    async def test_search_properties_by_status(self, client: AsyncClient, test_user_data, test_property_data):
        """Test searching properties by status"""
        # Create property
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        await client.post("/api/v1/land", json=test_property_data, headers=headers)
        
        # Search by status
        response = await client.get("/api/v1/land?status=available")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0

@pytest.mark.asyncio
async def test_land_visibility_logic(client: AsyncClient, test_user_data, test_property_data):
    """Test public/private visibility logic"""
    # 1. Register with unique email
    unique_user = test_user_data.copy()
    unique_user["email"] = f"visibility_{int(time.time())}@example.com"

    register_response = await client.post("/api/v1/auth/register", json=unique_user)
    access_token = register_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Create Private Land
    from io import BytesIO
    files = {
        "survey_plan": ("survey.jpg", BytesIO(b"dummy"), "image/jpeg"),
        "title_deed": ("deed.jpg", BytesIO(b"dummy"), "image/jpeg"),
    }

    form_data = {
        "title": "Private Land",
        "description": "Hidden",
        "price": "1000",
        "size_sqm": "100",
        "region": "Western",
        "district": "Freetown",
        "latitude": "8.0",
        "longitude": "-13.0",
        "is_public": "false"
    }

    create_res = await client.post("/api/v1/land", data=form_data, files=files, headers=headers)
    assert create_res.status_code == 201
    land_id = create_res.json()["id"]
    assert create_res.json()["is_public"] is False

    # 3. Verify NOT in public marketplace
    market_res = await client.get("/api/v1/land")
    items = market_res.json()["items"]
    assert not any(item["id"] == land_id for item in items)

    # 4. Toggle to Public
    toggle_res = await client.patch(f"/api/v1/land/{land_id}/visibility?is_public=true", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_public"] is True

    # 5. Verify IS in public marketplace (Note: Might need to be status=available)
    # The endpoint might return PENDING_APPROVAL lands if filters aren't strict,
    # but the logic is filtered by is_public first.
    market_res_after = await client.get("/api/v1/land?status=pending_approval")
    assert market_res_after.status_code == 200
    items_after = market_res_after.json()["items"]
    assert any(str(item["id"]) == str(land_id) for item in items_after)
