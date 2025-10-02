import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();

  return (
    <>
      <header className="header">
        <div className="logo-section">
          <div className="logo">
            {/* Logo image will go here */}
            <span style={{fontSize: '24px'}}>🔧</span>
          </div>
          <div className="logo-text">
            <h1>Codebase</h1>
            <span className="studio">STUDIO</span>
          </div>
        </div>
        <nav className="nav-buttons">
          <Link to="/" className="btn btn-primary">Sign Out</Link>
        </nav>
      </header>
      <nav className="main-nav">
        <ul>
          <li>
            <Link 
              to="/home" 
              className={location.pathname === '/home' ? 'active' : ''}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/profile/1" 
              className={location.pathname.includes('/profile') ? 'active' : ''}
            >
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Header;