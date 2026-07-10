from app.model import User
from app.database import insert_users, create_wallet
from app.auth_security import hash_password
import re
from fastapi import HTTPException, status


def validate_password(password: str) -> None:
    if len(password) < 6 or len(password) > 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be between 6 and 32 characters."
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit."
        )

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/`~;']", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )



def user_details(user:User):
    validate_password(user.password)

    name = user.name
    email =user.email
    hashed_password=hash_password(user.password)
    user_creation_success=insert_users(name=name,email=email,password=hashed_password)
    if user_creation_success:
        create_wallet(email)
    return user_creation_success





