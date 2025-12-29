import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import CameraCapture from "./CameraCapture";
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { convertToWebP } from "../utils/convertToWebp";

const API_URLS = {
  students: "/students/",
  faculty: "/faculty/",
  courses: "/courses/",
};

function initialForm() {
  return {
    image: null,
    regno: "",
    studentname: "",
    course: "",
    date_of_joining: "",
    dob: "",
    father_name: "",
    parent_contact: "",
    facultyname: "",
    batch_started_date: "",
    batchtime: "",
    contact: "",
    email: "",
    address: "",
    reason: "",
    total_fees: "",
  };
}

export default function EditStudent() {
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [formData, setFormData] = useState(initialForm());
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [toast, setToast] = useState({ text: "", type: "" });

  const showToast = (text, type = "success", timeout = 3000) => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), timeout);
  };

  useEffect(() => {
    fetchStudents();
    fetchFaculty();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await API(API_URLS.students, "GET");
      setStudents(data || []);
    } catch {
      showToast("Failed to fetch students", "error");
    }
  };

  const fetchFaculty = async () => {
    try {
      const data = await API(API_URLS.faculty, "GET");
      setFacultyList(data || []);
    } catch {
      showToast("Failed to fetch faculty", "error");
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await API(API_URLS.courses, "GET");
      setCourseList(data || []);
    } catch {
      showToast("Failed to fetch courses", "error");
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const webpFile = await convertToWebP(file);
    setFormData((prev) => ({ ...prev, image: webpFile }));
    setPreview(URL.createObjectURL(webpFile));
  };

  const handleCameraCapture = async (file) => {
    const webpFile = await convertToWebP(file);
    setFormData((prev) => ({ ...prev, image: webpFile }));
    setPreview(URL.createObjectURL(webpFile));
    setShowCamera(false);
  };

  const filteredStudents = students.filter((s) => {
    if (!searchText) return false;
    const search = searchText.toLowerCase().trim();
    return (
      String(s.regno).toLowerCase() === search ||
      s.studentname.toLowerCase() === search
    );
  });

  const handleSelectStudent = (stu) => {
    setEditingId(stu.id);
    setShowForm(true);

    setFormData({
      image: null,
      regno: stu.regno ?? "",
      studentname: stu.studentname ?? "",
      course: stu.course ?? "",
      date_of_joining: stu.date_of_joining ?? "",
      dob: stu.dob ?? "",
      father_name: stu.father_name ?? "",
      parent_contact: stu.parent_contact ?? "",
      facultyname: stu.facultyname ?? "",
      batch_started_date: stu.batch_started_date ?? "",
      batchtime: stu.batchtime ?? "",
      contact: stu.contact ?? "",
      email: stu.email ?? "",
      address: stu.address ?? "",
      reason: stu.reason ?? "",
      total_fees: stu.total_fees ?? "",
    });

    let imageUrl = null;
    if (stu.image) {
      imageUrl = stu.image.startsWith("http")
        ? stu.image
        : `https://sssitprojecct.onrender.com${stu.image}`;
    }
    setPreview(imageUrl);
  };

  const trimYear = (value) => {
    if (!value) return value;
    const p = value.split("-");
    p[0] = p[0].slice(0, 4);
    return p.join("-");
  };

  // ✅ FIXED UPDATE
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const regNoGroup = students.filter(
        (s) => s.regno === formData.regno
      );

      const updateAll = new FormData();
      updateAll.append("studentname", formData.studentname);
      updateAll.append("father_name", formData.father_name);
      updateAll.append("contact", formData.contact);
      updateAll.append("email", formData.email);
      updateAll.append("parent_contact", formData.parent_contact);

      if (formData.image) {
        updateAll.append("image", formData.image);
      }

      // 🔁 update same RegNo records
      for (const stu of regNoGroup) {
        await API(`/students/${stu.id}/`, "PATCH", updateAll);
      }

      // 🔹 update selected record
      const updateSingle = new FormData();
      Object.keys(formData).forEach((key) => {
        if (
          !["contact", "email", "studentname", "father_name"].includes(key) &&
          formData[key] !== null
        ) {
          updateSingle.append(key, formData[key]);
        }
      });

      await API(`/students/${editingId}/`, "PATCH", updateSingle);

      fetchStudents();
      setFormData(initialForm());
      setPreview(null);
      setEditingId(null);
      setShowForm(false);

      showToast("Student updated successfully", "success");
    } catch {
      showToast("Update failed", "error");
    }
  };
  
  return (
    <div className="container">
      <div className="card shadow-lg rounded-4">
        <div className="card-header bg-primary text-white text-center">
          <h5 className="mb-0">Edit Student</h5>
        </div>

        <div className="card-body ">
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

          {/* SEARCH BOX */}
          <div className=" d-flex justify-content-center">
            <input
              type="text"
              className="form-control mb-1 w-50"
              placeholder="Search by Reg No / Student Name"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowForm(false);   // Close form automatically
              }}
            />
          </div>


          {/* TABLE BEFORE SELECTION */}
          {!showForm && filteredStudents.length > 0 && (
            <table className="table table-bordered table-hover mt-0 table-sm mb-2 text-center">
              <thead className="table-primary">
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Date Of Joining</th>
                  <th>Batch Time</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} onClick={() => handleSelectStudent(stu)}>
                    <td>{stu.regno}</td>
                    <td>{stu.studentname}</td>
                    <td>{stu.course}</td>
                    <td>
                      {stu.date_of_joining
                        ? new Date(stu.date_of_joining).toLocaleDateString("en-GB")
                        : ""}
                    </td>

                    <td>{stu.batchtime}</td>
                    <td>{stu.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* FORM ONLY AFTER SELECT */}
          {showForm && (
            <form onSubmit={handleUpdate}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "10px" }}>
                <tbody>

                  {/* PHOTO + REGNO + NAME */}
                  <tr>
                    <td rowSpan="3" style={{ width: "150px", verticalAlign: "top" }}>
                      <div
                      className="image-preview"
                        onClick={() => setShowOptionModal(true)}
                        style={{
                          width: "100px",
                          height: "100px",
                          border: "2px solid blue",
                          borderRadius: "20px",
                          cursor: "pointer",
                          overflow: "hidden",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center"
                      
                        }}
                      >
                        {preview ? (
                          <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span>Photo</span>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </td>

                    <td style={{ width: "180px" }}><b>Reg No :</b></td>
                    <td>
                      <input id="regno" className="form-control" value={formData.regno}
                        onChange={(e) => /^\d*$/.test(e.target.value) && handleChange(e)}
                      />
                    </td>

                    <td><b>Student Name :</b></td>
                    <td>
                      <input id="studentname" className="form-control"
                        value={formData.studentname} onChange={handleChange}
                      />
                    </td>
                  </tr>

                  {/* Father name + COURSE */}
                  <tr>

                    <td><b>Father Name :</b></td>
                    <td>
                      <input id="father_name" className="form-control"
                        value={formData.father_name} onChange={handleChange}
                      />
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
                            e.preventDefault();    // block selection change via keyboard
                          }
                        }}
                      >
                        <option value="">Select Course</option>
                        {courseList
                          .sort((a, b) => a.name.localeCompare(b.name))   // alphabetical order
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>

                    </td>
                  </tr>

                  {/* Faculty + total fees */}
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
                          .sort((a, b) => a.faculty_name.localeCompare(b.faculty_name))  // alphabetically sorted
                          .map((f) => (
                            <option key={f.id} value={f.faculty_name}>
                              {f.faculty_name}
                            </option>
                          ))}
                      </select>

                    </td>

                    <td><b>Total Fees :</b></td>
                    <td>
                      <input
                        id="total_fees"
                        type="number"
                        className="form-control"
                        value={formData.total_fees}
                        onChange={handleChange}
                      />
                    </td>



                  </tr>

                  {/* contact + parent no */}
                  <tr>
                    <td></td>
                    <td><b>Contact :</b></td>
                    <td>
                      <input id="contact" className="form-control"
                        value={formData.contact} onChange={handleChange}
                      />
                    </td>
                    <td><b>Parent No :</b></td>
                    <td>
                      <input id="parent_contact" className="form-control"
                        value={formData.parent_contact} onChange={handleChange}
                      />
                    </td>


                  </tr>

                  {/* email + JOINING DATE */}
                  <tr>
                    <td></td>
                    <td><b>Email Id :</b></td>
                    <td>
                      <input id="email" className="form-control"
                        value={formData.email} onChange={handleChange}
                      />
                    </td>



                    <td><b>Date Of Joining:</b></td>
                    <td>
                      <input
                        id="date_of_joining"
                        type="date"
                        className="form-control"
                        value={trimYear(formData.date_of_joining)}
                        max={today}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date_of_joining: trimYear(e.target.value),
                          }))
                        }
                      />
                    </td>
                  </tr>

                  {/* BATCH START DATE + BATCH TIME */}
                  <tr>
                    <td></td>
                    <td><b>Batch Start Date :</b></td>
                    <td>
                      <input
                        id="batch_started_date"
                        type="date"
                        className="form-control"
                        value={trimYear(formData.batch_started_date)}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            batch_started_date: trimYear(e.target.value),
                          }))
                        }
                      />
                    </td>

                    <td><b>Batch Time :</b></td>
                    <td>
                      <input id="batchtime" className="form-control"
                        value={formData.batchtime} onChange={handleChange}
                      />
                    </td>
                  </tr>

                  {/* ========== DOB + ADDRESS (SAME ROW) ========== */}
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
                          setFormData((prev) => ({
                            ...prev,
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

                  {/* REMARKS */}
                  <tr>
                    <td></td>
                    <td><b>Remarks :</b></td>
                    <td colSpan="3">
                      <input id="reason" className="form-control"
                        rows="2" value={formData.reason} onChange={handleChange}>
                      </input>
                    </td>
                  </tr>

                </tbody>
              </table>
              {/* BUTTONS */}
              <div className="text-center mt-0">
                <button type="submit" className="custom-btn custom-btn-green px-4 me-3">Update</button>
                <button
                  type="button"
                  className="custom-btn custom-btn-red px-4"
                  onClick={() => {
                    setFormData(initialForm());
                    setPreview(null);
                    setEditingId(null);
                    setShowForm(false);
                    // setSearchText("");
                  }}
                >
                  Clear
                </button>


              </div>
            </form>
          )}
        </div>
      </div>

      {/* IMAGE OPTION MODAL */}
      {showOptionModal && (
        <div
          onClick={() => setShowOptionModal(false)}   
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}  
            
            style={{
              width: 500,
              background: "white",
              padding: 20,
              borderRadius: 10,
              textAlign: "center",
            }}
          >
            <h5 className="fw-bold">Choose Option</h5>
            <div className="d-flex justify-content-around mt-3">
              <button
                className="custom-btn custom-btn-blue"
                onClick={() => {
                  setShowCamera(true);
                }}
              >
                Camera
              </button>

              <button
                className="custom-btn custom-btn-green"
                onClick={() => {
                  fileInputRef.current.click();
                }}
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
            </div>

          </div>
        </div>
      )}

      {/* CAMERA */}
      {showCamera && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ width: 360 }}>
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
