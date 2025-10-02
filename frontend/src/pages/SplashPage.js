import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

function SplashPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="splash-container">
      <header className="header">
        <div className="logo-section">
          <div className="logo">
            <span style={{fontSize: '24px'}}>🔧</span>
          </div>
          <div className="logo-text">
            <h1>Codebase</h1>
            <span className="studio">STUDIO</span>
          </div>
        </div>
        <nav className="nav-buttons">
          <button className="btn btn-primary" onClick={() => setShowSignup(true)}>
            Register
          </button>
          <button className="btn btn-secondary" onClick={() => setShowLogin(true)}>
            Sign In
          </button>
        </nav>
      </header>

      <div className="splash-content">
        {!showLogin && !showSignup && (
          <>
            <p className="tagline">Version Control and Cooperation Platform!</p>
            <div className="code-snippet">
              while ( ! &#123; succeed = try() &#125; );
            </div>
            <div className="cloud-image">
              {/* Cloud image with circuit board will go here */}
              <svg width="600" height="400" viewBox="0 0 600 400">
                <ellipse cx="300" cy="200" rx="200" ry="100" fill="#e0e0e0" opacity="0.9"/>
                <ellipse cx="200" cy="180" rx="120" ry="80" fill="#f0f0f0"/>
                <ellipse cx="400" cy="190" rx="150" ry="90" fill="#f0f0f0"/>
                {/* Circuit lines */}
                <path d="M 300 300 L 300 350 L 350 350" stroke="#51cf66" strokeWidth="3" fill="none"/>
                <path d="M 350 350 L 400 350 L 400 300" stroke="#51cf66" strokeWidth="3" fill="none"/>
                <path d="M 250 320 L 250 370 L 300 370" stroke="#51cf66" strokeWidth="3" fill="none"/>
                <circle cx="300" cy="300" r="5" fill="#51cf66"/>
                <circle cx="350" cy="350" r="5" fill="#51cf66"/>
                <circle cx="250" cy="320" r="5" fill="#51cf66"/>
              </svg>
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
                onClick={() => {setShowLogin(false); setShowSignup(true);}}
              >
                Register here
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
                onClick={() => {setShowSignup(false); setShowLogin(true);}}
              >
                Sign in here
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SplashPage;