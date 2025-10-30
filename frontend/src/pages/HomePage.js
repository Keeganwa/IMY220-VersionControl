import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ProjectPreview from '../components/ProjectPreview';
import { apiUtils, userAPI, projectAPI, activityAPI } from '../services/api';

import UserLink from '../components/UserLink'; 

function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ 
    users: [], 
    projects: [],
    activities: [] 
  });
  const [feedType, setFeedType] = useState('global');
  const [activities, setActivities] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // _____________________________________________________________
  // Authentication Protection
  // _____________________________________________________________
  useEffect(() => {
    if (!apiUtils.isAuthenticated()) {
      console.log('User not authenticated, redirecting to splash page');
      navigate('/');
    }
  }, [navigate]);

  // _____________________________________________________________
  // Load Activity Feed
  // _____________________________________________________________
  useEffect(() => {
    const loadFeed = async () => {
      if (!apiUtils.isAuthenticated()) return;
      
      setIsLoadingFeed(true);
      try {
        const response = await activityAPI.getActivities(feedType, 50);
        if (response.success) {
          setActivities(response.activities || []);
        }
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    loadFeed();
  }, [feedType]);

  // _____________________________________________________________
  // Sort Activities
  // _____________________________________________________________
  const getSortedActivities = () => {
    let sorted = [...activities];

    switch (sortBy) {
      case 'date':
       
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      
      case 'project':
      
        sorted.sort((a, b) => {
          const aName = a.project?.name || '';
          const bName = b.project?.name || '';
          return aName.localeCompare(bName);
        });
        break;
      
      case 'user':

        sorted.sort((a, b) => {
          const aUser = a.user?.username || '';
          const bUser = b.user?.username || '';
          return aUser.localeCompare(bUser);
        });
        break;
      
      default:
        break;
    }

    return sorted;
  };


  useEffect(() => {
    const searchTermFromUrl = searchParams.get('search');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
      performSearch(searchTermFromUrl);
    }
  }, [searchParams]);

  const performSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults({ users: [], projects: [], activities: [] });
      return;
    }

    try {
      // Search users
      const userResponse = await userAPI.getUsers(term);
      
      // Search projects 
      const projectResponse = await projectAPI.getProjects('global', term);
      
      // Search activities
      const activityResponse = await activityAPI.searchActivities(term);

      setSearchResults({
        users: userResponse.success ? userResponse.users : [],
        projects: projectResponse.success ? projectResponse.projects : [],
        activities: activityResponse.success ? activityResponse.activities : []
      });

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ users: [], projects: [], activities: [] });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    
    if (!value.trim()) {
      setSearchResults({ users: [], projects: [], activities: [] });
    }
  };

  // _____________________________________________________________

  const handleTagClick = (tag, e) => {
    e.stopPropagation();
    navigate(`/home?search=${encodeURIComponent(tag)}`);
  };

  // _____________________________________________________________
  // Format Date
  // _____________________________________________________________
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }) + ' - ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid date';
    }
  };


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

  const hasSearchResults = searchResults.users.length > 0 || 
                          searchResults.projects.length > 0 || 
                          searchResults.activities.length > 0;

  const sortedActivities = getSortedActivities();

  return (
    <div>
      <Header />
      <main className="page-container">
        <div className="page-header">
          <h1>Home</h1>
          <p>View and manage your projects</p>
        </div>
        
        {/* Search Input */}
        <div style={{marginBottom: '30px'}}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={handleSearchInputChange}
              placeholder="Search users, projects, or check-in messages..."
              style={{
                width: '100%',
                padding: '15px 20px',
                backgroundColor: '#1f1f1f',
                border: '2px solid #333',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '16px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4ff00'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </form>
        </div>

        {/* Search Results */}
        {hasSearchResults && (
          <div style={{marginBottom: '30px'}}>
            <h2 style={{color: '#d4ff00', fontSize: '24px', marginBottom: '20px'}}>
              Search Results for "{searchTerm}"
            </h2>
            
           
            {searchResults.users.length > 0 && (
              <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#b0b0b0', fontSize: '18px', marginBottom: '15px'}}>
                  Users ({searchResults.users.length})
                </h3>
                <div style={{display: 'grid', gap: '15px'}}>
                  {searchResults.users.map(user => (
                    <div 
                      key={user._id}
                      onClick={() => navigate(`/profile/${user._id}`)}
                      style={{
                        padding: '15px',
                        backgroundColor: '#252525',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#d4ff00';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                     <UserLink user={user} style={{color: '#d4ff00', fontWeight: 'bold'}} />
                      <div style={{color: '#888', fontSize: '14px', marginTop: '5px'}}>
                        {user.email}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

         
            {searchResults.projects.length > 0 && (
              <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#b0b0b0', fontSize: '18px', marginBottom: '15px'}}>
                  Projects ({searchResults.projects.length})
                </h3>
                <div style={{display: 'grid', gap: '20px'}}>
                  {searchResults.projects.map(project => (
                    <ProjectPreview key={project._id} project={project} />
                  ))}
                </div>
              </div>
            )}

            



            {searchResults.activities.length > 0 && (
              <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#b0b0b0', fontSize: '18px', marginBottom: '15px'}}>
                  Check-ins ({searchResults.activities.length})
                </h3>
                <div style={{display: 'grid', gap: '15px'}}>
                  {searchResults.activities.map((activity, index) => (
                    <div 
                      key={activity._id || index}
                      onClick={() => activity.project && navigate(`/project/${activity.project._id}`)}
                      style={{
                        padding: '15px',
                        backgroundColor: '#252525',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        cursor: activity.project ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (activity.project) {
                          e.currentTarget.style.borderColor = '#d4ff00';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'flex-start', gap: '15px'}}>
                        {activity.project?.image && (
                          <img 
                            src={`http://localhost:5000${activity.project.image}`}
                            alt={activity.project.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '2px solid #333'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div style={{flex: 1}}>
                          <div style={{marginBottom: '8px'}}>
                            <UserLink user={activity.user} />
                            {' '}
                            <span style={{color: '#888'}}>
                              {activity.action.replace('_', ' ')}
                            </span>
                            {' '}
                            {activity.project && (
                              <span>
                                in <strong style={{color: '#d4ff00'}}>{activity.project.name}</strong>
                              </span>
                            )}
                          </div>
                          {activity.message && (
                            <div style={{
                              color: '#b0b0b0',
                              fontSize: '14px',
                              fontStyle: 'italic',
                              padding: '8px 12px',
                              backgroundColor: '#1f1f1f',
                              borderRadius: '6px',
                              borderLeft: '3px solid #d4ff00'
                            }}>
                              "{activity.message}"
                            </div>
                          )}
                          <div style={{color: '#666', fontSize: '12px', marginTop: '8px'}}>
                            {new Date(activity.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Feed  */}
        {!hasSearchResults && (
          <div>
            {/* Feed  */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              
              <div style={{display: 'flex', gap: '10px'}}>
                <button
                  className={`btn ${feedType === 'local' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setFeedType('local')}
                >
                  Local Feed
                </button>
                <button
                  className={`btn ${feedType === 'global' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setFeedType('global')}
                >
                  Global Feed
                </button>
              </div>

              {/* Sort  */}
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <label htmlFor="sortBy" style={{color: '#b0b0b0', fontSize: '14px'}}>
                  Sort by:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#1f1f1f',
                    border: '2px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="date">Latest Activity</option>
                  <option value="project">Project Name (A-Z)</option>
                  <option value="user">Username (A-Z)</option>
                </select>
              </div>
            </div>

            {/*  Feed */}
            <div className="activity-feed">
              <h3 style={{marginBottom: '20px'}}>
                {feedType === 'local' ? 'Your Friends Activity' : 'Global Activity'}
              </h3>
              
              {isLoadingFeed ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                  Loading activities...
                </div>
              ) : sortedActivities.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                  No activities yet
                </div>
              ) : (
                sortedActivities.map((activity, index) => (
                  <div 
                    key={activity._id || index} 
                    className="activity-item"
                    onClick={() => activity.project && navigate(`/project/${activity.project._id}`)}
                    style={{
                      cursor: activity.project ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}
                    onMouseEnter={(e) => {
                      if (activity.project) {
                        e.currentTarget.style.backgroundColor = '#252525';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: '15px'}}>
                     



                      {activity.project?.image && (
                        <img 
                          src={`http://localhost:5000${activity.project.image}`}
                          alt={activity.project.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '2px solid #333'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}

                      <div style={{flex: 1}}>
                        <div style={{marginBottom: '8px'}}>
                         <UserLink user={activity.user} className="activity-user" />
                          {' '}
                          <span className={`activity-action ${activity.action}`}>
                            {activity.action.replace('_', ' ')}
                          </span>
                          {' '}
                          {activity.fileName && <strong>{activity.fileName}</strong>}
                          {activity.project && (
                            <span> in project <strong style={{color: '#d4ff00'}}>{activity.project.name}</strong></span>
                          )}
                        </div>

                     
                        {activity.message && (
                          <div style={{
                            color: '#b0b0b0',
                            fontSize: '13px',
                            fontStyle: 'italic',
                            padding: '8px 12px',
                            backgroundColor: '#1f1f1f',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            borderLeft: '3px solid #d4ff00'
                          }}>
                            "{activity.message}"
                          </div>
                        )}

                     
                        {activity.project?.tags && activity.project.tags.length > 0 && (
                          <div style={{marginBottom: '8px'}}>
                            {activity.project.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="tag"
                                onClick={(e) => handleTagClick(tag, e)}
                                style={{
                                  display: 'inline-block',
                                  marginRight: '8px',
                                  marginTop: '4px',
                                  padding: '4px 10px',
                                  backgroundColor: 'rgba(212, 255, 0, 0.1)',
                                  border: '1px solid rgba(212, 255, 0, 0.3)',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  color: '#d4ff00',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  userSelect: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.backgroundColor = 'rgba(212, 255, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.backgroundColor = 'rgba(212, 255, 0, 0.1)';
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;