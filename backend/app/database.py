import sqlite3
from app.auth_security import check_password, hash_password

DB_NAME = "users.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def create_table():
    conn = get_connection()
    cursor = conn.cursor()

    # User table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS USERS(
            UID INTEGER PRIMARY KEY,
            NAME TEXT NOT NULL,
            DOB DATE,
            EMAIL TEXT NOT NULL UNIQUE,
            PASSWORD BLOB NOT NULL,
            PREFERENCES TEXT,
            ADDRESS TEXT,
            KYC_STATUS TEXT DEFAULT 'NOT_SUBMITTED',
            KYC_DOCUMENT_PATH TEXT,
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            UPDATED_AT TEXT
        );""")

    # Wallet table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS WALLET(
            WALLET_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            EMAIL TEXT UNIQUE,
            BALANCE REAL DEFAULT 0,
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (EMAIL) REFERENCES USERS(EMAIL)
        );''')

    # Wallet transaction
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS WALLET_TRANSACTIONS(
            TRANSACTION_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            EMAIL TEXT,
            TYPE TEXT,
            AMOUNT REAL,
            DESCRIPTION TEXT,
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (EMAIL) REFERENCES USERS(EMAIL)
        );''')

    # User cards table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS USER_CARDS(
            CARD_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            EMAIL TEXT,
            CARD_HOLDER_NAME TEXT,
            CARD_NUMBER TEXT,
            EXPIRY_DATE TEXT,
            CVV TEXT,
            CARD_TYPE TEXT,
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (EMAIL) REFERENCES USERS(EMAIL)
        );''')

    # --- NEW TABLES FOR SPRINT 2 ---
    
    # Menu Items
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS MENU(
            ITEM_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            NAME TEXT NOT NULL,
            MEAL_TYPE TEXT,
            CUISINE TEXT,
            DESCRIPTION TEXT,
            INGREDIENTS TEXT,
            IMAGE_URL TEXT,
            COST REAL NOT NULL
        );
    ''')

    # Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ORDERS(
            ORDER_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            EMAIL TEXT,
            TOTAL_COST REAL DEFAULT 0,
            STATUS TEXT DEFAULT 'PENDING',
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (EMAIL) REFERENCES USERS(EMAIL)
        );
    ''')

    # Order Items (Cart/Plates)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ORDER_ITEMS(
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ORDER_ID INTEGER,
            ITEM_ID INTEGER,
            QUANTITY INTEGER,
            PRICE_PER_ITEM REAL,
            FOREIGN KEY (ORDER_ID) REFERENCES ORDERS(ORDER_ID),
            FOREIGN KEY (ITEM_ID) REFERENCES MENU(ITEM_ID)
        );
    ''')

    # Payments (Handles Split Payments)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS PAYMENTS(
            PAYMENT_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ORDER_ID INTEGER,
            EMAIL TEXT,
            WALLET_DEDUCTION REAL DEFAULT 0,
            OTHER_AMOUNT REAL DEFAULT 0,
            OTHER_SOURCE TEXT,
            STATUS TEXT DEFAULT 'COMPLETED',
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ORDER_ID) REFERENCES ORDERS(ORDER_ID),
            FOREIGN KEY (EMAIL) REFERENCES USERS(EMAIL)
        );
    ''')

    # Feedback
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS FEEDBACK(
            FEEDBACK_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ORDER_ID INTEGER,
            EMAIL TEXT,
            AMBIENCE INTEGER,
            CLEANLINESS INTEGER,
            FOOD_QUALITY INTEGER,
            TASTE INTEGER,
            SERVICE INTEGER,
            COMMENTS TEXT,
            CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ORDER_ID) REFERENCES ORDERS(ORDER_ID),
            FOREIGN KEY (EMAIL) REFERENCES USERS(EMAIL)
        );
    ''')

    conn.commit()
    conn.close()


def insert_users(name: str, email: str, password: bytes):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        user_exist = check_user_exist("", email)  
        if user_exist:
            return False
        cursor.execute('''INSERT INTO USERS (NAME, EMAIL, PASSWORD) VALUES (?,?,?)''', (name.upper(), email, password))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False


def display_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''SELECT * FROM USERS''')
    rows = cursor.fetchall()
    conn.close()
    return rows


def delete_table():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''DROP TABLE IF EXISTS USERS''')
    cursor.execute('''DROP TABLE IF EXISTS WALLET''')
    cursor.execute('''DROP TABLE IF EXISTS USER_CARDS''')
    
    # Drop new tables
    cursor.execute('''DROP TABLE IF EXISTS MENU''')
    cursor.execute('''DROP TABLE IF EXISTS ORDERS''')
    cursor.execute('''DROP TABLE IF EXISTS ORDER_ITEMS''')
    cursor.execute('''DROP TABLE IF EXISTS PAYMENTS''')
    cursor.execute('''DROP TABLE IF EXISTS FEEDBACK''')
    
    conn.commit()
    conn.close()
    print("All tables deleted")


def check_user_exist(name: str, email: str) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM USERS WHERE EMAIL=?", (email,))
        rows = cursor.fetchall()
        conn.close()
        return True if rows else False
    except sqlite3.OperationalError:
        return False


def verify_email_password(email: str, password: str) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT PASSWORD FROM USERS WHERE EMAIL=?", (email,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return False
        stored_hashed_password = row[0]
        return check_password(password, stored_hashed_password)
    except sqlite3.OperationalError:
        return False


def fetch_user_details(email: str) -> list:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM USERS WHERE EMAIL=?", (email,))
        rows = cursor.fetchall()
        conn.close()
        return rows
    except sqlite3.OperationalError:
        return []


def update_fields(data: dict, email: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        editable_colns = ["NAME", "ADDRESS", "DOB", "PASSWORD", "PREFERENCES", "KYC_STATUS", "KYC_DOCUMENT_PATH"]
        data = {k.upper(): v for k, v in data.items() if k.upper() in editable_colns}
        if not data:
            return False

        cols = ", ".join(f"{k}=?" for k in data)
        values = list(data.values()) + [email]
        query = f'''UPDATE USERS SET {cols} WHERE EMAIL=?'''

        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except sqlite3.OperationalError:
        return False


def create_wallet(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO WALLET (EMAIL, BALANCE) VALUES (?, ?)", (email, 0))
    conn.commit()
    conn.close()


def get_wallet_balance(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT BALANCE FROM WALLET WHERE EMAIL=?", (email,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else 0


def update_wallet_balance(email: str, new_balance: float):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE WALLET SET BALANCE=? WHERE EMAIL=?", (new_balance, email))
    conn.commit()
    conn.close()


def insert_transaction(email: str, txn_type: str, amount: float, description: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO WALLET_TRANSACTIONS (EMAIL, TYPE, AMOUNT, DESCRIPTION)
        VALUES (?, ?, ?, ?)
    ''', (email, txn_type, amount, description))
    conn.commit()
    conn.close()


def fetch_transactions(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT TYPE, AMOUNT, DESCRIPTION, CREATED_AT
        FROM WALLET_TRANSACTIONS
        WHERE EMAIL=?
        ORDER BY CREATED_AT DESC
    ''', (email,))
    rows = cursor.fetchall()
    conn.close()
    return rows


def save_card_details(email: str, holder: str, number: str, expiry: str, cvv: str, card_type: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO USER_CARDS (EMAIL, CARD_HOLDER_NAME, CARD_NUMBER, EXPIRY_DATE, CVV, CARD_TYPE)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (email, holder, number, expiry, cvv, card_type))
    conn.commit()
    conn.close()


def fetch_user_cards(email: str, card_type: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    if card_type:
        cursor.execute('''
            SELECT CARD_HOLDER_NAME, CARD_NUMBER, EXPIRY_DATE, CARD_TYPE
            FROM USER_CARDS
            WHERE EMAIL=? AND CARD_TYPE=?
        ''', (email, card_type))
    else:
        cursor.execute('''
            SELECT CARD_HOLDER_NAME, CARD_NUMBER, EXPIRY_DATE, CARD_TYPE
            FROM USER_CARDS
            WHERE EMAIL=?
        ''', (email,))
    rows = cursor.fetchall()
    conn.close()
    return rows


# ==========================================
# SPRINT 2: NEW FUNCTIONS
# ==========================================

def search_menu_items(meal_type: str = None, cuisine: str = None):
    """Search for menu items based on parameters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM MENU WHERE 1=1"
    params = []
    
    if meal_type:
        query += " AND MEAL_TYPE = ?"
        params.append(meal_type)
    if cuisine:
        query += " AND CUISINE = ?"
        params.append(cuisine)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_menu_item_details(item_id: int):
    """Fetch all details for a specific item (description, ingredients, cost, etc)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM MENU WHERE ITEM_ID = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    return row

def create_order(email: str, items: list):
    """
    Creates a new order, calculates the total cost, 
    and saves the individual items to the ORDER_ITEMS table.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Calculate the total cost first
        total_cost = 0
        for item in items:
            item_id = item['item_id']
            quantity = item['quantity']
            
            cursor.execute("SELECT COST FROM MENU WHERE ITEM_ID = ?", (item_id,))
            menu_row = cursor.fetchone()
            if menu_row:
                total_cost += menu_row[0] * quantity

        # 2. Create the main Order record
        cursor.execute('''
            INSERT INTO ORDERS (EMAIL, TOTAL_COST, STATUS) 
            VALUES (?, ?, 'PENDING')
        ''', (email, total_cost))
        
        # Get the ID of the order we just created
        order_id = cursor.lastrowid

        # 3. Save each individual item into the ORDER_ITEMS table
        for item in items:
            item_id = item['item_id']
            quantity = item['quantity']
            
            cursor.execute("SELECT COST FROM MENU WHERE ITEM_ID = ?", (item_id,))
            menu_row = cursor.fetchone()
            if menu_row:
                price = menu_row[0]
                cursor.execute('''
                    INSERT INTO ORDER_ITEMS (ORDER_ID, ITEM_ID, QUANTITY, PRICE_PER_ITEM)
                    VALUES (?, ?, ?, ?)
                ''', (order_id, item_id, quantity, price))

        conn.commit()
        return {
            "order_id": order_id, 
            "total_cost": total_cost, 
            "status": "PENDING"
        }
        
    except Exception as e:
        conn.rollback()
        print(f"Database Error in create_order: {e}")
        return None
    finally:
        conn.close()

