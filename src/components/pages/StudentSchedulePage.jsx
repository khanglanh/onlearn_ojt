import { useState, useEffect } from "react";
import StudentLayoutCopy from "../layout/StudentLayoutCopy";
import {
  getMyProfile,
  getMyEnrollments,
  getClass,
  getCourse,
  getTeacher,
} from "../../api/academic";
import {
  FaBookOpen,
  FaUserTie,
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaHashtag,
} from "react-icons/fa";

import "./StudentSchedulePage.css";

export default function StudentSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Lấy profile student
      const profileRes = await getMyProfile();
      if (!profileRes.success || profileRes.data.type !== "STUDENT") {
        throw new Error("Student profile not found");
      }
      setProfile(profileRes.data);

      // 2. Lấy enrollments
      const enrollRes = await getMyEnrollments();

      let raw = [];
      if (Array.isArray(enrollRes)) raw = enrollRes;
      else if (Array.isArray(enrollRes.data)) raw = enrollRes.data;
      else if (Array.isArray(enrollRes.data?.enrollments))
        raw = enrollRes.data.enrollments;
      else if (Array.isArray(enrollRes.enrollments))
        raw = enrollRes.enrollments;
      else raw = [];

      // Lọc các enrollment có status hợp lệ cho lịch (tuỳ bạn chỉnh)
      const usableEnrollments = raw.filter((e) =>
        ["ENROLLED", "ACTIVE", "PENDING", "PRE_ENROLLED"].includes(e.status)
      );

      // 3. Join class + course + teacher với cache đơn giản
      const classCache = {};
      const courseCache = {};
      const teacherCache = {};

      const joined = await Promise.all(
        usableEnrollments.map(async (en) => {
          // CLASS
          let classInfo = classCache[en.classId];
          if (!classInfo) {
            try {
              const res = await getClass(en.classId);
              classInfo = res.data || res || {};
            } catch {
              classInfo = {};
            }
            classCache[en.classId] = classInfo;
          }

          // COURSE
          let courseInfo = {};
          const courseId = classInfo.courseId || en.courseId;
          if (courseId) {
            courseInfo = courseCache[courseId];
            if (!courseInfo) {
              try {
                const res = await getCourse(courseId);
                courseInfo = res.data || res || {};
              } catch {
                courseInfo = {};
              }
              courseCache[courseId] = courseInfo;
            }
          }

          // TEACHER
          let teacherInfo = {};
          const teacherId = classInfo.teacherId;
          if (teacherId) {
            teacherInfo = teacherCache[teacherId];
            if (!teacherInfo) {
              try {
                const res = await getTeacher(teacherId);
                teacherInfo = res.data || res || {};
              } catch {
                teacherInfo = {};
              }
              teacherCache[teacherId] = teacherInfo;
            }
          }

          return {
            enrollmentId: en.enrollmentId,
            status: en.status,

            classId: en.classId,
            className: classInfo.className || en.className || "Lớp chưa có tên",
            classCode: classInfo.classCode || "",

            room: classInfo.room || "Chưa có phòng",
            schedule: classInfo.schedule || "",
            startTime: classInfo.startTime || "",
            startDate: classInfo.startDate || null,
            endDate: classInfo.endDate || null,

            courseId: courseId || null,
            courseName:
              courseInfo.courseName || en.courseName || "Khóa học chưa đặt tên",
            courseCode: courseInfo.courseCode || "",

            teacherId: teacherId || null,
            teacherName:
              teacherInfo.fullName ||
              teacherInfo.name ||
              "Giáo viên chưa cập nhật",
          };
        })
      );

      setClasses(joined);
    } catch (err) {
      console.error("Failed to load schedule:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PARSE SCHEDULE -> THỨ TRONG TUẦN
  // =========================
  const parseScheduleDays = (schedule) => {
    if (!schedule) return [];
    const dayMap = {
      t2: "Mon",
      mon: "Mon",
      monday: "Mon",
      t3: "Tue",
      tue: "Tue",
      tuesday: "Tue",
      t4: "Wed",
      wed: "Wed",
      wednesday: "Wed",
      t5: "Thu",
      thu: "Thu",
      thursday: "Thu",
      t6: "Fri",
      fri: "Fri",
      friday: "Fri",
      t7: "Sat",
      sat: "Sat",
      saturday: "Sat",
      cn: "Sun",
      sun: "Sun",
      sunday: "Sun",
    };

    const lower = schedule.toLowerCase();
    const found = [];

    const tokens = lower
      .split(/[,\-\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    tokens.forEach((token) => {
      if (dayMap[token]) {
        const day = dayMap[token];
        if (!found.includes(day)) found.push(day);
      }
    });

    if (found.length === 0) {
      for (const [key, val] of Object.entries(dayMap)) {
        if (lower.includes(key) && !found.includes(val)) {
          found.push(val);
        }
      }
    }

    return found;
  };

  // Lấy giờ học từ startTime: "08:00-10:00"
  const getTimeRangeFromSchedule = (startTime) => {
    if (!startTime) return "Chưa có";
    const match = startTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return "Chưa có";
    return `${match[1]}:${match[2]} - ${match[3]}:${match[4]}`;
  };

  // =========================
  // LỚP THEO NGÀY
  // =========================
  const getClassesForDate = (date) => {
    const dayNameEng = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      date.getDay()
    ];
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return classes.filter((c) => {
      // Chỉ những lớp đang học / đã hoàn thành
      if (!["ACTIVE", "ENROLLED", "COMPLETED"].includes(c.status)) return false;

      const scheduleDays = parseScheduleDays(c.schedule);
      if (!scheduleDays.includes(dayNameEng)) return false;

      if (c.startDate && c.endDate) {
        const sRaw = new Date(c.startDate);
        const eRaw = new Date(c.endDate);
        const s = new Date(sRaw.getFullYear(), sRaw.getMonth(), sRaw.getDate());
        const e = new Date(eRaw.getFullYear(), eRaw.getMonth(), eRaw.getDate());
        if (d < s || d > e) return false;
      }

      return true;
    });
  };

  const hasClasses = (date) => getClassesForDate(date).length > 0;

  // =========================
  // CALENDAR HELPERS
  // =========================
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + direction,
        1
      )
    );
  };

  const calendarDays = generateCalendarDays();
  const selectedDateClasses = getClassesForDate(selectedDate);

  // =========================
  // CHUYEN DOI STATUS HIEN THI
  // =========================
  function statusLabel(status) {
    return (
      {
        PENDING: "CHỜ DUYỆT",
        PRE_ENROLLED: "CHỜ KÍCH HOẠT",
        ENROLLED: "ĐANG HỌC",
        ACTIVE: "ĐANG HỌC",
        DROPPED: "ĐÃ HỦY",
      }[status] || status
    );
  }

  // =========================
  // RENDER STATE
  // =========================
  if (loading) {
    return (
      <StudentLayoutCopy>
        <div className="student-schedule loading-state">
          <div className="spinner"></div>
          <p>Đang tải lịch học...</p>
        </div>
      </StudentLayoutCopy>
    );
  }

  if (error) {
    return (
      <StudentLayoutCopy>
        <div className="student-schedule error-state">
          <div className="error-message">
            <h2>Không thể tải lịch học</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadScheduleData}>
              Thử lại
            </button>
          </div>
        </div>
      </StudentLayoutCopy>
    );
  }

  return (
    <StudentLayoutCopy>
      <div className="student-schedule">
        {/* HEADER */}
        <div className="schedule-header">
          <div>
            <h1>Lịch học của tôi</h1>
            {profile && (
              <p className="profile-sv">
                Sinh viên: <strong>{profile.name}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="schedule-content">
          {/* CALENDAR */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="nav-button" onClick={() => navigateMonth(-1)}>
                ‹
              </button>
              <h2>
                {currentMonth.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button className="nav-button" onClick={() => navigateMonth(1)}>
                ›
              </button>
            </div>

            {/* VIEW CALENDER */}
            <div className="calendar-grid">
              {/* Header thứ */}
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                <div key={d} className="calendar-day-header">
                  {d}
                </div>
              ))}

              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={idx} className="calendar-day empty"></div>;
                }

                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isSelected =
                  date.toDateString() === selectedDate.toDateString();
                const hasClass = hasClasses(date);
                const dayClasses = hasClass ? getClassesForDate(date) : [];

                return (
                  <div
                    key={idx}
                    className={`calendar-day 
                      ${isToday ? "today" : ""} 
                      ${isSelected ? "selected" : ""} 
                      ${hasClass ? "has-class" : ""}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="day-number">{date.getDate()}</div>
                    {hasClass && (
                      <div className="class-indicator">
                        <span className="indicator-dot"></span>
                        <span className="class-count">{dayClasses.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CLASS LIST */}
          <div className="classes-section">
            <h2>
              Lịch học ngày{" "}
              {selectedDate.toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>

            {selectedDateClasses.length === 0 ? (
              <div className="empty-state">
                <p>Không có lớp học vào ngày này</p>
              </div>
            ) : (
              <div className="classes-list-compact">
                {selectedDateClasses.map((item) => {
                  const scheduleDays = parseScheduleDays(item.schedule);

                  return (
                    <div key={item.enrollmentId} className="class-row-card">
                      {/* LEFT SECTION */}
                      <div className="field-group">
                        <h3 className="class-row-title">{item.courseName}</h3>
                        <div className="detail-row">
                          <FaBookOpen />
                          <span className="detail-label">Lớp:</span>
                          <span className="detail-value">{item.className}</span>
                        </div>

                        <div className="detail-row">
                          <FaUserTie />
                          <span className="detail-label">Giáo viên:</span>
                          <span className="detail-value">
                            {item.teacherName}
                          </span>
                        </div>

                        <div className="detail-row">
                          <FaCalendarAlt />
                          <span className="detail-label">Lịch:</span>
                          <span className="detail-value">
                            {scheduleDays.join(", ")}
                          </span>
                        </div>

                        <div className="detail-row">
                          <FaClock />
                          <span className="detail-label">Giờ học:</span>
                          <span className="detail-value">{item.startTime}</span>
                        </div>

                        <div className="detail-row">
                          <FaDoorOpen />
                          <span className="detail-label">Phòng:</span>
                          <span className="detail-value">{item.room}</span>
                        </div>
                        {/* 
                        <div className="detail-row">
                          <FaHashtag />
                          <span className="detail-label">Mã khóa:</span>
                          <span className="detail-value">
                            {item.courseCode || "N/A"}
                          </span>
                        </div> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayoutCopy>
  );
}
