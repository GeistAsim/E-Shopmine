# User's DataBase table model
def all_users_entity(item) -> dict:
    return {
        # "id": str(item["_id"]),
        "user_id": str(item["_id"]),
        "username": str(item["username"]),
        "hashed_password": str(item["hashed_password"]),
        "email": str(item["email"]),
        "disabled": str(item["disabled"]),
        "super": str(item["super"]),
        "created_at": str(item["created_at"])
    }

def all_users_entitys(items) -> list:
    return [all_users_entity(item) for item in items]


# Shop table DataBase model
def super_home_entity(item) -> dict:
    return {
        "id": str(item["_id"]),
        "Name": item["Name"],
        "Contact": item["Contact"],
        "Service": item["Service"],
        "Service_Type": item["Service_Type"],
        "Govt_Fee": item["Govt_Fee"],
        "Service_Charge": item["Service_Charge"],
        "Total_Amount": item["Total_Amount"],
        "Month": item["Month"],
        "Created_At": str(item["Created_At"]),
        "Application_ID": item["Application_ID"],
        "Due": item["Due"]
    }

def super_home_entitys(items) -> list:
    return [super_home_entity(item) for item in items]


def home_entity(item) -> dict:
    return {
        "id": str(item["_id"]),
        "Name": item["Name"],
        "Contact": item["Contact"],
        "Service": item["Service"],
        "Service_Type": item["Service_Type"],
        "Month": item["Month"],
        "Created_At": str(item["Created_At"]),
        "Application_ID": item["Application_ID"],
    }


def home_entitys(items) -> list:
    return [home_entity(item) for item in items]
