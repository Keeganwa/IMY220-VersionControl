import React, { useState } from 'react';
import { userAPI } from '../services/api';

function EditProfile({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    occupation: user?.occupation || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
  //  Profile Update Implementation
  // _____________________________________________
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await userAPI.updateProfile(formData);
      
      if (response.success) {
        console.log('Profile updated successfully');
        
        if (onSave) {
          onSave(response.user);
        }
        
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setErrors({ 
        submit: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label 
            htmlFor="username"
            onClick={() => document.getElementById('username').focus()}
            style={{cursor: 'pointer'}}
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            disabled={isLoading}
          />
          {errors.username && <div className="error-message">{errors.username}</div>}
        </div>

        <div className="form-group">
          <label 
            htmlFor="email"
            onClick={() => document.getElementById('email').focus()}
            style={{cursor: 'pointer'}}
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            disabled={isLoading}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label 
            htmlFor="occupation"
            onClick={() => document.getElementById('occupation').focus()}
            style={{cursor: 'pointer'}}
          >
            Occupation
          </label>
          <input
            type="text"
            id="occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="Enter occupation"
            disabled={isLoading}
          />
          {errors.occupation && <div className="error-message">{errors.occupation}</div>}
        </div>

        <div className="form-group">
          <label 
            htmlFor="dateOfBirth"
            onClick={() => document.getElementById('dateOfBirth').focus()}
            style={{cursor: 'pointer'}}
          >
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            disabled={isLoading}
          />
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

export default EditProfile;