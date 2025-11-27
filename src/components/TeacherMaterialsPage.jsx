import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academicApi } from '../api/academic';
import './TeacherMaterialsPage.css';

const TeacherMaterialsPage = () => {
  const { courseId, classId } = useParams();
  const navigate = useNavigate();
  
  const [classInfo, setClassInfo] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderError, setFolderError] = useState('');
  
  // Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadFolder, setUploadFolder] = useState('General');
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);

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
      const response = await academicApi.listMaterials(courseId, classId);
      setMaterials(response.data.materials || []);
      setFolders(response.data.folders || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setFolderError('Folder name is required');
      return;
    }
    
    // Validate folder name
    if (!/^[a-zA-Z0-9\s_-]+$/.test(folderName)) {
      setFolderError('Folder name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }

    try {
      setFolderError('');
      await academicApi.createMaterialsFolder(courseId, classId, folderName.trim());
      setShowFolderModal(false);
      setFolderName('');
      loadMaterials();
    } catch (err) {
      setFolderError(err.response?.data?.error || 'Failed to create folder');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);
    const progress = {};
    selectedFiles.forEach((file, index) => {
      progress[index] = { fileName: file.name, progress: 0, status: 'pending' };
    });
    setUploadProgress(progress);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [i]: { ...prev[i], status: 'uploading', progress: 0 }
        }));

        // Get upload URL
        const urlResponse = await academicApi.generateMaterialsUploadUrl(
          courseId,
          classId,
          file.name,
          file.type,
          file.size,
          uploadFolder
        );

        const { uploadUrl, materialId } = urlResponse.data;

        // Upload to S3
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [i]: { ...prev[i], progress: percentComplete }
            }));
          }
        });

        await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // Mark as complete
        setUploadProgress(prev => ({
          ...prev,
          [i]: { ...prev[i], status: 'complete', progress: 100 }
        }));

      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        setUploadProgress(prev => ({
          ...prev,
          [i]: { ...prev[i], status: 'error', progress: 0 }
        }));
      }
    }

    setUploading(false);
    
    // Refresh materials list
    setTimeout(() => {
      loadMaterials();
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadProgress({});
    }, 1000);
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const response = await academicApi.generateMaterialsDownloadUrl(materialId);
      const { downloadUrl } = response.data;
      
      // Open download in new tab
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download file');
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

  if (loading) {
    return <div className="materials-page loading">Loading materials...</div>;
  }

  return (
    <div className="materials-page">
      <div className="materials-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back
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

      {error && <div className="error-message">{error}</div>}

      <div className="materials-actions">
        <button className="btn-primary" onClick={() => setShowFolderModal(true)}>
          + Create Folder
        </button>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          ↑ Upload Files
        </button>
      </div>

      <div className="materials-content">
        <div className="folders-sidebar">
          <h3>Folders</h3>
          <div className="folder-list">
            <div
              className={`folder-item ${selectedFolder === null ? 'active' : ''}`}
              onClick={() => setSelectedFolder(null)}
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
              <p>No materials found</p>
              <button className="btn-secondary" onClick={() => setShowUploadModal(true)}>
                Upload your first file
              </button>
            </div>
          ) : (
            <table className="materials-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Folder</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Uploaded At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(selectedFolder ? getMaterialsByFolder(selectedFolder) : materials).map((material) => (
                  <tr key={material.materialId}>
                    <td className="file-name">
                      <span className="file-icon">📄</span>
                      {material.fileName}
                    </td>
                    <td>{material.folder}</td>
                    <td>{formatFileSize(material.fileSize)}</td>
                    <td>{material.uploaderName}</td>
                    <td>{formatDate(material.uploadedAt)}</td>
                    <td>
                      <button
                        className="btn-download"
                        onClick={() => handleDownload(material.materialId, material.fileName)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Folder</h2>
            <div className="form-group">
              <label>Folder Name</label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Slides, Assignments, Readings"
                maxLength={50}
              />
              <small>Can contain letters, numbers, spaces, hyphens, and underscores</small>
              {folderError && <div className="error-text">{folderError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowFolderModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateFolder}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Files Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Files</h2>
            
            <div className="form-group">
              <label>Select Folder</label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                disabled={uploading}
              >
                <option value="General">General</option>
                {folders.filter(f => f !== 'General').map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFiles.length > 0 && (
                <p className="file-count">{selectedFiles.length} file(s) selected</p>
              )}
            </div>

            {Object.keys(uploadProgress).length > 0 && (
              <div className="upload-progress-list">
                <h3>Upload Progress</h3>
                {Object.entries(uploadProgress).map(([index, prog]) => (
                  <div key={index} className="progress-item">
                    <div className="progress-header">
                      <span className="file-name">{prog.fileName}</span>
                      <span className={`status ${prog.status}`}>
                        {prog.status === 'complete' ? '✓' : prog.status === 'error' ? '✗' : `${prog.progress}%`}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${prog.progress}%`,
                          backgroundColor: prog.status === 'error' ? '#e74c3c' : prog.status === 'complete' ? '#27ae60' : '#3498db'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMaterialsPage;
