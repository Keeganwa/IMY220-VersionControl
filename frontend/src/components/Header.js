import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // _____________________________________________________________
  // MARKS: User Authentication State Management
  // Fetches current user data and handles logout functionality
  // Displays user-specific navigation and profile informaton
  // _____________________________________________________________
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (apiUtils.isAuthenticated()) {
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            setCurrentUser(response.user);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        // If token is invalid, clear it
        apiUtils.logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleSignOut = () => {
    // Clear authentication data
    apiUtils.logout();
    setCurrentUser(null);
    
    // Navigate to splash page
    navigate('/');
  };

  if (isLoading) {
    return (
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
          <span style={{color: '#888'}}>Loading...</span>
        </nav>
      </header>
    );
  }

  return (
    <>
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
          {currentUser && (
            <span style={{color: '#d4ff00', marginRight: '15px'}}>
              Welcome, {currentUser.username}
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSignOut}>
            Sign Out
          </button>
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
              to={`/profile/${currentUser?._id || '1'}`}
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