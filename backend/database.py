import mysql.connector


def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="unkxddpj0XX@",
        database="inventory_management"
    )

    return connection