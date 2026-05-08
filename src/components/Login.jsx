import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, LogIn, ShieldCheck, QrCode, User, Phone, MapPin, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // MFA State
  const [step, setStep] = useState('login'); // 'login' | 'challenge' | 'email-otp'
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [tempSession, setTempSession] = useState(null);
  
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [successMessage, setSuccessMessage] = useState(null);
   const [confirmPassword, setConfirmPassword] = useState('');
 
   useEffect(() => {
     supabase.auth.onAuthStateChange(async (event, session) => {
       if (event === "PASSWORD_RECOVERY") {
         setStep('update-password');
       }
     });
   }, []);

  // Registration State
  const [fullname, setFullname] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const logLogin = async (user) => {
    if (!user) return;
    try {
      // 1. Detect Browser and Device
      const ua = navigator.userAgent;
      let browser = "Unknown Browser";
      let device = "Unknown Device";

      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
      else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
      else if (ua.includes("Trident")) browser = "Internet Explorer";
      else if (ua.includes("Edge")) browser = "Edge";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";

      if (ua.includes("Windows")) device = "Windows PC";
      else if (ua.includes("Macintosh")) device = "Mac";
      else if (ua.includes("Android")) device = "Android Mobile";
      else if (ua.includes("iPhone")) device = "iPhone";
      else if (ua.includes("iPad")) device = "iPad";
      else if (ua.includes("Linux")) device = "Linux";

      // 2. Fetch approximate location via IP
      let location = "Unknown Location";
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.city) {
          location = `${data.city}, ${data.region}, ${data.country_name}`;
        }
      } catch (e) {
        console.warn("Location detection failed:", e);
      }

      // 3. Get or Generate Unique Device ID
      let deviceId = localStorage.getItem('vt_device_id');
      if (!deviceId) {
        deviceId = 'VT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem('vt_device_id', deviceId);
      }

      await supabase.from('admin_logs').insert([{
        action: 'Logged In',
        details: 'Admin successfully authenticated',
        admin_email: user.email,
        browser: browser,
        device: device,
        location: location,
        device_id: deviceId
      }]);
    } catch (err) {
      console.error('Failed to log login:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        // Check if user is Admin
        const isAdmin = data.user.email === 'admin@vakultech.com' || data.user.user_metadata?.role === 'admin';
        
        if (isAdmin) {
          // Generate 6-digit OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Store OTP in database
          await supabase.from('login_otp').insert([{
            email: data.user.email,
            otp_code: otp
          }]);

          // Trigger Email via notifications table (Zapier)
          await supabase.from('notifications').insert([{
            subject: 'Your Login Verification Code',
            content: {
              message: `Your VakulTech Hub verification code is: ${otp}`,
              code: otp,
              user_email: data.user.email
            },
            to_email: data.user.email
          }]);

          setTempUser(data.user);
          setTempSession(data.session);
          setStep('email-otp');
        } else {
          // Regular user login
          await logLogin(data.user);
          onLogin(data.session);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!tempUser) return;
    setLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await supabase.from('login_otp').insert([{
        email: tempUser.email,
        otp_code: otp
      }]);
      await supabase.from('notifications').insert([{
        subject: 'Your New Login Verification Code',
        content: {
          message: `Your new VakulTech Hub verification code is: ${otp}`,
          code: otp,
          user_email: tempUser.email
        },
        to_email: tempUser.email
      }]);
      alert('A new code has been sent to your email.');
    } catch (err) {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check the latest OTP for this email
      const { data, error } = await supabase
        .from('login_otp')
        .select('*')
        .eq('email', tempUser.email)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data[0] && data[0].otp_code === emailOtp) {
        // Success! Log the login
        await logLogin(tempUser);
        onLogin(tempSession);
      } else {
        throw new Error('Invalid or expired verification code.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode
      });

      if (error) throw error;

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await logLogin(sessionData.session.user);
      }
      onLogin(sessionData.session);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullname,
            contact_number: contact,
            address: address,
            birthdate: birthdate,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMessage('Registration successful! Please check your email for the activation link.');
        setStep('success');
      }
    } catch (err) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) throw error;
      setStep('reset-sent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep('login');
      alert('Password updated successfully! Please login with your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px', maxWidth: '400px', margin: '40px auto' }}>
      
      {step === 'login' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Lock size={24} /> Admin Access
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Sign in to manage the dictionary</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your email address"
                />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                type="button" 
                onClick={() => setStep('forgot')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Don't have an account? <button type="button" onClick={() => setStep('register')} style={{ color: 'var(--primary-color)', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer' }}>Create one</button>
            </div>
          </form>
        </>
      )}

      {step === 'register' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <User size={24} /> Create Account
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Join VakulTech Hub</p>
          </div>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contact Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="tel" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  placeholder="0912 345 6789"
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
                  placeholder="Basco, Batanes"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
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

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setStep('login');
                setError(null);
              }}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={18} /> Back to Login
            </button>
          </form>
        </>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle size={64} color="var(--success-color)" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Check Your Email</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '30px' }}>
            {successMessage}
          </p>
          <button 
            onClick={() => setStep('login')}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Go to Login
          </button>
        </div>
      )}

      {step === 'challenge' && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
            <ShieldCheck size={24} /> Two-Factor Auth
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Open Google Authenticator and enter the 6-digit code for your account.
          </p>

          <form onSubmit={handleChallenge}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              required
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', marginBottom: '20px', fontWeight: 'bold' }}
            />
            
            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              <LogIn size={18} /> {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        </div>
      )}
      {step === 'forgot' && (
        <div style={{ padding: '0 10px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: 'var(--primary-color)' }}>Reset Password</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '15px' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setStep('login')}>
              Back to Login
            </button>
          </form>
        </div>
      )}

      {step === 'reset-sent' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle color="var(--success-color)" size={32} />
          </div>
          <h2 style={{ color: 'var(--primary-color)' }}>Check your inbox</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '20px 0' }}>
            We've sent a password reset link to <strong>{email}</strong>.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep('login')}>
            Back to Login
          </button>
        </div>
      )}

      {step === 'update-password' && (
        <div style={{ padding: '0 10px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: 'var(--primary-color)' }}>Set New Password</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Choose a secure password</p>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Confirm New Password</label>
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

            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
      {step === 'email-otp' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Mail color="var(--primary-color)" size={32} />
          </div>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Email Verification</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.5' }}>
            A 6-digit verification code was sent to <strong>{tempUser?.email}</strong>.
          </p>

          <form onSubmit={handleVerifyEmailOtp}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="000000"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value)}
              required
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', marginBottom: '20px', fontWeight: 'bold' }}
            />
            
            {error && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginBottom: '15px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={resendOtp} disabled={loading}>
                Resend Code
              </button>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep('login')}>
                Back
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
