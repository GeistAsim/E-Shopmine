import React, { useContext, useState, useEffect } from 'react'
import { ContainerContext } from '../Context/context'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import logo from '../assets/logo.png'

export const Login = () => {

    const { API_Connect, setAuthorized, setLoading } = useContext(ContainerContext)

    const { handleSubmit, formState: { isSubmitting } } = useForm();

    const navigate = useNavigate();

    const [login_credentials, setlogin_credentials] = useState(
        {
            username: '',
            password: ''
        }
    )
    const [loginError, setLoginError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (loginError) {
            const timer = setTimeout(() => {
                setLoginError("");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [loginError]);

    const handle_change = (e) => {
        const { name, value } = e.target;
        setlogin_credentials({
            ...login_credentials,
            [name]: value
        });
        if (loginError) setLoginError("");
    }


    let handle_login = async (credentials) => {

        try {
            setLoading(true);
            const res = await fetch(`${API_Connect}/token`, {
                method: 'POST',
                headers: {
                    "content-type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams(login_credentials)
            });

            if (!res.ok) {
                setLoginError('Username or Password Incorrect!');
                return;
            }

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('admin', data.admin)
                if (data.admin) {
                    sessionStorage.setItem('token', data.access_token)

                } else if (!data.admin) {
                    sessionStorage.removeItem('token');
                    localStorage.setItem('token', data.access_token)
                }
                window.location.replace('/');
                setAuthorized(true);
                return "Access Granted!!!"
            }

        }
        catch (err) {
            console.error(`${err}`);
            setLoginError('An error occurred during login. Please try again.');
        }
        finally {
            setLoading(false)
        }

    }



    return (
        <>
            <div className="login-wrapper">
                
                <div className="login-header">
                    <div className="login-header-icon">
                        <img src={logo} alt="Logo" />
                    </div>
                    <h1>E-Shopmine</h1>
                    <p>Transaction Management System</p>
                </div>

                <div className="login-card-new">
                    <h2>Welcome Back!</h2>
                    <p>Please log in to continue to your account.</p>

                    {loginError && (
                        <div className="error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {loginError}
                        </div>
                    )}

                    <form className="login-card-form" onSubmit={handleSubmit(handle_login)}>
                        
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input type="text" id="username" name="username" className="input-field" value={login_credentials.username} onChange={handle_change} placeholder="Enter your username" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-container">
                                <input type={showPassword ? "text" : "password"} id="password" name="password" className="input-field" value={login_credentials.password} onChange={handle_change} placeholder="Enter your password" required />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                            <line x1="2" y1="2" x2="22" y2="22"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="submit-btn-new">Log In</button>
                    </form>
                </div>

            </div>
        </>
    )
}
