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
  });

  const [searchReg, setSearchReg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [searchCourse, setSearchCourse] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // 🔔 Toast
  const [toast, setToast] = useState({ text: "", type: "" });

  const showToast = (text, type = "success", timeout = 3000) => {
    setToast({ text, type });
    if (timeout) {
      setTimeout(() => setToast({ text: "", type: "" }), timeout);
    }
  };

  // 🔄 FETCH DATA
  useEffect(() => {
    fetchStudents();

    API("/courses/", "GET")
      .then((res) => setAllCourses(res || []))
      .catch(() => showToast("Failed to fetch courses", "danger"));
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API(`/students/?t=${Date.now()}`, "GET");
      setStudents(res || []);
    } catch {
      showToast("Failed to fetch students", "danger");
    }
  };

  // 🔍 Filter reg nos
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
    });

    setSearchReg(reg);
    setShowDropdown(false);
    setSearchCourse("");
  };

  // 🔍 Filter courses
  const filteredCourses = allCourses.filter((c) =>
    c.name.toLowerCase().includes(searchCourse.toLowerCase())
  );

  const handleExamCourseSelect = (courseName) => {
    const reg = fields.regNo;
    const stu = students.find((s) => String(s.regno) === String(reg));

    let courses = (stu?.Exam_Course || "").split(",").map((s) => s.trim());
    const idx = courses.findIndex(
      (c) => c.toLowerCase() === courseName.toLowerCase()
    );

    if (idx !== -1) {
      let halls = (stu?.hallticket_no || "").split(",");
      let dates = (stu?.Exam_Date || "").split(",");

      setFields((prev) => ({
        ...prev,
        Exam_Course: courseName,
        hallticket_no: halls[idx] || "",
        Exam_Date: dates[idx] || "",
      }));
    } else {
      setFields((prev) => ({
        ...prev,
        Exam_Course: courseName,
        hallticket_no: "",
        Exam_Date: "",
      }));
    }

    setSearchCourse(courseName);
    setShowCourseDropdown(false);
  };

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  // ✅ FIXED UPDATE FUNCTION
  const handleUpdateAll = async () => {
    if (!fields.regNo || !fields.Exam_Course) {
      showToast("Select Reg No and Exam Course", "warning");
      return;
    }

    const student = students.find(
      (s) => String(s.regno) === String(fields.regNo)
    );

    if (!student) {
      showToast("Student not found", "danger");
      return;
    }

    const payload = {
      course: fields.Exam_Course,
      hallticket_no: fields.hallticket_no || null,
      Exam_Date: fields.Exam_Date || null,
    };

    try {
      // 🔥 CORRECT API CALL
      await API(
        `/students/${student.id}/update_exam_course/`,
        "PATCH",
        payload
      );

      await fetchStudents();
      showToast("Exam details updated successfully", "success");

      setFields({
        regNo: "",
        Exam_Course: "",
        name: "",
        date_of_joining: "",
        hallticket_no: "",
        Exam_Date: "",
      });

      setSearchReg("");
      setSearchCourse("");
      setShowDropdown(false);
      setShowCourseDropdown(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to update exam details", "danger");
    }
  };

  return (
    <div className="container" style={{ alignItems: "center", paddingLeft: "140px" }}>
      {/* TOAST */}
      {toast.text && (
        <div className={`app-toast ${toast.type}`}>
          <i
            className={`bi ${toast.type === "success"
                ? "bi-check-circle-fill"
                : toast.type === "danger"
                  ? "bi-x-circle-fill"
                  : toast.type === "warning"
                    ? "bi-exclamation-triangle-fill"
                    : "bi-info-circle-fill"
              }`}
          />
          <span>{toast.text}</span>
          <button onClick={() => setToast({ text: "", type: "" })}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <div className="card rounded-3" style={{ width: "1000px" }}>
        <div className="card-header bg-primary text-white text-center">
          <h5 className="mb-0">Add / Update Exam Details</h5>
        </div>

        <div className="card-body row g-5 px-5">
          <div className="col-md-6 mt-0" style={{ paddingLeft: "100px" }}>
            {/* Reg No */}
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
                style={{ width: "300px" }}
              />

              {showDropdown && searchReg && (
                <ul
                  className="list-group"
                  style={{
                    position: "absolute",
                    width: "100%",
                    zIndex: 100,
                    maxHeight: "180px",
                    overflowY: "auto",
                  }}
                >
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

            {/* Course */}
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
                style={{ width: "300px" }}
              />

              {showCourseDropdown && searchCourse && (
                <ul
                  className="list-group"
                  style={{
                    position: "absolute",
                    width: "100%",
                    zIndex: 200,
                    maxHeight: "180px",
                    overflowY: "auto",
                  }}
                >
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
              style={{ width: "300px" }}
            />
          </div>

          <div className="col-md-6 mt-0" style={{ paddingLeft: "80px" }}>
            <label>Name:</label>
            <input
              className="form-control bg-light"
              readOnly
              value={fields.name}
              style={{ width: "300px" }}
            />

            {/* ⭐ updated date input */}
            <label className="mt-3">Exam Date:</label>
            <input
              type="date"
              className="form-control"
              name="Exam_Date"
              value={fields.Exam_Date}
              onChange={(e) => {
                let v = e.target.value;
                const parts = v.split("-");
                if (parts[0].length > 4) {
                  parts[0] = parts[0].slice(0, 4);
                  v = parts.join("-");
                }
                setFields((prev) => ({ ...prev, Exam_Date: v }));
              }}
              style={{ width: "300px" }}
            />

            <button className="btn btn-success mt-5" onClick={handleUpdateAll}>
              Add Exam Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
