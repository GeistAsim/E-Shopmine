import datetime
from dateutil.relativedelta import relativedelta
import uuid
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from app.model.model import finance_filter_entitys
from app.databases.crud import Crud


class Func(Crud):
    def __init__(self, user):
        super().__init__(user)

    def get_filtered_month(self, previous=False):
        current_date = datetime.date.today()
        filter_month = current_date.strftime("%b%y")        
        if previous:
            first_day_of_current_month = current_date.replace(day=1)
            previous_month = first_day_of_current_month - relativedelta(months=1)
            filter_month = previous_month.strftime("%b%y")
        return filter_month


    def finance_summary(self, summary_duration=""):
        finance_summary_block = {
            "id": "",
            "Month": "",
            "Govt_Fee": 0,
            "Service_Charge": 0,
            "Total_Amount": 0,
            "Due": 0
        }

        if summary_duration.lower() == "current":
            finance_summary_block["id"] = str(uuid.uuid4())
            finance_summary_block["Month"] = "Current Month"
            month_value = self.get_filtered_month()

        elif summary_duration.lower() == "previous":
            finance_summary_block["id"] = str(uuid.uuid4())
            finance_summary_block["Month"] = "Previous Month"
            month_value = self.get_filtered_month(previous=True)

        else:
            finance_summary_block["id"] = str(uuid.uuid4())
            finance_summary_block["Month"] = "All Months"
            month_value = None
 
        pipeline = []
        if month_value is not None:
            pipeline = [
                {
                    "$match": {
                        "user_id": self.user.user_id,
                        "Month": month_value
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "Govt_Fee": {"$sum": "$Govt_Fee"},
                        "Service_Charge": {"$sum": "$Service_Charge"},
                        "Total_Amount": {"$sum": "$Total_Amount"},
                        "Due": {"$sum": "$Due"}
                    }
                }
            ]
        
        elif month_value is None:
            pipeline = [
                {
                    "$match": {
                        "user_id": self.user.user_id
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "Govt_Fee": {"$sum": "$Govt_Fee"},
                        "Service_Charge": {"$sum": "$Service_Charge"},
                        "Total_Amount": {"$sum": "$Total_Amount"},
                        "Due": {"$sum": "$Due"}
                    }
                }
            ]


        try:
            # get filtered summary of financial details based on month
            rows = self.get_collection_name().aggregate(pipeline)

            if rows:
                docs = finance_filter_entitys(rows)

                # if the list is empty
                if len(docs) <= 0:
                    return finance_summary_block

                elif len(docs) > 1:
                    raise Exception("List out of range")

                # if data not found
                if not docs:
                    raise HTTPException(status_code=404, detail="Data Not Found!")

                #for doc in docs:
                finance_summary_block["Govt_Fee"] += docs[0]["Govt_Fee"]
                finance_summary_block["Service_Charge"] += docs[0]["Service_Charge"]
                finance_summary_block["Total_Amount"] += docs[0]["Total_Amount"]
                finance_summary_block["Due"] += docs[0]["Due"]

                #return JSONResponse(status_code=200, content=finance_summery_block)
                return finance_summary_block
                #return docs

            else:
                raise HTTPException(detail="Finance Details not allowed for this user!!!", status_code=401)

        except Exception as e:
            raise HTTPException(detail=f"{e}", status_code=400) 
