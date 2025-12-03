import { useState, useEffect } from 'react';
import { listClasses, getTeacher, listCourses } from '../../api/academic';
import AdminLayout from '../layout/AdminLayout';
import './TeacherSchedulePage.css';

export default function AdminSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachersMap, setTeachersMap] = useState({}); // Map teacherId -> teacher info
  const [coursesMap, setCoursesMap] = useState({}); // Map courseId -> course info
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all classes
      const classesResponse = await listClasses();
      if (classesResponse.success) {
        const allClasses = Array.isArray(classesResponse.data) 
          ? classesResponse.data 
          : classesResponse.data?.classes || [];
        setClasses(allClasses);

        // Get unique teacher IDs and course IDs
        const teacherIds = [...new Set(allClasses.map(c => c.teacherId).filter(Boolean))];
        const courseIds = [...new Set(allClasses.map(c => c.courseId).filter(Boolean))];

        // Load teachers info
        const teachers = {};
        for (const teacherId of teacherIds) {
          try {
            const teacherResponse = await getTeacher(teacherId);
            if (teacherResponse.success && teacherResponse.data) {
              teachers[teacherId] = teacherResponse.data;
            }
          } catch (err) {
            console.warn(`Failed to load teacher ${teacherId}:`, err);
          }
        }
        setTeachersMap(teachers);

        // Load courses info
        const coursesResponse = await listCourses();
        if (coursesResponse.success) {
          const courses = Array.isArray(coursesResponse.data)
            ? coursesResponse.data
            : coursesResponse.data?.courses || [];
          const coursesMapObj = {};
          courses.forEach(course => {
            coursesMapObj[course.courseId] = course;
          });
          setCoursesMap(coursesMapObj);
        }
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse schedule and extract all days of week
  const parseScheduleDays = (schedule) => {
    if (!schedule) return [];
    const dayMap = {
      't2': 'Mon', 'mon': 'Mon', 'monday': 'Mon',
      't3': 'Tue', 'tue': 'Tue', 'tuesday': 'Tue',
      't4': 'Wed', 'wed': 'Wed', 'wednesday': 'Wed',
      't5': 'Thu', 'thu': 'Thu', 'thursday': 'Thu',
      't6': 'Fri', 'fri': 'Fri', 'friday': 'Fri',
      't7': 'Sat', 'sat': 'Sat', 'saturday': 'Sat',
      'cn': 'Sun', 'sun': 'Sun', 'sunday': 'Sun'
    };
    
    const scheduleLower = schedule.toLowerCase();
    const foundDays = [];
    
    const tokens = scheduleLower.split(/[,\-\s]+/).map(t => t.trim()).filter(t => t.length > 0);
    
    tokens.forEach(token => {
      if (dayMap[token]) {
        const day = dayMap[token];
        if (!foundDays.includes(day)) {
          foundDays.push(day);
        }
      }
    });
    
    if (foundDays.length === 0) {
      for (const [key, value] of Object.entries(dayMap)) {
        if (scheduleLower.includes(key) && !foundDays.includes(value)) {
          foundDays.push(value);
        }
      }
    }
    
    return foundDays;
  };

  // Get classes for a specific date
  const getClassesForDate = (date) => {
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    return classes.filter(c => {
      if (c.status !== 'OPEN' && c.status !== 'FULL') return false;
      const scheduleDays = parseScheduleDays(c.schedule);
      return scheduleDays.includes(dayName);
    });
  };

  // Check if a date has classes
  const hasClasses = (date) => {
    return getClassesForDate(date).length > 0;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const calendarDays = generateCalendarDays();
  const selectedDateClasses = getClassesForDate(selectedDate);

  if (loading) {
    return (
      <AdminLayout>
        <div className="teacher-schedule loading-state">
          <div className="spinner"></div>
          <p>Đang tải lịch tổng quan...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="teacher-schedule error-state">
          <div className="error-message">
            <h2>Lỗi tải lịch</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadScheduleData}>
              Thử lại
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="teacher-schedule">
        <div className="schedule-header">
          <h1>Lịch tổng quan</h1>
          <p className="welcome-text">
            Xem lịch dạy của tất cả các lớp học và giáo viên phụ trách
          </p>
        </div>

        <div className="schedule-content">
          {/* Calendar */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="nav-button" onClick={() => navigateMonth(-1)}>
                ‹
              </button>
              <h2>
                {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </h2>
              <button className="nav-button" onClick={() => navigateMonth(1)}>
                ›
              </button>
            </div>

            <div className="calendar-grid">
              {/* Day headers */}
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => (
                <div key={index} className="calendar-day-header">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="calendar-day empty"></div>;
                }

                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const hasClass = hasClasses(date);
                const dayClasses = getClassesForDate(date);

                return (
                  <div
                    key={index}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasClass ? 'has-class' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="day-number">{date.getDate()}</div>
                    {hasClass && (
                      <div className="class-indicator">
                        <span className="indicator-dot"></span>
                        <span className="class-count">{dayClasses.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected date classes */}
          <div className="classes-section">
            <h2>
              Lịch dạy ngày {selectedDate.toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            
            {selectedDateClasses.length === 0 ? (
              <div className="empty-state">
                <p>Không có lớp học vào ngày này</p>
              </div>
            ) : (
              <div className="classes-list">
                {selectedDateClasses.map((classItem) => {
                  const scheduleDays = parseScheduleDays(classItem.schedule);
                  const timeMatch = classItem.schedule?.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                  const timeRange = timeMatch ? `${timeMatch[1]}:${timeMatch[2]} - ${timeMatch[3]}:${timeMatch[4]}` : 'Chưa có';
                  
                  const teacher = classItem.teacherId ? teachersMap[classItem.teacherId] : null;
                  const course = classItem.courseId ? coursesMap[classItem.courseId] : null;

                  return (
                    <div key={classItem.classId} className="class-card">
                      <div className="class-header">
                        <h3>
                          {course?.courseName || classItem.courseName || 'Khóa học không xác định'}
                          <span className="class-code">{classItem.className || classItem.classId}</span>
                        </h3>
                        <span className={`status-badge status-${classItem.status?.toLowerCase()}`}>
                          {classItem.status}
                        </span>
                      </div>

                      <div className="class-details">
                        {teacher && (
                          <div className="detail-row">
                            <span className="detail-label">👨‍🏫 Giáo viên:</span>
                            <span><strong>{teacher.name || teacher.teacherName || 'Chưa có'}</strong></span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">📅 Lịch học:</span>
                          <span>{scheduleDays.join(', ')}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">⏰ Giờ học:</span>
                          <span>{timeRange}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">🏢 Phòng:</span>
                          <span>{classItem.room || 'Chưa có'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">👥 Đăng ký:</span>
                          <span>{classItem.enrolled || 0} / {classItem.capacity || 0}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">📚 Mã khóa học:</span>
                          <span>{course?.courseCode || classItem.courseCode || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

