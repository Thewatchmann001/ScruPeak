"""
Tests for land property CRUD operations
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import update
from uuid import UUID
import io

from app.models import LandStatus, User


@pytest.mark.asyncio
class TestPropertyCRUD:
    """Land property CRUD operation tests"""
    
    async def test_create_property_success(self, client: AsyncClient, test_user_data, test_db_session):
        """Test creating a new property listing"""
        # Register user
        register_response = await client.post("/api/v1/auth/register", json=test_user_data)
        data = register_response.json()
        user_id = data["user"]["id"]

        # Manually verify KYC
        await test_db_session.execute(update(User).where(User.id == UUID(user_id)).values(kyc_verified=True))
        await test_db_session.commit()

        access_token = data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        form_data = {
            "title": "Test Land Property",
            "description": "A beautiful test plot",
            "price": "5000000.0",
            "size_sqm": "500.0",
            "region": "Western",
            "district": "Freetown",
            "latitude": "8.484",
            "longitude": "-13.234",
            "spousal_consent": "false"
        }
        files = {
            "survey_plan": ("survey.jpg", io.BytesIO(b"dummy_survey"), "image/jpeg"),
            "title_deed": ("deed.jpg", io.BytesIO(b"dummy_deed"), "image/jpeg"),
            "chief_letter": ("chief.jpg", io.BytesIO(b"dummy_chief"), "image/jpeg"),
            "property_image": ("land.jpg", io.BytesIO(b"dummy_land"), "image/jpeg")
        }
        
        response = await client.post("/api/v1/land", data=form_data, files=files, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == form_data["title"]
        assert "id" in data
    
    async def test_create_property_unauthorized(self, client: AsyncClient):
        """Test creating property without authentication"""
        response = await client.post("/api/v1/land", data={"title": "Unauthorized"})
        assert response.status_code == 403
    
    async def test_get_property_success(self, client: AsyncClient, test_user_data, test_db_session):
        """Test retrieving property details"""
        register_response = await client.post("/api/v1/auth/register", json=test_user_data)
        reg_data = register_response.json()
        user_id = reg_data["user"]["id"]
        await test_db_session.execute(update(User).where(User.id == UUID(user_id)).values(kyc_verified=True))
        await test_db_session.commit()

        access_token = reg_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        form_data = {
            "title": "Unique Land Property", "description": "Test", "price": "100", "size_sqm": "10",
            "region": "Region", "district": "District", "latitude": "0", "longitude": "0"
        }
        files = {
            "survey_plan": ("s.jpg", io.BytesIO(b"s"), "image/jpeg"),
            "title_deed": ("d.jpg", io.BytesIO(b"d"), "image/jpeg"),
            "chief_letter": ("c.jpg", io.BytesIO(b"c"), "image/jpeg"),
            "property_image": ("p.jpg", io.BytesIO(b"p"), "image/jpeg")
        }

        create_response = await client.post("/api/v1/land", data=form_data, files=files, headers=headers)
        property_id = create_response.json()["id"]
        
        response = await client.get(f"/api/v1/land/{property_id}")
        assert response.status_code == 200
        assert response.json()["id"] == property_id
    
    async def test_get_property_not_found(self, client: AsyncClient):
        """Test retrieving non-existent property"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.get(f"/api/v1/land/{fake_id}")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_update_property_success(self, client: AsyncClient, test_user_data, test_db_session):
        """Test updating property listing"""
        register_response = await client.post("/api/v1/auth/register", json=test_user_data)
        reg_data = register_response.json()
        user_id = reg_data["user"]["id"]
        await test_db_session.execute(update(User).where(User.id == UUID(user_id)).values(kyc_verified=True))
        await test_db_session.commit()
        headers = {"Authorization": f"Bearer {reg_data['access_token']}"}
        
        # Create
        form_data = {
            "title": "Initial Title", "description": "T", "price": "100", "size_sqm": "10",
            "region": "Region", "district": "District", "latitude": "0", "longitude": "0"
        }
        files = {
            "survey_plan": ("s.jpg", io.BytesIO(b"s"), "image/jpeg"),
            "title_deed": ("d.jpg", io.BytesIO(b"d"), "image/jpeg"),
            "chief_letter": ("c.jpg", io.BytesIO(b"c"), "image/jpeg"),
            "property_image": ("p.jpg", io.BytesIO(b"p"), "image/jpeg")
        }
        create_res = await client.post("/api/v1/land", data=form_data, files=files, headers=headers)
        property_id = create_res.json()["id"]
        
        # Update
        update_data = {"title": "Updated Title", "price": 200}
        response = await client.put(f"/api/v1/land/{property_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    async def test_delete_property_success(self, client: AsyncClient, test_user_data, test_db_session):
        """Test deleting property listing"""
        register_response = await client.post("/api/v1/auth/register", json=test_user_data)
        reg_data = register_response.json()
        user_id = reg_data["user"]["id"]
        await test_db_session.execute(update(User).where(User.id == UUID(user_id)).values(kyc_verified=True))
        await test_db_session.commit()
        headers = {"Authorization": f"Bearer {reg_data['access_token']}"}
        
        # Create
        form_data = {
            "title": "To Delete Property", "description": "T", "price": "100", "size_sqm": "10",
            "region": "Region", "district": "District", "latitude": "0", "longitude": "0"
        }
        files = {
            "survey_plan": ("s.jpg", io.BytesIO(b"s"), "image/jpeg"),
            "title_deed": ("d.jpg", io.BytesIO(b"d"), "image/jpeg"),
            "chief_letter": ("c.jpg", io.BytesIO(b"c"), "image/jpeg"),
            "property_image": ("p.jpg", io.BytesIO(b"p"), "image/jpeg")
        }
        create_res = await client.post("/api/v1/land", data=form_data, files=files, headers=headers)
        property_id = create_res.json()["id"]
        
        # Delete
        response = await client.delete(f"/api/v1/land/{property_id}", headers=headers)
        assert response.status_code == 204
        
        # Verify
        get_res = await client.get(f"/api/v1/land/{property_id}")
        assert get_res.status_code == 404


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

    async def test_search_properties_by_price_range(self, client: AsyncClient, test_user_data, test_db_session):
        """Test searching properties by price range"""
        register_response = await client.post("/api/v1/auth/register", json=test_user_data)
        reg_data = register_response.json()
        user_id = reg_data["user"]["id"]
        await test_db_session.execute(update(User).where(User.id == UUID(user_id)).values(kyc_verified=True))
        await test_db_session.commit()
        headers = {"Authorization": f"Bearer {reg_data['access_token']}"}
        
        for i in range(3):
            form_data = {
                "title": f"Land Property {i}", "description": "T", "price": str((i + 1) * 1000), "size_sqm": "100",
                "region": "Western", "district": "Freetown", "latitude": str(8.4+i*0.1), "longitude": "-13.2"
            }
            files = {
                "survey_plan": ("s.jpg", io.BytesIO(b"s"), "image/jpeg"),
                "title_deed": ("d.jpg", io.BytesIO(b"d"), "image/jpeg"),
                "chief_letter": ("c.jpg", io.BytesIO(b"c"), "image/jpeg"),
                "property_image": ("p.jpg", io.BytesIO(b"p"), "image/jpeg")
            }
            await client.post("/api/v1/land", data=form_data, files=files, headers=headers)
        
        response = await client.get("/api/v1/land?min_price=1500&max_price=2500")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(1500 <= float(item["price"]) <= 2500 for item in data["items"])
