from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db_connection

app = Flask(__name__)
CORS(app)


# Home route
@app.route("/")
def home():
    return "Inventory Management System Backend is Working!"


# Get all products
@app.route("/products", methods=["GET"])
def get_products():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(products)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Add a new product
@app.route("/products", methods=["POST"])
def add_product():
    try:
        data = request.json

        product_name = data["product_name"]
        category_id = data.get("category_id")
        supplier_id = data.get("supplier_id")
        price = data["price"]
        quantity = data.get("quantity", 0)
        minimum_stock = data.get("minimum_stock", 5)

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO products
            (product_name, category_id, supplier_id, price, quantity, minimum_stock)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        values = (
            product_name,
            category_id,
            supplier_id,
            price,
            quantity,
            minimum_stock
        )

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Product added successfully!"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    connection = None

    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if product exists
        cursor.execute(
            "SELECT * FROM products WHERE product_id = %s",
            (product_id,)
        )

        product = cursor.fetchone()

        if not product:
            cursor.close()
            connection.close()
            return jsonify({"error": "Product not found"}), 404

        # Get updated values
        product_name = data.get("product_name", product["product_name"])
        category_id = data.get("category_id", product["category_id"])
        supplier_id = data.get("supplier_id", product["supplier_id"])
        price = data.get("price", product["price"])
        quantity = data.get("quantity", product["quantity"])
        minimum_stock = data.get("minimum_stock", product["minimum_stock"])

        # Validation
        if price < 0:
            return jsonify({"error": "Price cannot be negative"}), 400

        if quantity < 0:
            return jsonify({"error": "Quantity cannot be negative"}), 400

        if minimum_stock < 0:
            return jsonify({"error": "Minimum stock cannot be negative"}), 400

        # Update product
        cursor.execute(
            """
            UPDATE products
            SET
                product_name = %s,
                category_id = %s,
                supplier_id = %s,
                price = %s,
                quantity = %s,
                minimum_stock = %s
            WHERE product_id = %s
            """,
            (
                product_name,
                category_id,
                supplier_id,
                price,
                quantity,
                minimum_stock,
                product_id
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Product updated successfully!",
            "product_id": product_id
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500
@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if product exists
        cursor.execute(
            "SELECT product_id, product_name FROM products WHERE product_id = %s",
            (product_id,)
        )

        product = cursor.fetchone()

        if not product:
            cursor.close()
            connection.close()
            return jsonify({"error": "Product not found"}), 404

        # Check whether product is used in sales
        cursor.execute(
            "SELECT COUNT(*) AS count FROM sale_items WHERE product_id = %s",
            (product_id,)
        )

        sales = cursor.fetchone()

        if sales["count"] > 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Cannot delete product because it has sales records"
            }), 400

        # Check whether product is used in purchases
        cursor.execute(
            "SELECT COUNT(*) AS count FROM purchase_items WHERE product_id = %s",
            (product_id,)
        )

        purchases = cursor.fetchone()

        if purchases["count"] > 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Cannot delete product because it has purchase records"
            }), 400

        # Delete product
        cursor.execute(
            "DELETE FROM products WHERE product_id = %s",
            (product_id,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Product deleted successfully!",
            "product_id": product_id,
            "product_name": product["product_name"]
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500    

# Get all categories
@app.route("/categories", methods=["GET"])
def get_categories():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT category_id, category_name
            FROM categories
            ORDER BY category_id ASC
        """)

        categories = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(categories), 200

    except Exception as e:
        if connection:
            connection.close()

        return jsonify({"error": str(e)}), 500


# Add a new category
@app.route("/categories", methods=["POST"])
def add_category():
    try:
        data = request.json

        category_name = data["category_name"]

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO categories (category_name)
            VALUES (%s)
        """

        cursor.execute(query, (category_name,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Category added successfully!"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


    

        return jsonify({"error": str(e)}), 500
    
# Delete a category
@app.route("/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if category exists
        cursor.execute(
            "SELECT category_id, category_name FROM categories WHERE category_id = %s",
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Category not found"
            }), 404

        # Check if any product is using this category
        cursor.execute(
            "SELECT COUNT(*) AS count FROM products WHERE category_id = %s",
            (category_id,)
        )

        products = cursor.fetchone()

        if products["count"] > 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Cannot delete category because it is being used by products",
                "products_using_category": products["count"]
            }), 400

        # Delete category
        cursor.execute(
            "DELETE FROM categories WHERE category_id = %s",
            (category_id,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Category deleted successfully!",
            "category_id": category_id,
            "category_name": category["category_name"]
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500
@app.route("/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    connection = None

    try:
        data = request.json

        category_name = data.get("category_name")

        if not category_name:
            return jsonify({
                "error": "Category name is required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if category exists
        cursor.execute(
            "SELECT category_id FROM categories WHERE category_id = %s",
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Category not found"
            }), 404

        # Update category
        cursor.execute(
            """
            UPDATE categories
            SET category_name = %s
            WHERE category_id = %s
            """,
            (category_name, category_id)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Category updated successfully!",
            "category_id": category_id,
            "category_name": category_name
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500    

    # Get all suppliers
@app.route("/suppliers", methods=["GET"])
def get_suppliers():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM suppliers")
        suppliers = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(suppliers)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # Add a new supplier
# Add a new supplier
@app.route("/suppliers", methods=["POST"])
def add_supplier():
    try:
        data = request.json

        supplier_name = data["supplier_name"]
        phone = data.get("phone")
        email = data.get("email")
        address = data.get("address")

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO suppliers
            (supplier_name, phone, email, address)
            VALUES (%s, %s, %s, %s)
        """

        values = (
            supplier_name,
            phone,
            email,
            address
        )

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Supplier added successfully!"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500 

@app.route("/suppliers/<int:supplier_id>", methods=["PUT"])
def update_supplier(supplier_id):
    connection = None

    try:
        data = request.json

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if supplier exists
        cursor.execute(
            "SELECT * FROM suppliers WHERE supplier_id = %s",
            (supplier_id,)
        )

        supplier = cursor.fetchone()

        if not supplier:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Supplier not found"
            }), 404

        # Get updated values
        supplier_name = data.get(
            "supplier_name",
            supplier["supplier_name"]
        )

        phone = data.get(
            "phone",
            supplier["phone"]
        )

        email = data.get(
            "email",
            supplier["email"]
        )

        address = data.get(
            "address",
            supplier["address"]
        )

        if not supplier_name:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Supplier name is required"
            }), 400

        # Update supplier
        cursor.execute(
            """
            UPDATE suppliers
            SET
                supplier_name = %s,
                phone = %s,
                email = %s,
                address = %s
            WHERE supplier_id = %s
            """,
            (
                supplier_name,
                phone,
                email,
                address,
                supplier_id
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Supplier updated successfully!",
            "supplier_id": supplier_id,
            "supplier_name": supplier_name
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500

@app.route("/suppliers/<int:supplier_id>", methods=["DELETE"])
def delete_supplier(supplier_id):
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if supplier exists
        cursor.execute(
            "SELECT supplier_id, supplier_name FROM suppliers WHERE supplier_id = %s",
            (supplier_id,)
        )

        supplier = cursor.fetchone()

        if not supplier:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Supplier not found"
            }), 404

        # Check if any product is using this supplier
        cursor.execute(
            "SELECT COUNT(*) AS count FROM products WHERE supplier_id = %s",
            (supplier_id,)
        )

        products = cursor.fetchone()

        if products["count"] > 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Cannot delete supplier because it is being used by products",
                "products_using_supplier": products["count"]
            }), 400

        # Delete supplier
        cursor.execute(
            "DELETE FROM suppliers WHERE supplier_id = %s",
            (supplier_id,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Supplier deleted successfully!",
            "supplier_id": supplier_id,
            "supplier_name": supplier["supplier_name"]
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500
        
    # Get all users
@app.route("/users", methods=["GET"])
def get_users():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT user_id, name, email, role FROM users")
        users = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(users)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a new user
@app.route("/users", methods=["POST"])
def add_user():
    try:
        data = request.json

        name = data["name"]
        email = data["email"]
        password = data["password"]
        role = data.get("role", "user")

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO users
            (name, email, password, role)
            VALUES (%s, %s, %s, %s)
        """

        values = (
            name,
            email,
            password,
            role
        )

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "User added successfully!"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Create a purchase and increase product stock
@app.route("/purchases", methods=["POST"])
def add_purchase():
    connection = None

    try:
        data = request.json

        supplier_id = data["supplier_id"]
        product_id = data["product_id"]
        quantity = data["quantity"]
        unit_price = data["unit_price"]

        if quantity <= 0:
            return jsonify({"error": "Quantity must be greater than 0"}), 400

        if unit_price < 0:
            return jsonify({"error": "Unit price cannot be negative"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check supplier
        cursor.execute(
            "SELECT supplier_id FROM suppliers WHERE supplier_id = %s",
            (supplier_id,)
        )

        supplier = cursor.fetchone()

        if not supplier:
            cursor.close()
            connection.close()
            return jsonify({"error": "Supplier not found"}), 404

        # Check product
        cursor.execute(
            "SELECT product_id FROM products WHERE product_id = %s",
            (product_id,)
        )

        product = cursor.fetchone()

        if not product:
            cursor.close()
            connection.close()
            return jsonify({"error": "Product not found"}), 404

        subtotal = quantity * unit_price

        # Create purchase
        cursor.execute(
            """
            INSERT INTO purchases (supplier_id, total_amount)
            VALUES (%s, %s)
            """,
            (supplier_id, subtotal)
        )

        purchase_id = cursor.lastrowid

        # Create purchase item
        cursor.execute(
            """
            INSERT INTO purchase_items
            (purchase_id, product_id, quantity, unit_price, subtotal)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                purchase_id,
                product_id,
                quantity,
                unit_price,
                subtotal
            )
        )

        # Increase product stock
        cursor.execute(
            """
            UPDATE products
            SET quantity = quantity + %s
            WHERE product_id = %s
            """,
            (quantity, product_id)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Purchase added successfully!",
            "purchase_id": purchase_id,
            "subtotal": float(subtotal),
            "stock_added": quantity
        }), 201

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500
@app.route("/purchases", methods=["GET"])
def get_purchases():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.purchase_id,
                p.supplier_id,
                p.total_amount,
                p.purchase_date,
                pi.purchase_item_id,
                pi.product_id,
                pi.quantity,
                pi.unit_price,
                pi.subtotal
            FROM purchases p
            LEFT JOIN purchase_items pi
                ON p.purchase_id = pi.purchase_id
            ORDER BY p.purchase_id DESC
        """)

        purchases = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(purchases), 200

    except Exception as e:
        if connection:
            connection.close()

        return jsonify({"error": str(e)}), 500
    

    # Create a sale and reduce product stock
@app.route("/sales", methods=["POST"])
def add_sale():
    connection = None

    try:
        data = request.json

        customer_name = data.get("customer_name", "Walk-in Customer")
        product_id = data["product_id"]
        quantity = data["quantity"]
        unit_price = data["unit_price"]

        if quantity <= 0:
            return jsonify({"error": "Quantity must be greater than 0"}), 400

        if unit_price < 0:
            return jsonify({"error": "Unit price cannot be negative"}), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check product and current stock
        cursor.execute(
            """
            SELECT product_id, quantity
            FROM products
            WHERE product_id = %s
            """,
            (product_id,)
        )

        product = cursor.fetchone()

        if not product:
            cursor.close()
            connection.close()
            return jsonify({"error": "Product not found"}), 404

        # Prevent selling more than available stock
        if product["quantity"] < quantity:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Insufficient stock",
                "available_stock": product["quantity"]
            }), 400

        subtotal = quantity * unit_price

        # Create sale
        cursor.execute(
            """
            INSERT INTO sales (customer_name, total_amount)
            VALUES (%s, %s)
            """,
            (customer_name, subtotal)
        )

        sale_id = cursor.lastrowid

        # Create sale item
        cursor.execute(
            """
            INSERT INTO sale_items
            (sale_id, product_id, quantity, unit_price, subtotal)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                sale_id,
                product_id,
                quantity,
                unit_price,
                subtotal
            )
        )

        # Reduce product stock
        cursor.execute(
            """
            UPDATE products
            SET quantity = quantity - %s
            WHERE product_id = %s
            """,
            (quantity, product_id)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Sale added successfully!",
            "sale_id": sale_id,
            "subtotal": float(subtotal),
            "stock_removed": quantity
        }), 201

    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()

        return jsonify({"error": str(e)}), 500
@app.route("/sales", methods=["GET"])
def get_sales():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                s.sale_id,
                s.customer_name,
                s.sale_date,
                s.total_amount,
                si.sale_item_id,
                si.product_id,
                si.quantity,
                si.unit_price,
                si.subtotal
            FROM sales s
            LEFT JOIN sale_items si
                ON s.sale_id = si.sale_id
            ORDER BY s.sale_id DESC
        """)

        sales = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(sales), 200

    except Exception as e:
        if connection:
            connection.close()

        return jsonify({"error": str(e)}), 500    

    # Get low-stock products
@app.route("/products/low-stock", methods=["GET"])
def get_low_stock_products():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT *
            FROM products
            WHERE quantity <= minimum_stock
        """)

        products = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(products)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Inventory dashboard
@app.route("/dashboard", methods=["GET"])
def dashboard():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Total number of products
        cursor.execute("SELECT COUNT(*) AS total_products FROM products")
        total_products = cursor.fetchone()["total_products"]

        # Total stock quantity
        cursor.execute("SELECT COALESCE(SUM(quantity), 0) AS total_stock FROM products")
        total_stock = cursor.fetchone()["total_stock"]

        # Total purchases
        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total_purchases FROM purchases")
        total_purchases = cursor.fetchone()["total_purchases"]

        # Total sales
        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM sales")
        total_sales = cursor.fetchone()["total_sales"]

        # Low-stock products
        cursor.execute("""
            SELECT COUNT(*) AS low_stock_count
            FROM products
            WHERE quantity <= minimum_stock
        """)
        low_stock_count = cursor.fetchone()["low_stock_count"]

        cursor.close()
        connection.close()

        return jsonify({
            "total_products": total_products,
            "total_stock": total_stock,
            "total_purchases": float(total_purchases),
            "total_sales": float(total_sales),
            "low_stock_count": low_stock_count
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # User Login
@app.route("/login", methods=["POST"])
def login():
    connection = None

    try:
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT user_id, name, email, role
            FROM users
            WHERE email = %s AND password = %s
        """, (email, password))

        user = cursor.fetchone()

        cursor.close()
        connection.close()

        if not user:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        return jsonify({
            "message": "Login successful",
            "user": user
        }), 200

    except Exception as e:

        if connection:
            connection.close()

        return jsonify({
            "error": str(e)
        }), 500
    
    
    
if __name__ == "__main__":
    app.run(debug=True)

