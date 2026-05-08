import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, LogIn, ShieldCheck, QrCode } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // MFA State
  const [step, setStep] = useState('login'); // 'login' | 'challenge'
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        // Check if MFA is required or enrolled
        const factors = data.user.factors || [];
        
        if (factors.length === 0) {
          // No MFA enrolled yet. Let them login. They can enroll in Admin panel.
          onLogin(data.session);
        } else {
          // Already enrolled, prompt for challenge code
          const totpFactor = factors.find(f => f.factor_type === 'totp');
          if (totpFactor) {
            setFactorId(totpFactor.id);
            setStep('challenge');
          } else {
            // Unknown factor type, just login for now
            onLogin(data.session);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
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

      // Verification successful!
      const { data: sessionData } = await supabase.auth.getSession();
      onLogin(sessionData.session);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@vakultech.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
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
          </form>
        </>
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

    </div>
  );
}
