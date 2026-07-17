"use client";

import { useState } from "react";
import Link from "next/link";

export default function RaportareSesizare() {
  const [textSursa, setTextSursa] = useState("");
  const [oraIncident, setOraIncident] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tip: "succes" | "eroare"; mesaj: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const dataCurenta = new Date().toISOString().split("T")[0];
      const dataOraCompleta = new Date(`${dataCurenta}T${oraIncident}:00`).toISOString();

      const response = await fetch("/api/sesizari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text_sursa: textSursa,
          ora_incident: dataOraCompleta,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "A apărut o eroare la procesarea sesizării.");
      }

      setFeedback({ tip: "succes", mesaj: data.solutie_temporara });
      setTextSursa("");
      setOraIncident("");
    } catch (error: any) {
      setFeedback({ tip: "eroare", mesaj: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 tracking-tight">CivicAdmin</span>
          </div>
          <Link 
            href="/admin" 
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
          >
            Portal Admin ›
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Raportare Problemă</h1>
          <p className="text-sm text-slate-500 mt-1">Transmiteți sesizarea pentru evaluare automată.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="descriere" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Descrierea situației
                </label>
                <textarea
                  id="descriere"
                  required
                  rows={4}
                  className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                  placeholder="Ex: Curge apă din tavan la etajul 2..."
                  value={textSursa}
                  onChange={(e) => setTextSursa(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="ora" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Ora constatării
                </label>
                <input
                  type="time"
                  id="ora"
                  required
                  className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors cursor-pointer"
                  value={oraIncident}
                  onChange={(e) => setOraIncident(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sistemul AI procesează..." : "Trimite Sesizarea"}
              </button>
            </form>
          </div>
        </div>

        {/* AI Feedback Card */}
        {feedback && (
          <div className={`mt-5 p-4 rounded-xl border ${feedback.tip === 'succes' ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="12" height="12" viewBox="0 0 11 11" fill="none" className={feedback.tip === 'succes' ? 'text-blue-500' : 'text-red-500'}>
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3.5 6.5C4 7.5 7 7.5 7.5 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                <circle cx="3.8" cy="4.2" r=".7" fill="currentColor" />
                <circle cx="7.2" cy="4.2" r=".7" fill="currentColor" />
              </svg>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${feedback.tip === 'succes' ? 'text-blue-600' : 'text-red-600'}`}>
                {feedback.tip === 'succes' ? 'Acțiune AI' : 'Eroare'}
              </span>
            </div>
            <p className={`text-sm font-medium leading-snug ${feedback.tip === 'succes' ? 'text-blue-900' : 'text-red-900'}`}>
              {feedback.mesaj}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}