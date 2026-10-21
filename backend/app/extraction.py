from fastapi import APIRouter
from fastapi import Depends
from typing import Annotated
from app.databases.crud import Crud
from app.auth import UserAuth
from app.schema.schema import User

data_extraction_router = APIRouter()

auth = UserAuth()


@data_extraction_router.get("/csv")
def data_extraction(current_user: Annotated[User, Depends(auth.get_current_user)]):
    edata = Crud(user=current_user, data_cluster='Shop')
    data = edata.extraction()
    return data
