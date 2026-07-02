from pydantic import BaseModel

"""User Authentication Schema"""

# Token string Model
class Token(BaseModel):
    access_token: str
    token_type: str

# Token data model
class TokenData(BaseModel):
    username: str | None = None

# New user data modal
class NewUser(BaseModel):
    username: str
    name: str
    mobile_no: str
    hashed_password: str
    email: str | None = None
    disabled: bool | None = None
    super: bool | None = None

# User model
class User(BaseModel):
    username: str
    email: str | None = None
    disabled: bool | None = None
    super: bool | None = None
    data_collection: str

# Login request model
class LoginRequest(BaseModel):
    username: str
    password: str


"""Data Schema"""

# New log insertion model
class CreateLog(BaseModel):
    Name: str
    Contact: str
    Service: str
    Service_Type: str
    Govt_Fee: int
    Service_Charge: int
    Total_Amount: int
    Month: str
    Created_At: str
    Application_ID: str
    Due: int

# Full log update model
class UpdateLog(BaseModel):
    id: str
    Name: str
    Contact: str
    Service: str
    Service_Type: str
    Govt_Fee: int
    Service_Charge: int
    Total_Amount: int
    Month: str
    Created_At: str
    Application_ID: str
    Due: int


# Due field update model
class UpdateDue(BaseModel):
    id: str
    Due: int

# Document ID
class DocumentID(BaseModel):
    id: str
