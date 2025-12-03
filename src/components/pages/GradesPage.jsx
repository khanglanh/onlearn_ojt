import React, { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";

export default function GradesPage() {
  return (
    <AdminLayout>
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#05386D", marginBottom: "20px" }}>
          Quản lý Điểm số
        </h1>
        <div style={{ 
          backgroundColor: "#fff", 
          padding: "40px", 
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "16px", color: "#6B7280" }}>
            Trang quản lý điểm số đang được phát triển...
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
