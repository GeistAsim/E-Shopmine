import os
import datetime
from typing import Annotated
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bson import ObjectId
from dotenv import load_dotenv
from app.databases.crud import Crud 
from app.schema.schema import CreateLog, UpdateLog, UpdateDue, DocumentID, User
from app.auth import auth_router, get_current_active_user
from app.func.func import Func

load_dotenv()

# fetch know urls
self_connect = os.getenv("self_connect")
local_connect = os.getenv("local_connect")
global_connect = os.getenv("global_connect")

app = FastAPI()
app.include_router(auth_router)

# Current Active User Dependency for methods
current_active_user = Annotated[User, Depends(get_current_active_user)]

# Data Cluster
data_cluster = 'Shop'

# origins
origins = [
    self_connect,
    local_connect,
    global_connect
]

# make a bridge connection between frontend and admin <---> backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# User Session
@app.get("/user/session")
def user_session(current_user: current_active_user):
    if current_user:
        return {"super": current_user.admin, "active_user": True}
    return False


@app.get("/home")
def get_logs(current_user: current_active_user):
    # CRUD operations instance
    CRUD = Crud(user=current_user, data_cluster=data_cluster)
    result = CRUD.all_posts()

    if not result:
        raise HTTPException(status_code=404, detail="Data Not Found!")

    return JSONResponse(content=result[::-1], status_code=200)



@app.post("/post", response_model=CreateLog)
async def post_log(row: CreateLog, current_user: current_active_user):
     # Only super user can do this
    if not current_user.admin:
        raise HTTPException(status_code=405, detail="You are not allow for this operation!")

    # Make dict of row data
    new_doc_dict = row.model_dump() 

    # Get date
    doc_date = str(datetime.date.today()) if row.Created_At.title() == 'Default' else row.Created_At
    # update date value
    new_doc_dict["Created_At"] = doc_date

    #set month by default
    current_date = datetime.date.today()
    current_month = current_date.strftime("%b%y")
    new_doc_dict["Month"] = current_month 

    # calculate total amount
    total_amount = new_doc_dict["Govt_Fee"] + new_doc_dict["Service_Charge"]
    new_doc_dict["Total_Amount"] = total_amount

    try:
        # Insert New Doc
        CRUD = Crud(user=current_user, data_cluster=data_cluster)
        post = CRUD.new_post(new_doc_dict)

        return JSONResponse(content=f"Insertion Done Successfully!", status_code=201)
    
    # Error in method execution
    except Exception as e:
        raise HTTPException(detail=f"Insertion Failed! error {e}", status_code=500)



@app.put("/post/update")
async def update_log(row: UpdateLog, current_user: current_active_user):
    # Only super user can do this
    if not current_user.admin:
        raise HTTPException(status_code=405, detail="You are not allow for this operation!")

    # Make dict of row data
    updated_doc_dict = row.model_dump()
    # Get date
    doc_date = str(datetime.date.today()) if row.Created_At.title() == 'Default' else row.Created_At
    # update date value
    updated_doc_dict["Created_At"] = doc_date

    # calculate total amount
    total_amount = updated_doc_dict["Govt_Fee"] + updated_doc_dict["Service_Charge"]
    updated_doc_dict["Total_Amount"] = total_amount

    try:
        # Update Document
        CRUD = Crud(user=current_user, data_cluster=data_cluster)
        update_result = CRUD.update_post(updated_doc_dict)
        if update_result:
            return JSONResponse(content="Document Update Successfully", status_code=200)

        # if document not found
        else:
            raise HTTPException(status_code=404, detail="Post not found!!!")

    # Error in method execution
    except Exception as e:
        raise HTTPException(detail=f"Couldn't able to update document due to: {e}", status_code=400)



@app.get("/search/post/{query}")
async def search_row(query, current_user: current_active_user):
    try:        
        CRUD = Crud(user=current_user, data_cluster=data_cluster)
        search_result = CRUD.search_posts(query)
        # If no results found, return a formatted 404 message
        if not search_result:
            return JSONResponse(content=f"Not Found {query}", status_code=404)
            
        return JSONResponse(content=search_result[::-1], status_code=200)
        
    except Exception as e:
        raise HTTPException(detail=f"Search failed: {str(e)}", status_code=500)


@app.delete("/delete/post")
def delete_log(row: DocumentID, current_user: current_active_user):
    # Only super user can do this
    if not current_user.admin:
        raise HTTPException(status_code=405, detail="You are not allow for this operation!") 

    # Post ID
    post_data = row.model_dump()
    post_id = post_data["id"]

    try:
        CRUD = Crud(user=current_user, data_cluster=data_cluster)
        delete_result = CRUD.delete_post(post_id)
        if delete_result:
            return JSONResponse(content=f"Document delete successfully!", status_code=200)

        # if document not found
        else:
            raise HTTPException(status_code=404, detail="Document Not Found!")
    # Error in method execution
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


# Delete all data
@app.delete("/delete/all")
async def delete_all_log(current_user: current_active_user):
    # Only super user can do this
    if not current_user.admin:
        raise HTTPException(status_code=405, detail="You are not allow for this operation!")


    try:
        CRUD = Crud(user=current_user, data_cluster=data_cluster)
        return JSONResponse(content="All documents deleted successfully")
    except Exception as e:
        raise HTTPException(detail=f"Error: {e}", status_code=400)




# Summary Points
@app.get("/finance/summary")
def get_previous(current_user: current_active_user):
    # Only super user can do this
    if not current_user.admin:
        raise HTTPException(status_code=405, detail="You are not allow for this operation!")

    CRUD = Crud(user=current_user, data_cluster=data_cluster)
    collection = CRUD.get_collection_name()
    
    month_filter = Func(current_user.admin, collection)
    current_month_value = month_filter.finance_summary(summary_duration="current")
    previous_month_value = month_filter.finance_summary(summary_duration="previous")
    all_value = month_filter.finance_summary()

    summary_list = [current_month_value, previous_month_value, all_value]

    return JSONResponse(status_code=200, content=summary_list)