def process_order_payment(order_id: int, email: str, wallet_amount: float, other_amount: float, other_source: str = None):
    """Handles partial/full wallet payment and other sources, marks order as completed."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check wallet if wallet_amount > 0
        if wallet_amount > 0:
            current_balance = get_wallet_balance(email)
            if current_balance < wallet_amount:
                return False, "Insufficient wallet balance"
            
            # Deduct wallet
            new_balance = current_balance - wallet_amount
            cursor.execute("UPDATE WALLET SET BALANCE = ? WHERE EMAIL = ?", (new_balance, email))
            
            # Log Wallet Transaction
            cursor.execute('''
                INSERT INTO WALLET_TRANSACTIONS (EMAIL, TYPE, AMOUNT, DESCRIPTION)
                VALUES (?, 'DEBIT', ?, ?)
            ''', (email, wallet_amount, f"Payment for Order #{order_id}"))

        # Insert Payment Record
        cursor.execute('''
            INSERT INTO PAYMENTS (ORDER_ID, EMAIL, WALLET_DEDUCTION, OTHER_AMOUNT, OTHER_SOURCE)
            VALUES (?, ?, ?, ?, ?)
        ''', (order_id, email, wallet_amount, other_amount, other_source))
        
        # Mark Order as Completed
        cursor.execute("UPDATE ORDERS SET STATUS = 'COMPLETED' WHERE ORDER_ID = ?", (order_id,))
        
        conn.commit()
        return True, "Payment Successful"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def insert_feedback(order_id: int, email: str, ambience: int, cleanliness: int, food_quality: int, taste: int, service: int, comments: str):
    """Stores user feedback upon completion of an order."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO FEEDBACK (ORDER_ID, EMAIL, AMBIENCE, CLEANLINESS, FOOD_QUALITY, TASTE, SERVICE, COMMENTS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (order_id, email, ambience, cleanliness, food_quality, taste, service, comments))
    conn.commit()
    conn.close()

