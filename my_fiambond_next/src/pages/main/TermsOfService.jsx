"use client"; // Your instruction remembered!

import Link from "next/link";
import React from "react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="border-b border-gray-100 pb-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Last Updated: November 27, 2025</p>
          </div>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By creating an account or accessing FiamBond ("The Service"), you agree to be bound by these Terms. 
                If you do not agree, you may not use the Service. FiamBond is a digital ledger application designed 
                for tracking financial records; it is <strong>not</strong> a bank, wallet, or financial institution.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="mb-3">
                FiamBond provides a platform for tracking loans, debts, and payroll through three distinct "Realms":
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Realm:</strong> For individual tracking and smart loans between friends.</li>
                <li><strong>Family Realm:</strong> Shared tracking for household expenses and budgets.</li>
                <li><strong>Company Realm:</strong> Professional suite for employee cash advances and payroll generation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Responsibilities</h2>
              <p>
                You are solely responsible for the accuracy of the data you input. FiamBond acts as a calculator and storage 
                system for the data you provide ("The Ledger of Truth"). We do not verify the legality or reality of 
                the debts recorded.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscriptions & Payments</h2>
              <p className="mb-3">Access to "Company Realm" features requires a paid subscription.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Billing Cycle:</strong> Fees are billed in advance on a recurring basis.</li>
                <li><strong>Cancellations:</strong> You may cancel at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Disclaimer of Liability</h2>
              <p>
                FiamBond is provided "AS IS". We are not liable for any disputes arising between users regarding 
                debts recorded on the platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}