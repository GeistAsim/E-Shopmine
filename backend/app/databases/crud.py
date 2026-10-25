from bson import ObjectId
import re
import datetime
from app.databases.mongo import conn
from app.model.model import super_home_entitys, home_entitys
import pandas as pd

class Crud:
    def __init__(self, user, data_cluster):
        """
        Initial Arguments:
            user: Current User data class.
            data_cluster: Name of the MongoDB Cluster for operations.
        """
        self.user = user
        self.data_cluster = data_cluster


    def get_collection_name(self):
        """
        Return the Collection Name for the Current User.
        """
        db = conn[self.data_cluster]
        collection = db[self.user.data_collection]
        return collection


    def get_home_entitys_by_user_role(self, mongo_data):
        """
        Return the MongoDb Data into a simple list.
        Parameter:
            mongo_data: Row MongoDB data
        """
        if self.user.admin:
            return super_home_entitys(mongo_data)
    
        if not self.user.admin:
            return home_entitys(mongo_data)

        return None


    def get_month(self, new_date=None) -> str:
        #set month by default
        current_date = datetime.date.today() 

        if new_date is not None:
            current_date = datetime.datetime.strptime(new_date, "%Y-%m-%d").date()

        current_month = current_date.strftime("%b%y")
        return current_month

   
    def all_posts(self):
        """
        Return all the posts store in the database collection
        """ 
        docs = self.get_collection_name().find().sort({ "id": -1 }).limit(50)
        result = self.get_home_entitys_by_user_role(docs)
        return result


    def post_unique_id(self, post_id):
        """
        Return post's unique MongoDB ObjectId
        Parameter:
            post_id: Post simple ID string
        """
        return ObjectId(post_id)


    def single_post(self, post_id):
        """
        Return the single post by it's unique ID.
        Parameter:
            post_id: Post simple ID string
        """
        post_objectID = self.post_unique_id(post_id)
        post = self.get_collection_name().find_one({"_id": post_objectID})
        return post


    def new_post(self, post_data):
        """
        Return new post in database collection
        Parameter:
            post_data: Dict of new post data
        """
        post_data["Month"] = self.get_month()

        post = self.get_collection_name().insert_one(post_data)
        return post


    def update_post(self, updated_data):
        """
        Update post if it is available in the database.
        Parameter:
            updated_data: Dict of the updated data
        """
        has_post = self.single_post(updated_data["id"])
        if has_post is not None:
            print(updated_data["Created_At"])
            updated_data["Month"] = self.get_month(new_date=updated_data["Created_At"])
            post_objectID = self.post_unique_id(updated_data["id"])
            post = self.get_collection_name().update_one({"_id": post_objectID}, {"$set": updated_data})
            return post
        else:
            return False

    
    def delete_post(self, post_id):
        """
        Delete a post if it is available in the database
        Parameter:
            post_id: Post's simple ID string
        """
        has_post = self.single_post(post_id)
        if has_post is not None:
            post_objectID = self.post_unique_id(post_id)
            delete_post = self.get_collection_name().delete_one({"_id": post_objectID})
            return delete_post
        else:
            return False
    

    def delete_all_post(self):
        """
        Delete all pots of collection
        """
        delete_all = self.get_collection_name().delete_many({})
        return delete_all


    def search_posts(self, query):
        """
        Return requested post.
        Parameter:
            query: User's search query
        """
        clean_query = query.replace('+', ' ').strip()
        escaped_query = re.escape(clean_query)
        
        or_conditions = []
        
        # Check if the query is a valid 24-character hexadecimal ObjectId
        if len(clean_query) == 24 and all(c in "0123456789abcdefABCDEF" for c in clean_query):
            or_conditions.append({"_id": self.post_unique_id(clean_query)})

        if clean_query.lower() == 'due':
            or_conditions.append({"Due": {"$gt": 0} })
            
        # Substring case-insensitive matches on text fields
        search_fields = ["Name", "Contact", "Application_ID", "Service", "Service_Type", "Month"]
        for field in search_fields:
            or_conditions.append({field: {"$regex": escaped_query, "$options": "i"}})
            
        # Query MongoDB
        data = self.get_collection_name().find({"$or": or_conditions})
        
        # Map results
        rows = self.get_home_entitys_by_user_role(data)
        return rows

    def extraction(self):
        cdata = self.get_collection_name().find()
        xdata = super_home_entitys(cdata)
        data = []
        for i in xdata:
            new_dict = i.pop("id", None)
            data.append(i)
        df = pd.DataFrame(data)
        df.to_csv('extracted.csv', index=False)
        return "extracted.csv"
