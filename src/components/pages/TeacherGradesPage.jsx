import { useState, useEffect } from 'react';
import { getMyProfile, getTeacherClasses } from '../../api/academic';
import TeacherLayout from '../layout/TeacherLayout';
import './TeacherGradesPage.css';

export default function TeacherGradesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

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
      const classesResponse = await getTeacherClasses(teacherProfile.teacherId);
      
      if (classesResponse.success) {
        const classesList = classesResponse.data.classes || [];
        setClasses(classesList);
        if (classesList.length > 0) {
          setSelectedClass(classesList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="teacher-grades loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="teacher-grades error-state">
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
      <div className="teacher-grades">
        <div className="page-header">
          <h1>Chấm điểm</h1>
          <p>Quản lý điểm số của học viên trong các lớp học</p>
        </div>

        <div className="grades-content">
          {/* Class Selector */}
          <div className="class-selector">
            <label>Chọn lớp học:</label>
            <select
              value={selectedClass?.classId || ''}
              onChange={(e) => {
                const classItem = classes.find(c => c.classId === e.target.value);
                setSelectedClass(classItem);
              }}
              className="class-select"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((classItem) => (
                <option key={classItem.classId} value={classItem.classId}>
                  {classItem.classCode} - {classItem.courseName}
                </option>
              ))}
            </select>
          </div>

          {selectedClass ? (
            <div className="grades-panel">
              <div className="class-info">
                <h2>{selectedClass.classCode} - {selectedClass.courseName}</h2>
                <p>Lịch học: {selectedClass.schedule || 'Chưa có'}</p>
                <p>Phòng: {selectedClass.room || 'Chưa có'}</p>
              </div>

              <div className="coming-soon">
                <p>Chức năng chấm điểm đang được phát triển...</p>
                <p className="hint">Bạn sẽ có thể nhập và quản lý điểm số của học viên tại đây.</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Vui lòng chọn một lớp học để quản lý điểm số</p>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}

