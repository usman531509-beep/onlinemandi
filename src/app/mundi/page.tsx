"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Listing = {
  id: string;
  title: string;
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
  name: string;
};

export default function MundiPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
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
      
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesCity = cityFilter === "all" || item.city === cityFilter;
      const matchesGrade = gradeFilter === "all" || (item.grade || "Unspecified") === gradeFilter;
      const matchesRole = roleFilter === "all" || item.createdBy?.role === roleFilter;

      return matchesSearch && matchesCategory && matchesCity && matchesGrade && matchesRole;
    });
  }, [listings, searchQuery, categoryFilter, cityFilter, gradeFilter, roleFilter]);

  const cityOptions = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.city))).sort();
  }, [listings]);

  const gradeOptions = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.grade || "Unspecified"))).sort();
  }, [listings]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setCityFilter("all");
    setGradeFilter("all");
    setRoleFilter("all");
  };

  const FilterContent = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0"><i className="fa-solid fa-sliders me-2 text-success"></i>Refine Search</h5>
        <button onClick={resetFilters} className="btn btn-sm text-danger p-0 fw-semibold">Clear All</button>
      </div>

      <div className="mb-4 d-none d-lg-block">
        <label className="form-label small fw-bold text-muted text-uppercase">Keyword</label>
        <div className="input-group">
          <span className="input-group-text bg-light border-end-0 text-muted"><i className="fa-solid fa-magnifying-glass"></i></span>
          <input 
            type="text" 
            className="form-control bg-light border-start-0 ps-0" 
            placeholder="Search crop..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">Category</label>
        <select 
          className="form-select bg-light border-0" 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">City / District</label>
        <select 
          className="form-select bg-light border-0" 
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="all">All Locations</option>
          {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label small fw-bold text-muted text-uppercase">Quality Grade</label>
        <select 
          className="form-select bg-light border-0" 
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          <option value="all">All Grades</option>
          {gradeOptions.map(grade => <option key={grade} value={grade}>{grade}</option>)}
        </select>
      </div>

      <div className="mb-0">
        <label className="form-label small fw-bold text-muted text-uppercase">Listing Source</label>
        <div className="d-flex flex-column gap-2 mt-2">
          <div className="form-check custom-radio">
            <input className="form-check-input" type="radio" name="roleFilter" id="roleAll" checked={roleFilter === "all"} onChange={() => setRoleFilter("all")} />
            <label className="form-check-label small" htmlFor="roleAll">All Listings</label>
          </div>
          <div className="form-check custom-radio">
            <input className="form-check-input" type="radio" name="roleFilter" id="roleAdmin" checked={roleFilter === "admin"} onChange={() => setRoleFilter("admin")} />
            <label className="form-check-label small" htmlFor="roleAdmin">Verified by Admin</label>
          </div>
          <div className="form-check custom-radio">
            <input className="form-check-input" type="radio" name="roleFilter" id="roleSeller" checked={roleFilter === "seller"} onChange={() => setRoleFilter("seller")} />
            <label className="form-check-label small" htmlFor="roleSeller">Direct Sellers</label>
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
                placeholder="Search..." 
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
                <h2 className="fw-bold mb-1 h3 h2-lg">Live Mundi Feed</h2>
                <p className="text-muted mb-0 small">{filteredListings.length} active trade listings found</p>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge bg-danger rounded-pill px-3 py-2"><i className="fa-solid fa-circle-dot me-1"></i>Live</span>
              </div>
            </div>

            {loading ? (
              <div className="card border-0 shadow-sm rounded-4 text-center py-5">
                <div className="card-body">
                  <div className="spinner-border text-success" role="status"></div>
                  <p className="mt-3 text-muted mb-0">Syncing live listings...</p>
                </div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4 text-center py-5 px-4">
                <div className="card-body">
                  <div className="mb-4">
                    <i className="fa-solid fa-magnifying-glass-chart fa-4x text-light"></i>
                  </div>
                  <h4 className="fw-bold">No results found</h4>
                  <p className="text-muted mx-auto" style={{ maxWidth: "400px" }}>
                    We couldn&apos;t find any listings matching your selection. 
                  </p>
                  <button onClick={resetFilters} className="btn btn-success rounded-pill px-5 py-2 mt-2">View All Listings</button>
                </div>
              </div>
            ) : (
              <div className="row g-3 g-md-4">
                {filteredListings.map((item) => (
                  <div className="col-sm-6 col-xl-4" key={item.id}>
                    <div className="card h-100 border-0 shadow-sm rounded-4 listing-card-premium overflow-hidden border-hover">
                      <Link href={`/listing/${item.id}`} className="text-decoration-none h-100 d-flex flex-column">
                        <div className="position-relative overflow-hidden">
                          {item.images?.[0] ? (
                            <Image 
                              src={item.images[0]} 
                              alt={item.title} 
                              width={400} 
                              height={240} 
                              className="card-img-top listing-img"
                              unoptimized
                            />
                          ) : (
                            <div className="card-img-top d-flex align-items-center justify-content-center text-muted bg-gradient-light" style={{ height: "200px" }}>
                              <i className="fa-regular fa-image fa-3x op-30"></i>
                            </div>
                          )}
                          <div className="position-absolute top-0 start-0 p-3">
                            <span className={`badge ${item.createdBy?.role === "admin" ? "bg-dark" : "bg-primary"} shadow-sm rounded-pill px-3`}>
                              {item.createdBy?.role === "admin" ? "Verified" : "Direct Seller"}
                            </span>
                          </div>
                        </div>
                        <div className="card-body p-3 p-md-4 d-flex flex-column">
                          <h5 className="card-title fw-bold text-dark mb-2 line-clamp-2">{item.title}</h5>
                          
                          <div className="mb-3 mt-1">
                            <div className="d-flex align-items-center text-muted small mb-1">
                              <i className="fa-solid fa-location-dot text-success me-2 width-16"></i> {item.city}
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                              <i className="fa-solid fa-calendar text-muted me-2 width-16"></i> {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-end mt-auto pt-3 border-top">
                            <div className="price-tag">
                              <span className="x-small text-muted text-uppercase fw-bold d-block mb-1">Rs / Maund</span>
                              <span className="h5 fw-bold text-success mb-0">{item.pricePerMaund.toLocaleString()}</span>
                            </div>
                            <span className="btn btn-success btn-sm rounded-pill px-4 py-2 hover-ripple">Details</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="offcanvas offcanvas-start rounded-end-4" tabIndex={-1} id="offcanvasFilters" aria-labelledby="offcanvasFiltersLabel">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold" id="offcanvasFiltersLabel">Mundi Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body p-4">
          <FilterContent />
          <div className="mt-5 pt-3 border-top">
            <button className="btn btn-success w-100 py-3 rounded-4 fw-bold" data-bs-dismiss="offcanvas">Show Results</button>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .mundi-page-wrapper {
          background-color: #f6f9f7;
          min-height: 100vh;
        }
        
        .listing-card-premium {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }
        
        .listing-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 25px rgba(27, 67, 50, 0.12) !important;
        }
        
        .listing-img {
          height: 200px;
          object-fit: cover;
          transition: transform 0.8s ease;
        }
        
        .listing-card-premium:hover .listing-img {
          transform: scale(1.08);
        }

        .border-hover:hover {
          outline: 2px solid #1b4332;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
          min-height: 2.8em;
          line-height: 1.4;
        }

        .bg-gradient-light {
          background: linear-gradient(135deg, #f8fbf9 0%, #eef7f3 100%);
        }

        .op-30 { opacity: 0.3; }
        .x-small { font-size: 0.65rem; }
        .width-16 { width: 16px; }
        
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

        .hover-ripple {
          transition: background 0.2s;
        }
        .hover-ripple:active {
          filter: brightness(0.9);
        }

        @media (max-width: 991px) {
          .h2-lg { font-size: calc(1.325rem + 0.9vw); }
        }
      `}</style>

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
