import React, { useState } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
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
  FaUsers,
  FaGraduationCap,
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
          active={isActive("/dashboard")}
          icon={<FaHome />}
          component={<Link to="/dashboard" />}
        >
          Trang chủ
        </MenuItem>

        {/* GROUP: GIÁO DỤC */}
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
          Giáo dục
        </div>

        <MenuItem
          active={isActive("/schedule")}
          icon={<FaCalendarAlt />}
          component={<Link to="/schedule" />}
        >
          Lịch học
        </MenuItem>

        <MenuItem
          active={isActive("/class")}
          icon={<FaBook />}
          component={<Link to="/class" />}
        >
          Lớp học
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
          active={isActive("/absence")}
          icon={<FaFileAlt />}
          component={<Link to="/absence" />}
        >
          Đơn nghỉ học
        </MenuItem>

        <MenuItem
          active={isActive("/fee")}
          icon={<FaMoneyBill />}
          component={<Link to="/fee" />}
        >
          Học phí
        </MenuItem>

        {/* GROUP: Quản lý */}
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

        {/* Đào tạo - SubMenu */}
        <SubMenu
          label="Đào tạo"
          icon={<FaGraduationCap />}
          defaultOpen={false}
        >
          <MenuItem
            active={isActive("/courses")}
            icon={<FaBookOpen style={{ fontSize: "14px" }} />}
            component={<Link to="/courses" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Khóa học
          </MenuItem>
          <MenuItem
            active={isActive("/classes")}
            icon={<FaDoorOpen style={{ fontSize: "14px" }} />}
            component={<Link to="/classes" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Lớp học
          </MenuItem>
          <MenuItem
            active={isActive("/sessions")}
            icon={<FaChalkboardTeacher style={{ fontSize: "14px" }} />}
            component={<Link to="/sessions" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Buổi học
          </MenuItem>
          <MenuItem
            active={isActive("/enrollments")}
            icon={<FaClipboard style={{ fontSize: "14px" }} />}
            component={<Link to="/enrollments" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Đăng ký học
          </MenuItem>
          <MenuItem
            active={isActive("/attendance")}
            icon={<FaUserCheck style={{ fontSize: "14px" }} />}
            component={<Link to="/attendance" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Điểm danh
          </MenuItem>
          <MenuItem
            active={isActive("/grades")}
            icon={<FaTrophy style={{ fontSize: "14px" }} />}
            component={<Link to="/grades" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Điểm số
          </MenuItem>
        </SubMenu>

        {/* Tài khoản - SubMenu */}
        <SubMenu
          label="Tài khoản"
          icon={<FaUsers />}
          defaultOpen={false}
        >
          <MenuItem
            active={isActive("/students")}
            icon={<FaUserClock style={{ fontSize: "14px" }} />}
            component={<Link to="/students" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Học viên
          </MenuItem>
          <MenuItem
            active={isActive("/teachers")}
            icon={<FaUserTie style={{ fontSize: "14px" }} />}
            component={<Link to="/teachers" />}
            style={{
              fontSize: "13px",
              paddingLeft: "50px",
            }}
          >
            Giảng viên
          </MenuItem>
        </SubMenu>

        {/* GROUP: Hỗ trợ */}
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
          Hỗ trợ
        </div>

        <MenuItem
          active={isActive("/profile")}
          icon={<FaUser />}
          component={<Link to="/profile" />}
        >
          Hồ sơ
        </MenuItem>

        <MenuItem
          active={isActive("/messages")}
          icon={<FaComments />}
          component={<Link to="/messages" />}
        >
          Tin nhắn
        </MenuItem>
      </Menu>
    </Sidebar>
  );
}
