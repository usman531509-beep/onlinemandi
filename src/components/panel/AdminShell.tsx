"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
};

type AdminShellProps = {
  children: (sessionUser: SessionUser) => ReactNode;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("mandi:sessionUser");
    if (!raw) {
      setIsReady(true);
      return;
    }

    try {
      setSessionUser(JSON.parse(raw) as SessionUser);
    } catch {
      localStorage.removeItem("mandi:sessionUser");
    } finally {
      setIsReady(true);
    }
  }, []);

  const pageTitle = useMemo(() => {
    if (pathname === "/admin/panel/users") return "Users";
    if (pathname === "/admin/panel/listings") return "Listings";
    if (pathname === "/admin/panel/categories") return "Categories";
    if (pathname === "/admin/panel/reviews") return "Reviews";
    if (pathname === "/admin/panel/requests/sell") return "Sell Requests";
    if (pathname === "/admin/panel/contacts") return "Contact Inquiries";
    if (pathname === "/admin/panel/pricing") return "Pricing Plans";
    if (pathname === "/admin/panel/payments") return "Payments History";
    return "Dashboard";
  }, [pathname]);

  const navItems = [
    { href: "/admin/panel", label: "Overview", icon: "fa-chart-line" },
    { href: "/admin/panel/users", label: "Users", icon: "fa-users" },
    { href: "/admin/panel/listings", label: "Listings", icon: "fa-list-check" },
    { href: "/admin/panel/categories", label: "Categories", icon: "fa-layer-group" },
    { href: "/admin/panel/reviews", label: "Reviews", icon: "fa-star" },
    { href: "/admin/panel/requests/sell", label: "Sell Requests", icon: "fa-envelope-open-text" },
    { href: "/admin/panel/pricing", label: "Pricing Plans", icon: "fa-tags" },
    { href: "/admin/panel/payments", label: "Payments History", icon: "fa-file-invoice-dollar" },
    { href: "/admin/panel/contacts", label: "Contact Inquiries", icon: "fa-headset" },
  ];

  return (
    <main className="admin-shell panel-page py-4 py-md-5">
      <div className="container-fluid panel-shell position-relative">
        {!isReady ? (
          <div className="card border shadow-sm p-4 p-md-5 text-center rounded-4 bg-white">
            <div className="d-flex flex-column align-items-center gap-3">
              <div className="spinner-border text-success" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <div>
                <h1 className="h5 fw-bold mb-1">Loading panel...</h1>
                <p className="text-muted mb-0 small">Preparing your dashboard.</p>
              </div>
            </div>
          </div>
        ) : !sessionUser ? (
          <div className="card border shadow-sm p-4 p-md-5 text-center rounded-4 bg-white" style={{ maxWidth: 520, margin: "0 auto" }}>
            <div className="mb-3">
              <i className="fa-solid fa-lock fa-2x" style={{ color: "#1b4332" }}></i>
            </div>
            <h1 className="h4 fw-bold">You are not logged in</h1>
            <p className="text-muted mb-4">Please login first to access your dashboard.</p>
            <Link href="/auth" className="btn btn-success px-4 py-2">
              <i className="fa-solid fa-arrow-right-to-bracket me-2"></i>
              Go to Login
            </Link>
          </div>
        ) : sessionUser.role !== "admin" ? (
          <div className="card border shadow-sm p-4 p-md-5 text-center rounded-4 bg-white" style={{ maxWidth: 520, margin: "0 auto" }}>
            <div className="mb-3">
              <i className="fa-solid fa-shield-halved fa-2x" style={{ color: "#dc3545" }}></i>
            </div>
            <h1 className="h4 fw-bold">Access restricted</h1>
            <p className="text-muted mb-4">This panel is for admin users only.</p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link href="/" className="btn btn-outline-secondary px-4">
                <i className="fa-solid fa-house me-2"></i>Back Home
              </Link>
              <Link href={`/${sessionUser.role}/panel`} className="btn btn-success px-4">
                <i className="fa-solid fa-arrow-right me-2"></i>Go to My Panel
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4 align-items-start panel-grid dashboard-frame">
            <div className="col-12 col-xl-2 col-lg-3 dashboard-sidebar-col">
              <aside className="panel-sidebar card border rounded-4 sticky-lg-top shadow-sm">
                <div className="sidebar-top p-4 border-bottom">
                  <p className="small text-uppercase mb-2 sidebar-label">Admin Panel</p>
                  <h3 className="h6 fw-bold mb-3" style={{ color: "#1b4332" }}>Navigation</h3>
                  <nav className="sidebar-nav" aria-label="Admin navigation">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-btn text-decoration-none ${pathname === item.href ? "active" : ""}`}
                      >
                        <i className={`fa-solid ${item.icon}`}></i>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="sidebar-user p-4 border-bottom">
                  <div className="user-chip mb-3">
                    <span>{initials(sessionUser.fullName)}</span>
                  </div>
                  <p className="small text-muted mb-1" style={{ fontSize: "0.75rem" }}>Signed in as</p>
                  <h3 className="h6 fw-bold mb-1 text-truncate" style={{ color: "#1b4332" }}>{sessionUser.fullName}</h3>
                  <p className="small text-muted mb-3 text-truncate">{sessionUser.email}</p>
                  <span className="role-pill text-capitalize">{sessionUser.role}</span>
                </div>

                <div className="p-4 pt-3 d-grid gap-2 sidebar-actions">
                  <Link href="/" className="btn btn-outline-secondary btn-sm">
                    <i className="fa-solid fa-house me-2"></i>Back Home
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      localStorage.removeItem("mandi:sessionUser");
                      window.location.href = "/auth";
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket me-2"></i>Logout
                  </button>
                </div>
              </aside>
            </div>

            <div className="col-12 col-xl-10 col-lg-9 dashboard-main-col">
              <header className="dashboard-topbar card border shadow-sm rounded-4 mb-4 px-3 px-md-4 py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="topbar-dot"></span>
                    <span className="fw-semibold" style={{ color: "#1b4332" }}>{pageTitle}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3 small text-muted">
                    <span className="d-flex align-items-center gap-2">
                      <i className="fa-regular fa-clock"></i>
                      <span>{new Date().toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" })}</span>
                    </span>
                    <span className="d-none d-sm-inline" style={{ color: "#ccc" }}>|</span>
                    <span className="d-none d-sm-flex align-items-center gap-2">
                      <i className="fa-regular fa-user"></i>
                      <span>{sessionUser.fullName}</span>
                      <span className="badge text-bg-light border text-capitalize" style={{ fontSize: "0.7rem" }}>{sessionUser.role}</span>
                    </span>
                  </div>
                </div>
              </header>

              {children(sessionUser)}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
