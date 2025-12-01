import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getTeacherClasses } from '../../api/academic';
import TeacherLayout from '../layout/TeacherLayout';
import './TeacherStudentsPage.css';

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);

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
          // TODO: Load students for selected class
          // For now, using mock data
          setStudents([]);
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
        <div className="teacher-students loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="teacher-students error-state">
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
      <div className="teacher-students">
        <div className="page-header">
          <h1>Quản lý Học viên</h1>
          <p>Xem và quản lý danh sách học viên trong các lớp học của bạn</p>
        </div>

        <div className="content-grid">
          {/* Class List */}
          <div className="classes-panel">
            <h2>Lớp học của tôi</h2>
            {classes.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có lớp học nào</p>
              </div>
            ) : (
              <div className="classes-list">
                {classes.map((classItem) => (
                  <div
                    key={classItem.classId}
                    className={`class-item ${selectedClass?.classId === classItem.classId ? 'active' : ''}`}
                    onClick={() => setSelectedClass(classItem)}
                  >
                    <div className="class-item-header">
                      <h3>{classItem.courseName || 'Khóa học không xác định'}</h3>
                      <span className="class-code">{classItem.classCode}</span>
                    </div>
                    <div className="class-item-meta">
                      <span>👥 {classItem.enrolled || 0} / {classItem.capacity || 0}</span>
                      <span className={`status-badge status-${classItem.status?.toLowerCase()}`}>
                        {classItem.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students List */}
          <div className="students-panel">
            <h2>
              {selectedClass ? `Học viên - ${selectedClass.classCode}` : 'Chọn lớp học'}
            </h2>
            {!selectedClass ? (
              <div className="empty-state">
                <p>Vui lòng chọn một lớp học để xem danh sách học viên</p>
              </div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <p>Lớp học này chưa có học viên đăng ký</p>
              </div>
            ) : (
              <div className="students-list">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã SV</th>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Ngành</th>
                      <th>Khóa</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.studentId}>
                        <td>{index + 1}</td>
                        <td>{student.studentCode}</td>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.major || 'N/A'}</td>
                        <td>{student.cohort || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${student.active ? 'active' : 'inactive'}`}>
                            {student.active ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

