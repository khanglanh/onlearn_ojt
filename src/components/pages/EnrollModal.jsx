import { useState } from 'react';
import { enrollInClass } from '../../api/academic';
import './EnrollModal.css';

export default function EnrollModal({ classData, onSuccess, onCancel }) {
  const [enrollKey, setEnrollKey] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!enrollKey.trim()) {
      setError('Enrollment key is required');
      return;
    }

    setEnrolling(true);
    setError(null);

    try {
      const response = await enrollInClass(classData.classId, enrollKey.trim());
      
      if (response.success) {
        // Success - call parent callback
        onSuccess();
      } else {
        throw new Error(response.message || 'Enrollment failed');
      }
    } catch (err) {
      console.error('Enrollment failed:', err);
      
      // Handle specific error messages
      let errorMessage = err.message;
      if (errorMessage.includes('INVALID_ENROLL_KEY')) {
        errorMessage = 'Invalid enrollment key. Please check and try again.';
      } else if (errorMessage.includes('ALREADY_ENROLLED')) {
        errorMessage = 'You are already enrolled in this class.';
      } else if (errorMessage.includes('CLASS_FULL')) {
        errorMessage = 'This class is full. Cannot enroll.';
      }
      
      setError(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="enroll-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enroll in Class</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Class Info */}
          <div className="class-info-box">
            <h3>{classData.courseName || classData.courseCode}</h3>
            <p className="class-code-display">{classData.classCode}</p>
            <div className="class-details-grid">
              <div className="detail-row">
                <span className="label">Course:</span>
                <span>{classData.courseCode}</span>
              </div>
              <div className="detail-row">
                <span className="label">Semester:</span>
                <span>{classData.semester} {classData.year}</span>
              </div>
              <div className="detail-row">
                <span className="label">Schedule:</span>
                <span>{classData.schedule || 'TBA'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Room:</span>
                <span>{classData.room || 'TBA'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Enrollment:</span>
                <span>{classData.enrolled || 0} / {classData.capacity || 0}</span>
              </div>
            </div>
          </div>

          {/* Enrollment Key Input */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="enrollKey">Enrollment Key *</label>
              <input
                type="text"
                id="enrollKey"
                value={enrollKey}
                onChange={(e) => setEnrollKey(e.target.value)}
                placeholder="Enter the enrollment key from your teacher"
                className="enroll-key-input"
                disabled={enrolling}
                autoFocus
              />
              <p className="input-hint">
                Ask your teacher for the enrollment key to join this class
              </p>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onCancel}
                disabled={enrolling}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-enroll-submit"
                disabled={enrolling || !enrollKey.trim()}
              >
                {enrolling ? 'Enrolling...' : 'Enroll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
