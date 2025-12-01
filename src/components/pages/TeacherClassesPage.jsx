import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, getTeacherClasses } from '../../api/academic';
import { createClass, updateClass, deleteClass, getClass } from '../../api/academicApi';
import { enrollInClass } from '../../api/academic';
import TeacherLayout from '../layout/TeacherLayout';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaCalendarAlt, FaClock, FaKey, FaClipboard, FaTrophy, FaTimes } from 'react-icons/fa';
import './TeacherClassesPage.css';

export default function TeacherClassesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  
  // Enroll modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollClassId, setEnrollClassId] = useState(null);
  const [enrollKey, setEnrollKey] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    courseId: '',
    className: '',
    schedule: '',
    room: '',
    capacity: '',
    startDate: '',
    endDate: '',
    startTime: '',
    durationPerSession: '',
  });

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
      
      // TODO: Load courses for create class
      // For now, courses will be empty
      setCourses([]);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentClass(null);
    setFormData({
      courseId: '',
      className: '',
      schedule: '',
      room: '',
      capacity: '',
      startDate: '',
      endDate: '',
      startTime: '',
      durationPerSession: '',
    });
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (classItem) => {
    setModalMode('edit');
    setCurrentClass(classItem);
    setFormData({
      courseId: classItem.courseId || '',
      className: classItem.className || '',
      schedule: classItem.schedule || '',
      room: classItem.room || '',
      capacity: classItem.capacity || '',
      startDate: classItem.startDate || '',
      endDate: classItem.endDate || '',
      startTime: classItem.startTime || '',
      durationPerSession: classItem.durationPerSession || '',
    });
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentClass(null);
  };

  const handleSubmit = async () => {
    if (!formData.className) {
      setModalError('Vui lòng nhập tên lớp học');
      return;
    }

    if (!formData.startTime) {
      setModalError('Vui lòng nhập giờ bắt đầu');
      return;
    }

    const duration = parseInt(formData.durationPerSession, 10);
    if (!formData.durationPerSession || isNaN(duration) || duration < 1) {
      setModalError('Thời lượng buổi học phải >= 1 phút');
      return;
    }

    const capacity = parseInt(formData.capacity, 10);
    if (formData.capacity && (isNaN(capacity) || capacity < 1)) {
      setModalError('Sức chứa phải >= 1');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const payload = {
        ...formData,
        teacherId: profile.teacherId,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
        durationPerSession: parseInt(formData.durationPerSession, 10),
      };

      if (modalMode === 'create') {
        await createClass(payload);
      } else {
        const updatePayload = {
          className: payload.className,
          schedule: payload.schedule,
          room: payload.room,
          capacity: payload.capacity,
          startTime: payload.startTime,
          durationPerSession: payload.durationPerSession,
        };
        await updateClass(currentClass.classId, updatePayload);
      }
      
      closeModal();
      loadData();
    } catch (err) {
      console.error('Error saving class:', err);
      setModalError(err.message || 'Failed to save class');
    } finally {
      setModalLoading(false);
    }
  };

  const openDeleteConfirm = (classItem) => {
    setClassToDelete(classItem);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setClassToDelete(null);
  };

  const handleDelete = async () => {
    if (!classToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteClass(classToDelete.classId);
      closeDeleteConfirm();
      loadData();
    } catch (err) {
      console.error('Error deleting class:', err);
      alert(err.message || 'Failed to delete class');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEnrollModal = (classId) => {
    setEnrollClassId(classId);
    setEnrollKey('');
    setEnrollError(null);
    setEnrollModalOpen(true);
  };

  const closeEnrollModal = () => {
    setEnrollModalOpen(false);
    setEnrollClassId(null);
    setEnrollKey('');
    setEnrollError(null);
  };

  const handleEnroll = async () => {
    if (!enrollKey.trim()) {
      setEnrollError('Vui lòng nhập mã đăng ký');
      return;
    }

    setEnrollLoading(true);
    setEnrollError(null);

    try {
      // Note: enrollInClass expects studentId from profile, but for teacher enrolling students
      // we might need a different API endpoint. For now, this is a placeholder.
      // In real implementation, teacher might enroll students by studentId directly
      await enrollInClass(enrollClassId, enrollKey);
      closeEnrollModal();
      loadData(); // Reload to get updated enrollment count
    } catch (err) {
      console.error('Error enrolling:', err);
      setEnrollError(err.message || 'Failed to enroll. Please check the enrollment key.');
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="teacher-classes loading-state">
          <div className="spinner"></div>
          <p>Loading classes...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="teacher-classes error-state">
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
      <div className="teacher-classes">
        <div className="page-header">
          <div>
            <h1>Lớp học của tôi</h1>
            <p className="subtitle">Quản lý các lớp học bạn đang phụ trách</p>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            <FaPlus /> Tạo lớp học mới
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <p>Bạn chưa có lớp học nào được giao</p>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map((classItem) => (
              <div key={classItem.classId} className="class-card">
                <div className="class-header">
                  <div>
                    <h3>{classItem.className || 'Unnamed Class'}</h3>
                    <p className="class-code">{classItem.classCode}</p>
                  </div>
                  <span className={`status-badge status-${classItem.status?.toLowerCase()}`}>
                    {classItem.status || 'UNKNOWN'}
                  </span>
                </div>

                <div className="class-info">
                  {classItem.schedule && (
                    <div className="info-row">
                      <FaCalendarAlt />
                      <span>{classItem.schedule}</span>
                    </div>
                  )}
                  {classItem.room && (
                    <div className="info-row">
                      <FaUsers />
                      <span>Phòng: {classItem.room}</span>
                    </div>
                  )}
                  {classItem.startTime && (
                    <div className="info-row">
                      <FaClock />
                      <span>{classItem.startTime} ({classItem.durationPerSession || 0} phút)</span>
                    </div>
                  )}
                  <div className="info-row">
                    <FaUsers />
                    <span>Đăng ký: {classItem.enrolled || 0} / {classItem.capacity || 0}</span>
                  </div>
                  {classItem.enrollKey && (
                    <div className="info-row">
                      <FaKey />
                      <span>Mã đăng ký: <code>{classItem.enrollKey}</code></span>
                    </div>
                  )}
                </div>

                <div className="class-actions">
                  <button
                    className="action-btn btn-attendance"
                    onClick={() => navigate(`/teacher/attendance?classId=${classItem.classId}`)}
                  >
                    <FaClipboard /> Điểm danh
                  </button>
                  <button
                    className="action-btn btn-grades"
                    onClick={() => navigate(`/teacher/grades?classId=${classItem.classId}`)}
                  >
                    <FaTrophy /> Chấm điểm
                  </button>
                  <button
                    className="action-btn btn-enroll"
                    onClick={() => openEnrollModal(classItem.classId)}
                  >
                    <FaKey /> Enroll với key
                  </button>
                  <button
                    className="action-btn btn-edit"
                    onClick={() => openEditModal(classItem)}
                  >
                    <FaEdit /> Sửa
                  </button>
                  <button
                    className="action-btn btn-delete"
                    onClick={() => openDeleteConfirm(classItem)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalMode === 'create' ? 'Tạo lớp học mới' : 'Chỉnh sửa lớp học'}</h3>
                <button className="modal-close" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>

              {modalError && (
                <div className="error-message">{modalError}</div>
              )}

              <div className="modal-body">
                <div className="form-group">
                  <label>Tên lớp học <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="VD: Lớp Java cơ bản - Sáng"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phòng học</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="VD: A101"
                    />
                  </div>
                  <div className="form-group">
                    <label>Sức chứa</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="VD: 30"
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Lịch học</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="VD: T2, T4, T6 hoặc Mon, Wed, Fri"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ bắt đầu <span className="required">*</span></label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời lượng (phút) <span className="required">*</span></label>
                    <input
                      type="number"
                      value={formData.durationPerSession}
                      onChange={(e) => setFormData({ ...formData, durationPerSession: e.target.value })}
                      placeholder="VD: 90"
                      min="1"
                    />
                  </div>
                </div>

                {modalMode === 'create' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ngày kết thúc</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal} disabled={modalLoading}>
                  Hủy
                </button>
                <button className="btn-primary" onClick={handleSubmit} disabled={modalLoading}>
                  {modalLoading ? 'Đang lưu...' : modalMode === 'create' ? 'Tạo lớp học' : 'Cập nhật'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Modal */}
        {enrollModalOpen && (
          <div className="modal-overlay" onClick={closeEnrollModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Đăng ký học viên với mã key</h3>
                <button className="modal-close" onClick={closeEnrollModal}>
                  <FaTimes />
                </button>
              </div>

              {enrollError && (
                <div className="error-message">{enrollError}</div>
              )}

              <div className="modal-body">
                <div className="form-group">
                  <label>Mã đăng ký (Enrollment Key) <span className="required">*</span></label>
                  <input
                    type="text"
                    value={enrollKey}
                    onChange={(e) => setEnrollKey(e.target.value)}
                    placeholder="Nhập mã đăng ký của lớp học"
                  />
                  <p className="form-hint">
                    Nhập mã đăng ký để đăng ký học viên vào lớp học này.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeEnrollModal} disabled={enrollLoading}>
                  Hủy
                </button>
                <button className="btn-primary" onClick={handleEnroll} disabled={enrollLoading}>
                  {enrollLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="modal-overlay" onClick={closeDeleteConfirm}>
            <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Xác nhận xóa</h3>
                <button className="modal-close" onClick={closeDeleteConfirm}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Bạn có chắc chắn muốn xóa lớp học <strong>{classToDelete?.className}</strong>?
                  Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeDeleteConfirm} disabled={deleteLoading}>
                  Hủy
                </button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

