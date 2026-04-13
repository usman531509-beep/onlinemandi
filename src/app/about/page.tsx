"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

export default function AboutPage() {
    const { t } = useTranslation();
    const sectionsRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for scroll-triggered animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("about-visible");
                    }
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );

        const elements = sectionsRef.current?.querySelectorAll(".about-animate");
        elements?.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={sectionsRef}>
            <Navbar />

            {/* Hero Banner */}
            <section className="about-hero">
                <div className="about-hero-overlay"></div>
                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <div className="about-hero-content">
                        <h1 className="display-4 fw-bold mb-3 about-hero-fade">{t("about.heroTitle")}</h1>
                        <p className="mb-0 about-hero-fade about-hero-delay-1">
                            {t("about.heroSubtitle")}
                        </p>
                    </div>
                </div>
                <div className="about-hero-shape"></div>
            </section>

            {/* This Is OnlineMundi */}
            <section className="container py-5">
                <div className="row align-items-center g-5">
                    <div className="col-lg-6 about-animate about-animate-left">
                        <div className="about-img-wrapper">
                            <Image
                                src="/images/about-hero.png"
                                alt="Agricultural Mundi market in Pakistan"
                                width={800}
                                height={500}
                                className="about-img"
                                unoptimized
                            />
                        </div>
                    </div>
                    <div className="col-lg-6 about-animate about-animate-right">
                        <h2 className="fw-bold mb-1">{t("about.thisIs")}</h2>
                        <div className="about-divider"></div>
                        <p className="text-success fw-semibold fst-italic mb-3">
                            {t("about.tagline")}
                        </p>
                        <p className="text-muted">
                            {t("about.p1")}
                        </p>
                        <p className="text-muted">
                            {t("about.p2")}
                        </p>
                        <p className="text-muted mb-0">
                            {t("about.p3")}
                        </p>
                    </div>
                </div>
            </section>

            {/* Quote Banner */}
            <section className="about-quote-section about-animate about-animate-up">
                <div className="container">
                    <div className="about-quote">
                        <i className="fa-solid fa-quote-left about-quote-icon"></i>
                        <blockquote className="mb-3">
                            {t("about.quoteText")}
                        </blockquote>
                        <p className="mb-0 text-muted">
                            {t("about.quoteAuthor")}
                        </p>
                    </div>
                </div>
            </section>

            {/* What We Trade */}
            <section className="container py-5">
                <div className="row align-items-center g-5">
                    <div className="col-lg-6 order-lg-2 about-animate about-animate-right">
                        <div className="about-img-wrapper">
                            <Image
                                src="/images/about-crops.png"
                                alt="Wheat, rice, corn, lentils and citrus"
                                width={800}
                                height={500}
                                className="about-img"
                                unoptimized
                            />
                        </div>
                    </div>
                    <div className="col-lg-6 order-lg-1 about-animate about-animate-left">
                        <h2 className="fw-bold mb-1">{t("about.whatWeTrade")}</h2>
                        <div className="about-divider"></div>
                        <p className="text-muted mb-4">
                            {t("about.whatWeTradeDesc")}
                        </p>
                        <div className="row g-3">
                            {[
                                { icon: "fa-wheat-awn", name: t("about.wheat"), desc: t("about.wheatDesc") },
                                { icon: "fa-bowl-rice", name: t("about.rice"), desc: t("about.riceDesc") },
                                { icon: "fa-seedling", name: t("about.corn"), desc: t("about.cornDesc") },
                                { icon: "fa-lemon", name: t("about.citrus"), desc: t("about.citrusDesc") },
                                { icon: "fa-jar", name: t("about.pulses"), desc: t("about.pulsesDesc") },
                                { icon: "fa-leaf", name: t("about.vegetables"), desc: t("about.vegetablesDesc") },
                            ].map((item) => (
                                <div className="col-6" key={item.name}>
                                    <div className="about-trade-item">
                                        <i className={`fa-solid ${item.icon} about-trade-icon`}></i>
                                        <div>
                                            <strong className="d-block small">{item.name}</strong>
                                            <span className="text-muted" style={{ fontSize: "0.78rem" }}>{item.desc}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="about-hiw">
                <div className="container text-center">
                    <h2 className="fw-bold mb-4 about-animate about-animate-up">{t("about.howItWorks")}</h2>
                    <div className="row g-4">
                        {[
                            { step: "1", icon: "fa-user-plus", title: t("about.step1Title"), desc: t("about.step1Desc") },
                            { step: "2", icon: "fa-list-check", title: t("about.step2Title"), desc: t("about.step2Desc") },
                            { step: "3", icon: "fa-handshake", title: t("about.step3Title"), desc: t("about.step3Desc") },
                        ].map((item, idx) => (
                            <div className="col-md-4" key={item.step}>
                                <div className={`about-hiw-card about-animate about-animate-up`} style={{ transitionDelay: `${idx * 150}ms` }}>
                                    <div className="about-hiw-num">{item.step}</div>
                                    <div className="about-hiw-icon-wrap">
                                        <i className={`fa-solid ${item.icon}`}></i>
                                    </div>
                                    <h6 className="fw-bold mb-2">{item.title}</h6>
                                    <p className="text-muted small mb-0">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta about-animate about-animate-up">
                <div className="container text-center">
                    <h2 className="fw-bold mb-3" style={{ color: "#1b4332" }}>{t("about.ctaTitle")}</h2>
                    <p className="text-muted mb-4" style={{ maxWidth: 500, margin: "0 auto" }}>
                        {t("about.ctaSubtitle")}
                    </p>
                    <a className="btn btn-warning btn-lg px-5 fw-bold about-cta-btn" href="/auth">
                        {t("about.ctaButton")}
                    </a>
                </div>
            </section>

            <Footer />

            <style jsx>{`
        /* ===== Hero ===== */
        .about-hero {
          position: relative;
          background: url("/images/about-banner.jpg") center/cover no-repeat;
          padding: 100px 0 110px;
          overflow: hidden;
        }

        .about-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7));
          z-index: 1;
        }

        .about-hero-shape {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 60px;
          background: #f8f9fa;
          clip-path: ellipse(55% 100% at 50% 100%);
          z-index: 2;
        }

        .about-hero-content {
          max-width: 560px;
          color: white;
          position: relative;
        }

        .about-hero-content p {
          color: rgba(255,255,255,0.85);
          font-size: 1.08rem;
          line-height: 1.75;
        }

        .about-hero-fade {
          opacity: 0;
          transform: translateY(22px);
          animation: aboutHeroIn 0.8s ease forwards 0.2s;
        }

        .about-hero-delay-1 {
          opacity: 0;
          transform: translateY(22px);
          animation: aboutHeroIn 0.8s ease forwards 0.45s;
        }

        @keyframes aboutHeroIn {
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== Scroll Animations ===== */
        .about-animate {
          opacity: 0;
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .about-animate-up {
          transform: translateY(40px);
        }

        .about-animate-left {
          transform: translateX(-40px);
        }

        .about-animate-right {
          transform: translateX(40px);
        }

        .about-animate.about-visible {
          opacity: 1;
          transform: translate(0, 0);
        }

        /* ===== Divider ===== */
        .about-divider {
          width: 50px;
          height: 3px;
          background: linear-gradient(90deg, #1b4332, #40916c);
          border-radius: 2px;
          margin: 12px 0 20px;
        }

        /* ===== Images ===== */
        .about-img-wrapper {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          line-height: 0;
          position: relative;
          background-color: #f0f7f4;
        }

        .about-img-wrapper::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 16px;
          border: 1px solid rgba(27,67,50,0.08);
          pointer-events: none;
          z-index: 2;
        }

        .about-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .about-img-wrapper:hover .about-img {
          transform: scale(1.04);
        }

        /* ===== Quote ===== */
        .about-quote-section {
          background: linear-gradient(180deg, #f0f7f4 0%, #f8faf9 100%);
          padding: 60px 0;
          position: relative;
        }

        .about-quote-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #2d6a4f, transparent);
          border-radius: 2px;
        }

        .about-quote {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }

        .about-quote-icon {
          font-size: 2.8rem;
          color: #2d6a4f;
          opacity: 0.2;
          margin-bottom: 12px;
        }

        .about-quote blockquote {
          font-size: 1.18rem;
          line-height: 1.85;
          color: #333;
        }

        /* ===== Trade Items ===== */
        .about-trade-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          transition: background 0.25s, transform 0.25s;
        }

        .about-trade-item:hover {
          background: #f0f7f4;
          transform: translateX(4px);
        }

        .about-trade-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #eef7f3, #d8ede3);
          color: #1b4332;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          margin-top: 2px;
          transition: transform 0.3s;
        }

        .about-trade-item:hover .about-trade-icon {
          transform: scale(1.12);
        }

        /* ===== How It Works ===== */
        .about-hiw {
          background: #f0f7f4;
          padding: 70px 0;
        }

        .about-hiw-card {
          background: white;
          border-radius: 16px;
          padding: 36px 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.05);
          position: relative;
          transition: transform 0.35s, box-shadow 0.35s;
        }

        .about-hiw-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.1);
        }

        .about-hiw-num {
          position: absolute;
          top: 14px;
          right: 18px;
          font-size: 2.5rem;
          font-weight: 800;
          color: rgba(27,67,50,0.06);
          line-height: 1;
        }

        .about-hiw-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #1b4332, #40916c);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          margin-bottom: 16px;
          transition: transform 0.3s;
        }

        .about-hiw-card:hover .about-hiw-icon-wrap {
          transform: scale(1.1) rotate(-5deg);
        }

        /* ===== CTA ===== */
        .about-cta {
          padding: 80px 0;
          background: #f8faf9;
          position: relative;
          overflow: hidden;
        }

        .about-cta::before {
          content: "";
          position: absolute;
          top: -30%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(27, 67, 50, 0.05) 0%, transparent 70%);
          border-radius: 50%;
        }

        .about-cta::after {
          content: "";
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 202, 40, 0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        /* ===== Reduced Motion ===== */
        @media (prefers-reduced-motion: reduce) {
          .about-hero-fade,
          .about-hero-delay-1 {
            animation: none !important;
            opacity: 1;
            transform: none;
          }

          .about-animate {
            opacity: 1;
            transform: none;
            transition: none;
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
