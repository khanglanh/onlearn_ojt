import { useState, useEffect } from 'react';
import { generateImportUploadUrl, uploadFileToS3, getImportJobStatus, listImportJobs } from '../../api/academic';
import './ImportPage.css';
import { useNavigate } from 'react-router-dom';

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'history'
  const navigate = useNavigate();

  // Upload tab state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  // History tab state
  const [importJobs, setImportJobs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Poll job status when uploading
  useEffect(() => {
    if (!currentJobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await getImportJobStatus(currentJobId);
        if (response.success) {
          setJobStatus(response.data);

          // Stop polling if job completed or failed
          const finalStatuses = ['SUCCESS', 'FAILED', 'COMPLETED'];
          if (finalStatuses.includes(response.data.status)) {
            clearInterval(pollInterval);
            setUploading(false);
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [currentJobId]);

  // Load import history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadImportHistory();
    }
  }, [activeTab]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setJobStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress('Generating upload URL...');
    setUploadError(null);
    setJobStatus(null);

    try {
      // Step 1: Get presigned upload URL
      const urlResponse = await generateImportUploadUrl(selectedFile.name);
      if (!urlResponse.success) {
        throw new Error(urlResponse.message || 'Failed to generate upload URL');
      }

      const { uploadUrl, jobId, requiredHeaders } = urlResponse.data;
      setCurrentJobId(jobId);

      // Step 2: Upload file to S3
      setUploadProgress('Uploading file to S3...');
      await uploadFileToS3(uploadUrl, selectedFile, requiredHeaders);

      // Step 3: File uploaded, now processing
      setUploadProgress('File uploaded! Processing import...');
      setJobStatus({
        jobId,
        fileName: selectedFile.name,
        status: 'PROCESSING',
        message: 'Import job started. This may take a few minutes...'
      });

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Upload failed');
      setUploading(false);
      setCurrentJobId(null);
    }
  };

  const loadImportHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await listImportJobs(50);
      if (response.success) {
        setImportJobs(response.data.jobs || []);
      } else {
        throw new Error(response.message || 'Failed to load import history');
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistoryError(error.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const viewJobDetails = async (jobId) => {
    try {
      const response = await getImportJobStatus(jobId);
      if (response.success) {
        setSelectedJob(response.data);
      }
    } catch (error) {
      console.error('Failed to load job details:', error);
      alert('Failed to load job details: ' + error.message);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(null);
    setUploadError(null);
    setCurrentJobId(null);
    setJobStatus(null);
  };

  return (
    <div className="import-page">
      <h1>Import Academic Data</h1>

      <button
        style={{
          marginBottom: '12px',
          padding: '8px 14px',
          borderRadius: '6px',
          border: '1px solid #000',
          backgroundColor: '#e31818ff',
          color: '#fff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: 500,
        }}
        onClick={() => navigate('/dashboard')}
      >
        <span>Return to Dashboard</span>
      </button>

      <p className="subtitle">Upload Excel files to import students, teachers, courses, and classes</p>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          Upload File
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Import History
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="upload-section">
          <div className="upload-card">
            <h2>Upload Excel File</h2>

            <div className="file-requirements">
              <h3>Requirements:</h3>
              <ul>
                <li>File format: .xlsx or .xls</li>
                <li>Max size: 10MB</li>
                <li>Must contain 5 sheets: Students, Teachers, Courses, Classes, Enrollments</li>
                <li>See <a href="/import-template.xlsx" download>template file</a> for structure</li>
              </ul>

              <h3>Import Behavior:</h3>
              <ul>
                <li><strong>Idempotent:</strong> Importing the same file multiple times is safe</li>
                <li><strong>Students/Teachers/Courses:</strong> If record exists → UPDATE, else → INSERT</li>
                <li><strong>Classes:</strong> If class exists (same course + name) → UPDATE, else → INSERT</li>
                <li><strong>Enrollments:</strong> If enrollment exists → SKIP, else → INSERT</li>
                <li>No duplicates will be created</li>
              </ul>
            </div>

            {!uploading && !jobStatus && (
              <>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="file-input"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <label htmlFor="file-input" className="file-input-label">
                    {selectedFile ? selectedFile.name : 'Choose Excel file...'}
                  </label>
                </div>

                {selectedFile && (
                  <div className="file-info">
                    <p><strong>Selected:</strong> {selectedFile.name}</p>
                    <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}

                {uploadError && (
                  <div className="error-message">{uploadError}</div>
                )}

                <div className="button-group">
                  <button
                    className="btn-primary"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                  >
                    Upload & Import
                  </button>
                  {selectedFile && (
                    <button
                      className="btn-secondary"
                      onClick={() => setSelectedFile(null)}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </>
            )}

            {uploading && uploadProgress && (
              <div className="progress-section">
                <div className="spinner"></div>
                <p>{uploadProgress}</p>
              </div>
            )}

            {jobStatus && (
              <div className={`job-status status-${jobStatus.status?.toLowerCase()}`}>
                <h3>Import Job Status</h3>
                <div className="status-details">
                  <p><strong>Job ID:</strong> {jobStatus.jobId}</p>
                  <p><strong>File:</strong> {jobStatus.fileName}</p>
                  <p><strong>Status:</strong> <span className="status-badge">{jobStatus.status}</span></p>

                  {jobStatus.status === 'PROCESSING' && (
                    <div className="processing-indicator">
                      <div className="spinner-small"></div>
                      <span>Processing... This may take several minutes.</span>
                    </div>
                  )}

                  {(jobStatus.status === 'SUCCESS' || jobStatus.status === 'COMPLETED') && (
                    <div className="success-info">
                      <p>✓ Import completed successfully!</p>
                      {jobStatus.summary && (
                        <div className="summary">
                          <h4>Summary:</h4>
                          <ul>
                            <li>Students: {jobStatus.summary.students || 0}</li>
                            <li>Teachers: {jobStatus.summary.teachers || 0}</li>
                            <li>Courses: {jobStatus.summary.courses || 0}</li>
                            <li>Classes: {jobStatus.summary.classes || 0}</li>
                            <li>Enrollments: {jobStatus.summary.enrollments || 0}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {jobStatus.status === 'FAILED' && (
                    <div className="error-info">
                      <p>✗ Import failed</p>
                      {jobStatus.errors && jobStatus.errors.length > 0 && (
                        <div className="errors">
                          <h4>Errors:</h4>
                          <ul>
                            {jobStatus.errors.slice(0, 10).map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                            {jobStatus.errors.length > 10 && (
                              <li>... and {jobStatus.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="button-group">
                    <button className="btn-primary" onClick={resetUpload}>
                      Upload Another File
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('history')}
                    >
                      View History
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          <div className="history-header">
            <h2>Import History</h2>
            <button
              className="btn-secondary"
              onClick={loadImportHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {historyError && (
            <div className="error-message">{historyError}</div>
          )}

          {loadingHistory ? (
            <div className="loading">Loading history...</div>
          ) : importJobs.length === 0 ? (
            <div className="empty-state">
              <p>No import jobs found</p>
            </div>
          ) : (
            <div className="jobs-list">
              {importJobs.map((job) => (
                <div key={job.jobId} className="job-item">
                  <div className="job-info">
                    <h3>{job.fileName}</h3>
                    <p className="job-meta">
                      <span className={`status-badge status-${job.status?.toLowerCase()}`}>
                        {job.status}
                      </span>
                      <span className="job-date">
                        {new Date(job.createdAt).toLocaleString()}
                      </span>
                      <span className="job-user">by {job.uploadedBy}</span>
                    </p>
                    {job.summary && (
                      <p className="job-summary">
                        {job.summary.studentsImported || 0} students,
                        {job.summary.teachersImported || 0} teachers,
                        {job.summary.coursesImported || 0} courses,
                        {job.summary.classesImported || 0} classes
                      </p>
                    )}
                  </div>
                  <button
                    className="btn-link"
                    onClick={() => viewJobDetails(job.jobId)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Job Details Modal */}
          {selectedJob && (
            <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Import Job Details</h2>
                  <button className="modal-close" onClick={() => setSelectedJob(null)}>×</button>
                </div>
                <div className="modal-body">
                  <p><strong>Job ID:</strong> {selectedJob.jobId}</p>
                  <p><strong>File:</strong> {selectedJob.fileName}</p>
                  <p><strong>Status:</strong> <span className={`status-badge status-${selectedJob.status?.toLowerCase()}`}>{selectedJob.status}</span></p>
                  <p><strong>Uploaded By:</strong> {selectedJob.uploadedBy}</p>
                  <p><strong>Created:</strong> {new Date(selectedJob.createdAt).toLocaleString()}</p>
                  {selectedJob.completedAt && (
                    <p><strong>Completed:</strong> {new Date(selectedJob.completedAt).toLocaleString()}</p>
                  )}

                  {selectedJob.summary && (
                    <div className="summary-section">
                      <h3>Summary</h3>
                      <ul>
                        <li>Students Imported: {selectedJob.summary.studentsImported || 0}</li>
                        <li>Teachers Imported: {selectedJob.summary.teachersImported || 0}</li>
                        <li>Courses Imported: {selectedJob.summary.coursesImported || 0}</li>
                        <li>Classes Imported: {selectedJob.summary.classesImported || 0}</li>
                        <li>Enrollments Created: {selectedJob.summary.enrollmentsCreated || 0}</li>
                      </ul>
                    </div>
                  )}

                  {selectedJob.errors && selectedJob.errors.length > 0 && (
                    <div className="errors-section">
                      <h3>Errors ({selectedJob.errors.length})</h3>
                      <div className="error-list">
                        {selectedJob.errors.map((error, idx) => (
                          <div key={idx} className="error-item">{error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
