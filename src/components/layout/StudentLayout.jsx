import React from "react";
import StudentSidebar from "./StudentSidebar";
import StudentTopbar from "./StudentTopbar";

export default function StudentLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f6fa" }}>
      
      {/* SIDEBAR BÊN TRÁI */}
      <div style={{ width: "250px", backgroundColor: "#fff", borderRight: "1px solid #eee" }}>
        <StudentSidebar />
      </div>

      {/* PHẦN BÊN PHẢI */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* TOPBAR NẰM TRÊN TOÀN BỘ CONTENT */}
        <StudentTopbar />

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
