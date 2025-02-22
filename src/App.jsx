import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaThermometerHalf, FaCamera, FaTrash } from 'react-icons/fa';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const PhotoUpload = ({ photos, onPhotoAdd, onPhotoRemove }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('hvac-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('hvac-photos')
        .getPublicUrl(fileName);

      onPhotoAdd({ url: publicUrl, fileName });
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    }
  };

  return (
    <div className="mt-2">
      <div className="d-flex flex-wrap gap-2 mb-2">
        {photos.map((photo, index) => (
          <div key={index} className="position-relative">
            <img 
              src={photo.url} 
              alt={`Verification photo ${index + 1}`} 
              className="verification-photo"
            />
            <button
              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
              onClick={() => onPhotoRemove(photo)}
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
      <label className="btn btn-outline-primary">
        <FaCamera className="me-2" />
        Add Photo
        <input
          type="file"
          accept="image/*"
          className="d-none"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

const VerificationItem = ({ label, status, photos, onStatusChange, onPhotoAdd, onPhotoRemove }) => {
  return (
    <div className="mb-3 p-3 border rounded">
      <div className="d-flex align-items-center mb-2">
        <div className="flex-grow-1">{label}</div>
        <div className="btn-group">
          <button 
            className={`btn ${status === 'pass' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => onStatusChange('pass')}
          >
            <FaCheckCircle className="me-1" /> Pass
          </button>
          <button 
            className={`btn ${status === 'fail' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => onStatusChange('fail')}
          >
            <FaTimesCircle className="me-1" /> Fail
          </button>
        </div>
      </div>
      <PhotoUpload 
        photos={photos} 
        onPhotoAdd={onPhotoAdd}
        onPhotoRemove={onPhotoRemove}
      />
    </div>
  );
};

function App() {
  const [verificationItems, setVerificationItems] = useState({
    airflow: { status: '', photos: [] },
    refrigerant: { status: '', photos: [] },
    electrical: { status: '', photos: [] },
    controls: { status: '', photos: [] },
    ductwork: { status: '', photos: [] }
  });

  const handleStatusChange = (item, status) => {
    setVerificationItems(prev => ({
      ...prev,
      [item]: { ...prev[item], status }
    }));
  };

  const handlePhotoAdd = (item, photo) => {
    setVerificationItems(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        photos: [...prev[item].photos, photo]
      }
    }));
  };

  const handlePhotoRemove = async (item, photoToRemove) => {
    try {
      // Remove from Supabase storage
      const { error } = await supabase.storage
        .from('hvac-photos')
        .remove([photoToRemove.fileName]);

      if (error) throw error;

      // Remove from state
      setVerificationItems(prev => ({
        ...prev,
        [item]: {
          ...prev[item],
          photos: prev[item].photos.filter(photo => photo.fileName !== photoToRemove.fileName)
        }
      }));
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo');
    }
  };

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .insert([
          {
            verification_data: verificationItems,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      alert('Verification results saved successfully!');
    } catch (error) {
      console.error('Error saving verification:', error);
      alert('Failed to save verification results');
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h1 className="h4 mb-0">
                <FaThermometerHalf className="me-2" />
                HVAC Quality Installation Verification
              </h1>
            </div>
            <div className="card-body">
              {Object.entries(verificationItems).map(([key, value]) => (
                <VerificationItem 
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1) + ' Verification'}
                  status={value.status}
                  photos={value.photos}
                  onStatusChange={(status) => handleStatusChange(key, status)}
                  onPhotoAdd={(photo) => handlePhotoAdd(key, photo)}
                  onPhotoRemove={(photo) => handlePhotoRemove(key, photo)}
                />
              ))}

              <div className="mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  Save Verification Results
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;