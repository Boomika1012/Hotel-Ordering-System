from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from enum import Enum

class CardType(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

class FoodPreference(str, Enum):
    VEG = "Veg"
    NON_VEG = "Non Veg"

# --- NEW ENUMS FOR SPRINT 2 ---
class MealType(str, Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    DINNER = "Dinner"

class CuisineType(str, Enum):
    NORTH_INDIAN = "North Indian"
    SOUTH_INDIAN = "South Indian"
    OTHER = "Other"

# --- EXISTING USER MODELS ---
class User(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    name: str
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RegistrationSuccess(BaseModel):
    user: UserPublic
    nextAction: str
    redirectTo: str

class ErrorResponse(BaseModel):
    code: str
    details: str

class RegistrationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[RegistrationSuccess]
    error: Optional[ErrorResponse]

class PersonalDetailsUpdate(BaseModel):
    name: str
    dob: Optional[date] = None
    address: Optional[str] = None

class PasswordDetailsUpdate(BaseModel):
    password: str

class OtherDetailsUpdate(BaseModel):
    preferences: FoodPreference

class WalletAmount(BaseModel):
    amount: float

class CardDetails(BaseModel):
    card_holder_name: str
    card_number: str
    expiry_date: str
    cvv: str
    card_type: CardType  

# --- NEW MODELS FOR SPRINT 2 ---

class MenuItemResponse(BaseModel):
    item_id: int
    name: str
    meal_type: str
    cuisine: str
    description: str
    ingredients: str
    image_url: Optional[str]
    cost: float

class OrderItemRequest(BaseModel):
    item_id: int
    quantity: int

class CreateOrderRequest(BaseModel):
    items: List[OrderItemRequest]

class PaymentRequest(BaseModel):
    order_id: int
    wallet_amount: float
    other_amount: float
    other_source: Optional[str] = None
    password: str

class FeedbackRequest(BaseModel):
    order_id: int
    ambience: int       # Expecting 1-5 rating
    cleanliness: int
    food_quality: int
    taste: int
    service: int
    comments: Optional[str] = None

class FundWalletRequest(BaseModel):
    amount: float
    card_type: str
    card_holder_name: str
    card_number: str
    expiry_date: str
    cvv: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordSubmit(BaseModel):
    token: str
    new_password: str