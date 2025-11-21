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
