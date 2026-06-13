from datetime import datetime, timedelta, timezone, date
from typing import Annotated
import jwt
import os
from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from dotenv import load_dotenv
from app.model.model import all_users_entitys
from app.schema.schema import Token, TokenData, User, NewUser, LoginRequest
from app.databases.mongo import conn

# DataBase Table Selection
# user_table = 'users' if int(os.getenv("SERVER_PORT")) == 8181 else 'test_user'
user_collection = conn.Shop.users


# Load Secrets
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALOGRITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


# Authentication Router
auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Hashed Password Instance
password_hashed = PasswordHash.recommended()


# Store Requested User with password
class UserInDB(User):
    hashed_password: str


# Password Hashing for DB
def password_hashing(password):
    Password_Hashed_Key = password_hashed.hash(password)
    return Password_Hashed_Key



# All Users Dict list
def user_manager():
    # get all users
    users_list = user_collection.find({})

    # list of all users
    All_Users = all_users_entitys(users_list)

    # Dict of user by username
    All_Users_Dict = {}
    for one in All_Users:
        All_Users_Dict.update({one["username"]: one})
    return All_Users_Dict


# Varify user password
def verify_password(plain_password, hashed_password):
    return password_hashed.verify(plain_password, hashed_password)

# convert user password to hashed password for verification
def get_password_hashed(password):
    return password_hashed.hash(password)

# Get Correct User if Available in UserData
def registered_user(user_db, username: str):
    if username in user_db:
        user_dict = user_db[username]
        return UserInDB(**user_dict)
    return False


# Authenticate User Credentials
def authenticate_user(user_db, username: str, password: str):
    # Search user on DataBase
    user = registered_user(user_db, username)
    if not user:
        # If user not exist
        return False
    if not verify_password(password, user.hashed_password):
        # if users password not matched
        return False
    # If an authentic user
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=2)

    to_encode.update({"exp": expire})
    encode_jwt = jwt.encode(to_encode, SECRET_KEY, ALGORITHM)
    return encode_jwt

# Return Requested User if Authorized
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
       credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authorized",
            headers={"WWW-Authenticated": "bearer"}
       )
       try:
           payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
           username = payload.get("sub")
           if username is None:
               raise credentials_exception
           token_data = TokenData(username=username)
       except InvalidTokenError:
           raise credentials_exception
       user = registered_user(user_manager(), username=token_data.username)
       if user is None:
           raise credentials_exception
       return user

# Return Current User Active or Not
async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive User")
    return current_user


@auth_router.post('/new/user')
async def new_user(new_user_data: NewUser):
    if new_user_data.username in user_manager():
        raise HTTPException(status_code=409, detail="Pick Another Username")

    # make dict of row data
    new_user_data_dict = new_user_data.model_dump()

    # add current date
    new_user_data_dict["created_at"] = str(date.today())

    try:
        # Making Hashed Password
        hashed_password = password_hashing(new_user_data.hashed_password)

        # change str password to hash password
        new_user_data_dict["hashed_password"] = hashed_password

        # insert new user
        new_user_insertion = user_collection.insert_one(new_user_data_dict)

        if new_user_insertion.acknowledged:
            return JSONResponse(content=f'User {new_user_data_dict["name"]} Added Successfully!', status_code=203)


    except Exception as e:
        raise HTTPException(status_code=400, detail=f'User {new_user_data_dict["name"]} not added!\nError: {e}')


@auth_router.get("/all/users")
async def all_users(current_user: Annotated[User, Depends(get_current_active_user)]):
    try:
        allusers = user_manager()
        return JSONResponse(status_code=200, content=allusers)

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")


@auth_router.post("/token")
async def user_login(login_credentials: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = authenticate_user(user_manager(), login_credentials.username, login_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token =  create_access_token(
        data= {"sub": user.username}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type='bearer')



@auth_router.get("/user/me")
async def read_user(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user
