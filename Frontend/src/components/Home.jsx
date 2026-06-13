import React from 'react'
import { useEffect, useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { ContainerContext } from '../Context/context'
import { MdModeEdit } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { Notification } from './Notification';


export const Home = () => {

    const { API_Connect, setoldData, searchData, authorized, access_token, setAuthorized, notification, setNotification, super_user } = useContext(ContainerContext)

    const url = useLocation();
    const navigate = useNavigate();

    const [HomeData, setHomeData] = useState([])
    let showonPage = url.pathname.startsWith("/post/search/") ? searchData : HomeData

    const [delete_log_ID, setdelete_log_ID] = useState({
        id: ''
    })

    const [delete_doc, setdelete_doc] = useState(false)


    useEffect(() => {
        const api_connect = async () => {
            try {
                let res = await fetch(`${API_Connect}/home`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!res.ok || res.status === 401) {
                    console.log("Unable to connect HomeDataBase!");
                    setNotification({
                        ...notification,
                        "is_error": true,
                        "status_code": res.status,
                        "message": res.statusText
                    })
                }

                let HomeData = await res.json();
                setAuthorized(true);
                setHomeData(HomeData);
            }
            catch (err) {
                console.error(`Error Occure in Backend Connection ${err}`)
            }
        }

        api_connect();


    }, [authorized])


    const delete_log = async () => {
        try {
            let res = await fetch(`${API_Connect}/delete/post`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(delete_log_ID)
            });

            if (!res.ok) {
                setNotification({
                    ...notification,
                    "is_error": true,
                    "status_code": res.status,
                    "message": res.statusText
                })
                throw new Error("log not delete")
            };

            let delete_res = await res.json();
            setNotification({
                ...notification,
                "status_code": res.status,
                "message": res.statusText
            })
            return delete_res;
        }
        catch (err) {
            console.error(`Error: ${err}`)
        }
        finally {
            setdelete_doc(false)
            setdelete_log_ID({ id: "" })
            window.location.reload()
        }
    };

    if (delete_doc) {
        delete_log();
    };


    const handleRoute = () => {
        if (authorized) {
            navigate(`/update/log`)
        }
        else {
            navigate("/login")
        }
    }

    if (notification.is_error) {
        setTimeout(() => {
            window.location.reload()
        }, 5000);

        return <Notification />
    }


    return (
        <>
            <div className={`card-container`}>
                {showonPage.map((row) => (
                    <div key={row.id} className="service-card">
                        {/* Card Header: Name and ID */}
                        <div className="card-header">
                            <div className="editBox">
                                <h3 className="user-name">{row.Name}</h3>
                            </div>
                            <div className='btn-holder'>
                                <MdModeEdit size='25' onClick={() => (setoldData(row), handleRoute('edit'))} />
                                <FaTrashAlt size='20' color='#ff4343' name='id' value={delete_log_ID} onClick={() => (setdelete_doc(true), setdelete_log_ID({ id: row.id }))} />
                            </div>
                        </div>

                        {/* Card Body: All other details */}
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Contact</span>
                                <span className="value">{row.Contact}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Service</span>
                                <span className="value">{row.Service}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Service Type</span>
                                <span className="value">{row.Service_Type}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Created At</span>
                                <span className="value">{row.Created_At}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Application ID</span>
                                <span className="value">{row.Application_ID}</span>
                            </div>

                            {/* Financials grouped together visually */}
                            {super_user? (
                                <div className="financials">
                                    <div className="data-row">
                                        <span className="label">Govt Fee</span>
                                        <span className="value">₹{row.Govt_Fee}</span>
                                    </div>
                                    <div className="data-row">
                                        <span className="label">Service Fee</span>
                                        <span className="value">₹{row.Service_Charge}</span>
                                    </div>
                                    <div className="data-row total-row">
                                        <span className="label">Total Fee</span>
                                        <span className="value">₹{row.Total_Amount}</span>
                                    </div>
                                    <div className="data-row due-row">
                                        <span className="label">Due Amount</span>
                                        <span className="value">₹{row.Due}</span>
                                    </div>
                                </div>
                            )
                            : (
                            <div className="financials">
                                <div className="data-row due-row">
                                    <span className="label">Due Amount</span>
                                    <span className="value">₹{row.Due}</span>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

