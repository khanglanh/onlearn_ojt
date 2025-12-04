import { getUserRole } from '../../utils/authUtils';
import StudentLayout from "../layout/StudentLayout";
import AdminLayout from "../layout/AdminLayout";
import TeacherLayout from "../layout/TeacherLayout";
import AdminSchedulePage from "./AdminSchedulePage";
import TeacherSchedulePage from "./TeacherSchedulePage";
import StudentCalendar from "../layout/StudentCalendar";

export default function SchedulePage() {
  const userRole = getUserRole();
  
  // Admin/Manager: Show admin schedule with all classes and teachers
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return <AdminSchedulePage />;
  }
  
  // Teacher: Show teacher schedule
  if (userRole === 'TEACHER') {
    return <TeacherSchedulePage />;
  }
  
  // Student: Show student calendar
  return (
    <StudentLayout>
      <StudentCalendar />
    </StudentLayout>
  );
}
