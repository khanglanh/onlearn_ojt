import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import { getCourseDetails } from "../../api/academicApi";
import { parseApiError } from "../../api/parseApiError";
import {
  FaArrowLeft,
  FaClock,
  FaUsers,
  FaTag,
  FaBook,
  FaCalendarAlt,
} from "react-icons/fa";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseDetails(courseId);
      // Normalize response
      const courseData = response.data || response;
      setCourse(courseData);
    } catch (err) {
      console.error("Error loading course details:", err);
      const parsed = parseApiError(err);
      setError(parsed?.message || "Không thể tải chi tiết khóa học");
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    const levelConfig = {
      BEGINNER: { label: "Cơ bản", color: "#10B981", bg: "#D1FAE5" },
      INTERMEDIATE: { label: "Trung cấp", color: "#F59E0B", bg: "#FEF3C7" },
      ADVANCED: { label: "Nâng cao", color: "#EF4444", bg: "#FEE2E2" },
    };

    const config = levelConfig[level] || levelConfig.BEGINNER;

    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: "20px",
          backgroundColor: config.bg,
          color: config.color,
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <StudentLayout>
      <div style={{ padding: "20px" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/courses")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            backgroundColor: "transparent",
            color: "#05386D",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "20px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <FaArrowLeft />
          Quay lại
        </button>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
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

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              padding: "20px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Course Detail */}
        {course && !loading && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "40px 30px",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "start", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "12px" }}>
                    {course.courseCode}
                  </div>
                  <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>
                    {course.courseName}
                  </h1>
                  <div style={{ marginBottom: "12px" }}>
                    {course.level && getLevelBadge(course.level)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "40px 30px" }}>
              {/* Description Section */}
              {course.description && (
                <div style={{ marginBottom: "40px" }}>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#05386D",
                      marginBottom: "12px",
                    }}
                  >
                    Mô tả khóa học
                  </h2>
                  <p
                    style={{
                      color: "#6B7280",
                      fontSize: "15px",
                      lineHeight: "1.8",
                    }}
                  >
                    {course.description}
                  </p>
                </div>
              )}

              {/* Course Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "30px",
                  marginBottom: "40px",
                  paddingBottom: "40px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                {/* Duration */}
                {course.duration && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
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
                          fontSize: "20px",
                        }}
                      >
                        <FaCalendarAlt />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#9CA3AF",
                            fontWeight: 600,
                          }}
                        >
                          THỜI LƯỢNG
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#05386D",
                          }}
                        >
                          {course.duration} tuần
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sessions */}
                {course.durationInSessions && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
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
                          fontSize: "20px",
                        }}
                      >
                        <FaUsers />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#9CA3AF",
                            fontWeight: 600,
                          }}
                        >
                          SỐ BUỔI HỌC
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#05386D",
                          }}
                        >
                          {course.durationInSessions} buổi
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Created At */}
                {course.createdAt && (
                  <div
                    style={{
                      backgroundColor: "#F9FAFB",
                      padding: "15px",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0",
                        fontSize: "12px",
                        color: "#9CA3AF",
                        fontWeight: 600,
                        marginBottom: "6px",
                      }}
                    >
                      NGÀY TẠO
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#374151",
                      }}
                    >
                      {new Date(typeof course.createdAt === "number" ? course.createdAt * 1000 : course.createdAt).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                {/* Updated At */}
                {course.updatedAt && (
                  <div
                    style={{
                      backgroundColor: "#F9FAFB",
                      padding: "15px",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0",
                        fontSize: "12px",
                        color: "#9CA3AF",
                        fontWeight: 600,
                        marginBottom: "6px",
                      }}
                    >
                      CẬP NHẬT CUỐI CÙNG
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#374151",
                      }}
                    >
                      {new Date(typeof course.updatedAt === "number" ? course.updatedAt * 1000 : course.updatedAt).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
