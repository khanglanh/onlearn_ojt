import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getTeacherClasses } from '../../api/academic';
import { getUserId } from '../../utils/authUtils';
import './TeacherCoursePage.css';

export default function TeacherCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    setError(null);

    try {
      const teacherId = getUserId();
      
      // Load course details
      const courseResponse = await getCourse(courseId);
      if (!courseResponse.success) {
        throw new Error(courseResponse.message || 'Failed to load course');
      }
      setCourse(courseResponse.data);

      // Load teacher's classes for this course
      const classesResponse = await getTeacherClasses(teacherId);
      if (!classesResponse.success) {
        throw new Error(classesResponse.message || 'Failed to load classes');
      }

      // Filter classes for this course
      const courseClasses = (classesResponse.data?.classes || [])
        .filter(c => c.courseId === courseId);
      setClasses(courseClasses);

    } catch (err) {
      console.error('Failed to load course data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewClassDetails = (classId) => {
    navigate(`/teacher/classes/${classId}`);
  };

  if (loading) {
    return (
      <div className="teacher-course-page loading-state">
        <div className="spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-course-page error-state">
        <div className="error-message">
          <h2>Error Loading Course</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadCourseData}>
            Retry
          </button>
          <button className="btn-secondary" onClick={() => navigate('/teacher/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="teacher-course-page error-state">
        <div className="error-message">
          <h2>Course Not Found</h2>
          <p>The requested course could not be found.</p>
          <button className="btn-primary" onClick={() => navigate('/teacher/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-course-page">
      {/* Header with back button */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/teacher/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Course Details Card */}
      <div className="course-details-card">
        <div className="course-header">
          <div>
            <h1>{course.courseName}</h1>
            <p className="course-code">{course.courseCode}</p>
          </div>
          <div className="course-meta">
            <span className="meta-item">
              <span className="icon">⏱️</span>
              {course.duration || course.durationInSessions || 'N/A'} {course.duration ? 'weeks' : 'sessions'}
            </span>
            <span className="meta-item">
              <span className="icon">📊</span>
              {course.level || 'N/A'}
            </span>
          </div>
        </div>

        {course.description && (
          <div className="course-description">
            <h3>Description</h3>
            <p>{course.description}</p>
          </div>
        )}

        <div className="course-stats">
          <div className="stat-box">
            <span className="stat-label">Total Classes</span>
            <span className="stat-value">{classes.length}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">
              {classes.reduce((sum, c) => sum + (c.enrolled || 0), 0)}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Active Classes</span>
            <span className="stat-value">
              {classes.filter(c => c.status === 'IN_PROGRESS' || c.status === 'OPEN').length}
            </span>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="classes-section">
        <div className="section-header">
          <h2>Your Classes for This Course</h2>
          <span className="class-count">{classes.length} {classes.length === 1 ? 'class' : 'classes'}</span>
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Classes Yet</h3>
            <p>You don't have any classes for this course yet.</p>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map((classItem) => (
              <div key={classItem.classId} className="class-card">
                <div className="class-card-header">
                  <h3>{classItem.className || 'Unnamed Class'}</h3>
                  <span className={`status-badge status-${classItem.status?.toLowerCase()}`}>
                    {classItem.status || 'UNKNOWN'}
                  </span>
                </div>

                <div className="class-details">
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span>{classItem.schedule || 'Schedule TBA'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">🏢</span>
                    <span>{classItem.room || 'Room TBA'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">👥</span>
                    <span>
                      {classItem.enrolled || 0} / {classItem.capacity || 0} students
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">🔑</span>
                    <code className="enroll-key">{classItem.enrollKey || 'N/A'}</code>
                  </div>
                </div>

                <div className="class-actions">
                  <button
                    className="btn-primary"
                    onClick={() => viewClassDetails(classItem.classId)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
