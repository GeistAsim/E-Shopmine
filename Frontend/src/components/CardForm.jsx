import React from 'react'
import { useContext } from 'react';
import { MdModeEdit } from "react-icons/md";
import { ContainerContext } from '../Context/context';
import { useNavigate } from 'react-router-dom';
import { Notification } from './Notification';

export const CardForm = () => {
    const { API_Connect, oldData, setoldData, access_token, notification, setNotification } = useContext(ContainerContext)

    // home page pointer
    const navigate = useNavigate();
    const handleRoute = () => {
        navigate(`/`)
    }


    // track form field Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setoldData({ ...oldData, [name]: value });
    };


    // Handle form submition
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // post data 
            let res = await fetch(`${API_Connect}/post/update`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oldData)
            })

            if (!res.ok) {
                setNotification({
                    ...notification,
                    "is_error": true,
                    "status_code": res.status,
                    "message": res.statusText
                })
                throw new Error(`Log at ID ${oldData.id} not updated!`)
            }

            let newData = await res.json()

            // back to home page
            handleRoute()

            return newData


        }
        catch (err) {
            console.error(`Error in Updating error: ${err}`)
        }
    };

    if (notification.is_error) {
        return <Notification />
    }


    return (
        <>
            {/* Swapped standard div for a form element, kept the same class */}
            <form className="service-card update-form" onSubmit={handleSubmit} autoComplete='off'>

                <h1 className='updateform-heading'>
                    Update logs Details
                    <MdModeEdit />
                </h1>
                <div className="card-header update-card-header">
                    <div className="update-header form-group">

                        {/* Input taking the place of the h3 heading */}
                        <span className="user-id form-group data-row">Update log ID</span>
                        <input
                            type="text"
                            name="id"
                            className="user-name card-input"
                            placeholder="Enter ID"
                            value={oldData.id}
                            onChange={handleChange}
                            disabled
                            required
                        />
                    </div>
                    <div className="update-header form-group">
                        {/* Input taking the place of the h3 heading */}
                        <span className="user-id form-group data-row">Enter Name</span>
                        <input
                            type="text"
                            name="Name"
                            className="user-name card-input"
                            placeholder="Enter Name"
                            value={oldData.Name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="card-body updateform-body">
                    <div className="details">
                        <div className="data-row form-group">
                            <span className="label">Contact</span>
                            <input type="text" name="Contact" className="value card-input" placeholder="e.g. 9876543210" value={oldData.Contact} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group">
                            <span className="label">Service</span>
                            <input type="text" name="Service" className="value card-input" placeholder="Service Name" value={oldData.Service} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group">
                            <span className="label">Service Type</span>
                            <input type="text" name="Service_Type" className="value card-input" placeholder="Type" value={oldData.Service_Type} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group">
                            <span className="label">Month</span>
                            <input type="text" name="Month" className="value card-input" placeholder="Month" value={oldData.Month} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group">
                            <span className="label">Created_At</span>
                            <input type="text" name="Created_At" className="value card-input" placeholder="YYYY-MM-DD" value={oldData.Created_At} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group">
                            <span className="label">Application ID</span>
                            <input type="text" name="Application_ID" className="value card-input" placeholder="App ID" value={oldData.Application_ID} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="financials">
                        <div className="data-row form-group">
                            <span className="label">Govt Fee (₹)</span>
                            <input type="number" name="Govt_Fee" className="value card-input" placeholder="0" value={oldData.Govt_Fee} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group">
                            <span className="label">Service Fee (₹)</span>
                            <input type="number" name="Service_Charge" className="value card-input" placeholder="0" value={oldData.Service_Charge} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group total-row">
                            <span className="label">Total Fee</span>
                            <input type="number" name="Total_Amount" className="value card-input" placeholder="0" value={oldData.Total_Amount} onChange={handleChange} />
                        </div>
                        <div className="data-row form-group due-row">
                            <span className="label">Due Amount</span>
                            <input type="number" name="Due" className="value card-input" placeholder="0" value={oldData.Due} onChange={handleChange} />
                        </div>
                    </div>

                </div>
                {/* Inline styled button to fit the card bottom natively */}
                <button type="submit" className='update-form-btn btn submit-btn'>
                    Update Log
                </button>
                <div className='update-form-btn cancel-btn' onClick={() => (handleRoute())}>
                    Cancel
                </div>
            </form>
        </>
    )
}
