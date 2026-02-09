# land_id.py

def generate_spatial_id_components(
    grid_id: int,
    sub_x: int,
    sub_y: int,
    parcel_seq: int
) -> dict:
    """
    Returns both canonical and display spatial IDs
    """
    canonical = f"{grid_id:03d}{sub_x:02d}{sub_y:02d}{parcel_seq:04d}"

    display = f"SL-{grid_id:03d}-{sub_x:02d}-{sub_y:02d}-{parcel_seq:04d}"

    return {
        "canonical_id": canonical,
        "display_id": display,
        "grid_id": grid_id,
        "sub_x": sub_x,
        "sub_y": sub_y,
        "parcel_seq": parcel_seq
    }
