import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../../api/academicApi";
import { parseApiError } from "../../api/parseApiError";
import './CoursesPage.css';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBook,
  FaClock,
  FaUsers,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    courseName: "",
    courseCode: "",
    description: "",
    duration: "",
    durationInSessions: "",
    level: "BEGINNER",
    price: "",
  });

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourses();
      // Normalize response: backend may return either an array or an envelope { data: [...] }
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.items)) list = response.items;
      else list = [];
      setCourses(list);
    } catch (err) {
      console.error("Error loading courses:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentCourse(null);
    setFormData({
      courseName: "",
      courseCode: "",
      description: "",
      duration: "",
      durationInSessions: "",
      level: "BEGINNER",
      price: "",
    });
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setModalMode("edit");
    setCurrentCourse(course);
    setFormData({
      courseName: course.courseName || "",
      courseCode: course.courseCode || "",
      description: course.description || "",
      duration: course.duration || "",
      durationInSessions: course.durationInSessions || "",
      level: course.level || "BEGINNER",
      price: course.price || "",
    });
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCourse(null);
  };

  // Handle input change to prevent negative numbers
  const handleNumberInput = (e, field) => {
    const value = e.target.value;
    // Allow empty string, but reject negative values
    if (value === "") {
      setFormData({ ...formData, [field]: "" });
      return;
    }
    const numValue = parseInt(value, 10);
    if (numValue < 0) {
      return; // Reject negative input
    }
    setFormData({ ...formData, [field]: value });
  };

  // Handle price input (for decimal values)
  const handlePriceInput = (e) => {
    const value = e.target.value;
    // Allow empty string, but reject negative values
    if (value === "") {
      setFormData({ ...formData, price: "" });
      return;
    }
    const numValue = parseFloat(value);
    if (numValue < 0) {
      return; // Reject negative input
    }
    setFormData({ ...formData, price: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.courseName || !formData.courseCode) {
      setModalError("Vui lòng nhập tên khóa học và mã khóa học");
      return;
    }

    // Validate duration (weeks)
    const duration = parseInt(formData.duration, 10);
    if (!formData.duration || isNaN(duration) || duration < 1) {
      setModalError("Thời lượng (tuần) phải >= 1");
      return;
    }

    // Validate durationInSessions (number of sessions)
    const durationInSessions = parseInt(formData.durationInSessions, 10);
    if (!formData.durationInSessions || isNaN(durationInSessions) || durationInSessions < 1) {
      setModalError("Số buổi học phải >= 1");
      return;
    }

    if (!formData.level || !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(formData.level)) {
      setModalError("Vui lòng chọn cấp độ hợp lệ");
      return;
    }

    // Validate relationship: durationInSessions must be >= duration * 2 and <= duration * 7
    const minSessions = duration * 2;
    const maxSessions = duration * 7;
    if (durationInSessions < minSessions) {
      setModalError(`Số buổi học phải >= ${minSessions} (tối thiểu 2 buổi/tuần)`);
      return;
    }
    if (durationInSessions > maxSessions) {
      setModalError(`Số buổi học phải <= ${maxSessions} (tối đa 7 buổi/tuần)`);
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      if (modalMode === "create") {
        await createCourse(formData);
      } else {
        await updateCourse(currentCourse.courseId, formData);
      }

      closeModal();
      loadCourses();
    } catch (err) {
      console.error("Error saving course:", err);
      const parsed = parseApiError(err);
      setModalError(parsed?.message || String(parsed));
    } finally {
      setModalLoading(false);
    }
  };

  const openDeleteConfirm = (course) => {
    setCourseToDelete(course);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setCourseToDelete(null);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteCourse(courseToDelete.courseId);
      closeDeleteConfirm();
      loadCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      const parsed = parseApiError(err);
      alert(parsed?.message || String(parsed));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: courses.length,
    beginner: courses.filter(c => c.level === 'BEGINNER').length,
    intermediate: courses.filter(c => c.level === 'INTERMEDIATE').length,
    advanced: courses.filter(c => c.level === 'ADVANCED').length
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === 'ALL' || course.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCourses = filteredCourses.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getLevelBadge = (level) => {
    const levelConfig = {
      BEGINNER: { label: "Cơ bản", color: "#10B981", bg: "#D1FAE5" },
      INTERMEDIATE: { label: "Trung cấp", color: "#F59E0B", bg: "#FEF3C7" },
      ADVANCED: { label: "Nâng cao", color: "#EF4444", bg: "#FEE2E2" },
    };

    const config = levelConfig[level] || levelConfig.BEGINNER;

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
    <AdminLayout>
      <div className="courses-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Quản lý Khóa học</h1>
            <p className="subtitle">Quản lý danh sách khóa học và chương trình đào tạo</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#6366F1' }}>📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng khóa học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>🟢</div>
            <div className="stat-content">
              <div className="stat-value">{stats.beginner}</div>
              <div className="stat-label">Cơ bản</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}>🟡</div>
            <div className="stat-content">
              <div className="stat-value">{stats.intermediate}</div>
              <div className="stat-label">Trung cấp</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>🔴</div>
            <div className="stat-content">
              <div className="stat-value">{stats.advanced}</div>
              <div className="stat-label">Nâng cao</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-row">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên hoặc mã khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Tất cả cấp độ</option>
              <option value="BEGINNER">Cơ bản</option>
              <option value="INTERMEDIATE">Trung cấp</option>
              <option value="ADVANCED">Nâng cao</option>
            </select>

            <button onClick={openCreateModal} className="btn-primary">
              <FaPlus />
              Thêm khóa học
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

        {/* Courses Grid */}
        {!loading && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "20px",
              }}
            >
              {paginatedCourses.length === 0 && filteredCourses.length === 0 ? (
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
                  <FaBook style={{ fontSize: "48px", color: "#9CA3AF", marginBottom: "15px" }} />
                  <p style={{ color: "#6B7280", fontSize: "16px" }}>
                    {searchTerm ? "Không tìm thấy khóa học phù hợp" : "Chưa có khóa học nào"}
                  </p>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div
                    key={course.courseId}
                    onClick={() => navigate(`/courses/${course.courseId}`)}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
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
                    {/* Course Header */}
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
                            {course.courseCode}
                          </div>
                          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                            {course.courseName}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Course Body */}
                    <div style={{ padding: "20px" }}>
                      {course.description && (
                        <p
                          style={{
                            color: "#6B7280",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            marginBottom: "15px",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {course.description}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap" }}>
                        {course.duration && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7280", fontSize: "13px" }}>
                            <FaClock />
                            <span>{course.duration} tuần</span>
                          </div>
                        )}
                        {course.durationInSessions && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7280", fontSize: "13px" }}>
                            <FaUsers />
                            <span>{course.durationInSessions} buổi</span>
                          </div>
                        )}
                        {course.level && (
                          <div>{getLevelBadge(course.level)}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "10px", paddingTop: "15px", borderTop: "1px solid #F3F4F6" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(course);
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
                            openDeleteConfirm(course);
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
            {filteredCourses.length > 0 && (
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Trang {currentPage} / {totalPages}
                  </span>
                </div>

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
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#05386D", fontSize: "24px", fontWeight: 700 }}>
                  {modalMode === "create" ? "Thêm khóa học mới" : "Chỉnh sửa khóa học"}
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
                {/* Course Name */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Tên khóa học {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên khóa học"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Course Code */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Mã khóa học {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="VD: JAVA101"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Mô tả
                  </label>
                  <textarea
                    placeholder="Mô tả về khóa học..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  {/* Duration */}
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                      Thời lượng (tuần) {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 12"
                      value={formData.duration}
                      onChange={(e) => handleNumberInput(e, "duration")}
                      min="0"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                    {formData.duration && (
                      <p style={{ marginTop: "6px", fontSize: "12px", color: "#6B7280" }}>
                        Số buổi học tối thiểu: {parseInt(formData.duration, 10) * 2}, tối đa: {parseInt(formData.duration, 10) * 7}
                      </p>
                    )}
                  </div>

                  {/* Duration In Sessions */}
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                      Số buổi học <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 24"
                      value={formData.durationInSessions}
                      onChange={(e) => handleNumberInput(e, "durationInSessions")}
                      min="0"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                    {formData.duration && formData.durationInSessions && (() => {
                      const duration = parseInt(formData.duration, 10);
                      const sessions = parseInt(formData.durationInSessions, 10);
                      const minSessions = duration * 2;
                      const maxSessions = duration * 7;
                      const isValid = sessions >= minSessions && sessions <= maxSessions;
                      return (
                        <p style={{
                          marginTop: "6px",
                          fontSize: "12px",
                          color: isValid ? "#10B981" : "#DC2626",
                          fontWeight: isValid ? 400 : 600
                        }}>
                          {isValid ? "✓ Hợp lệ" : `✗ Phải từ ${minSessions} đến ${maxSessions}`}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Cấp độ {modalMode === "create" && <span style={{ color: "#DC2626" }}>*</span>}
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
                    <option value="BEGINNER">Cơ bản</option>
                    <option value="INTERMEDIATE">Trung cấp</option>
                    <option value="ADVANCED">Nâng cao</option>
                  </select>
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
                  {modalLoading ? "Đang lưu..." : modalMode === "create" ? "Tạo khóa học" : "Cập nhật"}
                </button>
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
                Bạn có chắc chắn muốn xóa khóa học <strong>{courseToDelete?.courseName}</strong>?
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
    </AdminLayout>
  );
}
