import React, { useState, useRef, useEffect } from "react";
import API from "../api";
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function StudentDetails() {
  const [regNo, setRegNo] = useState("");
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [breaks, setBreaks] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const [errors, setErrors] = useState({});
  const [regNoError, setRegNoError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const typingTimeoutRef = useRef(null);
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const loadBreaks = async (student) => {
    const data = await API(`/breaks/?student=${student.id}`);
    setBreaks(data);
  };

  const fetchList = async (value) => {
    try {
      const data = await API(`/students/?regno=${value}`);
      setRecords(data);

      if (data.length === 0) {
        setSelected(null);
        setBreaks([]);
        setRegNoError("No student found with this Registration No.");
        return;
      }

      setRegNoError("");

      if (data.length === 1) {
        setSelected(data[0]);
        await loadBreaks(data[0]);
        return;
      }

      setSelected(null);
      setBreaks([]);
    } catch {
      setRecords([]);
      setSelected(null);
      setBreaks([]);
      setRegNoError("No student found.");
    }
  };

  const handleRegNoChange = (value) => {
    setRegNo(value);
    setRegNoError("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!value.trim()) {
      setRecords([]);
      setSelected(null);
      setBreaks([]);
      return;
    }

    typingTimeoutRef.current = setTimeout(() => fetchList(value), 400);
  };

  const selectRecord = async (student) => {
    setSelected(student);
    await loadBreaks(student);
  };

  const reset = () => {
    setRegNo("");
    setRecords([]);
    setSelected(null);
    setBreaks([]);
    setFromDate("");
    setToDate("");
    setReason("");
    setErrors({});
    setEditMode(false);
    setEditId(null);
    setRegNoError("");
  };

  const submitBreak = async () => {
    let newErrors = {};

    if (!fromDate) newErrors.fromDate = "From date is required.";
    if (!toDate) newErrors.toDate = "To date is required.";

    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
      newErrors.toDate = "To date cannot be earlier than From date.";
    }

    if (!reason.trim()) newErrors.reason = "Reason is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      if (editMode) {
        await API(`/breaks/${editId}/`, "PUT", {
          student: selected.id,
          from_date: fromDate,
          to_date: toDate,
          reason,
        });
      } else {
        await API(`/breaks/`, "POST", {
          student: selected.id,
          from_date: fromDate,
          to_date: toDate,
          reason,
        });
      }

      await loadBreaks(selected);

      setFromDate("");
      setToDate("");
      setReason("");
      setEditMode(false);
      setEditId(null);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(
        err.response?.data?.detail ||
        "Failed to submit break. Please check input."
      );
    }

  };

  const startEdit = (b) => {
    setEditMode(true);
    setEditId(b.id);
    setFromDate(b.from_date);
    setToDate(b.to_date);
    setReason(b.reason);
  };

  const handleDelete = async (id) => {
    try {
      await API(`/breaks/${id}/`, "DELETE");
      await loadBreaks(selected);
    } catch {
      alert("Failed to delete break entry.");
    }
  };
  
  const trimYear = (value) => {
    if (!value) return value;
    const p = value.split("-");
    p[0] = p[0].slice(0, 4);
    return p.join("-");
  };


  return (
    <div className="container">
      <div className="card shadow-lg" style={{ borderRadius: "1rem" }}>
        <div className="card-header bg-primary text-white text-center">
          <h5 className="mb-0">Student Break Details</h5>
        </div>

        <div className="card-body p-3">

          {/* SEARCH */}
          <div
            className="d-flex justify-content-center align-items-center mb-2"
            style={{ gap: "15px" }}
          >
            <label className="fw-semibold text-primary mb-0">
              Registration No:
            </label>

            <input
              type="text"
              className="form-control rounded-3"
              style={{ width: "350px" }}
              placeholder="Enter Reg No"
              value={regNo}
              onChange={(e) => handleRegNoChange(e.target.value)}
            />

            {records.length > 1 && (
              <select
                className="form-select rounded-pill"
                style={{ width: "230px", textAlign: "center" }}
                onChange={(e) =>
                  selectRecord(
                    records.find((r) => r.id === Number(e.target.value))
                  )
                }
              >
                <option>Select Record</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.regno} — {r.course.toUpperCase()}
                  </option>
                ))}
              </select>
            )}

            <button
              className="custom-btn custom-btn-red"
              style={{ width: "130px" }}
              onClick={reset}
            >
              Reset
            </button>
          </div>

          {regNoError && (
            <p className="text-danger text-center mt-1">{regNoError}</p>
          )}

          {/* STUDENT DETAILS */}
          {selected && (
            <>
              <div className="border ps-5 bg-light shadow-sm mb-0">

                <div className="row">
                  <div className="col-sm-4">
                    <p>
                      <strong className="text-primary">Reg No:</strong>{" "}
                      {selected.regno}
                    </p>
                  </div>
                  <div className="col-sm-4">
                    <p>
                      <strong className="text-primary">Name:</strong>{" "}
                      {selected.studentname}
                    </p>
                  </div>
                  <div className="col-sm-4">
                    <p>
                      <strong className="text-primary">Course:</strong>{" "}
                      {selected.course}
                    </p>
                  </div>
                </div>

                <div className="row mt-0">
                  <div className="col-sm-4 mt-0">
                    <p>
                      <strong className="text-primary">Join Date:</strong>{" "}
                      {formatDate(selected.date_of_joining)}
                    </p>
                  </div>
                  <div className="col-sm-4">
                    <p>
                      <strong className="text-primary">Contact:</strong>{" "}
                      {selected.contact}
                    </p>
                  </div>
                  <div className="col-sm-4">
                    <p>
                      <strong className="text-primary">Email:</strong>{" "}
                      {selected.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* BREAK LIST */}
              <div className="border p-0 shadow-sm bg-white">
                <h6 className="text-danger fw-bold text-center">
                  Previous Break Details
                </h6>

                {breaks.length > 0 ? (
                  <table className="table table-sm table-bordered table-hover text-center">
                    <thead className="table-success">
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Reason/Remarks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {breaks.map((b) => (
                        <tr key={b.id}>
                          <td>{formatDate(b.from_date)}</td>
                          <td>{formatDate(b.to_date)}</td>

                          <td className="reason-cell">{b.reason}</td>

                          <td>
                            <i
                              className="bi bi-pencil text-success me-5"
                              style={{ fontSize: "20px", cursor: "pointer" }}
                              onClick={() => startEdit(b)}
                            ></i>

                            <i
                              className="bi bi-trash text-danger"
                              style={{ fontSize: "20px", cursor: "pointer" }}
                              onClick={() => {
                                setDeleteId(b.id);
                                setShowDeleteModal(true);
                              }}
                            ></i>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted text-center fst-italic">
                    No break records found.
                  </p>
                )}

                {/* BREAK FORM */}
                <div className="border p-0 rounded bg-light">
                  <h6 className="text-center fw-bold text-success h5">
                    {editMode ? "Edit Break" : "Add New Break"}
                  </h6>

                  <div className="d-flex align-items-start gap-3 mt-0">

                    <div>
                      <label className="me-2 ms-4 ">From:</label>
                      <input
                        type="date"
                        className="form-control d-inline-block me-5"
                        style={{ width: "160px" }}
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(trimYear(e.target.value));
                          setErrors({ ...errors, fromDate: "" });
                        }}
                      />
                      {errors.fromDate && (
                        <p className="text-danger small mt-1 text-center">{errors.fromDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="me-2 ms-4">To:</label>
                      <input
                        type="date"
                        className="form-control d-inline-block me-5"
                        style={{ width: "160px" }}
                        value={toDate}
                        onChange={(e) => {
                          setToDate(trimYear(e.target.value));
                          setErrors({ ...errors, toDate: "" });
                        }}
                      />
                      {errors.toDate && (
                        <p className="text-danger small mt-1 text-center">{errors.toDate}</p>
                      )}
                    </div>

                    <div className="d-flex">
                      <label className="me-2 mt-2 d-flex  ">Reason/Remarks:</label>
                      <input
                        type="text"
                        className="form-control d-flex mt-1"
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          setErrors({ ...errors, reason: "" });
                        }}
                      />
                      {errors.reason && (
                        <p className="text-danger small mt-1 text-center">{errors.reason}</p>
                      )}
                    </div>

                  </div>

                  <div className="d-flex justify-content-center   m-2">
                    <button className="custom-btn custom-btn-green me-4" onClick={submitBreak}>
                      {editMode ? "Update" : "Submit"}
                    </button>

                    <button
                      className="custom-btn custom-btn-red"
                      onClick={() => {
                        setEditMode(false);
                        setEditId(null);
                        setFromDate("");
                        setToDate("");
                        setReason("");
                        setErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox" style={{ width: "420px", height: "200px" }}>

              <div className="modal-header bg-danger">
                <h5 className="modal-title text-white text-center w-100">
                  Confirm Delete
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <p className="fw-semibold text-center h6">
                  Are you sure you want to delete this break entry?
                </p>
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="custom-btn custom-btn-blue"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="custom-btn custom-btn-red"
                  onClick={() => {
                    handleDelete(deleteId);
                    setShowDeleteModal(false);
                  }}
                >
                  Yes, Delete
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}