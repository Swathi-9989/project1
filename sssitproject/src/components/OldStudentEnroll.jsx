import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import CameraCapture from "./CameraCapture";
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { convertToWebP } from "../utils/convertToWebp";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Convert Image URL → File
async function urlToFile(url, filename = "student_image.jpg") {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

const initialForm = () => ({
  regno: "",
  studentname: "",
  email: "",
  course: "",
  batchtime: "",
  batch_started_date: "",
  facultyname: "",
  total_fees: "",
  date_of_joining: "",
  reason: "",
  dob: "",
  father_name: "",
  address: "",
  contact: "",
  hallticket_no: "",
  Certificate_status: "",
  Exam_Date: "",
  image: null,
});

export default function OldStudentEnroll() {
  const [facultyList, setFacultyList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState(initialForm());
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({
  text: "",
  type: "", // success | error | warning | info
});
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [preview, setPreview] = useState(null);

  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // LOAD INITIAL DATA
  useEffect(() => {
    loadStudents();
    loadCourses();
    loadFaculty();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await API("/students/", "GET");
      setStudents(Array.isArray(res) ? res : []);
    } catch {}
  };  

  const loadFaculty = async () => {
    try {
      const res = await API("/faculty/", "GET");
      setFacultyList(res);
    } catch {}
  };  

  const loadCourses = async () => {
    try {
      const res = await API("/courses/", "GET");
      setCoursesList(res);
    } catch {}
  };  

  // REG NO CHANGE
  const handleRegnoChange = async (e) => {
    const value = e.target.value;
    setFormData((f) => ({ ...f, regno: value }));

    if (!value) {
      setSelectedStudent(null);
      setPreview(null);
      return;
    }

    const matched = students
      .filter((s) => s.regno?.toString() === value.toString())
      .sort(
        (a, b) =>
          new Date(b.batch_started_date || b.date_of_joining) -
          new Date(a.batch_started_date || a.date_of_joining)
      );

    if (matched.length === 0) {
      setSelectedStudent(null);
      setPreview(null);
      return;
    }

    const student = matched[0];
    setSelectedStudent(student);

    // FIXED — CORRECT IMAGE URL BUILDING
    let imageUrl = null;
    if (student.image) {
      if (student.image.startsWith("http"))
        imageUrl = student.image;
      else if (student.image.startsWith("/media/"))
        imageUrl = `${BASE_URL}${student.image}`;
      else
        imageUrl = `${BASE_URL}/media/${student.image}`;
    }

    setPreview(imageUrl);

    // CONVERT OLD IMAGE → FILE ONLY IF EXISTS
    if (imageUrl) {
      const file = await urlToFile(imageUrl);
      const webpFile = await convertToWebP(file);
      setFormData(f => ({ ...f, image: webpFile }));
      setPreview(URL.createObjectURL(webpFile));

    }

    // FILL FORM
    setFormData((f) => ({
      ...f,
      regno: student.regno || "",
      studentname: student.studentname || "",
      email: student.email || "",
      batch_started_date: student.batch_started_date || "",
      date_of_joining: "",
      dob: student.dob || "",
      father_name: student.father_name || "",
      address: student.address || "",
      contact: student.contact || "",
      facultyname: student.facultyname || "",
      course: "",
      batchtime: "",
      total_fees: "",
      reason: "",
      hallticket_no: student.hallticket_no || "",
      Certificate_status: student.Certificate_status || "",
      Exam_Date: student.Exam_Date || "",
    }));

    setErrors({});
    setMessage("");
  };

  const trimYear = (value) => {
    if (!value) return value;
    const p = value.split("-");
    p[0] = p[0].slice(0, 4);   // keep only YYYY
    return p.join("-");
  };

  // BASIC CHANGE
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((f) => ({ ...f, [id]: value }));
  };

  // UPLOAD IMAGE
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const webpFile = await convertToWebP(file);
  setFormData(f => ({ ...f, image: webpFile }));
  setPreview(URL.createObjectURL(webpFile));
};

  // CAMERA CAPTURE
  const handleCameraCapture = async (file) => {
  const webpFile = await convertToWebP(file);
  setFormData(f => ({ ...f, image: webpFile }));
  setPreview(URL.createObjectURL(webpFile));
};


  // VALIDATION
  const validate = () => {
    const newErrors = {};
    if (!formData.regno) newErrors.regno = "Reg No required.";
    if (!formData.studentname) newErrors.studentname = "Student name required.";
    if (!formData.course) newErrors.course = "Select a course.";
    if (!formData.total_fees) newErrors.total_fees = "Enter fees.";
    if (!formData.date_of_joining) newErrors.date_of_joining = "Date of Joining required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateImageForDuplicateRegno = async (regno, imageFile) => {
  if (!imageFile || !(imageFile instanceof File)) return;

  const sameRegStudents = students.filter(
    (s) => s.regno?.toString() === regno.toString()
  );

  const fd = new FormData();
  fd.append("image", imageFile);

  for (const stu of sameRegStudents) {
    await API(`/students/${stu.id}/`, "PATCH", fd, true);
  }
};

  // SUBMIT FIXED
  const handleCreateNewEnrollment = async (e) => {
    e.preventDefault();

    if (!selectedStudent)
      return showToast("Select a student by Reg No first", "warning");
    if (!validate()) return;

    try {
      const fd = new FormData();

      // FIXED — append only real file
      if (formData.image instanceof File) {
        fd.append("image", formData.image);
      }

      // append all other fields
      Object.keys(formData).forEach((key) => {
        if (key !== "image") {
          fd.append(key, formData[key] ?? "");
        }
      });

      // 🔁 UPDATE IMAGE FOR ALL DUPLICATE REGNO RECORDS
      await updateImageForDuplicateRegno(formData.regno, formData.image);

      await API("/students/", "POST", fd, true);

      showToast("Old student enrolled successfully", "success");
      setTimeout(() => setMessage(""), 500);
      setFormData(initialForm());
      setPreview(null);
      setSelectedStudent(null);
      loadStudents();
    } catch (err) {
      showToast("Error while enrolling student", "error");

    }
  };

  const handleClear = () => {
    setFormData(initialForm());
    setPreview(null);
    setSelectedStudent(null);
    setErrors({});
    setMessage("");

  };

  const showToast = (text, type = "success", timeout = 3000) => {
  setToast({ text, type });
  setTimeout(() => {
    setToast({ text: "", type: "" });
  }, timeout);
};


  // ---------------- UI -------------------
  return (
    <div className="container text-center">
      {toast.text && (
  <div className={`app-toast ${toast.type}`}>
    <i className={`bi ${
      toast.type === "success" ? "bi-check-circle-fill" :
      toast.type === "error"   ? "bi-x-circle-fill" :
      toast.type === "warning" ? "bi-exclamation-triangle-fill" :
      "bi-info-circle-fill"
    }`} />

    <span>{toast.text}</span>

    <button onClick={() => setToast({ text: "", type: "" })}>
      <i className="bi bi-x-lg"></i>
    </button>
  </div>
)}

      <div className="card shadow-lg rounded-3 ">
        <div className="card-header bg-primary text-white text-center py-2">
          <h5 className="mb-0">Old Student Enrollment / Re-enroll</h5>
        </div>

        <div className="card-body bg-light">
          <form onSubmit={handleCreateNewEnrollment}>

            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "10px" }}>
              <tbody>

                {/* ========== ROW 1 : PHOTO + REG NO + STUDENT NAME ========== */}
                <tr>
                  <td rowSpan="3" style={{ width: "100px", verticalAlign: "top" }}>
                    <div
                      data-bs-toggle="modal"
                      data-bs-target="#photoModalOld"
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

                  <td><b>Reg No :</b></td>
                  <td>
                    <input
                      id="regno"
                      className="form-control"
                      value={formData.regno}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) handleRegnoChange(e);
                      }}
                    />
                    {errors.regno && <small className="text-danger">{errors.regno}</small>}
                  </td>

                  <td><b>Student Name :</b></td>
                  <td>
                    <input
                      id="studentname"
                      className="form-control"
                      value={formData.studentname}
                      onChange={handleChange}
                    />
                  </td>
                </tr>

                {/* ========== ROW 2: FATHER NAME + DATE OF JOINING ========== */}
                <tr>
                  <td><b>Father Name :</b></td>
                  <td>
                    <input
                      id="father_name"
                      className="form-control"
                      value={formData.father_name}
                      onChange={handleChange}
                    />
                  </td>

                  <td><b>Date Of Joining :</b></td>
                  <td>
                    <input
                      id="date_of_joining"
                      type="date"
                      className="form-control"
                      value={trimYear(formData.date_of_joining)}
                      max={today}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          date_of_joining: trimYear(e.target.value),
                        }))
                      }
                    />
                    {errors.date_of_joining && <small className="text-danger">{errors.date_of_joining}</small>}

                  </td>
                </tr>

                {/* ========== ROW 3: FACULTY + COURSE ========== */}
                <tr>
                  <td><b>Faculty :</b></td>
                  <td>
                    <select
                      id="facultyname"
                      className="form-select"
                      value={formData.facultyname}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      }}
                    >
                      <option value="">Select Faculty</option>
                      {facultyList
                        .sort((a, b) => a.faculty_name.localeCompare(b.faculty_name)) // Sort alphabetically
                        .map((f) => (
                          <option key={f.id} value={f.faculty_name}>
                            {f.faculty_name}
                          </option>
                        ))}
                    </select>
                  </td>

                  <td><b>Course :</b></td>
                  <td>
                    <select
                      id="course"
                      className="form-select"
                      value={formData.course}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();  // stop arrow key selection change
                        }
                      }}
                    >
                      <option value="">Select Course</option>
                      {coursesList
                        .sort((a, b) => a.name.localeCompare(b.name))   // alphabetical sorting
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    {errors.course && <small className="text-danger">{errors.course}</small>}

                  </td>
                </tr>

                {/* ========== ROW 4: CONTACT + BATCH TIME ========== */}
                <tr>
                  <td></td>
                  <td><b>Contact :</b></td>
                  <td>
                    <input
                      id="contact"
                      className="form-control"
                      value={formData.contact}
                      onChange={handleChange}
                    />
                  </td>

                  <td><b>Batch Time :</b></td>
                  <td>
                    <input
                      id="batchtime"
                      className="form-control"
                      value={formData.batchtime}
                      onChange={handleChange}
                    />
                  </td>
                </tr>

                {/* ========== ROW 5: TOTAL FEES + BATCH START DATE ========== */}
                <tr>
                  <td></td>
                  <td><b>Total Fees :</b></td>
                  <td>
                    <input
                      id="total_fees"
                      type="number"
                      className="form-control"
                      value={formData.total_fees}
                      onChange={handleChange}
                    />
                    {errors.total_fees && <small className="text-danger">{errors.total_fees}</small>}

                  </td>

                  <td><b>Batch Start Date :</b></td>
                  <td>
                    <input
                      id="batch_started_date"
                      type="date"
                      className="form-control"
                      value={trimYear(formData.batch_started_date)}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          batch_started_date: trimYear(e.target.value),
                        }))
                      }
                    />
                  </td>
                </tr>

                {/* ========== ROW 6: DOB + ADDRESS (SAME ROW) ========== */}
                <tr>
                  <td></td>
                  <td><b>D.O.B :</b></td>
                  <td>
                    <input
                      id="dob"
                      type="date"
                      className="form-control"
                      value={trimYear(formData.dob)}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          dob: trimYear(e.target.value),
                        }))
                      }
                    />
                  </td>

                  <td><b>Address :</b></td>
                  <td colSpan="2">
                    <input
                      id="address"
                      rows="2"
                      className="form-control"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </td>
                </tr>

                {/* ========== ROW 7: REMARKS FULL WIDTH ========== */}
                <tr>
                  <td></td>
                  <td><b>Remarks :</b></td>
                  <td colSpan="3">
                    <input
                      id="reason"
                      className="form-control"
                      value={formData.reason}
                      onChange={handleChange}
                    ></input>
                  </td>
                </tr>

              </tbody>
            </table>

            {/* BUTTONS */}
            <div className="d-flex justify-content-center gap-4 mt-0">
              <button className="custom-btn custom-btn-green px-4" type="submit">
                Re Enroll
              </button>
              <button className="custom-btn custom-btn-red px-4" type="button" onClick={handleClear}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PHOTO OPTION MODAL */}
      <div className="modal fade" id="photoModalOld" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered animated jackInTheBox rounded-5">
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
                    setFormData(prev => ({ ...prev, image: null }));
                  }}
                >
                  Clear
                </button>
              )}

              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CAMERA WINDOW */}
      {showCamera && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
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