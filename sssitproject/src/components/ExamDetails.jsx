import React, { useEffect, useState } from "react";
import API from "../api";

export default function AddExamStudent() {
  const [students, setStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);

  const [fields, setFields] = useState({
    regNo: "",
    Exam_Course: "",
    name: "",
    date_of_joining: "",
    hallticket_no: "",
    Exam_Date: "",
    certReceived: "",
  });

  const [searchReg, setSearchReg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [searchCourse, setSearchCourse] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Fetch students & courses
  useEffect(() => {
    fetchStudents();
  
    const fetchCourses = async () => {
      try {
        const data = await API("/courses/", "GET");
        setAllCourses(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
  
    fetchCourses(); // ✅ Call it
  }, []);
  

  const fetchStudents = async () => {
    try {
      const data = await API(`/students/?t=${Date.now()}`, "GET");
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };
  

  // Filter reg nos
  const filteredRegNos = students.filter((s) =>
    String(s.regno).includes(searchReg)
  );

  const handleRegSelect = (reg) => {
    const stu = students.find((s) => String(s.regno) === String(reg));

    setFields({
      regNo: reg,
      Exam_Course: "",
      name: stu?.studentname || "",
      date_of_joining: stu?.date_of_joining || "",
      hallticket_no: "",
      Exam_Date: "",
      certReceived: "",
    });

    setSearchReg(reg);
    setShowDropdown(false);
    setSearchCourse("");
  };

  // Filter courses
  const filteredCourses = allCourses.filter((c) =>
    c.name.toLowerCase().includes(searchCourse.toLowerCase())
  );

  // When user selects EXAM COURSE
  const handleExamCourseSelect = (courseName) => {
    const reg = fields.regNo;
    const stu = students.find((s) => String(s.regno) === String(reg));

    // Check if selected course already exists inside CSV
    let courses = (stu?.Exam_Course || "").split(",").map(s => s.trim());

    const idx = courses.findIndex(
      (c) => c.toLowerCase() === courseName.toLowerCase()
    );

    if (idx !== -1) {
      let halls = (stu?.hallticket_no || "").split(",");
      let dates = (stu?.Exam_Date || "").split(",");
      let stats = (stu?.Certificate_status || "").split(",");

      setFields((prev) => ({
        ...prev,
        Exam_Course: courseName,
        hallticket_no: halls[idx] || "",
        Exam_Date: dates[idx] || "",
        certReceived: stats[idx] || "",
      }));
    } else {
      // New course → empty values
      setFields((prev) => ({
        ...prev,
        Exam_Course: courseName,
        hallticket_no: "",
        Exam_Date: "",
        certReceived: "",
      }));
    }

    setSearchCourse(courseName);
    setShowCourseDropdown(false);
  };

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  // ⭐ UPDATE / ADD exam course + hall + date + status
  const handleUpdateAll = async () => {
    if (!fields.regNo || !fields.Exam_Course) {
      alert("Select Reg No and Exam Course");
      return;
    }

    const student = students.find(
      (s) => String(s.regno) === String(fields.regNo)
    );

    if (!student) {
      alert("Student not found");
      return;
    }

    const payload = {
      course: fields.Exam_Course,
      hallticket_no: fields.hallticket_no || null,
      Exam_Date: fields.Exam_Date || null,
      Certificate_status: fields.certReceived || null,
    };

    try {
      await API(`/students/${student.id}/update_exam_course/`, "PATCH", payload);

      await fetchStudents();
      alert("Exam course updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed. Check console.");
    }
  };

  return (
    <div className="container">
      <div className="card rounded-4">
        <div className="card-header bg-primary text-white text-center">
          <h3>Add / Update Exam Details</h3>
        </div>

        <div className="card-body row g-3">
          <div className="col-md-6">

            <label>Reg No:</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Reg No"
                value={searchReg}
                onChange={(e) => {
                  setSearchReg(e.target.value);
                  setShowDropdown(true);
                }}
              />

              {showDropdown && searchReg && (
                <ul className="list-group"
                  style={{ position: "absolute", width: "100%", zIndex: 100, maxHeight: "180px", overflowY: "auto" }}>

                  {[...new Set(filteredRegNos.map((s) => s.regno))].map((reg) => (
                    <li
                      key={reg}
                      className="list-group-item"
                      onClick={() => handleRegSelect(reg)}
                    >
                      {reg}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="mt-3">Exam Course:</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search Exam Course"
                value={searchCourse}
                onChange={(e) => {
                  setSearchCourse(e.target.value);
                  setShowCourseDropdown(true);
                }}
              />

              {showCourseDropdown && searchCourse && (
                <ul className="list-group"
                  style={{ position: "absolute", width: "100%", zIndex: 200, maxHeight: "180px", overflowY: "auto" }}>

                  {filteredCourses.map((c) => (
                    <li
                      key={c.id}
                      className="list-group-item"
                      onClick={() => handleExamCourseSelect(c.name)}
                    >
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="mt-3">Hall Ticket No:</label>
            <input
              className="form-control"
              name="hallticket_no"
              value={fields.hallticket_no}
              onChange={handleChange}
            />

            <label className="mt-3">Exam Date:</label>
            <input
              type="date"
              className="form-control"
              name="Exam_Date"
              value={fields.Exam_Date}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label>Name:</label>
            <input className="form-control bg-light" readOnly value={fields.name} />

            <label className="mt-3">Date of Joining:</label>
            <input
              className="form-control bg-light"
              readOnly
              value={fields.date_of_joining}
            />

            <label className="mt-3 d-block">Certificate Received:</label>

            <input
              type="radio"
              name="certReceived"
              value="Yes"
              checked={fields.certReceived === "Yes"}
              onChange={handleChange}
            /> Yes

            <input
              type="radio"
              className="ms-3"
              name="certReceived"
              value="No"
              checked={fields.certReceived === "No"}
              onChange={handleChange}
            /> No
            &nbsp;&nbsp;&nbsp;&nbsp;

            <button
              className="btn fw-semibold rounded-3 btn-sm mt-0"
              style={{ border: "2px solid #12c31bff", color: "#1bcd30ff" }}
              onClick={handleUpdateAll}
            >
              Save / Update Exam Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
