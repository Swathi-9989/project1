import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import CameraCapture from "./CameraCapture";   // ✅ Using your component
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { convertToWebP } from "../utils/convertToWebp";


function initialForm() {
  return {
    studentname: "",
    regno: "",
    course: "",
    date_of_joining: "",
    dob: "",
    father_name: "",
    parent_contact: "",
    facultyname: "",
    address: "",
    email: "",
    contact: "",
    reason: "",
    batch_started_date: "",
    batchtime: "",
    total_fees: "",
    image: null,
  };
}

export default function NewStudentEnroll() {
  const [facultyList, setFacultyList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState(initialForm());
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState({
    text: "",
    type: "", // success | error | warning | info
  });
  const today = new Date().toISOString().split("T")[0];


  const showToast = (text, type = "success", timeout = 3000) => {
    setToast({ text, type });
    setTimeout(() => {
      setToast({ text: "", type: "" });
    }, timeout);
  };

  const fileInputRef = useRef(null);

  const trimYear = (value) => {
    if (!value) return value;
    const p = value.split("-");
    p[0] = p[0].slice(0, 4);

    return p.join("-");
  };

  // ✅ NEW CAMERA STATE
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [facultyRes, studentsRes, coursesRes] = await Promise.all([
        API("/faculty/", "GET"),
        API("/students/", "GET"),
        API("/courses/", "GET"),
      ]);

      setFacultyList(facultyRes);
      setStudents(studentsRes);
      setCourseList(coursesRes);
      ;
    } catch (err) {
      showToast("Error loading data", "error");

    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.studentname.trim()) newErrors.studentname = "Required";
    if (!formData.regno) newErrors.regno = "Required";
    if (!formData.course) newErrors.course = "Required";

    if (!/^\d{10,15}$/.test(formData.contact))
      newErrors.contact = "Required";

    if (!formData.date_of_joining) newErrors.date_of_joining = "Required";

    if (!formData.total_fees) newErrors.total_fees = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= IMAGE UPLOAD =================

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const webpFile = await convertToWebP(file);

    setFormData((f) => ({ ...f, image: webpFile }));
    setPreview(URL.createObjectURL(webpFile));
  };


  // ================= CAMERA CAPTURE HANDLER =================
  const handleCameraCapture = async (file) => {
    const webpFile = await convertToWebP(file);
    setFormData(f => ({ ...f, image: webpFile }));
    setPreview(URL.createObjectURL(webpFile));
  };


  // ================= INPUT HANDLER =================
  const handleChange = (e) => {
    const { id, value } = e.target;

    // Live duplicate check for regno
    if (id === "regno") {
      const exists = students.some((s) => Number(s.regno) === Number(value));
      setErrors((prev) => ({
        ...prev,
        regno: exists ? "Reg No already exists!" : "",
      }));
    }

    setFormData((f) => ({ ...f, [id]: value }));
  };


  // ================= SUBMIT =================
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const exists = students.some((s) => Number(s.regno) === Number(formData.regno));
    if (exists) {
      showToast("Reg No already exists!", "error");
      return; 
    }

    try {
      const fd = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) fd.append(key, formData[key]);
      });

      fd.set("regno", parseInt(formData.regno));
      fd.set("total_fees", Number(formData.total_fees));

      const res = await API("/students/","POST",fd);

      await API("/fees/", "POST", {
        student: res.id,
        total_fees: Number(formData.total_fees),
        amount: 0,
      });

      showToast("Student added successfully", "success");
      setFormData(initialForm());
      setErrors({});
      setPreview(null);
      setShowCamera(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => setMessage(""), 500);
      setFormData(initialForm());
      setPreview(null);
      fetchData();
    } catch (err) {
      showToast("Error Adding Student", "error");
    }
  };


  const handleClear = () => {
    setFormData(initialForm());
    setPreview(null);
    setErrors({});
  };

  const closePhotoModal = () => {
    document.activeElement?.blur(); // ✅ blur FIRST

    const modalEl = document.getElementById("photoModal");
    if (modalEl) {
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  };

  const handleLastRecord = () => {
    if (students.length === 0) return showToast("No data found", "error");

    const last = students[students.length - 1];

    setFormData({
      studentname: last.studentname || "",
      regno: last.regno || "",
      course: last.course || "",
      date_of_joining: last.date_of_joining || "",
      dob: last.dob || "",
      father_name: last.father_name || "",
      parent_contact: last.parent_contact || "",
      facultyname: last.facultyname || "",
      address: last.address || "",
      email: last.email || "",
      contact: last.contact || "",
      reason: last.reason || "",
      batch_started_date: last.batch_started_date || "",
      batchtime: last.batchtime || "",
      total_fees: last.total_fees || "",
      image: null,
    });
    setPreview(
      last.image
        ? last.image.startsWith("http")
          ? last.image
          : `https://sssitprojecct.onrender.com${last.image}`

        : null
    );

    showToast("Last record loaded", "success");
  };
  const handleLastModified = () => {
    if (!students || students.length === 0) {
      showToast("No data found", "error");
      return;
    }



    // 🔥 Ignore newly added record (last one)
    const oldRecords = students.slice(0, -1);

    if (oldRecords.length === 0) {
      showToast("No edited record found", "info");
      return;
    }

    // ✅ Pick record with latest updated_at
    const lastMod = oldRecords.reduce((latest, current) =>
      new Date(current.updated_at) > new Date(latest.updated_at)
        ? current
        : latest
    );

    setFormData({
      studentname: lastMod.studentname || "",
      regno: lastMod.regno || "",
      course: lastMod.course || "",
      date_of_joining: lastMod.date_of_joining || "",
      dob: lastMod.dob || "",
      father_name: lastMod.father_name || "",
      parent_contact: lastMod.parent_contact || "",
      facultyname: lastMod.facultyname || "",
      address: lastMod.address || "",
      email: lastMod.email || "",
      contact: lastMod.contact || "",
      reason: lastMod.reason || "",
      batch_started_date: lastMod.batch_started_date || "",
      batchtime: lastMod.batchtime || "",
      total_fees: lastMod.total_fees || "",
      image: null,
    });

    setPreview(
      lastMod.image
        ? lastMod.image.startsWith("http")
          ? lastMod.image
          : `https://sssitprojecct.onrender.com${lastMod.image}`

        : null
    );

    showToast("Last modified record loaded", "success");
  };

  const handleNewStudent = () => {
    setFormData(initialForm());
    setErrors({});

    // 🔥 CLEAR IMAGE & CAMERA STATE
    setPreview(null);
    setShowCamera(false);

    // 🔥 CLEAR FILE INPUT
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showToast("Ready for new student entry", "success");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return ` ${day}/${month}/${year}`;
  };

  return (
    <div className="container-sm ">
      {toast.text && (
        <div className={`app-toast ${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" :
            toast.type === "error" ? "bi-x-circle-fill" :
              toast.type === "warning" ? "bi-exclamation-triangle-fill" :
                "bi-info-circle-fill"
            }`} />

          <span>{toast.text}</span>

          <button onClick={() => setToast({ text: "", type: "" })}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <div className="card shadow-sm rounded-3">
        <div className="card-header bg-primary text-white text-center py-2 mb-0">
          <h5 className=" mb-0">New Student Admission</h5>
        </div>
        <div className="card-body bg-light mt-0">
          <form onSubmit={handleAdd}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "10px" }}>
              <tbody>

                {/* ========== ROW 1 : PHOTO + REG NO + STUDENT NAME ========== */}
                <tr>
                  <td rowSpan="3" style={{ width: "150px", verticalAlign: "top" }}>

                    <div
                      data-bs-toggle="modal"
                      data-bs-target="#photoModal"
                      className="image-preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        border: "2px solid blue",
                        cursor: "pointer",
                        overflow: "hidden",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "20px",
                      }}
                    >
                      {preview ? (
                        <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>Photo</span>
                      )}
                    </div>
                  </td>

                  <td style={{ width: "160px" }}><b>Reg No :</b></td>
                  <td>
                    <input
                      id="regno"
                      value={formData.regno}
                      onChange={(e) => /^\d*$/.test(e.target.value) && handleChange(e)}
                      className="form-control"
                    />
                    {errors.regno && <small className="text-danger">{errors.regno}</small>}
                  </td>

                  <td style={{ width: "170px" }}><b>Student Name :</b></td>
                  <td>
                    <input
                      id="studentname"
                      value={formData.studentname}
                      onChange={handleChange}
                      className="form-control"
                    />
                    {errors.studentname && <small className="text-danger">{errors.studentname}</small>}
                  </td>
                </tr>

                {/* ========== ROW 2: FATHER NAME + COURSE ========== */}
                <tr>
                  <td><b>Father Name :</b></td>
                  <td>
                    <input id="father_name" value={formData.father_name} onChange={handleChange} className="form-control" />
                  </td>

                  <td><b>Course :</b></td>
                  <td>
                    <select
                      id="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="form-select "

                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      }}
                    >
                      <option value="" className="text-center align-content-center">Select Course</option>
                      {courseList
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                          <option key={c.id} value={c.name} >{c.name}</option>
                        ))}
                    </select>
                    {errors.course && <small className="text-danger">{errors.course}</small>}
                  </td>
                </tr>

                {/* ========== ROW 3: FACULTY NAME + TOTAL FEES ========== */}
                <tr>
                  <td><b>Faculty Name :</b></td>
                  <td>
                    <select
                      id="facultyname"
                      value={formData.facultyname}
                      onChange={handleChange}
                      className="form-select"
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault(); // stop arrow key navigation
                        }
                      }}
                    >
                      <option value="">Select Faculty</option>
                      {facultyList
                        .sort((a, b) => a.faculty_name.localeCompare(b.faculty_name))
                        .map((f) => (
                          <option key={f.id} value={f.faculty_name}>
                            {f.faculty_name}
                          </option>
                        ))}
                    </select>
                  </td>

                  <td><b>Total Fees :</b></td>
                  <td>
                    <input id="total_fees" type="number" value={formData.total_fees} onChange={handleChange} className="form-control" />
                    {errors.total_fees && <small className="text-danger">{errors.total_fees}</small>}
                  </td>
                </tr>

                {/* ========== ROW 4: CONTACT + PARENT CONTACT ========== */}
                <tr>
                  <td></td>
                  <td ><b>Contact :</b></td>
                  <td>
                    <input id="contact" value={formData.contact} onChange={handleChange} className="form-control" />
                    {errors.contact && <small className="text-danger">{errors.contact}</small>}
                  </td>

                  <td><b>Parent No :</b></td>
                  <td>
                    <input id="parent_contact" value={formData.parent_contact} onChange={handleChange} className="form-control" />

                  </td>
                </tr>


                {/* ========== ROW 5: EMAIL + DATE OF JOINING ========== */}
                <tr>
                  <td></td>
                  <td><b>Email Id :</b></td>
                  <td>
                    <input id="email" value={formData.email} onChange={handleChange} className="form-control" />
                  </td>

                  <td><b>Date Of Joining :</b></td>
                  <td>
                    <input
                      id="date_of_joining"
                      type="date"
                      value={trimYear(formData.date_of_joining)}
                      max={today}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          date_of_joining: trimYear(e.target.value)
                        }));
                      }}
                      className="form-control"
                    />
                    {errors.date_of_joining && <small className="text-danger">{errors.date_of_joining}</small>}
                  </td>
                </tr>

                {/* ========== ROW 6: BATCH DATE + DOB ========== */}
                <tr>
                  <td></td>
                  <td ><b>Batch Date :</b></td>
                  <td>
                    <input
                      id="batch_started_date"
                      type="date"
                      value={trimYear(formData.batch_started_date)}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          batch_started_date: trimYear(e.target.value)
                        }));
                      }}
                      className="form-control"
                    />
                  </td>
                  <td><b>Batch Time</b></td>
                  <td>
                    <input id="batchtime" className="form-control" value={formData.batchtime} onChange={handleChange} />

                  </td>


                </tr>

                {/* ========== ROW 7: ADDRESS (FULL WIDTH) ========== */}
                <tr>
                  <td></td>
                  <td><b>D.O.B :</b></td>
                  <td>
                    <input
                      id="dob"
                      type="date"
                      value={trimYear(formData.dob)}
                      onChange={(e) => {
                        setFormData((f) => ({
                          ...f,
                          dob: trimYear(e.target.value)
                        }));
                      }}
                      className="form-control"
                    />
                  </td>


                  <td ><b>Address :</b></td>
                  <td colSpan="3">
                    <input id="address" rows="2" value={formData.address} onChange={handleChange} className="form-control" />
                  </td>
                </tr>

                {/* ========== ROW 8: REMARKS (FULL WIDTH) ========== */}
                <tr>
                  <td></td>
                  <td  ><b>Remarks :</b></td>
                  <td colSpan="3">
                    <input id="reason" rows="2" value={formData.reason} onChange={handleChange} className="form-control "></input>
                  </td>
                </tr>

              </tbody>
            </table>

            {/* ========= BUTTONS ========= */}
            <div className="d-flex justify-content-center gap-3 mt-1 flex-wrap">
              <button type="submit" className="custom-btn custom-btn-green btn-sm px-4 rounded-3">Add</button>
              <button type="button" onClick={handleClear} className="custom-btn custom-btn-red btn-sm px-4 rounded-3">Clear</button>
              <button type="button" onClick={handleLastRecord} className="custom-btn custom-btn-purple btn-sm px-4 rounded-3">Last Record</button>
              <button type="button" onClick={handleLastModified} className="custom-btn custom-btn-orange  btn-sm px-4 rounded-3">Last Modified</button>
              <button type="button" onClick={handleNewStudent} className="custom-btn custom-btn-blue btn-sm px-4 rounded-3">New Student</button>
            </div>
          </form>

        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
      <div className="modal fade" id="photoModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-3 text-center">
            <h5 className="fw-bold">Choose Option</h5>

            <div className="d-flex justify-content-around mt-3">
              <button
                className="custom-btn custom-btn-blue"
                data-bs-dismiss="modal"
                onClick={() => setShowCamera(true)}
              >
                Camera
              </button>

              <button
                className="custom-btn custom-btn-green"
                data-bs-dismiss="modal"
                onClick={() => fileInputRef.current.click()}
              >
                Upload
              </button>

              {preview && (
                <button
                  className="custom-btn custom-btn-red"
                  onClick={() => {
                    setPreview(null);
                    setFormData(f => ({ ...f, image: null }));
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showCamera && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <CameraCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}