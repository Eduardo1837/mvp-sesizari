"use client";

import { useState } from "react";

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
      // Construcția obiectului DateTime folosind data curentă și ora selectată
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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Raportare Sesizare</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="descriere" className="block text-sm font-medium text-gray-700 mb-1">
              Descrierea problemei
            </label>
            <textarea
              id="descriere"
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Curge apă din tavan pe scara B..."
              value={textSursa}
              onChange={(e) => setTextSursa(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="ora" className="block text-sm font-medium text-gray-700 mb-1">
              Ora incidentului
            </label>
            <input
              type="time"
              id="ora"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={oraIncident}
              onChange={(e) => setOraIncident(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
          >
            {isLoading ? "Se procesează..." : "Trimite Sesizarea"}
          </button>
        </form>

        {feedback && (
          <div
            className={`mt-6 p-4 rounded-md border ${
              feedback.tip === "succes"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <h3 className="font-semibold mb-1">
              {feedback.tip === "succes" ? "Sfat Imediat:" : "Eroare:"}
            </h3>
            <p className="text-sm">{feedback.mesaj}</p>
          </div>
        )}
      </div>
    </main>
  );
}