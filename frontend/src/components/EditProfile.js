import React, { useState } from 'react';
import { userAPI } from '../services/api';

function EditProfile({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    occupation: user?.occupation || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    bio: user?.bio || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    user?.profileImage ? `http://localhost:5000${user.profileImage}` : null
  );
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

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(user?.profileImage ? `http://localhost:5000${user.profileImage}` : null);
    const fileInput = document.getElementById('profileImage');
    if (fileInput) {
      fileInput.value = '';
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
      // If there's a profile image, use FormData
      if (profileImage) {
        const formDataToSend = new FormData();
        formDataToSend.append('username', formData.username);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('occupation', formData.occupation);
        if (formData.dateOfBirth) {
          formDataToSend.append('dateOfBirth', formData.dateOfBirth);
        }
        if (formData.bio) {
          formDataToSend.append('bio', formData.bio);
        }
        formDataToSend.append('profileImage', profileImage);

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });

        const data = await response.json();

        if (data.success) {
          console.log('Profile updated successfully');
          
          if (onSave) {
            onSave(data.user);
          }
          
          if (onClose) {
            onClose();
          }
        } else {
          throw new Error(data.message);
        }
      } else {
        // No new image, use regular API call
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
        {/* Profile Image Upload */}
        <div className="form-group">
          <label 
            htmlFor="profileImage"
            onClick={() => document.getElementById('profileImage').focus()}
            style={{cursor: 'pointer'}}
          >
            Profile Image (Max 5MB)
          </label>
          
          {imagePreview && (
            <div style={{
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <img 
                src={imagePreview} 
                alt="Profile Preview" 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #d4ff00'
                }}
              />
              {profileImage && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Remove New Image
                </button>
              )}
            </div>
          )}
          
          <input
            type="file"
            id="profileImage"
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
          <small style={{color: '#888', fontSize: '12px', display: 'block', marginTop: '5px'}}>
            Supported formats: JPG, PNG, GIF, WebP
          </small>
        </div>

        <div className="form-group">
          <label 
            htmlFor="username"
            onClick={() => document.getElementById('username').focus()}
            style={{cursor: 'pointer'}}
          >
            Username *
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
            Email *
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
            Occupation *
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





        <div className="form-group">
          <label 
            htmlFor="bio"
            onClick={() => document.getElementById('bio').focus()}
            style={{cursor: 'pointer'}}
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            disabled={isLoading}
            style={{minHeight: '100px'}}
          />
          <small style={{color: '#888', fontSize: '12px', display: 'block', marginTop: '5px'}}>
            Optional: Share a brief description about yourself
          </small>
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