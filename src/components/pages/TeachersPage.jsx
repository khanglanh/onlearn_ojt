import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import { adminInvite } from "../../api/identityApi";
import { academicApi } from "../../api/academic";
import { parseApiError } from "../../api/parseApiError";
import { hasRole } from "../../utils/authUtils";
import './TeachersPage.css';
import {
  FaSearch,
  FaFilter,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEnvelope,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChalkboardTeacher,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeFilterOpen, setActiveFilterOpen] = useState(false);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");

  // Create/Edit modal state
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    teacherCode: "",
    specialization: "",
    department: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const isAdmin = hasRole("ADMIN");

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[TeachersPage] Attempting to load teachers...');
      const response = await academicApi.listTeachers();
      console.log('[TeachersPage] Response received:', response);
      
      if (response.success && response.data) {
        const teachersData = Array.isArray(response.data) ? response.data : 
                            response.data.teachers || [];
        console.log('[TeachersPage] Teachers data:', teachersData);
        setTeachers(teachersData);
      } else {
        throw new Error('Failed to load teachers');
      }
    } catch (err) {
      console.error("[TeachersPage] Error loading teachers:", err);
      
      let errorMessage = 'Không thể tải danh sách giảng viên';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n' +
                      '1. Đã deploy academic-service chưa?\n' +
                      '2. VITE_ACADEMIC_API_BASE_URL có đúng không?\n' +
                      '3. CORS có được cấu hình đúng không?';
      } else if (err.message.includes('403') || err.message.includes('permission')) {
        errorMessage = 'Bạn không có quyền xem danh sách giảng viên. Chỉ ADMIN, MANAGER, hoặc STAFF mới có quyền này.';
      } else if (err.message.includes('401')) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else {
        const parsed = parseApiError(err);
        errorMessage = parsed?.message || err.message || String(err);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create/Edit handlers
  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormData({
      email: "",
      name: "",
      phoneNumber: "",
      teacherCode: "",
      specialization: "",
      department: "",
    });
    setFormError(null);
    setTeacherModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      email: teacher.email || "",
      name: teacher.name || "",
      phoneNumber: teacher.phoneNumber || "",
      teacherCode: teacher.teacherCode || "",
      specialization: teacher.specialization || "",
      department: teacher.department || "",
    });
    setFormError(null);
    setTeacherModalOpen(true);
  };

  const closeTeacherModal = () => {
    setTeacherModalOpen(false);
    setEditingTeacher(null);
    setFormData({
      email: "",
      name: "",
      phoneNumber: "",
      teacherCode: "",
      specialization: "",
      department: "",
    });
    setFormError(null);
  };

  const handleSubmitTeacher = async () => {
    if (!formData.email || !formData.name) {
      setFormError("Email và tên là bắt buộc");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingTeacher) {
        // Update
        await academicApi.updateTeacher(editingTeacher.teacherId, formData);
      } else {
        // Create
        await academicApi.createTeacher(formData);
      }
      
      closeTeacherModal();
      loadTeachers();
    } catch (err) {
      const parsed = parseApiError(err);
      setFormError(parsed?.message || String(parsed) || "Lỗi khi lưu giảng viên");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete handlers
  const openDeleteConfirm = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setTeacherToDelete(null);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    setDeleteLoading(true);
    try {
      await academicApi.deleteTeacher(teacherToDelete.teacherId);
      closeDeleteConfirm();
      loadTeachers();
    } catch (err) {
      const parsed = parseApiError(err);
      alert(parsed?.message || String(parsed) || "Lỗi khi xóa giảng viên");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Invite handlers
  const openInviteModal = () => {
    setInviteError(null);
    setInviteSuccess(null);
    setInviteEmail("");
    setInviteOpen(true);
  };

  const closeInviteModal = () => {
    setInviteOpen(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Vui lòng nhập email hợp lệ");
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    try {
      await adminInvite(inviteEmail, "TEACHER");
      setInviteSuccess("Đã gửi lời mời thành công!");
      setTimeout(() => {
        closeInviteModal();
        loadTeachers();
      }, 1500);
    } catch (err) {
      const parsed = parseApiError(err);
      setInviteError(parsed?.message || String(parsed) || "Lỗi khi gửi lời mời");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleRowClick = (teacherId, e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/teachers/${teacherId}`);
  };

  // Filter and sort teachers
  let filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = 
      teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phoneNumber?.includes(searchTerm) ||
      teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = activeFilter === null || teacher.active === activeFilter;
    
    return matchesSearch && matchesActive;
  });

  // Apply sorting
  if (sortBy) {
    filteredTeachers.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === "name") {
        aVal = a.name?.toLowerCase() || "";
        bVal = b.name?.toLowerCase() || "";
      } else if (sortBy === "email") {
        aVal = a.email?.toLowerCase() || "";
        bVal = b.email?.toLowerCase() || "";
      } else if (sortBy === "createdAt") {
        aVal = new Date(typeof a.createdAt === "number" ? a.createdAt * 1000 : a.createdAt);
        bVal = new Date(typeof b.createdAt === "number" ? b.createdAt * 1000 : b.createdAt);
      }
      
      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTeachers = filteredTeachers.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, activeFilter]);

  // Calculate stats
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.active === true).length,
    inactive: teachers.filter(t => t.active === false).length,
    recent: teachers.filter(t => {
      const createdDate = new Date(typeof t.createdAt === 'number' ? t.createdAt * 1000 : t.createdAt);
      const daysSince = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length
  };

  return (
    <StudentLayout>
      <div className="teachers-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Danh sách giảng viên</h1>
            <p className="subtitle">Quản lý thông tin giảng viên</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}>👨‍🏫</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng giảng viên</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Hoạt động</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>❌</div>
            <div className="stat-content">
              <div className="stat-value">{stats.inactive}</div>
              <div className="stat-label">Không hoạt động</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#6366F1' }}>🆕</div>
            <div className="stat-content">
              <div className="stat-value">{stats.recent}</div>
              <div className="stat-label">Mới (7 ngày)</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-row">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên, email, SĐT hoặc chuyên môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <div style={{ display: "flex", gap: "10px" }}>
              {isAdmin && (
                <button onClick={openCreateModal} className="btn-primary">
                  <FaPlus />
                  Tạo mới
                </button>
              )}
              <button onClick={openInviteModal} className="btn-primary">
                <FaEnvelope />
                Mời giảng viên
              </button>
            </div>
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

        {/* Teachers Table */}
        {!loading && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  <th
                    onClick={() => handleSort("name")}
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Giảng viên
                      {sortBy === "name" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                      {sortBy !== "name" && <FaSort style={{ opacity: 0.3 }} />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Email
                      {sortBy === "email" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                      {sortBy !== "email" && <FaSort style={{ opacity: 0.3 }} />}
                    </div>
                  </th>
                  <th
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Số điện thoại
                  </th>
                  <th
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Chuyên môn
                  </th>
                  <th
                    style={{ position: "relative" }}
                    onClick={() => setActiveFilterOpen(!activeFilterOpen)}
                  >
                    <div
                      style={{
                        padding: "15px",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Trạng thái
                      <FaFilter style={{ opacity: activeFilter !== null ? 1 : 0.3 }} />
                    </div>
                    {activeFilterOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          backgroundColor: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 10,
                          minWidth: "200px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveFilter(null);
                            setActiveFilterOpen(false);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 15px",
                            border: "none",
                            backgroundColor: activeFilter === null ? "#F3F4F6" : "transparent",
                            color: "#374151",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          Tất cả
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(true);
                            setActiveFilterOpen(false);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 15px",
                            border: "none",
                            backgroundColor: activeFilter === true ? "#F3F4F6" : "transparent",
                            color: "#374151",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            borderTop: "1px solid #F3F4F6",
                          }}
                        >
                          Hoạt động (✓)
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(false);
                            setActiveFilterOpen(false);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 15px",
                            border: "none",
                            backgroundColor: activeFilter === false ? "#F3F4F6" : "transparent",
                            color: "#374151",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "13px",
                            borderTop: "1px solid #F3F4F6",
                          }}
                        >
                          Không hoạt động (✗)
                        </button>
                      </div>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Ngày tham gia
                      {sortBy === "createdAt" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                      {sortBy !== "createdAt" && <FaSort style={{ opacity: 0.3 }} />}
                    </div>
                  </th>
                  {isAdmin && (
                    <th
                      style={{
                        padding: "15px",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#6B7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? "7" : "6"}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#9CA3AF",
                      }}
                    >
                      <FaChalkboardTeacher
                        style={{ fontSize: "48px", marginBottom: "10px" }}
                      />
                      <p>Không tìm thấy giảng viên nào</p>
                    </td>
                  </tr>
                ) : (
                  paginatedTeachers.map((teacher) => (
                    <tr
                      key={teacher.teacherId}
                      onClick={(e) => handleRowClick(teacher.teacherId, e)}
                      style={{
                        borderTop: "1px solid #F3F4F6",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#F9FAFB")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={{ padding: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "#FEF3C7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#F59E0B",
                              fontWeight: 600,
                            }}
                          >
                            {teacher.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {teacher.name}
                            </div>
                            <div style={{ fontSize: "13px", color: "#6B7280" }}>
                              ID: {teacher.teacherId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "15px", color: "#374151" }}>
                        {teacher.email || "—"}
                      </td>
                      <td style={{ padding: "15px", color: "#374151" }}>
                        {teacher.phoneNumber || "—"}
                      </td>
                      <td style={{ padding: "15px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            backgroundColor: "#E0E7FF",
                            color: "#6366F1",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {teacher.specialization || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "15px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            backgroundColor: teacher.active ? "#D1FAE5" : "#FEE2E2",
                            color: teacher.active ? "#10B981" : "#EF4444",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {teacher.active ? <FaCheckCircle /> : <FaTimesCircle />}
                          {teacher.active ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td style={{ padding: "15px", color: "#6B7280" }}>
                        {teacher.createdAt
                          ? new Date(typeof teacher.createdAt === "number" ? teacher.createdAt * 1000 : teacher.createdAt).toLocaleString(
                              "vi-VN",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "—"}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "15px" }}>
                          <div className="action-buttons" style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(teacher);
                              }}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#E0E7FF",
                                color: "#6366F1",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              title="Chỉnh sửa"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteConfirm(teacher);
                              }}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#FEE2E2",
                                color: "#EF4444",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              title="Xóa"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredTeachers.length > 0 && (
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
          </div>
        )}

        {/* Create/Edit Teacher Modal */}
        {teacherModalOpen && (
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
            onClick={closeTeacherModal}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "20px", color: "#05386D", fontSize: "24px" }}>
                {editingTeacher ? "Chỉnh sửa giảng viên" : "Tạo giảng viên mới"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Email <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingTeacher}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: editingTeacher ? "#F3F4F6" : "#fff",
                    }}
                    placeholder="teacher@example.com"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Tên <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="+84123456789"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Mã giảng viên
                  </label>
                  <input
                    type="text"
                    value={formData.teacherCode}
                    onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="GV001"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Chuyên môn
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Software Engineering"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                    Khoa
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              {formError && (
                <div
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "8px",
                    marginTop: "20px",
                    fontSize: "14px",
                  }}
                >
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  onClick={closeTeacherModal}
                  disabled={formLoading}
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
                  onClick={handleSubmitTeacher}
                  disabled={formLoading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#05386D",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: formLoading ? "not-allowed" : "pointer",
                    opacity: formLoading ? 0.6 : 1,
                  }}
                >
                  {formLoading ? "Đang lưu..." : editingTeacher ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
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
                maxWidth: "500px",
                width: "90%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "20px", color: "#DC2626", fontSize: "24px" }}>
                Xác nhận xóa
              </h3>
              <p style={{ color: "#6B7280", marginBottom: "20px", lineHeight: "1.5" }}>
                Bạn có chắc chắn muốn xóa giảng viên <strong>{teacherToDelete?.name}</strong>? 
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
                  onClick={handleDeleteTeacher}
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

        {/* Invite Modal */}
        {inviteOpen && (
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
            onClick={closeInviteModal}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "500px",
                width: "90%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "20px", color: "#05386D", fontSize: "24px" }}>
                Mời giảng viên mới
              </h3>
              <p style={{ color: "#6B7280", marginBottom: "20px", lineHeight: "1.5" }}>
                Nhập địa chỉ email của giảng viên. Họ sẽ nhận được email với liên kết để hoàn tất đăng ký.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Email giảng viên
                </label>
                <input
                  type="email"
                  placeholder="teacher@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendInvite()}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              {inviteError && (
                <div
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontSize: "14px",
                  }}
                >
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div
                  style={{
                    backgroundColor: "#D1FAE5",
                    color: "#059669",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontSize: "14px",
                  }}
                >
                  {inviteSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={closeInviteModal}
                  disabled={inviteLoading}
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
                  onClick={handleSendInvite}
                  disabled={inviteLoading}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#05386D",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: inviteLoading ? "not-allowed" : "pointer",
                    opacity: inviteLoading ? 0.6 : 1,
                  }}
                >
                  {inviteLoading ? "Đang gửi..." : "Gửi lời mời"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
