import React, { useState } from 'react';

export default function PasswordInput({ name, value, onChange, placeholder, required = true, style }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px',
          paddingRight: '40px', // Make room for the eye icon
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontFamily: 'inherit',
          ...style 
        }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        tabIndex="-1" // Prevents the tab key from getting stuck on the eye icon
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555'
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}