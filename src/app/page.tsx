"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { findGroupForCategory, getCategoryOptionsForGroup, getGroupOptions } from "@/lib/category-filters";
import { useTranslation } from "@/lib/i18n";


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

function getCategoryIcon(name: string) {
  const v = name.toLowerCase();
  // Crops
  if (v.includes("wheat") || v.includes("grain")) return "fa-wheat-awn";
  if (v.includes("rice") || v.includes("chawal")) return "fa-bowl-rice";
  if (v.includes("maize") || v.includes("corn") || v.includes("maka")) return "fa-seedling";
  if (v.includes("cotton") || v.includes("kapas")) return "fa-leaf";
  if (v.includes("sugar") || v.includes("ganna")) return "fa-plant-wilt";
  // Fruits
  if (v.includes("citrus") || v.includes("orange") || v.includes("kinnow") || v.includes("lemon")) return "fa-lemon";
  if (v.includes("apple") || v.includes("seb")) return "fa-apple-whole";
  if (v.includes("mango") || v.includes("aam")) return "fa-lemon";
  if (v.includes("fruit") || v.includes("phal")) return "fa-apple-whole";
  if (v.includes("cherry") || v.includes("berry")) return "fa-cherry";
  // Vegetables
  if (v.includes("potato") || v.includes("aloo") || v.includes("carrot") || v.includes("gajar")) return "fa-carrot";
  if (v.includes("onion") || v.includes("piaz") || v.includes("vegetable") || v.includes("sabz")) return "fa-carrot";
  if (v.includes("pepper") || v.includes("mirch") || v.includes("chilli")) return "fa-pepper-hot";
  if (v.includes("tomato") || v.includes("tamatar")) return "fa-pepper-hot";
  // Pulses & Spices
  if (v.includes("pulse") || v.includes("dal") || v.includes("chana") || v.includes("bean") || v.includes("pea") || v.includes("lentil") || v.includes("masoor") || v.includes("moong")) return "fa-jar";
  if (v.includes("spice") || v.includes("masala")) return "fa-mortar-pestle";
  // Livestock
  if (v.includes("milk") || v.includes("dairy") || v.includes("cow")) return "fa-cow";
  if (v.includes("fish") || v.includes("machhi")) return "fa-fish";
  if (v.includes("egg") || v.includes("poultry") || v.includes("anda")) return "fa-egg";
  return "fa-basket-shopping";
}

