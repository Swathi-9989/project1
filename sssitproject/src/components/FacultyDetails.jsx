import React, { useState, useEffect } from "react";
import API from "../api";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./FloatingInput.css";

function FacultyDetails() {

// inputs & lists
const [facultyInput, setFacultyInput] = useState("");
const [facultyList, setFacultyList] = useState([]);
const [dropdownOpen, setDropdownOpen] = useState(false);

// selection + batches
const [selectedFaculty, setSelectedFaculty] = useState(null);
const [facultyBatches, setFacultyBatches] = useState([]); // displayed (filtered)
const [allFacultyBatches, setAllFacultyBatches] = useState([]); // master copy
const [loadingBatches, setLoadingBatches] = useState(false);

// modals, forms
const [showAddFacultyPopup, setShowAddFacultyPopup] = useState(false);
const [showDeletePopup, setShowDeletePopup] = useState(false);
const [showAddBatchPopup, setShowAddBatchPopup] = useState(false);
const [showEditPopup, setShowEditPopup] = useState(false);

const [newFaculty, setNewFaculty] = useState({ faculty_name: "", subjects: "" });
const [editBatch, setEditBatch] = useState(null);
const [subjectOptions, setSubjectOptions] = useState([]);

const [showDeleteBatchPopup, setShowDeleteBatchPopup] = useState(false);
const [batchToDelete, setBatchToDelete] = useState(null);

// batch form
const [selectedSubject, setSelectedSubject] = useState("");
const [addDateISO, setAddDateISO] = useState("");
const [hour, setHour] = useState(10);
const [minute, setMinute] = useState(30);
const [ampm, setAmPm] = useState("AM");

// filter
const [filterFromDate, setFilterFromDate] = useState("");
const [filterToDate, setFilterToDate] = useState("");

// helpers
const pad2 = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
};

// Format a yyyy-mm-dd into user-friendly string; treat date as local
const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00"); // force local midnight parsing
  if (isNaN(d.getTime())) return isoDate;
  const m = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const yr = d.getFullYear();
  const wk = d.toLocaleString("en-US", { weekday: "short" });
  return `${m} ${day}, ${yr} (${wk})`;
};

const trimYear = (value) => {
  if (!value) return value;
  const p = value.split("-");
  p[0] = p[0].slice(0, 4);
  return p.join("-");
};


// initial loads
useEffect(() => {
  fetchFaculty();
  loadSubjectsFromApi();
}, []);

const fetchFaculty = async () => {
  try {
    const facultyData = await API("/faculty/", "GET");
    setFacultyList(facultyData || []);
  } catch (e) {
    console.error("fetchFaculty error", e);
  }
};

// load subjects/courses for selects
const loadSubjectsFromApi = async () => {
  try {
    const coursesData = await API("/courses/", "GET");
    const names = (coursesData || []).map((c) => c.course_name || c.name).filter(Boolean);
    const unique = [...new Set(names.map((s) => s.trim()))].sort((a, b) => a.localeCompare(b));
    setSubjectOptions(unique);
  } catch (e) {
    console.error("loadSubjectsFromApi error", e);
  }
};

// load batches for a faculty, store both master and displayed lists
const loadBatches = async (facultyId) => {
  setLoadingBatches(true);
  try {
    const data = await API("/batches/", "GET", { faculty: facultyId });
    // Newest added = highest ID
    const sorted = [...data].sort((a, b) => b.id - a.id);

    // Save all batches (master list)
    setAllFacultyBatches(sorted);

    // Show ONLY the latest batch by default
    setFacultyBatches(sorted.length > 0 ? [sorted[0]] : []);

  } catch (e) {
    console.error("loadBatches error", e);
    setFacultyBatches([]);
    setAllFacultyBatches([]);
  } finally {
    setLoadingBatches(false);
  }
};

