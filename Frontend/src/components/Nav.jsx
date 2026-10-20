import React, { useContext } from 'react'
import logo from '../assets/logo.png'
import { useState, useEffect } from 'react';
import { RiAddLargeLine } from "react-icons/ri";
import { BiLogOut } from "react-icons/bi";
import { MdOutlineSummarize } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import { ContainerContext } from '../Context/context';
import { TbLayoutSidebarRightExpandFilled } from "react-icons/tb";
import { AiOutlineUserSwitch } from "react-icons/ai";
import { BsSearch } from "react-icons/bs";


export const Nav = () => {
    const { API_Connect, searchPara, setsearchPara, setsearchData, authorized, access_token, super_user, setsummary_data, notification, setNotification, setLoading } = useContext(ContainerContext)


    const [side_panel, setside_panel] = useState(false);
    const [searchbar, setsearchbar] = useState(false);
    const [switch_role_doc, setswitch_role_doc] = useState(false);

    const navigate = useNavigate();
    const url = useLocation();

    let searchTerm = url.pathname.split('/')

    const handleChange = (e) => {
        const { name, value } = e.target;
        setsearchPara({
            ...searchPara,
            [name]: value
        })
    }


    const handleRoute = (button_identifier) => {
        if (authorized) {
            if (button_identifier === "new post") {
                navigate("/new/post")
            }
            else if (button_identifier === "summary") {
                navigate("/summary")
            }
        }
        else {
            navigate("/login")
        }
    }


    let searchPathWords = searchPara.query.split(' ')
    let searchPath = searchPathWords.join('+')
    const handleSearchPage = () => {
        navigate(`/post/search/${searchPath}`)
    }


    const handle_user_role = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_Connect}/switch/user/role`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!res.ok) throw Error("switch user role failed!!!")

            let new_role = await res.json()

            localStorage.setItem('admin', new_role.admin)

            if (new_role.admin) {
                sessionStorage.setItem('token', new_role.token)

            } else if (!new_role.admin) {
                //sessionStorage.removeItem('token')
                localStorage.setItem('token', new_role.token)
            }
            window.location.reload();
            return new_role.admin

        } catch (err) {
            console.error(`Error to switch user role ${err}`);
            setNotification(prev => ({
                ...prev,
                "is_error": true,
                "status_code": "Error",
                "message": err.message || "Failed to switch user role"
            }));
        }
        finally {
            setLoading(false);
        }
    }


    const handleRole = async (role) =>  {
        if (role === 'admin') {
           await handle_user_role();
        }
        else if (role === 'user') {
           await handle_user_role();
        }        
    }


    const handleSearch = (e) => {
        e.preventDefault()
        handleSearchPage()
    }

    const handleSummary = async () => {

        try {
            setLoading(true);
            let res = await fetch(`${API_Connect}/finance/summary`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': "application/json"
                }
            });

            if (!res.ok) throw Error("Finance Summary not found!!!");

            let finance_res = await res.json();
            setsummary_data(finance_res);
            return finance_res;
        }
        catch (err) {
            console.error(`Error Occure in Finance Summary with error code ${err}`);
            setNotification(prev => ({
                ...prev,
                "is_error": true,
                "status_code": "Error",
                "message": err.message || "Failed to fetch finance summary"
            }));
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {

        const directSearch = async () => {
            // API call
            try {
                setLoading(true);
                const res = await fetch(`${API_Connect}/search/post/${searchTerm.at(-1)}`, {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (res.status === 404) {
                    let error_msg = await res.json()
                    setsearchData([]) // Clear previous results
                    setNotification(prev => ({
                        ...prev,
                        "is_error": true,
                        "status_code": res.status,
                        "message": error_msg
                    }))
                    return;
                }

                if (!res.ok) throw Error("search request failed!")

                let post_res = await res.json()

                if (post_res.length === 0) {
                    setNotification(prev => ({
                        ...prev,
                        "is_error": true,
                        "status_code": "404",
                        "message": "No search result found"
                    }));
                } else {
                    // Clear any previous search error notification
                    setNotification(prev => {
                        if (prev.is_error) {
                            return {
                                ...prev,
                                "is_error": false,
                                "status_code": "",
                                "message": ""
                            }
                        }
                        return prev
                    })
                }
                setsearchData(post_res)
                return post_res
            }
            catch (err) {
                console.error(`Error Occured during search with error code ${err}`);
                setNotification(prev => ({
                    ...prev,
                    "is_error": true,
                    "status_code": "Error",
                    "message": err.message || "An error occurred while searching"
                }));
            }
            finally {
                setLoading(false)
            }
        }

        if (!url.pathname.startsWith("/post/search/")) {
            setNotification(prev => {
                if (prev.is_error && prev.status_code === 404) {
                    return {
                        ...prev,
                        "is_error": false,
                        "status_code": "",
                        "message": ""
                    }
                }
                return prev
            })
        }

        if (url.pathname.startsWith("/post/search/")) {
            directSearch();
        }

        if (url.pathname.startsWith("/summary")) {
            handleSummary();
        }

    }, [url.pathname, setNotification, API_Connect, access_token])


    const handlelogout = (e) => {
        e.preventDefault()
        window.localStorage.removeItem('token')
        window.localStorage.removeItem('admin')
        window.sessionStorage.removeItem('token')
        window.location.replace('/login')
    }


    const handle_side_panel = () => {
        if (side_panel) {
            setside_panel(false)
        }
        else {
            setside_panel(true)
        }
    }


    return (
        <>
            <header className="navbar-new">
                <div className="nav-container">
                    <div className="nav-top-row">

                        <div className="nav-logo" onClick={() => (authorized ? navigate("/") : navigate('/login'), setsearchbar(false))} style={{ cursor: 'pointer' }}>
                            <div className="nav-logo-icon">
                                <img src={logo} alt="Logo" />
                            </div>
                        </div>

                        <form className="nav-search" onSubmit={handleSearch}>
                            <svg className="nav-search-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input type="text" name="query" className="nav-search-input" placeholder="Search transactions…" value={searchPara.query} onChange={handleChange} />
                        </form>

                        <div className="nav-spacer"></div>

                        <div className="nav-actions">
                            {super_user ? (
                                <>
                                    <button className={`nav-btn ${url.pathname === '/new/post' ? "active" : ""}`} onClick={() => handleRoute("new post")}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" /><path d="M12 5v14" />
                                        </svg>
                                        <span>New Post</span>
                                    </button>
                                    <button className={`nav-btn ${url.pathname === '/summary' ? "active" : ""}`} onClick={() => { handleRoute("summary"); handleSummary(); }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                                        </svg>
                                        <span>Summary</span>
                                    </button>
                                </>
                            ) : null}
                            <button className="nav-btn" onClick={() => setswitch_role_doc(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
                                </svg>
                                <span>Switch Role</span>
                            </button>
                            <button className="nav-btn danger" onClick={handlelogout}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>

                    <div className="nav-bottom-row">
                        <div className={`role-badge ${super_user ? "admin" : "user"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            </svg>
                            {super_user ? "Administrator" : "Normal User"}
                        </div>
                        <span className="nav-status-text">{authorized ? "Signed in" : "Not signed in"}</span>
                    </div>
                </div>
            </header>

            {switch_role_doc && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-for-role">
                                <div className="modal-title">
                                    <h3>Switch Role</h3>
                                    <p>Select a role to experience different access levels.</p>
                                </div>
                            </div>
                        </div>
                        <div className="role-buttons">

                            <button className={`role-button ${super_user ? "admin admin-active" : "role-btn-hover"} role-btn`} onClick={() => { handleRole("admin"); setswitch_role_doc(false); }}>
                                <div className={`${super_user ? "admin-status" : "modal-header-icon-normal"} modal-header-icon`} style={{ backgroundColor: super_user ? "#ede9fe" : "" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                    </svg>
                                </div>
                                <div className={`role-name`}>
                                    <h3>Administrator</h3>
                                    <p>Full access — create, edit, delete, summary</p>
                                </div>
                                {super_user && <div className={`role-status ${super_user ? "admin-status" : ""}`}>Active</div>}
                            </button>

                            <button className={`role-button ${!super_user ? "user user-active" : "role-btn-hover"} role-btn`} onClick={() => { handleRole("user"); setswitch_role_doc(false); }}>
                                <div className={`${!super_user ? "user-status" : "modal-header-icon-normal"} modal-header-icon`} style={{ backgroundColor: !super_user ? "#dff2fe" : "" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div className='role-name'>
                                    <h3>Standard User</h3>
                                    <p>View only — financial fields hidden</p>
                                </div>
                                {!super_user && <div className={`role-status ${!super_user ? "user-status" : ""}`}>Active</div>}
                            </button>

                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setswitch_role_doc(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
