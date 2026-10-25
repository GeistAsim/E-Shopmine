import { useState, useEffect } from 'react'
import { Login } from './components/Login'
import { Nav } from './components/Nav'
import { Home } from './components/Home'
import { Notification } from './components/Notification'
import { LogForm } from './components/LogForm'
import { Loading } from './components/Loading'
import { ContainerContext } from './Context/context'
import { Routes, Route, useNavigate } from 'react-router-dom'


function App() {

  const API_Connect = import.meta.env.VITE_API;
  const getStoredToken = () => {
    const admin_state = localStorage.getItem('admin');
    const admin_token = sessionStorage.getItem('token');
    const normal_token = localStorage.getItem('token');

    if (admin_token !== null && admin_token !== "undefined" && admin_state === "true") {
      return admin_token;
    }
    return normal_token || "";
  };

  const [access_token, setAccessToken] = useState(() => getStoredToken());
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [super_user, setsuper_user] = useState(false);
  const [summary_data, setsummary_data] = useState([]);

  const navigate = useNavigate();

  const [notification, setNotification] = useState({
    "show": false,
    "is_error": false,
    "status_code": "",
    "message": ""
  });

  const saveToken = (newToken, isAdmin) => {
    localStorage.setItem('admin', isAdmin ? "true" : "false");
    if (isAdmin) {
      sessionStorage.setItem('token', newToken);
    } else {
      sessionStorage.removeItem('token');
      localStorage.setItem('token', newToken);
    }
    setAccessToken(newToken);
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('token');
    setAccessToken("");
    setAuthorized(false);
    setsuper_user(false);
  };

  useEffect(() => {

    const refreshToken = async (expiredToken) => {
      const tokenToUse = expiredToken || access_token || getStoredToken();
      if (!tokenToUse || tokenToUse === "undefined") {
        return null;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_Connect}/refresh/token`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${tokenToUse}`,
            "Content-Type": "application/json"
          }
        });

        if (res.status === 201) {
          const res_data = await res.json();
          const newToken = res_data.access_token;
          const isAdmin = Boolean(res_data.admin);
          saveToken(newToken, isAdmin);
          return { token: newToken, admin: isAdmin };
        } else if (res.ok) {
          const isAdmin = localStorage.getItem('admin') === "true";
          return { token: tokenToUse, admin: isAdmin };
        }
        return null;
      } catch (err) {
        console.error(`Error Occurred during token refresh: ${err}`);
        return null;
      }
    };

    const verifySession = async (tokenToCheck) => {
      const currentToken = tokenToCheck || access_token || getStoredToken();
      if (!currentToken || currentToken === "undefined") {
        setAuthorized(false);
        setLoading(false);
        if (window.location.pathname !== '/login') {
          navigate("/login");
        }
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_Connect}/user/session`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const session_res = await res.json();

          if (session_res.active_user === true) {
            setAuthorized(true);
            setAccessToken(currentToken);

            if (session_res.super === true) {
              setsuper_user(true);
              localStorage.setItem('admin', "true");
            } else {
              setsuper_user(false);
              localStorage.setItem('admin', "false");
            }

            if (window.location.pathname === '/login') {
              navigate("/");
            }
          } else {
            clearAuthData();
            navigate('/login');
          }

        } else {
          const session_res = await res.json().catch(() => ({}));

          if (session_res.detail === "Token has expired!!!") {
            const refreshRes = await refreshToken(currentToken);
            if (refreshRes && refreshRes.token) {
              // Re-verify the session with the new token to confirm active user and super user status
              await verifySession(refreshRes.token);
              return;
            } else {
              clearAuthData();
              navigate('/login');
            }
          } else {
            clearAuthData();
            navigate('/login');
          }
        }

      } catch (err) {
        console.error("Session verification failed:", err);
        setAuthorized(false);
        if (err.name !== "TypeError" && err.name !== "AbortError") {
          clearAuthData();
          navigate('/login');
        }

      } finally {
        setLoading(false);
      }
    };

    verifySession();

  }, [])



  const [oldData, setoldData] = useState({ id: "undefine" })

  const [searchPara, setsearchPara] = useState({
    query: ''
  })
  const [searchData, setsearchData] = useState([])

  return (
    <>
      <ContainerContext.Provider
        value={
          {
            API_Connect,
            access_token,
            oldData,
            setoldData,
            searchPara,
            setsearchPara,
            searchData,
            setsearchData,
            authorized,
            setAuthorized,
            notification,
            setNotification,
            super_user,
            summary_data,
            setsummary_data,
            setLoading
          }
        }>

        <div className={`container`}>

          {loading && (
            <div className="loaderbox">
              <div className="loader"></div>
            </div>
          )}

          {window.location.pathname === "/login" ? null : (
            <Nav />
          )}
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/post/search/:query" element={<Home />} />
          </Routes>

          {super_user ? (
            <Routes>
              <Route path="/summary" element={<Home />} /> 
              <Route path="/new/post" element={<LogForm />} />
              <Route path={`/update/log`} element={<LogForm />} />
            </Routes>
          ) : null }
          
        </div>
        {notification.message && <Notification />}
      </ContainerContext.Provider>
    </>
  )
}

export default App
