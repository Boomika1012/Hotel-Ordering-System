import sqlite3

DB_NAME = "users.db"

def clear_all_orders():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        print("Wiping out old order history...")
        
        # Delete all records from order-dependent tables
        cursor.execute("DELETE FROM ORDER_ITEMS")
        cursor.execute("DELETE FROM PAYMENTS")
        cursor.execute("DELETE FROM FEEDBACK")
        cursor.execute("DELETE FROM ORDERS")
        
        conn.commit()
        print("✅ All previous orders have been completely wiped out! Your history is now clean.")
        
    except sqlite3.Error as e:
        print(f"🚨 Database Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    clear_all_orders()