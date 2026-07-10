import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PasswordInput from './components/PasswordInput'; // ✅ NEW IMPORT

const API_URL = 'http://127.0.0.1:8000';

export default function AuthPage() {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const validatePassword = (password) => {
    if (password.length < 6 || password.length > 32) return "Password must be between 6 and 32 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/\d/.test(password)) return "Password must contain at least one digit.";
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password)) return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // 🔐 FORGOT PASSWORD
    if (view === 'forgot') {
      try {
        const response = await fetch(`${API_URL}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Request failed');

        setMessage(data.message || "Reset link sent!");
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    // 🔐 REGISTER VALIDATION
    if (view === 'register') {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    const endpoint = view === 'login' ? '/login' : '/register';

    try {
      const payload =
        view === 'login'
          ? { email: formData.email, password: formData.password }
          : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // 🔥 ADVANCED ERROR HANDLING
      if (!response.ok) {
        if (response.status === 422 && Array.isArray(data.detail)) {
          const isEmailError = data.detail.some(err => err.loc.includes('email'));
          if (isEmailError) throw new Error("Invalid Email");

          const errorMessages = data.detail
            .map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`)
            .join(' | ');

          throw new Error(errorMessages);
        }

        throw new Error(data.detail?.message || data.detail || 'Authentication failed');
      }

      // ✅ LOGIN
      if (view === 'login') {
        const token = data.data?.Authorization?.access_token || data.access_token;

        if (!token) throw new Error("No token received from server");

        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', formData.email);

        const tempName = localStorage.getItem('tempRegName');
        const fetchedName =
          data.data?.name ||
          data?.user?.name ||
          data?.name ||
          tempName ||
          '';

        localStorage.setItem('userName', fetchedName);

        const origin = location.state?.from?.pathname || '/home';
        navigate(origin);
      }

      // ✅ REGISTER
      else {
        localStorage.setItem('tempRegName', formData.name);
        alert("Registration successful! Please login.");
        setView('login');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      
      {/* TITLE */}
      <h2>
        {view === 'login'
          ? 'Login to Foodie Junction'
          : view === 'register'
          ? 'Create an Account'
          : 'Reset Password'}
      </h2>

      {/* ERROR / SUCCESS */}
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ color: 'green', marginBottom: '15px', padding: '10px', background: '#e6ffe6', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* REGISTER NAME */}
        {view === 'register' && (
          <input
            type="text"
            placeholder="Full Name"
            required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email Address"
          required
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        {/* ✅ UPDATED PASSWORD INPUT */}
        {view !== 'forgot' && (
          <div style={{ textAlign: 'left' }}>
            
            <PasswordInput 
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            {view === 'register' && (
              <small style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '5px', lineHeight: '1.4' }}>
                Must be 6-32 chars, with at least 1 uppercase, 1 lowercase, 1 number, and 1 special char.
              </small>
            )}
          </div>
        )}

        <button type="submit">
          {view === 'login'
            ? 'Login'
            : view === 'register'
            ? 'Register'
            : 'Send Reset Link'}
        </button>
      </form>

      {/* NAVIGATION */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {view === 'login' && (
          <>
            <button
              type="button"
              onClick={() => {
                setView('forgot');
                setError(null);
                setMessage(null);
              }}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
            >
              Forgot Password?
            </button>

            <span style={{ fontSize: '14px' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('register');
                  setError(null);
                  setMessage(null);
                }}
                style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Register here
              </button>
            </span>
          </>
        )}

        {(view === 'register' || view === 'forgot') && (
          <span style={{ fontSize: '14px' }}>
            Back to{' '}
            <button
              type="button"
              onClick={() => {
                setView('login');
                setError(null);
                setMessage(null);
              }}
              style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Login
            </button>
          </span>
        )}
      </div>
    </div>
  );
}