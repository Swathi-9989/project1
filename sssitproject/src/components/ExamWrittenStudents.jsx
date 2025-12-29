import React, { useEffect, useState } from "react";
import API from "../api";

export default function ExamWrittenStudents() {
  const [students, setStudents] = useState([]);
  const [examDate, setExamDate] = useState("");
  const [examStudents, setExamStudents] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [searchCourse, setSearchCourse] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  useEffect(() => {
    API("/courses/", "GET")
  .then((data) => setAllCourses(data))
  .catch(err => console.error("Courses fetch failed", err));
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredCourses = allCourses.filter((c) =>
    c.name.toLowerCase().includes(searchCourse.toLowerCase())
  );
  const handleCourseSelect = (courseName) => {
    setEditForm((prev) => ({
      ...prev,
      exam_course: courseName,
    }));

    setSearchCourse(courseName);
    setShowCourseDropdown(false);
  };


  // 🔽 Universal Excel Export Function
  const exportToExcel = async (columns, rows, fileName = "export.xlsx") => {
    try {
      const response = await fetch(`${BASE_URL}/export-excel/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns, rows }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };


  useEffect(() => {
    API("/students/", "GET")
    .then((data) => setStudents(data))
    .catch(err => console.error("Students fetch failed", err));
  }, []);  

  useEffect(() => {
    if (!examDate) {
      setShowTable(false);
      setExamStudents([]);
      return;
    }

    let result = [];

    students.forEach((s) => {
      const courses = (s.Exam_Course || "").split(",").map((c) => c.trim());
      const halls = (s.hallticket_no || "").split(",").map((h) => h.trim());
      const dates = (s.Exam_Date || "").split(",").map((d) => d.trim());

      courses.forEach((course, idx) => {
        if (!course) return;

        const row = {
          hallticket_no: halls[idx] || "",
          regNo: s.regno,
          studentName: s.studentname,
          exam_course: course,
          examDate: dates[idx] || "",
          index: idx,
        };

        if (row.examDate === examDate) result.push(row);
      });
    });

    setExamStudents(result);
    setShowTable(true);
    setCurrentPage(1);
  }, [students, examDate]);

  const trimYear = (value) => {
    if (!value) return value;
    const p = value.split("-");
    p[0] = p[0].slice(0, 4);
    return p.join("-");
  };

  const deleteExamByReg = async (regNo, examIndex) => {
    try {
      const student = students.find((s) => s.regno === regNo);
      if (!student) return;

      const hallArr = (student.hallticket_no || "").split(",");
      const courseArr = (student.Exam_Course || "").split(",");
      const dateArr = (student.Exam_Date || "").split(",");
      const certArr = (student.Certificate_status || "").split(",");
      const issuedArr = (student.Issued_status || "").split(",");

      hallArr.splice(examIndex, 1);
      courseArr.splice(examIndex, 1);
      dateArr.splice(examIndex, 1);
      certArr.splice(examIndex, 1);
      issuedArr.splice(examIndex, 1);

      await API(`/students/${student.id}/`, "PATCH", {
        hallticket_no: hallArr.join(","),
        Exam_Course: courseArr.join(","),
        Exam_Date: dateArr.join(","),
        Certificate_status: certArr.join(","),
        Issued_status: issuedArr.join(","),
      });
 

      const res = await API("/students/", "GET");
      setStudents(res.data);

    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // PAGINATION LOGIC
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = examStudents.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(examStudents.length / rowsPerPage);

  const getPageNumbers = () => {
    let pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (currentPage > 4) pages.push("...");
      if (currentPage > 3 && currentPage < totalPages - 2)
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleReset = () => {
    setExamDate("");
    setShowTable(false);
    setExamStudents([]);
    setCurrentPage(1);
  };

  // 🔽 EXPORT EXACT TABLE USING UNIVERSAL EXPORT SYSTEM
  const handleExportExcel = () => {
    // Shape rows exactly like table display
    const rowsWithHeadings = examStudents.map((item, index) => ({
      "S.No": index + 1,
      "H.No": item.hallticket_no,
      "Reg No": item.regNo,
      "Student Name": item.studentName,
      "Subject": item.exam_course,
      "Signature": "",
      "Remarks": ""
    }));

    exportToExcel(
      [
        "S.No",
        "H.No",
        "Reg No",
        "Student Name",
        "Subject",
        "Signature",
        "Remarks"
      ],
      rowsWithHeadings,
      "ExamWrittenStudents.xlsx"
    );
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRowData, setEditRowData] = useState(null);

  const [editForm, setEditForm] = useState({
    hallticket_no: "",
    exam_course: "",
    examDate: "",
  });


  const handleSaveEdit = async () => {
    try {
      const student = students.find(
        (st) => st.regno === editRowData.regNo
      );
      if (!student) return;

      const hallArr = (student.hallticket_no || "").split(",");
      const courseArr = (student.Exam_Course || "").split(",");
      const dateArr = (student.Exam_Date || "").split(",");

      hallArr[editRowData.index] = editForm.hallticket_no;
      courseArr[editRowData.index] = editForm.exam_course;
      dateArr[editRowData.index] = editForm.examDate;

      await API(`/students/${student.id}/`, "PATCH", {
        hallticket_no: hallArr.join(","),
        Exam_Course: courseArr.join(","),
        Exam_Date: dateArr.join(","),
      });

      const res = await API("/students/", "GET");
      setStudents(res.data);

      setEditModalOpen(false);
      setEditRowData(null);
    } catch (err) {
      console.error("Edit failed", err);
    }
  };
  return (
    <div className="container">
      <div className="card rounded-3 overflow-hidden">
        <div className="card-header bg-primary text-white text-center">
          <h5 className="mb-0">Exam Written Students</h5>
        </div>

        <div className="card-body d-flex flex-column align-items-center">

          {/* Date + Reset Button */}
          <div className="d-flex gap-3">
            <input
              type="date"
              className="form-control"
              value={examDate}
              onChange={(e) => setExamDate(trimYear(e.target.value))}
              style={{ width: "250px" }}
            />

            <button className="custom-btn custom-btn-red rounded-3 btn-sm" onClick={handleReset}>
              Reset
            </button>

            <button
              className="custom-btn custom-btn-green btn-sm ms-2"
              onClick={handleExportExcel}
            >
              Export To Excel
            </button>
          </div>

          {/* Show table only if date selected */}
          {showTable && examStudents.length > 0 && (
            <>
              <table className="text-center mt-2 w-75 table-bordered table-sm ">
                <thead className="table-primary">
                  <tr>
                    <th>S.No</th>
                    <th>H.No</th>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th >Subject</th>
                    <th >Signature</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody >
                  {currentRows.map((s, index) => (
                    <tr key={index} >
                      <td >{indexOfFirstRow + index + 1}</td>
                      <td >{s.hallticket_no}</td>
                      <td >{s.regNo}</td>
                      <td >{s.studentName}</td>
                      <td >{s.exam_course}</td>
                      <td></td>
                      <td ></td>

                      <td>
                        <i
                          className="bi bi-pencil text-primary me-3"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setEditRowData(s);
                            setEditForm({
                              hallticket_no: s.hallticket_no,
                              exam_course: s.exam_course,
                              examDate: s.examDate,
                            });

                            setSearchCourse(s.exam_course); // ⭐ important
                            setShowCourseDropdown(false);
                            setEditModalOpen(true);
                          }}

                        ></i>
                          {confirmDeleteIndex === index ? (
                            <>
                              <button
                                className="custom-btn custom-btn-red btn-sm me-2"
                                onClick={() => {
                                  deleteExamByReg(s.regNo, s.index);
                                  setConfirmDeleteIndex(null);
                                }}
                              >
                                Y
                              </button>

                              <button
                                className="custom-btn custom-btn-green btn-sm "
                                onClick={() => setConfirmDeleteIndex(null)}
                              >
                                N
                              </button>
                            </>
                          ) : (
                            <i
                              className="bi bi-trash text-danger"
                              style={{ cursor: "pointer" }}
                              onClick={() => setConfirmDeleteIndex(index)}
                            ></i>
                          )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {editModalOpen && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog modal-dialog-centered" style={{width:"400px",height:"200px"}}>
                    <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">

                      <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Edit Exam Details</h5>
                        <button
                          className="btn-close btn-close-white"
                          onClick={() => setEditModalOpen(false)}
                        ></button>
                      </div>

                      <div className="modal-body">

                        <div className="mb-2">
                          <label className="fw-bold">Hall Ticket No</label>
                          <input
                            className="form-control"
                            value={editForm.hallticket_no}
                            onChange={(e) =>
                              setEditForm({ ...editForm, hallticket_no: e.target.value })
                            }
                          />
                        </div>

                        <div className="mb-2">
                          <label className="fw-bold">Subject</label>

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
                              <ul
                                className="list-group"
                                style={{
                                  position: "absolute",
                                  width: "100%",
                                  zIndex: 1055,   
                                  maxHeight: "180px",
                                  overflowY: "auto",
                                }}
                              >
                                {filteredCourses.length > 0 ? (
                                  filteredCourses.map((c) => (
                                    <li
                                      key={c.id}
                                      className="list-group-item list-group-item-action"
                                      style={{ cursor: "pointer" }}
                                      onClick={() => handleCourseSelect(c.name)}
                                    >
                                      {c.name}
                                    </li>
                                  ))
                                ) : (
                                  <li className="list-group-item text-muted">
                                    No courses found
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>

                        </div>

                        <div className="mb-2">
                          <label className="fw-bold">Exam Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={editForm.examDate}
                            onChange={(e) =>
                              setEditForm({ ...editForm, examDate: e.target.value })
                            }
                          />
                        </div>

                      </div>

                      <div className="modal-footer d-flex justify-content-between">
                        <button
                          className="custom-btn custom-btn-red"
                          onClick={() => setEditModalOpen(false)}
                        >
                          Cancel
                        </button>

                        <button
                          className="custom-btn custom-btn-green"
                          onClick={handleSaveEdit}
                        >
                          Save Changes
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}


              {/* PAGINATION - SAME AS Export_excel */}
              {/* PAGINATION — show ONLY when more than 10 rows */}
              {examStudents.length > rowsPerPage && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-3">

                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  {getPageNumbers().map((page, i) => (
                    <button
                      key={i}
                      className={
                        page === currentPage
                          ? "btn btn-primary rounded-circle d-flex justify-content-center align-items-center mx-1"
                          : page === "..."
                            ? "btn btn-light rounded-circle d-flex justify-content-center align-items-center disabled mx-0"
                            : "btn btn-outline-primary rounded-circle d-flex justify-content-center align-items-center mx-1"
                      }
                      style={{
                        width: "20px",
                        height: "20px",
                        fontSize: "10px",
                        padding: 0
                      }}
                      onClick={() => page !== "..." && setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>

                </div>
              )}

            </>
          )}

          {/* No data message */}
          {showTable && examStudents.length === 0 && (
            <p className="text-danger mt-3">No students found for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}