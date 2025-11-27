import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import { getStudents } from "../../api/studentApi";
import { adminInvite } from "../../api/identityApi";
import { parseApiError } from "../../api/parseApiError";
import './StudentsPage.css';
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
} from "react-icons/fa";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState(null); // "name", "email", "createdAt"
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [activeFilter, setActiveFilter] = useState(null); // null, true, false
  const [activeFilterOpen, setActiveFilterOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudents();
      // API returns: {data: {students: [], total: 0}, success: true}
      setStudents(response.data?.students || []);
    } catch (err) {
      console.error("Error loading students:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed));
    } finally {
      setLoading(false);
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
      setInviteError(parsed?.message || String(parsed) || "Lỗi khi gửi lời mời");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchTerm) params.name = searchTerm;
      
      const response = await getStudents(params);
      // API returns: {data: {students: [], total: 0}, success: true}
      setStudents(response.data?.students || []);
    } catch (err) {
      console.error("Error searching students:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed));
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, start with asc
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleRowClick = (studentId) => {
    navigate(`/students/${studentId}`);
  };

  // Filter and sort students
  let filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phoneNumber?.includes(searchTerm);
    
    // Active filter
    const matchesActive = activeFilter === null || student.active === activeFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const studentDate = new Date(typeof student.createdAt === "number" ? student.createdAt * 1000 : student.createdAt);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && studentDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && studentDate <= toDate;
      }
    }
    
    return matchesSearch && matchesActive && matchesDateRange;
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
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIdx, startIdx + ITEMS_PER_PAGE);

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

  // Reset to page 1 when filters/sorts change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder, activeFilter, dateFrom, dateTo]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: {
        label: "Đang học",
        icon: <FaCheckCircle />,
        color: "#10B981",
        bg: "#D1FAE5",
      },
      INACTIVE: {
        label: "Ngừng học",
        icon: <FaTimesCircle />,
        color: "#EF4444",
        bg: "#FEE2E2",
      },
      SUSPENDED: {
        label: "Tạm ngừng",
        icon: <FaClock />,
        color: "#F59E0B",
        bg: "#FEF3C7",
      },
      GRADUATED: {
        label: "Đã tốt nghiệp",
        icon: <FaCheckCircle />,
        color: "#6366F1",
        bg: "#E0E7FF",
      },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 12px",
          borderRadius: "12px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.active === true).length,
    inactive: students.filter(s => s.active === false).length,
    recent: students.filter(s => {
      const createdDate = new Date(typeof s.createdAt === 'number' ? s.createdAt * 1000 : s.createdAt);
      const daysSince = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length
  };

  return (
    <StudentLayout>
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
            <div className="stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#6366F1' }}>👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng học viên</div>
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
            <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}>🆕</div>
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
              placeholder="🔍 Tìm kiếm theo tên, email hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <button onClick={openInviteModal} className="btn-primary">
              <FaEnvelope />
              Thêm học viên
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Học viên
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
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Ngày tham gia
                      {sortBy === "createdAt" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                      {sortBy !== "createdAt" && <FaSort style={{ opacity: 0.3 }} />}
                      {(dateFrom || dateTo) && <FaFilter style={{ color: "#10B981" }} />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
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
                      onClick={() => handleRowClick(student.studentId)}
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
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            backgroundColor: student.active ? "#D1FAE5" : "#FEE2E2",
                            color: student.active ? "#10B981" : "#EF4444",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {student.active ? <FaCheckCircle /> : <FaTimesCircle />}
                          {student.active ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td style={{ padding: "15px", color: "#6B7280" }}>
                        {student.createdAt
                          ? new Date(typeof student.createdAt === "number" ? student.createdAt * 1000 : student.createdAt).toLocaleString(
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
                Mời học viên mới
              </h3>
              <p style={{ color: "#6B7280", marginBottom: "20px", lineHeight: "1.5" }}>
                Nhập địa chỉ email của học viên. Họ sẽ nhận được email với liên kết để hoàn tất đăng ký.
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
