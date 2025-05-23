"use client"
import React from "react";
import Link from "next/link";

export default function UserGuidePage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-teal-300">User Guide: How to Use TreeTrace</h1>
      <p className="mb-8 text-gray-300">
        Welcome to TreeTrace! This guide will help you get the most out of your family tree and health tracking experience. If you have already created your account, follow these steps to explore and use the app's main features.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-teal-200 mb-2">1. Family Tree (TreeView) Page</h2>
        <ul className="list-disc ml-6 text-gray-200 space-y-2">
          <li>Navigate to <b>My Tree</b> from the sidebar to view your family tree.</li>
          <li>Click on a family member to view details, add relatives, or edit information.</li>
          <li>Use the <b>add</b> or <b>edit</b> buttons to update relationships, add children, partners, or parents.</li>
          <li>Hover over nodes for quick info, or click for full details and actions.</li>
          <li>Use the <b>Share</b> button to share your tree with others.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-teal-200 mb-2">2. Health Overview Page</h2>
        <ul className="list-disc ml-6 text-gray-200 space-y-2">
          <li>Go to <b>Health Overview</b> in the sidebar to see a summary of health conditions across your family.</li>
          <li>Filter by specific health conditions using the dropdown at the top.</li>
          <li>Sort by generation or name to spot hereditary patterns.</li>
          <li>Export the overview as a CSV or generate a custom health report (PDF) using the provided buttons.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-teal-200 mb-2">3. Health Condition Form Page</h2>
        <ul className="list-disc ml-6 text-gray-200 space-y-2">
          <li>Click on a family member and select <b>Medical History</b> to view or edit their health information.</li>
          <li>Fill out the health condition checkboxes, allergies, medications, surgeries, and other relevant fields.</li>
          <li>Save the form to update the member's medical history. You can update this information anytime.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-teal-200 mb-2">4. Suggestions & Similar Trees</h2>
        <ul className="list-disc ml-6 text-gray-200 space-y-2">
          <li>When viewing your family tree, you may see an <span className="inline-block align-middle w-3 h-3 rounded-full bg-orange-400 mr-1"></span> <b>orange circle</b> on certain nodes or in the sidebar.</li>
          <li>This indicates that TreeTrace has found <b>similar family members or trees</b> from other users that may match your relatives.</li>
          <li>Click the orange circle or the suggestion icon to view details about the suggested match.</li>
          <li>You can review the suggested information and choose to <b>add</b> the suggested member or tree to your own family tree if it matches.</li>
          <li>This feature helps you discover new connections and expand your family history with data from the TreeTrace community.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-teal-200 mb-2">5. Other Features</h2>
        <ul className="list-disc ml-6 text-gray-200 space-y-2">
          <li><b>Search Users:</b> Use the search function in the sidebar to find and connect with other users or family members.</li>
          <li><b>Settings:</b> Update your profile, privacy preferences, and notification settings in the Settings page.</li>
          <li><b>AI Health Assistant:</b> Use the AI chat sidebar for health advice, risk analysis, or to ask questions about your family's health data.</li>
          <li><b>Report Generation:</b> On the Health Overview page, generate custom health reports using AI and export them as PDF for sharing or record-keeping.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-teal-200 mb-2">Tips & Support</h2>
        <ul className="list-disc ml-6 text-gray-200 space-y-2">
          <li>Hover over buttons and icons for tooltips and extra info.</li>
          <li>For privacy, you control who can see your family and health data.</li>
          <li>If you need help, check this guide or contact support from the Settings page.</li>
        </ul>
      </section>

      <div className="mt-10 text-center">
        <Link href="/dashboard/main">
          <button className="px-6 py-2 bg-teal-600 rounded text-white hover:bg-teal-700">Back to Dashboard</button>
        </Link>
      </div>
    </div>
  );
} 