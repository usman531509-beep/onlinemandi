"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
};

export default function Navbar() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Close menus on route change
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const loadSession = () => {
      const raw = localStorage.getItem("mundi:sessionUser");
      if (!raw) {
        setSessionUser(null);
        return;
      }

      try {
        setSessionUser(JSON.parse(raw) as SessionUser);
      } catch {
        localStorage.removeItem("mundi:sessionUser");
        setSessionUser(null);
      }
    };

    loadSession();
    window.addEventListener("storage", loadSession);
    return () => window.removeEventListener("storage", loadSession);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("mundi:sessionUser");
    window.dispatchEvent(new Event("storage"));
    setSessionUser(null);
    router.push("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow py-2 py-lg-3">
      <div className="container">
        <Link className="navbar-brand fw-bold text-white d-flex align-items-center" href="/">
          <span>ONLINE<span className="text-warning">MUNDI</span></span>
          <small className="ms-2 opacity-75 d-none d-sm-inline" style={{ fontSize: "10px", letterSpacing: "1px" }}>PAKISTAN</small>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0 shadow-none p-2"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
        >
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'} fs-3 text-white`}></i>
        </button>

        {/* Navbar Content */}
        <div className={`navbar-collapse ${isMenuOpen ? "show" : ""}`} id="navbarMain">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-2">
            <li className="nav-item">
              <Link className={`nav-link text-center px-lg-3 ${pathname === "/" ? "active" : ""}`} href="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link text-center px-lg-3 ${pathname === "/about" ? "active" : ""}`} href="/about">
                About Us
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link text-center px-lg-3 ${pathname === "/contact" ? "active" : ""}`} href="/contact">
                Contact Us
              </Link>
            </li>
          </ul>

          <div className="d-flex justify-content-center align-items-center pt-2 pt-lg-0 border-top border-white border-opacity-10 mt-2 mt-lg-0">
            {sessionUser ? (
              <div className="dropdown w-100 w-lg-auto text-center">
                <button
                  className="btn btn-warning fw-semibold px-4 py-2 nav-auth-btn d-inline-flex align-items-center gap-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  aria-expanded={isDropdownOpen}
                >
                  <i className="fa-solid fa-circle-user fs-5 shadow-sm rounded-circle"></i>
                  <span>{sessionUser.fullName.split(" ")[0]}</span>
                  <i className="fa-solid fa-chevron-down ms-1" style={{ fontSize: "0.8em" }}></i>
                </button>
                <ul className={`dropdown-menu dropdown-menu-end shadow border-0 mt-lg-2 ${isDropdownOpen ? "show" : ""}`} style={{ minWidth: "220px" }}>
                  <li className="p-3 border-bottom d-lg-none text-center bg-light rounded-top">
                    <div className="fw-bold">{sessionUser.fullName}</div>
                    <div className="small text-muted">{sessionUser.email}</div>
                  </li>
                  <li className="d-none d-lg-block">
                    <h6 className="dropdown-header text-uppercase opacity-75 fw-bold" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                      Signed in as
                    </h6>
                    <div className="px-3 pb-2 mb-2 border-bottom">
                      <div className="fw-semibold text-truncate">{sessionUser.fullName}</div>
                      <div className="small text-muted text-truncate">{sessionUser.email}</div>
                    </div>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 d-flex align-items-center gap-2" href={`/${sessionUser.role}/panel`}>
                      <i className="fa-solid fa-gauge-high text-success w-20px text-center"></i> Dashboard
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <button className="dropdown-item py-2 text-danger d-flex align-items-center gap-2 fw-medium" onClick={handleLogout}>
                      <i className="fa-solid fa-arrow-right-from-bracket w-20px text-center"></i> Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link className="btn btn-warning fw-semibold px-4 py-2 nav-auth-btn w-100 w-lg-auto" href="/auth">
                Login / Signup
              </Link>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        :root {
          --primary-green: #1b4332;
          --mandi-gold: #ffca28;
          --light-bg: #f8f9fa;
        }

        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background-color: var(--light-bg) !important;
          color: #212529 !important;
        }

        .navbar {
          background-color: var(--primary-green) !important;
          z-index: 1050;
        }

        .navbar-collapse {
          transition: all 0.3s ease;
        }

        /* Essential fix for Desktop visibility */
        @media (min-width: 992px) {
          .navbar-collapse {
            display: flex !important;
            flex-basis: auto;
          }
        }

        @media (max-width: 991px) {
          .navbar-collapse:not(.show) {
            display: none !important;
          }
          
          .navbar-collapse.show {
            display: block !important;
            width: 100%;
          }

          .nav-link {
            padding: 12px;
            margin-bottom: 4px;
            background: rgba(255, 255, 255, 0.05);
            text-align: center;
          }

          .dropdown-menu {
            position: static !important;
            float: none;
            width: 100%;
            margin-top: 10px;
            background-color: white !important;
          }
        }

        /* Ensure icon is visible */
        .navbar-toggler {
          border-color: rgba(255,255,255,0.1) !important;
        }
        
        .navbar-toggler i {
          color: white !important;
        }

        .nav-link {
          color: white !important;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.12);
          color: var(--mandi-gold) !important;
        }

        .nav-link.active {
          color: var(--mandi-gold) !important;
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 2px solid var(--mandi-gold);
        }

        .nav-auth-btn {
          border-radius: 8px;
          color: #1b4332 !important;
          transition: transform 0.2s, background 0.2s;
        }

        .nav-auth-btn:hover {
          transform: translateY(-1px);
          background-color: #f7bd00 !important;
        }

        .w-20px { width: 20px; }
      `}</style>
    </nav>
  );
}
