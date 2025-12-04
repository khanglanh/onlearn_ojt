import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import { getStudents, createStudent, updateStudent, deleteStudent } from "../../api/studentApi";
import { adminInvite } from "../../api/identityApi";
import { parseApiError } from "../../api/parseApiError";
import { hasRole } from "../../utils/authUtils";
import "./StudentsPage.css";
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
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    studentCode: "",
    major: "",
    cohort: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const isAdmin = hasRole("ADMIN");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudents();
      setStudents(response.data?.students || []);
    } catch (err) {
      console.error("Error loading students:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed));
    } finally {
      setLoading(false);
    }
  };

  // Create/Edit handlers
  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      email: "",
      name: "",
      phoneNumber: "",
      studentCode: "",
      major: "",
      cohort: "",
    });
    setFormError(null);
    setStudentModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      email: student.email || "",
      name: student.name || "",
      phoneNumber: student.phoneNumber || "",
      studentCode: student.studentCode || "",
      major: student.major || "",
      cohort: student.cohort || "",
    });
    setFormError(null);
    setStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    setStudentModalOpen(false);
    setEditingStudent(null);
    setFormData({
      email: "",
      name: "",
      phoneNumber: "",
      studentCode: "",
      major: "",
      cohort: "",
    });
    setFormError(null);
  };

  const handleSubmitStudent = async () => {
    if (!formData.email || !formData.name) {
      setFormError("Email và tên là bắt buộc");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingStudent) {
        // Update
        await updateStudent(editingStudent.studentId, formData);
      } else {
        // Create
        await createStudent(formData);
      }

      closeStudentModal();
      loadStudents();
    } catch (err) {
      const parsed = parseApiError(err);
      setFormError(parsed?.message || String(parsed) || "Lỗi khi lưu học viên");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete handlers
  const openDeleteConfirm = (student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setStudentToDelete(null);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteStudent(studentToDelete.studentId);
      closeDeleteConfirm();
      loadStudents();
    } catch (err) {
      const parsed = parseApiError(err);
      alert(parsed?.message || String(parsed) || "Lỗi khi xóa học viên");
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
      await adminInvite(inviteEmail, "STUDENT");
      setInviteSuccess("Đã gửi lời mời thành công!");
      setTimeout(() => {
        closeInviteModal();
        loadStudents();
      }, 1500);
    } catch (err) {
      const parsed = parseApiError(err);
      setInviteError(
        parsed?.message || String(parsed) || "Lỗi khi gửi lời mời"
      );
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

  const handleRowClick = (studentId, e) => {
    // Don't navigate if clicking on action buttons
    if (e?.target?.closest(".action-buttons")) {
      return;
    }
    navigate(`/students/${studentId}`);
  };

  // Filter and sort students
  let filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phoneNumber?.includes(searchTerm) ||
      student.studentCode?.includes(searchTerm) ||
      student.major?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive =
      activeFilter === null || student.active === activeFilter;

    return matchesSearch && matchesActive;
  });

  // Apply sorting
  if (sortBy) {
    filteredStudents.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === "name") {
        aVal = a.name?.toLowerCase() || "";
        bVal = b.name?.toLowerCase() || "";
      } else if (sortBy === "email") {
        aVal = a.email?.toLowerCase() || "";
        bVal = b.email?.toLowerCase() || "";
      } else if (sortBy === "createdAt") {
        aVal = new Date(
          typeof a.createdAt === "number" ? a.createdAt * 1000 : a.createdAt
        );
        bVal = new Date(
          typeof b.createdAt === "number" ? b.createdAt * 1000 : b.createdAt
        );
      }

      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

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
    total: students.length,
    active: students.filter((s) => s.active === true).length,
    inactive: students.filter((s) => s.active === false).length,
    recent: students.filter((s) => {
      const createdDate = new Date(
        typeof s.createdAt === "number" ? s.createdAt * 1000 : s.createdAt
      );
      const daysSince = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length,
  };

  return (
    <AdminLayout>
      <div className="students-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Danh sách học viên</h1>
            <p className="subtitle">Quản lý thông tin học viên</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#E0E7FF", color: "#6366F1" }}
            >
              👥
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng học viên</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#D1FAE5", color: "#10B981" }}
            >
              ✅
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Hoạt động</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}
            >
              ❌
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.inactive}</div>
              <div className="stat-label">Không hoạt động</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#FEF3C7", color: "#F59E0B" }}
            >
              🆕
            </div>
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
              placeholder="🔍 Tìm kiếm theo tên, email, SĐT, mã SV hoặc chuyên ngành..."
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
                Mời học viên
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

        {/* Students Table */}
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Học viên
                      {sortBy === "name" &&
                        (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Email
                      {sortBy === "email" &&
                        (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                      {sortBy !== "email" && (
                        <FaSort style={{ opacity: 0.3 }} />
                      )}
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
                    Mã SV / Chuyên ngành
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
                      <FaFilter
                        style={{ opacity: activeFilter !== null ? 1 : 0.3 }}
                      />
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
                            backgroundColor:
                              activeFilter === null ? "#F3F4F6" : "transparent",
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
                            backgroundColor:
                              activeFilter === true ? "#F3F4F6" : "transparent",
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
                            backgroundColor:
                              activeFilter === false
                                ? "#F3F4F6"
                                : "transparent",
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Ngày tham gia
                      {sortBy === "createdAt" &&
                        (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                      {sortBy !== "createdAt" && (
                        <FaSort style={{ opacity: 0.3 }} />
                      )}
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
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? "7" : "6"}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#9CA3AF",
                      }}
                    >
                      <FaUser
                        style={{ fontSize: "48px", marginBottom: "10px" }}
                      />
                      <p>Không tìm thấy học viên nào</p>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr
                      key={student.studentId}
                      onClick={(e) => handleRowClick(student.studentId, e)}
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "#E0E7FF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#6366F1",
                              fontWeight: 600,
                            }}
                          >
                            {student.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: "13px", color: "#6B7280" }}>
                              ID: {student.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "15px", color: "#374151" }}>
                        {student.email || "—"}
                      </td>
                      <td style={{ padding: "15px", color: "#374151" }}>
                        {student.phoneNumber || "—"}
                      </td>
                      <td style={{ padding: "15px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {student.studentCode && (
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
                              {student.studentCode}
                            </span>
                          )}
                          {student.major && (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                backgroundColor: "#FEF3C7",
                                color: "#F59E0B",
                                fontSize: "13px",
                                fontWeight: 500,
                              }}
                            >
                              {student.major}
                            </span>
                          )}
                          {!student.studentCode && !student.major && "—"}
                        </div>
                      </td>
                      <td style={{ padding: "15px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            backgroundColor: student.active
                              ? "#D1FAE5"
                              : "#FEE2E2",
                            color: student.active ? "#10B981" : "#EF4444",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {student.active ? (
                            <FaCheckCircle />
                          ) : (
                            <FaTimesCircle />
                          )}
                          {student.active ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td style={{ padding: "15px", color: "#6B7280" }}>
                        {student.createdAt
                          ? new Date(
                              typeof student.createdAt === "number"
                                ? student.createdAt * 1000
                                : student.createdAt
                            ).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "15px" }}>
                          <div
                            className="action-buttons"
                            style={{ display: "flex", gap: "8px" }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(student);
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
                                openDeleteConfirm(student);
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
            {filteredStudents.length > 0 && (
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

                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "10px 16px",
                    backgroundColor:
                      currentPage === totalPages ? "#E5E7EB" : "#05386D",
                    color: currentPage === totalPages ? "#9CA3AF" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
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

        {/* Create/Edit Student Modal */}
        {studentModalOpen && (
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
            onClick={closeStudentModal}
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
              <h3
                style={{
                  marginBottom: "20px",
                  color: "#05386D",
                  fontSize: "24px",
                }}
              >
                {editingStudent ? "Chỉnh sửa học viên" : "Tạo học viên mới"}
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Email <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!!editingStudent}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: editingStudent ? "#F3F4F6" : "#fff",
                    }}
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Tên <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
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
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Mã sinh viên
                  </label>
                  <input
                    type="text"
                    value={formData.studentCode}
                    onChange={(e) =>
                      setFormData({ ...formData, studentCode: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="SE123456"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Chuyên ngành
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) =>
                      setFormData({ ...formData, major: e.target.value })
                    }
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
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Khóa học
                  </label>
                  <input
                    type="text"
                    value={formData.cohort}
                    onChange={(e) =>
                      setFormData({ ...formData, cohort: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="K15, K16, 2024"
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

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={closeStudentModal}
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
                  onClick={handleSubmitStudent}
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
                  {formLoading
                    ? "Đang lưu..."
                    : editingStudent
                    ? "Cập nhật"
                    : "Tạo mới"}
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
              <h3
                style={{
                  marginBottom: "20px",
                  color: "#DC2626",
                  fontSize: "24px",
                }}
              >
                Xác nhận xóa
              </h3>
              <p
                style={{
                  color: "#6B7280",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                Bạn có chắc chắn muốn xóa học viên{" "}
                <strong>{studentToDelete?.name}</strong>? Hành động này không
                thể hoàn tác.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
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
                  onClick={handleDeleteStudent}
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
              <h3
                style={{
                  marginBottom: "20px",
                  color: "#05386D",
                  fontSize: "24px",
                }}
              >
                Mời học viên mới
              </h3>
              <p
                style={{
                  color: "#6B7280",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                Nhập địa chỉ email của học viên. Họ sẽ nhận được email với liên
                kết để hoàn tất đăng ký.
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
                  Email học viên
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
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

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
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
    </AdminLayout>
  );
}
