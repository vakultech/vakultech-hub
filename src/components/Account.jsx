import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, Calendar, Lock, LogOut, Save, CheckCircle, Settings, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Account({ session, userRole, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Profile State
  const [fullname, setFullname] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [birthdate, setBirthdate] = useState('');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Robust Admin Check
  const isAdmin = userRole === 'admin' || 
                  session?.user?.email === 'admin@vakultech.com' || 
                  session?.user?.email === 'vakultech@gmail.com';

  useEffect(() => {
    if (session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      setFullname(meta.full_name || '');
      setContact(meta.contact_number || '');
      setAddress(meta.address || '');
      setBirthdate(meta.birthdate || '');
    }
  }, [session]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullname,
          contact_number: contact,
          address: address,
          birthdate: birthdate,
        }
      });

      if (error) throw error;
      showMessage('Profile updated successfully!', 'success');
    } catch (err) {
      showMessage(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      showMessage('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showMessage(err.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <User size={24} /> My Account
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Manage your profile and security</p>
      </div>

      {isAdmin && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', marginBottom: '5px', color: '#1e293b' }}>
              <Shield size={20} color="var(--primary-color)" /> Administrator Access
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You have access to the system management tools.</p>
          </div>
          <NavLink to="/admin" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <Settings size={18} /> Admin Dashboard
          </NavLink>
        </div>
      )}

      {message.text && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2', 
          color: message.type === 'success' ? 'var(--success-color)' : 'var(--error-color)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : null}
          {message.text}
        </div>
      )}

      <div className="responsive-grid" style={{ gap: '30px' }}>
        <div className="glass-panel" style={{ background: '#ffffff', padding: '20px', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--primary-color)" /> Personal Details
          </h3>
          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contact Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="tel" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Birthdate</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="date" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="glass-panel" style={{ background: '#ffffff', padding: '20px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--primary-color)" /> Change Password
            </h3>
            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input 
                    type="password" 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input 
                    type="password" 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                Update Password
              </button>
            </form>
          </div>

          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ width: '100%', color: 'var(--error-color)', borderColor: 'var(--error-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={18} /> Logout from Account
          </button>
        </div>
      </div>
    </div>
  );
}
