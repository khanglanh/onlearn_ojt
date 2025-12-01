import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../layout/StudentLayout";
import { getClassDetails, getCourseDetails } from "../../api/academicApi";
import { parseApiError } from "../../api/parseApiError";
import {
    FaArrowLeft,
    FaClock,
    FaUsers,
    FaCalendarAlt,
    FaHourglass,
    FaChalkboard,
} from "react-icons/fa";

export default function ClassDetailPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [clazz, setClazz] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadClassDetails();
    }, [classId]);

    const loadClassDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getClassDetails(classId);
            // Normalize response
            const classData = response.data || response;
            setClazz(classData);

            // Load course details if courseId is available
            if (classData.courseId) {
                try {
                    const courseResponse = await getCourseDetails(classData.courseId);
                    const courseData = courseResponse.data || courseResponse;
                    setCourse(courseData);
                } catch (courseErr) {
                    console.error("Error loading course details:", courseErr);
                    // Don't fail the whole page if course loading fails
                }
            }
        } catch (err) {
            console.error("Error loading class details:", err);
            const parsed = parseApiError(err);
            setError(parsed?.message || "Không thể tải chi tiết lớp học");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            ACTIVE: { label: "Đang học", color: "#10B981", bg: "#D1FAE5" },
            UPCOMING: { label: "Sắp học", color: "#F59E0B", bg: "#FEF3C7" },
            COMPLETED: { label: "Hoàn thành", color: "#EF4444", bg: "#FEE2E2" },
        };

        const config = statusConfig[status] || statusConfig.ACTIVE;

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

    const formatDate = (dateValue) => {
        if (!dateValue) return "N/A";
        try {
            const date = typeof dateValue === "number"
                ? new Date(dateValue * 1000)
                : new Date(dateValue);

            if (isNaN(date.getTime())) {
                return "N/A";
            }

            return date.toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            console.error("Error formatting date:", e, dateValue);
            return "N/A";
        }
    };

    return (
        <StudentLayout>
            <div style={{ padding: "20px" }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate("/classes")}
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

                {/* Class Detail */}
                {clazz && !loading && (
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
                                        {course?.courseName || clazz.courseId || "Khóa học"}
                                    </div>
                                    <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>
                                        {clazz.className}
                                    </h1>
                                    <div style={{ marginBottom: "12px" }}>
                                        {clazz.status && getStatusBadge(clazz.status)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: "40px 30px" }}>
                            {/* Class Info Grid */}
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
                                {/* Room */}
                                {clazz.room && (
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
                                                <FaChalkboard />
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
                                                    PHÒNG
                                                </p>
                                                <p
                                                    style={{
                                                        margin: "4px 0 0 0",
                                                        fontSize: "18px",
                                                        fontWeight: 700,
                                                        color: "#05386D",
                                                    }}
                                                >
                                                    {clazz.room}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Capacity */}
                                {clazz.capacity && (
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
                                                    SỨC CHỨA
                                                </p>
                                                <p
                                                    style={{
                                                        margin: "4px 0 0 0",
                                                        fontSize: "18px",
                                                        fontWeight: 700,
                                                        color: "#05386D",
                                                    }}
                                                >
                                                    {clazz.capacity} học viên
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Schedule */}
                                {clazz.schedule && (
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
                                                    backgroundColor: "#FEE2E2",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#DC2626",
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
                                                    LỊCH HỌC
                                                </p>
                                                <p
                                                    style={{
                                                        margin: "4px 0 0 0",
                                                        fontSize: "18px",
                                                        fontWeight: 700,
                                                        color: "#05386D",
                                                    }}
                                                >
                                                    {clazz.schedule}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* StartTime */}
                                {clazz.startTime && (
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
                                                <FaClock />
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
                                                    GIỜ BẮT ĐẦU
                                                </p>
                                                <p
                                                    style={{
                                                        margin: "4px 0 0 0",
                                                        fontSize: "18px",
                                                        fontWeight: 700,
                                                        color: "#05386D",
                                                    }}
                                                >
                                                    {clazz.startTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Duration per session */}
                                {clazz.durationPerSession && (
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
                                                <FaHourglass />
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
                                                    {clazz.durationPerSession} phút
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>

                            {/* Additional Info */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                {/* Created At */}
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
                                        {formatDate(clazz.createdAt)}
                                    </p>
                                </div>

                                {/* Updated At */}
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
                                        {formatDate(clazz.updatedAt || clazz.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
