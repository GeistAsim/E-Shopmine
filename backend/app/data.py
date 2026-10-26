from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from typing import Annotated
from app.databases.crud import Crud
from app.auth import UserAuth
from app.schema.schema import User

data_router = APIRouter()

auth = UserAuth()

credentials_exception = HTTPException(
    status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
    detail="Not Authorized",
    headers={"WWW-Authenticated": "bearer"}
)



@data_router.get("/csv")
def data_extraction(current_user: Annotated[User, Depends(auth.get_current_user)]):
    if current_user.admin:
        edata = Crud(user=current_user, data_cluster='Shop')
        data = edata.export_csv()
        return data
    else:
        raise credentials_exception
