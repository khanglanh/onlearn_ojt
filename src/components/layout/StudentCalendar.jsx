import React, { useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function StudentCalendar() {
  // State chính đồng bộ toàn bộ hệ thống
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);
  // State để hiển thị chi tiết lịch học
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  // Fake events — sẽ thay bằng API sau
  const events = [
    {
      id: 1,
      title: "Tin học",
      className: "12321-TH",
      teacher: "Thầy Linh",
      start: new Date(2025, 10, 11, 10, 45),
      end: new Date(2025, 10, 11, 11, 30),
      color: "#f7dada",
    },
    {
      id: 2,
      title: "Lớp Tiếng Anh",
      className: "TA01",
      teacher: "Cô Hương",
      start: new Date(2025, 10, 15, 0, 0),
      end: new Date(2025, 10, 15, 1, 0),
      color: "#d8e2ff",
    },
  ];

  // Custom event UI
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: "8px",
      padding: "4px",
      border: "none",
      color: "#05386D",
      fontWeight: 600,
    },
  });

  // ⭐ Handle change input date → update calendar
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setCurrentDate(newDate);
  };

  // ⭐ Dropdown tháng
  const handleMonthSelect = (e) => {
    const month = Number(e.target.value);
    const updated = new Date(currentDate);
    updated.setMonth(month);
    setCurrentDate(updated);
  };

  // ⭐ Sync khi bấm Today / Back / Next
  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          flex: 3,
          background: "#fff",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ color: "#05386D", marginBottom: "20px" }}>Lịch học</h2>

        {/* TOP BAR FILTER */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          {/* Input Date */}
          <input
            type="date"
            value={format(currentDate, "yyyy-MM-dd")}
            onChange={handleDateChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />

          {/* Dropdown tháng */}
          <select
            value={currentDate.getMonth()}
            onChange={handleMonthSelect}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                Tháng {i + 1}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm lớp học"
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              flex: 1,
            }}
          />
        </div>

        {/* CALENDAR */}
        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          onNavigate={handleNavigate}
          view={currentView}
          onView={(view) => setCurrentView(view)}
          startAccessor="start"
          endAccessor="end"
          views={["month", "week", "day"]}
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          selectable
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setSelectedDateEvents([event]);
          }}
          onSelectSlot={(slot) => {
            // Khi click vào ngày → lấy event trong ngày đó
            const clickedDate = new Date(slot.start);
            const eventsOnDate = events.filter(
              (e) => e.start.toDateString() === clickedDate.toDateString()
            );
            setSelectedDateEvents(eventsOnDate);
            setSelectedEvent(null);
          }}
        />
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 2,
          background: "#fff",
          padding: "24px",
          borderRadius: "14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          minHeight: "600px",
        }}
      >
        <h3 style={{ color: "#05386D", marginBottom: "18px" }}>
          Chi tiết lịch học
        </h3>

        {/* Nếu click vào event */}
        {selectedEvent && (
          <div
            style={{
              background: "#eef4ff",
              padding: "20px",
              borderRadius: "12px",
              lineHeight: 1.7,
              marginBottom: "20px",
            }}
          >
            <p>
              <strong>Lớp:</strong> {selectedEvent.className}
            </p>
            <p>
              <strong>Môn:</strong> {selectedEvent.title}
            </p>
            <p>
              <strong>Giáo viên:</strong> {selectedEvent.teacher}
            </p>
            <p>
              <strong>Giờ học:</strong>
              {selectedEvent.start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {selectedEvent.end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {/* Nếu click vào 1 ngày */}
        {!selectedEvent && selectedDateEvents.length > 0 && (
          <div>
            {selectedDateEvents.map((e) => (
              <div
                key={e.id}
                style={{
                  background: "#eef4ff",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "14px",
                }}
              >
                <p>
                  <strong>Lớp:</strong> {e.className}
                </p>
                <p>
                  <strong>Môn:</strong> {e.title}
                </p>
                <p>
                  <strong>Giáo viên:</strong> {e.teacher}
                </p>
                <p>
                  <strong>Giờ học:</strong>{" "}
                  {e.start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {e.end.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Nếu không có lớp */}
        {!selectedEvent && selectedDateEvents.length === 0 && (
          <p>Không có lớp học trong ngày này.</p>
        )}

        {/* Timeline cố định */}
        <div style={{ marginTop: "30px" }}>
          <p style={{ fontWeight: 600, color: "#05386D" }}>Timeline</p>

          <div
            style={{
              marginTop: "12px",
              height: "200px",
              borderLeft: "2px solid #ddd",
              paddingLeft: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
