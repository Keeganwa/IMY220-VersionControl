import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // _____________________________________________________________
  //  User Authentication State Management
  // _____________________________________________________________
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (apiUtils.isAuthenticated()) {
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            setCurrentUser(response.user);
            setIsAdmin(response.user.isAdmin || false);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        apiUtils.logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleSignOut = () => {
    apiUtils.logout();
    setCurrentUser(null);
    navigate('/');
  };

  if (isLoading) {
    return (
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
                <h1 
                  onClick={() => navigate('/home')}
                  style={{cursor: 'pointer'}}
                >
                  Codebase
                </h1>
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
          <span style={{color: '#888'}}>Loading...</span>
        </nav>
      </header>
    );
  }

  return (
    <>
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
                <h1 
                  onClick={() => navigate('/home')}
                  style={{cursor: 'pointer'}}
                >
                  Codebase
                </h1>
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
          {isAdmin && (
            <li>
              <Link to="/admin">Admin</Link>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

export default Header;