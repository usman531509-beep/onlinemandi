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
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadSession = () => {
      const raw = localStorage.getItem("mandi:sessionUser");
      if (!raw) {
        setSessionUser(null);
        return;
      }

      try {
        setSessionUser(JSON.parse(raw) as SessionUser);
      } catch {
        localStorage.removeItem("mandi:sessionUser");
        setSessionUser(null);
      }
    };

    loadSession();
    window.addEventListener("storage", loadSession);
    return () => window.removeEventListener("storage", loadSession);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("mandi:sessionUser");
    window.dispatchEvent(new Event("storage"));
    setSessionUser(null);
    router.push("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold text-white" href="/">
          ONLINE<span className="text-warning">MANDI</span>{" "}
          <small style={{ fontSize: "12px" }}>Pakistan</small>
        </Link>
        <div className="navbar-center">
          <ul className="navbar-nav flex-row align-items-center">
            <li className="nav-item">
              <Link className={`nav-link ${pathname === "/" ? "active" : ""}`} href="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname === "/about" ? "active" : ""}`} href="/about">
                About Us
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname === "/contact" ? "active" : ""}`} href="/contact">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-right">
          {sessionUser ? (
            <div className="dropdown">
              <button
                className="btn btn-warning fw-semibold px-3 py-2 nav-auth-btn d-flex align-items-center gap-2"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                aria-expanded={isDropdownOpen}
              >
                <i className="fa-solid fa-circle-user fs-5 shadow-sm rounded-circle"></i>
                <span className="d-none d-sm-inline">{sessionUser.fullName.split(" ")[0]}</span>
                <i className="fa-solid fa-chevron-down ms-1" style={{ fontSize: "0.8em" }}></i>
              </button>
              <ul className={`dropdown-menu dropdown-menu-end shadow border-0 mt-2 ${isDropdownOpen ? "show" : ""}`} style={{ minWidth: "200px" }}>
                <li>
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
                <li>
                  <hr className="dropdown-divider my-1" />
                </li>
                <li>
                  <button className="dropdown-item py-2 text-danger d-flex align-items-center gap-2 fw-medium" onClick={handleLogout}>
                    <i className="fa-solid fa-arrow-right-from-bracket w-20px text-center"></i> Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link className="btn btn-warning fw-semibold px-3 py-2 nav-auth-btn" href="/auth">
              Login / Signup
            </Link>
          )}
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
        }

        .navbar .container {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .navbar-center .navbar-nav {
          gap: 0.5rem;
        }

        .navbar-right {
          display: flex;
          align-items: center;
        }

        .nav-link {
          color: white !important;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-link.active {
          border-bottom: 2px solid var(--mandi-gold);
        }

        .nav-auth-btn {
          border-radius: 8px;
          color: #1b4332;
        }

        .btn-mandi {
          background-color: var(--primary-green);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 8px;
        }

        .btn-mandi:hover {
          background-color: #081c15;
          color: white;
        }

        .w-20px { width: 20px; }

        @media (max-width: 991px) {
          .navbar-center {
            position: static;
            transform: none;
            margin: 0 auto;
          }

          .navbar .container {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }

        @media (max-width: 575px) {
          .navbar .container {
            justify-content: center;
            text-align: center;
          }

          .navbar-brand {
            width: 100%;
            text-align: center;
            margin-bottom: 0.25rem;
          }

          .navbar-center {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          .navbar-right {
            width: 100%;
            justify-content: center;
            margin-top: 0.25rem;
          }
        }
      `}</style>
    </nav>
  );
}
