import React, { useState } from 'react';
import { projectAPI } from '../services/api';

function CreateProject({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    isPublic: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // _____________________________________________________________
  // Real Project Creation API Integration
  // _____________________________________________________________
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare data for API
      const projectData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await projectAPI.createProject(projectData);
      
      if (response.success) {
        console.log('Project created succesfully:', response.project.name);
        
        // Call parent callback if provided
        if (onSubmit) {
          onSubmit(response.project);
        }
        
        // Close form
        if (onClose) {
          onClose();
        }
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          tags: '',
          isPublic: true
        });
      }
    } catch (error) {
      console.error('Create project error:', error);
      setErrors({ 
        submit: error.message || 'Failed to create project. Please try again.' 
      });
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
            required
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project"
            disabled={isLoading}
            required
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
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
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              disabled={isLoading}
            />
            Make project public
          </label>
        </div>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
          <button 
            type="submit" 
            className="btn btn-secondary" 
            style={{flex: 1}}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Project'}
          </button>
          {onClose && (
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{flex: 1}} 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreateProject;