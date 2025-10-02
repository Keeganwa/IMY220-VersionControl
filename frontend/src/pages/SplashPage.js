import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

function SplashPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowSignup(false);
  };

  const handleShowSignup = () => {
    setShowSignup(true);
    setShowLogin(false);
  };

  const handleBackToHome = () => {
    setShowLogin(false);
    setShowSignup(false);
  };

  return (
    <div className="splash-container">
      <header className="header">
        <div className="logo-section">
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div className="logo">
                <img 
                  src="/assets/images/logo.png" 
                  alt="Codebase Studio Logo" 
                  style={{
                    width: '50px', 
                    height: '50px', 
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <span style={{fontSize: '24px', display: 'none'}}>🔧</span>
              </div>
              <div className="logo-text">
                <h1>Codebase</h1>
                <span className="studio">STUDIO</span>
              </div>
            </div>
            <p style={{
              color: '#d4ff00', 
              fontSize: '16px', 
              fontWeight: '500', 
              marginTop: '8px',
              marginLeft: '60px'
            }}>
              Version Control and Cooperation Platform!
            </p>
          </div>
        </div>
        <nav className="nav-buttons">
          <button 
            className="btn btn-primary" 
            onClick={handleShowSignup}
          >
            Register
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleShowLogin}
          >
            Sign In
          </button>
        </nav>
      </header>

      <div className="splash-content">
        {!showLogin && !showSignup && (
          <>
            {/* Cloud image with better blending */}
            <div className="cloud-image" style={{
              position: 'absolute',
              top: '180px',
              right: '-50px',
              width: '650px',
              height: '450px',
              opacity: '0.85',
              filter: 'brightness(0.9)',
              background: 'linear-gradient(135deg, rgba(42, 42, 42, 0.3), rgba(26, 26, 26, 0.1))',
              borderRadius: '20px'
            }}>
              <img 
                src="/assets/images/cloud.png" 
                alt="Cloud with Circuit Board" 
                style={{
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  mixBlendMode: 'screen'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <svg width="650" height="450" viewBox="0 0 650 450" style={{display: 'none'}}>
                <ellipse cx="325" cy="225" rx="220" ry="110" fill="#e0e0e0" opacity="0.7"/>
                <ellipse cx="220" cy="200" rx="130" ry="85" fill="#f0f0f0" opacity="0.6"/>
                <ellipse cx="430" cy="210" rx="160" ry="95" fill="#f0f0f0" opacity="0.6"/>
                <path d="M 325 325 L 325 375 L 375 375" stroke="#51cf66" strokeWidth="2" fill="none" opacity="0.8"/>
                <path d="M 375 375 L 425 375 L 425 325" stroke="#51cf66" strokeWidth="2" fill="none" opacity="0.8"/>
                <path d="M 275 345 L 275 395 L 325 395" stroke="#51cf66" strokeWidth="2" fill="none" opacity="0.8"/>
                <circle cx="325" cy="325" r="4" fill="#51cf66" opacity="0.8"/>
                <circle cx="375" cy="375" r="4" fill="#51cf66" opacity="0.8"/>
                <circle cx="275" cy="345" r="4" fill="#51cf66" opacity="0.8"/>
              </svg>
            </div>

            {/* Main content area with better spacing */}
            <div style={{
              maxWidth: '550px',
              marginTop: '120px',
              position: 'relative',
              zIndex: 1,
              paddingRight: '100px'
            }}>
              <h2 style={{
                color: '#e0e0e0',
                fontSize: '52px',
                fontWeight: '700',
                marginBottom: '25px',
                lineHeight: '1.1',
                letterSpacing: '-1px'
              }}>
                Build. Collaborate.<br/>Deploy.
              </h2>
              
              <p style={{
                color: '#b0b0b0',
                fontSize: '19px',
                lineHeight: '1.7',
                marginBottom: '35px',
                maxWidth: '480px'
              }}>
                The modern platform for developers to manage code, track changes, 
                and collaborate seamlessly on projects of any scale.
              </p>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '45px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  backgroundColor: 'rgba(212, 255, 0, 0.15)',
                  border: '1px solid rgba(212, 255, 0, 0.5)',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: '#d4ff00',
                  fontWeight: '500'
                }}>
                  Real-time Collaboration
                </div>
                <div style={{
                  backgroundColor: 'rgba(212, 255, 0, 0.15)',
                  border: '1px solid rgba(212, 255, 0, 0.5)',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: '#d4ff00',
                  fontWeight: '500'
                }}>
                  Version Control
                </div>
                <div style={{
                  backgroundColor: 'rgba(212, 255, 0, 0.15)',
                  border: '1px solid rgba(212, 255, 0, 0.5)',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: '#d4ff00',
                  fontWeight: '500'
                }}>
                  Project Management
                </div>
              </div>

              <div className="code-snippet" style={{
                backgroundColor: '#000',
                color: '#fff',
                padding: '18px 24px',
                borderRadius: '10px',
                fontFamily: "'Courier New', monospace",
                fontSize: '16px',
                border: '1px solid #333',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                maxWidth: '400px'
              }}>
                while ( ! &#123; succeed = try() &#125; );
              </div>
            </div>
          </>
        )}

        {showLogin && !showSignup && (
          <div>
            <LoginForm />
            <p style={{textAlign: 'center', marginTop: '20px', color: '#b0b0b0'}}>
              Don't have an account? {' '}
              <span 
                style={{color: '#d4ff00', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={handleShowSignup}
              >
                Register here
              </span>
            </p>
            <p style={{textAlign: 'center', marginTop: '10px'}}>
              <span 
                style={{color: '#888', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={handleBackToHome}
              >
                ← Back to home
              </span>
            </p>
          </div>
        )}

        {showSignup && !showLogin && (
          <div>
            <SignupForm />
            <p style={{textAlign: 'center', marginTop: '20px', color: '#b0b0b0'}}>
              Already have an account? {' '}
              <span 
                style={{color: '#d4ff00', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={handleShowLogin}
              >
                Sign in here
              </span>
            </p>
            <p style={{textAlign: 'center', marginTop: '10px'}}>
              <span 
                style={{color: '#888', cursor: 'pointer', textDecoration: 'underline'}}
                onClick={handleBackToHome}
              >
                ← Back to home
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SplashPage;