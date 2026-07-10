import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const existingOrder = location.state?.editOrder || null;
  const orderId = existingOrder?.ORDER_ID || null;

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState(existingOrder ? existingOrder.items : []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/menu/search', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        const fetchedMenu = data.data || [];
        setMenuItems(fetchedMenu);

        if (existingOrder && existingOrder.items) {
            const fixedCart = existingOrder.items.map(cartItem => {
                const matchedMenu = fetchedMenu.find(m => m.name === cartItem.name);
                return {
                    ...cartItem,
                    item_id: matchedMenu ? matchedMenu.item_id : null
                };
            });
            setCart(fixedCart);
        }
      }
    } catch (e) { console.error("Menu fetch failed"); }
  };

  const isNonVeg = (item) => {
    const textToScan = `${item.name} ${item.ingredients}`.toLowerCase();
    const meatRegex = /\b(chicken|mutton|fish|prawn|egg|eggs|meat)\b/i;
    return meatRegex.test(textToScan);
  };

  const addToCart = () => {
    const qty = parseInt(quantity);
    const existing = cart.find(i => i.item_id === selectedItem.item_id);
    const currentQty = existing ? existing.quantity : 0;
    
    if (currentQty + qty > 10) return alert("Limit: 10 per item");

    if (existing) {
      setCart(cart.map(i => i.item_id === selectedItem.item_id ? { ...i, quantity: i.quantity + qty } : i));
    } else {
      setCart([...cart, { item_id: selectedItem.item_id, name: selectedItem.name, quantity: qty }]);
    }
    setSelectedItem(null);
  };

  const handleFinalOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    setLoading(true);
    
    const url = orderId ? `http://127.0.0.1:8000/orders/${orderId}` : `http://127.0.0.1:8000/orders/create`;

    try {
      const validCartItems = cart.filter(i => i.item_id).map(i => ({ item_id: i.item_id, quantity: i.quantity }));

      const res = await fetch(url, {
        method: orderId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validCartItems })
      });

      if (res.ok) {
        alert(orderId ? "Order Updated!" : "Order Placed!");
        navigate('/orders');
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail || "Request failed"}`);
      }
    } catch (e) { alert("Network error"); }
    finally { setLoading(false); }
  };

  const filteredMenu = menuItems.filter(item => {
      if (categoryFilter === 'All') return true;
      const nonVeg = isNonVeg(item);
      if (categoryFilter === 'Veg') return !nonVeg;
      if (categoryFilter === 'Non-Veg') return nonVeg;
      return true;
  });

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', background: '#ffffff', padding: '20px 30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#111827', margin: 0, fontSize: '24px', fontWeight: '700' }}>
          {orderId ? `Modify Order #${orderId}` : 'Menu Selection'}
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}
          >
            <option value="All">All Items</option>
            <option value="Veg">🟢 Pure Veg</option>
            <option value="Non-Veg">🔴 Non-Veg</option>
          </select>

          {orderId && (
            <button 
              onClick={() => navigate('/orders')} 
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
      
      {cart.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '25px', borderRadius: '16px', marginBottom: '35px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '700' }}>Your Current Selection</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '25px' }}>
            {cart.map(item => (
              <div key={item.item_id || item.name} style={{ background: '#f3f4f6', padding: '8px 8px 8px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                  {item.name} <span style={{ color: '#059669', fontWeight: '700', marginLeft: '4px' }}>x{item.quantity}</span>
                </span>
                <button 
                  onClick={() => setCart(cart.filter(i => (i.item_id || i.name) !== (item.item_id || item.name)))}
                  style={{ background: '#ef4444', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'background 0.2s, transform 0.1s' }}
                >✕</button>
              </div>
            ))}
          </div>
          <button 
            onClick={handleFinalOrder} 
            disabled={loading} 
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '16px', width: '100%', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '16px', letterSpacing: '0.025em', transition: 'background 0.2s', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Processing...' : orderId ? 'Confirm Updates' : 'Place Order'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
        {filteredMenu.map(item => {
          const isItemNonVeg = isNonVeg(item);
          return (
            <div 
              key={item.item_id} 
              onClick={() => {setSelectedItem(item); setQuantity(1);}} 
              style={{ border: '1px solid #e5e7eb', padding: '25px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', background: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '12px' }}>
                {isItemNonVeg ? '🔴' : '🟢'}
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1f2937', fontWeight: '600' }}>{item.name}</h3>
              <p style={{ color: '#059669', fontWeight: '800', margin: 0, fontSize: '18px' }}>₹{item.cost}</p>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', padding: '35px', borderRadius: '20px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ width: '100%', height: '180px', backgroundColor: '#f3f4f6', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
               {selectedItem.image_url ? (
                  <img src={selectedItem.image_url} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                  <div style={{ textAlign: 'center' }}>
                     <span style={{ fontSize: '50px', display: 'block', marginBottom: '10px' }}>🍲</span>
                     <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>Image not available</span>
                  </div>
               )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#111827', fontSize: '24px', fontWeight: '700' }}>
                {selectedItem.name} {isNonVeg(selectedItem) ? '🔴' : '🟢'}
              </h3>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>₹{selectedItem.cost}</span>
            </div>
            
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', margin: '0 0 15px 0' }}>
              {selectedItem.description}
            </p>
            
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Ingredients</span>
                <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>{selectedItem.ingredients}</span>
            </div>

            <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: '600' }}>Plates (Max 10):</label>
              <input 
                type="number" min="1" max="10" value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', textAlign: 'center', fontSize: '18px', fontWeight: '600', color: '#374151', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setSelectedItem(null)} 
                style={{ flex: 1, background: '#f3f4f6', color: '#4b5563', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Cancel
              </button>
              <button 
                onClick={addToCart} 
                style={{ flex: 2, background: '#10b981', color: 'white', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Add to Order
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}