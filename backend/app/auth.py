from datetime import datetime, timedelta, timezone, date
from typing import Annotated
import jwt
import os
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from dotenv import load_dotenv
from app.model.model import all_users_entitys
from app.schema.schema import Token, TokenData, User, UserInDB, NewUser, LoginRequest, RefreshTokenData
from app.databases.mongo import conn

# DataBase Table Selection
# user_table = 'users' if int(os.getenv("SERVER_PORT")) == 8181 else 'test_user'
user_collection = conn.Shop.users


# Load Secrets
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


# Authentication schema
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



# User Authentication & Authorization Core
class UserAuth:
    def __init__(self):
        self.__SECRET_KEY = SECRET_KEY
        self._ALGORITHM = ALGORITHM
        self.ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES

        # Hashed Password Instance
        self.password_hashed = PasswordHash.recommended()

        self.credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authorized",
            headers={"WWW-Authenticated": "bearer"}
        )



    # Password Hashing for DB
    def password_hashing(self, password):
        Password_Hashed_Key = self.password_hashed.hash(password)
        return Password_Hashed_Key



    # All Users Dict list
    def user_manager(self, username: str = None):
        try:
            if username is not None:
                # find requested user
                user = user_collection.find({"username": username})
                
                # User dict
                user_dict = all_users_entitys(user)

                if len(user_dict) != 1:
                    return None

                else:
                    # Return only first user
                    return user_dict[0]


            elif username is None:
                # get all users
                users_list = user_collection.find({})

                # list of all users
                All_Users = all_users_entitys(users_list)

                # Dict of user by username
                All_Users_Dict = {}

                for one in All_Users:
                    All_Users_Dict.update({one["username"]: one})

                return All_Users_Dict
        
        except Exception as e:
            raise Exception(f"Something went wrong! {e}")


    # Varify user password
    def verify_password(self, plain_password, hashed_password):
        return self.password_hashed.verify(plain_password, hashed_password)

    # convert user password to hashed password for verification
    def get_password_hashed(self, password):
        return self.password_hashed.hash(password)

    # is user registered or not
    def is_registered_user(self, username: str, admin: bool = False):
        user_db = self.user_manager(username)

        # Return False if user not found!!
        if user_db is None:
            return False

        if username in user_db["username"]:
            user_dict = user_db
            user_dict["admin"] = admin
            return UserInDB(**user_dict)
        return False


    # Authenticate User Credentials
    def authenticate_user(self, username: str, password: str):
        # Search user on DataBase
        user = self.is_registered_user(username)
        if not user:
            # If user not exist
            return False
        if not self.verify_password(password, user.hashed_password):
            # if users password not matched
            return False
        # If an authentic user
        return user


    def has_admin(self, user):
        if user.super and not user.disabled:
            return True
        return False


    # Create a new Token
    def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=2)

        to_encode.update({"exp": expire})
        encode_jwt = jwt.encode(to_encode, self.__SECRET_KEY, self._ALGORITHM)
        return encode_jwt


    # Change User Privilege
    def switch_role(self, token: Annotated[str, Depends(oauth2_scheme)]):
        try:
            payload = jwt.decode(token, self.__SECRET_KEY, algorithms=[self._ALGORITHM])
            username = payload.get("sub")
            admin = payload.get("admin")

            if username is None:
                raise self.credentials_exception

            user = self.is_registered_user(username=username, admin=admin)

            access_token_expires = timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)

            if not admin and self.has_admin(user):
                new_token = self.create_access_token(
                    data={"sub": username, "admin": True}, expires_delta=access_token_expires
                )
                return JSONResponse(content={"admin": True, "token": new_token}, status_code=201)

            elif admin and self.has_admin(user):
                new_token = self.create_access_token(
                    data={"sub": username, "admin": False}, expires_delta=access_token_expires
                )
                return JSONResponse(content={"admin": False, "token": new_token}, status_code=201)

            elif not has_admin(user):
                raise HTTPException(status_code=403, detail="You are not Allow as Admin!!!") 

        except InvalidTokenError as e:
            raise self.credentials_exception
            


    # Decode current token and return user for generating new fresh token with extened expiration time
    def decode_token(self, token: Annotated[str, Depends(oauth2_scheme)]):
        current_time_stamp = int(datetime.now(timezone.utc).timestamp())
        try:
            payload = jwt.decode(token, self.__SECRET_KEY, algorithms=[self._ALGORITHM], options={"verify_exp": False})
            username = payload.get("sub")
            admin = payload.get("admin")
            expiration_time = payload.get("exp")

            if expiration_time < current_time_stamp and expiration_time:
                token_data = RefreshTokenData(username=username, admin=admin)
                return token_data

            else:
                previous_token = RefreshTokenData(token=token, admin=admin)
                return previous_token

        except InvalidTokenError as e:
            raise self.credentials_exception


    # Refresh token with extened expiration time
    def refresh_access_token(self, username: str | None = None, admin: bool = False) -> Token:
        try:
            if username is None:
                raise self.credentials_exception

            refresh_token_expiration_time = timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
            refresh_access_token = self.create_access_token(
                data={"sub": username, "admin": admin}, expires_delta=refresh_token_expiration_time
            )
            
            return Token(admin=admin, access_token=refresh_access_token, token_type="bearer")
        
        except:
            raise self.credentials_exception



    # Return Requested User if Authorized
    async def get_current_user(self, token: Annotated[str, Depends(oauth2_scheme)]):        
        try:
            payload = jwt.decode(token, self.__SECRET_KEY, algorithms=[self._ALGORITHM], options={"verify_exp": True})
            username = payload.get("sub")
            admin = payload.get("admin")

            if username is None:
                raise self.credentials_exception 

            token_data = TokenData(username=username, admin=admin)

        except InvalidTokenError as e:
            if str(e) == "Signature has expired":
                #decode_token(token)
                raise HTTPException(status_code=400, detail="Token has expired!!!")

            raise self.credentials_exception

        user = self.is_registered_user(username=token_data.username, admin=token_data.admin)

        if user is None:
            raise self.credentials_exception

        return user
