import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Bot, Settings, LogOut, Home as HomeIcon, Calendar as CalendarIcon, Map, LogIn, Menu, ChevronDown, Hotel, Contact, Info, MessageSquare, User, Shield } from 'lucide-react';
import Home from './components/Home';
import ChatBot from './components/ChatBot';
import Events from './components/Events';
import TouristSpots from './components/TouristSpots';
import Hotels from './components/Hotels';
import TourGuides from './components/TourGuides';
import AdminPanel from './components/AdminPanel';
import Account from './components/Account';
import Login from './components/Login';
import Support from './components/Support';
import { supabase } from './lib/supabase';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBatanesMenuOpen, setIsBatanesMenuOpen] = useState(false);
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('user');

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        setUserRole(data.role || 'user');
      }
    } catch (err) {
      console.error("Error fetching role:", err);
    }
  };

  useEffect(() => {
    // Initial session check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Safety timeout: force loading to stop after 2 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    checkInitialSession();

    // Global auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserRole(currentSession.user.id);
      } else {
        setUserRole('user');
      }
      
      if (event === 'SIGNED_OUT') {
        setUserRole('user');
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // --- Inactivity Auto-Logout (5 Minutes) ---
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (session) {
        // Set timeout for 5 minutes (300,000 ms)
        timeoutId = setTimeout(() => {
          console.log("Inactivity detected. Logging out...");
          handleLogout();
        }, 300000);
      }
    };

    // Events that count as activity
    const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];
    
    if (session) {
      events.forEach(event => window.addEventListener(event, resetTimer));
      resetTimer(); // Start timer initially
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session]);
  // ------------------------------------------

  const handleLogout = async () => {
    try {
      // 1. Tell Supabase to sign out
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // 2. Nuclear option: Wipe everything from browser memory
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Reset state and force reload to login
      setSession(null);
      setUserRole('user');
      window.location.href = '/login';
    }
  };

  const isAdmin = userRole === 'admin' || session?.user?.email === 'admin@vakultech.com' || session?.user?.email === 'vakultech@gmail.com';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-color)', borderRadius: '50%' }}></div>
        <div style={{ color: 'var(--text-secondary)' }}>Authenticating...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="container">
        <header className="app-header">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="logo-text" style={{ margin: '0 auto' }}>
              <img src="/logo.png" alt="VakulTech Logo" style={{ height: '50px', objectFit: 'contain' }} />
              VakulTech Hub
            </div>
            <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ position: 'absolute', right: '20px' }}>
              <Menu size={28} />
            </button>
          </div>

          <nav className={`nav-pill-container ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-pill active" : "nav-pill"} end onClick={() => setIsMobileMenuOpen(false)}>
              <HomeIcon size={18} /> Home
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => isActive ? "nav-pill active" : "nav-pill"} onClick={() => setIsMobileMenuOpen(false)}>
              <Bot size={18} /> Chat
            </NavLink>
            
            <div className={`dropdown-container ${isBatanesMenuOpen ? 'mobile-dropdown-open' : ''}`}>
              <div className="nav-pill" style={{ cursor: 'pointer' }} onClick={() => setIsBatanesMenuOpen(!isBatanesMenuOpen)}>
                <Map size={18} /> Batanes <ChevronDown size={16} />
              </div>
              <div className="dropdown-menu">
                <NavLink to="/events" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <CalendarIcon size={16} /> Events
                </NavLink>
                <NavLink to="/spots" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <Map size={16} /> Tourist Spots
                </NavLink>
                <NavLink to="/hotels" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <Hotel size={16} /> Hotels
                </NavLink>
                <NavLink to="/guides" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <Contact size={16} /> Tour Guides
                </NavLink>
              </div>
            </div>

            <div className={`dropdown-container ${isAboutMenuOpen ? 'mobile-dropdown-open' : ''}`}>
              <div className="nav-pill" style={{ cursor: 'pointer' }} onClick={() => setIsAboutMenuOpen(!isAboutMenuOpen)}>
                <Info size={18} /> About Us <ChevronDown size={16} />
              </div>
              <div className="dropdown-menu">
                <NavLink to="/support" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageSquare size={16} /> Support
                </NavLink>
              </div>
            </div>

            {session ? (
              <NavLink to="/account" className={({ isActive }) => isActive ? "nav-pill active" : "nav-pill"} onClick={() => setIsMobileMenuOpen(false)}>
                <User size={18} /> Account
              </NavLink>
            ) : (
              <NavLink to="/login" className={({ isActive }) => isActive ? "nav-pill active" : "nav-pill"} onClick={() => setIsMobileMenuOpen(false)}>
                <LogIn size={18} /> Login
              </NavLink>
            )}
          </nav>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatBot />} />
            <Route path="/events" element={<Events />} />
            <Route path="/spots" element={<TouristSpots />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/guides" element={<TourGuides />} />
            <Route path="/support" element={<Support />} />
            <Route 
              path="/admin" 
              element={
                session ? (isAdmin ? <AdminPanel /> : <Navigate to="/account" replace />) : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/account" 
              element={
                session ? <Account session={session} userRole={userRole} onLogout={handleLogout} /> : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/login" 
              element={
                session ? <Navigate to={isAdmin ? "/admin" : "/account"} replace /> : <Login onLogin={setSession} />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
