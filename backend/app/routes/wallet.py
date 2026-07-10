from fastapi import Depends, HTTPException, APIRouter
from app.auth_security import get_current_email

from app.security.encryption import encrypt_data, decrypt_data

from app.database import (
    get_wallet_balance,
    update_wallet_balance,
    insert_transaction,
    fetch_transactions,
    save_card_details,
    fetch_user_cards
)

from app.model import WalletAmount, FundWalletRequest

wallet_router = APIRouter(prefix="/wallet", tags=["Wallet"])


# ✅ GET WALLET BALANCE
@wallet_router.get("/balance")
def wallet_balance(email: str = Depends(get_current_email)):
    balance = get_wallet_balance(email)
    return {
        "success": True,
        "balance": balance
    }


# ✅ ADD MONEY (UPDATED WITH FULL VALIDATION FLOW)
@wallet_router.post("/add")
def add_money(data: FundWalletRequest, email: str = Depends(get_current_email)):
    
    # 1️⃣ BASIC VALIDATION
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if len(data.cvv) != 3 or not data.cvv.isdigit():
        raise HTTPException(status_code=400, detail="Invalid CVV format.")

    existing_cards = fetch_user_cards(email)
    is_saved_card = "*" in data.card_number

    # 2️⃣ CARD VALIDATION
    if is_saved_card:
        # 🔒 Validate saved card
        valid_card = False

        for card in existing_cards:
            holder, enc_number, enc_expiry, ctype = card

            dec_num = decrypt_data(enc_number)
            masked = "**** **** **** " + dec_num[-4:]

            if data.card_number == masked:
                if decrypt_data(enc_expiry) != data.expiry_date:
                    raise HTTPException(
                        status_code=400,
                        detail="Incorrect Expiry Date. Payment Denied."
                    )
                valid_card = True
                break

        if not valid_card:
            raise HTTPException(status_code=400, detail="Saved card not found.")

    else:
        # 🆕 Validate new card
        clean_number = data.card_number.replace(" ", "")

        if len(clean_number) != 16 or not clean_number.isdigit():
            raise HTTPException(status_code=400, detail="Invalid Card Number.")

        # Check duplicate
        card_exists = False
        for card in existing_cards:
            if decrypt_data(card[1]) == clean_number:
                card_exists = True
                break

        # Save new card if not exists
        if not card_exists:
            enc_number = encrypt_data(clean_number)
            enc_expiry = encrypt_data(data.expiry_date)

            save_card_details(
                email,
                data.card_holder_name,
                enc_number,
                enc_expiry,
                "***",  # ❗ Never store CVV
                data.card_type
            )

    # 3️⃣ ONLY AFTER VALIDATION → ADD MONEY
    current_balance = get_wallet_balance(email)
    new_balance = current_balance + data.amount

    update_wallet_balance(email, new_balance)
    insert_transaction(email, "CREDIT", data.amount, "Money added to wallet")

    return {
        "success": True,
        "message": "Money added successfully",
        "new_balance": new_balance
    }


# ✅ DEDUCT MONEY
@wallet_router.post("/deduct")
def deduct_money(data: WalletAmount, email: str = Depends(get_current_email)):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    current_balance = get_wallet_balance(email)

    if current_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    new_balance = current_balance - data.amount

    update_wallet_balance(email, new_balance)
    insert_transaction(email, "DEBIT", data.amount, "Money deducted from wallet")

    return {
        "success": True,
        "message": "Money deducted successfully",
        "new_balance": new_balance
    }


# ✅ TRANSACTIONS
@wallet_router.get("/transactions")
def wallet_transactions(email: str = Depends(get_current_email)):
    transactions = fetch_transactions(email)

    return {
        "success": True,
        "transactions": [
            {
                "type": txn[0],
                "amount": txn[1],
                "description": txn[2],
                "created_at": txn[3]
            }
            for txn in transactions
        ]
    }


# ✅ GET SAVED CARDS
@wallet_router.get("/cards")
def get_cards(card_type: str = None, email: str = Depends(get_current_email)):
    cards = fetch_user_cards(email, card_type)

    response_cards = []

    for card in cards:
        holder, enc_number, enc_expiry, ctype = card

        full_number = decrypt_data(enc_number)
        masked_number = "**** **** **** " + full_number[-4:]
        expiry = decrypt_data(enc_expiry)

        response_cards.append({
            "card_holder_name": holder,
            "card_number": masked_number,
            "expiry_date": expiry,
            "card_type": ctype
        })

    return {
        "success": True,
        "cards": response_cards
    }