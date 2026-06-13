import React, { use } from 'react'
import { useState } from 'react';
import { useContext } from 'react';
import { ContainerContext } from '../Context/context';
import { useNavigate } from 'react-router-dom';
import { Notification } from './Notification';

export const LogForm = () => {

    const { API_Connect, access_token, notification, setNotification } = useContext(ContainerContext);

    const navigate = useNavigate();
    const handleRoute = () => {
        navigate(`/`)
    }


    // Form field data titles
    const [formData, setFormData] = useState({
        Name: '',
        Contact: '',
        Service: '',
        Service_Type: '',
        Govt_Fee: '',
        Service_Charge: '',
        Total_Amount: '',
        Month: '',
        Created_At: 'Default',
        Application_ID: 'NA',
        Due: ''
    });


    // track form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };


    // handle form submition
    const handleSubmit = async (data) => {
        data.preventDefault();

        // API call here
        try {
            // POST data
            const res = await fetch(`${API_Connect}/post`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(formData)

            })
            console.log(res)
            if (!res.ok) {
                setNotification({
                    ...notification,
                    "is_error": true,
                    "status_code": res.status,
                    "message": res.statusText
                });
                throw new Error("post request failed!")
            }
            let post_res = await res.json()

            // back to home page
            handleRoute()

            return post_res
        }
        catch (err) {
            console.error(`Error Occure in Posting Form with error code ${err}`)
        }

    };

    if (notification.is_error) {
        return <Notification />
    }

    return (<>
        <div className={`form-page-container`}>
            <form className="theme-form" onSubmit={handleSubmit} autoComplete='off'>
                <div className="form-header">
                    <h2>Add New Log</h2>
                    <p>Enter the service details below.</p>
                </div>

                <div className="form-grid">
                    {/* Text Inputs */}
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" name="Name" value={formData.Name} onChange={handleChange} placeholder='Name' required />
                    </div>

                    <div className="form-group">
                        <label>Contact</label>
                        <input type="text" name="Contact" value={formData.Contact} onChange={handleChange} placeholder='1234567890' required />
                    </div>

                    <div className="form-group">
                        <label>Service</label>
                        <input type="text" name="Service" value={formData.Service} onChange={handleChange} placeholder='Service' required />
                    </div>

                    <div className="form-group">
                        <label>Service Type</label>
                        <input type="text" name="Service_Type" value={formData.Service_Type} onChange={handleChange} placeholder='Service Type' required />
                    </div>

                    <div className="form-group">
                        <label>Month</label>
                        {/* Could also be type="month" depending on your needs */}
                        <input type="text" name="Month" value={formData.Month} onChange={handleChange} placeholder="e.g. Jan26" required />
                    </div>

                    <div className="form-group">
                        <label>Created At</label>
                        <input type="text" name="Created_At" value={formData.Created_At} onChange={handleChange} placeholder='e.g. YYYY-MM-DD' required />
                    </div>

                    <div className="form-group full-width">
                        <label>Application ID</label>
                        <input type="text" name="Application_ID" value={formData.Application_ID} onChange={handleChange} placeholder='Application no.' />
                    </div>

                    {/* Financial/Integer Inputs */}
                    <div className="form-group">
                        <label>Govt Fee</label>
                        <input type="number" name="Govt_Fee" value={formData.Govt_Fee} onChange={handleChange} placeholder='0' />
                    </div>

                    <div className="form-group">
                        <label>Service Charge</label>
                        <input type="number" name="Service_Charge" value={formData.Service_Charge} onChange={handleChange} placeholder='0' />
                    </div>

                    <div className="form-group">
                        <label>Total Amount</label>
                        <input type="number" name="Total_Amount" value={formData.Total_Amount} onChange={handleChange} placeholder='0' />
                    </div>

                    <div className="form-group due-row">
                        <label>Due</label>
                        <input type="number" name="Due" value={formData.Due} onChange={handleChange} placeholder='0' className='value' />
                    </div>
                </div>

                {/* <div className=""> */}
                <div className="form-actions btn">
                    <button type="submit" className="submit-btn btn">Save Log</button>
                </div>
                <div className="form-actions btn">
                    <button onClick={() => (handleRoute())} type="submit" className="submit-btn btn cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    </>)
}