// when user selects a faculty
const selectFaculty = (f) => {
  setFacultyInput(f.faculty_name);
  setSelectedFaculty(f);
  loadBatches(f.id);
  setDropdownOpen(false);
  setFilterFromDate("");
  setFilterToDate("");
};

const resetSelection = () => {
  setFacultyInput("");
  setSelectedFaculty(null);
  setFacultyBatches([]);
  setAllFacultyBatches([]);
  setFilterFromDate("");
  setFilterToDate("");
  fetchFaculty();
};

const saveNewFaculty = async () => {
  try {
    if (!newFaculty.faculty_name.trim()) {
      return;
    }
    const parsed = newFaculty.subjects
      ? newFaculty.subjects.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      faculty_name: newFaculty.faculty_name.trim(),
      batch_details: "",
      subjects: parsed   // ← can be []
    };

    await API("/faculty/", "POST", payload);

    showToast("Faculty added successfully", "success");
    setNewFaculty({ faculty_name: "", subjects: "" });
    setShowAddFacultyPopup(false);
    resetSelection();
  } catch (e) {
    console.error("saveNewFaculty error", e);
  }
};

const confirmDeleteFaculty = async () => {
  if (!selectedFaculty) return;
  try {
    await API(`/faculty/${selectedFaculty.id}/`, "DELETE");
    showToast("Faculty deleted successfully", "success");
    setShowDeletePopup(false);
    resetSelection();
  } catch (e) {
    console.error("confirmDeleteFaculty error", e);
  }
};

const deleteBatch = async (id) => {
  try {
    await API(`/batches/${id}/`, "DELETE");
    loadBatches(selectedFaculty.id);
  } catch (e) {
    console.error("deleteBatch error", e);
  }
};


// ---------- Inclusive date filter: fromDate <= batch.date <= toDate ----------
const applyDateFilter = () => {
  // If master list is empty, nothing to do
  if (!allFacultyBatches || allFacultyBatches.length === 0) {
    setFacultyBatches([]);
    return;
  }

  // Prepare bounds
  let fromTime = new Date("1900-01-01T00:00:00").getTime();
  let toTime = new Date("9999-12-31T23:59:59.999").getTime();

  if (filterFromDate) {
    const d = new Date(filterFromDate + "T00:00:00");
    if (!isNaN(d.getTime())) fromTime = d.getTime();
  }
  if (filterToDate) {
    const d = new Date(filterToDate + "T00:00:00");
    if (!isNaN(d.getTime())) {
      // set to end of day to be inclusive
      d.setHours(23, 59, 59, 999);
      toTime = d.getTime();
    }
  }


  // filter master list
  const filtered = allFacultyBatches.filter((b) => {
    if (!b || !b.date) return false;
    const t = new Date(b.date + "T00:00:00").getTime();
    if (isNaN(t)) return false;
    return t >= fromTime && t <= toTime; // inclusive check
  });

  const sortedFiltered = [...filtered].sort(
    (a, b) => new Date(b.date + "T00:00:00").getTime() - new Date(a.date + "T00:00:00").getTime()
  );

  setFacultyBatches(sortedFiltered);
  console.log(`Filter applied: ${filtered.length} batches matched.`);
};
// 🔥 AUTO FILTER when from/to dates change
useEffect(() => {
  applyDateFilter();
}, [filterFromDate, filterToDate]);


const resetFilter = () => {
  setFilterFromDate("");
  setFilterToDate("");

  // Reload latest data from backend
  if (selectedFaculty) {
    loadBatches(selectedFaculty.id);
  }
};


// add batch
const openAddBatchPopup = () => {
  setAddDateISO(todayISO());
  setHour(10);
  setMinute(30);
  setAmPm("AM");
  setSelectedSubject("");
  setShowAddBatchPopup(true);
};

