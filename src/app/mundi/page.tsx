"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";
import { findGroupForCategory, getCategoryOptionsForGroup, getGroupOptions } from "@/lib/category-filters";

type Listing = {
  id: string;
  title: string;
  group?: string;
  category: string;
  grade?: string;
  moisture?: string;
  delivery?: string;
  images?: string[];
  city: string;
  quantity: string;
  pricePerMaund: number;
  description: string;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    role: "admin" | "buyer" | "seller";
    verificationStatus?: string;
  } | null;
};

type Category = {
  id: string;
  group?: string;
  name: string;
};

export default function MundiPage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, categoriesRes] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/categories"),
        ]);

        const listingsJson = await listingsRes.json();
        const categoriesJson = await categoriesRes.json();

        if (listingsRes.ok && listingsJson.ok) {
          setListings(listingsJson.listings || []);
        }
        if (categoriesRes.ok && categoriesJson.ok) {
          setCategories(categoriesJson.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch mundi data:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      const matchesSearch = title.includes(query) || desc.includes(query);
      const listingGroup = item.group || findGroupForCategory(categories, item.category);
      const matchesGroup = groupFilter === "all" || listingGroup === groupFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesCity = cityFilter === "all" || item.city === cityFilter;
      const matchesGrade = gradeFilter === "all" || (item.grade || "Unspecified") === gradeFilter;
      const matchesRole = roleFilter === "all" || item.createdBy?.role === roleFilter;

      return matchesSearch && matchesGroup && matchesCategory && matchesCity && matchesGrade && matchesRole;
    });
  }, [categories, listings, searchQuery, groupFilter, categoryFilter, cityFilter, gradeFilter, roleFilter]);

  const groupOptions = useMemo(() => {
    return getGroupOptions(categories);
  }, [categories]);

  const categoryOptions = useMemo(() => {
    return getCategoryOptionsForGroup(categories, groupFilter);
  }, [categories, groupFilter]);

  const cityOptions = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.city))).sort();
  }, [listings]);

  const gradeOptions = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.grade || "Unspecified"))).sort();
  }, [listings]);

  const resetFilters = () => {
    setSearchQuery("");
    setGroupFilter("all");
    setCategoryFilter("all");
    setCityFilter("all");
    setGradeFilter("all");
    setRoleFilter("all");
  };

  useEffect(() => {
    if (categoryFilter === "all") return;
    if (!categoryOptions.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  const FilterContent = ({ hideHeader }: { hideHeader?: boolean }) => (
    <>
      {!hideHeader && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold m-0"><i className="fa-solid fa-sliders me-2 text-success"></i>{t("mundi.filters")}</h5>
          <button onClick={resetFilters} className="btn btn-sm text-danger p-0 fw-semibold">{t("mundi.clearFilters")}</button>
        </div>
      )}

      <div className="mb-4 d-none d-lg-block">
        <label className="form-label small fw-bold text-muted text-uppercase">Keyword</label>
        <div className="input-group">
          <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-magnifying-glass"></i></span>
          <input 
            type="text" 
            className="form-control bg-light border-start-0 ps-0" 
            placeholder={t("mundi.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">{t("home.filterGroup")}</label>
        <select
          className="form-select bg-light border-0"
          value={groupFilter}
          onChange={(e) => {
            setGroupFilter(e.target.value);
            setCategoryFilter("all");
          }}
        >
          <option value="all">{t("home.allGroups")}</option>
          {groupOptions.map(group => <option key={group} value={group}>{group}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">{t("home.filterCategory")}</label>
        <select
          className="form-select bg-light border-0"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">{t("home.allCategories")}</option>
          {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">{t("home.filterCity")}</label>
        <select
          className="form-select bg-light border-0"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="all">{t("home.allCities")}</option>
          {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">{t("home.filterGrade")}</label>
        <select
          className="form-select bg-light border-0"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="all">{t("home.allGrades")}</option>
          {gradeOptions.map(grade => <option key={grade} value={grade}>{grade}</option>)}
        </select>
      </div>

      <div className="mb-0">
        <label className="form-label small fw-bold text-muted text-uppercase">Listing Source</label>
        <div className="d-flex flex-column gap-2 mt-2">
          <div className="form-check custom-radio">
            <input className="form-check-input" type="radio" name="roleFilter" id="roleAll" checked={roleFilter === "all"} onChange={() => setRoleFilter("all")} />
            <label className="form-check-label small" htmlFor="roleAll">{t("mundi.allRoles")}</label>
          </div>
          <div className="form-check custom-radio">
            <input className="form-check-input" type="radio" name="roleFilter" id="roleAdmin" checked={roleFilter === "admin"} onChange={() => setRoleFilter("admin")} />
            <label className="form-check-label small" htmlFor="roleAdmin">{t("mundi.adminOnly")}</label>
          </div>
          <div className="form-check custom-radio">
            <input className="form-check-input" type="radio" name="roleFilter" id="roleSeller" checked={roleFilter === "seller"} onChange={() => setRoleFilter("seller")} />
            <label className="form-check-label small" htmlFor="roleSeller">{t("mundi.sellerOnly")}</label>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="mundi-page-wrapper">
      <Navbar />

      <div className="bg-white border-bottom py-3">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-success">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Mundi Results</li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="container py-4 py-lg-5">
        <div className="row d-lg-none g-2 mb-4">
          <div className="col">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted"><i className="fa-solid fa-magnifying-glass"></i></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder={t("mundi.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-auto">
            <button 
              className="btn btn-success h-100 px-3 shadow-sm" 
              type="button" 
              data-bs-toggle="offcanvas" 
              data-bs-target="#offcanvasFilters"
            >
              <i className="fa-solid fa-sliders"></i>
            </button>
          </div>
        </div>

        <div className="row g-4">
          <aside className="col-lg-3 d-none d-lg-block">
            <div className="card border-0 shadow-sm rounded-4 sticky-lg-top" style={{ top: "100px" }}>
              <div className="card-body p-4">
                <FilterContent />
              </div>
            </div>
          </aside>

          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h2 className="fw-bold mb-1 h3 h2-lg">{t("mundi.title")}</h2>
                <p className="text-muted mb-0 small">{filteredListings.length} {t("home.productsFound")}</p>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge bg-danger rounded-pill px-3 py-2"><i className="fa-solid fa-circle-dot me-1"></i>Live</span>
              </div>
            </div>

            {loading ? (
              <div className="card border-0 shadow-sm rounded-4 text-center py-5">
                <div className="card-body">
                  <div className="spinner-border text-success" role="status"></div>
                  <p className="mt-3 text-muted mb-0">{t("mundi.loading")}</p>
                </div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4 text-center py-5 px-4">
                <div className="card-body">
                  <div className="mb-4">
                    <i className="fa-solid fa-magnifying-glass-chart fa-4x text-light"></i>
                  </div>
                  <h4 className="fw-bold">{t("mundi.noListings")}</h4>
                  <p className="text-muted mx-auto" style={{ maxWidth: "400px" }}>
                    {t("mundi.noListings")}
                  </p>
                  <button onClick={resetFilters} className="btn btn-success rounded-pill px-5 py-2 mt-2">View All Listings</button>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {filteredListings.map((item) => (
                  <div className="col-6 col-md-4 col-xl-4" key={item.id}>
                    <div className="lc h-100">
                      <div className="lc-img">
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            width={400}
                            height={300}
                            unoptimized
                            className="lc-img-src"
                          />
                        ) : (
                          <div className="lc-img-empty">
                            <i className="fa-solid fa-wheat-awn"></i>
                          </div>
                        )}
                        {item.createdBy?.verificationStatus === "verified" && (
                          <span className="lc-badge-verified">
                            <i className="fa-solid fa-circle-check"></i> {t("home.verifiedSeller")}
                          </span>
                        )}
                      </div>
                      <div className="lc-body">
                        <h6 className="lc-title">{item.title}</h6>
                        <div className="lc-info">
                          <div className="lc-info-row">
                            <i className="fa-solid fa-location-dot"></i>
                            <span>{item.city}</span>
                          </div>
                          <div className="lc-info-row">
                            <i className="fa-solid fa-calendar-days"></i>
                            <span>{new Date(item.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                        <div className="lc-divider"></div>
                        <div className="lc-footer">
                          <div className="lc-price-block">
                            <span className="lc-price-label">{t("home.perMaund").toUpperCase()}</span>
                            <span className="lc-price-value">{item.pricePerMaund.toLocaleString()}</span>
                          </div>
                          <Link href={`/listing/${item.id}`} className="lc-btn">
                            {t("home.viewDetails")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="offcanvas offcanvas-start rounded-end-4" tabIndex={-1} id="offcanvasFilters" aria-labelledby="offcanvasFiltersLabel" style={{ zIndex: 1060 }}>
        <div className="offcanvas-header border-bottom py-3">
          <h5 className="offcanvas-title fw-bold" id="offcanvasFiltersLabel">
            <i className="fa-solid fa-sliders me-2 text-success"></i>{t("mundi.filters")}
          </h5>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36, padding: 0 }}
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="offcanvas-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button onClick={resetFilters} className="btn btn-sm text-danger p-0 fw-semibold">{t("mundi.clearFilters")}</button>
          </div>
          <FilterContent hideHeader />
          <div className="mt-5 pt-3 border-top">
            <button className="btn btn-success w-100 py-3 rounded-4 fw-bold" data-bs-dismiss="offcanvas">Show Results</button>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx global>{`
        .mundi-page-wrapper {
          background-color: #f6f9f7;
          min-height: 100vh;
        }

        .breadcrumb-item + .breadcrumb-item::before {
          content: "›";
          font-size: 1.2rem;
          color: #adb5bd;
          vertical-align: middle;
        }

        .custom-radio .form-check-input:checked {
          background-color: #1b4332;
          border-color: #1b4332;
        }

        @media (max-width: 991px) {
          .h2-lg { font-size: calc(1.325rem + 0.9vw); }
        }

        /* ===== Listing Cards (same as home) ===== */
        .lc {
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .lc:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.1);
        }

        .lc-img {
          position: relative;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          background: #f2f6f4;
        }

        .lc-img-src {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .lc:hover .lc-img-src {
          transform: scale(1.06);
        }

        .lc-img-empty {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #eef5f1, #dde8e1);
          color: #b5cfc0;
          font-size: 2rem;
        }

        .lc-badge-verified {
          position: absolute;
          top: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #2d6a4f;
          color: #fff;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 50px;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        .lc-badge-verified i {
          font-size: 0.62rem;
        }

        .lc-body {
          padding: 18px 20px 20px;
        }

        .lc-title {
          font-weight: 700;
          font-size: 1.05rem;
          color: #111;
          margin: 0 0 14px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lc-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .lc-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #666;
        }

        .lc-info-row i {
          color: #2d6a4f;
          font-size: 0.78rem;
          width: 16px;
          text-align: center;
        }

        .lc-divider {
          height: 1px;
          background: #eee;
          margin-bottom: 16px;
        }

        .lc-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .lc-price-block {
          display: flex;
          flex-direction: column;
        }

        .lc-price-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .lc-price-value {
          font-weight: 800;
          font-size: 1.3rem;
          color: #1b4332;
          line-height: 1;
        }

        .lc-btn {
          display: inline-flex;
          align-items: center;
          background: #1b4332;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 50px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .lc-btn:hover {
          background: #245a3e;
          color: #fff;
          transform: scale(1.03);
        }

        @media (max-width: 575px) {
          .lc-body {
            padding: 14px 14px 16px;
          }
          .lc-title {
            font-size: 0.9rem;
            margin-bottom: 10px;
          }
          .lc-info-row {
            font-size: 0.75rem;
          }
          .lc-price-value {
            font-size: 1.1rem;
          }
          .lc-btn {
            font-size: 0.7rem;
            padding: 6px 12px;
          }
          .lc-badge-verified {
            font-size: 0.6rem;
            padding: 4px 9px;
            top: 8px;
            left: 8px;
          }
        }
      `}</style>

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
