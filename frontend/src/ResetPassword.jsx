import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PasswordInput from './components/PasswordInput'; // <-- IMPORT THIS

const API_URL = 'http://127.0.0.1:8000';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });

    if (passwords.newPassword.length < 6) {
      setStatus({ error: "Password must be at least 6 characters long.", success: '' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus({ error: "Passwords do not match.", success: '' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, new_password: passwords.newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ error: '', success: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => navigate('/auth'), 3000);
      } else {
        // --- IMPROVED ERROR PARSING TO PREVENT NETWORK ERRORS ---
        let exactErrorMessage = "Failed to reset password.";
        if (data.detail) {
          if (typeof data.detail === 'string') {
            exactErrorMessage = data.detail;
          } else if (Array.isArray(data.detail) && data.detail.length > 0) {
            exactErrorMessage = data.detail[0].msg;
          } else if (data.detail.message) {
            exactErrorMessage = data.detail.message;
          }
        }
        setStatus({ error: exactErrorMessage, success: '' });
      }
    } catch (err) {
      console.error("Reset Error:", err);
      setStatus({ error: err.message || "A network error occurred. Is the backend running?", success: '' });
    }
  };

  if (!token) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Invalid or missing reset token.</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2>Set New Password</h2>
      
      {status.error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>{status.error}</div>}
      {status.success && <div style={{ color: 'green', marginBottom: '15px', padding: '10px', background: '#e6ffe6', borderRadius: '4px' }}>{status.success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* --- USE NEW PASSWORD COMPONENT --- */}
        <PasswordInput 
          name="newPassword"
          placeholder="New Password" 
          value={passwords.newPassword}
          onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} 
        />
        
        <PasswordInput 
          name="confirmPassword"
          placeholder="Confirm New Password" 
          value={passwords.confirmPassword}
          onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} 
        />

        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Reset Password
        </button>
      </form>
    </div>
  );
}