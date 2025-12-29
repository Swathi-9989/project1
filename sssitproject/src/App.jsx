import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import NavbarTop from "./components/NavbarTop";
import NewStudentEnroll from "./components/NewStudentEnroll";
import OldStudentEnroll from "./components/OldStudentEnroll";
import EditStudent from "./components/EditStudent";
import DeleteStudent from "./components/DeleteStudent";
import FeeReceipts from "./components/FeeReceipts";
import SearchById from "./components/SearchById";
import ArrearsList from "./components/ArrearsList";
import ExportToExcel from "./components/ExportToExcel";
import AddNewCourse from "./components/AddNewCourse";
import FacultyDetails from "./components/FacultyDetails";
import StudentDetails from "./components/StudentDetails";
import AdminLogin from "./components/AdminLogin";
import ExamWrittenStudents from "./components/ExamWrittenStudents";
import CertificateDetails from "./components/CertificateDetails";
import AddExamStudent from "./components/AddExamStudent";
import Home from "./components/Home";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const admin = sessionStorage.getItem("admin");
    setIsLoggedIn(!!admin);

    const handleStorage = () => {
      const updatedAdmin = sessionStorage.getItem("admin");
      setIsLoggedIn(!!updatedAdmin);
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Router>
      {isLoggedIn && <NavbarTop />}

      <main className="main-content">
        <Routes>
          {!isLoggedIn ? (
            <>
              <Route path="/login" element={<AdminLogin />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
             



              <Route path="/" element={<Home />} />
              <Route path="/enroll/new" element={<NewStudentEnroll />} />
              <Route path="/enroll/old" element={<OldStudentEnroll />} />
              <Route path="/edit" element={<EditStudent />} />
              <Route path="/delete" element={<DeleteStudent />} />
              <Route path="/fees" element={<FeeReceipts />} />
              <Route path="/search-id" element={<SearchById />} />
              <Route path="/arrears" element={<ArrearsList />} />
              <Route path="/export" element={<ExportToExcel />} />
              <Route path="/add-course" element={<AddNewCourse />} />
              <Route path="/faculty" element={<FacultyDetails />} />
              <Route path="/student-details" element={<StudentDetails />} />
              <Route
                path="/exam_written_students"
                element={<ExamWrittenStudents />}
              />
              <Route
                path="/certificate_details"
                element={<CertificateDetails />}
              />
              <Route path="/add_exam_student" element={<AddExamStudent />} />

              <Route path="/logout" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
    </Router>
  );
};

export default App;