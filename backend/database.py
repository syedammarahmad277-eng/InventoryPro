import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def get_db_connection():
    password = os.environ.get("DB_PASSWORD")
    if password is None:
        raise RuntimeError("DB_PASSWORD environment variable is required")

    connection_options = {
        "host": os.environ.get("DB_HOST", "localhost"),
        "user": os.environ.get("DB_USER", "root"),
        "password": password,
        "database": os.environ.get("DB_NAME", "inventory_management"),
    }

    port = os.environ.get("DB_PORT")
    if port:
        connection_options["port"] = int(port)

    return mysql.connector.connect(**connection_options)
