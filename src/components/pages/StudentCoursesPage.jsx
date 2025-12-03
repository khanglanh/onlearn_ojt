import { useState, useEffect } from "react";
import {
  listCourses,
  listClasses,
  enrollInClass,
  getClass,
  getTeacher,
} from "../../api/academic";
import { useNavigate } from "react-router-dom";

import StudentLayoutCopy from "../layout/StudentLayoutCopy";

import {
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
  FaKey,
  FaUsers,
} from "react-icons/fa";

import "./StudentCoursesPage.css";

const COURSES_PER_PAGE = 6;
const CLASSES_PER_PAGE = 5;

// Chuẩn hóa dữ liệu nhận về từ backend
function extractList(res, fieldName) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res[fieldName])) return res[fieldName];
  if (Array.isArray(res.data?.[fieldName])) return res.data[fieldName];
  return [];
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [expandedCourse, setExpandedCourse] = useState(null);
  const [coursePage, setCoursePage] = useState(1);
  const [classPage, setClassPage] = useState({});

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollKey, setEnrollKey] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const [classExtras, setClassExtras] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);

    try {
      const [courseRes, classRes] = await Promise.all([
        listCourses(),
        listClasses(),
      ]);

      setCourses(extractList(courseRes, "courses"));
      setClasses(extractList(classRes, "classes"));
    } catch (err) {
      console.error("Load error:", err);
      alert("Không thể tải dữ liệu khóa học/lớp.");
    } finally {
      setLoading(false);
    }
  };

  const classesOfCourse = (courseId) =>
    classes.filter((c) => c.courseId === courseId);

  // Cache thông tin lớp + giáo viên
  const preloadClassExtras = async (courseId) => {
    const courseClasses = classesOfCourse(courseId);

    const needFetch = courseClasses.filter(
      (cls) => !classExtras[cls.classId]?.teacherName
    );

    for (const cls of needFetch) {
      try {
        const clsRes = await getClass(cls.classId);
        const clsDetails = clsRes.data || clsRes;

        let teacherName = "Chưa cập nhật";
        let teacherEmail = "";

        if (clsDetails.teacherId) {
          try {
            const tRes = await getTeacher(clsDetails.teacherId);
            const t = tRes.data || tRes;

            teacherName = t.fullName || t.name || teacherName;
            teacherEmail = t.email || "";
          } catch {}
        }

        setClassExtras((prev) => ({
          ...prev,
          [cls.classId]: { teacherName, teacherEmail },
        }));
      } catch {}
    }
  };

  const toggleCourse = async (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }

    setExpandedCourse(courseId);
    setClassPage((prev) => ({ ...prev, [courseId]: 1 }));

    preloadClassExtras(courseId);
  };

  const getClassPage = (cId) => classPage[cId] || 1;

  const setClassPageFor = (cId, page) => {
    setClassPage((prev) => ({ ...prev, [cId]: page }));
  };

  // SEARCH
  const matchesSearch = (course, courseClasses, term) => {
    if (!term) return true;
    const s = term.toLowerCase();

    const textCourse = `${course.courseName || ""} ${
      course.description || ""
    }`.toLowerCase();

    if (textCourse.includes(s)) return true;

    return courseClasses.some((cls) => {
      const extra = classExtras[cls.classId] || {};
      const t = (
        (cls.className || "") +
        " " +
        (cls.room || "") +
        " " +
        (cls.schedule || "") +
        " " +
        (extra.teacherName || "")
      ).toLowerCase();
      return t.includes(s);
    });
  };

  const filteredCourses = courses.filter((course) =>
    matchesSearch(course, classesOfCourse(course.courseId), searchTerm)
  );

  const totalCoursePages = Math.max(
    1,
    Math.ceil(filteredCourses.length / COURSES_PER_PAGE)
  );

  const currentCoursePage = Math.min(coursePage, totalCoursePages);

  const pagedCourses = filteredCourses.slice(
    (currentCoursePage - 1) * COURSES_PER_PAGE,
    currentCoursePage * COURSES_PER_PAGE
  );

  const openEnrollModal = (course, cls) => {
    setSelectedClass({
      ...cls,
      courseName: course.courseName,
    });
    setEnrollKey("");
  };

  const closeEnrollModal = () => {
    setSelectedClass(null);
    setEnrollKey("");
  };

  const handleEnroll = async () => {
    if (!selectedClass) return;
    if (!enrollKey.trim()) {
      alert("Vui lòng nhập enrollment key");
      return;
    }

    setEnrolling(true);
    try {
      const res = await enrollInClass(selectedClass.classId, enrollKey.trim());

      // Nếu backend có kiểu { success: false, message: '...' }
      if (res && res.success === false) {
        alert(res.message || "Đăng ký thất bại");
      } else {
        alert(res?.message || "Đăng ký thành công!");
        closeEnrollModal();
      }
    } catch (err) {
      console.error("Enroll failed:", err);
      // err.message bây giờ sẽ rõ ràng hơn (vd: "Invalid enroll key", "Already enrolled", ...)
      alert(err.message || "Lỗi khi đăng ký lớp");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <StudentLayoutCopy>
        <div className="scp-loading">
          <div className="scp-spinner" />
          <p>Đang tải...</p>
        </div>
      </StudentLayoutCopy>
    );

  return (
    <StudentLayoutCopy>
      <div className="student-courses-page">
        <div className="scp-header">
          <div>
            <h1 className="scp-title">Khóa học</h1>
            <p className="scp-subtitle">Các khóa học và lớp học</p>
          </div>

          <button
            className="btn-primary my-class-btn"
            onClick={() => navigate("/student/my-classes")}
          >
            Khóa học hiện tại của tôi
          </button>
        </div>

        {/* SEARCH */}
        <div className="scp-toolbar">
          <div className="scp-search">
            <FaSearch className="scp-search-icon" />
            <input
              type="text"
              className="scp-search-input"
              placeholder="Tìm khóa học hoặc lớp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCoursePage(1);
              }}
            />
          </div>
        </div>

        {/* COURSES */}
        <div className="courses-list">
          {pagedCourses.map((course) => {
            const allClasses = classesOfCourse(course.courseId);

            const visibleClasses = allClasses.filter((cls) => {
              const t = searchTerm.toLowerCase();
              if (!t) return true;

              const extra = classExtras[cls.classId] || {};
              const text =
                `${cls.className} ${cls.room} ${cls.schedule} ${extra.teacherName}`.toLowerCase();

              return text.includes(t);
            });

            const totalClassPages = Math.max(
              1,
              Math.ceil(visibleClasses.length / CLASSES_PER_PAGE)
            );

            const pageForCourse = Math.min(
              getClassPage(course.courseId),
              totalClassPages
            );

            const pagedClasses = visibleClasses.slice(
              (pageForCourse - 1) * CLASSES_PER_PAGE,
              pageForCourse * CLASSES_PER_PAGE
            );

            const isExpanded = expandedCourse === course.courseId;

            return (
              <div
                key={course.courseId}
                className={`course-card ${isExpanded ? "expanded" : ""}`}
              >
                <div
                  className="course-header"
                  onClick={() => toggleCourse(course.courseId)}
                >
                  <div className="course-header-left">
                    <div className="course-color-bar" />
                    <div>
                      <h3 className="course-name">{course.courseName}</h3>
                      <p className="course-desc">
                        {course.description || "Không có mô tả"}
                      </p>
                      <div className="course-meta">
                        <span>
                          <FaUsers /> {allClasses.length} lớp
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="course-header-right">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>

                <div className="classes-wrapper">
                  <div
                    className={`classes-list ${
                      isExpanded ? "classes-open" : "classes-closed"
                    }`}
                  >
                    {pagedClasses.map((cls) => {
                      const extra = classExtras[cls.classId] || {};
                      const teacher = extra.teacherName || "Chưa cập nhật";

                      return (
                        <div key={cls.classId} className="class-card">
                          <div className="class-main">
                            <h4 className="class-name">{cls.className}</h4>

                            <div className="class-info-row">
                              <span>
                                <FaDoorOpen /> Phòng: {cls.room || "—"}
                              </span>

                              <span>
                                <FaCalendarAlt /> {cls.schedule || "—"}
                              </span>
                            </div>

                            <div className="class-info-row">
                              <span>
                                <FaChalkboardTeacher /> GV: {teacher}
                              </span>
                            </div>
                          </div>

                          <div className="class-actions">
                            <button
                              className="btn-enroll"
                              onClick={() => openEnrollModal(course, cls)}
                            >
                              <FaKey /> Tham gia
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {visibleClasses.length === 0 && (
                      <p className="scp-empty-text">
                        Không có lớp phù hợp với tìm kiếm
                      </p>
                    )}

                    {visibleClasses.length > CLASSES_PER_PAGE && (
                      <div className="scp-pagination scp-pagination-classes">
                        <button
                          onClick={() =>
                            setClassPageFor(course.courseId, pageForCourse - 1)
                          }
                          disabled={pageForCourse <= 1}
                        >
                          <FaArrowLeft /> Trước
                        </button>

                        <span>
                          Trang {pageForCourse}/{totalClassPages}
                        </span>

                        <button
                          onClick={() =>
                            setClassPageFor(course.courseId, pageForCourse + 1)
                          }
                          disabled={pageForCourse >= totalClassPages}
                        >
                          Sau <FaArrowRight />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COURSE PAGINATION */}
        {totalCoursePages > 1 && (
          <div className="scp-pagination scp-pagination-courses">
            <button
              onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
              disabled={currentCoursePage <= 1}
            >
              <FaArrowLeft /> Trước
            </button>

            <span>
              Trang {currentCoursePage} / {totalCoursePages}
            </span>

            <button
              onClick={() =>
                setCoursePage((p) => Math.min(totalCoursePages, p + 1))
              }
              disabled={currentCoursePage >= totalCoursePages}
            >
              Sau <FaArrowRight />
            </button>
          </div>
        )}

        {/* ENROLL MODAL */}
        {selectedClass && (
          <div className="enroll-modal-overlay" onClick={closeEnrollModal}>
            <div className="enroll-modal" onClick={(e) => e.stopPropagation()}>
              <button className="enroll-modal-close" onClick={closeEnrollModal}>
                ✕
              </button>

              <h2 className="enroll-modal-title">Tham gia lớp học</h2>

              <p className="enroll-modal-course">
                Khóa học: <strong>{selectedClass.courseName}</strong>
              </p>
              <p className="enroll-modal-class">
                Lớp: <strong>{selectedClass.className}</strong>
              </p>

              <label className="enroll-input-label">
                Enrollment key
                <div className="enroll-input-wrapper">
                  <FaKey className="enroll-input-icon" />
                  <input
                    type="text"
                    className="enroll-input"
                    placeholder="Nhập mã do giáo viên cung cấp"
                    value={enrollKey}
                    onChange={(e) => setEnrollKey(e.target.value)}
                  />
                </div>
              </label>

              <div className="enroll-modal-actions">
                <button className="btn-secondary" onClick={closeEnrollModal}>
                  Hủy
                </button>

                <button
                  className="btn-primary"
                  disabled={enrolling}
                  onClick={handleEnroll}
                >
                  {enrolling ? "Đang xử lý..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayoutCopy>
  );
}
