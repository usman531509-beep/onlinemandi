"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";

export default function ContactPage() {
    const sectionsRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Intersection Observer for scroll-triggered animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("contact-visible");
                    }
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        );

        const elements = sectionsRef.current?.querySelectorAll(".contact-animate");
        elements?.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: null, message: "" });

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                setStatus({ type: "success", message: "Thank you! Your message has been sent successfully. We will get back to you shortly." });
                setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
            } else {
                setStatus({ type: "error", message: data.message || "Something went wrong. Please try again." });
            }
        } catch (error) {
            setStatus({ type: "error", message: "A network error occurred. Please try again later." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={sectionsRef} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            {/* Hero Section */}
            <section className="contact-hero">
                <div className="contact-hero-overlay"></div>
                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <div className="contact-hero-content">
                        <h1 className="display-4 fw-bold text-white contact-hero-fade mb-3">Contact Us</h1>
                        <p className="text-white contact-hero-fade contact-hero-delay-1">
                            Have questions? We're here to help. Reach out to our team for support, partnerships, or general inquiries.
                        </p>
                    </div>
                </div>
                <div className="contact-hero-shape"></div>
            </section>

            {/* Main Content */}
            <main className="flex-grow-1" style={{ paddingTop: "60px", position: "relative", zIndex: 2, paddingBottom: "100px" }}>
                <div className="container">
                    <div className="row g-4 gx-lg-5 justify-content-center">

                        {/* Contact Form */}
                        <div className="col-lg-7 contact-animate contact-animate-left">
                            <div className="card border-0 shadow-lg rounded-4 overflow-hidden h-100">
                                <div className="card-body p-4 p-md-5">
                                    <h3 className="fw-bold mb-1" style={{ color: "#1b4332" }}>Send us a Message</h3>
                                    <p className="text-muted mb-4 pb-2 border-bottom">Fill out the form below and we'll get back to you as soon as possible.</p>

                                    {status.type && (
                                        <div className={`alert alert-${status.type === "success" ? "success" : "danger"} d-flex align-items-center mb-4`} role="alert">
                                            <i className={`fa-solid fa-${status.type === "success" ? "circle-check" : "circle-exclamation"} me-2`}></i>
                                            <div>{status.message}</div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Name"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="Email"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Phone Number <span className="text-muted fw-normal">(Optional)</span></label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="03XX-XXXXXXX"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Subject <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="subject"
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    placeholder="How can we help?"
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-semibold">Message <span className="text-danger">*</span></label>
                                                <textarea
                                                    className="form-control"
                                                    name="message"
                                                    required
                                                    rows={5}
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    placeholder="Please provide details about your inquiry..."
                                                ></textarea>
                                            </div>
                                            <div className="col-12 mt-4">
                                                <button type="submit" className="btn btn-warning w-100 fw-bold py-3 submit-btn" disabled={isLoading}>
                                                    {isLoading ? (
                                                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Sending Message...</>
                                                    ) : (
                                                        <><i className="fa-solid fa-paper-plane me-2"></i> Send Message</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="col-lg-4 contact-animate contact-animate-right">
                            <div className="card border-0 shadow-sm rounded-4 overlay-card info-card h-100">
                                <div className="card-body p-4 p-md-5 d-flex flex-column h-100">
                                    <h4 className="fw-bold mb-4 text-white">Contact Information</h4>

                                    <div className="d-flex align-items-start mb-4">
                                        <div className="icon-box me-3">
                                            <i className="fa-solid fa-location-dot"></i>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1 text-white">Our Office</h6>
                                            <p className="mb-0 text-white-50 small">Pattan Road, Pindi bhattian</p>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-start mb-4">
                                        <div className="icon-box me-3">
                                            <i className="fa-solid fa-phone"></i>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1 text-white">Phone Support</h6>
                                            <p className="mb-0 text-white-50 small">+92 300 0000000<br />Mon - Sat, 9:00 AM - 6:00 PM</p>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-start mb-5">
                                        <div className="icon-box me-3">
                                            <i className="fa-solid fa-envelope"></i>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1 text-white">Email Us</h6>
                                            <p className="mb-0 text-white-50 small">support@onlinemundi.com<br />info@onlinemundi.com</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <h6 className="fw-bold mb-3 text-white">Connect With Us</h6>
                                        <div className="d-flex gap-2">
                                            <a href="https://facebook.com/onlinemundi" target="_blank" rel="noopener noreferrer" className="social-btn"><i className="fa-brands fa-facebook-f"></i></a>
                                            <a href="https://twitter.com/onlinemundi" target="_blank" rel="noopener noreferrer" className="social-btn"><i className="fa-brands fa-twitter"></i></a>
                                            <a href="https://instagram.com/onlinemundi" target="_blank" rel="noopener noreferrer" className="social-btn"><i className="fa-brands fa-instagram"></i></a>
                                            <a href="https://linkedin.com/company/onlinemundi" target="_blank" rel="noopener noreferrer" className="social-btn"><i className="fa-brands fa-linkedin-in"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full Width Map Box */}
                    <div className="row mt-5">
                        <div className="col-12 contact-animate contact-animate-up">
                            <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ height: "400px" }}>
                                <iframe
                                    src="https://maps.google.com/maps?q=31.9022713,73.26297&t=&z=16&ie=UTF8&iwloc=&output=embed"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                /* ===== Hero ===== */
                .contact-hero {
                    position: relative;
                    background: url("/images/watermelon-plants.png") center/100% 150% no-repeat;
                    padding: 100px 0 125px;
                    overflow: hidden;
                }

                .contact-hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7));
                    z-index: 1;
                }

                .contact-hero-shape {
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: #f8f9fa;
                    clip-path: ellipse(55% 100% at 50% 100%);
                    z-index: 2;
                }

                .contact-hero-content {
                    max-width: 560px;
                    color: white;
                    position: relative;
                }

                .contact-hero-fade {
                    opacity: 0;
                    transform: translateY(22px);
                    animation: contactHeroIn 0.8s ease forwards 0.2s;
                }

                .contact-hero-delay-1 {
                    opacity: 0;
                    transform: translateY(22px);
                    animation: contactHeroIn 0.8s ease forwards 0.45s;
                }

                @keyframes contactHeroIn {
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ===== Scroll Animations ===== */
                .contact-animate {
                    opacity: 0;
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }

                .contact-animate-up {
                    transform: translateY(40px);
                }

                .contact-animate-left {
                    transform: translateX(-40px);
                }

                .contact-animate-right {
                     transform: translateX(40px);
                }

                .contact-animate.contact-visible {
                     opacity: 1;
                     transform: translate(0, 0);
                }

                @media (prefers-reduced-motion: reduce) {
                    .contact-hero-fade,
                    .contact-hero-delay-1 {
                        animation: none !important;
                        opacity: 1;
                        transform: none;
                    }

                    .contact-animate {
                        opacity: 1;
                        transform: none;
                        transition: none;
                    }
                }

                .form-control {
                    border-radius: 10px;
                    padding: 12px 15px;
                    border: 1px solid #dee2e6;
                    background-color: #f8f9fa;
                    transition: border-color 0.2s, background-color 0.2s;
                }

                .form-control:focus {
                    background-color: #fff;
                    border-color: #2d6a4f;
                    box-shadow: 0 0 0 0.25rem rgba(45, 106, 79, 0.1);
                }

                .submit-btn {
                    border-radius: 10px;
                    color: #1b4332;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 202, 40, 0.4);
                }

                .info-card {
                    background: linear-gradient(180deg, #2d6a4f 0%, #1b4332 100%);
                    position: relative;
                    overflow: hidden;
                }

                .info-card::before {
                    content: "";
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    width: 150px;
                    height: 150px;
                    background: radial-gradient(circle, rgba(255, 202, 40, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }

                .icon-box {
                    width: 45px;
                    height: 45px;
                    border-radius: 12px;
                    background: rgba(255, 202, 40, 0.15);
                    color: #ffca28;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }

                .social-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .social-btn:hover {
                    background: #ffca28;
                    color: #1b4332;
                    transform: translateY(-3px);
                }
            `}</style>

            <Script
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
                strategy="afterInteractive"
            />
        </div >
    );
}
