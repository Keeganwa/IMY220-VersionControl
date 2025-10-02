import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectPreview({ project }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <article className="project-card" onClick={handleClick}>
      <h3>{project.name}</h3>
      <div className="project-meta">
        <span>Created by: <strong>{project.creator}</strong></span>
        <span>•</span>
        <span>{project.lastUpdate}</span>
      </div>
      <p className="project-description">{project.description}</p>
      <div className="project-tags">
        {project.tags && project.tags.map((tag, index) => (
          <span key={index} className="tag">{tag}</span>
        ))}
      </div>
      <div className="project-meta" style={{marginTop: '15px'}}>
        <span>Contributors: {project.contributors}</span>
        <span>•</span>
        <span>Files: {project.fileCount}</span>
      </div>
    </article>
  );
}

export default ProjectPreview;