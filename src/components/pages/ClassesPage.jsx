import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import { getClasses, createClass, updateClass, deleteClass, getCourses, getTeachers } from "../../api/academicApi";
import { parseApiError } from "../../api/parseApiError";
import './ClassesPage.css';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaChalkboard,
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaKey,
} from "react-icons/fa";

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDays, setSelectedDays] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    courseId: "",
    className: "",
    teacherId: "",
    schedule: "",
    status: "UPCOMING",
    room: "",
    capacity: "",
    startDate: "",
    endDate: "",
    startTime: "",
    durationPerSession: "",
    enrollKey: "",
  });

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClasses(), loadCourses(), loadTeachers()]);
    } catch (err) {
      console.error("Error loading initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (courseId = null) => {
    try {
      setError(null);
      const response = await getClasses(courseId);
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.items)) list = response.items;
      else list = [];
      setClasses(list);
    } catch (err) {
      console.error("Error loading classes:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed));
    }
  };

  const loadCourses = async () => {
    try {
      const response = await getCourses();
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.items)) list = response.items;
      else list = [];
      setCourses(list);
    } catch (err) {
      console.error("Error loading courses:", err);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await getTeachers();
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.items)) list = response.items;
      else if (Array.isArray(response?.data?.teachers)) list = response.data.teachers;
      else list = [];
      setTeachers(list);
    } catch (err) {
      console.error("Error loading teachers:", err);
    }
  };

  const parseScheduleToDays = (scheduleStr) => {
    if (!scheduleStr) return [];

    const dayMap = {
      'mon': 'Mon', 'monday': 'Mon', 't2': 'Mon',
      'tue': 'Tue', 'tuesday': 'Tue', 't3': 'Tue',
      'wed': 'Wed', 'wednesday': 'Wed', 't4': 'Wed',
      'thu': 'Thu', 'thursday': 'Thu', 't5': 'Thu',
      'fri': 'Fri', 'friday': 'Fri', 't6': 'Fri',
      'sat': 'Sat', 'saturday': 'Sat', 't7': 'Sat',
      'sun': 'Sun', 'sunday': 'Sun', 'cn': 'Sun'
    };

    const normalized = scheduleStr.toLowerCase().trim();
    const tokens = normalized.split(/[,\-\s]+/).map(t => t.trim()).filter(t => t.length > 0);
    const days = [];

    tokens.forEach(token => {
      if (dayMap[token] && !days.includes(dayMap[token])) {
        days.push(dayMap[token]);
      }
    });

    return days;
  };

  const formatDaysToSchedule = (daysArray) => {
    if (!daysArray || daysArray.length === 0) return "";
    return daysArray.join(", ");
  };

  // Danh sách các ngày trong tuần
  const weekDays = [
    { value: "Mon", label: "Thứ 2" },
    { value: "Tue", label: "Thứ 3" },
    { value: "Wed", label: "Thứ 4" },
    { value: "Thu", label: "Thứ 5" },
    { value: "Fri", label: "Thứ 6" },
    { value: "Sat", label: "Thứ 7" },
    { value: "Sun", label: "Chủ nhật" },
  ];

  const handleFilterChange = (courseId) => {
    setFilterCourseId(courseId);
    loadClasses(courseId || null);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentClass(null);
    setFormData({
      courseId: "",
      className: "",
      teacherId: "",
      schedule: "",
      status: "UPCOMING",
      room: "",
      capacity: "",
      startDate: "",
      endDate: "",
      startTime: "",
      durationPerSession: "",
      enrollKey: ""
    });
    setSelectedDays([]);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (classItem) => {
    setModalMode("edit");
    setCurrentClass(classItem);

    const convertDateFormat = (dateStr) => {
      if (!dateStr) return "";

      // Nếu đã là format yyyy-mm-dd, return luôn
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.split("T")[0]; // Lấy phần date nếu có time
      }

      // Nếu là format mm-dd-yyyy, convert sang yyyy-mm-dd
      // Pattern: mm-dd-yyyy hoặc m-d-yyyy
      const mmddyyyyPattern = /^(\d{1,2})-(\d{1,2})-(\d{4})/;
      const match = String(dateStr).match(mmddyyyyPattern);

      if (match) {
        const month = match[1].padStart(2, "0");
        const day = match[2].padStart(2, "0");
        const year = match[3];
        return `${year}-${month}-${day}`;
      }

      // Nếu không match pattern nào, thử parse như Date object
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Ignore
      }

      return "";
    };

    const scheduleDays = parseScheduleToDays(classItem.schedule || "");

    setFormData({
      courseId: classItem.courseId || "",
      className: classItem.className || "",
      teacherId: classItem.teacherId || "",
      schedule: classItem.schedule || "",
      room: classItem.room || "",
      capacity: classItem.capacity || "",
      startDate: convertDateFormat(classItem.startDate), // Convert từ mm-dd-yyyy sang yyyy-mm-dd
      endDate: convertDateFormat(classItem.endDate),     // Convert từ mm-dd-yyyy sang yyyy-mm-dd
      status: classItem.status || "UPCOMING",
      startTime: classItem.startTime || "",
      durationPerSession: classItem.durationPerSession || "",
      enrollKey: classItem.enrollKey
    });
    setSelectedDays(scheduleDays);
    setModalError(null);
    setModalOpen(true);
  };

  // Handler khi user chọn/bỏ chọn ngày
  const handleDayToggle = (dayValue) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        // Bỏ chọn
        return prev.filter(d => d !== dayValue);
      } else {
        // Chọn thêm
        return [...prev, dayValue].sort((a, b) => {
          const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          return order.indexOf(a) - order.indexOf(b);
        });
      }
    });

    // Update schedule string trong formData
    const newDays = selectedDays.includes(dayValue)
      ? selectedDays.filter(d => d !== dayValue)
      : [...selectedDays, dayValue].sort((a, b) => {
        const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return order.indexOf(a) - order.indexOf(b);
      });

    setFormData(prev => ({
      ...prev,
      schedule: formatDaysToSchedule(newDays)
    }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentClass(null);
  };

  const handleNumberInput = (e, field) => {
    const value = e.target.value;
    if (value === "") {
      setFormData({ ...formData, [field]: "" });
      return;
    }
    const numValue = parseInt(value, 10);
    if (numValue < 0) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    setModalError(null);
    // Validation
    if (modalMode === "create") {
      if (!formData.courseId) {
        setModalError("Vui lòng chọn khóa học");
        return;
      }

      if (!formData.className) {
        setModalError("Vui lòng nhập tên lớp học");
        return;
      }

      if (!formData.room) {
        setModalError("Vui lòng nhập phòng học");
        return;
      }

      if (!formData.capacity) {
        setModalError("Vui lòng nhập sức chứa");
        return;
      }

      const capacity = parseInt(formData.capacity, 10);
      if (isNaN(capacity) || capacity < 1) {
        setModalError("Sức chứa phải >= 1");
        return;
      }

      if (selectedDays.length === 0) {
        setModalError("Vui lòng chọn ít nhất một ngày học");
        return;
      }

      if (!formData.status || !["UPCOMING", "ACTIVE", "COMPLETED"].includes(formData.status)) {
        setModalError("Vui lòng chọn trạng thái hợp lệ");
        return;
      }

      if (!formData.startTime) {
        setModalError("Vui lòng nhập giờ bắt đầu");
        return;
      }

      const duration = parseInt(formData.durationPerSession, 10);
      if (!formData.durationPerSession || isNaN(duration) || duration < 1) {
        setModalError("Thời lượng buổi học phải >= 1 phút");
        return;
      }

      if (!formData.startDate) {
        setModalError("Vui lòng chọn ngày bắt đầu");
        return;
      }

      if (!formData.endDate) {
        setModalError("Vui lòng chọn ngày kết thúc");
        return;
      }

      if (!formData.teacherId) {
        setModalError("Vui lòng chọn giáo viên");
        return;
      }

      if (!formData.enrollKey) {
        setModalError("Vui lòng nhập enrollkey");
        return;
      }
    } else {
      if (formData.capacity) {
        const capacity = parseInt(formData.capacity, 10);
        if (isNaN(capacity) || capacity < 1) {
          setModalError("Sức chứa phải >= 1");
          return;
        }
      }

      if (formData.durationPerSession) {
        const duration = parseInt(formData.durationPerSession, 10);
        if (isNaN(duration) || duration < 1) {
          setModalError("Thời lượng buổi học phải >= 1 phút");
          return;
        }
      }

      if (formData.status && !["UPCOMING", "ACTIVE", "COMPLETED"].includes(formData.status)) {
        setModalError("Vui lòng chọn trạng thái hợp lệ");
        return;
      }
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const scheduleString = formatDaysToSchedule(selectedDays);

      const payload = {
        courseId: formData.courseId,
        className: formData.className,
        teacherId: formData.teacherId,
        schedule: scheduleString,
        room: formData.room,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        durationPerSession: formData.durationPerSession ? parseInt(formData.durationPerSession, 10) : null,
        status: formData.status,
        enrollKey: formData.enrollKey,
      };

      if (modalMode === "create") {
        await createClass(payload);
      } else {
        // For update, only send updateable fields (exclude null/empty values)
        const updatePayload = {};
        if (payload.className) updatePayload.className = payload.className;
        if (scheduleString) updatePayload.schedule = scheduleString;
        if (payload.room) updatePayload.room = payload.room;
        if (payload.capacity !== null && payload.capacity !== undefined) updatePayload.capacity = payload.capacity;
        if (payload.status) updatePayload.status = payload.status;
        if (payload.startTime) updatePayload.startTime = payload.startTime;
        if (payload.durationPerSession !== null && payload.durationPerSession !== undefined) {
          updatePayload.durationPerSession = payload.durationPerSession;
        }
        if (payload.startDate) updatePayload.startDate = payload.startDate;
        if (payload.endDate) updatePayload.endDate = payload.endDate;
        if (payload.teacherId) updatePayload.teacherId = payload.teacherId;
        if (payload.enrollKey) updatePayload.enrollKey = payload.enrollKey;

        await updateClass(currentClass.classId, updatePayload);
      }

      closeModal();
      loadClasses(filterCourseId || null);
    } catch (err) {
      console.error("Error saving class:", err);
      const parsed = parseApiError(err);
      setModalError(parsed?.message || String(parsed));
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
      loadClasses(filterCourseId || null);
    } catch (err) {
      console.error("Error deleting class:", err);
      const parsed = parseApiError(err);
      alert(parsed?.message || String(parsed));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: classes.length,
    active: classes.filter(c => c.status === 'ACTIVE').length,
    upcoming: classes.filter(c => c.status === 'UPCOMING').length,
    completed: classes.filter(c => c.status === 'COMPLETED').length
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch =
      classItem.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.room?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || classItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClasses = filteredClasses.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCourseId, statusFilter]);

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.courseId === courseId);
    return course?.courseName || courseId;
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.teacherId === teacherId || t.userId === teacherId);
    return teacher?.name || teacher?.teacherName || teacherId;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { label: "Đang học", color: "#10B981", bg: "#D1FAE5" },
      UPCOMING: { label: "Sắp học", color: "#3B82F6", bg: "#DBEAFE" },
      COMPLETED: { label: "Hoàn thành", color: "#6B7280", bg: "#F3F4F6" },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "12px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <StudentLayout>
      <div className="classes-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Quản lý Lớp học</h1>
            <p className="subtitle">Quản lý danh sách lớp học và thông tin chi tiết</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#6366F1' }}>🏫</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng lớp học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Đang học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.upcoming}</div>
              <div className="stat-label">Sắp học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>🎓</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-row">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên lớp hoặc phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={filterCourseId}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map(course => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang học</option>
              <option value="UPCOMING">Sắp học</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>

            <button onClick={openCreateModal} className="btn-primary">
              <FaPlus />
              Thêm lớp học
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: "4px solid #E5E7EB",
                borderTopColor: "#05386D",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>
              {`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}

        {/* Classes Grid */}
        {!loading && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "20px",
              }}
            >
              {paginatedClasses.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "#fff",
                    padding: "60px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    textAlign: "center",
                  }}
                >
                  <FaChalkboard style={{ fontSize: "48px", color: "#9CA3AF", marginBottom: "15px" }} />
                  <p style={{ color: "#6B7280", fontSize: "16px" }}>
                    {searchTerm || filterCourseId ? "Không tìm thấy lớp học phù hợp" : "Chưa có lớp học nào"}
                  </p>
                </div>
              ) : (
                paginatedClasses.map((classItem) => (
                  <div
                    key={classItem.classId}
                    onClick={() => navigate(`/classes/${classItem.classId}`)}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                    }}
                  >
                    {/* Class Header */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        padding: "20px",
                        color: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "5px" }}>
                            {getCourseName(classItem.courseId)}
                          </div>
                          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                            {classItem.className}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Class Body */}
                    <div style={{ padding: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
                        {classItem.room && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B7280", fontSize: "14px" }}>
                            <FaChalkboard />
                            <span>Phòng: {classItem.room}</span>
                          </div>
                        )}
                        {classItem.capacity && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B7280", fontSize: "14px" }}>
                            <FaUsers />
                            <span>Sức chứa: {classItem.capacity} học viên</span>
                          </div>
                        )}
                        {classItem.schedule && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B7280", fontSize: "14px" }}>
                            <FaCalendarAlt />
                            <span>{classItem.schedule}</span>
                          </div>
                        )}
                        {classItem.startTime && classItem.durationPerSession && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B7280", fontSize: "14px" }}>
                            <FaClock />
                            <span>{classItem.startTime} ({classItem.durationPerSession} phút)</span>
                          </div>
                        )}
                        {classItem.enrollKey && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B7280", fontSize: "14px" }}>
                            <FaKey />
                            <span>{classItem.enrollKey}</span>
                          </div>
                        )}
                      </div>

                      {classItem.status && (
                        <div style={{ marginBottom: "15px" }}>
                          {getStatusBadge(classItem.status)}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "10px", paddingTop: "15px", borderTop: "1px solid #F3F4F6" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(classItem);
                          }}
                          style={{
                            flex: 1,
                            padding: "8px 16px",
                            backgroundColor: "#F3F4F6",
                            color: "#374151",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <FaEdit />
                          Sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(classItem);
                          }}
                          style={{
                            flex: 1,
                            padding: "8px 16px",
                            backgroundColor: "#FEE2E2",
                            color: "#DC2626",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <FaTrash />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredClasses.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "15px",
                  marginTop: "30px",
                  padding: "20px",
                }}
              >
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: currentPage === 1 ? "#E5E7EB" : "#05386D",
                    color: currentPage === 1 ? "#9CA3AF" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaChevronLeft /> Trước
                </button>

                <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: currentPage === totalPages ? "#E5E7EB" : "#05386D",
                    color: currentPage === totalPages ? "#9CA3AF" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Tiếp <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
            }}
            onClick={closeModal}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "700px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#05386D", fontSize: "24px", fontWeight: 700 }}>
                  {modalMode === "create" ? "Thêm lớp học mới" : "Chỉnh sửa lớp học"}
                </h3>
                <button
                  onClick={closeModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    color: "#9CA3AF",
                    cursor: "pointer",
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {modalError && (
                <div
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "14px",
                  }}
                >
                  {modalError}
                </div>
              )}

              {/* Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Course Selection - only for create mode */}
                {modalMode === "create" && (
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                      Khóa học <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Chọn khóa học</option>
                      {courses.map(course => (
                        <option key={course.courseId} value={course.courseId}>
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Class Name */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Tên lớp học {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Lớp Java cơ bản - Sáng"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  {/* Room */}
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                      Phòng học {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="VD: A101"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                      Sức chứa {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 30"
                      value={formData.capacity}
                      onChange={(e) => handleNumberInput(e, "capacity")}
                      min="0"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Lịch học {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                  </label>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "10px",
                    padding: "12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  }}>
                    {weekDays.map(day => (
                      <label
                        key={day.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "6px",
                          backgroundColor: selectedDays.includes(day.value) ? "#E0E7FF" : "transparent",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedDays.includes(day.value)) {
                            e.currentTarget.style.backgroundColor = "#F3F4F6";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedDays.includes(day.value)) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            accentColor: "#05386D",
                          }}
                        />
                        <span style={{
                          fontSize: "14px",
                          color: selectedDays.includes(day.value) ? "#05386D" : "#374151",
                          fontWeight: selectedDays.includes(day.value) ? 600 : 400,
                        }}>
                          {day.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <div style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#6B7280",
                      fontStyle: "italic",
                    }}>
                      Đã chọn: {formatDaysToSchedule(selectedDays)}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Status Selection - both for create and edit mode */}
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                      Trạng thái {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <option value="UPCOMING">Sắp học</option>
                      <option value="ACTIVE">Đang học</option>
                      <option value="COMPLETED">Hoàn thành</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    {/* Start Time */}
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                        Giờ bắt đầu {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    {/* Duration Per Session */}
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                        Thời lượng (phút) {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 90"
                        value={formData.durationPerSession}
                        onChange={(e) => handleNumberInput(e, "durationPerSession")}
                        min="0"
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Show dates for both create and edit mode */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    {/* Start Date */}
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                        Ngày bắt đầu {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                        Ngày kết thúc {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    {/* Teacher Selection - both for create and edit mode */}
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                        Giáo viên {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                      </label>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "14px",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Chọn giáo viên</option>
                        {teachers.map(teacher => (
                          <option
                            key={teacher.teacherId || teacher.userId}
                            value={teacher.teacherId || teacher.userId}
                          >
                            {teacher.name || teacher.teacherName || teacher.teacherCode || teacher.teacherId || teacher.userId}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* EnrollKey */}
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                        EnrollKey {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="VD: ENROLL2024CS101"
                        value={formData.enrollKey}
                        onChange={(e) => setFormData({ ...formData, enrollKey: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "30px" }}>
                  <button
                    onClick={closeModal}
                    disabled={modalLoading}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#F3F4F6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={modalLoading}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#05386D",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: modalLoading ? "not-allowed" : "pointer",
                      opacity: modalLoading ? 0.6 : 1,
                    }}
                  >
                    {modalLoading ? "Đang lưu..." : modalMode === "create" ? "Tạo lớp học" : "Cập nhật"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={closeDeleteConfirm}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "450px",
                width: "90%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "15px", color: "#DC2626", fontSize: "24px", fontWeight: 700 }}>
                Xác nhận xóa
              </h3>
              <p style={{ color: "#6B7280", marginBottom: "20px", lineHeight: "1.6" }}>
                Bạn có chắc chắn muốn xóa lớp học <strong>{classToDelete?.className}</strong>?
                Hành động này không thể hoàn tác.
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleteLoading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#DC2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: deleteLoading ? "not-allowed" : "pointer",
                    opacity: deleteLoading ? 0.6 : 1,
                  }}
                >
                  {deleteLoading ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}