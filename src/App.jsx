import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Bot, Settings, LogOut, Home as HomeIcon, Calendar as CalendarIcon, Map, LogIn, Menu, ChevronDown, Hotel, Contact, Info, MessageSquare } from 'lucide-react';
import Home from './components/Home';
import ChatBot from './components/ChatBot';
import Events from './components/Events';
import TouristSpots from './components/TouristSpots';
import Hotels from './components/Hotels';
import TourGuides from './components/TourGuides';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Support from './components/Support';
import { supabase } from './lib/supabase';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBatanesMenuOpen, setIsBatanesMenuOpen] = useState(false);
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
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
            
            {/* Dropdown Menu for Batanes */}
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

            {/* Dropdown Menu for About Us */}
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
              <>
                <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-pill active" : "nav-pill"} onClick={() => setIsMobileMenuOpen(false)}>
                  <Settings size={18} /> Admin Panel
                </NavLink>
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                  className="nav-pill" 
                  style={{ color: 'var(--error-color)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-pill active" : "nav-pill"} onClick={() => setIsMobileMenuOpen(false)}>
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
                session ? <AdminPanel /> : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/login" 
              element={
                session ? <Navigate to="/admin" replace /> : <Login onLogin={setSession} />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
