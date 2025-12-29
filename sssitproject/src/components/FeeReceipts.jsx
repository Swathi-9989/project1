import React, { useState, useEffect } from "react";
import API from "../api";
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function FeeReceipts() {

  const [regNo, setRegNo] = useState("");
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [receipts, setReceipts] = useState([]);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleteId, setDeleteId] = useState(null);

  const [addError, setAddError] = useState(""); // NEW STATE FOR ADD MODAL ERROR

  const [newReceipt, setNewReceipt] = useState({
    receipt_no: "",
    amount: "",
    date: "",
  });

  const [editReceipt, setEditReceipt] = useState({
    id: null,
    receipt_no: "",
    amount: "",
    date: "",
  });

  const formatDate = (d) => {
    if (!d) return "";
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, "0")}-${String(
      x.getMonth() + 1
    ).padStart(2, "0")}-${x.getFullYear()}`;
  };

  const loadReceipts = async (student) => {
    if (!student) return setReceipts([]);

    try {
      const data = await API(`/fees/?student=${student.id}`, "GET");
      setReceipts(Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []);
    } catch {
      setReceipts([]);
    }
  };

  const handleLoadPrevious = async () => {
    setError("");
    setInfo("");

    try {
      const all = await API("/fees/", "GET");
      const valid = all.filter((r) => r.student !== null);

      if (valid.length === 0) return setError("No valid receipts found.");

      const lastReceipt = valid.reduce((a, b) => (a.id > b.id ? a : b));

      const studentId = lastReceipt.student;

      const student = await API(`/students/${studentId}/`, "GET");


      setSelected(student);
      setSelectedId(student.id);
      setRegNo(student.regno ?? "");
      await loadReceipts(student);

      setInfo(`Loaded last receipt: ${lastReceipt.receipt_no}`);
    } catch {
      setError("Unable to load last receipt.");
    }
  };

  useEffect(() => {
    return () => typingTimeout && clearTimeout(typingTimeout);
  }, []);

  const computePaidDueForStudent = async (stu) => {
    try {
      const data = await API(`/fees/?student=${stu.id}`, "GET");
      const arr = Array.isArray(data) ? data : [];
      const valid = arr.filter((x) => x?.receipt_no);
      const paid = valid.reduce((s, it) => s + Number(it.amount || 0), 0);

      return {
        paidFees: paid,
        dueFees: Math.max(stu.total_fees - paid, 0),
        totalFees: stu.total_fees,
      };
    } catch {
      return {
        paidFees: 0,
        dueFees: stu.total_fees,
        totalFees: stu.total_fees,
      };
    }
  };

  const fetchList = async (value) => {
    try {
      const list = await API(`/students/?regno=${value}`, "GET");

      const exact = list.filter((x) => String(x.regno) === String(value));

      const enhanced = await Promise.all(
        exact.map(async (stu) => {
          const calc = await computePaidDueForStudent(stu);
          return { ...stu, ...calc };
        })
      );

      setRecords(enhanced);

      if (enhanced.length === 0) {
        setSelected(null);
        setReceipts([]);
        return setError("No student found");
      }

      setSelected(null);
      setSelectedId(null);
      setReceipts([]);
      setError("");
    } catch {
      setError("No student found");
    }
  };

  const handleRegChange = (value) => {
    setRegNo(value);
    setError("");
    setInfo("");

    if (typingTimeout) clearTimeout(typingTimeout);

    if (!value.trim()) {
      setRecords([]);
      setSelected(null);
      setSelectedId(null);
      setReceipts([]);
      return;
    }

    const t = setTimeout(() => fetchList(value), 300);
    setTypingTimeout(t);
  };

  const handleRecordClick = async (stu) => {
    setSelectedId(stu.id);

    const calc = await computePaidDueForStudent(stu);
    const enhancedStu = { ...stu, ...calc };

    setSelected(enhancedStu);
    await loadReceipts(enhancedStu);
  };

  const handleReset = () => {
    setRegNo("");
    setRecords([]);
    setSelected(null);
    setSelectedId(null);
    setReceipts([]);
    setError("");
    setInfo("");
  };

  const trimYear = (value) => {
    if (!value) return value;
    const parts = value.split("-");
    parts[0] = parts[0].slice(0, 4);  // limit year to 4 chars
    return parts.join("-");
  };


  const openAddModal = () => {
    setAddError("");
    setShowAddModal(true);
  };

  const handleAddReceipt = async () => {
    setAddError("");

    if (!selected)
      return setAddError("Select a student first.");

    if (!newReceipt.receipt_no || newReceipt.amount === "")
      return setAddError("Receipt number and amount required.");

    try {
      const payload = {
        student: selected.id,
        receipt_no: newReceipt.receipt_no,
        amount: Number(newReceipt.amount),
        date: newReceipt.date || new Date().toISOString().slice(0, 10),
      };
      await API("/fees/", "POST", payload);
      setShowAddModal(false);
      setNewReceipt({ receipt_no: "", amount: "", date: "" });
      setAddError("");

      await loadReceipts(selected);
      if (regNo) await fetchList(regNo);

      setInfo("Receipt added successfully");
    } catch (err) {
      setAddError("Error adding receipt");
    }
  };

  const openEdit = (r) => {
    setEditReceipt({
      id: r.id,
      receipt_no: r.receipt_no,
      amount: r.amount,
      date: r.date,
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    try {
      await API(`/fees/${editReceipt.id}/`, "PATCH", {
        student: selected.id,
        receipt_no: editReceipt.receipt_no,
        amount: Number(editReceipt.amount),
        date: editReceipt.date,
      });

      setShowEditModal(false);

      await loadReceipts(selected);
      if (regNo) await fetchList(regNo);

      setInfo("Receipt updated");
    } catch (err) {
      setError("Error updating receipt");
    }
  };

  const handleDelete = async () => {
    try {
      await API(`/fees/${deleteId}/`, "DELETE");
      setShowDeleteConfirm(false);

      await loadReceipts(selected);
      if (regNo) await fetchList(regNo);

      setInfo("Receipt deleted");
    } catch {
      setError("Error deleting receipt");
    }
  };

  useEffect(() => {
    if (!error && !info) return;

    const timer = setTimeout(() => {
      setError("");
      setInfo("");
    }, 2500); // 2–3 seconds

    return () => clearTimeout(timer);
  }, [error, info]);


  useEffect(() => {
    if (!addError) return;

    const timer = setTimeout(() => {
      setAddError("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [addError]);


  const printReceipt = (receipt) => {
    const receiptWindow = window.open("", "_blank", "width=800,height=600");

    const paid = receipts.reduce((s, x) => s + Number(x.amount || 0), 0);
    const due = Math.max(selected.totalFees - paid, 0);

    receiptWindow.document.write(`
    <html>
      <head>
        <title>Receipt - ${receipt.receipt_no}</title>
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      </head>
      <body class="p-4">

        <div class="container border p-4 rounded" style="max-width:700px; font-size:18px;">
          <h3 class="text-center mb-3">Fee Receipt</h3>
          <hr/>

          <div class="row mb-2">
            <div class="col-6">
              Receipt No: <strong>${receipt.receipt_no}</strong>
            </div>
            <div class="col-6">
              Date: <strong>${formatDate(receipt.date)}</strong>
            </div>
          </div>

          <div class="row mb-2">
            <div class="col-6">
              Reg No: <strong>${selected.regno}</strong>
            </div>
            <div class="col-6">
              Student Name: <strong>${selected.studentname}</strong>
            </div>
          </div>

          <div class="row mb-2">
            <div class="col-6">
              Course: <strong>${selected.course}</strong>
            </div>
            <div class="col-6">
              Date of Joining: <strong>${formatDate(
      selected.date_of_joining
    )}</strong>
            </div>
          </div>

          <hr/>

          <div class="text-center mb-3">
            Amount Paid: <strong>₹${receipt.amount}</strong>
          </div>

          <hr/>

          <p class="text-center">Total Fees: <strong>₹${selected.totalFees}</strong></p>
          <p class="text-center">Pending Due: <strong>₹${due}</strong></p>
          <p class="text-center">Total Paid Fees: <strong>₹${paid}</strong></p>
        </div>

        <script>
          window.print();
          window.onfocus = () => window.close();
        </script>

      </body>
    </html>
  `);

    receiptWindow.document.close();
  };

  const totalFees = selected?.totalFees || selected?.total_fees || 0;
  const paidFees = receipts.reduce((s, r) => s + Number(r.amount || 0), 0);
  const dueFees = Math.max(totalFees - paidFees, 0);
  const pendingDue = dueFees;
  const isFullyPaid = dueFees === 0;
  const validReceipts = receipts.filter(r => r.receipt_no);


  return (
    <div className="container">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white text-center">
          <h5 className="mb-0">Fee Receipt Details</h5>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}

          <div
            className="d-flex align-items-center justify-content-center mb-3"
            style={{ gap: 12 }}
          >
            <label className="me-2 mt-1">Registration No:</label>

            <input
              className="form-control rounded-3"
              style={{ width: 300 }}
              value={regNo}
              onChange={(e) => handleRegChange(e.target.value)}
              placeholder="Enter Reg No"
            />

            <button className="custom-btn custom-btn-red" onClick={handleReset}>
              Reset
            </button>

            <button
              className="custom-btn custom-btn-orange"
              onClick={handleLoadPrevious}
            >
              Previous
            </button>
          </div>

          {records.length > 0 && (
            <table className="table table-sm">
              <thead className="table-success">
                <tr>
                  <th className="text-center">Name</th>
                  <th>Course</th>
                  <th>Joining</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                </tr>
              </thead>

              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRecordClick(r)}
                    style={{ cursor: "pointer" }}
                    className={selectedId === r.id ? "table-warning" : ""}
                  >
                    <td className="text-center">{r.studentname}</td>
                    <td>{r.course}</td>
                    <td>{formatDate(r.date_of_joining)}</td>
                    <td className="text-primary">₹{r.totalFees}</td>
                    <td className="text-success">₹{r.paidFees}</td>
                    <td className="text-danger">₹{r.dueFees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selected && validReceipts.length > 0 && (
            <div>
              <h4 className="text-center text-success">Receipts</h4>

              <table className="table table-bordered text-center table-sm">
                <thead className="table-success">
                  <tr>
                    <th>Receipt No</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {validReceipts.map((r) => (
                    <tr key={r.id}>
                      <td>{r.receipt_no}</td>
                      <td>{selected.course}</td>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.amount}</td>

                      <td>
                        <i
                          className="bi bi-pencil text-success me-4"
                          style={{ fontSize: "20px", cursor: "pointer" }}
                          onClick={() => openEdit(r)}
                        ></i>

                        <i
                          className="bi bi-trash text-danger me-4"
                          style={{ fontSize: "20px", cursor: "pointer" }}
                          onClick={() => {
                            setDeleteId(r.id);
                            setShowDeleteConfirm(true);
                          }}
                        ></i>

                        <i
                          className="bi bi-printer text-primary"
                          style={{ fontSize: "20px", cursor: "pointer" }}
                          onClick={() => printReceipt(r)}
                        ></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selected && validReceipts.length === 0 && (
            <p className="text-muted text-center">No receipts found.</p>
          )}

          {selected && !isFullyPaid && (
            <div className="text-center mt-2">
              <button
                className="btn btn-outline-success btn-sm rounded-3"
                onClick={openAddModal}
              >
                + ADD RECEIPT
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 animated jackInTheBox" style={{ width: "400px", height: "350px" }}>
              <div className="modal-header bg-success text-white">
                <h5>Add Receipt</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setAddError("");
                    setShowAddModal(false);
                  }}
                />
              </div>

              <div className="modal-body">

                {addError && (
                  <div className="alert alert-danger py-2">{addError}</div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <label>Receipt No</label>
                    <input
                      className="form-control mb-2"
                      value={newReceipt.receipt_no}
                      onChange={(e) =>
                        setNewReceipt((p) => ({
                          ...p,
                          receipt_no: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Amount</label>
                    <input
                      className="form-control mb-2"
                      type="number"
                      value={newReceipt.amount}
                      onChange={(e) =>
                        setNewReceipt((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <label>Date</label>
                    <input
                      className="form-control mb-2"
                      type="date"
                      value={
                        newReceipt.date ||
                        new Date().toISOString().slice(0, 10)
                      }
                      onChange={(e) =>
                        setNewReceipt((p) => ({
                          ...p,
                          date: trimYear(e.target.value),
                        }))
                      }

                    />
                  </div>

                  <div className="col-md-6">
                    <label>Pending Due</label>
                    <input
                      className="form-control mb-2"
                      value={pendingDue}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="custom-btn custom-btn-red"
                  onClick={() => {
                    setAddError("");
                    setShowAddModal(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="custom-btn custom-btn-green"
                  onClick={handleAddReceipt}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showEditModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox" style={{ width: "400px", height: "350px" }}>
              <div className="modal-header bg-primary text-white">
                <h5>Edit Receipt</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                />
              </div>

              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <label>Receipt No</label>
                    <input
                      className="form-control mb-2"
                      value={editReceipt.receipt_no}
                      onChange={(e) =>
                        setEditReceipt((p) => ({
                          ...p,
                          receipt_no: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Amount</label>
                    <input
                      className="form-control mb-2"
                      type="number"
                      value={editReceipt.amount}
                      onChange={(e) =>
                        setEditReceipt((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <label>Date</label>
                    <input
                      className="form-control mb-2"
                      type="date"
                      value={editReceipt.date?.slice(0, 10)}
                      onChange={(e) =>
                        setEditReceipt((p) => ({
                          ...p,
                          date: trimYear(e.target.value),
                        }))
                      }

                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="custom-btn custom-btn-red"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="custom-btn custom-btn-green"
                  onClick={handleEditSave}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showDeleteConfirm && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ width: "400px", height: "200px" }}>
            <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox" >
              <div className="modal-header bg-danger">
                <h5 className="modal-title text-white text-center w-100">
                  Confirm Delete
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteConfirm(false)}
                />
              </div>

              <div className="modal-body text-center">
                Are you sure you want to delete this receipt?
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="custom-btn custom-btn-blue"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>

                <button
                  className="custom-btn custom-btn-red"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}