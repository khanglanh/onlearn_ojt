import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollments, unenrollFromClass } from '../../api/academic';
import './StudentCoursesPage.css';

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyEnrollments();
      if (response.success) {
        setEnrollments(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load enrollments');
      }
    } catch (err) {
      console.error('Failed to load enrollments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId, courseName) => {
    if (!confirm(`Are you sure you want to drop "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await unenrollFromClass(enrollmentId);
      if (response.success) {
        // Remove from list
        setEnrollments(enrollments.filter(e => e.enrollmentId !== enrollmentId));
        alert('Successfully unenrolled from the class');
      } else {
        throw new Error(response.message || 'Failed to unenroll');
      }
    } catch (err) {
      console.error('Unenroll failed:', err);
      alert('Failed to unenroll: ' + err.message);
    }
  };

  const viewClassDetails = (classId) => {
    navigate(`/student/classes/${classId}`);
  };

  if (loading) {
    return (
      <div className="student-courses-page loading-state">
        <div className="spinner"></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-courses-page error-state">
        <div className="error-message">
          <h2>Error Loading Courses</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadEnrollments}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-courses-page">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p className="subtitle">View and manage your enrolled courses</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/student/search')}
        >
          + Find More Courses
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{enrollments.length}</div>
          <div className="stat-label">Enrolled Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {enrollments.filter(e => e.status === 'ACTIVE').length}
          </div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {enrollments.filter(e => e.status === 'PRE_ENROLLED').length}
          </div>
          <div className="stat-label">Pre-enrolled</div>
        </div>
      </div>

      {/* Enrollments List */}
      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>No Courses Yet</h2>
          <p>You haven't enrolled in any courses yet</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/student/search')}
          >
            Search for Courses
          </button>
        </div>
      ) : (
        <div className="enrollments-list">
          {enrollments.map((enrollment) => (
            <div key={enrollment.enrollmentId} className="enrollment-card">
              <div className="enrollment-header">
                <div className="enrollment-info">
                  <h3>
                    {enrollment.courseName || enrollment.courseCode || 'Course'}
                    <span className="class-code">{enrollment.classCode || enrollment.classId}</span>
                  </h3>
                  <p className="enrollment-meta">
                    {enrollment.courseCode} • {enrollment.semester} {enrollment.year}
                  </p>
                </div>
                <span className={`status-badge status-${enrollment.status?.toLowerCase()}`}>
                  {enrollment.status}
                </span>
              </div>

              <div className="enrollment-details">
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <span>{enrollment.schedule || 'Schedule TBA'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🏢</span>
                  <span>{enrollment.room || 'Room TBA'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">👨‍🏫</span>
                  <span>{enrollment.teacherName || 'Teacher TBA'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📖</span>
                  <span>{enrollment.credits || '0'} credits</span>
                </div>
              </div>

              {enrollment.status === 'PRE_ENROLLED' && (
                <div className="pre-enrolled-notice">
                  <p>
                    ⚠️ You need to activate your enrollment with the enrollment key.
                    Contact your teacher for the key.
                  </p>
                </div>
              )}

              <div className="enrollment-actions">
                <button
                  className="btn-secondary"
                  onClick={() => viewClassDetails(enrollment.classId)}
                >
                  View Details
                </button>
                {enrollment.status === 'ACTIVE' && (
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/student/materials/${enrollment.courseId}/${enrollment.classId}`)}
                  >
                    📚 Materials
                  </button>
                )}
                <button
                  className="btn-danger"
                  onClick={() => handleUnenroll(
                    enrollment.enrollmentId,
                    enrollment.courseName || enrollment.courseCode
                  )}
                >
                  Drop Course
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
