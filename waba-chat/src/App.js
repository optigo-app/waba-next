import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { Box } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';
import LoginPage from './components/LoginPage/LoginPage';
import Home from './components/Home/Home';
import Customers from './components/Customers/Customers';
import Header from './components/Header/Header';
import Sidebar from './components/Siderbar/Sidebar';
import CustomerDetails from './components/CustomerDetails/CustomerDetails';
import { TagsProvider } from './contexts/TagsContexts';
import { ArchieveProvider } from './contexts/ArchieveContext';
import { disconnectSocket, initializeSocket, isSocketConnected } from './socket';
import { toastConfig } from './toastConfig';
import { LoginContext } from './context/LoginData';
import { registerSocketId } from './utils/socketHelper';
import LoginExists from './components/LoginExists/LoginExists';
import Lottie from 'lottie-react';
import loader from './assets/lotties/loader.json';
import VersionDisplay from './components/VersionDisplay/VersionDisplay';

const PagenotFound = () => <div>404 - Page Not Found</div>;

function Layout({ children, onStatusSelect, selectedStatus, onTagSelect, selectedTag }) {
  const location = useLocation();
  const match = matchPath('/conversation/:conversationId', location.pathname);
  const showCustomerDetails = Boolean(match);

  const [isBreakpointSidebarCollapsed, setIsBreakpointSidebarCollapsed] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.innerWidth <= 1440;
    } catch (e) {
      return false;
    }
  });

  const SIDEBAR_COLLAPSED_STORAGE_KEY = 'optigo_sidebar_collapsed';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored == null) return false;
      return stored === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      setIsBreakpointSidebarCollapsed(window.innerWidth <= 1440);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed));
    } catch (e) {
    }
  }, [isSidebarCollapsed]);

  const isSidebarCollapsedEffective = isSidebarCollapsed || isBreakpointSidebarCollapsed;
  const sidebarWidth = isSidebarCollapsedEffective ? '76px' : '260px';

  return (
    <Box className={isSidebarCollapsedEffective ? 'layout--sidebar-collapsed' : 'layout'}>
      <TagsProvider>
        <ArchieveProvider>
          <Header />
          <Sidebar
            onStatusSelect={onStatusSelect}
            selectedStatus={selectedStatus}
            onTagSelect={onTagSelect}
            selectedTag={selectedTag}
            isCollapsed={isSidebarCollapsedEffective}
            onCollapsedChange={setIsSidebarCollapsed}
          />

          {/* Global CustomerDetails view */}
          {showCustomerDetails && (
            <Box sx={{ marginLeft: sidebarWidth, padding: '16px', borderBottom: '1px solid #ccc' }}>
              <CustomerDetails />
            </Box>
          )}

          <Box sx={{ marginLeft: sidebarWidth }}>
            {children}
          </Box>
        </ArchieveProvider>
      </TagsProvider>
    </Box>
  );
}

