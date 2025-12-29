import { useState, useEffect } from "react";
import API from "../api";

/* ---------- Read More Component ---------- */
const ReadMoreLetters = ({ text, maxLength = 80 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return "-";

  const isLong = text.length > maxLength;
  const displayText = expanded
    ? text
    : text.slice(0, maxLength) + (isLong ? "..." : "");

  return (
    <div style={{ maxWidth: "200px", wordBreak: "break-word" }}>
      <span>{displayText}</span>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          style={{
            border: "none",
            background: "none",
            color: "#0d6efd",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 600,
            marginLeft: "5px",
          }}
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
};

/* ---------- Main Component ---------- */
export default function SearchById() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    const fetchStudentsAndFees = async () => {
      try {
        const studentsRes = await API("/students/", "GET");
        const feesRes = await API("/fees/", "GET");

        const merged = studentsRes.map((student) => {
          const receipts = feesRes.filter(
            (r) => r.student === student.id
          );
          const latest = receipts.sort((a, b) => b.id - a.id)[0] || {};

          return {
            ...student,
            total_fees: student.total_fees ?? 0,
            paid_fees: latest.paid_fees ?? 0,
            due_fees:
              latest.due_fees ??
              (student.total_fees ?? 0) - (latest.paid_fees ?? 0),
            receipt_number: latest.receipt_no ?? "-",
            dob: formatDate(student.dob),
            date_of_joining: formatDate(student.date_of_joining),
            batch_started_date: formatDate(student.batch_started_date),
          };
        });

        setStudents(merged);
      } catch (err) {
        alert("Backend not running");
      }
    };

    fetchStudentsAndFees();
  }, []);

  /* ---------- SEARCH ---------- */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.trim().toLowerCase();

    const filtered = students.filter((s) => {
      return (
        s.regno?.toString().toLowerCase() === q ||
        s.studentname?.toLowerCase() === q ||
        s.contact?.toLowerCase() === q ||
        s.receipt_number?.toString().toLowerCase() === q
      );
    });

    setResults(filtered);
  }, [query, students]);

  return (
    <div style={{
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden"
    }}>
      <div className="card mt-0  w-100">
        <div className="card-header text-white text-center py-2 bg-primary">
          <h5 className="mb-0"> Search Students</h5>
        </div>

        <div className="card-body px-0 py-2">
          <div className="row justify-content-center mb-0">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control form-control shadow-sm border-primary rounded-3 "
                placeholder="🔍 Reg No / Name / Contact / Receipt No"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ height: '45px' }}
              />
            </div>
          </div>

          <h5 className="text-center text-danger fw-bold mb-1 mt-1 fs-6">
            {results.length
              ? `Showing ${results.length} Result${results.length > 1 ? "s" : ""}`
              : "No student found"}
          </h5>

          <div className="tablecss ">
            <table className="table table-bordered  table-sm">


              <thead
                className="table-primary text-center"
                style={{ fontSize: "8px", fontWeight: "bold" }}
              >
                <tr >
                  <th>Reg No</th>
                  <th>Student Name</th>
                  <th>Father Name</th>
                  <th>Faculty</th>
                  <th>Course</th>
                  <th>DOB</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Joining Date</th>
                  <th>Batch Date</th>
                  <th>Time</th>
                  <th>TotalFee</th>
                  <th>PaidFee</th>
                  <th>DueFee</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {results.map((s, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedRow(i)}
                    className={`text-center ${selectedRow === i ? "row-selected" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{s.regno}</td>
                    <td>{s.studentname}</td>
                    <td>{s.father_name}</td>
                    <td>{s.facultyname}</td>
                    <td>{s.course}</td>

                    <td>{s.dob}</td>
                    <td>{s.contact}</td>
                    <td>{s.email}</td>
                    <td>{s.date_of_joining}</td>
                    <td>{s.batch_started_date}</td>
                    <td>
                      {s.batchtime?.split("-")[0]}
                      {s.batchtime?.includes("-") && (
                        <>
                          -<br />
                          {s.batchtime.split("-")[1]}
                        </>
                      )}
                    </td>
                    <td className="text-primary fw-bold">₹{s.total_fees}</td>
                    <td className="text-success fw-bold">₹{s.paid_fees}</td>
                    <td className="text-danger fw-bold">₹{s.total_fees - s.paid_fees}</td>
                    <td className="remarks-col">
                      <ReadMoreLetters text={s.reason} maxLength={40} />
                    </td>

                  </tr>

                ))}


                {results.length === 0 && (
                  <tr>
                    <td colSpan="16" className="text-center text-muted ">
                      No student data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}