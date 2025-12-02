import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentLayoutCopy from "../layout/StudentLayoutCopy";

import {
  getClass,
  getCourse,
  getTeacher,
  getClassMaterials,
  getSessionsByClassId,
} from "../../api/academic";

import "./StudentClassDetailsPage.css";

export default function StudentClassDetailsPage() {
  const { classId } = useParams();

  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [tab, setTab] = useState("info");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAll();
  }, [classId]);

  // ===========================================================
  // 🔥 LOAD Class → Course → Teacher → Materials → Sessions
  // ===========================================================
  const loadAll = async () => {
    try {
      setLoading(true);

      // 1) Class
      const cRes = await getClass(classId);
      const cls = cRes.data || cRes;
      setClassInfo(cls);

      // 2) Course
      if (cls.courseId) {
        const courseRes = await getCourse(cls.courseId);
        setCourseInfo(courseRes.data || courseRes);
      }

      // 3) Teacher
      if (cls.teacherId) {
        const tRes = await getTeacher(cls.teacherId);
        setTeacherInfo(tRes.data || tRes);
      }

      // 4) Materials
      try {
        const mRes = await getClassMaterials(cls.courseId, classId);
        setMaterials(mRes.data || mRes || []);
      } catch {
        setMaterials([]);
      }

      // 5) Sessions
      try {
        const sessRes = await getSessionsByClassId(classId);
        setSessions(sessRes.data || sessRes || []);
      } catch {
        setSessions([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // LOADING + ERROR
  // ===========================================================
  if (loading) {
    return (
      <StudentLayoutCopy>
        <div className="class-loading">Đang tải dữ liệu lớp...</div>
      </StudentLayoutCopy>
    );
  }

  if (error || !classInfo) {
    return (
      <StudentLayoutCopy>
        <div className="class-error">Lỗi: {error}</div>
      </StudentLayoutCopy>
    );
  }

  // ===========================================================
  // UI TABS
  // ===========================================================
  const renderTab = () => {
    switch (tab) {
      case "info":
        return (
          <InfoTab
            classInfo={classInfo}
            courseInfo={courseInfo}
            teacherInfo={teacherInfo}
          />
        );
      case "sessions":
        return <SessionsTab sessions={sessions} />;
      case "materials":
        return <MaterialsTab materials={materials} />;
      case "teacher":
        return <TeacherTab teacher={teacherInfo} />;
      default:
        return null;
    }
  };

  return (
    <StudentLayoutCopy>
      <div className="class-detail-container">
        {/* Header */}
        <div className="class-header">
          <div>
            <h1>{classInfo.className}</h1>
            <p>{courseInfo?.courseName}</p>
          </div>

          <div className="class-tag">{courseInfo?.courseId}</div>
        </div>

        {/* Tabs */}
        <div className="class-tabs">
          <button
            className={tab === "info" ? "active" : ""}
            onClick={() => setTab("info")}
          >
            ℹ Thông tin lớp
          </button>

          <button
            className={tab === "sessions" ? "active" : ""}
            onClick={() => setTab("sessions")}
          >
            📅 Lịch học
          </button>

          <button
            className={tab === "materials" ? "active" : ""}
            onClick={() => setTab("materials")}
          >
            📚 Tài liệu
          </button>

          <button
            className={tab === "teacher" ? "active" : ""}
            onClick={() => setTab("teacher")}
          >
            👨‍🏫 Giáo viên
          </button>
        </div>

        {/* Tab Content */}
        <div className="class-content">{renderTab()}</div>
      </div>
    </StudentLayoutCopy>
  );
}

/* -----------------------------------------------------
   TAB: THÔNG TIN
------------------------------------------------------ */
function InfoTab({ classInfo, courseInfo, teacherInfo }) {
  return (
    <div className="info-tab">
      <div className="info-card">
        <h2>🏫 Thông tin lớp học</h2>

        <p>
          <strong>Phòng:</strong> {classInfo.room || "Chưa có phòng"}
        </p>
        <p>
          <strong>Lịch học:</strong> {classInfo.schedule || "Chưa có lịch"}
        </p>
      </div>

      <div className="info-card">
        <h2>📘 Thông tin khóa học</h2>
        <p>
          <strong>Mã khóa:</strong> {courseInfo?.courseId}
        </p>
        <p>
          <strong>Tên khóa:</strong> {courseInfo?.courseName}
        </p>
      </div>

      <div className="info-card">
        <h2>👨‍🏫 Giáo viên phụ trách</h2>
        <p>
          <strong>Tên:</strong> {teacherInfo?.fullName || "Chưa cập nhật"}
        </p>
        <p>
          <strong>Email:</strong> {teacherInfo?.email || "Không có email"}
        </p>
      </div>
    </div>
  );
}

/* -----------------------------------------------------
   TAB: LỊCH BUỔI HỌC
------------------------------------------------------ */
function SessionsTab({ sessions }) {
  if (!sessions.length) return <p>Chưa có lịch buổi học.</p>;

  return (
    <div className="sessions-list">
      {sessions.map((s) => (
        <div className="session-item" key={s.sessionId}>
          <h4>📅 {s.title || `Buổi ${s.index}`}</h4>
          <p>
            <strong>Ngày:</strong> {s.date || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Giờ:</strong> {s.time || "Chưa có giờ"}
          </p>
        </div>
      ))}
    </div>
  );
}

/* -----------------------------------------------------
   TAB: TÀI LIỆU
------------------------------------------------------ */
function MaterialsTab({ materials }) {
  if (!materials.length) return <p>Chưa có tài liệu nào.</p>;

  return (
    <div className="materials-list">
      {materials.map((m) => (
        <div className="material-item" key={m.materialId}>
          📄 {m.fileName}
        </div>
      ))}
    </div>
  );
}

/* -----------------------------------------------------
   TAB: GIÁO VIÊN
------------------------------------------------------ */
function TeacherTab({ teacher }) {
  if (!teacher) return <p>Không có thông tin giáo viên.</p>;

  return (
    <div className="teacher-card">
      <h2>{teacher.fullName}</h2>

      <p>
        <strong>Email:</strong> {teacher.email || "Không có email"}
      </p>

      <p>
        <strong>Chuyên môn:</strong> {teacher.specialty || "Chưa cập nhật"}
      </p>
    </div>
  );
}