const saveBatch = async () => {
  try {
    if (!selectedFaculty) {
      showToast("Please select faculty first", "warning");
      return;
    }

    if (!selectedSubject) {
      showToast("Please select subject", "warning");
      return;
    }
    const timeFormatted = `${pad2(hour)
      }:${pad2(minute)} ${ampm}`;
    const label = new Date(addDateISO).toLocaleString("en-US", { month: "short", year: "numeric" });
    await API("/batches/", "POST", {
      faculty: selectedFaculty.id,
      subject: selectedSubject,
      date: addDateISO,
      batch_time: timeFormatted,
      label,
    });
    showToast("Batch added successfully", "success"); // ✅ ADD
    setShowAddBatchPopup(false);
    loadBatches(selectedFaculty.id);
  } catch (e) {
    console.error("saveBatch error", e);
  }
};

// edit batch
const openEditBatch = (b) => {
  // defensive parsing if batch_time missing
  const timeParts = (b.batch_time || "10:30 AM").split(/[: ]/); // ["10","30","AM"]
  const h = parseInt(timeParts[0]) || 10;
  const m = parseInt(timeParts[1]) || 30;
  const p = timeParts[2] || "AM";
  setEditBatch({ id: b.id, subject: b.subject || "", date: b.date, hour: h, minute: m, ampm: p });
  setShowEditPopup(true);
};

const saveEditedBatch = async () => {
  try {
    if (!editBatch) return;
    const timeFormatted = `${pad2(editBatch.hour)
      }:${pad2(editBatch.minute)} ${editBatch.ampm}`;
    const label = new Date(editBatch.date).toLocaleString("en-US", { month: "short", year: "numeric" });
    await API(`/batches/${editBatch.id}/`, "PUT", {
      faculty: selectedFaculty.id,
      subject: editBatch.subject,
      date: editBatch.date,
      batch_time: timeFormatted,
      label,
    });
    showToast("Batch updated successfully", "success"); // ✅ ADD

    setShowEditPopup(false);
    loadBatches(selectedFaculty.id);

    setShowEditPopup(false);
    loadBatches(selectedFaculty.id);
  } catch (e) {
    console.error("saveEditedBatch error", e);
  }
};

const confirmDeleteBatch = async () => {
  try {
    await API(`/batches/${batchToDelete.id}/`, "DELETE");
    showToast("Batch deleted successfully", "success"); // ✅ ADD

    setShowDeleteBatchPopup(false);
    loadBatches(selectedFaculty.id);

  } catch (e) {
    console.error("Delete batch error", e);
  }
};

// 🔔 Slide-in message (success / danger / warning / info)
const [message, setMessage] = useState({
  text: "",
  type: "", // success | danger | warning | info
});

const showToast = (text, type = "success", timeout = 3000) => {
  setMessage({ text, type });
  if (timeout) {
    setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, timeout);
  }
};



