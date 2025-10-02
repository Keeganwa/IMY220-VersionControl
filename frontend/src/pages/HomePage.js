import React from 'react';
import Header from '../components/Header';
import SearchInput from '../components/SearchInput';
import Feed from '../components/Feed';

function HomePage() {
  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
    // Search functionality will be implemented in future deliverables
  };

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="page-header">
          <h1>Home</h1>
          <p>View and manage your projects</p>
        </div>
        <SearchInput onSearch={handleSearch} />
        <Feed />
      </main>
    </div>
  );
}

export default HomePage;