"use client";

import { useState } from "react";

// 1. Contractul de Date
type ReportType = "FREQUENT_ISSUES" | "DAILY_SUMMARY" | "ABUSE_ANALYSIS" | "CRITICAL_INCIDENTS";

const REPORT_LABELS: Record<ReportType, string> = {
  FREQUENT_ISSUES: "Probleme Frecvente",
  DAILY_SUMMARY: "Rezumatul Zilei",
  ABUSE_ANALYSIS: "Analiza Abuzurilor",
  CRITICAL_INCIDENTS: "Incidente Critice",
};

export default function AiInsightsPanel() {
  // 2. Gestiunea Stării
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 3. Handler-ul Asincron
  const fetchInsight = async (type: ReportType) => {
    setActiveReport(type);
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/admin/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        throw new Error(`Eroare HTTP: ${res.status}`);
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "A apărut o eroare la generarea raportului AI.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Interfața (JSX + Tailwind)
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">AI Insights</h2>

      {/* Zona de Control (Butoane) */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(Object.entries(REPORT_LABELS) as [ReportType, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => fetchInsight(key)}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50
              ${
                activeReport === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Zona de Afișare a Datelor */}
      <div className="min-h-[150px] bg-gray-50 rounded-md p-4 border border-gray-100">
        {loading && (
          <div className="flex items-center justify-center h-full text-blue-600 font-medium animate-pulse">
            AI analizează datele...
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-4">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-gray-800 text-sm">
                  {/* Tratare simplă în caz că AI-ul returnează un array sau obiect imbricat */}
                  {typeof value === "object" ? JSON.stringify(value) : value}
                </span>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !data && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Selectează un raport pentru a genera insight-uri.
          </div>
        )}
      </div>
    </div>
  );
}