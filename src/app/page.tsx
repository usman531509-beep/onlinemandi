"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
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

function getCategoryIcon(name: string) {
  const value = name.toLowerCase();
  if (value.includes("wheat")) return "fa-wheat-awn";
  if (value.includes("rice")) return "fa-bowl-rice";
  if (value.includes("maize") || value.includes("corn")) return "fa-seedling";
  if (value.includes("citrus") || value.includes("orange")) return "fa-lemon";
  if (value.includes("potato")) return "fa-carrot";
  return "fa-truck-ramp-box";
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [listingsRes, categoriesRes, plansRes] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/categories"),
          fetch("/api/plans")
        ]);
        const listingsJson = (await listingsRes.json()) as {
          ok: boolean;
          listings?: Listing[];
        };
        const categoriesJson = (await categoriesRes.json()) as {
          ok: boolean;
          categories?: Category[];
        };
        const plansJson = (await plansRes.json()) as {
          ok: boolean;
          plans?: any[];
        };

        if (listingsRes.ok && listingsJson.ok) {
          setListings(listingsJson.listings || []);
        } else {
          setListings([]);
        }

        if (categoriesRes.ok && categoriesJson.ok) {
          setCategories(categoriesJson.categories || []);
        } else {
          setCategories([]);
        }

        if (plansRes.ok && plansJson.ok) {
          setPlans(plansJson.plans || []);
        } else {
          setPlans([]);
        }
      } catch {
        setListings([]);
        setCategories([]);
        setPlans([]);
      }
    };

    void loadHomeData();
  }, []);

  // Fetch user's active subscription
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mandi:sessionUser");
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.email) {
          fetch(`/api/user/subscription?email=${encodeURIComponent(user.email)}`)
            .then(r => r.json())
            .then(data => {
              if (data.ok && data.subscription) {
                setActiveSubscription(data.subscription);
              }
            })
            .catch(() => { });
        }
      }
    } catch { }
  }, []);

  const filteredProducts = useMemo(() => {
    return listings.filter((product) => {
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesCity = cityFilter === "all" || product.city === cityFilter;
      const matchesGrade = gradeFilter === "all" || (product.grade || "Unspecified") === gradeFilter;
      return matchesCategory && matchesCity && matchesGrade;
    });
  }, [categoryFilter, cityFilter, gradeFilter, listings]);

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      // Read the logged-in user from localStorage to pass their identity
      let userId = "";
      let userEmail = "";
      try {
        const raw = localStorage.getItem("mandi:sessionUser");
        if (raw) {
          const user = JSON.parse(raw);
          userId = user?.id || "";
          userEmail = user?.email || "";
        }
      } catch { }

      if (!userId) {
        alert("Please log in first to subscribe to a plan.");
        setCheckoutLoading(null);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId, userEmail })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Checkout failed. Please try again.");
      }
    } catch {
      alert("Network error starting checkout.");
    } finally {
      setCheckoutLoading(null);
    }
  };


  const categoryOptions = useMemo(() => {
    return Array.from(new Set(categories.map((category) => category.name))).sort();
  }, [categories]);

  const cityOptions = useMemo(() => {
    return Array.from(new Set(listings.map((listing) => listing.city))).sort();
  }, [listings]);

  const gradeOptions = useMemo(() => {
    return Array.from(new Set(listings.map((listing) => listing.grade || "Unspecified"))).sort();
  }, [listings]);

  const showSection = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo(0, 0);
  };

  const filterByCategory = (category: string) => {
    setActiveSection("home");
    setCategoryFilter(category);
    setCityFilter("all");
    setGradeFilter("all");
    setTimeout(() => {
      document.getElementById("listing-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        setPaymentSuccess(true);
      }
    }
  }, []);

  return (
    <>
      <Navbar />

      {paymentSuccess && (
        <div className="alert alert-success alert-dismissible fade show text-center m-0 rounded-0" role="alert">
          <strong>Thank you!</strong> Your payment was successful and your subscription is active.
          <button type="button" className="btn-close" onClick={() => setPaymentSuccess(false)} aria-label="Close"></button>
        </div>
      )}

      <div id="home-section" className={activeSection === "home" ? "" : "hidden-section"}>
        <section className="hero">
          <div className="hero-overlay"></div>
          <div className="container position-relative" style={{ zIndex: 2 }}>
            <h1 className="display-4 fw-bold hero-title">Pakistan&apos;s Digital Agricultural Marketplace</h1>
            <p className="lead mb-4 hero-subtitle">
              Trading Wheat, Rice, Corn, and Citrus in Bulk - Direct from Farm to Factory.
            </p>
            <div className="d-grid gap-2 d-md-block hero-cta">
              <Link className="btn btn-warning btn-lg px-5 fw-bold me-md-2" href="/post-requirement">
                I Want to Buy
              </Link>
              <Link className="btn btn-outline-light btn-lg px-5" href="/sell-crop">
                I Want to Sell
              </Link>
            </div>
          </div>
          <div className="hero-shape"></div>
        </section>

        <div className="container my-5">
          <h3 className="text-center fw-bold mb-4">Bulk Trading Categories</h3>
          <div className="row g-3 text-center">
            {categories.map((category) => (
              <div className="col-6 col-md-2" key={category.id}>
                <button
                  type="button"
                  className={`category-card w-100 ${categoryFilter === category.name ? "active-category" : ""}`}
                  onClick={() => filterByCategory(category.name)}
                >
                  <i className={`fa-solid ${getCategoryIcon(category.name)} fa-3x`}></i>
                  <br />
                  <b>{category.name}</b>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white py-5" id="listing-section">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold m-0">Live Mandi Listings</h3>
              <span className="text-danger fw-bold">
                <i className="fa-solid fa-circle-dot"></i> Live Feed
              </span>
            </div>
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Category</label>
                    <select
                      id="filter-category"
                      className="form-select"
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">City</label>
                    <select
                      id="filter-city"
                      className="form-select"
                      value={cityFilter}
                      onChange={(event) => setCityFilter(event.target.value)}
                    >
                      <option value="all">All Cities</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Grade</label>
                    <select
                      id="filter-grade"
                      className="form-select"
                      value={gradeFilter}
                      onChange={(event) => setGradeFilter(event.target.value)}
                    >
                      <option value="all">All Grades</option>
                      {gradeOptions.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div id="listing-status" className="mb-3 text-muted small">
              {filteredProducts.length} product(s) found
            </div>
            <div className="row g-3" id="product-listings-grid">
              {filteredProducts.length === 0 ? (
                <div className="col-12">
                  <div className="alert alert-light border mb-0">No products found for selected filters.</div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div className="col-md-4" key={product.id}>
                    <div className="card shadow-sm h-100">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          width={640}
                          height={260}
                          unoptimized
                          className="listing-card-cover"
                        />
                      ) : (
                        <div className="listing-card-cover listing-card-cover-empty">
                          <i className="fa-regular fa-image"></i>
                        </div>
                      )}
                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge ${product.createdBy?.role === "admin" ? "bg-dark" : "bg-primary"}`}>
                            {product.createdBy?.role === "admin" ? "Admin Listing" : "Seller Listing"}
                          </span>
                          {product.createdBy?.verificationStatus === "verified" && (
                            <span className="badge verified-badge">
                              <i className="fa-solid fa-circle-check me-1"></i>Verified Seller
                            </span>
                          )}
                        </div>
                        <h5>{product.title}</h5>
                        <p className="text-muted small mb-1">
                          <i className="fa-solid fa-map-marker-alt"></i> {product.city}
                        </p>
                        <p className="text-muted small">
                          <i className="fa-solid fa-clock"></i> {new Date(product.createdAt).toLocaleString()}
                        </p>
                        <h4 className="text-success fw-bold">PKR {product.pricePerMaund.toLocaleString()} /maund</h4>
                        <hr />
                        <Link className="btn btn-mandi w-100" href={`/listing/${product.id}`}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-light py-5" id="pricing-section">
        <div className="container">
          <div className="text-center mb-5">
            <h3 className="fw-bold m-0" style={{ color: "var(--primary-green)" }}>Subscription Plans</h3>
            <p className="text-muted mt-2">Choose a plan that fits your business needs to unlock premium features and trade without limits.</p>
          </div>

          <div className="row g-4 justify-content-center">
            {plans.length === 0 ? (
              <div className="col-12 text-center text-muted">Loading pricing plans...</div>
            ) : (
              plans.map((plan) => (
                <div className="col-md-6 col-lg-4" key={plan._id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 text-center overflow-hidden pricing-card">
                    <div className="card-header bg-white border-0 pt-5 pb-3">
                      <h4 className="fw-bold mb-2" style={{ color: "var(--primary-green)" }}>{plan.name}</h4>
                      <div className="display-5 fw-bold mb-1">Rs {plan.price.toLocaleString()}</div>
                      <p className="text-muted small text-uppercase fw-semibold">/ {plan.interval === 'one-time' ? 'lifetime' : plan.interval}</p>
                      <p className="text-muted small px-3">{plan.description}</p>
                    </div>

                    <div className="card-body px-4 pb-4 pt-0 d-flex flex-column">
                      <div className="d-flex justify-content-center gap-3 mt-3 mb-2">
                        <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                          <i className="fa-solid fa-list me-1"></i>{plan.listingLimit ?? 10} Listings
                        </div>
                        <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                          <i className="fa-solid fa-bullhorn me-1"></i>{plan.broadcastLimit ?? 5} Broadcasts
                        </div>
                      </div>
                      <ul className="list-unstyled mb-4 text-start mt-2">
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="mb-3 d-flex align-items-start">
                            <i className="fa-solid fa-check text-success mt-1 me-3"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto">
                        {activeSubscription && activeSubscription.planId?._id === plan._id ? (
                          <button
                            className="btn w-100 py-3 fw-bold"
                            style={{ backgroundColor: '#2d6a4f', color: 'white', cursor: 'default' }}
                            disabled
                          >
                            <i className="fa-solid fa-circle-check me-2"></i>Subscribed
                          </button>
                        ) : (
                          <button
                            className="btn btn-mandi w-100 py-3 fw-bold"
                            onClick={() => handleSubscribe(plan._id)}
                            disabled={checkoutLoading === plan._id}
                          >
                            {checkoutLoading === plan._id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              activeSubscription ? "Switch Plan" : "Subscribe Now"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <a href="https://wa.me/923001234567" className="whatsapp-btn text-decoration-none">
        <i className="fab fa-whatsapp"></i>
      </a>

      <Footer />

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

        .nav-link {
          color: white !important;
          font-weight: 500;
        }

        .nav-link.active {
          border-bottom: 2px solid var(--mandi-gold);
        }

        .navbar-menu {
          display: flex;
          align-items: center;
        }

        .navbar-menu .navbar-nav {
          gap: 0.25rem;
        }

        .navbar-menu .nav-link {
          padding: 0.5rem 0.75rem;
        }

        .nav-auth-btn {
          border-radius: 8px;
          color: #1b4332;
        }

        @media (max-width: 991px) {
          .navbar .container {
            display: flex;
            flex-wrap: wrap;
          }

          .navbar-menu {
            width: 100%;
            margin-top: 0.5rem;
          }

          .navbar-menu .navbar-nav {
            justify-content: flex-start !important;
          }
        }

        .hero {
          position: relative;
          background: url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80") center/cover no-repeat;
          color: white;
          padding: 100px 0 110px;
          text-align: center;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7));
          z-index: 1;
        }

        .hero-shape {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--light-bg);
          clip-path: ellipse(55% 100% at 50% 100%);
          z-index: 2;
        }

        .hero-title,
        .hero-subtitle,
        .hero-cta {
          opacity: 0;
          transform: translateY(22px);
          animation: heroFadeUp 0.8s ease forwards;
        }

        .hero-subtitle {
          animation-delay: 0.16s;
        }

        .hero-cta {
          animation-delay: 0.3s;
        }

        .category-card {
          border: none;
          border-radius: 12px;
          transition: 0.3s;
          cursor: pointer;
          background: white;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .category-card.active-category {
          outline: 2px solid var(--primary-green);
          background: #eef7f3;
        }

        .category-card i {
          color: var(--primary-green);
          margin-bottom: 10px;
        }

        .listing-card-cover {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 0.5rem 0.5rem 0 0;
          border-bottom: 1px solid #dce7e2;
          display: block;
        }

        .listing-card-cover-empty {
          display: grid;
          place-items: center;
          background: #f2f7f4;
          color: #7b8f84;
        }

        .detail-main-image-wrapper {
          position: relative;
          cursor: pointer;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #dce7e2;
        }

        .detail-main-image {
          width: 100%;
          height: 400px;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .detail-main-image-wrapper:hover .detail-main-image {
          transform: scale(1.02);
        }

        .detail-main-image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .detail-main-image-overlay i {
          font-size: 2rem;
        }

        .detail-main-image-wrapper:hover .detail-main-image-overlay {
          opacity: 1;
        }

        .detail-thumb-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        .detail-thumb-btn {
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 0;
          background: #fff;
          overflow: hidden;
          line-height: 0;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }

        .detail-thumb-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .detail-thumb-btn.active {
          border-color: #1b4332;
          box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.2);
        }

        .detail-thumb-image {
          width: 100%;
          height: 80px;
          object-fit: cover;
          display: block;
        }

        .empty-detail-images {
          border: 1px dashed #cddad3;
          border-radius: 10px;
          background: #f5faf7;
          color: #6f8379;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Lightbox */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: lightboxFadeIn 0.25s ease;
          outline: none;
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          z-index: 10001;
        }

        .lightbox-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: white;
          font-size: 1.3rem;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          z-index: 10001;
        }

        .lightbox-prev { left: 20px; }
        .lightbox-next { right: 20px; }

        .lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .lightbox-content {
          max-width: 90vw;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lightbox-image {
          max-width: 90vw;
          max-height: 80vh;
          width: auto !important;
          height: auto !important;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
        }

        .lightbox-counter {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          margin-top: 12px;
          letter-spacing: 0.05em;
        }

        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .verified-badge {
          background: linear-gradient(135deg, #198754, #2d9f6f) !important;
          color: white !important;
          font-weight: 600;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
          padding: 5px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(25, 135, 84, 0.25);
          animation: verifiedPulse 2s ease-in-out infinite;
        }

        @keyframes verifiedPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(25, 135, 84, 0.25); }
          50% { box-shadow: 0 2px 14px rgba(25, 135, 84, 0.45); }
        }

        .whatsapp-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #25d366;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          z-index: 999;
        }

        .hidden-section {
          display: none;
        }

        .pricing-card {
           transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .pricing-card:hover {
           transform: translateY(-8px);
           box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
        }

        .product-spec-item {
          border-bottom: 1px dashed #dee2e6;
          padding: 10px 0;
        }

        .product-spec-item:last-child {
          border-bottom: 0;
        }

        @keyframes heroFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 991px) {
          .detail-thumb-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .hero-title {
            font-size: 2.5rem !important;
          }
        }

        @media (max-width: 767px) {
          .hero {
            padding: 80px 0 60px;
            text-align: center;
          }
          .hero-title {
            font-size: 2rem !important;
          }
          .hero-subtitle {
            font-size: 1.1rem !important;
          }
          .category-card {
            padding: 15px 10px;
          }
          .category-card i {
            font-size: 2rem !important;
            margin-bottom: 8px;
          }
          .pricing-card .display-5 {
            font-size: 2.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-title,
          .hero-subtitle,
          .hero-cta {
            animation: none !important;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}
