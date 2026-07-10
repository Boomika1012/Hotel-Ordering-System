import sqlite3

DB_NAME = "users.db"

menu_items = [
    # --- BREAKFAST ---
    ("Masala Dosa", "Breakfast", "South Indian", "Crispy rice crepe with spiced potato filling", "Rice, Lentils, Potatoes, Spices", "/images/masala_dosa.jpg", 90.0),
    ("Idli Sambar", "Breakfast", "South Indian", "Steamed rice cakes with lentil soup", "Rice, Urad Dal, Lentils, Vegetables", "/images/idli.jpg", 70.0),
    ("Aloo Paratha", "Breakfast", "North Indian", "Stuffed potato flatbread served with curd", "Wheat flour, Potatoes, Spices, Butter", "/images/aloo_paratha.jpg", 80.0),
    ("Chole Bhature", "Breakfast", "North Indian", "Spicy chickpea curry with fried bread", "Chickpeas, Flour, Spices, Oil", "/images/chole_bature.jpeg", 120.0),
    ("Pancakes with Syrup", "Breakfast", "Other", "Fluffy pancakes with maple syrup", "Flour, Milk, Eggs, Maple Syrup", "/images/panacake.jpg", 150.0),
    ("Omelette", "Breakfast", "Other", "Fluffy classic omelette", "Eggs, Onions, Spices", "/images/omellete.jpg", 50.0),
    ("Egg Bhurji", "Breakfast", "North Indian", "Scrambled eggs with Indian spices and butter", "Eggs, Onions, Tomatoes, Green Chillies", "/images/egg_burji.jpg", 100.0),

    # --- LUNCH ---
    ("South Indian Thali", "Lunch", "South Indian", "Complete meal with rice, sambar, rasam, and veggies", "Rice, Lentils, Vegetables, Spices", "/images/meal.jpg", 180.0),
    ("Paneer Butter Masala", "Lunch", "North Indian", "Rich paneer curry in a tomato-butter gravy", "Paneer, Tomatoes, Butter, Cream", "", 220.0),
    ("Veg Hakka Noodles", "Lunch", "Chinese", "Stir-fried noodles with fresh vegetables", "Noodles, Cabbage, Carrots, Soy Sauce", "", 160.0),
    ("Margherita Pizza", "Lunch", "Italian", "Classic cheese and tomato pizza", "Pizza Dough, Tomato Sauce, Mozzarella, Basil", "", 250.0),
    ("Chicken 65", "Lunch", "South Indian", "Spicy, deep-fried chicken appetizer", "Chicken, Spices, Curry Leaves", "", 140.0),
    ("Chicken Lollipop (5 pcs)", "Lunch", "Chinese", "Crispy fried chicken winglets", "Chicken Wings, Spices, Soy Sauce", "", 160.0),
    ("Butter Chicken", "Lunch", "North Indian", "Tender chicken cooked in rich tomato gravy", "Chicken, Tomatoes, Butter, Cream", "", 220.0),
    ("Chicken Curry", "Lunch", "North Indian", "Classic homestyle chicken curry", "Chicken, Onions, Tomatoes, Spices", "", 180.0),
    ("Chicken Chettinad", "Lunch", "South Indian", "Fiery chicken curry cooked with freshly roasted spices", "Chicken, Kalpasi, Coconut, Spices", "", 200.0),
    ("Mutton Biryani", "Lunch", "South Indian", "Aromatic basmati rice cooked with tender mutton", "Basmati Rice, Mutton, Spices, Yogurt", "", 250.0),
    ("Egg Biryani", "Lunch", "South Indian", "Fragrant biryani rice served with boiled eggs", "Basmati Rice, Eggs, Spices", "", 130.0),

    # --- DINNER ---
    ("Dal Makhani", "Dinner", "North Indian", "Slow-cooked black lentils with butter", "Black Lentils, Kidney Beans, Butter, Cream", "", 190.0),
    ("Pasta Alfredo", "Dinner", "Italian", "Penne pasta in a rich, creamy cheese sauce", "Pasta, Heavy Cream, Parmesan, Garlic", "", 280.0),
    ("Chilli Paneer", "Dinner", "Chinese", "Spicy, tangy paneer cubes tossed with peppers", "Paneer, Bell Peppers, Soy Sauce, Chilli Paste", "", 210.0),
    ("Grilled Veg Sandwich", "Dinner", "Other", "Toasted sandwich loaded with fresh veggies", "Bread, Lettuce, Tomato, Cucumber, Cheese", "", 130.0),
    ("Chettinad Veg Curry", "Dinner", "South Indian", "Spicy vegetable curry cooked in roasted spices", "Mixed Veggies, Coconut, Chettinad Spices", "", 200.0),
    
    # --- BREADS ---
    ("Plain Naan", "Dinner", "North Indian", "Soft and fluffy traditional Indian flatbread baked in a tandoor", "Refined flour, Yeast, Salt", "", 40.0),
    ("Butter Naan", "Dinner", "North Indian", "Soft tandoor-baked flatbread brushed with melted butter", "Refined flour, Yeast, Butter", "", 50.0),
    ("Garlic Naan", "Dinner", "North Indian", "Soft flatbread infused with fresh minced garlic and cilantro", "Refined flour, Garlic, Coriander, Butter", "", 60.0),
    ("Cheese Naan", "Dinner", "North Indian", "Delicious flatbread stuffed with gooey melted cheese", "Refined flour, Cheese, Butter", "", 80.0),
    ("Kashmiri Naan", "Dinner", "North Indian", "Sweet and savory flatbread stuffed with dry fruits and nuts", "Refined flour, Cashews, Almonds, Raisins, Butter", "", 90.0),
    ("Tandoori Roti", "Dinner", "North Indian", "Whole wheat flatbread baked in a traditional clay oven", "Whole wheat flour, Water", "", 30.0),
    ("Butter Roti", "Dinner", "North Indian", "Whole wheat flatbread brushed generously with butter", "Whole wheat flour, Butter", "", 40.0)
]

def seed_menu():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        print("Clearing old menu items...")
        cursor.execute("DELETE FROM MENU")
        
        print("Inserting new menu items into the database...")
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