export default function Home() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("home");
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [visibleHomeCategories, setVisibleHomeCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [groupNames, setGroupNames] = useState<string[]>([]);

  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [listingsRes, categoriesRes, plansRes, settingsRes, iconsRes, groupsRes] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/categories"),
          fetch("/api/plans"),
          fetch("/api/settings?key=homePageCategories", { cache: "no-store" }),
          fetch("/api/settings?key=categoryIcons", { cache: "no-store" }),
          fetch("/api/groups")
        ]);

        const listingsJson = await listingsRes.json();
        const categoriesJson = await categoriesRes.json();
        const plansJson = await plansRes.json();
        const settingsJson = await settingsRes.json();
        const iconsJson = await iconsRes.json();
        const groupsJson = await groupsRes.json();

        if (iconsJson.ok && iconsJson.setting?.value) {
          setCategoryIcons(iconsJson.setting.value);
        }

        if (groupsJson.ok && groupsJson.groups) {
          setGroupNames(groupsJson.groups.map((g: { name: string }) => g.name).sort());
        }

        if (listingsRes.ok && listingsJson.ok) {
          setListings(listingsJson.listings || []);
        } else {
          setListings([]);
        }

        if (categoriesRes.ok && categoriesJson.ok) {
          const allCats = categoriesJson.categories || [];
          let visibleCats = allCats;
          if (settingsJson.ok && settingsJson.setting?.value && settingsJson.setting.value.length > 0) {
            const allowedIds = settingsJson.setting.value;
            visibleCats = allCats.filter((cat: Category) => allowedIds.includes(cat.id));
          }
          setCategories(allCats);
          setVisibleHomeCategories(visibleCats);
        } else {
          setCategories([]);
          setVisibleHomeCategories([]);
        }

        if (plansRes.ok && plansJson.ok) {
          setPlans(plansJson.plans || []);
        } else {
          setPlans([]);
        }
      } catch (err) {
        setListings([]);
        setCategories([]);
        setVisibleHomeCategories([]);
        setPlans([]);
      }
    };

    void loadHomeData();
  }, []);

  // Fetch user's active subscription
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mundi:sessionUser");
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
      const productGroup = product.group || findGroupForCategory(categories, product.category);
      const matchesGroup = groupFilter === "all" || productGroup === groupFilter;
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesCity = cityFilter === "all" || product.city === cityFilter;
      const matchesGrade = gradeFilter === "all" || (product.grade || "Unspecified") === gradeFilter;
      return matchesGroup && matchesCategory && matchesCity && matchesGrade;
    });
  }, [categories, categoryFilter, cityFilter, gradeFilter, groupFilter, listings]);

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      // Read the logged-in user from localStorage to pass their identity
      let userId = "";
      let userEmail = "";
      try {
        const raw = localStorage.getItem("mundi:sessionUser");
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


  const groupOptions = useMemo(() => {
    if (groupNames.length > 0) return groupNames;
    return getGroupOptions(categories);
  }, [groupNames, categories]);

  const categoryOptions = useMemo(() => {
    return getCategoryOptionsForGroup(categories, groupFilter);
  }, [categories, groupFilter]);

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
    setGroupFilter(findGroupForCategory(categories, category) || "all");
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

  useEffect(() => {
    if (categoryFilter === "all") return;
    if (!categoryOptions.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  return (
    <>
      <Navbar />

      {paymentSuccess && (
        <div className="alert alert-success alert-dismissible fade show text-center m-0 rounded-0" role="alert">
          <strong>{t("home.thankYou")}</strong> {t("home.paymentSuccess")}
          <button type="button" className="btn-close" onClick={() => setPaymentSuccess(false)} aria-label="Close"></button>
        </div>
      )}

      <div id="home-section" className={activeSection === "home" ? "" : "hidden-section"}>
        <section className="hero">
          <div className="hero-overlay"></div>
          <div className="container position-relative" style={{ zIndex: 2 }}>
            <h1 className="display-4 fw-bold hero-title">{t("home.heroTitle")}</h1>
            <p className="lead mb-4 hero-subtitle">
              {t("home.heroSubtitle")}
            </p>
            <div className="d-grid gap-2 d-md-block hero-cta">
              <Link className="btn btn-warning btn-lg px-5 fw-bold me-md-2" href="/mundi">
                {t("home.wantToBuy")}
              </Link>
              <Link className="btn btn-outline-light btn-lg px-5" href="/auth?mode=signup&role=seller">
                {t("home.wantToSell")}
              </Link>
            </div>
          </div>
          <div className="hero-shape"></div>
        </section>

        <div className="container my-5">
          <h3 className="text-center fw-bold mb-4">{t("home.categoriesTitle")}</h3>
          <div className="row g-3 text-center">
            {visibleHomeCategories.map((category) => (
              <div className="col-6 col-md-2" key={category.id}>
                <button
                  type="button"
                  className={`category-card w-100 ${categoryFilter === category.name ? "active-category" : ""}`}
                  onClick={() => filterByCategory(category.name)}
                >
                  <i className={`${(categoryIcons[category.id] || getCategoryIcon(category.name)) === "fa-pagelines" ? "fa-brands" : "fa-solid"} ${categoryIcons[category.id] || getCategoryIcon(category.name)} fa-3x`}></i>
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
              <div className="d-flex align-items-center gap-3">
                <h3 className="fw-bold m-0">{t("home.liveListings")}</h3>
                <Link href="/mundi" className="btn btn-sm btn-outline-success rounded-pill px-3">
                  {t("home.viewAll")} <i className="fa-solid fa-arrow-right ms-1 small"></i>
                </Link>
              </div>
              <span className="text-danger fw-bold d-none d-md-inline-block">
                <i className="fa-solid fa-circle-dot"></i> {t("home.liveFeed")}
              </span>
            </div>
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">{t("home.filterGroup")}</label>
                    <select
                      id="filter-group"
                      className="form-select"
                      value={groupFilter}
                      onChange={(event) => {
                        setGroupFilter(event.target.value);
                        setCategoryFilter("all");
                      }}
                    >
                      <option value="all">{t("home.allGroups")}</option>
                      {groupOptions.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">{t("home.filterCategory")}</label>
                    <select
                      id="filter-category"
                      className="form-select"
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                    >
                      <option value="all">{t("home.allCategories")}</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">{t("home.filterCity")}</label>
                    <select
                      id="filter-city"
                      className="form-select"
                      value={cityFilter}
                      onChange={(event) => setCityFilter(event.target.value)}
                    >
                      <option value="all">{t("home.allCities")}</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">{t("home.filterGrade")}</label>
                    <select
                      id="filter-grade"
                      className="form-select"
                      value={gradeFilter}
                      onChange={(event) => setGradeFilter(event.target.value)}
                    >
                      <option value="all">{t("home.allGrades")}</option>
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
            <div id="listing-status" className="mb-3 d-flex align-items-center justify-content-between">
              <span className="text-muted small">{filteredProducts.length} {t("home.productsFound")}</span>
              {(groupFilter !== "all" || categoryFilter !== "all" || cityFilter !== "all" || gradeFilter !== "all") && (
                <button
                  className="btn btn-sm btn-outline-danger rounded-pill px-3"
                  onClick={() => {
                    setGroupFilter("all");
                    setCategoryFilter("all");
                    setCityFilter("all");
                    setGradeFilter("all");
                  }}
                >
                  <i className="fa-solid fa-xmark me-1"></i> {t("mundi.clearFilters")}
                </button>
              )}
            </div>
            <div className="row g-3" id="product-listings-grid">
              {filteredProducts.length === 0 ? (
                <div className="col-12">
                  <div className="alert alert-light border mb-0">{t("home.noProducts")}</div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div className="col-6 col-md-4 col-xl-3" key={product.id}>
                    <div className="lc h-100">
                      {/* Image */}
                      <div className="lc-img">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
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
                        {product.createdBy?.verificationStatus === "verified" && (
                          <span className="lc-badge-verified">
                            <i className="fa-solid fa-circle-check"></i> {t("home.verifiedSeller")}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="lc-body">
                        <h6 className="lc-title">{product.title}</h6>

                        <div className="lc-info">
                          <div className="lc-info-row">
                            <i className="fa-solid fa-location-dot"></i>
                            <span>{product.city}</span>
                          </div>
                          <div className="lc-info-row">
                            <i className="fa-solid fa-calendar-days"></i>
                            <span>{new Date(product.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>

                        <div className="lc-divider"></div>

                        <div className="lc-footer">
                          <div className="lc-price-block">
                            <span className="lc-price-label">{t("home.perMaund").toUpperCase()}</span>
                            <span className="lc-price-value">{product.pricePerMaund.toLocaleString()}</span>
                          </div>
                          <Link href={`/listing/${product.id}`} className="lc-btn">
                            {t("home.viewDetails")}
                          </Link>
                        </div>
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
            <h3 className="fw-bold m-0" style={{ color: "var(--primary-green)" }}>{t("home.subscriptionPlans")}</h3>
            <p className="text-muted mt-2">{t("home.subscriptionSubtitle")}</p>
          </div>

          <div className="row g-4 justify-content-center">
            {plans.length === 0 ? (
              <div className="col-12 text-center text-muted">{t("home.loadingPlans")}</div>
            ) : (
              plans.map((plan) => (
                <div className="col-md-6 col-lg-4" key={plan._id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 text-center overflow-hidden pricing-card">
                    <div className="card-header bg-white border-0 pt-5 pb-3">
                      <h4 className="fw-bold mb-2" style={{ color: "var(--primary-green)" }}>{plan.name}</h4>
                      <div className="display-5 fw-bold mb-1">Rs {plan.price.toLocaleString()}</div>
                      <p className="text-muted small text-uppercase fw-semibold">/ {plan.interval === 'one-time' ? t("home.lifetime") : plan.interval}</p>
                      <p className="text-muted small px-3">{plan.description}</p>
                    </div>

                    <div className="card-body px-4 pb-4 pt-0 d-flex flex-column">
                      <div className="d-flex justify-content-center gap-3 mt-3 mb-2">
                        <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                          <i className="fa-solid fa-list me-1"></i>{plan.listingLimit ?? 10} {t("home.listings")}
                        </div>
                        <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                          <i className="fa-solid fa-bullhorn me-1"></i>{plan.broadcastLimit ?? 5} {t("home.broadcasts")}
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
                            <i className="fa-solid fa-circle-check me-2"></i>{t("home.subscribed")}
                          </button>
                        ) : (
                          <button
                            className="btn btn-mundi w-100 py-3 fw-bold"
                            onClick={() => handleSubscribe(plan._id)}
                            disabled={checkoutLoading === plan._id}
                          >
                            {checkoutLoading === plan._id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              activeSubscription ? t("home.switchPlan") : t("home.subscribeNow")
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
          --mundi-gold: #ffca28;
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
          border-bottom: 2px solid var(--mundi-gold);
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

        /* ===== Listing Cards ===== */
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

        /* Image — 55% height feel */
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

        /* Verified badge on image */
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

        /* Body */
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

        /* Info rows */
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

        /* Divider */
        .lc-divider {
          height: 1px;
          background: #eee;
          margin-bottom: 16px;
        }

        /* Footer — price + button */
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
          color: var(--primary-green);
          line-height: 1;
        }

        .lc-btn {
          display: inline-flex;
          align-items: center;
          background: var(--primary-green);
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

        /* Mobile */
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

        .btn-mundi {
          background-color: var(--primary-green);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 8px;
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
