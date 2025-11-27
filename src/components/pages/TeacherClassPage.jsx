import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClass } from '../../api/academic';
import './TeacherClassPage.css';

export default function TeacherClassPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getClass(classId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to load class');
      }
      setClassData(response.data);
    } catch (err) {
      console.error('Failed to load class:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-class-page loading-state">
        <div className="spinner"></div>
        <p>Loading class details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-class-page error-state">
        <div className="error-message">
          <h2>Error Loading Class</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadClassData}>
            Retry
          </button>
          <button className="btn-secondary" onClick={() => navigate('/teacher/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="teacher-class-page error-state">
        <div className="error-message">
          <h2>Class Not Found</h2>
          <p>The requested class could not be found.</p>
          <button className="btn-primary" onClick={() => navigate('/teacher/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-class-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/teacher/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Class Overview Card */}
      <div className="class-overview-card">
        <div className="class-header">
          <div>
            <h1>{classData.className || 'Unnamed Class'}</h1>
            <p className="course-info">
              {classData.courseName || classData.courseCode || 'Course'}
            </p>
          </div>
          <span className={`status-badge status-${classData.status?.toLowerCase()}`}>
            {classData.status || 'UNKNOWN'}
          </span>
        </div>

        <div className="class-info-grid">
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div>
              <span className="info-label">Schedule</span>
              <span className="info-value">{classData.schedule || 'TBA'}</span>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">🏢</span>
            <div>
              <span className="info-label">Room</span>
              <span className="info-value">{classData.room || 'TBA'}</span>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">👥</span>
            <div>
              <span className="info-label">Enrollment</span>
              <span className="info-value">
                {classData.enrolled || 0} / {classData.capacity || 0}
              </span>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <div>
              <span className="info-label">Duration</span>
              <span className="info-value">
                {classData.durationPerSession ? `${classData.durationPerSession} mins` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">📆</span>
            <div>
              <span className="info-label">Start Date</span>
              <span className="info-value">
                {classData.startDate ? new Date(classData.startDate).toLocaleDateString() : 'TBA'}
              </span>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">🏁</span>
            <div>
              <span className="info-label">End Date</span>
              <span className="info-value">
                {classData.endDate ? new Date(classData.endDate).toLocaleDateString() : 'TBA'}
              </span>
            </div>
          </div>
        </div>

        {/* Enrollment Key */}
        <div className="enroll-key-section">
          <div className="enroll-key-header">
            <span className="info-icon">🔑</span>
            <span className="info-label">Enrollment Key</span>
          </div>
          <div className="enroll-key-box">
            <code className="enroll-key">{classData.enrollKey || 'N/A'}</code>
            {classData.enrollKey && (
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(classData.enrollKey);
                  alert('Enrollment key copied to clipboard!');
                }}
              >
                📋 Copy
              </button>
            )}
          </div>
          <p className="enroll-key-hint">
            Share this key with students who need to activate their enrollment.
          </p>
        </div>
      </div>

      {/* LMS Placeholder */}
      <div className="lms-placeholder">
        <div className="placeholder-icon">🚧</div>
        <h2>Learning Management System</h2>
        <p>This section is under development and will include:</p>
        <ul>
          <li>📝 Session management and attendance tracking</li>
          <li>📚 Course materials upload and organization</li>
          <li>✍️ Assignment creation and grading</li>
          <li>📊 Student performance analytics</li>
          <li>💬 Class announcements and discussions</li>
        </ul>
        <div className="placeholder-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/teacher/courses/${classData.courseId}`)}
          >
            View Course Details
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/teacher/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-card" disabled>
            <span className="action-icon">📝</span>
            <span className="action-label">Take Attendance</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate(`/teacher/materials/${classData.courseId}/${classId}`)}
          >
            <span className="action-icon">📚</span>
            <span className="action-label">Manage Materials</span>
          </button>
          <button className="action-card" disabled>
            <span className="action-icon">✍️</span>
            <span className="action-label">Create Assignment</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
          <button className="action-card" disabled>
            <span className="action-icon">📊</span>
            <span className="action-label">View Grades</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
          <button className="action-card" disabled>
            <span className="action-icon">👥</span>
            <span className="action-label">Manage Students</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
          <button className="action-card" disabled>
            <span className="action-icon">💬</span>
            <span className="action-label">Post Announcement</span>
            <span className="coming-soon">Coming Soon</span>
          </button>
        </div>
      </div>
    </div>
  );
}
