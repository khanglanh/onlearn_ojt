import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getTeacherClasses } from '../../api/academic';
import TeacherLayout from '../layout/TeacherLayout';
import './TeacherDashboardPage.css';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeView, setActiveView] = useState('overview'); // 'overview' or 'classes'

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

      // Load classes
      const classesResponse = await getTeacherClasses(teacherProfile.teacherId);
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

  const viewClassDetails = (classId) => {
    navigate(`/teacher/classes/${classId}`);
  };

  // Helper function to parse schedule and extract all days of week
  const parseScheduleDays = (schedule) => {
    if (!schedule) return [];
    const dayMap = {
      't2': 'Mon', 'mon': 'Mon', 'monday': 'Mon',
      't3': 'Tue', 'tue': 'Tue', 'tuesday': 'Tue',
      't4': 'Wed', 'wed': 'Wed', 'wednesday': 'Wed',
      't5': 'Thu', 'thu': 'Thu', 'thursday': 'Thu',
      't6': 'Fri', 'fri': 'Fri', 'friday': 'Fri',
      't7': 'Sat', 'sat': 'Sat', 'saturday': 'Sat',
      'cn': 'Sun', 'sun': 'Sun', 'sunday': 'Sun'
    };
    
    const scheduleLower = schedule.toLowerCase();
    const foundDays = [];
    
    // Split by common delimiters: comma, dash, space
    const tokens = scheduleLower.split(/[,\-\s]+/).map(t => t.trim()).filter(t => t.length > 0);
    
    // Check each token against day map
    tokens.forEach(token => {
      if (dayMap[token]) {
        const day = dayMap[token];
        if (!foundDays.includes(day)) {
          foundDays.push(day);
        }
      }
    });
    
    // If no days found in tokens, try direct matching in the whole string
    if (foundDays.length === 0) {
      for (const [key, value] of Object.entries(dayMap)) {
        if (scheduleLower.includes(key) && !foundDays.includes(value)) {
          foundDays.push(value);
        }
      }
    }
    
    return foundDays;
  };

  // Helper function to calculate hours from schedule
  const calculateHoursFromSchedule = (schedule) => {
    if (!schedule) return 2; // Default 2 hours if no schedule
    // Try to extract time range like "8:00-10:00" or "08:00-10:00"
    const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const startHour = parseInt(timeMatch[1]);
      const startMin = parseInt(timeMatch[2]);
      const endHour = parseInt(timeMatch[3]);
      const endMin = parseInt(timeMatch[4]);
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;
      const diffMinutes = endTotal - startTotal;
      return Math.round(diffMinutes / 60 * 10) / 10; // Round to 1 decimal
    }
    return 2; // Default 2 hours
  };

  // Calculate statistics
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'OPEN').length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled || 0), 0);
  
  // Calculate today's teaching hours from actual schedule
  const today = new Date();
  const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()];
  const todayClassesList = classes.filter(c => {
    if (c.status !== 'OPEN') return false;
    const scheduleDays = parseScheduleDays(c.schedule);
    return scheduleDays.includes(todayDayName);
  });
  const todayHours = todayClassesList.reduce((sum, c) => {
    return sum + calculateHoursFromSchedule(c.schedule);
  }, 0);
  
  // Calculate completed hours (mock: assume 60% of today's hours are completed)
  // In real implementation, check actual class session completion status
  const currentHour = today.getHours();
  const completedHours = todayHours > 0 
    ? Math.min(todayHours, Math.max(0, (currentHour - 8) / 8 * todayHours)) // Assume classes start at 8 AM
    : 0;
  
  // Calculate weekly class distribution from actual schedule
  // Note: "classes" here means number of sessions (buổi học), not number of classes
  const weeklyData = [
    { day: 'Mon', classes: 0, hours: 0 }, // classes = số buổi học
    { day: 'Tue', classes: 0, hours: 0 },
    { day: 'Wed', classes: 0, hours: 0 },
    { day: 'Thu', classes: 0, hours: 0 },
    { day: 'Fri', classes: 0, hours: 0 },
    { day: 'Sat', classes: 0, hours: 0 },
    { day: 'Sun', classes: 0, hours: 0 }
  ];
  
  // Count sessions (buổi học) and hours for each day
  // Một lớp có thể có nhiều buổi trong tuần (ví dụ: Mon,Wed → 2 buổi)
  classes.forEach(c => {
    if (c.status === 'OPEN' && c.schedule) {
      const scheduleDays = parseScheduleDays(c.schedule);
      const hoursPerSession = calculateHoursFromSchedule(c.schedule);
      
      // Mỗi ngày trong schedule = 1 buổi học
      scheduleDays.forEach(day => {
        const dayIndex = weeklyData.findIndex(d => d.day === day);
        if (dayIndex !== -1) {
          weeklyData[dayIndex].classes += 1; // Đếm số buổi học
          weeklyData[dayIndex].hours += hoursPerSession;
        }
      });
    }
  });
  
  const maxClasses = Math.max(...weeklyData.map(d => d.classes), 1);

  if (loading) {
    return (
      <TeacherLayout>
        <div className="teacher-dashboard loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="teacher-dashboard error-state">
          <div className="error-message">
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
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
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <div className="stat-value">{totalClasses}</div>
            <div className="stat-label">Tổng số lớp</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{activeClasses}</div>
            <div className="stat-label">Lớp đang mở</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">Tổng số học viên</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{todayHours.toFixed(1)}</div>
            <div className="stat-label">Giờ dạy hôm nay</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{completedHours.toFixed(1)}</div>
            <div className="stat-label">Đã hoàn thành</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {todayHours > 0 ? Math.round((completedHours / todayHours) * 100) : 0}%
            </div>
            <div className="stat-label">Tiến độ hôm nay</div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={activeView === 'overview' ? 'active' : ''}
          onClick={() => setActiveView('overview')}
        >
          Tổng quan
        </button>
        <button
          className={activeView === 'classes' ? 'active' : ''}
          onClick={() => setActiveView('classes')}
        >
          Lớp học của tôi ({classes.length})
        </button>
      </div>

      {/* Charts Section */}
      {activeView === 'overview' && (
        <div className="charts-section">
          <div className="chart-card">
            <h3>Lịch giảng dạy trong tuần</h3>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '1rem', textAlign: 'center' }}>
              Số buổi học mỗi ngày
            </p>
            <div className="bar-chart">
              {weeklyData.map((data, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(data.classes / maxClasses) * 100}%`,
                        backgroundColor: data.classes > 0 ? '#3182ce' : '#e2e8f0'
                      }}
                    >
                      <span className="bar-value">{data.classes}</span>
                    </div>
                  </div>
                  <div className="bar-label">
                    <div>{data.day}</div>
                    {data.hours > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '2px' }}>
                        {data.hours.toFixed(1)}h
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Thống kê lớp học</h3>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <svg viewBox="0 0 200 200" className="pie-svg">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="40"
                  />
                  {/* Active classes arc */}
                  {totalClasses > 0 && activeClasses > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#3182ce"
                      strokeWidth="40"
                      strokeDasharray={`${(activeClasses / totalClasses) * 502.4} 502.4`}
                      strokeDashoffset="125.6"
                      transform="rotate(-90 100 100)"
                    />
                  )}
                  {/* Closed classes arc (if any) */}
                  {totalClasses > 0 && (totalClasses - activeClasses) > 0 && activeClasses < totalClasses && (
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#cbd5e0"
                      strokeWidth="40"
                      strokeDasharray={`${((totalClasses - activeClasses) / totalClasses) * 502.4} 502.4`}
                      strokeDashoffset={`${125.6 - (activeClasses / totalClasses) * 502.4}`}
                      transform="rotate(-90 100 100)"
                    />
                  )}
                </svg>
                <div className="pie-center">
                  <div className="pie-value">{activeClasses}</div>
                  <div className="pie-label">/{totalClasses}</div>
                </div>
              </div>
              <div className="pie-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3182ce' }}></span>
                  <span>Lớp đang mở ({activeClasses})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#cbd5e0' }}></span>
                  <span>Lớp đã đóng ({totalClasses - activeClasses})</span>
                </div>
              </div>
            </div>
          </div>
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
    </TeacherLayout>
  );
}
