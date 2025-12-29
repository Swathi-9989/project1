import React, { useState, useEffect, useCallback } from "react";
import "./FloatingInput.css";
import "mdbootstrap/css/bootstrap.css";
import "mdbootstrap/css/mdb.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import API from "../api";

const COURSE_URL = "/courses/";

// API Helper

function Add_new_course() {
  const [courseName, setCourseName] = useState("");
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(null);

  // Sort alphabetically
  const sortCourses = (list) => list.sort((a, b) => a.name.localeCompare(b.name));

  // Fetch Courses
  const fetchCourses = useCallback(async () => {
    try {
      const res = await API(COURSE_URL,"GET");
      setCourses(sortCourses(res || []));

      setCurrentPage(1);
    } catch (err) {
      setError("Failed to load courses.");
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Add Course
  const handleAddCourse = async () => {
    if (!courseName.trim()) {
      setError("Course name is required.");
      return;
    }

    const exists = courses.some(
      (c) => c.name.toLowerCase() === courseName.trim().toLowerCase()
    );
    if (exists) {
      setError("Course already exists.");
      return;
    }

    try {
      await API(COURSE_URL, "POST", { name: courseName.trim() });

      setCourseName("");
      fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError("Course name cannot be empty.");
      return;
    }

    const exists = courses.some(
      (c) =>
        c.id !== editingCourse.id &&
        c.name.toLowerCase() === editName.trim().toLowerCase()
    );
    if (exists) {
      setEditError("Another course already exists with this name.");
      return;
    }

    try {
      await API(`${COURSE_URL}${editingCourse.id}/`,"PUT", {
        name: editName.trim(),
      });
      setShowEditModal(false);
      fetchCourses();
    } catch (err) {
      setEditError(err.message);
    }
  };

  // Delete Course
  const handleConfirmDelete = async () => {
    try {
      await API(`${COURSE_URL}${deletingCourse.id}/`,"DELETE");
      setShowDeleteModal(false);
      fetchCourses();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(courses.length / itemsPerPage);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCourses = courses.slice(indexOfFirst, indexOfLast);

  // Page Numbers with Ellipsis
  const getPageNumbers = () => {
    let pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, "...", totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      } else {
        pages = [
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        ];
      }
    }
    return pages;
  };

  return (
    <div className="container">
      <div className="card shadow-lg rounded-3 overflow-hidden">
        <div className="card-header bg-primary">
          <p className="h5 mb-0 text-white text-center">Add / Manage Courses</p>
        </div>

        <div className="card-body text-center">

          {/* ADD COURSE */}
          <div className="d-flex flex-wrap justify-content-center gap-4 mb-2">
            <label htmlFor="courseName">Course Name</label>
            <div className="d-flex" style={{ width: "450px" }}>

              <input
                type="text"
                id="courseName"
                value={courseName}
                placeholder=" "
                className={`form-control ${error ? "border-danger" : ""}`}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  setError("");
                }}
              />

              {error && <small className="text-danger">{error}</small>}
            </div>

            <button className="custom-btn custom-btn-green btn-sm px-3" onClick={handleAddCourse}>
              + Add Course
            </button>
          </div>

          {/* COURSE TABLE */}
          <div className="table-responsive w-50 mx-auto mt-0 ">
            <table className="table table-sm compact-table">

              <thead className="table-primary">
                <tr>
                  <th>S.No</th>
                  <th>Course Name</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentCourses.map((course, index) => (
                  <tr key={course.id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td className=" text-left">{course.name}</td>
                    <td>
                      <i
                        className="bi bi-pencil text-primary me-3"
                        style={{ cursor: "pointer", fontSize: "15px" }}
                        onClick={() => {
                          setEditingCourse(course);
                          setEditName(course.name);
                          setShowEditModal(true);
                        }}
                      ></i>

                      <i
                        className="bi bi-trash text-danger"
                        style={{ cursor: "pointer", fontSize: "15px" }}
                        onClick={() => {
                          setDeletingCourse(course);
                          setShowDeleteModal(true);
                        }}
                      ></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {courses.length > itemsPerPage && (
            <div className="d-flex justify-content-center align-items-center gap-2 mt-3">

              {/* Left Arrow */}
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={
                    page === currentPage
                      ? "btn btn-primary rounded-circle d-flex justify-content-center align-items-center mx-1"
                      : page === "..."
                        ? "btn btn-light rounded-circle disabled mx-1"
                        : "btn btn-outline-primary rounded-circle d-flex justify-content-center align-items-center mx-1"
                  }
                  style={{
                    width: "20px",
                    height: "20px",
                    fontSize: "10px",
                    padding: 0,
                    cursor: page === "..." ? "default" : "pointer",
                  }}
                  onClick={() => page !== "..." && setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              {/* Right Arrow */}
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

      {/* EDIT MODAL */}
      {showEditModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered" style={{ width: "400px", height: "230px" }} >
              <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Edit Course</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <label className="fw-bold">New Course Name</label>
                  <input
                    style={{ width: "180px", height: "35px", fontSize: "12px" }}
                    type="text"
                    className={`form-control ${editError ? "border-danger" : ""}`}
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setEditError("");
                    }}
                  />
                  {editError && <small className="text-danger">{editError}</small>}
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <button className="custom-btn custom-btn-green" onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                  <button
                    className="custom-btn custom-btn-red"
                    onClick={() => setShowEditModal(false)}
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <>
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered" style={{ width: "400px", height: "200px" }}>
              <div className="modal-content rounded-4 overflow-hidden animated jackInTheBox ">
                <div className="modal-header bg-danger text-white ">
                  <h5 className="modal-title ">Confirm Delete</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>

                <div className="modal-body text-center">
                  <p className="fw-bold" >Are you sure you want to delete: <span className="text-danger h4 fw-bold">{deletingCourse?.name}</span></p>
                </div>

                <div className="modal-footer d-flex justify-content-between" >
                  <button className="custom-btn custom-btn-red" onClick={handleConfirmDelete}>
                    Delete
                  </button>
                  <button
                    className="custom-btn custom-btn-blue"
                    onClick={() => setShowDeleteModal(false)}
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

export default Add_new_course;