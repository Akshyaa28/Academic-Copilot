import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        📘 Academic Co-Pilot
        <span>Syllabus → Mastery</span>
      </div>

      <div className="nav-right">
        <a href="#features">Features</a>

        <Link to="/login">
          <button className="btn-outline">Login</button>
        </Link>

        <Link to="/signup">
          <button className="btn-primary">Get Started →</button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;