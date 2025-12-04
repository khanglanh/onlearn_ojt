import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f6fa" }}>
      
      {/* SIDEBAR BÊN TRÁI */}
      <div style={{ width: "250px", backgroundColor: "#fff", borderRight: "1px solid #eee" }}>
        <AdminSidebar />
      </div>

      {/* PHẦN BÊN PHẢI */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR NẰM TRÊN TOÀN BỘ CONTENT */}
        <AdminTopbar />

        {/* CONTENT */}
        <div style={{
          flex: 1,
          padding: "32px",
          backgroundColor: "#f5f6fa",
          overflowY: "auto"
        }}>
          {children}
        </div>

      </div>
    </div>
  );
}

