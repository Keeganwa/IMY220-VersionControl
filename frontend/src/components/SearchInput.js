import React, { useState } from 'react';
import { projectAPI, userAPI } from '../services/api';

function SearchInput({ onSearch, searchType = 'projects' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // _____________________________________________________________
  // MARKS: Real Search Implementation
  // Connects to backend search endpoints for projects and users
  // Provides live search results with debouncing
  // _____________________________________________________________
  const performSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    try {
      let response;
      
      if (searchType === 'projects') {
        // Search projects by name, description, or tags
        response = await projectAPI.getProjects('global', term);
        setSearchResults(response.projects || []);
      } else if (searchType === 'users') {
        // Search users by username, email, or ocupation
        response = await userAPI.getUsers(term);
        setSearchResults(response.users || []);
      }
      
      setShowResults(true);
      
      // Call parent callback if provided
      if (onSearch) {
        onSearch(term, response);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search - wait 500ms after user stops typing
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      if (value.length >= 2) {
        performSearch(value);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
  };

  const handleResultClick = (result) => {
    if (searchType === 'projects') {
      // Navigate to project page
      window.location.href = `/project/${result._id}`;
    } else if (searchType === 'users') {
      // Navigate to user profile
      window.location.href = `/profile/${result._id}`;
    }
    setShowResults(false);
  };

  const handleClickOutside = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="search-container" style={{position: 'relative'}}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder={`Search ${searchType}...`}
          value={searchTerm}
          onChange={handleInputChange}
          onBlur={handleClickOutside}
          style={{
            background: isLoading ? '#2a2a2a url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0ZmYwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgZnJvbT0iMCAxMCAxMCIgdG89IjM2MCAxMCAxMCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz4KPC9zdmc+") no-repeat right 15px center' : ''
          }}
        />
      </form>
      
      {/* Search Results Dropdown */}
      {showResults && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#1f1f1f',
          border: '1px solid #444',
          borderRadius: '8px',
          marginTop: '5px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {searchResults.length === 0 ? (
            <div style={{padding: '15px', color: '#888', textAlign: 'center'}}>
              No {searchType} found for "{searchTerm}"
            </div>
          ) : (
            searchResults.slice(0, 10).map((result) => (
              <div
                key={result._id}
                onClick={() => handleResultClick(result)}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #333',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {searchType === 'projects' ? (
                  <div>
                    <div style={{color: '#d4ff00', fontWeight: '500'}}>{result.name}</div>
                    <div style={{color: '#888', fontSize: '12px', marginTop: '3px'}}>
                      by {result.creator?.username} • {result.tags?.join(', ')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{color: '#d4ff00', fontWeight: '500'}}>{result.username}</div>
                    <div style={{color: '#888', fontSize: '12px', marginTop: '3px'}}>
                      {result.occupation} • {result.email}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SearchInput;