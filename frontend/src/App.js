import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ActivateAccount from "./pages/ActivateAccount";

import SystemAdminLayout from "./components/SystemAdminLayout";
import SystemAdminDashboard from "./pages/systemAdmin/SystemAdminDashboard";
import SystemAdminRequests from "./pages/systemAdmin/SystemAdminRequests";
import SystemAdminDepartments from "./pages/systemAdmin/SystemAdminDepartments";
import SystemAdminProfile from "./pages/systemAdmin/SystemAdminProfile";
import SystemAdminDepartmentDetails from "./pages/systemAdmin/SystemAdminDepartmentDetails";
import SystemAdminManageDepartments from "./pages/systemAdmin/SystemAdminManageDepartments";
import SystemAdminDepartmentEdit from "./pages/systemAdmin/SystemAdminDepartmentEdit";
import DepartmentAdminDashboard from "./pages/DepartmentAdmin/DepartmentAdminDashboard";
import Footer from "./components/Footer";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import SupportPage from "./pages/SupportPage";
import UserProfile from "./components/UserProfile";
import DepartmentAdminLayout from "./components/DepartmentAdminLayout";
import DepartmentAdminRequests from "./pages/DepartmentAdmin/DepartmentAdminRequests";
import DepartmentAdminCourses from "./pages/DepartmentAdmin/DepartmentAdminCourses";
import DeptCourseDiagramPage from "./pages/DepartmentAdmin/DeptCourseDiagramPage";
import DepartmentAdminCourseDetail from "./pages/DepartmentAdmin/DepartmentAdminCourseDetail";


function App() {
  return (
    <Router>
      {/* עטיפה לכל האפליקציה כדי שהפוטר ישב בתחתית */}
      <div className="min-h-screen flex flex-col bg-[#f8faff]">
        {/* אזור התוכן שנמתח לגובה */}
        <div className="flex-grow pb-24">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/activate/:token" element={<ActivateAccount />} />
            {/* Footer pages */}

            
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/help" element={<SupportPage />} />


            {/* System Admin area */}
            <Route path="/system-admin" element={<SystemAdminLayout />}>
              <Route index element={<SystemAdminDashboard />} />
              <Route path="dashboard" element={<SystemAdminDashboard />} />
              <Route path="requests" element={<SystemAdminRequests />} />
              <Route path="departments" element={<SystemAdminDepartments />} />
              <Route
                path="departments/manage"
                element={<SystemAdminManageDepartments />}
              />
              <Route path="profile" element={<SystemAdminProfile />} />
              <Route
                path="departments/:id"
                element={<SystemAdminDepartmentDetails />}
              />
              <Route
                path="/system-admin/departments/edit/:code"
                element={<SystemAdminDepartmentEdit />}
              />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          
          <Route path="profile" element={<UserProfile />} />
          <Route path="departments/:id" element={<SystemAdminDepartmentDetails />} />
          <Route
               path="/system-admin/departments/edit/:code"
               element={<SystemAdminDepartmentEdit />}
          />


         {/* Department Admin area */}
        <Route path="/department-admin" element={<DepartmentAdminLayout />}>
          <Route index element={<DepartmentAdminDashboard />} />
          <Route path="dashboard" element={<DepartmentAdminDashboard />} />
          <Route path="requests" element={<DepartmentAdminRequests />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="/department-admin/courses" element={<DepartmentAdminCourses />}/>
          <Route
           path="/department-admin/course-diagram"
           element={<DeptCourseDiagramPage />}
           />
           <Route
            path="/department-admin/courses/:courseId"
            element={<DepartmentAdminCourseDetail />}
           />
        </Route>
         
          </Routes>
        </div>

        {/* הפוטר שיופיע בכל האתר, לכל משתמש */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
