import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import {
  getAllEnrollments,
  unenrollFromClass,
  listCourses,
  listClasses,
} from "../../api/academic";
import { getStudents } from "../../api/studentApi";
import "./EnrollmentsPage.css";

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, PRE_ENROLLED, DROPPED, COMPLETED
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Data for filters
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

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

      if (classesRes.success) {
        setClasses(classesRes.data.classes || []);
      }

      if (coursesRes.success) {
        setCourses(coursesRes.data.courses || []);
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
    const classItem = classes.find((c) => c.classId === classId);
    if (!classItem) return { classCode: classId, courseName: "N/A" };

    const course = courses.find((c) => c.courseId === classItem.courseId);
    return {
      classCode: classItem.classCode || classId,
      courseName: course?.courseName || classItem.courseName || "N/A",
      courseCode: course?.courseCode || "",
      schedule: classItem.schedule,
      room: classItem.room,
    };
  };

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
  // let filteredEnrollments = enrollments.filter((enrollment) => {
  //   const studentName = getStudentName(enrollment.studentId).toLowerCase();
  //   const classInfo = getClassInfo(enrollment.classId);

  //   const matchesSearch =
  //     studentName.includes(searchTerm.toLowerCase()) ||
  //     classInfo.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     classInfo.courseName.toLowerCase().includes(searchTerm.toLowerCase());

  //   const matchesStatus =
  //     statusFilter === "ALL" || enrollment.status === statusFilter;
  //   const matchesStudent =
  //     !selectedStudent || enrollment.studentId === selectedStudent;
  //   const matchesClass = !selectedClass || enrollment.classId === selectedClass;

  //   return matchesSearch && matchesStatus && matchesStudent && matchesClass;
  // });
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
    active: enrollments.filter((e) => e.status === "ACTIVE").length,
    preEnrolled: enrollments.filter((e) => e.status === "PRE_ENROLLED").length,
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
              📋
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
              ✅
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
              ⏳
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.preEnrolled}</div>
              <div className="stat-label">Chờ kích hoạt</div>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#E0E7FF", color: "#6366F1" }}
            >
              {/* 🎓 */}
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
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả học viên</option>
              {students.map((student) => (
                <option key={student.studentId} value={student.studentId}>
                  {student.name}
                </option>
              ))}
            </select>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả lớp học</option>
              {classes.map((classItem) => (
                <option key={classItem.classId} value={classItem.classId}>
                  {classItem.classCode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

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
                            <strong>{classInfo.classCode}</strong>
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
                              <button
                                onClick={() =>
                                  navigate(`/students/${enrollment.studentId}`)
                                }
                                className="btn-view"
                                title="Xem học viên"
                              >
                                👤
                              </button>
                              {enrollment.status !== "DROPPED" && (
                                <button
                                  onClick={() =>
                                    handleUnenroll(enrollment.enrollmentId)
                                  }
                                  className="btn-delete"
                                  title="Hủy đăng ký"
                                >
                                  ✕
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
