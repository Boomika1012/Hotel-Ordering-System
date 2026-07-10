import bcrypt
import jwt
import os
from dotenv import load_dotenv
import datetime
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends,HTTPException,status

load_dotenv()

SECRET_KEY=os.getenv("SECRET_KEY")

security = HTTPBearer()

def hash_password(password:str)->bytes:
   return bcrypt.hashpw(password.encode("utf-8"),bcrypt.gensalt())

def check_password(password:str, hashed_password:bytes)->bool:
    return bcrypt.checkpw(password.encode("utf-8"),hashed_password)

def generate_jwt_token(email:str)->str:
    expires_in=datetime.datetime.now()+datetime.timedelta(minutes=1)
    payload={
        "email":email,
        "exp":expires_in
    }
    return jwt.encode(payload,SECRET_KEY,algorithm="HS256")



def get_current_email(
    credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["email"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Add to app/auth_security.py

def generate_reset_token(email: str) -> str:
    # Token valid for 15 minutes
    expires_in = datetime.datetime.now() + datetime.timedelta(minutes=15)
    payload = {
        "email": email,
        "exp": expires_in,
        "purpose": "password_reset"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("purpose") != "password_reset":
            return None
        return payload["email"]
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None