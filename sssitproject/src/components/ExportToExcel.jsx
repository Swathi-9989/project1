import React, { useState, useEffect } from "react";
import API from "../api";
import axios from "axios";


function Export_excel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState("");

  const [startDateError, setStartDateError] = useState(false);
  const [endDateError, setEndDateError] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [coursesData, studentsData, feesData] = await Promise.all([
          API("/courses/", "GET"),
          API("/students/", "GET"),
          API("/fees/", "GET"),
        ]);
    
        setCourses(coursesData.map((c) => c.name));
        setStudents(studentsData);
        setFees(feesData);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchAll();
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const filtered = students.filter((s) => {
      return (
        s.date_of_joining >= startDate &&
        s.date_of_joining <= endDate &&
        (!selectedCourse || s.course === selectedCourse)
      );
    });

    const merged = filtered.map((student) => {
      const receipts = fees.filter((r) => r.student === student.id);
      const latest = receipts.sort((a, b) => b.id - a.id)[0] || {};

      return {
        ...student,
        paid_fees: latest.paid_fees ?? 0,
        due_fees: latest.due_fees ?? student.total_fees ?? 0,
        total_fees: student.total_fees ?? 0,
      };
    });

    merged.sort((a, b) => {
      if (!a.date_of_joining) return 1;
      if (!b.date_of_joining) return -1;
      return new Date(b.date_of_joining) - new Date(a.date_of_joining);
    });

    setFilteredStudents(merged);
    setError(merged.length === 0 ? "No students found for this filter." : "");
    setCurrentPage(1);
  }, [startDate, endDate, selectedCourse, students, fees]);


const handleExport = async () => {
  try {
    const columns = [
      "S.No",
      "regno",
      "studentname",
      "DOJ",
      "course",
      "contact",
      "email",
    ];

    const rows = filteredStudents.map((s, index) => ({
      "S.No": index + 1,
      regno: s.regno,
      studentname: s.studentname,
      DOJ: s.date_of_joining,
      course: s.course,
      contact: s.contact,
      email: s.email,
    }));

    const response = await axios.post(
      "/api/export-excel/",
      { columns, rows },
      {
        responseType: "arraybuffer",
        transformResponse: [(data) => data], // 🔑 CRITICAL
      }
    );

    console.log("DATA TYPE:", response.data.constructor.name);
    console.log("BYTE LENGTH:", response.data.byteLength);

    const blob = new Blob(
      [response.data],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Filtered_Students_Report.xlsx";

    document.body.appendChild(a);
    a.click();

    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
  }
};

  const ReadMoreLetters = ({ text, maxLength = 80 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!text) return "-";

    const isLong = text.length > maxLength;
    const displayText = expanded
      ? text
      : text.slice(0, maxLength) + (isLong ? "..." : "");

    return (
      <div style={{ maxWidth: "200px", whiteSpace: "normal", wordBreak: "break-word" }}>
        <span>{displayText}</span>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              border: "none",
              background: "none",
              color: "#0d6efd",
              cursor: "pointer",
              padding: 0,
              marginLeft: "5px",
              fontSize: "12px",
              fontWeight: 600
            }}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>
    );
  };

  const trimYear = (value) => {
    if (!value) return value;
    const p = value.split("-");
    p[0] = p[0].slice(0, 4);
    return p.join("-");
  };


  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCourse("");
    setFilteredStudents([]);
    setError("");
    setStartDateError(false);
    setEndDateError(false);
    setCurrentPage(1);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredStudents.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);

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

  return (
    <div className="container-fluid px-2">
      <div className="card shadow border-0 rounded-3">

        <div className="card-header bg-primary text-white text-center  rounded-top">
          <h5 className="mb-0">Export Students to Excel</h5>
        </div>

        <div className="card-body">

          {/* FILTER SECTION */}
          <div className="d-flex flex-wrap justify-content-center gap-4 mt-0">

            {/* START DATE */}
            <div className="d-flex align-items-center gap-2 ">
              <label className="fw-semibold mb-0">Start Date:</label>
              <div className="d-flex flex-column">
                <input
                  type="date"
                  className={`form-control shadow-sm ${startDateError ? "is-invalid" : ""}`}
                  style={{ width: "200px" }}
                  value={startDate ? startDate.slice(0, 10) : ""}
                  onChange={(e) => {
                    setStartDate(trimYear(e.target.value));
                    setStartDateError(false);
                  }}

                />
                {startDateError && <small className="text-danger fw-bold">Required</small>}
              </div>
            </div>

            {/* END DATE */}
            <div className="d-flex align-items-center gap-2">
              <label className="fw-semibold mb-0 mt-0">End Date:</label>
              <div className="d-flex flex-column">
                <input
                  type="date"
                  className={`form-control shadow-sm ${endDateError ? "is-invalid" : ""}`}
                  style={{ width: "200px" }}
                  value={endDate ? endDate.slice(0, 10) : ""}
                  onChange={(e) => {
                    setEndDate(trimYear(e.target.value));
                    setEndDateError(false);
                  }}
                />
                {endDateError && <small className="text-danger fw-bold">Required</small>}
              </div>
            </div>

            {/* COURSE */}
            <div className="d-flex align-items-center gap-2">
              <label className="fw-semibold mb-0">Course:</label>
              <select
                className="form-select shadow-sm"
                style={{ width: "200px" }}
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">All</option>
                {courses.map((c, i) => (
                  <option key={i}>{c}</option>
                ))}
              </select>
            </div>

            {/* BUTTONS */}
            <div className="d-flex align-items-end gap-3">
              <button className="custom-btn  custom-btn-green btn-sm px-4" onClick={handleExport}>
                Excel
              </button>

              <button className="custom-btn  custom-btn-red btn-sm px-4" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && <p className="text-center text-danger fw-bold mt-2">{error}</p>}

          {/* TABLE WITHOUT SCROLL */}
          <div className="tablecss" >
            <table className="table table-bordered compact-table mt-1 mb-0 table-sm me-0 ms-0 " >
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg No</th>
                  <th>Father Name</th>
                  <th>Faculty</th>
                  <th>Course</th>
                  <th>Mobile</th>
                  <th>Joining Date</th>
                  <th>Batch Started</th>
                  <th>Time</th>
                  <th>TotalFee</th>
                  <th>PaidFee</th>
                  <th>DueFee</th>
                  <th className="remarks-col">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {currentRecords.map((s, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedRow(i)}
                    className={`text-center ${selectedRow === i ? "row-selected" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{s.studentname}</td>
                    <td>{s.regno}</td>
                    <td>{s.father_name}</td>
                    <td>{s.facultyname}</td>
                    <td>{s.course}</td>
                    <td>{s.contact}</td>
                    <td>{formatDate(s.date_of_joining)}</td>
                    <td>{formatDate(s.batch_started_date)}</td>
                    <td>
                      {s.batchtime?.split("-")[0]}
                      {s.batchtime?.includes("-") && (
                        <>
                          -<br />
                          {s.batchtime.split("-")[1]}
                        </>
                      )}
                    </td>
                    <td className="text-primary">₹{s.total_fees}</td>
                    <td className="text-success">₹{s.paid_fees}</td>
                    <td className="text-danger">₹{s.due_fees}</td>
                    <td className="remarks-cell">
                      <ReadMoreLetters text={s.reason} maxLength={25} />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredStudents.length > 10 && (
            <div className="d-flex justify-content-center align-items-center gap-1 mt-0 mb-0">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <i className="bi bi-chevron-left "></i>
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
        </div>
      </div>
    </div>
  );
}

export default Export_excel;