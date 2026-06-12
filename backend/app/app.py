import os
from typing import Annotated
from datetime import date
from fastapi import FastAPI, HTTPException, Depends
from  fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bson import ObjectId
from dotenv import load_dotenv
from app.databases.mongo import conn
from app.model.model import home_entitys
from app.Search.search import SimpleSearchIndex
from app.schema.schema import CreateLog, UpdateLog, UpdateDue, DocumentID
from app.auth import auth_router, get_current_active_user, User

load_dotenv()

# fetch know urls
self_connect = os.getenv("self_connect")
local_connect = os.getenv("local_connect")
global_connect = os.getenv("global_connect")

app = FastAPI()
app.include_router(auth_router)

# Current Active User Dependency for methods
current_active_user = Annotated[User, Depends(get_current_active_user)]

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

# DataBase Table Selection
# table_name = 'logs' # if int(os.getenv("SERVER_PORT")) == 8181 else 'test_table'
collection_name = conn.Shop.logs

# User Session
@app.get("/user/session")
def user_session(current_user: current_active_user):
    if current_user:
        return True
    return False


@app.get("/home")
async def get_logs(current_user: current_active_user):
    # fetch all rows
    docs = collection_name.find()
    result = home_entitys(docs)

    # if data not found
    if not result:
        raise HTTPException(status_code=404, detail="Data Not Found!")

    return JSONResponse(content=result[::-1], status_code=200)


@app.post("/post", response_model=CreateLog)
async def post_log(row: CreateLog, current_user: current_active_user):
    # Make dict of row data
    new_doc_dict = row.model_dump()
    # Get date
    doc_date = str(date.today()) if row.Created_At.title() == 'Default' else row.Created_At

    # update date value
    new_doc_dict["Created_At"] = doc_date

    try:
        # Count total no of documents
        doc_count = collection_name.count_documents({})

        # Insert New Doc
        collection_name.insert_one(new_doc_dict)
        return JSONResponse(content=f"Insertion Done Successfully!", status_code=201)

    # Error in method execution
    except Exception as e:
        return HTTPException(detail=f"Insertion Failed! With Status Code {e}", status_code=500)



@app.put("/post/update")
async def update_log(row: UpdateLog, current_user: current_active_user):
    # Make dict of row data
    updated_doc_dict = row.model_dump()
    # Get date
    doc_date = str(date.today()) if row.Created_At.title() == 'Default' else row.Created_At
    # update date value
    updated_doc_dict["Created_At"] = doc_date

    # convert string to ObjectID for mongodb compatibility
    document_id = ObjectId(updated_doc_dict["id"])

    try:
        # Get Document from Database
        get_targeted_doc = collection_name.find_one({"_id": document_id})

        # Update if Document is available
        if get_targeted_doc:
            doc_update = collection_name.update_one({"_id": document_id}, {"$set": updated_doc_dict})
            if doc_update.acknowledged:
                return JSONResponse(content="Document Update Successfully", status_code=200)
        # if document not found
        else:
            raise HTTPException(status_code=404, detail="Document not found!")

    # Error in method execution
    except Exception as e:
        raise HTTPException(detail=f"Couldn't able to update document due to: {e}", status_code=400)



@app.put("/post/UpdateDue")
async def update_due(due_row: UpdateDue, current_user: current_active_user):
    # Convert String to ObjectID for MongoDB compatibility
    document_id = ObjectId(due_row.id)
    try:
        # find document
        get_targeted_doc = collection_name.find_one({"_id": document_id})

        # update data if document is available
        if get_targeted_doc:
            doc_due_update = collection_name.update_one({"_id": document_id}, {"$set": {"Due": due_row.Due}})
            # if update data successfully
            if doc_due_update.acknowledged:
                return JSONResponse(content="Document Due Field Updated Successfully!", status_code=200)
        # if document not found
        else:
            raise HTTPException(status_code=404, detail="Document not found!")

    # Error in method execution
    except Exception as e:
        raise HTTPException(detail=f"Couldn't able to update document due to: {e}", status_code=400)


@app.get("/search/post/{query}")
async def search_row(query, current_user: current_active_user):
    try:
        # search engine
        search_engine = SimpleSearchIndex()

        # fetch all documents
        data = collection_name.find()
        rows = home_entitys(data)

        # search titles
        searchTitles = ["Name", "Contact", "Application_ID", "Service", "Service_Type", "Month"]

        # make a index, which is categorized data based on search titles
        for row in rows:
            search_engine.add_to_index(searchTitles, row)

        # search requested data from index
        filter_data = search_engine.search(query)
        return JSONResponse(content=filter_data[::-1], status_code=200)
    # Error in method execution
    except:
        raise HTTPException(detail="Not Found", status_code=404)


@app.delete("/delete/post")
async def delete_log(row: DocumentID, current_user: current_active_user):
    # make dict of row data
    delete_doc_id = row.model_dump()

    # convert str to ObjectID
    document_id = ObjectId(delete_doc_id["id"])

    try:
        # find document
        find_document = collection_name.find_one({"_id": document_id})

        # if document found delete it
        if find_document:
            delete_document = collection_name.delete_one({"_id": document_id})
            # if deletion is successful
            if delete_document.acknowledged:
                return JSONResponse(content=f"Document deleted successfully!", status_code=200)
        # if document not found
        else:
            raise HTTPException(status_code=404, detail="Document Not Found!")
    # Error in method execution
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


# For delete all data
@app.delete("/delete/all")
async def delete_all_log(current_user: current_active_user):
    try:
        delete_all = collection_name.delete_many({})
        if delete_all.acknowledged:
            return JSONResponse(content="All documents deleted successfully")
    except Exception as e:
        raise HTTPException(detail=f"Error: {r}", status_code=400)
