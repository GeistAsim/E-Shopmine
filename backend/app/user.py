from fastapi import APIRouter
from typing import Annotated
from datetime import timedelta
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm 
from app.schema.schema import Token, User, NewUser 
from app.auth import UserAuth


# User Authentication Router
auth_router = APIRouter()

# User Authentication and Authorization
user_auth_core = UserAuth()


# Return Current User Active or Not and Super user or not
async def get_current_active_user(current_user: Annotated[User, Depends(user_auth_core.get_current_user)]):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive User")
    return current_user


#Create a new token on login
@auth_router.post("/token")
async def user_login(login_credentials: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = user_auth_core.authenticate_user(login_credentials.username, login_credentials.password)
    admin = False
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token_expires = timedelta(minutes=user_auth_core.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token =  user_auth_core.create_access_token(
        data= {"sub": user.username, "admin": admin}, expires_delta=access_token_expires
    )

    return Token(admin=admin, access_token=access_token, token_type='bearer')


# Send fresh token to user stay login
@auth_router.get("/refresh/token")
async def refresh_token(current_user: Annotated[User, Depends(user_auth_core.decode_token)]) -> Token:
    try:
        if current_user.username:
            user = current_user.username
            if user is not None:
                refresh_token = user_auth_core.refresh_access_token(username=user, admin=current_user.admin)
                return JSONResponse(status_code=201, content=refresh_token.model_dump())
        else:
            return JSONResponse(status_code=200, content={"admin": current_user.admin, "token": "Previous Token is Valid!!!"})
    
    except Exception as e:
        raise HTTPException(status_code=400, detail="Bad Request!!!")


# Switch User role between Normal and Admin
@auth_router.get("/switch/user/role")
async def switch_user_role(switch_to_admin_user: Annotated[User, Depends(user_auth_core.switch_role)]) -> Token:
    return switch_to_admin_user


# Post new User
@auth_router.post('/new/user')
async def new_user(new_user_data: NewUser):
    if new_user_data.username in self.user_manager():
        raise HTTPException(status_code=409, detail="Pick Another Username")

    # make dict of row data
    new_user_data_dict = new_user_data.model_dump()

    # add current date
    new_user_data_dict["created_at"] = str(date.today())

    # New user data collection name
    new_user_data_dict["data_collection"] = new_user_data_dict["username"]
    
    # set disabled and super
    new_user_data_dict["disabled"] = True
    new_user_data_dict["super"] = False

    try:
        # Making Hashed Password
        hashed_password = password_hashing(new_user_data.hashed_password)

        # change str password to hash password
        new_user_data_dict["hashed_password"] = hashed_password

        # insert new user
        new_user_insertion = user_collection.insert_one(new_user_data_dict)

        if new_user_insertion.acknowledged:
            return JSONResponse(content=f'User {new_user_data_dict["name"]} Added Successfully!', status_code=201)


    except Exception as e:
        raise HTTPException(status_code=400, detail=f'User {new_user_data_dict["name"]} not added!\nError: {e}')


# Get all users
@auth_router.get("/all/users")
async def all_users(current_user: Annotated[User, Depends(get_current_active_user)]):
    if not current_user.admin:
        raise HTTPException(status_code=405, detail="You are not allowed for this method!!!")

    try:
        allusers = user_auth_core.user_manager()
        return JSONResponse(status_code=200, content=allusers)

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")


# Get current login user
@auth_router.get("/user/me")
async def read_user(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user
