import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChalkboardTeacher,
  FaBook,
  FaUsers,
} from "react-icons/fa";

export default function TeacherDetailPage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacher();
  }, [teacherId]);

  const loadTeacher = async () => {
    try {
      setLoading(true);
      
      // Mock data - sẽ thay bằng API call sau
      const mockTeacher = {
        teacherId: teacherId,
        name: "Nguyễn Văn An",
        email: "an.nguyen@tcm.vn",
        phoneNumber: "0901234567",
        active: true,
        specialization: "Lập trình Java",
        createdAt: new Date("2024-01-15").getTime() / 1000,
        bio: "Giảng viên với hơn 10 năm kinh nghiệm trong lĩnh vực lập trình Java và phát triển phần mềm. Đã đào tạo hơn 500 học viên thành công.",
        education: "Thạc sĩ Khoa học Máy tính - ĐH Bách Khoa HCM",
        experience: "10+ năm",
        courses: [
          { courseId: "C001", courseName: "Java Cơ bản", studentCount: 45 },
          { courseId: "C002", courseName: "Spring Boot Advanced", studentCount: 32 },
          { courseId: "C003", courseName: "Microservices Architecture", studentCount: 28 },
        ],
      };
      
      setTeacher(mockTeacher);
    } catch (err) {
      console.error("Error loading teacher:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
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
      </StudentLayout>
    );
  }

  if (!teacher) {
    return (
      <StudentLayout>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ color: "#6B7280" }}>Không tìm thấy thông tin giảng viên</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div style={{ padding: "20px" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/teachers")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            backgroundColor: "#F3F4F6",
            color: "#374151",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          <FaArrowLeft />
          Quay lại
        </button>

        {/* Teacher Profile Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "40px",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  fontWeight: 700,
                  border: "4px solid rgba(255,255,255,0.3)",
                }}
              >
                {teacher.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
                  {teacher.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 14px",
                      borderRadius: "12px",
                      backgroundColor: teacher.active ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {teacher.active ? <FaCheckCircle /> : <FaTimesCircle />}
                    {teacher.active ? "Đang hoạt động" : "Không hoạt động"}
                  </span>
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    <FaChalkboardTeacher style={{ marginRight: "6px" }} />
                    {teacher.specialization}
                  </span>
                </div>
                <p style={{ opacity: 0.9, fontSize: "14px" }}>
                  ID: {teacher.teacherId}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
              {/* Contact Information */}
              <div>
                <h3 style={{ color: "#05386D", fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Thông tin liên hệ
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "#E0E7FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6366F1",
                      }}
                    >
                      <FaEnvelope />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>Email</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{teacher.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "#D1FAE5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#10B981",
                      }}
                    >
                      <FaPhone />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>Số điện thoại</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{teacher.phoneNumber}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "#FEF3C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#F59E0B",
                      }}
                    >
                      <FaCalendarAlt />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", color: "#6B7280" }}>Ngày tham gia</div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {new Date(teacher.createdAt * 1000).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 style={{ color: "#05386D", fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  Thông tin chuyên môn
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>Học vấn</div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{teacher.education}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>Kinh nghiệm</div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{teacher.experience}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>Giới thiệu</div>
                    <div style={{ color: "#374151", lineHeight: "1.6" }}>{teacher.bio}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Courses */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "30px",
          }}
        >
          <h3 style={{ color: "#05386D", fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>
            Khóa học đang giảng dạy
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {teacher.courses?.map((course) => (
              <div
                key={course.courseId}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #E5E7EB",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => navigate(`/courses/${course.courseId}`)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#E0E7FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6366F1",
                    }}
                  >
                    <FaBook />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: "16px" }}>
                      {course.courseName}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B7280", fontSize: "14px" }}>
                  <FaUsers />
                  <span>{course.studentCount} học viên</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
