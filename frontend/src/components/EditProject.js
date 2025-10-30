import React, { useState, useEffect } from 'react';
import { projectAPI, adminAPI } from '../services/api';

function EditProject({ project, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    type: '',
    isPublic: true
  });
  const [projectTypes, setProjectTypes] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        tags: project.tags ? project.tags.join(', ') : '',
        type: project.type || '',
        isPublic: project.isPublic !== undefined ? project.isPublic : true
      });
      
      if (project.image) {
        setImagePreview(`http://localhost:5000${project.image}`);
      }
    }
  }, [project]);

  // Fetch
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const response = await adminAPI.getProjectTypes();
        if (response.success) {
          setProjectTypes(response.types);
        }
      } catch (error) {
        console.error('Error fetching project types:', error);
        // Fallback types if API fails
        setProjectTypes([
          'Web Application',
          'Mobile Application',
          'Desktop Application',
          'Library',
          'Framework',
          'API',
          'Tool',
          'Game'
        ]);
      }
    };

    fetchProjectTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear err
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        e.target.value = '';
        return;
      }

      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        e.target.value = '';
        return;
      }

      setImageFile(file);
      
      //  preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.type) {
      newErrors.type = 'Project type is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
    //tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('isPublic', formData.isPublic);
        formDataToSend.append('tags', JSON.stringify(tagsArray));
        formDataToSend.append('image', imageFile);

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/projects/${project._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });

        const data = await response.json();

        if (data.success) {
          alert('Project updated successfully!');
          if (onSave) {
            onSave(data.project);
          }
          if (onClose) {
            onClose();
          }
        } else {
          throw new Error(data.message);
        }
      } else {
        const response = await projectAPI.updateProject(project._id, {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          isPublic: formData.isPublic,
          tags: tagsArray
        });
        
        if (response.success) {
          alert('Project updated successfully!');
          if (onSave) {
            onSave(response.project);
          }
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error) {
      console.error('Update project error:', error);
      setErrors({ 
        submit: error.message || 'Failed to update project. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container" style={{
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
        <h2 style={{color: '#d4ff00', margin: 0}}>Edit Project</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '28px',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
            lineHeight: '20px'
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label 
            htmlFor="name"
            onClick={() => document.getElementById('name').focus()}
            style={{cursor: 'pointer'}}
          >
            Project Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter project name"
            disabled={isLoading}
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label 
            htmlFor="description"
            onClick={() => document.getElementById('description').focus()}
            style={{cursor: 'pointer'}}
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project"
            disabled={isLoading}
            style={{minHeight: '100px'}}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label 
            htmlFor="type"
            onClick={() => document.getElementById('type').focus()}
            style={{cursor: 'pointer'}}
          >
            Project Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1f1f1f',
              border: '2px solid #333',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '14px',
              cursor: 'pointer'
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
          <label 
            htmlFor="image"
            onClick={() => document.getElementById('image').focus()}
            style={{cursor: 'pointer'}}
          >
            Project Image (Max 5MB)
          </label>
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
              fontSize: '14px',
              cursor: 'pointer'
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
                  border: '2px solid #333',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label 
            htmlFor="tags"
            onClick={() => document.getElementById('tags').focus()}
            style={{cursor: 'pointer'}}
          >
            Programming Languages (Tags)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
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
              checked={formData.isPublic}
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

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
          <button 
            type="submit" 
            className="btn btn-secondary" 
            style={{flex: 1}}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
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

export default EditProject;