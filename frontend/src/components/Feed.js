import React, { useState, useEffect } from 'react';
import ProjectPreview from './ProjectPreview';
import { projectAPI } from '../services/api';

function Feed() {
  const [activeTab, setActiveTab] = useState('local');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async (feedType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await projectAPI.getProjects(feedType);
      
      if (response.success) {
        setProjects(response.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchProjects(activeTab);
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };
//--------------------------------------------------------------



  // _____________________________________________________________
  //  Loading and Error States
  // _______________________________________
  if (isLoading) {
    return (
      <div className="feed-container">
        <div className="feed-header">
          <h2 style={{color: '#d4ff00', fontSize: '28px'}}>Activity Feed</h2>
          <div className="feed-tabs">
            <button 
              className={`feed-tab ${activeTab === 'local' ? 'active' : ''}`}
              onClick={() => handleTabChange('local')}
              disabled={isLoading}
            >
              Local Activity
            </button>
            <button 
              className={`feed-tab ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => handleTabChange('global')}
              disabled={isLoading}
            >
              Global Activity
            </button>
          </div>
        </div>
        
        <div style={{textAlign: 'center', padding: '40px', color: '#b0b0b0'}}>
          Loading projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-container">
        <div className="feed-header">
          <h2 style={{color: '#d4ff00', fontSize: '28px'}}>Activity Feed</h2>
          <div className="feed-tabs">
            <button 
              className={`feed-tab ${activeTab === 'local' ? 'active' : ''}`}
              onClick={() => handleTabChange('local')}
            >
              Local Activity
            </button>
            <button 
              className={`feed-tab ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => handleTabChange('global')}
            >
              Global Activity
            </button>
          </div>
        </div>
        
        <div style={{textAlign: 'center', padding: '40px', color: '#ff6b6b'}}>
          <p>Error: {error}</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => fetchProjects(activeTab)}
            style={{marginTop: '10px'}}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2 style={{color: '#d4ff00', fontSize: '28px'}}>Activity Feed</h2>
        <div className="feed-tabs">
          <button 
            className={`feed-tab ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => handleTabChange('local')}
          >
            Local Activity
          </button>
          <button 
            className={`feed-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => handleTabChange('global')}
          >
            Global Activity
          </button>
        </div>
      </div>
      
      <div style={{display: 'grid', gap: '20px'}}>
        {projects.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#b0b0b0'}}>
            <p>No projects found in {activeTab} feed.</p>
            {activeTab === 'local' && (
              <p style={{fontSize: '14px', marginTop: '10px'}}>
                Try switching to Global feed or create your first project!
              </p>
            )}
          </div>
        ) : (
          projects.map(project => (
            <ProjectPreview key={project._id} project={project} />
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;