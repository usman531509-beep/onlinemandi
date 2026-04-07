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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("mundi:sessionUser");
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
    if (pathname === "/admin/panel/settings") return "System Settings";
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
    { href: "/admin/panel/settings", label: "System Settings", icon: "fa-gear" },
  ];

  return (
    <main className="admin-shell panel-page pt-0 pt-md-4 pb-4 pb-md-5 mt-4">
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
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
              <div
                className="sidebar-overlay d-lg-none"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
            )}

            <div className={`col-12 col-xl-3 col-lg-4 dashboard-sidebar-col ${isSidebarOpen ? 'sidebar-reveal' : ''}`}>
              <aside className="panel-sidebar card border rounded-4 sticky-lg-top shadow-sm">
                <div className="sidebar-header p-3 d-lg-none d-flex justify-content-between align-items-center border-bottom">
                  <span className="fw-bold text-success">Menu</span>
                  <button className="btn btn-sm btn-light border-0" onClick={() => setIsSidebarOpen(false)}>
                    <i className="fa-solid fa-xmark fs-5"></i>
                  </button>
                </div>
                <div className="sidebar-top p-4 border-bottom">
                  <p className="small text-uppercase mb-2 sidebar-label">Admin Panel</p>
                  <h3 className="h6 fw-bold mb-3" style={{ color: "#1b4332" }}>Navigation</h3>
                  <nav className="sidebar-nav" aria-label="Admin navigation">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-btn text-decoration-none ${pathname === item.href ? "active" : ""}`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <i className={`fa-solid ${item.icon} flex-shrink-0`}></i>
                        <span className="text-truncate">{item.label}</span>
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

                {/* Sidebar actions moved to topbar */}
              </aside>
            </div>

            <div className="col-12 col-xl-9 col-lg-8 dashboard-main-col">
              <header className="dashboard-topbar card border shadow-sm rounded-4 mb-4 px-3 px-md-4 py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-light d-lg-none me-2 border-0 shadow-sm"
                      onClick={() => setIsSidebarOpen(true)}
                      aria-label="Open Menu"
                    >
                      <i className="fa-solid fa-bars-staggered text-success fs-5"></i>
                    </button>
                    <span className="topbar-dot"></span>
                    <span className="fw-semibold" style={{ color: "#1b4332" }}>{pageTitle}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-none d-md-flex align-items-center gap-2 text-muted small">
                        <i className="fa-regular fa-clock"></i>
                        <span>{new Date().toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" })}</span>
                        <span className="mx-1" style={{ color: "#ccc" }}>|</span>
                        <span>{sessionUser.fullName}</span>
                        <span className="badge text-bg-light border text-capitalize" style={{ fontSize: "0.7rem" }}>{sessionUser.role}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-2">
                        <Link href="/" className="btn btn-sm btn-outline-success border-0 fw-bold d-flex align-items-center gap-1">
                            <i className="fa-solid fa-house"></i>
                            <span className="d-none d-sm-inline">Home</span>
                        </Link>
                        <button
                            className="btn btn-sm btn-outline-danger border-0 d-flex align-items-center gap-1"
                            title="Logout"
                            onClick={() => {
                                localStorage.removeItem("mundi:sessionUser");
                                window.location.href = "/auth";
                            }}
                        >
                          <span className="d-none d-sm-inline fw-bold">Logout</span>
                            <i className="fa-solid fa-right-from-bracket"></i>
                            
                        </button>
                    </div>
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
