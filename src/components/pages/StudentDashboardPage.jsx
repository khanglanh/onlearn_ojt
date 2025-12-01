import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getMyEnrollments } from '../../api/academic';
import StudentLayout from '../layout/StudentLayout';
import './StudentDashboardPage.css';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get student profile
      const profileResponse = await getMyProfile();
      if (!profileResponse.success || profileResponse.data.type !== 'STUDENT') {
        throw new Error('Student profile not found');
      }
      
      const studentProfile = profileResponse.data;
      setProfile(studentProfile);

      // Load enrollments
      const enrollmentsResponse = await getMyEnrollments();
      if (enrollmentsResponse.success) {
        setEnrollments(enrollmentsResponse.data.enrollments || enrollmentsResponse.data || []);
      }

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE' || e.status === 'ENROLLED').length;
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED').length;
  
  // Calculate study hours (mock data - replace with actual schedule data)
  const today = new Date();
  const todayClasses = enrollments.filter(e => {
    // Mock: assume active enrollments have classes today
    return e.status === 'ACTIVE' || e.status === 'ENROLLED';
  });
  const todayHours = todayClasses.length * 2; // Assume 2 hours per class
  const completedHours = Math.floor(todayHours * 0.7); // Mock: 70% completed
  
  // Weekly study distribution for chart
  const weeklyData = [
    { day: 'Mon', hours: Math.floor(Math.random() * 6) + 2 },
    { day: 'Tue', hours: Math.floor(Math.random() * 6) + 2 },
    { day: 'Wed', hours: Math.floor(Math.random() * 6) + 2 },
    { day: 'Thu', hours: Math.floor(Math.random() * 6) + 2 },
    { day: 'Fri', hours: Math.floor(Math.random() * 6) + 2 },
    { day: 'Sat', hours: Math.floor(Math.random() * 4) },
    { day: 'Sun', hours: Math.floor(Math.random() * 2) }
  ];
  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);

  if (loading) {
    return (
      <StudentLayout>
        <div className="student-dashboard loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="student-dashboard error-state">
          <div className="error-message">
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="student-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Student Dashboard</h1>
            {profile && (
              <p className="welcome-text">
              Xin chào, <strong>{profile.name}</strong>
              </p>
            )}
          </div>
          {profile && (
            <div className="student-info-card">
              <p><strong>Student Code:</strong> {profile.studentCode}</p>
              <p><strong>Major:</strong> {profile.major || 'N/A'}</p>
              <p><strong>Cohort:</strong> {profile.cohort || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{totalEnrollments}</div>
              <div className="stat-label">Tổng số lớp đã đăng ký</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{activeEnrollments}</div>
              <div className="stat-label">Lớp đang học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <div className="stat-value">{completedEnrollments}</div>
              <div className="stat-label">Lớp đã hoàn thành</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{todayHours}</div>
              <div className="stat-label">Giờ học hôm nay</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-value">{completedHours}</div>
              <div className="stat-label">Đã hoàn thành</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">
                {totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0}%
              </div>
              <div className="stat-label">Tỷ lệ hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <h3>Lịch học trong tuần</h3>
            <div className="bar-chart">
              {weeklyData.map((data, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(data.hours / maxHours) * 100}%`,
                        backgroundColor: data.hours > 0 ? '#48bb78' : '#e2e8f0'
                      }}
                    >
                      <span className="bar-value">{data.hours}h</span>
                    </div>
                  </div>
                  <div className="bar-label">{data.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Thống kê đăng ký</h3>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <svg viewBox="0 0 200 200" className="pie-svg">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="40"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#48bb78"
                    strokeWidth="40"
                    strokeDasharray={`${totalEnrollments > 0 ? (activeEnrollments / totalEnrollments) * 502.4 : 0} 502.4`}
                    strokeDashoffset="125.6"
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                <div className="pie-center">
                  <div className="pie-value">{activeEnrollments}</div>
                  <div className="pie-label">/{totalEnrollments}</div>
                </div>
              </div>
              <div className="pie-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#48bb78' }}></span>
                  <span>Lớp đang học ({activeEnrollments})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3182ce' }}></span>
                  <span>Lớp đã hoàn thành ({completedEnrollments})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#e2e8f0' }}></span>
                  <span>Khác ({totalEnrollments - activeEnrollments - completedEnrollments})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="recent-section">
          <h2>Lớp học gần đây</h2>
          {enrollments.length === 0 ? (
            <div className="empty-state">
              <p>Bạn chưa đăng ký lớp học nào</p>
              <button className="btn-primary" onClick={() => navigate('/enrollments')}>
                Đăng ký lớp học
              </button>
            </div>
          ) : (
            <div className="enrollments-grid">
              {enrollments.slice(0, 6).map((enrollment) => (
                <div key={enrollment.enrollmentId} className="enrollment-card">
                  <div className="enrollment-header">
                    <h3>{enrollment.className || enrollment.classCode || 'Unknown Class'}</h3>
                    <span className={`status-badge status-${(enrollment.status || 'PENDING').toLowerCase()}`}>
                      {enrollment.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="enrollment-body">
                    <p><strong>Course:</strong> {enrollment.courseName || enrollment.courseCode || 'N/A'}</p>
                    <p><strong>Semester:</strong> {enrollment.semester || 'N/A'} {enrollment.year || ''}</p>
                    {enrollment.enrolledAt && (
                      <p><strong>Enrolled:</strong> {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="enrollment-footer">
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/student/courses/${enrollment.courseId}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

