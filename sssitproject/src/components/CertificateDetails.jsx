import React, { useEffect, useState } from "react";
import API from "../api";
import "./FloatingInput.css";

export default function CertificateDetails() {
  
  // 🔔 TOASTER STATE
const [toast, setToast] = useState({
  text: "",
  type: "", // success | error | warning | info
});

const showToast = (text, type = "success", timeout = 3000) => {
  setToast({ text, type });
  setTimeout(() => {
    setToast({ text: "", type: "" });
  }, timeout);
};


  const [students, setStudents] = useState([]);
  const [regNo, setRegNo] = useState("");
  const [examDate, setExamDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState("");

  // Certificate Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState(null);
  const [modalValue, setModalValue] = useState("Yes");

  // Issued Modal
  const [issuedModalOpen, setIssuedModalOpen] = useState(false);
  const [issuedRow, setIssuedRow] = useState(null);
  const [issuedDate, setIssuedDate] = useState("");

  // Fetch Students
  const fetchStudents = async () => {
    try {
      const res = await API("/students/");
      setStudents(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch students");
    }
  };
  

  useEffect(() => {
    fetchStudents();
  }, []);

  // Build Filtered Rows
  useEffect(() => {
    if (!regNo.trim() && !examDate) {
      setFilteredData([]);
      setError("");
      return;
    }

    const rows = [];

    students.forEach((stu) => {
      const courses = (stu.Exam_Course || "").split(",").map((c) => c.trim());
      const halls = (stu.hallticket_no || "").split(",").map((c) => c.trim());
      const dates = (stu.Exam_Date || "").split(",").map((c) => c.trim());
      const certs = (stu.Certificate_status || "").split(",").map((c) => c.trim());
      const issued = (stu.Issued_status || "").split(",").map((c) => c.trim());

      courses.forEach((courseName, idx) => {
        // Ignore deleted entries
        if (!courseName || courseName.trim() === "") return;

        rows.push({
          studentId: stu.id,
          studentname: stu.studentname,
          regno: stu.regno,
          contact: stu.contact,   // ⭐ ADDED
          hallticket_no: halls[idx] || "",
          exam_course: courseName,
          certificate_status: certs[idx] || "",
          issued_status: issued[idx] || "",
          exam_date: dates[idx] || "",
        });

      });
    });

    let filtered = rows;

    if (regNo.trim()) {
      const q = regNo.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.regno.toString() === q ||
          r.studentname.toLowerCase().includes(q) ||
          (r.contact && r.contact.toString() === q)
      );


    }

    if (examDate) filtered = filtered.filter((r) => r.exam_date === examDate);

    setError(filtered.length === 0 ? "No records found" : "");
    setFilteredData(filtered);
  }, [students, regNo, examDate]);

  // Backend Update Helper
  const patchStatus = async (row, payload) => {
    return API(
      `/students/${row.studentId}/update_exam_course/`,
      "PATCH",
      { course: row.exam_course, ...payload }
    );
  };
  
  // Set all to YES
  const updateAllCertificatesToYes = async () => {
    try {
      for (const row of filteredData) {
        await patchStatus(row, { Certificate_status: "Yes" });
      }
      fetchStudents();
    } catch (err) {
      console.error("Error updating all YES:", err);
    }
  };

  // ⭐ NEW: Reset all to empty
  const resetAllCertificatesToEmpty = async () => {
    try {
      for (const row of filteredData) {
        await patchStatus(row, { Certificate_status: "", Issued_status: "" });
      }
      fetchStudents();
    } catch (err) {
      console.error("Error resetting:", err);
    }
  };

  // Single update (✔ or ✖)
  const handleCertButtonClick = async (row, value) => {
    try {
      const payload =
        value === "No"
          ? { Certificate_status: value, Issued_status: "" }
          : { Certificate_status: value };

      await patchStatus(row, payload);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Certificate Modal
  const openCertModal = (row) => {
    setModalRow(row);
    setModalValue(
      row.certificate_status?.trim().toLowerCase() === "no" ? "No" : "Yes"
    );
    setModalOpen(true);
  };

  const handleCertModalSave = async () => {
    const payload =
      modalValue === "No"
        ? { Certificate_status: modalValue, Issued_status: "" }
        : { Certificate_status: modalValue };

   await patchStatus(modalRow, payload);
  fetchStudents();
  setModalOpen(false);
  showToast("Certificate status updated", "success");

  };

  // Issued Modal
  const openIssuedModal = (row) => {
    setIssuedRow(row);
    setIssuedDate(
      /^\d{4}-\d{2}-\d{2}$/.test(row.issued_status)
        ? row.issued_status
        : row.exam_date
    );
    setIssuedModalOpen(true);
  };

  const handleIssuedSave = async () => {
   await patchStatus(issuedRow, { Issued_status: issuedDate });
   fetchStudents();
   setIssuedModalOpen(false);
   showToast("Issued date updated successfully", "success");
  };

  const formatIssuedDisplay = (value) => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return `${d}-${m}-${y}`;
  };

  const handleReset = () => {
    setRegNo("");
    setExamDate("");
    setFilteredData([]);
    setError("");
  };

  // -----------------------------------
  // UI Rendering
  // -----------------------------------
  return (
    <div className="container" style={{ maxWidth: "1300px" }}>
      {toast.text && (
  <div className={`app-toast ${toast.type}`}>
    <i
      className={`bi ${
        toast.type === "success"
          ? "bi-check-circle-fill"
          : toast.type === "error"
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

      <div className="card rounded-3 shadow">
        <div className="card-header bg-primary text-white text-center">
          <h5 className="mb-0">Certificate Details</h5>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row ">
            <div className="col-sm-4 d-flex gap-2 me-3 ms-5">
              <label className="mt-1" >Reg No :</label>
              <input
                className="form-control"
                placeholder="Reg No / Student Name / Contact"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                style={{width:"300px"}}
              />
            </div>

            <div className="col-sm-5 gap-2 d-flex ">
              <label className="gap-1 mt-2">Exam Date :</label>
              <input
                type="date"
                className="form-control mt-1"
                value={examDate}
                onChange={(e) => {
                  let v = e.target.value;
                  const p = v.split("-");
                  if (p[0]?.length > 4) p[0] = p[0].slice(0, 4);
                  v = p.join("-");
                  setExamDate(v);
                }}
                onInput={(e) => {
                  let v = e.target.value;
                  const p = v.split("-");
                  if (p[0]?.length > 4) {
                    p[0] = p[0].slice(0, 4);
                    e.target.value = p.join("-");
                  }
                }}
                style={{width:"190px"}}
              />
               <button className="custom-btn custom-btn-red ms-5 mt-1" onClick={handleReset}
              
               >
                Reset
              </button>

            </div>
          </div>

          {error && <div className="text-danger text-center">{error}</div>}

          {filteredData.length > 0 && (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "10px",
              }}
            >
              <table className="tablecss mt-2 w-75" style={{ border: "1px solid black" }} >
                <thead className="table-primary text-center" style={{ border: "1px solid black" }}>
                  <tr style={{ border: "1px solid black" }}>
                    <th>S.No</th>
                    <th>H.NO</th>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th >Course</th>

                    <th>

                      Certificate Status{" "}
                      {examDate && (
                        <>
                          
                          <button
                            onClick={updateAllCertificatesToYes}
                            style={{
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                              background: "green",
                              color: "white",
                              fontWeight: "bold",
                              border: "none",
                              marginLeft: "4px",
                            }}
                          >
                            ✔
                          </button>

                          <button
                            onClick={resetAllCertificatesToEmpty}
                            style={{
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                              background: "red",
                              color: "white",
                              fontWeight: "bold",
                              border: "none",
                              marginLeft: "4px",
                            }}
                          >
                            ✖
                          </button>
                        </>
                      )}
                    </th>

                    <th>Date Of Issue</th>
                  </tr>
                </thead>

                <tbody className="text-center" style={{ border: "1px solid black" }}>
                  {filteredData.map((row, index) => {
                    const val = row.certificate_status?.trim().toLowerCase();
                    const isYes = val === "yes";
                    const isNo = val === "no";

                    return (
                      <tr key={index} style={{ border: "1px solid black" }}>
                        <td>{index + 1}</td>
                        <td>{row.hallticket_no}</td>
                        <td>{row.regno}</td>
                        <td>{row.studentname}</td>
                        <td>{row.exam_course}</td>

                        {/* CERTIFICATE STATUS */}
                        <td>
                          {!isYes && !isNo ? (
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                onClick={() => handleCertButtonClick(row, "Yes")}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  color: "green",
                                  border: "none",
                                  backgroundColor: "white",
                                }}
                              >
                                ✔
                              </button>

                              <button
                                onClick={() => handleCertButtonClick(row, "No")}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  color: "red",
                                  border: "none",
                                  backgroundColor: "white",
                                }}
                              >
                                ✖
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => openCertModal(row)}
                              style={{
                                width: "20px",
                                height: "20px",
                                color: isYes ? "green" : "red",
                                fontWeight: "bold",
                                lineHeight: "30px",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              {isYes ? "✔" : "✖"}
                            </span>
                          )}
                        </td>

                        {/* ISSUED */}
                        <td className="d-flex justify-content-center">
                          {row.issued_status ? (
                            <span
                              onClick={() => {
                                if (
                                  row.certificate_status.toLowerCase() !== "yes"
                                ) {
                                 showToast(
                                  "Cannot modify issued date unless certificate status is YES.",
                                  "warning"
                                );

                                  return;
                                }
                                openIssuedModal(row);
                              }}
                              style={{
                                cursor: "pointer",
                                fontWeight: "bold",
                                color: "green",
                              }}
                            >
                              {formatIssuedDisplay(row.issued_status)} ✔
                            </span>
                          ) : (
                            <button
                              style={{
                                width: "25px",
                                height: "25px",
                                borderRadius: "50%",
                                border: "2px solid #0d6efd",
                                background: "white",
                                color: "black",
                                fontWeight: "bold",
                              }}
                              onClick={() => {
                                if (
                                  row.certificate_status.toLowerCase() !== "yes"
                                ) {
                                showToast(
                                  "Certificate must be marked as YES before issuing.",
                                  "warning"
                                );

                                  return;
                                }
                                openIssuedModal(row);
                              }}
                            >
                              Y
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredData.length === 0 && !error && (
            <div className="text-center text-muted mt-3">
              No records to display.
            </div>
          )}
        </div>
      </div>

      {/* CERTIFICATE MODAL */}
      {modalOpen && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered " style={{width:"400px",height:"200px"}}>
              <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
                <div className="modal-header bg-primary text-white">
                  <h5>Update Certificate Status</h5>
                  <button
                    className="btn-close"
                    onClick={() => setModalOpen(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <p>
                    <b className="fw-bold">Reg No:</b> {modalRow.regno} <br /> <b className="fw-bold">Course:</b>{" "}
                    {modalRow.exam_course}
                  </p>

                  <div className="form-check">
                    <input
                      type="radio"
                      value="Yes"
                      checked={modalValue === "Yes"}
                      onChange={(e) => setModalValue(e.target.value)}
                      className="form-check-input"
                    />
                    <label className="form-check-label">Yes</label>
                  </div>

                  <div className="form-check">
                    <input
                      type="radio"
                      value="No"
                      checked={modalValue === "No"}
                      onChange={(e) => setModalValue(e.target.value)}
                      className="form-check-input"
                    />
                    <label className="form-check-label">No</label>
                  </div>
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <button
                    className="custom-btn custom-btn-red"
                    onClick={() => setModalOpen(false)}                  
                  >
                    Cancel
                  </button>
                  <button
                    className="custom-btn custom-btn-green"
                    onClick={handleCertModalSave}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ISSUED MODAL */}
      {issuedModalOpen && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered" style={{width:"400px",height:"200px"}}>
              <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
                <div className="modal-header bg-primary text-white">
                  <h5>Update Issued Date</h5>
                  <button
                    className="btn-close"
                    onClick={() => setIssuedModalOpen(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <label className="fw-bold">Select Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={issuedDate}
                    onChange={(e) => {
                      let v = e.target.value;
                      const p = v.split("-");
                      if (p[0]?.length > 4) p[0] = p[0].slice(0, 4);
                      v = p.join("-");
                      setIssuedDate(v);
                    }}
                    onInput={(e) => {
                      let v = e.target.value;
                      const p = v.split("-");
                      if (p[0]?.length > 4) {
                        p[0] = p[0].slice(0, 4);
                        e.target.value = p.join("-");
                      }
                    }}
                  />


                  <button
                    className="custom-btn custom-btn-red mt-3"
                    onClick={async () => {
                      await patchStatus(issuedRow, { Issued_status: "" });
                      fetchStudents();
                      setIssuedModalOpen(false);
                    }}
                    
                  >
                    Mark as NO
                  </button>
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <button
                    className="custom-btn custom-btn-green"
                    onClick={handleIssuedSave}
                  >
                    Save
                  </button>
                  <button
                    className="custom-btn custom-btn-red"
                    onClick={() => setIssuedModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}