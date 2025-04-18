"use client";

import { useEffect, useState } from "react";
import useTreeStore from "@/store/useTreeStore";
import { toast } from "react-hot-toast";

export default function TreeViewPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Our Family Tree</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <iframe
          src="/familytree.html" // Updated path to reflect the public directory
          style={{ width: "100%", height: "700px", border: "none" }}
          title="Family Tree"
        />
      </div>
    </div>
  );
}
