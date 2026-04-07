"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      
      <div className="bg-light py-5">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/" className="text-success text-decoration-none">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Privacy Policy</li>
            </ol>
          </nav>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mt-4">
            <div className="card-header bg-success text-white py-4 px-4 px-md-5 border-0">
              <h1 className="h2 fw-bold mb-0">Privacy Policy</h1>
              <p className="mb-0 opacity-75 mt-2">Last updated: April 08, 2026</p>
            </div>
            <div className="card-body p-4 p-md-5 bg-white">
              <div className="policy-content">
                <section className="mb-5">
                  <h3 className="fw-bold text-success mb-3">1. Introduction</h3>
                  <p className="text-muted">
                    Welcome to OnlineMundi Pakistan. We respect your privacy and are committed to protecting your personal data. 
                    This privacy policy will inform you about how we look after your personal data when you visit our website 
                    and tell you about your privacy rights and how the law protects you.
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-success mb-3">2. The Data We Collect About You</h3>
                  <p className="text-muted">
                    Personal data, or personal information, means any information about an individual from which that person can be identified. 
                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                  </p>
                  <ul className="text-muted list-styled">
                    <li className="mb-2"><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                    <li className="mb-2"><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                    <li className="mb-2"><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                    <li className="mb-2"><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
                  </ul>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-success mb-3">3. How We Use Your Personal Data</h3>
                  <p className="text-muted">
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                  </p>
                  <ul className="text-muted list-styled">
                    <li className="mb-2">To register you as a new customer (Buyer or Seller).</li>
                    <li className="mb-2">To process and deliver your trade requirements.</li>
                    <li className="mb-2">To manage our relationship with you.</li>
                    <li className="mb-2">To enable you to partake in a prize draw, competition or complete a survey.</li>
                    <li className="mb-2">To improve our website, products/services, marketing, customer relationships and experiences.</li>
                  </ul>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-success mb-3">4. Data Security</h3>
                  <p className="text-muted">
                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                    used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal 
                    data to those employees, agents, contractors and other third parties who have a business need to know.
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-success mb-3">5. Your Legal Rights</h3>
                  <p className="text-muted">
                    Under certain circumstances, you have rights under data protection laws in relation to your personal data, 
                    including the right to request access, correction, erasure, restriction, transfer, to object to processing, 
                    to withdrawal of consent.
                  </p>
                </section>

                <section className="mb-0">
                  <h3 className="fw-bold text-success mb-3">6. Contact Us</h3>
                  <p className="text-muted mb-4">
                    If you have any questions about this privacy policy or our privacy practices, please contact our data 
                    privacy manager in the following ways:
                  </p>
                  <div className="bg-light p-4 rounded-4 border">
                    <p className="mb-2"><strong>Email address:</strong> privacy@onlinemundi.pk</p>
                    <p className="mb-2"><strong>Postal address:</strong> Pattan Road, Pindi bhattian, Pakistan</p>
                    <p className="mb-0"><strong>Telephone number:</strong> +92 300 1234567</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .list-styled {
          padding-left: 1.5rem;
        }
        .policy-content p {
          line-height: 1.8;
          font-size: 1.05rem;
        }
        .card-header {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
        }
      `}</style>
    </>
  );
}
