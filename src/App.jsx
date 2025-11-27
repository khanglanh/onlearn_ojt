import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getMyDashboard } from "./utils/authUtils";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import VerifyPage from "./components/VerifyPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import DashboardPage from "./components/pages/DashboardPage";
import SchedulePage from "./components/pages/SchedulePage";
import ChangePasswordPage from "./components/ChangePasswordPage";
import ProfilePage from "./components/pages/ProfilePage";
import StudentsPage from "./components/pages/StudentsPage";
import StudentDetailPage from "./components/pages/StudentDetailPage";
import TeachersPage from "./components/pages/TeachersPage";
import TeacherDetailPage from "./components/pages/TeacherDetailPage";
import RedeemInvitePage from "./components/pages/RedeemInvitePage";
import CoursesPage from "./components/pages/CoursesPage";
import CourseDetailPage from "./components/pages/CourseDetailPage";
import ClassesPage from "./components/pages/ClassesPage";
import SessionsPage from "./components/pages/SessionsPage";
import EnrollmentsPage from "./components/pages/EnrollmentsPage";
import AttendancePage from "./components/pages/AttendancePage";
import GradesPage from "./components/pages/GradesPage";
import ImportPage from "./components/pages/ImportPage";
import TeacherDashboardPage from "./components/pages/TeacherDashboardPage";
import TeacherCoursePage from "./components/pages/TeacherCoursePage";
import TeacherClassPage from "./components/pages/TeacherClassPage";
import TeacherMaterialsPage from "./components/TeacherMaterialsPage";
import StudentSearchPage from "./components/pages/StudentSearchPage";
import StudentCoursesPage from "./components/pages/StudentCoursesPage";
import StudentMaterialsPage from "./components/StudentMaterialsPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Helper component to redirect to role-specific dashboard
function DashboardRedirect() {
  const roleDashboard = getMyDashboard();
  return <Navigate to={roleDashboard} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/redeem" element={<RedeemInvitePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:studentId"
          element={
            <ProtectedRoute>
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <TeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/:teacherId"
          element={
            <ProtectedRoute>
              <TeacherDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <SessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute>
              <EnrollmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <GradesPage />
            </ProtectedRoute>
          }
        />
        
        {/* Phase 2: Role-Based Routes */}
        <Route
          path="/admin/import"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <ImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherCoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes/:classId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherClassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/search"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentCoursesPage />
            </ProtectedRoute>
          }
        />
        
        {/* Phase 3: Materials Routes */}
        <Route
          path="/teacher/materials/:courseId/:classId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherMaterialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/materials/:courseId/:classId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentMaterialsPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
export default App;
