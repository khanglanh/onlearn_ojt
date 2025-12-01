import React from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaBook,
  FaChalkboardTeacher,
  FaClipboardList,
  FaFileAlt,
  FaUser,
  FaChartLine,
  FaBookOpen,
  FaUsers,
  FaClipboard,
} from "react-icons/fa";
import logo from "../../assets/logo.png";

export default function TeacherSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <Sidebar
      backgroundColor="#ffffff"
      width="250px"
      style={{
        borderRight: "1px solid #eee",
        padding: "15px",
      }}
    >
      {/* LOGO */}
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <img src={logo} alt="logo" style={{ width: "60px" }} />
        <h2 style={{ fontSize: "22px", marginTop: "10px", color: "#05386D" }}>
          onlearn
        </h2>
      </div>

      {/* MENU CHÍNH */}
      <Menu
        menuItemStyles={{
          button: ({ active }) => ({
            backgroundColor: active ? "#e8efff" : "transparent",
            color: active ? "#05386D" : "#333",
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "4px",
          }),
        }}
      >
        <MenuItem
          active={isActive("/teacher/dashboard")}
          icon={<FaHome />}
          component={<Link to="/teacher/dashboard" />}
        >
          Trang chủ
        </MenuItem>

        {/* GROUP: GIẢNG DẠY */}
        <div
          style={{
            marginTop: "20px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#888",
            paddingLeft: "5px",
            fontWeight: 600,
          }}
        >
          Giảng dạy
        </div>

        <MenuItem
          active={isActive("/teacher/classes") || isActive("/teacher/classes/")}
          icon={<FaChalkboardTeacher />}
          component={<Link to="/teacher/classes" />}
        >
          Lớp học của tôi
        </MenuItem>

        <MenuItem
          active={isActive("/teacher/schedule")}
          icon={<FaCalendarAlt />}
          component={<Link to="/teacher/schedule" />}
        >
          Lịch giảng dạy
        </MenuItem>

        <MenuItem
          active={isActive("/teacher/materials")}
          icon={<FaFileAlt />}
          component={<Link to="/teacher/materials" />}
        >
          Tài liệu giảng dạy
        </MenuItem>

        {/* GROUP: QUẢN LÝ */}
        <div
          style={{
            marginTop: "20px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#888",
            paddingLeft: "5px",
            fontWeight: 600,
          }}
        >
          Quản lý
        </div>

        <MenuItem
          active={isActive("/teacher/students")}
          icon={<FaUsers />}
          component={<Link to="/teacher/students" />}
        >
          Học viên
        </MenuItem>

        <MenuItem
          active={isActive("/teacher/attendance")}
          icon={<FaClipboard />}
          component={<Link to="/teacher/attendance" />}
        >
          Điểm danh
        </MenuItem>

        <MenuItem
          active={isActive("/teacher/grades")}
          icon={<FaClipboardList />}
          component={<Link to="/teacher/grades" />}
        >
          Chấm điểm
        </MenuItem>

        <MenuItem
          active={isActive("/teacher/statistics")}
          icon={<FaChartLine />}
          component={<Link to="/teacher/statistics" />}
        >
          Thống kê
        </MenuItem>

        {/* GROUP: TÀI KHOẢN */}
        <div
          style={{
            marginTop: "20px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#888",
            paddingLeft: "5px",
            fontWeight: 600,
          }}
        >
          Tài khoản
        </div>

        <MenuItem
          active={isActive("/settings/profile")}
          icon={<FaUser />}
          component={<Link to="/settings/profile" />}
        >
          Hồ sơ cá nhân
        </MenuItem>
      </Menu>
    </Sidebar>
  );
}

