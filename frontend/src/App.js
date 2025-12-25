import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ActivateAccount from "./pages/ActivateAccount";

import Footer from "./components/Footer";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import SupportPage from "./pages/SupportPage";
import UserProfile from "./components/UserProfile";

// System Admin
import SystemAdminLayout from "./components/SystemAdminLayout";
import SystemAdminDashboard from "./pages/systemAdmin/SystemAdminDashboard";
import SystemAdminRequests from "./pages/systemAdmin/SystemAdminRequests";
import SystemAdminDepartments from "./pages/systemAdmin/SystemAdminDepartments";
import SystemAdminDepartmentDetails from "./pages/systemAdmin/SystemAdminDepartmentDetails";
import SystemAdminManageDepartments from "./pages/systemAdmin/SystemAdminManageDepartments";
import SystemAdminDepartmentEdit from "./pages/systemAdmin/SystemAdminDepartmentEdit";

// Department Admin
import DepartmentAdminLayout from "./components/DepartmentAdminLayout";
import DepartmentAdminDashboard from "./pages/DepartmentAdmin/DepartmentAdminDashboard";
import DepartmentAdminRequests from "./pages/DepartmentAdmin/DepartmentAdminRequests";
import DepartmentAdminCourses from "./pages/DepartmentAdmin/DepartmentAdminCourses";
import DeptCourseDiagramPage from "./pages/DepartmentAdmin/DeptCourseDiagramPage";
import DepartmentAdminCourseDetail from "./pages/DepartmentAdmin/DepartmentAdminCourseDetail";

// Lecturer
import LecturerLayout from "./components/LecturerLayout";
import LecturerDashboard from "./pages/Lecturer/LecturerDashboard";
import LecturerHistory from "./pages/Lecturer/LecturerHistory";
import LecturerCourses from "./pages/Lecturer/LecturerCourses";
import LecturerCourseVersions from "./pages/Lecturer/LecturerCourseVersions";
import LecturerSyllabusNew from "./pages/Lecturer/LecturerSyllabusNew";
import LecturerSyllabusDetails from "./pages/Lecturer/LecturerSyllabusDetails";
import LecturerSyllabusEdit from "./pages/Lecturer/LecturerSyllabusEdit";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#f8faff]">
        <div className="flex-grow pb-24">
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/activate/:token" element={<ActivateAccount />} />

            {/* Footer pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/help" element={<SupportPage />} />

            {/* System Admin */}
            <Route path="/system-admin" element={<SystemAdminLayout />}>
              <Route index element={<SystemAdminDashboard />} />
              <Route path="dashboard" element={<SystemAdminDashboard />} />
              <Route path="requests" element={<SystemAdminRequests />} />
              <Route path="departments" element={<SystemAdminDepartments />} />
              <Route path="departments/manage" element={<SystemAdminManageDepartments />} />
              <Route path="departments/:id" element={<SystemAdminDepartmentDetails />} />
              <Route path="departments/edit/:code" element={<SystemAdminDepartmentEdit />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Department Admin */}
            <Route path="/department-admin" element={<DepartmentAdminLayout />}>
              <Route index element={<DepartmentAdminDashboard />} />
              <Route path="dashboard" element={<DepartmentAdminDashboard />} />
              <Route path="requests" element={<DepartmentAdminRequests />} />
              <Route path="courses" element={<DepartmentAdminCourses />} />
              <Route path="course-diagram" element={<DeptCourseDiagramPage />} />
              <Route path="courses/:courseId" element={<DepartmentAdminCourseDetail />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Lecturer */}
            <Route path="/lecturer" element={<LecturerLayout />}>
              <Route index element={<LecturerDashboard />} />
              <Route path="dashboard" element={<LecturerDashboard />} />
              <Route path="history" element={<LecturerHistory />} />
              <Route path="courses" element={<LecturerCourses />} />
              <Route path="courses/:courseId" element={<LecturerCourseVersions />} />
              <Route path="courses/:courseId/new" element={<LecturerSyllabusNew />} />
              <Route path="courses/:courseId/versions/:versionId" element={<LecturerSyllabusDetails />} />
              <Route path="courses/:courseId/versions/:versionId/edit" element={<LecturerSyllabusEdit />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
