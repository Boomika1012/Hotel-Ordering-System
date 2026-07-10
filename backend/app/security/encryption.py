from cryptography.fernet import Fernet
import os

# Load or generate key
KEY = os.getenv("ENCRYPTION_KEY")

if not KEY:
    KEY = Fernet.generate_key().decode()
    print(f"⚠️ Save this key in .env: ENCRYPTION_KEY={KEY}")

fernet = Fernet(KEY.encode())


def encrypt_data(data: str) -> str:
    return fernet.encrypt(data.encode()).decode()


def decrypt_data(data: str) -> str:
    return fernet.decrypt(data.encode()).decode()