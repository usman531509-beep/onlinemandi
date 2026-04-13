"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="footer-section">
            <div className="container">
                <div className="row g-4">
                    {/* Brand Info */}
                    <div className="col-lg-4 col-md-6">
                        <div className="footer-brand mb-3">
                            <Link href="/" className="text-decoration-none h4 fw-bold text-white">
                                ONLINE<span className="text-warning">MUNDI</span>
                                <small className="ms-1" style={{ fontSize: "12px", opacity: 0.8 }}>{t("footer.brand")}</small>
                            </Link>
                        </div>
                        <p className="footer-about-text mb-4">
                            {t("footer.about")}
                        </p>
                        <div className="social-links d-flex gap-3">
                            <a href="#" className="social-icon">
                                <i className="fa-brands fa-facebook-f"></i>
                            </a>
                            <a href="#" className="social-icon">
                                <i className="fa-brands fa-twitter"></i>
                            </a>
                            <a href="#" className="social-icon">
                                <i className="fa-brands fa-instagram"></i>
                            </a>
                            <a href="#" className="social-icon">
                                <i className="fa-brands fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-lg-2 col-md-6">
                        <h5 className="footer-heading mb-4 text-white fw-bold">{t("footer.quickLinks")}</h5>
                        <ul className="footer-links list-unstyled">
                            <li className="mb-2"><Link href="/">{t("nav.home")}</Link></li>
                            <li className="mb-2"><Link href="/about">{t("nav.about")}</Link></li>
                        </ul>
                    </div>

                    <div className="col-lg-2 col-md-6">
                        <h5 className="footer-heading mb-4 text-white fw-bold">{t("footer.support")}</h5>
                        <ul className="footer-links list-unstyled">
                            <li className="mb-2"><Link href="/privacy">{t("footer.privacyPolicy")}</Link></li>
                            <li className="mb-2"><Link href="/terms">{t("footer.termsOfUse")}</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="col-lg-4 col-md-6">
                        <h5 className="footer-heading mb-4 text-white fw-bold">{t("footer.contactOffice")}</h5>
                        <div className="contact-item d-flex gap-3 mb-3">
                            <div className="contact-icon">
                                <i className="fa-solid fa-location-dot text-warning"></i>
                            </div>
                            <p className="mb-0 small opacity-75">
                                {t("footer.address")}
                            </p>
                        </div>
                        <div className="contact-item d-flex gap-3 mb-3">
                            <div className="contact-icon">
                                <i className="fa-solid fa-phone text-warning"></i>
                            </div>
                            <p className="mb-0 small opacity-75">
                                {t("footer.phone")} <br />
                                {t("footer.phoneHours")}
                            </p>
                        </div>
                        <div className="contact-item d-flex gap-3 mb-3">
                            <div className="contact-icon">
                                <i className="fa-solid fa-envelope text-warning"></i>
                            </div>
                            <p className="mb-0 small opacity-75">
                                {t("footer.email1")} <br />
                                {t("footer.email2")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer-divider"></div>

                <div className="row align-items-center py-4">
                    <div className="col-md-12">
                        <p className="footer-copyright mb-md-0 mb-3 small opacity-50 text-center">
                            &copy; {new Date().getFullYear()} {t("footer.copyright")}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .footer-section {
          background: linear-gradient(180deg, #1b4332 0%, #081c15 100%);
          color: rgba(255, 255, 255, 0.7);
          padding-top: 60px;
          margin-top: 60px;
          position: relative;
        }

        .footer-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 202, 40, 0.3), transparent);
          z-index: 1;
        }

        .footer-about-text {
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .footer-heading {
          font-size: 1.1rem;
          position: relative;
          padding-bottom: 12px;
        }

        .footer-heading::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          width: 30px;
          height: 2px;
          background-color: #ffca28;
        }

        .footer-links :global(a) {
          color: rgba(255, 255, 255, 0.75) !important;
          text-decoration: none !important;
          transition: all 0.3s ease;
          display: inline-block;
          font-size: 0.95rem;
        }

        .footer-links li:hover :global(a) {
          color: #ffca28 !important;
          opacity: 1 !important;
        }

        .footer-links li {
          transition: transform 0.3s ease;
        }

        .footer-links li:hover {
          transform: translateX(5px);
        }

        .social-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .social-icon:hover {
          background: #ffca28;
          color: #1b4332;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(255, 202, 40, 0.3);
        }

        .contact-icon {
          width: 35px;
          text-align: center;
          font-size: 1.2rem;
        }

        .footer-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          width: 100%;
          margin-top: 40px;
        }

        @media (max-width: 768px) {
          .footer-section {
            padding-top: 60px;
          }
          
          .footer-heading {
            margin-top: 20px;
          }
        }
      `}</style>
        </footer>
    );
}
