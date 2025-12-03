import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayoutCopy from "../layout/StudentLayoutCopy";

import {
  getMyEnrollments,
  getClass,
  getCourse,
  getTeacher,
  unenrollFromClass,
} from "../../api/academic";
import {
  FaBookOpen,
  FaTimesCircle,
  FaSchool,
  FaChalkboardTeacher,
  FaSearch,
  FaCheckCircle,
  FaCalendarAlt,
  FaTimes,
  FaBarcode,
  FaAlignLeft,
  FaLayerGroup,
  FaMoneyBillWave,
  FaIdBadge,
  FaDoorOpen,
  FaPlayCircle,
  FaStopCircle,
  FaUserTie,
  FaEnvelope,
  FaGraduationCap,
  FaChevronDown,
} from "react-icons/fa";

import "./StudentClassPage.css";

export default function StudentClassPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [tab, setTab] = useState("current");

  //Thêm state cho modal
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  // ================================
  // CACHE ĐỂ TRÁNH GỌI API NHIỀU
  // ================================
  const classCache = {};
  const courseCache = {};
  const teacherCache = {};

  useEffect(() => {
    loadFullEnrollments();
  }, []);

  // =====================================================
  // 🔥 LOAD ENROLLMENTS + AUTO JOIN CLASS → COURSE → TEACHER
  // =====================================================
  const loadFullEnrollments = async () => {
    try {
      setLoading(true);

      // 1) Lấy danh sách enrollments
      const raw = await normalizeEnrollments();
      console.log("RAW:", raw);

      // 2) Load song song Class – Course – Teacher bằng Promise.all
      const joined = await Promise.all(
        raw.map(async (en) => {
          const classInfo = await getClass(en.classId)
            .then((r) => r.data)
            .catch(() => ({}));

          const courseInfo = classInfo.courseId
            ? await getCourse(classInfo.courseId)
                .then((r) => r.data)
                .catch(() => ({}))
            : {};

          const teacherInfo = classInfo.teacherId
            ? await getTeacher(classInfo.teacherId)
                .then((r) => r.data)
                .catch(() => ({}))
            : {};

          return {
            ...en,
            className: classInfo.className || "Chưa có tên lớp",
            schedule: classInfo.schedule || "Chưa có lịch",
            room: classInfo.room || "Chưa có phòng",
            courseId: courseInfo.courseId || null,
            courseName: courseInfo.courseName || "Khóa học chưa đặt tên",
            teacherName:
              teacherInfo.fullName || teacherInfo.name || "Chưa cập nhật",
          };
        })
      );

      setEnrollments(joined);
    } catch (error) {
      console.error("LOAD FULL JOIN ERROR:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHUẨN HÓA ENROLLMENTS (VÌ BACKEND TRẢ KHÔNG ĐỒNG NHẤT)
  // =====================================================
  const normalizeEnrollments = async () => {
    const res = await getMyEnrollments();

    if (!res) return [];

    if (Array.isArray(res)) return res;

    if (Array.isArray(res.data)) return res.data;

    if (Array.isArray(res.data?.enrollments)) return res.data.enrollments;

    if (Array.isArray(res.enrollments)) return res.enrollments;

    return [];
  };

  // =========================
  // HỦY ĐĂNG KÝ
  // =========================
  const handleUnenroll = async (id, courseName) => {
    if (!window.confirm(`Hủy đăng ký khỏi khóa ${courseName}?`)) return;

    try {
      await unenrollFromClass(id);

      // ❗ KHÔNG XÓA — CHỈ ĐỔI STATUS!
      setEnrollments((prev) =>
        prev.map((e) =>
          e.enrollmentId === id ? { ...e, status: "DROPPED" } : e
        )
      );

      // ➜ TỰ ĐỘNG CHUYỂN QUA TAB ĐÃ HỦY
      setTab("dropped");

      alert("Đã hủy đăng ký!");
    } catch (e) {
      alert("Không thể hủy: " + e.message);
    }
  };

  // =========================
  // MODAL
  // =========================

  const openClassDetail = async (classId) => {
    try {
      const cls = (await getClass(classId)).data;
      const course = (await getCourse(cls.courseId)).data;
      const teacher = cls.teacherId
        ? (await getTeacher(cls.teacherId)).data
        : null;

      setDetailData({
        class: cls,
        course,
        teacher,
      });

      setOpenDetail(true);
    } catch (error) {
      alert("Không thể tải chi tiết lớp học");
    }
  };

  // =========================
  // FILTER
  // =========================
  // LỌC ENROLLMENTS THEO TAB
  const search = searchTerm.trim().toLowerCase();

  const tabFiltered = enrollments.filter((e) => {
    if (tab === "current") {
      return ["ENROLLED", "ACTIVE", "COMPLETED"].includes(e.status);
    }
    if (tab === "dropped") {
      return e.status === "DROPPED";
    }
    return true;
  });

  // Sau đó filter theo search / course / status
  const filteredEnrollments = tabFiltered.filter((e) => {
    const haystack = [
      e.courseName || "",
      e.className || "",
      e.room || "",
      e.teacherName || "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesCourse = !filterCourseId || e.courseId === filterCourseId;
    const matchesStatus = !statusFilter || e.status === statusFilter;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  // =========================
  // STATS
  // =========================
  const stats = {
    total: enrollments.length,
    active: enrollments.filter((c) => c.status === "ACTIVE").length,
    enrolledStatus: enrollments.filter((c) => c.status === "ENROLLED").length,
    studying: enrollments.filter((c) =>
      ["ACTIVE", "ENROLLED"].includes(c.status)
    ).length,
    // upcoming: enrollments.filter((c) => c.status === "PENDING").length,
    completed: enrollments.filter((c) => c.status === "COMPLETED").length,

    cancel: enrollments.filter((c) => c.status === "DROPPED").length,
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <StudentLayoutCopy>
        <div className="student-courses-page loading-state">
          <div className="spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      </StudentLayoutCopy>
    );
  }

  // =========================
  // ❌ ERROR
  // =========================
  if (error) {
    return (
      <StudentLayoutCopy>
        <div className="student-class-page error-state">
          <div className="error-message">
            <h2>Không thể tải khóa học</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadFullEnrollments}>
              Thử lại
            </button>
          </div>
        </div>
      </StudentLayoutCopy>
    );
  }

  function statusLabel(status) {
    return (
      {
        PENDING: "CHỜ DUYỆT",
        PRE_ENROLLED: "CHỜ KÍCH HOẠT",
        ENROLLED: "ĐANG HỌC",
        ACTIVE: "ĐANG HỌC",
        DROPPED: "ĐÃ HỦY",
        COMPLETED: "ĐÃ HOÀN THÀNH",
      }[status] || status
    );
  }

  // =====================================
  // UI CHÍNH — DẠNG Ô VUÔNG + FILTER
  // =====================================
  return (
    <StudentLayoutCopy>
      <div className="student-class-page">
        <div className="page-header-class">
          <div>
            <h1>Khóa học của tôi</h1>
            <p className="subtitle">Xem các lớp học bạn đã đăng ký</p>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#E0E7FF", color: "#6366F1" }}
            >
              <FaSchool size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng lớp học</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#ebf3ffff", color: "#d3198cff" }}
            >
              <FaCalendarAlt size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.studying}</div>

              <div className="stat-label">Đang học</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#ebf3ffff", color: "#10b926ff" }}
            >
              <FaCheckCircle size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Đã hoàn thành</div>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "#F3F4F6", color: "#df1818ff" }}
            >
              <FaTimesCircle size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.cancel}</div>
              <div className="stat-label">Đã hủy</div>
            </div>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="filters-card">
          <div className="filters-row">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên lớp, khóa học, giáo viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="select-wrapper">
              <select
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
                className="custom-select"
              >
                <option value="">Tất cả khóa học</option>
                {Array.from(
                  new Map(
                    enrollments.map((e) => [e.courseId, e.courseName])
                  ).entries()
                ).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name || id}
                  </option>
                ))}
              </select>
              <FaChevronDown className="select-icon" />
            </div>

            <div className="select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="custom-select"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ENROLLED">Đang học</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="DROPPED">Đã hủy</option>
              </select>
              <FaChevronDown className="select-icon" />
            </div>
          </div>
        </div>
        {/* TABS */}
        <div className="class-tabs">
          <div
            className={`tab-item ${tab === "current" ? "active" : ""}`}
            onClick={() => setTab("current")}
          >
            Hiện tại
          </div>

          <div
            className={`tab-item ${tab === "dropped" ? "active" : ""}`}
            onClick={() => setTab("dropped")}
          >
            Đã hủy
          </div>
        </div>

        {/* -------------------------------- LIST -------------------------------- */}
        <div className="enrollments-grid">
          {filteredEnrollments.map((e) => (
            <div key={e.enrollmentId} className="class-carddetail">
              <div className="class-carddetail-header">
                <h3 className="course-title">{e.courseName}</h3>
                <p className="class-code">{e.className}</p>
              </div>

              <div className="class-carddetailcarddetail-body">
                <p className="info-line">
                  <FaSchool className="info-icon" /> Phòng: {e.room}
                </p>
                <p className="info-line">
                  <FaChalkboardTeacher className="info-icon" /> Giáo viên:{" "}
                  {e.teacherName}
                </p>
                <p className="info-line">
                  <FaCalendarAlt className="info-icon" /> {e.schedule}
                </p>
                <div className="status-wrapper">
                  <span
                    className={`status-badge status-${e.status.toLowerCase()}`}
                  >
                    {statusLabel(e.status)}
                  </span>
                </div>
              </div>

              <div className="class-carddetail-actions">
                <button
                  className="btn-edit"
                  onClick={() => openClassDetail(e.classId)}
                >
                  Xem chi tiết
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleUnenroll(e.enrollmentId, e.courseName)}
                >
                  Hủy đăng ký
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORM POPUP CHI TIET*/}
      {openDetail && detailData && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button
              className="modal-close-btn"
              onClick={() => setOpenDetail(false)}
            >
              <FaTimes size={18} />
            </button>

            <h2 className="modal-title">Chi tiết lớp học</h2>

            <div className="modal-grid">
              {/* COURSE */}
              <div className="modal-section">
                <div className="modal-section-header">
                  <FaBookOpen className="section-icon" />
                  <h3>Khóa học</h3>
                </div>

                <p className="info-row">
                  <FaBookOpen /> <strong>Tên khóa:</strong>{" "}
                  {detailData.course.courseName}
                </p>
                <p className="info-row">
                  <FaAlignLeft /> <strong>Mô tả:</strong>{" "}
                  {detailData.course.description}
                </p>
                <p className="info-row">
                  <FaLayerGroup /> <strong>Level:</strong>{" "}
                  {detailData.course.level}
                </p>
                <p className="info-row">
                  <FaMoneyBillWave /> <strong>Giá:</strong>{" "}
                  {detailData.course.price} đ
                </p>
              </div>

              {/* CLASS */}
              <div className="modal-section">
                <div className="modal-section-header">
                  <FaSchool className="section-icon" />
                  <h3>Lớp học</h3>
                </div>

                <p className="info-row">
                  <FaSchool /> <strong>Tên lớp:</strong>{" "}
                  {detailData.class.className}
                </p>
                <p className="info-row">
                  <FaDoorOpen /> <strong>Phòng:</strong> {detailData.class.room}
                </p>
                <p className="info-row">
                  <FaCalendarAlt /> <strong>Lịch:</strong>{" "}
                  {detailData.class.schedule}
                </p>
                <p className="info-row">
                  <FaPlayCircle /> <strong>Bắt đầu:</strong>{" "}
                  {detailData.class.startDate}
                </p>
                <p className="info-row">
                  <FaStopCircle /> <strong>Kết thúc:</strong>{" "}
                  {detailData.class.endDate}
                </p>
              </div>

              {/* TEACHER */}
              <div className="modal-section">
                <div className="modal-section-header">
                  <FaChalkboardTeacher className="section-icon" />
                  <h3>Giáo viên</h3>
                </div>

                {detailData.teacher ? (
                  <>
                    <p className="info-row">
                      <FaUserTie /> <strong>Tên:</strong>{" "}
                      {detailData.teacher.name}
                    </p>
                    <p className="info-row">
                      <FaEnvelope /> <strong>Email:</strong>{" "}
                      {detailData.teacher.email}
                    </p>
                    <p className="info-row">
                      <FaGraduationCap /> <strong>Chuyên môn:</strong>{" "}
                      {detailData.teacher.specialty ||
                        detailData.teacher.specialization}
                    </p>
                  </>
                ) : (
                  <p>Chưa có giáo viên</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayoutCopy>
  );
}
