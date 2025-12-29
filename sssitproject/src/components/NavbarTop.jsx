import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/adminlogo.webp";
import certificate from "../assets/Certified001.webp";

const customDropdownMenuStyle = {

  minWidth: "100px",
  padding: "1px 0",

};

const customDropdownItemStyle = {
  fontSize: "0.9rem",
  padding: "5px 25px",
  height:"28px",
};

const NavbarTop = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const navItemStyle = {

    fontSize: "clamp(0.9rem, 0.9vw, 0.90rem)",
    whiteSpace: "nowrap",
    padding:"4px 12px"
  };

  const handleConfirmLogout = () => {
    sessionStorage.removeItem("admin");
    window.dispatchEvent(new Event("storage"));

    setShowLogoutConfirm(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="bg-white border-bottom top-0 z-3">
        <div className="container-fluid d-flex justify-content-center align-items-center gap-3 py-2">
        < img
  src={logo}
  alt="SSSIT Logo"
  width="300"
  height="80"
  loading="lazy"
  decoding="async"
  className="rounded"
  style={{ objectFit: "contain", borderRadius: "20px" }}
/>

<img
  src={certificate}
  alt="ISO Certification"
  width="300"
  height="80"
  loading="lazy"
  decoding="async"
  className="rounded"
  style={{ objectFit: "contain", borderRadius: "20px" }}
/>
        </div>
      </header>

      {/* Navbar Section */}
      <nav className="navbar navbar-expand shadow-sm py-1 z-1 w-100 mt-0" >
        <div className="container-fluid justify-content-center ">

          <div
            className="collapse navbar-collapse justify-content-center"
            id="navbarNav"
          >
            <ul className="navbar-nav d-flex flex-wrap justify-content-center align-items-center gap-2">
              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/"
                  style={navItemStyle}
                >
                  Home
                </NavLink>
              </li>


              <li className="nav-item dropdown nav-pills" >
                <NavLink
                  className="nav-link dropdown-toggle text-white fw-semibold"
                  to="#"
                  id="admissionDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={navItemStyle}
                >
                  Admission Enroll
                </NavLink>
                <ul
                  className="dropdown-menu text-center"
                  aria-labelledby="admissionDropdown"

                  style={customDropdownMenuStyle}
                >
                  <li>
                    <NavLink className="dropdown-item" to="/enroll/new" style={customDropdownItemStyle}>
                      New Student
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/enroll/old" style={customDropdownItemStyle}>
                      Old Student
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/edit" style={customDropdownItemStyle}>
                      Edit Student
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/delete" style={customDropdownItemStyle}>
                      Delete Student
                    </NavLink>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/fees"
                  style={navItemStyle}
                >
                  Fee Receipts
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/search-id"
                  style={navItemStyle}
                >
                  Search Students
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/arrears"
                  style={navItemStyle}
                >
                  Arrears List
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/faculty"
                  style={navItemStyle}
                >
                  Faculty Details
                </NavLink>
              </li>



              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/add-course"
                  style={navItemStyle}
                >
                  Add Course
                </NavLink>
              </li>



              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/export"
                  style={navItemStyle}
                >
                  Export Details
                </NavLink>
              </li>



              <li className="nav-item">
                <NavLink
                  className="nav-link text-white fw-semibold"
                  to="/student-details"
                  style={navItemStyle}
                >
                  Break Details
                </NavLink>
              </li>



              <li className="nav-item dropdown">
                <NavLink
                  className="nav-link dropdown-toggle text-white fw-semibold"
                  to="#"
                  id="examDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={navItemStyle}
                >
                  Exam Details
                </NavLink>
                <ul
                  className="dropdown-menu text-center"
                  aria-labelledby="examDropdown"
                  style={customDropdownMenuStyle}
                >
                  <li>
                    <NavLink className="dropdown-item" to="/add_exam_student" style={customDropdownItemStyle}>
                      Exam Details
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      className="dropdown-item"
                      to="/exam_written_students"
                      style={customDropdownItemStyle}
                    >
                      Written Students
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/certificate_details" style={customDropdownItemStyle}>
                      Certificate Details
                    </NavLink>
                  </li>
                </ul>
              </li>



              <li className="nav-item">
                <button
                  className="btn nav-link text-white fw-semibold"
                  onClick={() => setShowLogoutConfirm(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    ...navItemStyle,
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>



      {showLogoutConfirm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center "
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        >
          <div
            className="bg-white p-4 rounded shadow-lg animated jello"
            style={{ width: "600px" }}
          >
            <div className="text-center mb-3">
              <img
                src={logo}
                alt="Logo"
                width="200"
                height="50"
                loading="lazy"
                decoding="async"
                style={{ objectFit: "contain" }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />

            </div>

            <p className="text-center mt-3 h3">
              Are you sure you want to logout?
            </p>

            <div className="d-flex justify-content-between mt-4">
              <button className="custom-btn custom-btn-red px-4" onClick={handleConfirmLogout}>
                Logout
              </button>

              <button
                className="custom-btn custom-btn-green px-4 "
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarTop;