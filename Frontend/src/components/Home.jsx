import React from 'react'
import { useEffect, useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { ContainerContext } from '../Context/context'
import { MdModeEdit } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { Notification } from './Notification';


export const Home = () => {

    const { API_Connect, setoldData, searchData, setsearchData, authorized, access_token, setAuthorized, notification, setNotification, super_user, summary_data, setsummary_data, setLoading } = useContext(ContainerContext)

    const url = useLocation();
    const navigate = useNavigate();

    const [HomeData, setHomeData] = useState([])

    let showonPage;
    if (url.pathname.startsWith("/post/search/")) {
        showonPage = searchData;
    }
    else if (url.pathname.startsWith("/summary")) {
        showonPage = summary_data;
    }
    else {
        showonPage = HomeData
    }

    const [delete_log_ID, setdelete_log_ID] = useState({
        id: ''
    })

    const [delete_doc, setdelete_doc] = useState(false)


    useEffect(() => {
        const get_data = async () => {
            if (!authorized || !access_token || access_token === "undefined") {
                return;
            }

            try {
                setLoading(true);
                let res = await fetch(`${API_Connect}/home`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!res.ok) {
                    console.error("Unable to connect HomeDataBase!");
                    setNotification({
                        ...notification,
                        "is_error": true,
                        "status_code": res.status,
                        "message": res.statusText || "Unable to fetch data"
                    });
                    return;
                }

                let HomeData = await res.json();
                if (Array.isArray(HomeData)) {
                    setHomeData(HomeData);
                }
            }
            catch (err) {
                console.error(`Error Occure in Backend Connection ${err}`)
            }
            finally {
                setLoading(false)
            }
        }

        get_data();

    }, [authorized, access_token])


    const delete_log = async () => {
        try {
            setLoading(true);
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
                    "status_code": "Error",
                    "message": "Failed to delete transaction"
                })
                throw new Error("log not delete")
            };

            let delete_res = await res.json();

            setNotification({
                ...notification,
                show: true,
                is_error: false,
                status_code: "Success",
                message: "Transaction deleted successfully"
            });

            setHomeData(prev => prev.filter(item => item.id !== delete_log_ID.id));
            if (setsearchData) setsearchData(prev => prev.filter(item => item.id !== delete_log_ID.id));
            if (setsummary_data) setsummary_data(prev => prev.filter(item => item.id !== delete_log_ID.id));

            return delete_res;
        }
        catch (err) {
            console.error(`Error: ${err}`)
        }
        finally {
            setdelete_doc(false)
            setdelete_log_ID({ id: "" })
            setLoading(false);
        }
    };

    const handleRoute = () => {
        if (authorized) {
            navigate(`/update/log`)
        }
        else {
            navigate("/login")
        }
    }

    return (
        <>
            <main className="home-container">
                <div className="home-header">
                    <div>
                        <h1 className="home-title">{url.pathname.startsWith("/summary") ? "Financial Summary" : "Transactions"}</h1>
                        <p className="home-subtitle">{showonPage.length} {showonPage.length === 1 ? 'record' : 'records'}</p>
                    </div>

                    {super_user && !url.pathname.startsWith("/summary") && (
                        <button className="new-txn-btn" onClick={() => (authorized ? navigate("/new/post") : navigate("/login"))}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>New Transaction</span>
                        </button>
                    )}
                </div>

                <div className="txn-grid">
                    {showonPage.map((row) => url.pathname.startsWith("/summary") ? (
                        <div className="txn-card" key={row.id || row.Month}>
                            <div className="txn-card-body">
                                <div className="txn-card-header">
                                    <div style={{ minWidth: 0 }}>
                                        <h3 className="txn-name">{row.Month}</h3>
                                    </div>
                                </div>
                                <div className="txn-fin-box" style={{ marginTop: '0' }}>
                                    <div className="txn-fin-grid">
                                        <div className="txn-fin-item">
                                            <p>Govt Fee</p>
                                            <p>₹{row.Govt_Fee}.00</p>
                                        </div>
                                        <div className="txn-fin-item">
                                            <p>Svc. Charge</p>
                                            <p>₹{row.Service_Charge}.00</p>
                                        </div>
                                        <div className="txn-fin-item highlight">
                                            <p>Total</p>
                                            <p>₹{row.Total_Amount}.00</p>
                                        </div>
                                    </div>
                                    <div className="txn-balance-row">
                                        <span>Due Amount</span>
                                        <span className={row.Due > 0 ? 'due' : 'paid'}>{row.Due > 0 ? `₹${row.Due}.00` : 'Fully Paid'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="txn-card" key={row.id}>
                            <div className="txn-card-body">
                                <div className="txn-card-header">
                                    <div style={{ minWidth: 0 }}>
                                        <h3 className="txn-name">{row.Name}</h3>
                                        <a href={`tel:${row.Contact}`} className="txn-contact">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            {row.Contact}
                                        </a>
                                    </div>
                                </div>

                                <div className="txn-info-grid">
                                    <div className="txn-info-field">
                                        <div className="txn-info-label">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l8.29-8.29c.94-.94.94-2.48 0-3.42L12 2Z" />
                                                <path d="M7 7h.01" />
                                            </svg>
                                            Service
                                        </div>
                                        <div className="txn-info-value">{row.Service}</div>
                                    </div>
                                    <div className="txn-info-field">
                                        <div className="txn-info-label">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="4" y1="9" x2="20" y2="9" />
                                                <line x1="4" y1="15" x2="20" y2="15" />
                                                <line x1="10" y1="3" x2="8" y2="21" />
                                                <line x1="16" y1="3" x2="14" y2="21" />
                                            </svg>
                                            Type
                                        </div>
                                        <div className="txn-info-value">{row.Service_Type}</div>
                                    </div>
                                    <div className="txn-info-field full">
                                        <div className="txn-info-label">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="4" y1="9" x2="20" y2="9" />
                                                <line x1="4" y1="15" x2="20" y2="15" />
                                                <line x1="10" y1="3" x2="8" y2="21" />
                                                <line x1="16" y1="3" x2="14" y2="21" />
                                            </svg>
                                            Application ID
                                        </div>
                                        <div className="txn-info-value mono textCopy" style={{ cursor: "copy" }} onClick={() => navigator.clipboard.writeText(row.Application_ID)}>{row.Application_ID}</div>
                                    </div>
                                </div>

                                {super_user ? (
                                    <div className="txn-fin-box">
                                        <div className="txn-fin-grid">
                                            <div className="txn-fin-item">
                                                <p>Govt Fee</p>
                                                <p>₹{row.Govt_Fee}.00</p>
                                            </div>
                                            <div className="txn-fin-item">
                                                <p>Svc. Charge</p>
                                                <p>₹{row.Service_Charge}.00</p>
                                            </div>
                                            <div className="txn-fin-item highlight">
                                                <p>Total</p>
                                                <p>₹{row.Total_Amount}.00</p>
                                            </div>
                                        </div>
                                        <div className="txn-balance-row">
                                            <span>Balance Due</span>
                                            <span className={row.Due > 0 ? 'due' : 'paid'}>{row.Due > 0.00 ? `₹${row.Due}.00` : 'Fully Paid'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="txn-fin-box">
                                        <div className="txn-balance-row" style={{ border: "none", padding: "0" }}>
                                            <span>Balance Due</span>
                                            <span className={row.Due > 0 ? 'due' : 'paid'}>{row.Due > 0.00 ? `₹${row.Due}.00` : 'Fully Paid'}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="txn-card-footer">
                                    <span className="txn-date">{row.Created_At}</span>
                                    {super_user && (
                                        <div className="txn-actions">
                                            <button className="txn-action-btn edit" onClick={() => { setoldData(row); handleRoute('edit'); }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button className="txn-action-btn delete" onClick={() => { setdelete_doc(true); setdelete_log_ID({ id: row.id }); }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {delete_doc && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="modal-header-icon modal-header-icon-danger">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </div>
                                <div className="modal-title">
                                    <h3>Delete Transaction</h3>
                                    <p>This cannot be undone</p>
                                </div>
                            </div>
                            <p className="modal-description">Are you sure you want to permanently delete this transaction record? All associated data will be removed.</p>
                            <div className="modal-footer">
                                <button
                                    className="modal-btn cancel"
                                    onClick={() => { setdelete_doc(false); setdelete_log_ID({ id: '' }); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="modal-btn danger"
                                    onClick={delete_log}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}

