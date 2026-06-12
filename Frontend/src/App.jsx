import { useState, useEffect } from 'react'
import { Login } from './components/Login'
import { Nav } from './components/Nav'
import { Home } from './components/Home'
import { Notification } from './components/Notification'
import { LogForm } from './components/LogForm'
import { CardForm } from './components/CardForm'
import { ContainerContext } from './Context/context'
import { Routes, Route, useNavigate } from 'react-router-dom'


function App() {

  const API_Connect = import.meta.env.VITE_API;
  const access_token = localStorage.getItem('token')
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(!!access_token)
  const [super_user, setsuper_user] = useState(false)
  console.log(super_user)

  const navigate = useNavigate();


  const [notification, setNotification] = useState({
    "show": false,
    "is_error": false,
    "status_code": "",
    "message": ""
  })


  useEffect(() => {
    const verifySession = async () => {
      if (!access_token) {
        setAuthorized(false);
        setLoading(false);
        if (window.location.pathname !== '/login') {
          navigate("/login");
        }
        return;
      }

      try {
        const res = await fetch(`${API_Connect}/user/session`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const session_res = await res.json();
          if (session_res === true) {
            setAuthorized(true);
            if (window.location.pathname === '/login') {
              navigate("/");
            }
          } else {
            setAuthorized(false);
            localStorage.removeItem('token');
            navigate("/login");
          }
        } else {
          setAuthorized(false);
          localStorage.removeItem('token');
          navigate("/login");
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        setAuthorized(false);
        localStorage.removeItem('token');
        navigate("/login");
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
  
  if (loading) {
    return (
      <div className="app-loader">
        <div className="spinner"></div>
        <p>Verifying session...</p>
      </div>
    );
  }

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
            super_user
          }
        }>

        <div className={`container`}>
          <Nav />
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/post/search/:query" element={<Home />} />
            <Route path="/new/post" element={<LogForm />} />
            <Route path={`/update/log`} element={<CardForm />} />
          </Routes>
        </div>
      </ContainerContext.Provider>
    </>
  )
}

export default App
