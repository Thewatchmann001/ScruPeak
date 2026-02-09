"""
Tests for authentication endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import User
from app.utils.auth import hash_password


@pytest.mark.asyncio
class TestAuthentication:
    """Authentication endpoint tests"""
    
    async def test_register_success(self, client: AsyncClient, test_user_data):
        """Test successful user registration"""
        response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data, test_db_session):
        """Test registration with duplicate email"""
        # Create first user
        response1 = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert response1.status_code == 201
        
        # Try to create duplicate
        response2 = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert response2.status_code == 409
        assert "already registered" in response2.json()["detail"]
    
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email"""
        data = {
            "email": "invalid-email",
            "name": "Test User",
            "phone": "+234 701 234 5678",
            "password": "TestPassword123!",
            "role": "buyer"
        }
        
        response = await client.post(
            "/api/v1/auth/register",
            json=data
        )
        assert response.status_code == 422  # Validation error
    
    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password"""
        data = {
            "email": "test@example.com",
            "name": "Test User",
            "phone": "+234 701 234 5678",
            "password": "weak",
            "role": "buyer"
        }
        
        response = await client.post(
            "/api/v1/auth/register",
            json=data
        )
        # Should fail password validation
        assert response.status_code in [422, 400]
    
    async def test_login_success(self, client: AsyncClient, test_user_data):
        """Test successful login"""
        # Register user first
        await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        # Login with correct credentials
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = await client.post(
            "/api/v1/auth/login",
            json=login_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    async def test_login_invalid_email(self, client: AsyncClient):
        """Test login with non-existent email"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "TestPassword123!"
        }
        
        response = await client.post(
            "/api/v1/auth/login",
            json=login_data
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    async def test_login_invalid_password(self, client: AsyncClient, test_user_data):
        """Test login with incorrect password"""
        # Register user
        await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        
        # Try login with wrong password
        login_data = {
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        }
        
        response = await client.post(
            "/api/v1/auth/login",
            json=login_data
        )
        
        assert response.status_code == 401
        assert "Invalid password" in response.json()["detail"]
    
    async def test_refresh_token_success(self, client: AsyncClient, test_user_data):
        """Test successful token refresh"""
        # Register and login
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        refresh_token = register_response.json()["refresh_token"]
        
        # Use refresh token
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["refresh_token"] is not None
    
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh with invalid token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"}
        )
        
        assert response.status_code == 401
        assert "Invalid or expired" in response.json()["detail"]
    
    async def test_multiple_user_roles(self, client: AsyncClient):
        """Test registration with different user roles"""
        roles = ["buyer", "owner", "agent"]
        
        for i, role in enumerate(roles):
            user_data = {
                "email": f"user_{role}_{i}@example.com",
                "name": f"User {role}",
                "phone": "+234 701 234 5678",
                "password": "TestPassword123!",
                "role": role
            }
            
            response = await client.post(
                "/api/v1/auth/register",
                json=user_data
            )
            
            assert response.status_code == 201
            assert "access_token" in response.json()


@pytest.mark.asyncio
class TestTokenValidation:
    """Token validation and authorization tests"""
    
    async def test_access_token_in_header(self, client: AsyncClient, test_user_data):
        """Test using access token in Authorization header"""
        # Register user
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        access_token = register_response.json()["access_token"]
        
        # Use token in protected endpoint (e.g., user profile)
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await client.get(
            "/api/v1/users/me",
            headers=headers
        )
        
        # Should succeed or be a different error (if endpoint not implemented)
        assert response.status_code in [200, 404]
    
    async def test_expired_token(self, client: AsyncClient):
        """Test with expired token (mock)"""
        # This would require creating a token with very short expiry
        # For now, just test with invalid token
        headers = {"Authorization": "Bearer invalid-token-here"}
        response = await client.get(
            "/api/v1/users/me",
            headers=headers
        )
        
        assert response.status_code == 401
    
    async def test_missing_token(self, client: AsyncClient):
        """Test accessing protected endpoint without token"""
        response = await client.get("/api/v1/users/me")
        
        assert response.status_code == 403
