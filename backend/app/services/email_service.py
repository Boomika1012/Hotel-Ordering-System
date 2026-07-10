import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_reset_email(to_email: str, reset_link: str) -> bool:
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    
    if not sender_email or not sender_password:
        print("Email credentials missing in .env")
        return False

    message = MIMEMultipart()
    message['From'] = sender_email
    message['To'] = to_email
    message['Subject'] = "Foodie Junction - Password Reset Request"

    body = f"""
    Hello,

    We received a request to reset your password. 
    Click the link below to set a new password:

    {reset_link}

    This link will expire in 15 minutes. If you did not request this, please ignore this email.
    """
    
    message.attach(MIMEText(body, 'plain'))

    try:
        # Use SMTP_SSL for secure connection on port 465
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False