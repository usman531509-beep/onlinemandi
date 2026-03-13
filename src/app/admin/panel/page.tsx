"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/panel/AdminShell";

type DashboardStats = {
  totalUsers: number;
  openListings: number;
  pendingVerifications: number;
  revenue: number;
};

export default function AdminOverviewPage() {
  return (
    <AdminShell>
      {(sessionUser) => <OverviewContent userId={sessionUser.id} role={sessionUser.role} fullName={sessionUser.fullName} />}
    </AdminShell>
  );
}

function OverviewContent({ userId, role, fullName }: { userId: string; role: "admin" | "buyer" | "seller"; fullName: string }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    openListings: 0,
    pendingVerifications: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/stats?role=${role}&userId=${userId}`);
      const data = (await response.json()) as {
        ok: boolean;
        stats?: DashboardStats;
      };

      if (response.ok && data.ok && data.stats) {
        setStats(data.stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const cards = useMemo(
    () => [
      { label: "Total Users", value: stats.totalUsers.toLocaleString(), className: "stat-soft-blue", icon: "fa-users" },
      { label: "Open Listings", value: stats.openListings.toLocaleString(), className: "stat-soft-green", icon: "fa-list-check" },
      {
        label: "Pending Verifications",
        value: stats.pendingVerifications.toLocaleString(),
        className: "stat-soft-slate",
        icon: "fa-clock",
      },
      {
        label: "Revenue",
        value: new Intl.NumberFormat("en-PK", {
          style: "currency",
          currency: "PKR",
          maximumFractionDigits: 0,
        }).format(stats.revenue),
        className: "stat-soft-amber",
        icon: "fa-coins",
      },
    ],
    [stats]
  );

  return (
    <>
      <section className="panel-hero rounded-4 p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="hero-decoration"></div>
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap position-relative">
          <div>
            <p className="mb-2 small text-uppercase hero-subtitle">
              <i className="fa-solid fa-gauge-high me-2"></i>System Overview
            </p>
            <h1 className="display-6 fw-bold mb-2">Welcome back, {fullName}!</h1>
            <p className="mb-0 hero-text">Track users, listings, and platform activity from this dashboard.</p>
          </div>
          <button className="btn btn-outline-success" onClick={() => void loadStats()} disabled={isLoading}>
            <i className={`fa-solid fa-rotate-right me-2 ${isLoading ? "fa-spin" : ""}`}></i>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-md-6 col-xl-3" key={card.label}>
            <div className={`card border-0 shadow-sm h-100 stat-card ${card.className}`}>
              <div className="card-body position-relative">
                <div className="stat-icon-bg">
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <p className="small text-uppercase fw-semibold mb-2" style={{ opacity: 0.7, letterSpacing: "0.06em", fontSize: "0.72rem" }}>{card.label}</p>
                <h3 className="display-6 fw-bold mb-0">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .panel-hero {
          background: linear-gradient(135deg, #1b4332 0%, #264f3e 30%, #2a6b4e 70%, #1e5a3c 100%);
          border: none;
          color: #fff;
          position: relative;
        }

        .hero-decoration {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }

        .hero-decoration::after {
          content: "";
          position: absolute;
          bottom: -100px;
          left: -150px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }

        .hero-subtitle {
          color: rgba(255,255,255,0.65);
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .hero-text {
          max-width: 700px;
          color: rgba(255,255,255,0.75);
        }

        .panel-hero :global(.btn-outline-success) {
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }

        .panel-hero :global(.btn-outline-success:hover) {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.5);
          color: #fff;
        }

        .stat-card {
          border-radius: 18px !important;
          color: #1f2d26;
          border: 1px solid rgba(27,67,50,0.06) !important;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(27,67,50,0.12), 0 4px 8px rgba(27,67,50,0.06);
        }

        .stat-icon-bg {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 1.1rem;
          color: rgba(27,67,50,0.25);
          background: rgba(27,67,50,0.04);
        }

        .stat-soft-blue {
          background: linear-gradient(135deg, #edf4ff 0%, #e0edff 100%);
        }

        .stat-soft-green {
          background: linear-gradient(135deg, #e7f9ef 0%, #d8f0e3 100%);
        }

        .stat-soft-slate {
          background: linear-gradient(135deg, #eef2f6 0%, #e4e9ef 100%);
        }

        .stat-soft-amber {
          background: linear-gradient(135deg, #fff8e6 0%, #ffefcc 100%);
        }
      `}</style>
    </>
  );
}
