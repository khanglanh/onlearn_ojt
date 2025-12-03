import React from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaBook,
  FaClipboardList,
  FaCheckSquare,
  FaFileAlt,
  FaMoneyBill,
  FaUser,
  FaComments,
  FaGraduationCap,
  FaUsers,
  FaChalkboardTeacher,
  FaUserClock,
  FaClipboard,
  FaChartLine,
  FaBookOpen,
  FaDoorOpen,
  FaUserCheck,
  FaTrophy,
  FaUserTie,
} from "react-icons/fa";
import logo from "../../assets/logo.png"; // đổi theo đường dẫn thật

export default function AppSidebar() {
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
          active={isActive("/student/dashboard")}
          icon={<FaHome />}
          component={<Link to="/student/dashboard" />}
        >
          Trang chủ
        </MenuItem>

        {/* GROUP: HỌC TẬP */}
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
          Học tập
        </div>

        <MenuItem
          active={isActive("/student/courses")}
          icon={<FaGraduationCap />}
          component={<Link to="/student/courses" />}
        >
          Danh sách khóa học
        </MenuItem>

        <MenuItem
          active={isActive("/student/my-classes")}
          icon={<FaBookOpen />}
          component={<Link to="/student/my-classes" />}
        >
          Lớp học của tôi
        </MenuItem>

        <MenuItem
          active={isActive("/student/schedule")}
          icon={<FaCalendarAlt />}
          component={<Link to="/student/schedule" />}
        >
          Lịch học
        </MenuItem>

        <MenuItem
          active={isActive("/student/materials")}
          icon={<FaBook />}
          component={<Link to="/student/materials" />}
        >
          Tài liệu học tập
        </MenuItem>

        <MenuItem
          active={isActive("/homework")}
          icon={<FaClipboardList />}
          component={<Link to="/homework" />}
        >
          Bài tập về nhà
        </MenuItem>

        <MenuItem
          active={isActive("/exam")}
          icon={<FaCheckSquare />}
          component={<Link to="/exam" />}
        >
          Kiểm tra
        </MenuItem>

        <MenuItem
          active={isActive("/grades")}
          icon={<FaTrophy />}
          component={<Link to="/grades" />}
        >
          Điểm số
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
