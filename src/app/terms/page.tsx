"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function TermsOfUse() {
  return (
    <>
      <Navbar />
      
      <div className="bg-light py-5">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/" className="text-success text-decoration-none">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Terms of Use</li>
            </ol>
          </nav>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mt-4">
            <div className="card-header bg-dark text-white py-4 px-4 px-md-5 border-0">
              <h1 className="h2 fw-bold mb-0">Terms of Use</h1>
              <p className="mb-0 opacity-75 mt-2">Effective Date: April 08, 2026</p>
            </div>
            <div className="card-body p-4 p-md-5 bg-white">
              <div className="terms-content">
                <section className="mb-5">
                  <h3 className="fw-bold text-dark mb-3">1. Acceptance of Terms</h3>
                  <p className="text-muted">
                    By accessing and using OnlineMundi Pakistan (the "Platform"), you agree to comply with and be bound by 
                    these Terms of Use. If you do not agree with these terms, please do not use the Platform. 
                    These terms apply to all visitors, users, and others who access or use the Service.
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-dark mb-3">2. User Accounts</h3>
                  <p className="text-muted">
                    To access certain features of the Platform, you may be required to register for an account as a "Buyer" or "Seller." 
                    You are responsible for maintaining the confidentiality of your account information and for all activities 
                    that occur under your account. You must notify us immediately of any unauthorized use of your account.
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-dark mb-3">3. Marketplace Rules</h3>
                  <p className="text-muted">
                    OnlineMundi Pakistan is a marketplace platform. When listing or purchasing agricultural products, you agree to:
                  </p>
                  <ul className="text-muted list-styled">
                    <li className="mb-2">Provide accurate and truthful information about products, quality, and location.</li>
                    <li className="mb-2">Honour agreed-upon trade terms and payment obligations.</li>
                    <li className="mb-2">Not engage in fraudulent activities, price manipulation, or harassment of other users.</li>
                    <li className="mb-2">Not post any illegal, inaccurate, or deceptive content.</li>
                  </ul>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-dark mb-3">4. Intellectual Property</h3>
                  <p className="text-muted">
                    The Service and its original content, features, and functionality are and will remain the exclusive 
                    property of OnlineMundi Pakistan and its licensors. Our trademarks and trade dress may not be 
                    used in connection with any product or service without our prior written consent.
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-dark mb-3">5. Limitation of Liability</h3>
                  <p className="text-muted">
                    In no event shall OnlineMundi Pakistan, nor its directors, employees, partners, agents, suppliers, 
                    or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
                    including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                    resulting from your access to or use of or inability to access or use the Service.
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="fw-bold text-dark mb-3">6. Modifications</h3>
                  <p className="text-muted">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                    If a revision is material, we will try to provide at least 30 days' notice prior to any 
                    new terms taking effect. What constitutes a material change will be determined at our 
                    sole discretion.
                  </p>
                </section>

                <section className="mb-0">
                  <h3 className="fw-bold text-dark mb-3">7. Governing Law</h3>
                  <p className="text-muted">
                    These Terms shall be governed and construed in accordance with the laws of Pakistan, 
                    without regard to its conflict of law provisions.
                  </p>
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
        .terms-content p {
          line-height: 1.8;
          font-size: 1.05rem;
        }
        .text-dark {
          color: #1b4332 !important;
        }
        .card-header {
          background: linear-gradient(135deg, #081c15 0%, #1b4332 100%);
        }
      `}</style>
    </>
  );
}
