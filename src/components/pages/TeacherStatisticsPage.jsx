import { useState, useEffect } from 'react';
import { getMyProfile, getTeacherClasses } from '../../api/academic';
import TeacherLayout from '../layout/TeacherLayout';
import './TeacherStatisticsPage.css';

export default function TeacherStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const profileResponse = await getMyProfile();
      if (!profileResponse.success || profileResponse.data.type !== 'TEACHER') {
        throw new Error('Teacher profile not found');
      }
      
      const teacherProfile = profileResponse.data;
      setProfile(teacherProfile);
      
      const classesResponse = await getTeacherClasses(teacherProfile.teacherId);
      
      if (classesResponse.success) {
        setClasses(classesResponse.data.classes || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'OPEN').length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled || 0), 0);
  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const enrollmentRate = totalCapacity > 0 ? (totalStudents / totalCapacity * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <TeacherLayout>
        <div className="teacher-statistics loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="teacher-statistics error-state">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadData}>
              Retry
            </button>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="teacher-statistics">
        <div className="page-header">
          <h1>Thống kê</h1>
          <p>Xem thống kê tổng quan về hoạt động giảng dạy của bạn</p>
        </div>

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
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{enrollmentRate}%</div>
              <div className="stat-label">Tỷ lệ đăng ký</div>
            </div>
          </div>
        </div>

        <div className="coming-soon">
          <p>Chức năng thống kê chi tiết đang được phát triển...</p>
          <p className="hint">Bạn sẽ có thể xem các biểu đồ và báo cáo chi tiết về hoạt động giảng dạy tại đây.</p>
        </div>
      </div>
    </TeacherLayout>
  );
}

