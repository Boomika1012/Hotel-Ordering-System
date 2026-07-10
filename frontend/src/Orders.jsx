import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from './components/PasswordInput';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  
  // Security Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPassword, setPayPassword] = useState('');
  const [payError, setPayError] = useState('');

  // Feedback Modal States
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    ambience: 5, cleanliness: 5, food_quality: 5, taste: 5, service: 5, comments: ''
  });

  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/orders/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setOrders(data.data || []);
    } catch (err) { console.error("Fetch error:", err); }
  };

  const formatToIST = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  useEffect(() => {
    if (!selectedOrder) return;
    const checkTime = () => {
      const orderTime = new Date(selectedOrder.CREATED_AT).getTime();
      const nowUTC = new Date().getTime() - (5.5 * 60 * 60 * 1000); 
      const diff = Math.abs(nowUTC - orderTime);
      setCanEdit(diff < 180000); // 3 minute window
    };
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [selectedOrder]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payPassword) return setPayError("Password is required.");
    setPayError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        order_id: selectedOrder.ORDER_ID,
        wallet_amount: selectedOrder.TOTAL_COST,
        other_amount: 0,
        password: payPassword
      };

      const response = await fetch('http://127.0.0.1:8000/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Payment Successful! Order is now preparing.");
        setShowPayModal(false);
        setPayPassword('');
        fetchOrders(); 
        setSelectedOrder({...selectedOrder, STATUS: 'COMPLETED'}); 
        
        // 🔥 Trigger Feedback Modal after successful payment
        setShowFeedbackModal(true);
      } else {
        if (data.detail && data.detail.includes("Insufficient wallet balance")) {
           const proceed = window.confirm("Insufficient Wallet Balance! Would you like to go to your Wallet to add funds?");
           if (proceed) navigate('/wallet');
        } else {
           setPayError(data.detail || "Payment failed");
        }
      }
    } catch (err) {
      setPayError("Network error during payment");
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        order_id: selectedOrder.ORDER_ID,
        ...feedbackData
      };

      const response = await fetch('http://127.0.0.1:8000/orders/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Feedback submitted successfully. Thank you!");
        setShowFeedbackModal(false);
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to submit feedback");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', maxWidth: '750px', margin: '0 auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <h2 style={{ color: '#1f2937', margin: '0 0 25px 0', textAlign: 'center', fontSize: '28px', fontWeight: '700' }}>
          {selectedOrder ? 'Order Details' : 'Order History'}
        </h2>

        {/* LIST VIEW */}
        {!selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {orders.length > 0 ? (
              orders.map(o => (
                <div 
                  key={o.ORDER_ID}
                  onClick={() => setSelectedOrder(o)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fafafa', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4338ca'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>Order #{o.ORDER_ID}</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{formatToIST(o.CREATED_AT)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontWeight: '700', color: '#111827', fontSize: '18px', marginBottom: '6px' }}>₹{o.TOTAL_COST}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', backgroundColor: o.STATUS === 'COMPLETED' ? '#d1fae5' : '#fef3c7', color: o.STATUS === 'COMPLETED' ? '#059669' : '#d97706' }}>
                      {o.STATUS}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontStyle: 'italic' }}>No orders found.</div>
            )}
          </div>
        )}

        {/* DETAILS VIEW */}
        {selectedOrder && (
          <div style={{ textAlign: 'left', border: '1px solid #e5e7eb', padding: '25px', borderRadius: '12px', backgroundColor: '#ffffff', animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#111827', fontSize: '22px' }}>Order #{selectedOrder.ORDER_ID}</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Placed on: {formatToIST(selectedOrder.CREATED_AT)}</p>
              </div>
              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '8px 16px', borderRadius: '20px', fontSize: '16px', fontWeight: '700' }}>
                ₹{selectedOrder.TOTAL_COST}
              </span>
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Ordered</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', background: '#f9fafb', padding: '14px 18px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>{item.name}</span>
                      <span style={{ fontWeight: '700', color: '#059669', backgroundColor: '#d1fae5', padding: '2px 10px', borderRadius: '12px', fontSize: '14px' }}>x{item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>No items found for this order.</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', alignItems: 'center' }}>
              
              {selectedOrder.STATUS === 'PENDING' && (
                <button 
                  onClick={() => setShowPayModal(true)}
                  style={{ flex: 1, background: '#2563eb', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                >
                  Pay ₹{selectedOrder.TOTAL_COST}
                </button>
              )}

              {canEdit && selectedOrder.STATUS === 'PENDING' ? (
                <button 
                  onClick={() => navigate('/menu', { state: { editOrder: selectedOrder } })}
                  style={{ flex: 1, background: '#f59e0b', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                >
                  Modify Order
                </button>
              ) : (
                <span style={{ flex: 1, color: '#ef4444', fontSize: '14px', fontWeight: '500', textAlign: 'center', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px' }}>
                  {selectedOrder.STATUS === 'COMPLETED' ? 'Order Finalized' : 'Edit window closed'}
                </span>
              )}
              
              {/* Optional: Add a button to manually trigger feedback for completed orders */}
              {selectedOrder.STATUS === 'COMPLETED' && (
                 <button 
                   onClick={() => setShowFeedbackModal(true)}
                   style={{ flex: 1, background: '#10b981', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                 >
                   Leave Feedback
                 </button>
              )}

              <button 
                onClick={() => setSelectedOrder(null)} 
                style={{ flex: 1, background: '#4b5563', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
              >
                Back to All Orders
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT SECURITY MODAL */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '350px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#1f2937' }}>Security Verification</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#4b5563', marginBottom: '20px' }}>
              Confirm payment of <strong>₹{selectedOrder.TOTAL_COST}</strong> from your wallet.
            </p>
            
            {payError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>{payError}</div>}
            
            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Account Password</label>
                <PasswordInput 
                  name="payPassword" 
                  value={payPassword} 
                  onChange={(e) => setPayPassword(e.target.value)} 
                  placeholder="Enter password to pay" 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => { setShowPayModal(false); setPayError(''); setPayPassword(''); }} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Confirm Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#1f2937' }}>Rate Your Experience</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#4b5563', marginBottom: '20px' }}>
              How was your order? (1 = Poor, 5 = Excellent)
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              {['ambience', 'cleanliness', 'food_quality', 'taste', 'service'].map(field => (
                <div key={field} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'capitalize' }}>
                    {field.replace('_', ' ')}
                  </label>
                  <input 
                    type="number" min="1" max="5" required
                    value={feedbackData[field]} 
                    onChange={(e) => setFeedbackData({...feedbackData, [field]: parseInt(e.target.value)})} 
                    style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', textAlign: 'center' }} 
                  />
                </div>
              ))}

              <div style={{ marginBottom: '20px', marginTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Additional Comments</label>
                <textarea 
                  value={feedbackData.comments} 
                  onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})} 
                  placeholder="Tell us what you loved..." 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '60px', boxSizing: 'border-box', fontFamily: 'inherit' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowFeedbackModal(false)} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Skip</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}