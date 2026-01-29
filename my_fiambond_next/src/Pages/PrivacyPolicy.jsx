"use client"; // Your instruction remembered!

import Link from "next/link";
import React from "react";

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Effective Date: November 27, 2025</p>
          </div>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">To operate the Ledger of Truth, we collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and encrypted password.</li>
                <li><strong>Financial Data:</strong> Transaction amounts, dates, notes, and loan statuses inputted by you.</li>
                <li><strong>Realm Associations:</strong> Connections to Family or Company realms (employee lists, payroll records).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Data</h2>
              <p>We use your data solely to provide the Service functionality:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Calculating balances and debt totals.</li>
                <li>Generating PDF payslips and invoices.</li>
                <li>Sending notifications for loan requests or updates.</li>
                <li>We <strong>never</strong> sell your personal financial data to third-party advertisers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Security</h2>
              <p>
                Security is our top priority. We use industry-standard <strong>AES-256 encryption</strong> for sensitive data 
                stored in our database. While we strive to protect your personal information, no method of transmission 
                over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing</h2>
              <p>
                Data entered into a <strong>Shared Realm</strong> (Family or Company) is visible to other members of that Realm 
                based on their permission levels (Admin, Member, Viewer). You accept that invited members can view the 
                transactions associated with that Realm.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
              <p>
                You have the right to request an export of your data or the deletion of your account. Deleting your account 
                will permanently remove your personal access to the ledger, though transaction records involving other 
                users may persist in their history to maintain ledger integrity.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}