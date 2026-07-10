import React, { useState, useEffect } from 'react';
import PasswordInput from './components/PasswordInput';

export default function Profile() {
  const currentUserEmail = localStorage.getItem('userEmail') || '';
  const currentUserName = localStorage.getItem('userName') || '';
  const token = localStorage.getItem('token'); 
  const storageKey = `userProfile_${currentUserEmail}`;

  // --- VIEW STATE ---
  const [activeTab, setActiveTab] = useState('profile');

  // --- PROFILE STATE ---
  const [profile, setProfile] = useState(() => {
    const savedProfile = sessionStorage.getItem(storageKey);
    const defaultProfile = {
      name: currentUserName,
      email: currentUserEmail,
      phone: '',
      address: '',
      dob: '',
      preferences: 'Veg',
      kycPending: { name: false, address: false, dob: false }
    };

    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      return { 
        ...defaultProfile, 
        ...parsed, 
        email: currentUserEmail,
        kycPending: parsed.kycPending || defaultProfile.kycPending 
      };
    }
    return defaultProfile;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [errors, setErrors] = useState({});
  const [idProof, setIdProof] = useState(null);

  // --- PASSWORD STATE ---
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ error: '', success: '' });

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile, storageKey]);

  const requiresKyc = 
    formData.name !== profile.name || 
    formData.address !== profile.address || 
    formData.dob !== profile.dob;

  // --- PROFILE HANDLERS ---
  const handleEditClick = () => {
    setFormData({ ...profile });
    setErrors({});
    setIdProof(null);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setErrors({});
    setIdProof(null);
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) newErrors.phone = "Valid phone required";

    if (!formData.address.trim() || formData.address.length < 5) {
      newErrors.address = "Complete address required";
    }

    if (!formData.dob) newErrors.dob = "Date of Birth is required";

    if (requiresKyc && !idProof) {
      newErrors.idProof = "ID Proof required for Name, Address, or DoB changes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const newKycStatus = { ...profile.kycPending };
      
      if (formData.name !== profile.name) newKycStatus.name = true;
      if (formData.address !== profile.address) newKycStatus.address = true;
      if (formData.dob !== profile.dob) newKycStatus.dob = true;

      const updatedProfile = { 
        ...formData, 
        kycPending: newKycStatus 
      };
      
      setProfile(updatedProfile);
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    setIdProof(e.target.files[0]);
    if (errors.idProof) setErrors((prev) => ({ ...prev, idProof: '' }));
  };

  // --- PASSWORD HANDLERS ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordStatus({ error: '', success: '' }); 
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ error: "Password must be at least 6 characters long.", success: '' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ error: "Passwords do not match.", success: '' });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });

      const result = await response.json();

      if (response.ok) {
        setPasswordStatus({ error: '', success: 'Password updated successfully!' });
        setPasswordData({ newPassword: '', confirmPassword: '' });
        
        setTimeout(() => {
          setActiveTab('profile');
          setPasswordStatus({ error: '', success: '' });
        }, 2000);
      } else {
        let exactErrorMessage = "Failed to update password.";
        
        if (result.detail) {
          if (typeof result.detail === 'string') {
            exactErrorMessage = result.detail;
          } else if (Array.isArray(result.detail) && result.detail.length > 0) {
            exactErrorMessage = result.detail[0].msg;
          } else if (result.detail.message) {
            exactErrorMessage = result.detail.message;
          }
        }

        setPasswordStatus({ error: exactErrorMessage, success: '' });
      }
    } catch (error) {
      console.error("Password update error:", error);
      setPasswordStatus({ error: "A network error occurred. Please try again.", success: '' });
    }
  };


  const styles = {
    container: {
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px', 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '40px 20px',
      backgroundColor: '#f4f7f6',
    },
    tabContainer: {
      display: 'flex',
      backgroundColor: '#e1e8ed',
      borderRadius: '8px',
      padding: '5px',
      width: '100%',
      maxWidth: '400px',
      marginBottom: '10px',
    },
    tabButton: {
      flex: 1,
      padding: '12px 15px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      color: '#555',
      transition: 'all 0.3s ease',
    },
    activeTab: {
      backgroundColor: '#ffffff',
      color: '#007bff',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    card: {
      backgroundColor: '#ffffff',
      border: '1px solid #e1e8ed',
      borderTop: '5px solid #007bff',
      borderRadius: '8px',
      padding: '40px',
      width: '100%',
      maxWidth: '800px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      color: '#333',
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
    },
    title: {
      color: '#0056b3',
      fontSize: '2rem',
      margin: '0 0 5px 0',
      fontWeight: '600',
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
    infoGroup: {
      position: 'relative',
    },
    label: {
      display: 'block',
      color: '#555',
      fontSize: '0.85rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    value: {
      fontSize: '1.1rem',
      color: '#222',
      padding: '8px 0',
      borderBottom: '1px solid #e1e8ed',
      minHeight: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      color: '#333',
      fontSize: '1rem',
      fontFamily: "inherit",
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputDisabled: {
      backgroundColor: '#e9ecef',
      color: '#6c757d',
      cursor: 'not-allowed',
      borderColor: '#ced4da',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '1rem',
      boxSizing: 'border-box',
    },
    fileInputContainer: {
      backgroundColor: '#eef2f5',
      padding: '15px',
      borderRadius: '6px',
      border: '1px dashed #007bff',
      marginTop: '10px',
    },
    errorText: {
      color: '#dc3545',
      fontSize: '0.85rem',
      marginTop: '5px',
      display: 'block',
    },
    successText: {
      color: '#28a745',
      fontSize: '0.9rem',
      marginTop: '10px',
      display: 'block',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    badge: {
      backgroundColor: '#ffc107',
      color: '#000',
      fontSize: '0.75rem',
      padding: '3px 8px',
      borderRadius: '12px',
      fontWeight: 'bold',
      marginLeft: '10px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '15px',
      marginTop: '30px',
    },
    buttonPrimary: {
      flex: 1,
      padding: '12px 20px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
    buttonSecondary: {
      flex: 1,
      padding: '12px 20px',
      backgroundColor: '#fff',
      color: '#007bff',
      border: '1px solid #007bff',
      borderRadius: '4px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
    }
  };

  return (
    <div style={styles.container}>
      
      {/* --- TAB NAVIGATION --- */}
      <div style={styles.tabContainer}>
        <button 
          style={{...styles.tabButton, ...(activeTab === 'profile' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </button>
        <button 
          style={{...styles.tabButton, ...(activeTab === 'password' ? styles.activeTab : {})}}
          onClick={() => {
            setActiveTab('password');
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setPasswordStatus({ error: '', success: '' });
          }}
        >
          Password Reset
        </button>
      </div>

      {/* --- PROFILE DETAILS CARD --- */}
      {activeTab === 'profile' && (
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.title}>My Profile</h2>
            
            {!isEditing && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                <button style={{...styles.buttonPrimary, flex: 'none'}} onClick={handleEditClick}>
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div style={styles.gridContainer}>
              <div style={styles.infoGroup}>
                <span style={styles.label}>Full Name</span>
                <div style={styles.value}>
                  {profile.name || '- Not set -'}
                  {profile.kycPending.name && <span style={styles.badge}>Pending KYC</span>}
                </div>
              </div>
              <div style={styles.infoGroup}>
                <span style={styles.label}>Email Address</span>
                <div style={styles.value}>{profile.email || '- Not set -'}</div>
              </div>
              <div style={styles.infoGroup}>
                <span style={styles.label}>Phone Number</span>
                <div style={styles.value}>{profile.phone || '- Not set -'}</div>
              </div>
              <div style={styles.infoGroup}>
                <span style={styles.label}>Date of Birth</span>
                <div style={styles.value}>
                  {profile.dob || '- Not set -'}
                  {profile.kycPending.dob && <span style={styles.badge}>Pending KYC</span>}
                </div>
              </div>
              <div style={styles.infoGroup}>
                <span style={styles.label}>Dietary Preferences</span>
                <div style={styles.value}>{profile.preferences}</div>
              </div>
              <div style={{...styles.infoGroup, ...styles.fullWidth}}>
                <span style={styles.label}>Delivery Address</span>
                <div style={styles.value}>
                  {profile.address || '- Not set -'}
                  {profile.kycPending.address && <span style={styles.badge}>Pending KYC</span>}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} noValidate>
              <div style={styles.gridContainer}>
                <div style={styles.infoGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    style={{...styles.input, borderColor: errors.name ? '#dc3545' : '#ced4da'}} 
                  />
                  {errors.name && <span style={styles.errorText}>{errors.name}</span>}
                </div>

                <div style={styles.infoGroup}>
                  <label style={styles.label}>Email Address (Not Editable)</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    readOnly
                    style={{...styles.input, ...styles.inputDisabled}} 
                  />
                </div>

                <div style={styles.infoGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    style={{...styles.input, borderColor: errors.phone ? '#dc3545' : '#ced4da'}} 
                  />
                  {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
                </div>

                <div style={styles.infoGroup}>
                  <label style={styles.label}>Date of Birth</label>
                  <input 
                    type="date" 
                    name="dob" 
                    value={formData.dob} 
                    onChange={handleChange} 
                    style={{...styles.input, borderColor: errors.dob ? '#dc3545' : '#ced4da'}} 
                  />
                  {errors.dob && <span style={styles.errorText}>{errors.dob}</span>}
                </div>

                <div style={styles.infoGroup}>
                  <label style={styles.label}>Dietary Preferences</label>
                  <select 
                    name="preferences" 
                    value={formData.preferences} 
                    onChange={handleChange} 
                    style={styles.select}
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non Veg">Non Veg</option>
                  </select>
                </div>

                <div style={{...styles.infoGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Delivery Address</label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    style={{...styles.input, minHeight: '60px', resize: 'vertical', borderColor: errors.address ? '#dc3545' : '#ced4da'}} 
                  />
                  {errors.address && <span style={styles.errorText}>{errors.address}</span>}
                </div>

                {requiresKyc && (
                  <div style={{...styles.fileInputContainer, ...styles.fullWidth}}>
                    <label style={styles.label}>ID Proof Required for Changes</label>
                    <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 10px 0' }}>
                      You have changed your Name, DoB, or Address. Please upload a valid ID/Address proof.
                    </p>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange} 
                    />
                    {errors.idProof && <span style={styles.errorText}>{errors.idProof}</span>}
                  </div>
                )}
              </div>

              <div style={styles.buttonContainer}>
                <button type="button" style={styles.buttonSecondary} onClick={handleCancelClick}>
                  Cancel
                </button>
                <button type="submit" style={styles.buttonPrimary}>
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- PASSWORD RESET CARD --- */}
      {activeTab === 'password' && (
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={{...styles.title, color: '#333'}}>Password Reset</h2>
            <p style={{ color: '#666', marginTop: '5px' }}>Manage your account password</p>
          </div>

          <form onSubmit={handlePasswordSubmit} noValidate>
            <div style={styles.gridContainer}>
              <div style={{...styles.infoGroup, ...styles.fullWidth}}>
                <label style={styles.label}>New Password</label>
                <PasswordInput 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Enter new password"
                />
              </div>

              <div style={{...styles.infoGroup, ...styles.fullWidth}}>
                <label style={styles.label}>Confirm New Password</label>
                <PasswordInput 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {passwordStatus.error && <span style={styles.errorText}>{passwordStatus.error}</span>}
            {passwordStatus.success && <span style={styles.successText}>{passwordStatus.success}</span>}

            <div style={styles.buttonContainer}>
              <button 
                type="button" 
                style={styles.buttonSecondary} 
                onClick={() => {
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setPasswordStatus({ error: '', success: '' });
                }}
              >
                Clear
              </button>
              <button type="submit" style={{...styles.buttonPrimary, backgroundColor: '#28a745'}}>
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}