
import pytest
import os
from unittest.mock import AsyncMock, patch
from app.services.document_extractor import DocumentExtractor

@pytest.mark.asyncio
async def test_parse_coordinates():
    text = "Property located at Latitude: 8.4847, Longitude: -13.2344. Surveyed in 2023."
    coords = DocumentExtractor.parse_coordinates(text)
    assert coords is not None
    assert coords["latitude"] == 8.4847
    assert coords["longitude"] == -13.2344

@pytest.mark.asyncio
async def test_parse_owner_name():
    text = "We hereby certify that John Doe is the legal owner of this parcel."
    owner = DocumentExtractor.parse_owner_name(text)
    assert owner == "John Doe"

@pytest.mark.asyncio
async def test_extract_details_fallback():
    # Test fallback when AI fails or returns nothing
    with patch("app.services.document_extractor.get_jems_service") as mock_get_jems:
        mock_jems = AsyncMock()
        mock_jems.extract_land_data.return_value = {"success": False}
        mock_get_jems.return_value = mock_jems

        # Mock _get_text_content to return predefined text
        with patch.object(DocumentExtractor, "_get_text_content") as mock_get_text:
            mock_get_text.return_value = "Owner: Jane Smith \nLat: 8.4, Lon: -13.2\nTransfer to Jane Smith from Bob Brown"

            result = await DocumentExtractor.extract_details("dummy.pdf")
            assert result["success"] is True
            assert result["extraction_method"] == "Fallback Regex"
            assert result["data"]["owner_name"] == "Jane Smith"
            assert result["data"]["coordinates"] == [[8.4, -13.2]]

@pytest.mark.asyncio
async def test_extract_details_ai_success():
    # Test when AI succeeds
    with patch("app.services.document_extractor.get_jems_service") as mock_get_jems:
        mock_jems = AsyncMock()
        mock_jems.extract_land_data.return_value = {
            "success": True,
            "data": {
                "owner_name": "AI Extracted Name",
                "coordinates": [[8.5, -13.1], [8.6, -13.1], [8.6, -13.2], [8.5, -13.2]],
                "ownership_history": [{"event": "Purchase", "date": "2022-01-01"}]
            }
        }
        mock_get_jems.return_value = mock_jems

        # Mock _get_text_content
        with patch.object(DocumentExtractor, "_get_text_content") as mock_get_text:
            mock_get_text.return_value = "Dummy content"

            result = await DocumentExtractor.extract_details("dummy.pdf")
            assert result["success"] is True
            assert result["extraction_method"] == "Jems AI (Fused)"
            assert result["data"]["owner_name"] == "AI Extracted Name"
            assert len(result["data"]["coordinates"]) == 4
