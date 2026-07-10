import React, { useState, useEffect } from 'react';
import p1Image from './images/p1.jpg'; 
import p2Image from './images/p2.jpg'; 
import p3Image from './images/p3.jpg'; 
import p4Image from './images/p4.jpg'; 

export default function Home() {
  const backgroundImages = [
    p1Image,
    p2Image,
    p3Image,
    p4Image
  ];

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      fontFamily: "'Georgia', serif",
      color: '#fff',
    },
    background: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${backgroundImages[bgIndex]})`,
      // 'cover' prevents image distortion while filling the screen
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat', 
      transition: 'background-image 1.5s ease-in-out',
      zIndex: -2,
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // Lightened the global overlay so the image is brighter
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      zIndex: -1,
    },
    content: {
      padding: '100px 40px',
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
      // Made the content box more transparent and reduced the blur
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(2px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderTop: '5px solid #d4af37',
      borderRadius: '12px',
      boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '80px',
    },
    title: {
      color: '#ff6b6b',
      fontFamily: "'Great Vibes', cursive",
      fontSize: '7.5rem',
      fontWeight: 'normal',
      letterSpacing: '2px',
      margin: '0 0 10px 0',
      textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
    },
    subtitle: {
      color: '#d4af37',
      fontSize: '1.6rem',
      fontWeight: 'bold',
      letterSpacing: '2px',
      textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
    },
    aboutSection: {
      marginBottom: '60px',
      padding: '40px',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    sectionTitle: {
      color: '#ff9f43',
      fontSize: '3rem',
      borderBottom: '2px solid #d4af37',
      paddingBottom: '15px',
      marginBottom: '40px',
      textAlign: 'center',
      fontWeight: 'bold',
      letterSpacing: '2px',
      textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
    },
    paragraph: {
      fontSize: '1.3rem',
      lineHeight: '2',
      textAlign: 'center',
      color: '#f1f2f6',
      maxWidth: '1000px',
      margin: '0 auto',
      textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
    },
    dishGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
    },
    dishCard: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid #d4af37',
      padding: '30px',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      cursor: 'default',
    },
    regionLabel: {
      display: 'inline-block',
      backgroundColor: '#ff6b6b',
      color: 'white',
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      marginBottom: '20px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    dishTitle: {
      color: '#d4af37',
      fontSize: '1.8rem',
      marginBottom: '15px',
      fontWeight: '600',
      textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
    },
    dishDesc: {
      color: '#ced6e0',
      fontSize: '1.1rem',
      lineHeight: '1.7',
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}
      </style>
      
      <div style={styles.background}></div>
      <div style={styles.overlay}></div>

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome to Foodie Junction</h1>
          <p style={styles.subtitle}>A Journey Through India's Authentic Flavors</p>
        </div>

        <div style={styles.aboutSection}>
          <h2 style={styles.sectionTitle}>About The Hotel</h2>
          <p style={styles.paragraph}>
            Welcome to Craving, your ultimate destination for culinary bliss. We celebrate the rich, diverse heritage of Indian cuisine, bringing together the fiery spices of the South, the rich gravies of the North, the traditional staples of Tamil Nadu, and the hidden gems of Central India. Every meal is a celebration, cooked with passion and served with love.
          </p>
        </div>

        <div style={styles.aboutSection}>
          <h2 style={styles.sectionTitle}>Our Iconic Dishes</h2>
          <div style={styles.dishGrid}>
            
            <div style={styles.dishCard}>
              <span style={styles.regionLabel}>Tamil Nadu</span>
              <h3 style={styles.dishTitle}>Authentic Chettinad Chicken</h3>
              <p style={styles.dishDesc}>A fiery, aromatic masterpiece made with fresh ground spices, Kalpasi, and coconut, served alongside soft, flaky Malabar Parottas.</p>
            </div>

            <div style={styles.dishCard}>
              <span style={styles.regionLabel}>South Indian</span>
              <h3 style={styles.dishTitle}>Mysore Masala Dosa</h3>
              <p style={styles.dishDesc}>A crisp, golden crepe smeared with a spicy red garlic chutney, generously stuffed with buttery potato masala, served with fresh coconut chutney and sambar.</p>
            </div>

            <div style={styles.dishCard}>
              <span style={styles.regionLabel}>North Indian</span>
              <h3 style={styles.dishTitle}>Classic Butter Chicken</h3>
              <p style={styles.dishDesc}>Tender tandoor-roasted chicken simmered in a rich, velvety tomato and cashew gravy, finished with a touch of fenugreek and heavy cream.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}