import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyProfile,
  getMyEnrollments,
  getClass,
  getCourse,
} from "../../api/academic";
import {
  FaLayerGroup,
  FaCheckCircle,
  FaGraduationCap,
  FaClock,
  FaCheckDouble,
} from "react-icons/fa";

import StudentLayoutCopy from "../layout/StudentLayoutCopy";
import "./StudentDashboardPage.css";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get student profile
      const profileResponse = await getMyProfile();
      if (!profileResponse.success || profileResponse.data.type !== "STUDENT") {
        throw new Error("Student profile not found");
      }

      setProfile(profileResponse.data);

      // Get enrollments
      const enrollRes = await getMyEnrollments();

      let raw = [];
      if (Array.isArray(enrollRes)) raw = enrollRes;
      else if (Array.isArray(enrollRes.data)) raw = enrollRes.data;
      else if (Array.isArray(enrollRes.data?.enrollments))
        raw = enrollRes.data.enrollments;
      else raw = [];

      // Loại bỏ enrollment đã hủy
      raw = raw.filter((e) => e.status !== "DROPPED");
      // FULL JOIN
      const classCache = {};
      const courseCache = {};
      const joined = [];

      for (const en of raw) {
        let classInfo = classCache[en.classId];

        // FETCH CLASS
        if (!classInfo) {
          try {
            const res = await getClass(en.classId);
            classInfo = res.data || res || {};
          } catch (err) {
            console.warn("Class not found for classId", en.classId);
            classInfo = {
              className: "Lớp không tồn tại",
              schedule: null,
              room: null,
              teacherId: null,
              courseId: null,
            };
          }
          classCache[en.classId] = classInfo;
        }

        // FETCH COURSE
        let courseInfo = courseCache[classInfo?.courseId];
        if (!courseInfo && classInfo?.courseId) {
          try {
            const res = await getCourse(classInfo.courseId);

            if (Array.isArray(res.data)) {
              courseInfo = res.data[0] || {};
            } else {
              courseInfo = res.data || res || {};
            }
          } catch {
            courseInfo = {};
          }
          courseCache[classInfo.courseId] = courseInfo;
        }

        joined.push({
          ...en,
          className: classInfo?.className,
          schedule: classInfo?.schedule,
          room: classInfo?.room,
          startDate: classInfo?.startDate,
          endDate: classInfo?.endDate,

          courseName: courseInfo?.courseName,
          courseCode: courseInfo?.courseCode,
          level: courseInfo?.level,
        });
      }

      console.table(joined);

      setEnrollments(joined);

      // =============================
      // CALCULATE WEEKLY SCHEDULE REAL
      // =============================
      const TEMPLATE = [
        { day: "Mon", hours: 0 },
        { day: "Tue", hours: 0 },
        { day: "Wed", hours: 0 },
        { day: "Thu", hours: 0 },
        { day: "Fri", hours: 0 },
        { day: "Sat", hours: 0 },
        { day: "Sun", hours: 0 },
      ];

      const computedWeek = JSON.parse(JSON.stringify(TEMPLATE));

      joined.forEach((item) => {
        if (!item.schedule) return;
        const parts = item.schedule.split(",");
        parts.forEach((d) => {
          const x = computedWeek.find((w) => w.day === d.trim());
          if (x) x.hours += 2;
        });
      });

      setWeeklySchedule(computedWeek);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function formatDate(value) {
    if (!value) return "—";

    const isSeconds = typeof value === "number" && value < 10_000_000_000;
    const date = isSeconds ? new Date(value * 1000) : new Date(value);

    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  }
  function statusLabel(status) {
    return (
      {
        PENDING: "CHỜ DUYỆT",
        PRE_ENROLLED: "CHỜ KÍCH HOẠT",
        ENROLLED: "ĐANG HỌC",
        ACTIVE: "ĐANG HỌC",
      }[status] || status
    );
  }

  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(
    (e) => e.status === "ACTIVE" || e.status === "ENROLLED"
  ).length;
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "COMPLETED"
  ).length;

  // Calculate study hours (mock data - replace with actual schedule data)
  const today = new Date();
  const todayClasses = enrollments.filter((e) => {
    // Mock: assume active enrollments have classes today
    return e.status === "ACTIVE" || e.status === "ENROLLED";
  });
  const todayHours = todayClasses.length * 2; // Assume 2 hours per class
  const completedHours = Math.floor(todayHours * 0.7); // Mock: 70% completed

  const maxHours = Math.max(...weeklySchedule.map((d) => d.hours), 1);
  // Weekly real schedule
  // ===========================
  // Weekly REAL schedule
  // ===========================

  if (loading) {
    return (
      <StudentLayoutCopy>
        <div className="student-dashboard loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </StudentLayoutCopy>
    );
  }

  if (error) {
    return (
      <StudentLayoutCopy>
        <div className="student-dashboard error-state">
          <div className="error-message">
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </StudentLayoutCopy>
    );
  }

  return (
    <StudentLayoutCopy>
      <div className="student-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Student Dashboard</h1>
            {profile && (
              <p className="welcome-text">
                Xin chào, <strong>{profile.name}</strong>
              </p>
            )}
          </div>
          {profile && (
            <div className="student-info-card">
              <p>
                <strong>Student Code:</strong> {profile.studentCode}
              </p>
              <p>
                <strong>Major:</strong> {profile.major || "N/A"}
              </p>
              <p>
                <strong>Cohort:</strong> {profile.cohort || "N/A"}
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaLayerGroup size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalEnrollments}</div>
              <div className="stat-label">Tổng số lớp đã đăng ký</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">
              <FaCheckCircle size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{activeEnrollments}</div>
              <div className="stat-label">Lớp đang học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon end">
              <FaGraduationCap size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{completedEnrollments}</div>
              <div className="stat-label">Lớp đã hoàn thành</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon time">
              <FaClock size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{todayHours}</div>
              <div className="stat-label">Giờ học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon done">
              <FaCheckDouble size={26} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{completedHours}</div>
              <div className="stat-label">Đã hoàn thành</div>
            </div>
          </div>

          {/* <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">
                {totalEnrollments > 0
                  ? Math.round((completedEnrollments / totalEnrollments) * 100)
                  : 0}
                %
              </div>
              <div className="stat-label">Tỷ lệ hoàn thành</div>
            </div>
          </div> */}
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <h3>Lịch học trong tuần</h3>
            <div className="bar-chart">
              {weeklySchedule.map((data, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-wrapper">
                    <div
                      className="bar"
                      style={{
                        height: `${(data.hours / maxHours) * 100}%`,
                        backgroundColor:
                          data.hours > 0 ? "#3d49b7ff" : "#e2e8f0",
                      }}
                    >
                      <span className="bar-value">{data.hours}h</span>
                    </div>
                  </div>
                  <div className="bar-label">{data.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Thống kê đăng ký</h3>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <svg viewBox="0 0 200 200" className="pie-svg">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="40"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#8da0d8ff"
                    strokeWidth="40"
                    strokeDasharray={`${
                      totalEnrollments > 0
                        ? (activeEnrollments / totalEnrollments) * 502.4
                        : 0
                    } 502.4`}
                    strokeDashoffset="125.6"
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                <div className="pie-center">
                  <div className="pie-value">{activeEnrollments}</div>
                  <div className="pie-label">/{totalEnrollments}</div>
                </div>
              </div>
              <div className="pie-legend">
                <div className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: "#2e3aa2ff" }}
                  ></span>
                  <span>Lớp đang học ({activeEnrollments})</span>
                </div>
                <div className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: "#3182ce" }}
                  ></span>
                  <span>Lớp đã hoàn thành ({completedEnrollments})</span>
                </div>
                <div className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: "#e2e8f0" }}
                  ></span>
                  <span>
                    Khác (
                    {totalEnrollments -
                      activeEnrollments -
                      completedEnrollments}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="recent-section">
          <h2>Lớp học gần đây</h2>
          {enrollments.length === 0 ? (
            <div className="empty-state">
              <p>Bạn chưa đăng ký lớp học nào</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/enrollments")}
              >
                Đăng ký lớp học
              </button>
            </div>
          ) : (
            <div className="enrollments-grid">
              {enrollments.slice(0, 6).map((enrollment) => (
                <div key={enrollment.enrollmentId} className="enrollment-card">
                  <div className="enrollment-header">
                    <h3>
                      {enrollment.className ||
                        enrollment.courseName ||
                        "Unknown Class"}
                    </h3>
                    <span
                      className={`status-badge status-${enrollment.status.toLowerCase()}`}
                    >
                      {statusLabel(enrollment.status)}
                    </span>
                  </div>
                  <div className="enrollment-body">
                    <p>
                      <strong>Khóa học:</strong>{" "}
                      {enrollment.courseName ||
                        enrollment.courseCode ||
                        "No Course Name"}
                    </p>
                    <p>
                      <strong>Trình độ:</strong> {enrollment.level || "N/A"}{" "}
                      {enrollment.level || ""}
                    </p>
                    <p>
                      <strong>Thời gian:</strong>{" "}
                      {formatDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                  <div className="enrollment-footer">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        navigate(`/student/courses/${enrollment.courseId}`)
                      }
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayoutCopy>
  );
}
