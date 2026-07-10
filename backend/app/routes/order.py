from fastapi import APIRouter, HTTPException, Depends
from app.database import (
    create_order,
    process_order_payment,
    insert_feedback,
    fetch_user_orders,
    verify_email_password  # ✅ NEW IMPORT
)
from app.model import CreateOrderRequest, PaymentRequest, FeedbackRequest
from app.auth_security import get_current_email

router = APIRouter(prefix="/orders", tags=["Orders"])


# ✅ CREATE ORDER
@router.post("/create")
def place_order(
    order_data: CreateOrderRequest,
    email: str = Depends(get_current_email)
):
    items_dict_list = [
        {"item_id": item.item_id, "quantity": item.quantity}
        for item in order_data.items
    ]

    if not items_dict_list:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    result = create_order(email, items_dict_list)
    return {"message": "Order created successfully", "order_details": result}


# ✅ CHECKOUT (UPDATED WITH PASSWORD SECURITY)
@router.post("/checkout")
def checkout_order(
    payment_data: PaymentRequest,
    email: str = Depends(get_current_email)
):
    # 🔐 SECURITY CHECK (NEW)
    if not verify_email_password(email, payment_data.password):
        raise HTTPException(status_code=401, detail="Incorrect Password. Payment Denied.")

    # 💳 PROCESS PAYMENT
    success, message = process_order_payment(
        order_id=payment_data.order_id,
        email=email,
        wallet_amount=payment_data.wallet_amount,
        other_amount=payment_data.other_amount,
        other_source=payment_data.other_source
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"message": message, "order_id": payment_data.order_id}


# ✅ FEEDBACK
@router.post("/feedback")
def submit_feedback(
    feedback_data: FeedbackRequest,
    email: str = Depends(get_current_email)
):
    ratings = [
        feedback_data.ambience,
        feedback_data.cleanliness,
        feedback_data.food_quality,
        feedback_data.taste,
        feedback_data.service
    ]

    if any(r < 1 or r > 5 for r in ratings):
        raise HTTPException(status_code=400, detail="Ratings must be between 1 and 5.")

    insert_feedback(
        order_id=feedback_data.order_id,
        email=email,
        ambience=feedback_data.ambience,
        cleanliness=feedback_data.cleanliness,
        food_quality=feedback_data.food_quality,
        taste=feedback_data.taste,
        service=feedback_data.service,
        comments=feedback_data.comments
    )

    return {"message": "Feedback submitted successfully. Thank you!"}


# ✅ UPDATE ORDER
@router.put("/{order_id}")
def update_order(
    order_id: int,
    order_data: CreateOrderRequest,
    email: str = Depends(get_current_email)
):
    items_dict_list = [
        {"item_id": item.item_id, "quantity": item.quantity}
        for item in order_data.items
    ]

    if not items_dict_list:
        raise HTTPException(status_code=400, detail="Updated order cannot be empty.")

    from app.database import update_order_items
    success = update_order_items(order_id, email, items_dict_list)

    if not success:
        raise HTTPException(status_code=404, detail="Order not found or update window closed.")

    return {"message": "Order updated successfully"}


# ✅ ORDER HISTORY
@router.get("/history")
def get_order_history(email: str = Depends(get_current_email)):
    orders = fetch_user_orders(email)
    return {"data": orders}