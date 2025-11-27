import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getTeacherCourses, getTeacherClasses } from '../../api/academic';
import './TeacherDashboardPage.css';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeView, setActiveView] = useState('courses'); // 'courses' or 'classes'

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get teacher profile
      const profileResponse = await getMyProfile();
      if (!profileResponse.success || profileResponse.data.type !== 'TEACHER') {
        throw new Error('Teacher profile not found');
      }
      
      const teacherProfile = profileResponse.data;
      setProfile(teacherProfile);

      // Load courses and classes
      const [coursesResponse, classesResponse] = await Promise.all([
        getTeacherCourses(teacherProfile.teacherId),
        getTeacherClasses(teacherProfile.teacherId)
      ]);

      if (coursesResponse.success) {
        setCourses(coursesResponse.data.courses || []);
      }

      if (classesResponse.success) {
        setClasses(classesResponse.data.classes || []);
      }

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewCourseClasses = (courseId) => {
    navigate(`/teacher/courses/${courseId}`);
  };

  const viewClassDetails = (classId) => {
    navigate(`/teacher/classes/${classId}`);
  };

  if (loading) {
    return (
      <div className="teacher-dashboard loading-state">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard error-state">
        <div className="error-message">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Teacher Dashboard</h1>
          {profile && (
            <p className="welcome-text">
              Welcome, <strong>{profile.name}</strong>
            </p>
          )}
        </div>
        {profile && (
          <div className="teacher-info-card">
            <p><strong>Teacher Code:</strong> {profile.teacherCode}</p>
            <p><strong>Department:</strong> {profile.department || 'N/A'}</p>
            <p><strong>Specialization:</strong> {profile.specialization || 'N/A'}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Courses Teaching</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{classes.length}</div>
          <div className="stat-label">Total Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {classes.reduce((sum, c) => sum + (c.enrolled || 0), 0)}
          </div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {classes.filter(c => c.status === 'OPEN').length}
          </div>
          <div className="stat-label">Active Classes</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={activeView === 'courses' ? 'active' : ''}
          onClick={() => setActiveView('courses')}
        >
          My Courses ({courses.length})
        </button>
        <button
          className={activeView === 'classes' ? 'active' : ''}
          onClick={() => setActiveView('classes')}
        >
          My Classes ({classes.length})
        </button>
      </div>

      {/* Courses View */}
      {activeView === 'courses' && (
        <div className="courses-section">
          {courses.length === 0 ? (
            <div className="empty-state">
              <p>No courses assigned yet</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.courseId} className="course-card">
                  <div className="course-header">
                    <h3>{course.courseName}</h3>
                    <span className="course-code">{course.courseCode}</span>
                  </div>
                  <div className="course-body">
                    <p className="course-description">
                      {course.description || 'No description available'}
                    </p>
                    <div className="course-meta">
                      <span className="meta-item">
                        📚 {course.credits} credits
                      </span>
                      <span className="meta-item">
                        🏫 {course.classCount || 0} {course.classCount === 1 ? 'class' : 'classes'}
                      </span>
                    </div>
                  </div>
                  <div className="course-footer">
                    <button
                      className="btn-primary"
                      onClick={() => viewCourseClasses(course.courseId)}
                    >
                      View Classes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Classes View */}
      {activeView === 'classes' && (
        <div className="classes-section">
          {classes.length === 0 ? (
            <div className="empty-state">
              <p>No classes assigned yet</p>
            </div>
          ) : (
            <div className="classes-list">
              {classes.map((classItem) => (
                <div key={classItem.classId} className="class-card">
                  <div className="class-header">
                    <div>
                      <h3>
                        {classItem.courseName || 'Unknown Course'}
                        <span className="class-code">{classItem.classCode}</span>
                      </h3>
                      <p className="class-meta">
                        {classItem.courseCode} • {classItem.semester} {classItem.year}
                      </p>
                    </div>
                    <span className={`status-badge status-${classItem.status?.toLowerCase()}`}>
                      {classItem.status}
                    </span>
                  </div>

                  <div className="class-details">
                    <div className="detail-row">
                      <span className="detail-label">📅 Schedule:</span>
                      <span>{classItem.schedule || 'TBA'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">🏢 Room:</span>
                      <span>{classItem.room || 'TBA'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">👥 Enrollment:</span>
                      <span>{classItem.enrolled || 0} / {classItem.capacity || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">🔑 Enroll Key:</span>
                      <code className="enroll-key">{classItem.enrollKey}</code>
                    </div>
                  </div>

                  <div className="class-footer">
                    <button
                      className="btn-primary"
                      onClick={() => viewClassDetails(classItem.classId)}
                    >
                      Manage Class
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
