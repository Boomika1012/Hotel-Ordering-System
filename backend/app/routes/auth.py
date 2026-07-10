from fastapi import APIRouter, HTTPException, status
from app.model import User, RegistrationResponse, UserLogin,ForgotPasswordRequest, ResetPasswordSubmit
from app.services.user_service import user_details,validate_password
from app.database import verify_email_password,check_user_exist, update_fields
from app.auth_security import generate_jwt_token, generate_reset_token, verify_reset_token, hash_password
import os
from app.services.email_service import send_reset_email

auth_router=APIRouter()



@auth_router.post("/register", status_code=status.HTTP_201_CREATED, response_model=RegistrationResponse)
async def registration_details(user: User):
    success = user_details(user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "USER_ALREADY_EXISTS",
                "details": "An account with this email already exists"
            },
        )

    return {
        "success": True,
        "message": "Registration Successful",
        "data": {
            "user": {
                "name": user.name,
                "email": user.email,
            },
            "nextAction": "LOGIN_REQUIRED",
            "redirectTo": "LOGIN"
        },
        "error": None
    }


@auth_router.post("/login", status_code=status.HTTP_200_OK)
def login(user: UserLogin):
    email = user.email
    password = user.password
    success = verify_email_password(email, password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Login Failed",
                "options": ["RETRY", "FORGOT_PASSWORD", "REGISTER"],
                "code": "INVALID CREDENTIALS"
            }
        )
    jwt_token = generate_jwt_token(email)
    return {
        "success": True,
        "message": "Login Successful",
        "data": {
            "user": {
                "email": user.email,
            },
            "Authorization":{
                "access_token": jwt_token,
                "token_type":"Bearer"
            },

        },
        "error": None
    }

@auth_router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(request: ForgotPasswordRequest):
    # 1. Explicitly check if user exists. If not, throw an error immediately.
    if not check_user_exist("", request.email):
        raise HTTPException(status_code=404, detail="Email is not registered.")

    # 2. Generate token and link
    reset_token = generate_reset_token(request.email)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    # 3. Send the email
    email_sent = send_reset_email(request.email, reset_link)
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Check backend configuration.")

    # 4. Explicit success message
    return {"success": True, "message": "Reset link successfully sent to your email!"}


@auth_router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request: ResetPasswordSubmit):
    # 1. Verify token
    email = verify_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    # 2. Validate and hash new password
    validate_password(request.new_password)
    hashed_password = hash_password(request.new_password)

    # 3. Update database using your existing update_fields function
    success = update_fields({"PASSWORD": hashed_password}, email)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password.")

    return {"success": True, "message": "Password has been successfully reset."}