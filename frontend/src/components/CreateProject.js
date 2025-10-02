import React, { useState } from 'react';

function CreateProject({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    isPublic: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Project</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Project Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter project name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., React, Node.js, MongoDB"
          />
        </div>

        <div className="form-group">
          <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
            />
            Make project public
          </label>
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
          <button type="submit" className="btn btn-secondary" style={{flex: 1}}>
            Create Project
          </button>
          {onClose && (
            <button type="button" className="btn btn-primary" style={{flex: 1}} onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreateProject;