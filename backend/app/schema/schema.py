from pydantic import BaseModel, ConfigDict

"""User Authentication Schema"""

# Token string Model
class Token(BaseModel):
    admin: bool
    access_token: str
    token_type: str

# Token data model
class TokenData(BaseModel):
    username: str | None = None
    admin: bool | None = None

class RefreshTokenData(BaseModel):
    username: str | None = None
    admin: bool
    token: str | None = None

# New user data modal
class NewUser(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    name: str
    mobile_no: str
    hashed_password: str
    email: str | None = None


# User model
class User(BaseModel):
    username: str
    email: str | None = None
    disabled: bool | None = None
    super: bool | None = None
    data_collection: str
    #admin: bool | None = None


# Store Requested User with password
class UserInDB(User):
    hashed_password: str
    admin: bool | None = None


# Login request model
class LoginRequest(BaseModel):
    username: str
    password: str


"""Data Schema"""

# New log insertion model
class CreateLog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    Name: str
    Contact: str
    Service: str
    Service_Type: str
    Govt_Fee: int
    Service_Charge: int
    Created_At: str = 'Default'
    Application_ID: str
    Due: int

# Full log update model
class UpdateLog(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    Name: str
    Contact: str
    Service: str
    Service_Type: str
    Govt_Fee: int
    Service_Charge: int
    Month: str
    Created_At: str = 'Default'
    Application_ID: str
    Due: int


# Due field update model
class UpdateDue(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    Due: int

# Document ID
class DocumentID(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
