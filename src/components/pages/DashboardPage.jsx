// src/components/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../../utils/authUtils';
import StudentLayout from "../layout/StudentLayout";
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    activeClasses: 0,
    totalStudents: 0,
    recentImports: 0
  });

  useEffect(() => {
    // Không gọi API để tránh vấn đề CORS
    setStats({
      totalCourses: 0,
      totalClasses: 0,
      activeClasses: 0,
      totalStudents: 0,
      recentImports: 0
    });
    setLoading(false);
  }, []);

  const userRole = getUserRole();

  if (loading) {
    return (
      <StudentLayout>
        <div className="admin-dashboard loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>{userRole === 'ADMIN' ? 'Admin' : 'Manager'} Dashboard</h1>
            <p className="subtitle">Academic System Management</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCourses}</div>
              <div className="stat-label">Total Courses</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏫</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalClasses}</div>
              <div className="stat-label">Total Classes</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeClasses}</div>
              <div className="stat-label">Active Classes</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalStudents}</div>
              <div className="stat-label">Enrolled Students</div>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => navigate('/admin/import')}>
            <div className="stat-icon">📥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.recentImports}</div>
              <div className="stat-label">Recent Imports (7 days)</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => navigate('/admin/import')}
            >
              <div className="action-icon">📥</div>
              <div className="action-title">Import Data</div>
              <div className="action-description">
                Upload Excel file to import students, teachers, courses, and classes
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/courses')}
            >
              <div className="action-icon">📚</div>
              <div className="action-title">Manage Courses</div>
              <div className="action-description">
                View, create, and manage all courses
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/classes')}
            >
              <div className="action-icon">🏫</div>
              <div className="action-title">Manage Classes</div>
              <div className="action-description">
                View, create, and manage class schedules
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/students')}
            >
              <div className="action-icon">🎓</div>
              <div className="action-title">Manage Students</div>
              <div className="action-description">
                View and manage student profiles
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/teachers')}
            >
              <div className="action-icon">👨‍🏫</div>
              <div className="action-title">Manage Teachers</div>
              <div className="action-description">
                View and manage teacher profiles
              </div>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/enrollments')}
            >
              <div className="action-icon">📝</div>
              <div className="action-title">Manage Enrollments</div>
              <div className="action-description">
                View and manage student enrollments
              </div>
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="system-info">
          <h2>System Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">{userRole}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated:</span>
              <span className="info-value">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
