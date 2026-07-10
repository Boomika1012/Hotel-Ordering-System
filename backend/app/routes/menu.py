from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database import search_menu_items, get_menu_item_details

router = APIRouter(prefix="/menu", tags=["Menu"])

@router.get("/search")
def search_menu(
    meal_type: Optional[str] = Query(None, description="E.g., Breakfast, Lunch, Dinner"), 
    cuisine: Optional[str] = Query(None, description="E.g., North Indian, South Indian")
):
    items = search_menu_items(meal_type, cuisine)
    if not items:
        return {"message": "No menu items found for the selected parameters.", "data": []}
    
    # Map the database tuple to a dictionary for the frontend
    result = []
    for row in items:
        result.append({
            "item_id": row[0],
            "name": row[1],
            "meal_type": row[2],
            "cuisine": row[3],
            "description": row[4],
            "ingredients": row[5],
            "image_url": row[6],
            "cost": row[7]
        })
    return {"data": result}

@router.get("/{item_id}")
def get_item_details(item_id: int):
    row = get_menu_item_details(item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {
        "item_id": row[0],
        "name": row[1],
        "meal_type": row[2],
        "cuisine": row[3],
        "description": row[4],
        "ingredients": row[5],
        "image_url": row[6],
        "cost": row[7]
    }