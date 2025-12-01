import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import {
  getAllEnrollments,
  unenrollFromClass,
  listCourses,
  listClasses,
} from "../../api/academic";
import { createEnrollmentSchedule } from "../../api/academic"; // ✅ FIX: thêm API tạo enrollment
import { parseApiError } from "../../api/parseApiError";
import { getStudents } from "../../api/studentApi";
import "./EnrollmentsPage.css";
import {
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPlus,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, PRE_ENROLLED, DROPPED, COMPLETED
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Data
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Create Enrollment Modal
  const [openCreate, setOpenCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [enrollForm, setEnrollForm] = useState({
    studentId: "",
    classId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [enrollmentsRes, studentsRes, classesRes, coursesRes] =
        await Promise.all([
          getAllEnrollments(),
          getStudents(),
          listClasses(),
          listCourses(),
        ]);

      if (enrollmentsRes.success) {
        const data = enrollmentsRes.data;
        setEnrollments(Array.isArray(data) ? data : data.enrollments || []);
      }

      if (studentsRes.data?.students) {
        setStudents(studentsRes.data.students);
      }

      // LOAD CLASSES
      if (Array.isArray(classesRes.data)) {
        setClasses(classesRes.data);
      } else {
        setClasses([]);
      }
      // LOAD COURSES
      if (Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data);
      } else {
        setCourses([]);
      }

      // LOAD ENROLLMENTS
      if (Array.isArray(enrollmentsRes.data)) {
        setEnrollments(enrollmentsRes.data);
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đăng ký này?")) return;

    try {
      await unenrollFromClass(enrollmentId);
      alert("Đã hủy đăng ký thành công");
      loadData();
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể hủy đăng ký"));
    }
  };

  // Get student name
  const getStudentName = (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    return student?.name || studentId;
  };

  // Get class info
  const getClassInfo = (classId) => {
    const cls = classes.find((c) => c.classId === classId);
    if (!cls)
      return {
        className: "N/A",
        courseName: "N/A",
        schedule: "—",
        room: "",
        courseCode: "",
      };

    const course = courses.find((c) => c.courseId === cls.courseId);

    return {
      className: cls.className || cls.classCode || "N/A",
      courseName: course?.courseName || "N/A",
      courseCode: course?.courseCode || "",
      schedule: cls.schedule || "—",
      room: cls.room || "",
    };
  };

  // Normalize status
  const normalizeStatus = (status) => {
    if (status === "ENROLLED") return "ACTIVE";
    if (status === "PENDING") return "PRE_ENROLLED";
    return status;
  };

  const normalizedEnrollments = enrollments.map((e) => ({
    ...e,
    status: normalizeStatus(e.status),
  }));

  // Filter enrollments
  let filteredEnrollments = normalizedEnrollments.filter((enrollment) => {
    const studentName = (
      getStudentName(enrollment.studentId) || ""
    ).toLowerCase();
    const classInfo = getClassInfo(enrollment.classId);

    const classCode = (classInfo.classCode || "").toLowerCase();
    const courseName = (classInfo.courseName || "").toLowerCase();

    const matchesSearch =
      studentName.includes(searchTerm.toLowerCase()) ||
      classCode.includes(searchTerm.toLowerCase()) ||
      courseName.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || enrollment.status === statusFilter;

    const matchesStudent =
      !selectedStudent || enrollment.studentId === selectedStudent;

    const matchesClass = !selectedClass || enrollment.classId === selectedClass;

    return matchesSearch && matchesStatus && matchesStudent && matchesClass;
  });

  // Sort by enrolledAt (newest first)
  filteredEnrollments.sort((a, b) => {
    const dateA = new Date(a.enrolledAt);
    const dateB = new Date(b.enrolledAt);
    return dateB - dateA;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEnrollments = filteredEnrollments.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedStudent, selectedClass]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { label: "Đang học", color: "#10B981", bg: "#D1FAE5" },
      PRE_ENROLLED: { label: "Chờ kích hoạt", color: "#F59E0B", bg: "#FEF3C7" },
      DROPPED: { label: "Đã hủy", color: "#EF4444", bg: "#FEE2E2" },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;

    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "12px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {config.label}
      </span>
    );
  };

  // Stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter((e) => normalizeStatus(e.status) === "ACTIVE")
      .length,
    preEnrolled: enrollments.filter(
      (e) => normalizeStatus(e.status) === "PRE_ENROLLED"
    ).length,
    completed: enrollments.filter(
      (e) => normalizeStatus(e.status) === "DROPPED"
    ).length,
  };

  return (
    <StudentLayout>
      <div className="enrollments-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Quản lý Đăng ký học</h1>
            <p className="subtitle">Theo dõi và quản lý đăng ký của học viên</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#E0E7FF", color: "#6366F1" }}
            >
              <FaClipboardList size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng đăng ký</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#D1FAE5", color: "#10B981" }}
            >
              <FaCheckCircle size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Đang học</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#FEF3C7", color: "#F59E0B" }}
            >
              <FaClock size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.preEnrolled}</div>
              <div className="stat-label">Chờ kích hoạt</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}
            >
              <FaTimesCircle size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Đã huỷ</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-row">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm học viên, lớp học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang học</option>
              <option value="PRE_ENROLLED">Chờ kích hoạt</option>
              <option value="DROPPED">Đã hủy</option>
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả lớp học</option>
              {classes.map((classItem) => (
                <option key={classItem.classId} value={classItem.classId}>
                  {classItem.className}
                </option>
              ))}
            </select>
            <button
              className="create-schedule"
              onClick={() => {
                setEnrollForm({ studentId: "", classId: "" });
                setCreateError(null);
                setOpenCreate(true);
              }}
            >
              <FaPlus />
              Tạo Đăng Ký
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* CREATE ENROLLMENT MODAL */}
        {openCreate && (
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
            onClick={() => setOpenCreate(false)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "600px",
                width: "100%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{ fontSize: "22px", fontWeight: 700, color: "#05386D" }}
              >
                Tạo đăng ký học mới
              </h3>

              {createError && (
                <div
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  {createError}
                </div>
              )}

              {/* FORM */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                {/* Học viên */}
                <input
                  type="text"
                  placeholder="Nhập tên học viên hoặc Student ID"
                  value={enrollForm.studentId || ""} // FIX
                  onChange={(e) =>
                    setEnrollForm({ ...enrollForm, studentId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />

                {/* Lớp học */}
                <div>
                  <label style={{ fontWeight: 600 }}>Lớp học *</label>

                  <select
                    value={enrollForm.classId || ""}
                    onChange={(e) => {
                      const classId = e.target.value;
                      const selectedClass = classes.find(
                        (c) => c.classId === classId
                      );

                      setEnrollForm({
                        ...enrollForm,
                        classId,
                        schedule: selectedClass?.schedule || "", // auto fill lịch học
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.classCode} – {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Khóa học */}
                <div>
                  <label style={{ fontWeight: 600 }}>Khóa học *</label>
                  <select
                    value={enrollForm.courseId || ""} // FIX
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, courseId: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Chọn khóa học --</option>
                    {courses.map((c) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lịch học */}
                <div>
                  <label style={{ fontWeight: 600 }}>Lịch học của lớp</label>
                  <input
                    type="text"
                    value={enrollForm.schedule || "—"}
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>

                {/* Trạng thái */}
                <div>
                  <label style={{ fontWeight: 600 }}>Trạng thái</label>
                  <input
                    type="text"
                    value="Chờ kích hoạt"
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>

                {/* Ngày đăng ký */}
                <div>
                  <label style={{ fontWeight: 600 }}>Ngày đăng ký</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString("vi-VN")}
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "25px",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => setOpenCreate(false)}
                  style={{
                    padding: "10px 16px",
                    background: "#E5E7EB",
                    borderRadius: "8px",
                    border: "none",
                  }}
                >
                  Huỷ
                </button>

                <button
                  onClick={async () => {
                    if (!enrollForm.studentId)
                      return setCreateError("Vui lòng chọn học viên");
                    if (!enrollForm.classId)
                      return setCreateError("Vui lòng chọn lớp học");
                    if (!enrollForm.courseId)
                      return setCreateError("Vui lòng chọn khóa học");
                    if (!enrollForm.schedule)
                      return setCreateError("Vui lòng chọn giờ học");

                    const payload = {
                      ...enrollForm,
                      status: "PRE_ENROLLED",
                      enrolledAt: new Date().toISOString(),
                    };

                    setCreateLoading(true);
                    try {
                      await createEnrollmentSchedule(payload);
                      alert("Tạo đăng ký thành công!");
                      setOpenCreate(false);
                      loadData();
                    } catch (err) {
                      setCreateError(
                        parseApiError(err).message || "Không thể tạo đăng ký"
                      );
                    } finally {
                      setCreateLoading(false);
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#05386D",
                    color: "#fff",
                    borderRadius: "8px",
                    border: "none",
                  }}
                >
                  {createLoading ? "Đang tạo..." : "Tạo đăng ký"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Enrollments Table */}
            <div className="table-card">
              <table className="enrollments-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Lớp học</th>
                    <th>Khóa học</th>
                    <th>Lịch học</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEnrollments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#9CA3AF",
                        }}
                      >
                        Không tìm thấy đăng ký nào
                      </td>
                    </tr>
                  ) : (
                    paginatedEnrollments.map((enrollment) => {
                      const classInfo = getClassInfo(enrollment.classId);
                      return (
                        <tr key={enrollment.enrollmentId}>
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {getStudentName(enrollment.studentId)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="student-name">
                                  {getStudentName(enrollment.studentId)}
                                </div>
                                <div className="student-id">
                                  {enrollment.studentId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{classInfo.className}</strong>
                            {classInfo.room && (
                              <div className="class-room">
                                📍 {classInfo.room}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{classInfo.courseName}</div>
                            {classInfo.courseCode && (
                              <div className="course-code">
                                {classInfo.courseCode}
                              </div>
                            )}
                          </td>
                          <td>{classInfo.schedule || "—"}</td>
                          <td>{getStatusBadge(enrollment.status)}</td>
                          <td>
                            {enrollment.enrolledAt
                              ? new Date(
                                  enrollment.enrolledAt
                                ).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {enrollment.status === "PRE_ENROLLED" && (
                                <button
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        "Bạn có chắc muốn kích hoạt đăng ký này?"
                                      )
                                    )
                                      return;

                                    try {
                                      await activateEnrollment(
                                        enrollment.enrollmentId
                                      );
                                      alert("Đã kích hoạt thành công!");
                                      loadData();
                                    } catch (err) {
                                      alert(
                                        "Lỗi: " +
                                          (err.message || "Không thể kích hoạt")
                                      );
                                    }
                                  }}
                                  className="btn-activate"
                                  title="Kích hoạt"
                                  style={{
                                    backgroundColor: "#10B981",
                                    color: "white",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    border: "none",
                                    fontSize: "16px",
                                  }}
                                >
                                  <FaCheck size={14} />
                                </button>
                              )}

                              {enrollment.status !== "DROPPED" && (
                                <button
                                  onClick={() =>
                                    handleUnenroll(enrollment.enrollmentId)
                                  }
                                  className="btn-delete"
                                  title="Hủy đăng ký"
                                  style={{
                                    backgroundColor: "#EF4444",
                                    color: "white",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    border: "none",
                                    fontSize: "16px",
                                  }}
                                >
                                  <FaTimes size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredEnrollments.length > 0 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Trước
                  </button>
                  <span className="pagination-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Tiếp →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
