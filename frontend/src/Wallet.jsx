import React, { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [cardDetails, setCardDetails] = useState({
    card_type: 'DEBIT',
    card_holder_name: '',
    card_number: '',
    expiry_date: '',
    cvv: ''
  });
  
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    if (!token) return;
    try {
      const bRes = await fetch(`${API_URL}/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(bRes.ok) {
        const data = await bRes.json();
        setBalance(data.balance || 0);
      }

      const cRes = await fetch(`${API_URL}/wallet/cards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(cRes.ok) {
        const data = await cRes.json();
        const cardsList = Array.isArray(data) ? data : (data.cards || data.data || []);
        setSavedCards(cardsList);
      }
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    if (name === 'card_type' && value !== 'DEBIT' && value !== 'CREDIT') {
      const selected = savedCards.find(c => c.card_number === value);
      if (selected) {
        setCardDetails({
          card_type: selected.card_type,
          card_holder_name: selected.card_holder_name,
          card_number: selected.card_number,
          expiry_date: selected.expiry_date,
          cvv: '' 
        });
        return;
      }
    }

    if (name === 'card_number') {
      if (!value.includes('*')) {
        // Strip non-digits and add a space every 4 digits
        let raw = value.replace(/\D/g, '');
        value = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
      }
    } 
    
    if (name === 'expiry_date') {
      value = value.replace(/\D/g, ''); 
      if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    // Strictly enforce 3 digits for CVV
    if (name === 'cvv') {
        value = value.replace(/\D/g, '').substring(0, 3);
    }

    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const isSavedCard = cardDetails.card_number.includes('*');
    const rawCard = cardDetails.card_number.replace(/\s/g, ''); 
    
    if (!isSavedCard && rawCard.length !== 16) return "Card number must be 16 digits.";
    
    const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
    const match = cardDetails.expiry_date.match(expiryRegex);
    if (!match) return "Format must be MM/YY (e.g., 06/34).";
    
    const month = parseInt(match[1]);
    const year = parseInt(match[2]);
    if (year < 26 || year > 35) return "Year must be 26-35.";
    if (year === 26 && month <= 3) return "Expiry must be after March 2026.";
    
    if (cardDetails.cvv.length !== 3) return "CVV must be exactly 3 digits.";
    if (!amount || parseFloat(amount) <= 0) return "Please enter a valid amount.";
    return null;
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) { alert(error); return; }

    try {
      const res = await fetch(`${API_URL}/wallet/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount), ...cardDetails })
      });

      if(res.ok) {
        alert("Funds Added Successfully!");
        setAmount('');
        setCardDetails({ card_type: 'DEBIT', card_holder_name: '', card_number: '', expiry_date: '', cvv: '' });
        fetchData(); 
      } else {
        const errData = await res.json();
        alert(errData.detail || "Error");
      }
    } catch (err) { alert("Server error"); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#222', marginBottom: '15px' }}>Wallet</h1>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px', padding: '15px', background: '#e9f7ef', borderRadius: '10px' }}>
          <h3 style={{margin: 0, color: '#555'}}>Current Balance</h3>
          <div style={{ fontSize: '2.5em', color: '#28a745', fontWeight: 'bold' }}>₹ {balance.toFixed(2)}</div>
        </div>

        <form onSubmit={handleFundWallet}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#444', fontWeight: '600' }}>Choose Payment Method</label>
          <select 
            name="card_type" 
            value={savedCards.some(c => c.card_number === cardDetails.card_number) ? cardDetails.card_number : cardDetails.card_type} 
            onChange={handleInputChange} 
            style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em' }}
          >
            <optgroup label="New Card">
              <option value="DEBIT">Debit Card</option>
              <option value="CREDIT">Credit Card</option>
            </optgroup>
            
            {savedCards.length > 0 && (
              <optgroup label="Use Saved Card">
                {savedCards.map((card, i) => (
                  <option key={i} value={card.card_number}>
                    {card.card_type} ({card.card_number})
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#444', fontWeight: '600' }}>Card Holder Name</label>
          <input type="text" name="card_holder_name" placeholder="Full Name" required value={cardDetails.card_holder_name} onChange={handleInputChange} style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#444', fontWeight: '600' }}>Card Number</label>
          {/* Max length increased to 19 to handle spaces */}
          <input type="text" name="card_number" placeholder="0000 0000 0000 0000" maxLength="19" required value={cardDetails.card_number} onChange={handleInputChange} style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em' }} />

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#444', fontWeight: '600' }}>Expiry (MM/YY)</label>
              <input type="text" name="expiry_date" placeholder="MM/YY" maxLength="5" required value={cardDetails.expiry_date} onChange={handleInputChange} style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#444', fontWeight: '600' }}>CVV</label>
              <input type="password" name="cvv" placeholder="***" maxLength="3" required value={cardDetails.cvv} onChange={handleInputChange} style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em' }} />
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#444', fontWeight: '600' }}>Amount to Add (₹)</label>
          <input type="number" placeholder="₹ 0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" step="0.01" style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1em' }} />

          <button type="submit" style={{ backgroundColor: '#0056b3', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '1.1em' }}>Confirm Payment</button>
        </form>
      </div>
    </div>
  );
}