def fetch_user_orders(email: str):
    """Fetches all orders and their items for a specific user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Get all the main orders for this user
    cursor.execute("""
        SELECT ORDER_ID, TOTAL_COST, STATUS, CREATED_AT 
        FROM ORDERS 
        WHERE EMAIL = ? 
        ORDER BY CREATED_AT DESC
    """, (email,))
    orders = cursor.fetchall()
    
    result = []
    for order in orders:
        order_id = order[0]
        
        # 2. Get the individual items for this specific order ID
        # Using LEFT JOIN ensures items show up even if the MENU table changed
        cursor.execute("""
            SELECT M.NAME, OI.QUANTITY 
            FROM ORDER_ITEMS OI
            LEFT JOIN MENU M ON OI.ITEM_ID = M.ITEM_ID
            WHERE OI.ORDER_ID = ?
        """, (order_id,))
        items = cursor.fetchall()
        
        # 3. Format the items exactly how the frontend expects them
        item_list = [
            {
                "name": item[0] if item[0] else "Unknown Item", 
                "quantity": item[1]
            } 
            for item in items
        ]
        
        # 4. Append to the final result
        result.append({
            "ORDER_ID": order_id,
            "TOTAL_COST": order[1],
            "STATUS": order[2],
            "CREATED_AT": order[3],
            "items": item_list  # This key must be exactly 'items' for your frontend
        })
        
    conn.close()
    return result
def update_order_items(order_id: int, email: str, items: list):
    """
    Updates an existing pending order.
    Removes old items, inserts new items, and recalculates the total cost.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1. Verify the order exists, belongs to the user, and is still PENDING
        cursor.execute("SELECT STATUS FROM ORDERS WHERE ORDER_ID = ? AND EMAIL = ?", (order_id, email))
        row = cursor.fetchone()
        
        if not row or row[0] != 'PENDING':
            conn.close()
            return False  # Order not found or already completed

        # 2. Delete the old order items
        cursor.execute("DELETE FROM ORDER_ITEMS WHERE ORDER_ID = ?", (order_id,))

        # 3. Process the new items and calculate the new total cost
        total_cost = 0
        for item in items:
            item_id = item['item_id']
            quantity = item['quantity']
            
            # Fetch the current price of the item from the MENU
            cursor.execute("SELECT COST FROM MENU WHERE ITEM_ID = ?", (item_id,))
            menu_row = cursor.fetchone()
            if menu_row:
                price = menu_row[0]
                item_total = price * quantity
                total_cost += item_total
                
                # Insert the updated item back into ORDER_ITEMS
                cursor.execute('''
                    INSERT INTO ORDER_ITEMS (ORDER_ID, ITEM_ID, QUANTITY, PRICE_PER_ITEM)
                    VALUES (?, ?, ?, ?)
                ''', (order_id, item_id, quantity, price))

        # 4. Update the new total cost in the ORDERS table
        cursor.execute("""
            UPDATE ORDERS 
            SET TOTAL_COST = ?, CREATED_AT = CURRENT_TIMESTAMP 
            WHERE ORDER_ID = ?
        """, (total_cost, order_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Database Error in update_order_items: {e}")
        return False
    finally:
        conn.close()
# Initialize tables
create_table()