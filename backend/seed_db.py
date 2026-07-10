import sqlite3

# Connect directly to your local database file
DB_NAME = "users.db"

menu_items = [
    # --- BREAKFAST ---
    ("Masala Dosa", "Breakfast", "South Indian", "Crispy rice crepe with spiced potato filling", "Rice, Lentils, Potatoes, Spices", "", 90.0),
    ("Idli Sambar", "Breakfast", "South Indian", "Steamed rice cakes with lentil soup", "Rice, Urad Dal, Lentils, Vegetables", "", 70.0),
    ("Aloo Paratha", "Breakfast", "North Indian", "Stuffed potato flatbread served with curd", "Wheat flour, Potatoes, Spices, Butter", "", 80.0),
    ("Chole Bhature", "Breakfast", "North Indian", "Spicy chickpea curry with fried bread", "Chickpeas, Flour, Spices, Oil", "", 120.0),
    ("Pancakes with Syrup", "Breakfast", "Other", "Fluffy pancakes with maple syrup", "Flour, Milk, Eggs, Maple Syrup", "", 150.0),

    # --- LUNCH ---
    ("South Indian Thali", "Lunch", "South Indian", "Complete meal with rice, sambar, rasam, and veggies", "Rice, Lentils, Vegetables, Spices", "", 180.0),
    ("Paneer Butter Masala", "Lunch", "North Indian", "Rich paneer curry in a tomato-butter gravy", "Paneer, Tomatoes, Butter, Cream", "", 220.0),
    ("Veg Hakka Noodles", "Lunch", "Chinese", "Stir-fried noodles with fresh vegetables", "Noodles, Cabbage, Carrots, Soy Sauce", "", 160.0),
    ("Margherita Pizza", "Lunch", "Italian", "Classic cheese and tomato pizza", "Pizza Dough, Tomato Sauce, Mozzarella, Basil", "", 250.0),
    ("Veg Fried Rice", "Lunch", "Chinese", "Wok-tossed rice with vegetables", "Rice, Beans, Carrots, Spring Onions", "", 170.0),

    # --- DINNER ---
    ("Dal Makhani", "Dinner", "North Indian", "Slow-cooked black lentils with butter", "Black Lentils, Kidney Beans, Butter, Cream", "", 190.0),
    ("Chettinad Veg Curry", "Dinner", "South Indian", "Spicy vegetable curry cooked in roasted spices", "Mixed Veggies, Coconut, Chettinad Spices", "", 200.0),
    ("Pasta Alfredo", "Dinner", "Italian", "Penne pasta in a rich, creamy cheese sauce", "Pasta, Heavy Cream, Parmesan, Garlic", "", 280.0),
    ("Chilli Paneer", "Dinner", "Chinese", "Spicy, tangy paneer cubes tossed with peppers", "Paneer, Bell Peppers, Soy Sauce, Chilli Paste", "", 210.0),
    ("Grilled Veg Sandwich", "Dinner", "Other", "Toasted sandwich loaded with fresh veggies", "Bread, Lettuce, Tomato, Cucumber, Cheese", "", 130.0)
]

def seed_menu():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        print("Inserting menu items into the database...")
        
        # Insert items using standard SQL
        cursor.executemany('''
            INSERT INTO MENU (NAME, MEAL_TYPE, CUISINE, DESCRIPTION, INGREDIENTS, IMAGE_URL, COST)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', menu_items)
        
        conn.commit()
        print(f"✅ Successfully added {len(menu_items)} items to the MENU table!")
        
    except sqlite3.Error as e:
        print(f"🚨 Database Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    seed_menu()