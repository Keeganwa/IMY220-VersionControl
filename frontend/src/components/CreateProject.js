import React, { useState, useEffect } from 'react';
import { projectAPI, adminAPI } from '../services/api';

function CreateProject({ onClose, onSubmit }) {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    tags: '',
    type: '',
    version: '1.0.0',
    isPublic: true
  });
  const [projectTypes, setProjectTypes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // _____________________________________________________________
  // Fetch Available Project Types
  // _____________________________________________________________
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const response = await adminAPI.getProjectTypes();
        if (response.success) {
          setProjectTypes(response.types);
        }
      } catch (error) {
        console.error('Error fetching project types:', error);
      }
    };

    fetchProjectTypes();
  }, []);

  // _____________________________________________________________
  // Handle Image Upload with Validation
  // _____________________________________________________________
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        e.target.value = '';
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        e.target.value = '';
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProjectData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!projectData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!projectData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!projectData.type) {
      newErrors.type = 'Project type is required';
    }

    if (!projectData.version.trim()) {
      newErrors.version = 'Version is required';
    } else if (!/^\d+\.\d+\.\d+$/.test(projectData.version)) {
      newErrors.version = 'Version must be in format: X.Y.Z (e.g., 1.0.0)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('name', projectData.name);
      formData.append('description', projectData.description);
      formData.append('type', projectData.type);
      formData.append('version', projectData.version);
      formData.append('isPublic', projectData.isPublic);

      // Convert comma-separated tags to array and stringify
      const tagsArray = projectData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      formData.append('tags', JSON.stringify(tagsArray));

      // Append image if exists
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await projectAPI.createProject(formData);
      
      if (response.success) {
        alert('Project created successfully!');
        onSubmit(response.project);
        onClose();
      }
    } catch (error) {
      console.error('Create project error:', error);
      setErrors({ submit: error.message || 'Failed to create project' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#252525',
      padding: '30px',
      borderRadius: '12px',
      border: '1px solid #333',
      marginBottom: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{color: '#d4ff00', fontSize: '24px', margin: 0}}>
          Create New Project
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px'
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Project Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={projectData.name}
            onChange={handleChange}
            placeholder="Enter project name"
            disabled={isLoading}
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={projectData.description}
            onChange={handleChange}
            placeholder="Describe your project"
            disabled={isLoading}
            style={{minHeight: '100px'}}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="type">Project Type *</label>
          <select
            id="type"
            name="type"
            value={projectData.type}
            onChange={handleChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1f1f1f',
              border: '2px solid #333',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '14px'
            }}
          >
            <option value="">Select a project type</option>
            {projectTypes.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && <div className="error-message">{errors.type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="version">Version *</label>
          <input
            type="text"
            id="version"
            name="name"
            value={projectData.version}
            onChange={handleChange}
            placeholder="1.0.0"
            disabled={isLoading}
          />
          <small style={{color: '#888', fontSize: '12px', display: 'block', marginTop: '5px'}}>
            Format: Major.Minor.Patch (e.g., 1.0.0)
          </small>
          {errors.version && <div className="error-message">{errors.version}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="image">Project Image (Max 5MB)</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1f1f1f',
              border: '2px solid #333',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '14px'
            }}
          />
          {imagePreview && (
            <div style={{marginTop: '10px'}}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: '2px solid #333'
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tags">Programming Languages (Tags)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={projectData.tags}
            onChange={handleChange}
            placeholder="JavaScript, Python, React (comma-separated)"
            disabled={isLoading}
          />
          <small style={{color: '#888', fontSize: '12px', display: 'block', marginTop: '5px'}}>
            Separate multiple tags with commas
          </small>
        </div>

        <div className="form-group">
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            color: '#e0e0e0'
          }}>
            <input
              type="checkbox"
              name="isPublic"
              checked={projectData.isPublic}
              onChange={handleChange}
              disabled={isLoading}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            Make this project public
          </label>
        </div>

        {errors.submit && (
          <div className="error-message" style={{marginBottom: '15px'}}>
            {errors.submit}
          </div>
        )}

        <div style={{display: 'flex', gap: '10px'}}>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProject;