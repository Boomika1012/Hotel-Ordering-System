from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import uuid
import json

from app.services.user_service import validate_password
from app.model import PersonalDetailsUpdate, PasswordDetailsUpdate, OtherDetailsUpdate
from app.auth_security import get_current_email, hash_password
from app.database import update_fields

profile_router=APIRouter(prefix="/profile",tags=["profile"])


@profile_router.patch("/personal-details", status_code=status.HTTP_200_OK)
def profile_update(
    profile: str = Form(...), 
    id_proof: UploadFile = File(None), 
    email: str = Depends(get_current_email)
):
    # 1. Parse the incoming JSON string back into the Pydantic model
    try:
        profile_dict = json.loads(profile)
        profile_data = PersonalDetailsUpdate(**profile_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail="Invalid profile data format"
        )

    # 2. Extract the data just like you were doing before
    update_data = profile_data.model_dump(exclude_unset=True)  
    sensitive_fields = {"name", "dob", "address"}
    is_sensitive_update = any(field in update_data for field in sensitive_fields)
    
    # if sensitive field update then check id proof
    if is_sensitive_update:
        if not id_proof:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "ID proof required for updating personal details",
                }
            )
        # valid file types
        file_type_allowed=["image/jpeg","image/png","application/pdf"]
        if id_proof.content_type not in file_type_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Invalid file type. Only JPG/PNG/PDF allowed",
                }
            )

        # create file names to store in kyc folder
        file_extension=id_proof.filename.split(".")[-1]
        filename=f"{uuid.uuid4()}.{file_extension}"
        file_path=f"kyc_uploads/{filename}"

        with open(file_path,"wb") as buffer:
            buffer.write(id_proof.file.read())

        update_data["KYC_STATUS"]="PENDING"
        update_data["KYC_DOCUMENT_PATH"]=file_path

    is_update_success = update_fields(update_data, email)

    if not is_update_success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Update Failed",
                "code":"Invalid Credentials"
            }
        )
        
    return {
        "success": True,
        "message":"Profile update successful",
        "data": {
            "updated_fields": update_data,
            "KYCApproval":update_data.get("KYC_STATUS","NOT_REQUIRED")
        },
        "error":None
    }


@profile_router.patch("/password",status_code=status.HTTP_200_OK)
def password_update(data:PasswordDetailsUpdate,email:str=Depends(get_current_email)):
    update_data = data.model_dump()
    password=update_data["password"]

    validate_password(password)

    hashed_password = hash_password(password)
    update_data["password"] = hashed_password

    is_update_success=update_fields(update_data,email)
    if not is_update_success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Update Failed",
                "code":"Invalid Credentials"
            }
        )
    return {
        "success": True,
        "message":"Password update successful",
        "data": {
            "KYCApproval":"Pending"
        },
        "error":None
    }

@profile_router.patch("/preferences", status_code=status.HTTP_200_OK)
def update_preferences(
    data: OtherDetailsUpdate,
    email: str = Depends(get_current_email)
):
    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No preferences provided"
        )

    is_update_success = update_fields(update_data, email)

    if not is_update_success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences update failed"
        )

    return {
        "success": True,
        "message": "Preferences updated successfully",
        "data": update_data,
        "error": None
    }