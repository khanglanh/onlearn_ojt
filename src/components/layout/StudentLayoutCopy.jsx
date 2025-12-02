import React from "react";
import AppSidebar from "./StudentSidebarCopy";
import Topbar from "./StudentTopbarCopy";

export default function StudentLayoutCopy({ children }) {
  return (
    <div
      style={{ display: "flex", height: "100vh", backgroundColor: "#f5f6fa" }}
    >
      {/* SIDEBAR BÊN TRÁI */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#fff",
          borderRight: "1px solid #eee",
        }}
      >
        <AppSidebar />
      </div>

      {/* PHẦN BÊN PHẢI */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOPBAR NẰM TRÊN TOÀN BỘ CONTENT */}
        <Topbar />

        {/* CONTENT */}
        <div
          style={{
            flex: 1,
            padding: "32px",
            backgroundColor: "#f5f6fa",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
