import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectPreview({ project }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project._id}`);
  };

  // _____________________________________________________________
  // MARKS: Real Project Data Display
  // Shows actual project information from MongoDB
  // Handles diferent data structures from backend API
  // _____________________________________________________________
  
  // Format date for display
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
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get contributor count
  const getContributorCount = () => {
    const collaborators = project.collaborators?.length || 0;
    return collaborators + 1; // +1 for the creator
  };

  // Get file count
  const getFileCount = () => {
    return project.files?.length || 0;
  };

  // Handle missing project data gracefuly
  if (!project) {
    return (
      <article className="project-card" style={{opacity: 0.5}}>
        <h3 style={{color: '#888'}}>Loading project...</h3>
      </article>
    );
  }

  return (
    <article className="project-card" onClick={handleClick}>
      <h3>{project.name || 'Untitled Project'}</h3>
      <div className="project-meta">
        <span>Created by: <strong>{project.creator?.username || 'Unknown'}</strong></span>
        <span>•</span>
        <span>{formatDate(project.updatedAt || project.createdAt)}</span>
      </div>
      <p className="project-description">
        {project.description || 'No description available.'}
      </p>
      
      {/* Display tags if available */}
      {project.tags && project.tags.length > 0 && (
        <div className="project-tags">
          {project.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      )}
      
      <div className="project-meta" style={{marginTop: '15px'}}>
        <span>Contributors: {getContributorCount()}</span>
        <span>•</span>
        <span>Files: {getFileCount()}</span>
        {project.checkedOutBy && (
          <>
            <span>•</span>
            <span style={{color: '#ffa94d'}}>
              Checked out by {project.checkedOutBy.username}
            </span>
          </>
        )}
      </div>
      
      {/* Show privacy status */}
      <div style={{marginTop: '10px'}}>
        <span style={{
          fontSize: '12px',
          color: project.isPublic ? '#51cf66' : '#888',
          backgroundColor: project.isPublic ? 'rgba(81, 207, 102, 0.1)' : 'rgba(136, 136, 136, 0.1)',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {project.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
    </article>
  );
}

export default ProjectPreview;