// ---------- render ----------
return (
  <div className="container">
    {message.text && (
      <div className={`alert-message slide-in ${message.type}`}>
        <i className={`bi ${message.type === "success" ? "bi-check-circle-fill" :
            message.type === "danger" ? "bi-x-circle-fill" :
              message.type === "warning" ? "bi-exclamation-triangle-fill" :
                "bi-info-circle-fill"
          }`}></i>

        <span>{message.text}</span>

        <button
          className="alert-close"
          onClick={() => setMessage({ text: "", type: "" })}
        >
          ✕
        </button>
      </div>
    )}
    <div
      className="card rounded-3 "
    >
      <div className="card-header bg-primary text-center text-white">
        <h5 className="mb-0">Faculty Details</h5>
      </div>

      <div className="card-body ">
        {/* Search & actions */}
        <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center" style={{ width: "420px" }}>
            <label className="me-2" style={{ whiteSpace: "nowrap", fontWeight: "500" }}>
              Faculty Name :
            </label>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search Faculty"
                value={facultyInput}
                onChange={(e) => {
                  setFacultyInput(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              />


              {dropdownOpen && (
                <div
                  className="shadow"
                  style={{
                    position: "absolute",
                    top: "48px",
                    background: "white",
                    width: "100%",
                    borderRadius: "8px",
                    maxHeight: "220px",
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {facultyList
                    .filter((f) => f.faculty_name.toLowerCase().includes(facultyInput.toLowerCase()))
                    .map((f) => (
                      <div
                        key={f.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectFaculty(f)}
                        style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                      >
                        {f.faculty_name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button className="custom-btn custom-btn-green"
              onClick={() => setShowAddFacultyPopup(true)}>
              Add Faculty
            </button>

            <button
              className="custom-btn custom-btn-red"
              disabled={!selectedFaculty}
              onClick={() => setShowDeletePopup(true)}
            >
              Delete
            </button>

            <button
              className="custom-btn custom-btn-orange"
              onClick={resetSelection}>
              Reset
            </button>
          </div>
        </div>

        {/* Selected faculty + batches */}
        {selectedFaculty && (
          <div className="mt-2">
            <div className="card shadow-sm text-start rounded-4 overflow-hidden">
              <div className="card-body">
                <div className="d-flex align-items-end gap-1 mt-1 flex-nowrap">
                  <div style={{ overflowX: "auto" }}>
                    <div className="d-flex align-items-end gap-3 mt-1 flex-nowrap">

                      {/* Faculty Name */}
                      <div style={{ minWidth: "170px" }}>
                        <label className="form-label mb-2 fw-bold">Faculty Name : <span>  {selectedFaculty.faculty_name} </span></label>
                      </div>

                      {/* From Date */}
                      <div className="d-flex align-items-center gap-3" style={{ minWidth: "220px" }}>
                        <label className="fw-bold mb-0">From Date :</label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          value={filterFromDate ? filterFromDate.slice(0, 10) : ""}
                          onChange={(e) => setFilterFromDate(trimYear(e.target.value))}
                          style={{ width: "200px" }}
                        />
                      </div>


                      {/* To Date */}
                      <div className="d-flex align-items-center gap-3" style={{ minWidth: "220px" }}>
                        <label className="fw-bold mb-0">To Date : </label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          value={filterToDate ? filterToDate.slice(0, 10) : ""}
                          onChange={(e) => setFilterToDate(trimYear(e.target.value))}
                          style={{ width: "200px" }}
                        />
                      </div>


                      {/* Refresh Icon */}
                      <i
                        className="bi bi-arrow-clockwise fs-4 "
                        style={{ cursor: "pointer", marginBottom: "1px" }}
                        onClick={resetFilter}
                      ></i>

                    </div>
                  </div>
                </div>
                <div className="fw-bold mt-2 mb-2 text-center text-primary" style={{ fontSize: "1.2rem" }}>
                  Batch Details
                </div>
                {/* table */}
                <div className="mt-0"   >
                  <table className="tablecss table-bordered table-sm" >
                    <thead className="table-header text-center">
                      <tr>
                        <th>Faculty Name</th>
                        <th>Subject</th>
                        <th>Batch Time</th>
                        <th>Batch Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {loadingBatches ? (
                        <tr>
                          <td colSpan="5" className="text-center py-3">
                            Loading...
                          </td>
                        </tr>
                      ) : facultyBatches.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-3">
                            No batches found.
                          </td>
                        </tr>
                      ) : (
                        facultyBatches.map((b) => (
                          <tr key={b.id} className="batch-row batch-hover">
                            <td>{selectedFaculty.faculty_name}</td>
                            <td>{b.subject}</td>
                            <td>{b.batch_time}</td>
                            <td>{formatDate(b.date)}</td>
                            <td className="text-center">
                              <button className="icon-btn" onClick={() => openEditBatch(b)}>
                                <i className="bi bi-pencil text-primary me-3" style={{ fontSize: "20px" }}></i>
                              </button>

                              <button className="icon-btn ms-2" onClick={() => { setBatchToDelete(b); setShowDeleteBatchPopup(true); }}>
                                <i className="bi bi-trash text-danger" style={{ fontSize: "20px" }}></i>
                              </button>

                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-center mt-3">
                  <button className="btn btn-outline-primary btn-sm rounded-3 overflow-hidden fill-hover" onClick={openAddBatchPopup}>
                    <span>Add Batch</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {/* Add Faculty Popup */}
    {showAddFacultyPopup && (
      <div className="modal fade show " style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered " style={{ width: "400px", height: "200px" }}>
          <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
            <div className="modal-header bg-success text-white position-relative">
              <h5 className="w-100 text-center m-0">Add Faculty</h5>
              <button className="btn-close position-absolute end-0 me-3 rounded-3 overflow-hidden" style={{ filter: "invert(1)" }} onClick={() => setShowAddFacultyPopup(false)} />
            </div>
            <div className="modal-body  text-start">
              <label className=" fw-bold ">Faculty Name</label>
              <input type="text" className="form-control mb-3 rounded-3 overflow-hidden" value={newFaculty.faculty_name} onChange={(e) => setNewFaculty({ ...newFaculty, faculty_name: e.target.value })} />

              <label className=" fw-bold">Subjects (comma separated)</label>
              <input type="text" className="form-control rounded-3 overflow-hidden" placeholder="e.g., Python, Java, React" value={newFaculty.subjects} onChange={(e) => setNewFaculty({ ...newFaculty, subjects: e.target.value })} />

              <div className="d-flex justify-content-between mt-3">
                <button className="custom-btn custom-btn-green" onClick={saveNewFaculty}>
                  Save
                </button>
                <button className="custom-btn custom-btn-red" onClick={() => setShowAddFacultyPopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* DELETE FACULTY BATCH POPUP */}
    {showDeleteBatchPopup && batchToDelete && (
      <>
        <div
          className="modal fade show"
          style={{
            display: "block",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content rounded-4 overflow-hidden animated jackInTheBox "
              style={{ width: "400px", height: "230px" }}
            >
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteBatchPopup(false)}
                ></button>
              </div>

              <div className="modal-body text-center">
                <p className="fw-bold">
                  Are you sure you want to delete this batch?
                </p>

                <p className="h5 text-danger fw-bold">
                  {batchToDelete.subject} — {batchToDelete.batch_time}
                </p>
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="custom-btn custom-btn-red "
                  onClick={confirmDeleteBatch}

                >
                  Delete
                </button>

                <button
                  className="custom-btn custom-btn-blue "
                  onClick={() => setShowDeleteBatchPopup(false)}

                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Backdrop */}
        <div className="modal-backdrop fade show"></div>
      </>
    )}


    {/* Add Batch Popup */}
    {showAddBatchPopup && (
      <div className="modal fade show " style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered" style={{ width: "400px", height: "200px" }}>
          <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
            <div className="modal-header bg-primary text-white position-relative">
              <h5 className="w-100 text-center m-0">Add Batch</h5>
              <button className="btn-close position-absolute end-0 me-3 rounded-3 overflow-hidden" style={{ filter: "invert(1)" }} onClick={() => setShowAddBatchPopup(false)} />
            </div>
            <div className="modal-body">
              <label className="fw-bold">Subject</label>
              <select className="form-control mb-3" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjectOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <label className="fw-bold">Batch Date</label>
              <input type="date" className="form-control rounded-3 overflow-hidden" value={addDateISO ? addDateISO.slice(0, 10) : ""}
                onChange={(e) => setAddDateISO(trimYear(e.target.value))}
              />
              <label className="fw-bold mt-3">Batch Time</label>
              <div className="d-flex justify-content-center align-items-center gap-3 mt-2">
                <input type="number" min="1" max="12" value={hour} onChange={(e) => setHour(Math.min(12, Math.max(1, Number(e.target.value))))} className="form-control text-center rounded-3 overflow-hidden" style={{ width: "80px", fontSize: "20px" }} />
                <h4>:</h4>
                <input type="number" min="0" max="59" value={minute} onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value))))} className="form-control text-center rounded-3 overflow-hidden" style={{ width: "80px", fontSize: "20px" }} />
                <select value={ampm} onChange={(e) => setAmPm(e.target.value)} className="form-control text-center rounded-3 overflow-hidden" style={{ width: "90px", fontSize: "20px" }}>
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
              <div className="d-flex justify-content-between mt-4">
                <button className="custom-btn custom-btn-green" onClick={saveBatch}>
                  Save
                </button>
                <button className="custom-btn custom-btn-red" onClick={() => setShowAddBatchPopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Edit Batch Popup */}
    {showEditPopup && editBatch && (
      <div className="modal fade show " style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered" style={{ width: "400px", height: "200px" }}>
          <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
            <div className="modal-header bg-primary text-white position-relative">
              <h5 className="w-100 text-center m-0">Edit Batch</h5>
              <button className="btn-close position-absolute end-0 me-3 rounded-3 overflow-hidden" style={{ filter: "invert(1)" }} onClick={() => setShowEditPopup(false)} />
            </div>
            <div className="modal-body">
              <label className=" fw-bold">Subject</label>
              <select className="form-control mb-3" value={editBatch.subject} onChange={(e) => setEditBatch({ ...editBatch, subject: e.target.value })}>
                <option value="">Select Subject</option>
                {subjectOptions.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <label className="fw-bold">Batch Date</label>
              <input type="date" className="form-control rounded-3 overflow-hidden" value={editBatch.date ? editBatch.date.slice(0, 10) : ""}
                onChange={(e) => setEditBatch({ ...editBatch, date: trimYear(e.target.value) })}
              />

              <label className="fw-bold mt-3">Batch Time</label>
              <div className="d-flex justify-content-center align-items-center gap-3 mt-2">
                <input type="number" min="1" max="12" value={editBatch.hour} onChange={(e) => setEditBatch({ ...editBatch, hour: Math.min(12, Math.max(1, Number(e.target.value))) })} className="form-control text-center rounded-3 overflow-hidden" style={{ width: "70px", fontSize: "20px" }} />
                <h4>:</h4>
                <input type="number" min="0" max="59" value={editBatch.minute} onChange={(e) => setEditBatch({ ...editBatch, minute: Math.min(59, Math.max(0, Number(e.target.value))) })} className="form-control text-center rounded-3 overflow-hidden" style={{ width: "70px", fontSize: "20px" }} />
                <select value={editBatch.ampm} onChange={(e) => setEditBatch({ ...editBatch, ampm: e.target.value })} className="form-control text-center" style={{ width: "90px", fontSize: "20px" }}>
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button className="custom-btn custom-btn-green" onClick={saveEditedBatch}>
                  Save
                </button>
                <button className="custom-btn custom-btn-red" onClick={() => setShowEditPopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Delete Faculty Popup */}
    {showDeletePopup && (
      <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered" style={{ width: "400px" }}>
          <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
            <div className="modal-header bg-danger text-white position-relative">
              <h5 className="w-100 text-center m-0">Delete Faculty</h5>
              <button className="btn-close position-absolute end-0 me-3 rounded-3 overflow-hidden" style={{ filter: "invert(1)" }} onClick={() => setShowDeletePopup(false)} />
            </div>
            <div className="modal-body text-center">
              <p className="fw-bold mb-4">
                Are you sure you want to delete <span className="text-danger">{selectedFaculty?.faculty_name}</span>?
              </p>
              <div className="d-flex justify-content-between">
                <button className="custom-btn custom-btn-red" onClick={confirmDeleteFaculty}>
                  Delete
                </button>
                <button className="custom-btn custom-btn-blue" onClick={() => setShowDeletePopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default FacultyDetails;