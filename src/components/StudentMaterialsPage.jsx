import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academicApi } from '../api/academic';
import './StudentMaterialsPage.css';

const StudentMaterialsPage = () => {
  const { courseId, classId } = useParams();
  const navigate = useNavigate();
  
  const [classInfo, setClassInfo] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    loadClassInfo();
    loadMaterials();
  }, [courseId, classId]);

  const loadClassInfo = async () => {
    try {
      const response = await academicApi.getClass(classId);
      setClassInfo(response.data);
    } catch (err) {
      console.error('Failed to load class:', err);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await academicApi.listMaterials(courseId, classId, selectedFolder);
      setMaterials(response.data.materials || []);
      setFolders(response.data.folders || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You are not enrolled in this class or your enrollment is not active');
      } else {
        setError(err.response?.data?.error || 'Failed to load materials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      setDownloading(prev => ({ ...prev, [materialId]: true }));
      
      const response = await academicApi.generateMaterialsDownloadUrl(materialId);
      const { downloadUrl } = response.data;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      if (err.response?.status === 403) {
        alert('You are not enrolled in this class or your enrollment is not active');
      } else {
        alert(err.response?.data?.error || 'Failed to download file');
      }
    } finally {
      setDownloading(prev => ({ ...prev, [materialId]: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getMaterialsByFolder = (folder) => {
    return materials.filter(m => m.folder === folder);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      ppt: '📊',
      pptx: '📊',
      xls: '📗',
      xlsx: '📗',
      zip: '📦',
      rar: '📦',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎬',
      mp3: '🎵',
      txt: '📝'
    };
    return iconMap[ext] || '📄';
  };

  if (loading) {
    return <div className="student-materials-page loading">Loading materials...</div>;
  }

  return (
    <div className="student-materials-page">
      <div className="materials-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back to My Courses
        </button>
        <div className="header-info">
          <h1>Course Materials</h1>
          {classInfo && (
            <p className="class-info">
              {classInfo.courseName} - {classInfo.className} ({classInfo.schedule})
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          {error.includes('not enrolled') && (
            <button 
              className="btn-enroll" 
              onClick={() => navigate('/student/search')}
            >
              Go to Enrollment
            </button>
          )}
        </div>
      )}

      <div className="materials-content">
        <div className="folders-sidebar">
          <h3>Folders</h3>
          <div className="folder-list">
            <div
              className={`folder-item ${selectedFolder === null ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolder(null);
                loadMaterials();
              }}
            >
              📁 All Files ({materials.length})
            </div>
            {folders.map((folder) => (
              <div
                key={folder}
                className={`folder-item ${selectedFolder === folder ? 'active' : ''}`}
                onClick={() => setSelectedFolder(folder)}
              >
                📂 {folder} ({getMaterialsByFolder(folder).length})
              </div>
            ))}
          </div>
        </div>

        <div className="materials-list">
          {(selectedFolder ? getMaterialsByFolder(selectedFolder) : materials).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No materials available yet</p>
              <small>Your teacher hasn't uploaded any materials for this class</small>
            </div>
          ) : (
            <div className="materials-grid">
              {(selectedFolder ? getMaterialsByFolder(selectedFolder) : materials).map((material) => (
                <div key={material.materialId} className="material-card">
                  <div className="card-header">
                    <span className="file-icon">{getFileIcon(material.fileName)}</span>
                    <span className="folder-badge">{material.folder}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="file-name" title={material.fileName}>
                      {material.fileName}
                    </h3>
                    <div className="file-meta">
                      <span className="file-size">{formatFileSize(material.fileSize)}</span>
                      <span className="file-date">{formatDate(material.uploadedAt)}</span>
                    </div>
                    <p className="uploader">Uploaded by: {material.uploaderName}</p>
                  </div>
                  <div className="card-footer">
                    <button
                      className="btn-download"
                      onClick={() => handleDownload(material.materialId, material.fileName)}
                      disabled={downloading[material.materialId]}
                    >
                      {downloading[material.materialId] ? 'Downloading...' : '⬇ Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Footer */}
      {materials.length > 0 && (
        <div className="materials-stats">
          <div className="stat-item">
            <span className="stat-label">Total Files:</span>
            <span className="stat-value">{materials.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Folders:</span>
            <span className="stat-value">{folders.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">
              {formatFileSize(materials.reduce((sum, m) => sum + m.fileSize, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMaterialsPage;
