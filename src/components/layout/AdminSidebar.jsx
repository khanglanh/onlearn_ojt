import React from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaChalkboardTeacher,
  FaBook,
  FaSchool,
  FaCalendarAlt,
  FaClipboard,
  FaCheckSquare,
  FaTrophy,
  FaFileImport,
  FaUser,
  FaUserCheck,
  FaChartLine,
} from "react-icons/fa";
import logo from "../../assets/logo.png";

export default function AdminSidebar() {
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
          subMenuContent: {
            backgroundColor: "#f8f9fa",
          },
        }}
        subMenuItemStyles={{
          button: ({ active }) => ({
            backgroundColor: active ? "#e8efff" : "transparent",
            color: active ? "#05386D" : "#666",
            fontSize: "13px",
            padding: "8px 10px 8px 45px",
            marginBottom: "2px",
            borderRadius: "6px",
          }),
        }}
      >
        <MenuItem
          active={isActive("/admin/dashboard")}
          icon={<FaHome />}
          component={<Link to="/admin/dashboard" />}
        >
          Trang chủ
        </MenuItem>

        {/* GROUP: QUẢN LÝ NGƯỜI DÙNG */}
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
          Quản lý người dùng
        </div>

        <MenuItem
          active={isActive("/students")}
          icon={<FaUsers />}
          component={<Link to="/students" />}
        >
          Quản lý học viên
        </MenuItem>

        <MenuItem
          active={isActive("/teachers")}
          icon={<FaChalkboardTeacher />}
          component={<Link to="/teachers" />}
        >
          Quản lý giáo viên
        </MenuItem>

        {/* GROUP: QUẢN LÝ HỌC TẬP */}
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
          Quản lý học tập
        </div>

        <MenuItem
          active={isActive("/courses")}
          icon={<FaBook />}
          component={<Link to="/courses" />}
        >
          Quản lý khóa học
        </MenuItem>

        <MenuItem
          active={isActive("/classes")}
          icon={<FaSchool />}
          component={<Link to="/classes" />}
        >
          Quản lý lớp học
        </MenuItem>

        <MenuItem
          active={isActive("/sessions")}
          icon={<FaCalendarAlt />}
          component={<Link to="/sessions" />}
        >
          Quản lý buổi học
        </MenuItem>

        <MenuItem
          active={isActive("/enrollments")}
          icon={<FaClipboard />}
          component={<Link to="/enrollments" />}
        >
          Quản lý đăng ký
        </MenuItem>

        {/* GROUP: ĐIỂM DANH & ĐIỂM SỐ */}
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
          Điểm danh & Điểm số
        </div>

        <MenuItem
          active={isActive("/attendance")}
          icon={<FaCheckSquare />}
          component={<Link to="/attendance" />}
        >
          Điểm danh
        </MenuItem>

        <MenuItem
          active={isActive("/grades")}
          icon={<FaTrophy />}
          component={<Link to="/grades" />}
        >
          Điểm số
        </MenuItem>

        {/* GROUP: HỆ THỐNG */}
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
          Hệ thống
        </div>

        <MenuItem
          active={isActive("/admin/import")}
          icon={<FaFileImport />}
          component={<Link to="/admin/import" />}
        >
          Nhập dữ liệu
        </MenuItem>

        <MenuItem
          active={isActive("/schedule")}
          icon={<FaChartLine />}
          component={<Link to="/schedule" />}
        >
          Lịch tổng quan
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

        <MenuItem
          active={isActive("/settings/change-password")}
          icon={<FaUserCheck />}
          component={<Link to="/settings/change-password" />}
        >
          Đổi mật khẩu
        </MenuItem>
      </Menu>
    </Sidebar>
  );
}

