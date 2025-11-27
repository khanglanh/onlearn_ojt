import React, { useState, useEffect } from "react";
import StudentLayout from "../layout/StudentLayout";

export default function SessionsPage() {
  return (
    <StudentLayout>
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#05386D", marginBottom: "20px" }}>
          Quản lý Buổi học
        </h1>
        <div style={{ 
          backgroundColor: "#fff", 
          padding: "40px", 
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "16px", color: "#6B7280" }}>
            Trang quản lý buổi học đang được phát triển...
          </p>
        </div>
      </div>
    </StudentLayout>
  );
}
