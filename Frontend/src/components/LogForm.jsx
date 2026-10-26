import React, { use } from 'react'
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { ContainerContext } from '../Context/context';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form'
import { Notification } from './Notification';

export const LogForm = () => {

    const { API_Connect, access_token, oldData, setoldData, notification, setNotification, setLoading } = useContext(ContainerContext);

    const { handleSubmit, formState: { isSubmitting } } = useForm();

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
        Govt_Fee: 0,
        Service_Charge: 0,
        //Total_Amount: '',
        Created_At: 'Default',
        Application_ID: 'NA',
        Due: 0
    });

    useEffect(() => {
        if (window.location.pathname === '/update/log') {
            setFormData(oldData);
        }
    }, [])
    
    
    // track form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        //if (window.location.pathname === '/new/post') {
            setFormData({
                ...formData,
                [name]: value
            });

        //} else if (window.location.pathname === '/update/log') {
        //    setoldData(oldData);
        //} 
    };


    async function new_post() {
        //data.preventDefault();

        delete formData.Total_Amount
        // API call here
        try {
            setLoading(true);
            // POST data
            const res = await fetch(`${API_Connect}/post`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(formData)

            })
            
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

            setNotification({
                ...notification,
                show: true,
                is_error: false,
                status_code: "Success",
                message: "Transaction added successfully"
            });

            // back to home page
            handleRoute()

            return post_res
        }
        catch (err) {
            console.error(`Error Occure in Posting Form with error code ${err}`)
        }
        finally {
            setLoading(false);
        }

    }

    async function update_post() {
         //e.preventDefault();
        delete formData.Total_Amount
        delete formData.user_id

        try {
            setLoading(true);
            // post data 
            let res = await fetch(`${API_Connect}/post/update`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
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

            setNotification({
                ...notification,
                show: true,
                is_error: false,
                status_code: "Success",
                message: "Transaction updated successfully"
            });

            // back to home page
            handleRoute()

            return newData


        }
        catch (err) {
            console.error(`Error in Updating error: ${err}`)
        }
        finally {
            setLoading(false)
        }
 
    }


    // handle form submition
    const handle_Submit = async (data) => {
        if (window.location.pathname === '/new/post') {
            return await new_post();
        } else if (window.location.pathname === '/update/log') {
            return await update_post();
        }
    };

    return (<>
        <div className="form-page-wrapper">
            <div className="form-card">
                
                <div className="form-header-new">
                    <div className="form-header-title-group">
                        <div className="form-header-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </div>
                        {window.location.pathname === '/new/post' ? (
                            <div>
                                <h2>New Transaction</h2>
                                <p>Fill in the details below</p>
                            </div>
                        ) : (
                        window.location.pathname === '/update/log' ? (
                            <div>
                                <h2>Edit Transaction</h2>
                                <p>Update transaction details</p>
                            </div>
                        ) : null
                        )}
                    </div>
                    <button type="button" className="form-close-btn" onClick={handleRoute}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form className="form-body-new" onSubmit={handleSubmit(handle_Submit)} autoComplete='off'>
                    
                    <section className="form-section">
                        <div className="section-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>Client Information</span>
                            <div className="section-label-divider"></div>
                        </div>
                        <div className="form-grid">
                            {window.location.pathname === '/update/log' ? (
                            <div className="form-field full">
                                <label htmlFor="id">Log ID</label>
                                <input type="text" id="id" name="id" className="form-input" value={oldData.id} onChange={handleChange} placeholder="Enter ID" disabled required />
                            </div>
                            ) : null}
                            <div className="form-field full">
                                <label htmlFor="Name">Full Name</label>
                                <input type="text" id="Name" name="Name" className="form-input" value={formData.Name} onChange={handleChange} placeholder="e.g. Mehmed Khan" required />
                            </div>
                            <div className="form-field full">
                                <label htmlFor="Contact">Contact No.</label>
                                <input type="text" id="Contact" name="Contact" className="form-input" value={formData.Contact} onChange={handleChange} placeholder="e.g. 7598421562" required />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="section-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l8.29-8.29c.94-.94.94-2.48 0-3.42L12 2Z"/>
                                <path d="M7 7h.01"/>
                            </svg>
                            <span>Service Details</span>
                            <div className="section-label-divider"></div>
                        </div>
                        <div className="form-grid">
                            <div className="form-field">
                                <label htmlFor="Service">Service</label>
                                <input type="text" id="Service" name="Service" className="form-input" value={formData.Service} onChange={handleChange} placeholder="e.g. Passport" required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="Service_Type">Service Type</label>
                                <input type="text" id="Service_Type" name="Service_Type" className="form-input" value={formData.Service_Type} onChange={handleChange} placeholder="e.g. New" required />
                            </div>
                            <div className="form-field full">
                                <label htmlFor="Application_ID">Application ID</label>
                                <input type="text" id="Application_ID" name="Application_ID" className="form-input" value={formData.Application_ID} onChange={handleChange} placeholder="e.g. ABC-458-DEF-96321" style={{fontFamily: "monospace"}} />
                            </div>
                            <div className="form-field full">
                                <label htmlFor="Created_At">Created At</label>
                                <input type="text" id="Created_At" name="Created_At" className="form-input" value={formData.Created_At} onChange={handleChange} placeholder="YYYY-MM-DD" required />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="section-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
                            </svg>
                            <span>Financial Details</span>
                            <div className="section-label-divider"></div>
                        </div>
                        <div className="form-grid">
                            <div className="form-field">
                                <label htmlFor="Govt_Fee">Govt Fee (₹)</label>
                                <input type="number" id="Govt_Fee" name="Govt_Fee" className="form-input" value={formData.Govt_Fee} onChange={handleChange} placeholder="0" />
                            </div>
                            <div className="form-field">
                                <label htmlFor="Service_Charge">Service Charge (₹)</label>
                                <input type="number" id="Service_Charge" name="Service_Charge" className="form-input" value={formData.Service_Charge} onChange={handleChange} placeholder="0" />
                            </div>
                            
                            <div className="total-amount-box">
                                <div className="total-amount-label">
                                    <svg style={{color: "#3a6aaf"}} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                                    </svg>
                                    <span>Total Amount</span>
                                </div>
                                <span className="total-amount-value">₹{(Number(formData.Govt_Fee) || 0) + (Number(formData.Service_Charge) || 0)}</span>
                            </div>

                            <div className="form-field">
                                <label htmlFor="Due">Due Amount (₹)</label>
                                <input type="number" id="Due" name="Due" className="form-input form-due" value={formData.Due} onChange={handleChange} placeholder="0" />
                            </div>
                        </div>
                    </section>

                    <div className="form-actions-new">
                        <button type="button" className="btn-cancel" onClick={handleRoute}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-save">{window.location.pathname === '/new/post' ? "Create Transaction" : "Save Changes" }</button>
                    </div>
                </form>

            </div>
        </div>
    </>)
}