function App() {
  const navigate = useNavigate();
  const { auth, isSyncing } = useContext(LoginContext);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');

  const [isPublicRoute] = useState(() => {
    const path = window.location.pathname;
    return path === '/login' || path === '/session-check' || path === '/test';
  });

  const [isAuthChecking, setIsAuthChecking] = useState(!isPublicRoute);
  const hasRunAuthCheckRef = useRef(false);

  //   setCredentials(creds);
  // }, []);

  /** ------------------------------
   * Initialize socket after login
   * ------------------------------ */
  useEffect(() => {
    let isMounted = true;

    const checkAndInitializeSocket = async () => {
      let token = auth?.token;
      let userId = auth?.userId;

      // Fallback to sessionStorage if no token in context
      if (!token || !userId) {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userData = sessionStorage.getItem('userData');

        if (isLoggedIn && userData) {
          try {
            const parsedData = JSON.parse(userData);
            token = parsedData.token;
            userId = parsedData.userId;
          } catch (err) {
            console.error('❌ Error parsing user data:', err);
            return;
          }
        }

        if (!token || !userId) {
          console.log('⚠️ No auth token or userId available');
          return <div>Loading...</div>;
        }
      }

      try {
        console.log('🔄 Initializing socket connection...');
        const socket = initializeSocket(token);

        if (!socket) {
          console.error('❌ Failed to initialize socket');
          return;
        }

        /** 🔗 On successful connection */
        socket.on('connect', async () => {
          if (!isMounted) return;
          console.log('✅ Socket connected:', socket.id);

          try {
            await registerSocketId(socket.id, userId, auth?.id); // <-- your API
            console.log('📡 Player ID saved successfully');
          } catch (err) {
            console.error('❌ Failed to save Player ID:', err);
          }

          setIsConnected(true);
          setSocketStatus('connected');
        });

        /** ⚠️ On disconnect */
        socket.on('disconnect', (reason) => {
          if (!isMounted) return;
          console.warn('⚠️ Socket disconnected:', reason);
          setIsConnected(false);
          setSocketStatus('disconnected');
        });

        /** 🔐 Handle session logout */
        socket.on('sessionLogout', () => {
          if (!isMounted) return;
          console.log('🔒 Session logout received');

          // Clear session data
          sessionStorage.clear();

          // Disconnect socket
          disconnectSocket(true);

          // Redirect to login page
          navigate('/login');

          // Show a message to the user
          toast.error('Your session has been logged out from another device', {
            duration: 3000,
          });
        });

        /** ❌ On error */
        socket.on('connect_error', (err) => {
          if (!isMounted) return;
          console.error('❌ Socket connection error:', err.message);
          setIsConnected(false);
          setSocketStatus('error');
        });

        // Periodic connection status check
        const interval = setInterval(() => {
          if (!isMounted) return;
          const connected = isSocketConnected();
          setIsConnected(connected);
          setSocketStatus(connected ? 'connected' : 'disconnected');
        }, 5000);

        return () => {
          clearInterval(interval);
          isMounted = false;
        };

      } catch (err) {
        console.error('❌ Error in socket initialization:', err);
        setIsConnected(false);
        setSocketStatus('error');
      }
    };

    checkAndInitializeSocket();

    return () => {
      isMounted = false;
    };
  }, [auth?.token]);


  /** ------------------------------
   * Redirect to login if not logged in
   * ------------------------------ */
  useEffect(() => {
    if (hasRunAuthCheckRef.current) return;
    hasRunAuthCheckRef.current = true;

    if (isPublicRoute) {
      setIsAuthChecking(false);
      return;
    }

    setIsAuthChecking(true);
    const timeout = setTimeout(() => {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn');
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const hasExistingSocket = sessionStorage.getItem('hasSocketId');

      if (!isLoggedIn) {
        if (hasExistingSocket) {
          // Existing socket session → redirect to session check
          navigate('/session-check');
        } else if (userData?.id) {
          // userData exists → go to home
          navigate('/');
        } else {
          // No session → disconnect and go to login
          disconnectSocket(true);
          navigate('/login');
        }
      }

      setIsAuthChecking(false);
    }, 500); // wait 500ms (adjust if needed)

    return () => clearTimeout(timeout);
  }, [navigate]);


  return (
    <>
      <Toaster position="top-right" toastOptions={toastConfig} />

      {isAuthChecking && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(3px)',
          }}
        >
          <Box sx={{ width: 200, height: 200 }}>
            <Lottie
              animationData={loader}
              loop={true}
              style={{ width: '100%', height: '80%' }}
            />
            <Box sx={{ textAlign: 'center', mt: 2, color: '#333', fontWeight: 500 }}>
              Checking session...
            </Box>
          </Box>
        </Box>
      )}

      {/* Global Sync Loader Overlay */}
      {isSyncing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(3px)',
          }}
        >
          <Box sx={{ width: 200, height: 200 }}>
            <Lottie
              animationData={loader}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
            <Box sx={{ textAlign: 'center', mt: 2, color: '#333', fontWeight: 500 }}>
              Syncing Data...
            </Box>
          </Box>
        </Box>
      )}

      {/* Prototype Banner */}
      {/* <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '50%',
          background: 'red',
          color: 'white',
          padding: '6px 40px',
          fontWeight: 'bold',
          fontSize: '20px',
          zIndex: 10,
          whiteSpace: 'nowrap',
          boxShadow: '2px 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        Prototype
      </div> */}


      {!isAuthChecking && (
        <div className="app_mainDiv">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/session-check" element={<LoginExists />} />
            <Route
              path="*"
              element={
                <Layout
                  onStatusSelect={setSelectedStatus}
                  selectedStatus={selectedStatus}
                  onTagSelect={setSelectedTag}
                  selectedTag={selectedTag}
                >
                  <Routes>
                    <Route
                      path="/"
                      element={<Home selectedStatus={selectedStatus} selectedTag={selectedTag} isConnected={isConnected} socketStatus={socketStatus} />}
                    />
                    <Route path="/add-conversation" element={<Customers />} />
                    <Route path="/notification" element={<Customers />} />
                    <Route path="/archieve" element={<Customers />} />
                    <Route path="/app_v" element={<VersionDisplay variant="footer" />} />
                    <Route path="*" element={<PagenotFound />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </div>
      )}
    </>
  );
}

export default App;
