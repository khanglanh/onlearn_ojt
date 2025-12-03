import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import { getStudentDashboard, getStudent } from "../../api/studentApi";
import { parseApiError } from "../../api/parseApiError";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBirthdayCake,
  FaMapMarkerAlt,
  FaUsers,
  FaBook,
  FaClipboardCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChartLine,
  FaStickyNote,
} from "react-icons/fa";

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student info and academic summary separately
      // Academic summary returns: { enrollments, grades, attendances }
      const [studentResponse, academicResponse] = await Promise.all([
        getStudent(studentId),
        getStudentDashboard(studentId)
      ]);

      // Set student info
      setStudent(studentResponse.data || studentResponse);
      setNotes((studentResponse.data?.notes || studentResponse.notes) || []);

      // Set academic info from summary response
      // Response format: { enrollments: [], grades: [], attendances: [] }
      const academicData = academicResponse.data || academicResponse;
      setEnrollments(academicData.enrollments || []);
      setGrades(academicData.grades || []);
      setAttendance(academicData.attendances || []);
    } catch (err) {
      console.error("Error loading student data:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || String(parsed));
    } finally {
      setLoading(false);
    }
  };

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
          padding: "6px 14px",
          borderRadius: "12px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status) => {
    const statusConfig = {
      PRESENT: { label: "Có mặt", color: "#10B981", bg: "#D1FAE5" },
      ABSENT: { label: "Vắng", color: "#EF4444", bg: "#FEE2E2" },
      LATE: { label: "Muộn", color: "#F59E0B", bg: "#FEF3C7" },
      EXCUSED: { label: "Có phép", color: "#6366F1", bg: "#E0E7FF" },
    };

    const config = statusConfig[status] || statusConfig.PRESENT;

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "8px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        {config.label}
      </span>
    );
  };

  const getEnrollmentStatusBadge = (status) => {
    const statusConfig = {
      ENROLLED: { label: "Đang học", color: "#10B981", bg: "#D1FAE5" },
      COMPLETED: { label: "Hoàn thành", color: "#6366F1", bg: "#E0E7FF" },
      DROPPED: { label: "Đã rời", color: "#EF4444", bg: "#FEE2E2" },
    };

    const config = statusConfig[status] || statusConfig.ENROLLED;

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "8px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        {config.label}
      </span>
    );
  };

  const calculateAverageGrade = () => {
    if (grades.length === 0) return null;
    const total = grades.reduce((sum, grade) => {
      const percentage = (grade.score / grade.maxScore) * 100;
      return sum + percentage;
    }, 0);
    return (total / grades.length).toFixed(1);
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return null;
    const present = attendance.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    return ((present / attendance.length) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div
            style={{
              display: "inline-block",
              width: "50px",
              height: "50px",
              border: "5px solid #E5E7EB",
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
      </StudentLayout>
    );
  }

  if (error || !student) {
    return (
      <StudentLayout>
        <div style={{ padding: "20px" }}>
          <div
            style={{
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {error || "Không tìm thấy thông tin học viên"}
          </div>
          <button
            onClick={() => navigate("/students")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#05386D",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Quay lại danh sách
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div style={{ padding: "20px" }}>
        {/* Back Button & Header */}
        <button
          onClick={() => navigate("/students")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "#F3F4F6",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          <FaArrowLeft />
          Quay lại
        </button>

        {/* Student Header Card */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#E0E7FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6366F1",
                fontSize: "40px",
                fontWeight: 700,
              }}
            >
              {student.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#05386D" }}>
                  {student.name}
                </h1>
                {getStatusBadge(student.status)}
              </div>
              <div style={{ display: "flex", gap: "30px", color: "#6B7280" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaEnvelope />
                  <span>{student.email || "Chưa có"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaPhone />
                  <span>{student.phoneNumber || "Chưa có"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaUser />
                  <span>ID: {student.studentId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ color: "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
              Lớp đang học
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#05386D",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaBook style={{ fontSize: "24px" }} />
              {enrollments.filter((e) => e.status === "ENROLLED").length}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ color: "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
              Điểm trung bình
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaChartLine style={{ fontSize: "24px" }} />
              {calculateAverageGrade() || "—"}
              {calculateAverageGrade() && "%"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ color: "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
              Tỷ lệ điểm danh
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#6366F1",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaClipboardCheck style={{ fontSize: "24px" }} />
              {calculateAttendanceRate() || "—"}
              {calculateAttendanceRate() && "%"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ color: "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
              Ghi chú
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#F59E0B",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaStickyNote style={{ fontSize: "24px" }} />
              {notes.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid #F3F4F6",
            }}
          >
            {[
              { id: "personal", label: "Thông tin cá nhân", icon: <FaUser /> },
              { id: "enrollments", label: "Lớp học", icon: <FaBook /> },
              { id: "grades", label: "Điểm số", icon: <FaChartLine /> },
              { id: "attendance", label: "Điểm danh", icon: <FaClipboardCheck /> },
              { id: "notes", label: "Ghi chú", icon: <FaStickyNote /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "15px 20px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: activeTab === tab.id ? "#05386D" : "#6B7280",
                  borderBottom:
                    activeTab === tab.id ? "3px solid #05386D" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "25px" }}>
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Thông tin cá nhân
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  <InfoItem icon={<FaUser />} label="Họ và tên" value={student.name} />
                  <InfoItem icon={<FaEnvelope />} label="Email" value={student.email} />
                  <InfoItem
                    icon={<FaPhone />}
                    label="Số điện thoại"
                    value={student.phoneNumber}
                  />
                  <InfoItem
                    icon={<FaBirthdayCake />}
                    label="Ngày sinh"
                    value={student.dateOfBirth || "Chưa có"}
                  />
                  <InfoItem
                    icon={<FaUser />}
                    label="Giới tính"
                    value={
                      student.gender === "MALE"
                        ? "Nam"
                        : student.gender === "FEMALE"
                        ? "Nữ"
                        : "Khác"
                    }
                  />
                  <InfoItem
                    icon={<FaMapMarkerAlt />}
                    label="Địa chỉ"
                    value={student.address || "Chưa có"}
                  />
                  <InfoItem
                    icon={<FaUsers />}
                    label="Tên phụ huynh"
                    value={student.parentName || "Chưa có"}
                  />
                  <InfoItem
                    icon={<FaPhone />}
                    label="SĐT phụ huynh"
                    value={student.parentPhoneNumber || "Chưa có"}
                  />
                </div>
              </div>
            )}

            {/* Enrollments Tab */}
            {activeTab === "enrollments" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Lớp học đang tham gia
                </h3>
                {enrollments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
                    <FaBook style={{ fontSize: "48px", marginBottom: "10px" }} />
                    <p>Chưa tham gia lớp học nào</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.enrollmentId}
                        style={{
                          padding: "20px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#111827", marginBottom: "5px" }}>
                            Lớp ID: {enrollment.classId}
                          </div>
                          <div style={{ fontSize: "14px", color: "#6B7280" }}>
                            Ngày tham gia:{" "}
                            {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                        {getEnrollmentStatusBadge(enrollment.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grades Tab */}
            {activeTab === "grades" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Bảng điểm
                </h3>
                {grades.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
                    <FaChartLine style={{ fontSize: "48px", marginBottom: "10px" }} />
                    <p>Chưa có điểm số</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB" }}>
                        <th style={tableHeaderStyle}>Bài tập</th>
                        <th style={tableHeaderStyle}>Khóa học</th>
                        <th style={tableHeaderStyle}>Điểm</th>
                        <th style={tableHeaderStyle}>Tỷ lệ</th>
                        <th style={tableHeaderStyle}>Ngày chấm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((grade) => (
                        <tr key={grade.gradeId} style={{ borderTop: "1px solid #F3F4F6" }}>
                          <td style={tableCellStyle}>{grade.assignmentName}</td>
                          <td style={tableCellStyle}>{grade.courseId}</td>
                          <td style={tableCellStyle}>
                            {grade.score}/{grade.maxScore}
                          </td>
                          <td style={tableCellStyle}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                backgroundColor:
                                  (grade.score / grade.maxScore) * 100 >= 80
                                    ? "#D1FAE5"
                                    : (grade.score / grade.maxScore) * 100 >= 50
                                    ? "#FEF3C7"
                                    : "#FEE2E2",
                                color:
                                  (grade.score / grade.maxScore) * 100 >= 80
                                    ? "#10B981"
                                    : (grade.score / grade.maxScore) * 100 >= 50
                                    ? "#F59E0B"
                                    : "#EF4444",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            {new Date(grade.gradedAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Lịch sử điểm danh
                </h3>
                {attendance.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
                    <FaClipboardCheck style={{ fontSize: "48px", marginBottom: "10px" }} />
                    <p>Chưa có dữ liệu điểm danh</p>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB" }}>
                        <th style={tableHeaderStyle}>Buổi học</th>
                        <th style={tableHeaderStyle}>Trạng thái</th>
                        <th style={tableHeaderStyle}>Ghi chú</th>
                        <th style={tableHeaderStyle}>Ngày ghi nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record.attendanceId} style={{ borderTop: "1px solid #F3F4F6" }}>
                          <td style={tableCellStyle}>{record.sessionId}</td>
                          <td style={tableCellStyle}>
                            {getAttendanceStatusBadge(record.status)}
                          </td>
                          <td style={tableCellStyle}>{record.note || "—"}</td>
                          <td style={tableCellStyle}>
                            {new Date(record.recordedAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Ghi chú về học viên
                </h3>
                {notes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
                    <FaStickyNote style={{ fontSize: "48px", marginBottom: "10px" }} />
                    <p>Chưa có ghi chú</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {notes.map((note) => (
                      <div
                        key={note.noteId}
                        style={{
                          padding: "20px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          backgroundColor: "#FFFBEB",
                        }}
                      >
                        <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "10px" }}>
                          {new Date(note.createdAt).toLocaleString("vi-VN")} - {note.createdBy}
                        </div>
                        <div style={{ color: "#111827" }}>{note.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

// Helper components
function InfoItem({ icon, label, value }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#6B7280",
          fontSize: "13px",
          marginBottom: "8px",
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>
        {value || "—"}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: "12px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#6B7280",
  textTransform: "uppercase",
};

const tableCellStyle = {
  padding: "12px",
  color: "#374151",
};
