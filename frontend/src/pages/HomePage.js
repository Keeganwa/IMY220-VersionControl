import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SearchInput from '../components/SearchInput';
import Feed from '../components/Feed';
import { apiUtils } from '../services/api';

function HomePage() {
  const navigate = useNavigate();

  // _____________________________________________________________
  // MARKS: Authentication Protection
  // Redirects unauthenticated users to splash page
  // Ensures only logged-in users can acces home page
  // _____________________________________________________________
  useEffect(() => {
    if (!apiUtils.isAuthenticated()) {
      console.log('User not authenticated, redirecting to splash page');
      navigate('/');
    }
  }, [navigate]);

  const handleSearch = (searchTerm, results) => {
    console.log('Search performed:', searchTerm);
    console.log('Search results:', results);
    // Search results are handled by SearchInput component
    // You can add additional logic here if needed
  };

  // Don't render page if user is not authenticated
  if (!apiUtils.isAuthenticated()) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#d4ff00'
      }}>
        Redirecting to login...
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="page-header">
          <h1>Home</h1>
          <p>View and manage your projects</p>
        </div>
        <SearchInput 
          onSearch={handleSearch} 
          searchType="projects"
        />
        <Feed />
      </main>
    </div>
  );
}

export default HomePage;