import { useState, useEffect } from "react";
import API from "../api";
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function ArrearsList() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [students, setStudents] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [arrearsData, setArrearsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;



  const fmt = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [studentsData, feesData] = await Promise.all([
        API("/students/"),
        API("/fees/"),
      ]);
  
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setReceipts(Array.isArray(feesData) ? feesData : []);
    } catch (err) {
      console.error("Failed to load arrears data:", err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) {
      setArrearsData([]);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const byStudent = receipts.reduce((acc, r) => {
      const sid = r.student;
      if (!acc[sid]) acc[sid] = [];
      acc[sid].push(r);
      return acc;
    }, {});

    const rows = [];

    for (const student of students) {
      const sReceipts = byStudent[student.id] || [];
      let total_fees = Number(student.total_fees);

      if (sReceipts.length > 0) {
        const sorted = [...sReceipts].sort((a, b) => b.id - a.id);
        total_fees = Number(sorted[0].total_fees);
      }

      const paid = sReceipts.reduce(
        (sum, r) => sum + (Number(r.amount) || 0),
        0
      );

      const due = Math.max(total_fees - paid, 0);
      if (due <= 0) continue;

      const joinDate = new Date(student.date_of_joining);
      if (joinDate < start || joinDate > end) continue;

      rows.push({
        regno: student.regno,
        studentname: student.studentname,
        email: student.email,
        course: student.course,
        facultyname: student.facultyname,
        batchtime: student.batchtime,
        date_of_joining: student.date_of_joining,
        total_fees,
        paid,
        due,
        contact: student.contact,
      });
    }

    rows.sort((a, b) => {
      if (!a.date_of_joining) return 1;
      if (!b.date_of_joining) return -1;
      return new Date(b.date_of_joining) - new Date(a.date_of_joining);
    });

    setArrearsData(rows);
    setCurrentPage(1);
  }, [receipts, students, startDate, endDate]);


  const trimYear = (value) => {
    if (!value) return value;

    const parts = value.split("-");
    parts[0] = parts[0].slice(0, 4);  
    return parts.join("-");
  };


  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setArrearsData([]);
    setCurrentPage(1);
  };

  const handlePrint = () => window.print();

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = arrearsData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(arrearsData.length / recordsPerPage);

  const getPageNumbers = () => {
    let pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);

      if (currentPage > 4) pages.push("...");

      if (currentPage > 3 && currentPage < totalPages - 2) {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }

      if (currentPage < totalPages - 3) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="container">
      <div className="card shadow-lg ">
        <div className="card-header text-white text-center py-2 bg-primary">
          <h5 className="mb-0">Arrears List</h5>
        </div>

        <div className="card-body mt-0">
          <div className="row gap-1 mb-0 align-items-center justify-content-center">
            <div className="col-sm-4 d-flex">
              <label className=" fw-semibold me-3 mt-1">Start Date:</label>
              <input
                type="date"
                className="form-control shadow-sm"
                style={{ width: "200px" }}
                value={startDate}
                onChange={(e) => setStartDate(trimYear(e.target.value))}
              />

            </div>

            <div className="col-sm-4 d-flex ">
              <label className="fw-semibold d-flex me-3 mt-1 ">End Date:</label>
              <input
                type="date"
                className="form-control shadow-sm"
                style={{ width: "200px" }}
                value={endDate}
                onChange={(e) => setEndDate(trimYear(e.target.value))}
              />

            </div>

            <div className="col-sm-1 d-flex">
              <button
                className="custom-btn custom-btn-blue"
                style={{ width: "100px" }}
                onClick={handlePrint}
              >
                Print
              </button>
            </div>

            <div className="col-sm-1 d-flex">
              <button
                className="custom-btn custom-btn-red"
                style={{ width: "100px" }}
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>

          <hr />

          {startDate && endDate ? (
            <>
              

              <div className="table-responsive compact-table">
                <table
                  className="table table-hover table-bordered mt-0 table-sm text-center mb-0"
                  style={{ whiteSpace: "nowrap" }}

                >
                  <thead>
                    <tr>
                      <th>S.no</th>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Contact</th>
                      <th>Faculty</th>
                      <th>Join Date</th>
                      <th>Batch Time</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Due</th>
                    </tr>
                  </thead>

                  <tbody >
                    {currentRecords.length > 0 ? (
                      currentRecords.map((s, i) => (
                        <tr key={i}>
                          <td>{indexOfFirstRecord + i + 1}</td>
                          <td>{s.regno}</td>
                          <td>{s.studentname}</td>
                          <td>{s.course}</td>
                          <td>{s.contact}</td>
                          <td>{s.facultyname}</td>
                          <td>{fmt(s.date_of_joining)}</td>
                          <td>{s.batchtime}</td>
                          <td>₹{s.total_fees}</td>
                          <td className="text-success fw-semibold">₹{s.paid}</td>
                          <td className="text-danger fw-bold">₹{s.due}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-muted">
                          No students with pending fees in this date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              {arrearsData.length > 10 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-0">
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
          ) : (
            <div style={{ height: "25px" }}>
              <p className="text-center text-muted">
                Please select the Start Date and End Date to view Arrears.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}