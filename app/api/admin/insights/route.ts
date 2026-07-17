import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genAI } from "@/lib/gemini";
import { SchemaType } from "@google/generative-ai";
import { StatusSesizare } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body;

    const validTypes = ["FREQUENT_ISSUES", "DAILY_SUMMARY", "ABUSE_ANALYSIS", "CRITICAL_INCIDENTS"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Tip de raport invalid." }, { status: 400 });
    }

    let dataContext;
    let systemInstruction;
    let responseSchema;

    const now = new Date();

    switch (type) {
      case "FREQUENT_ISSUES":
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        dataContext = await prisma.sesizare.findMany({
          where: { ora_incident: { gte: thirtyDaysAgo } },
          select: { text_sursa: true, categorie: true },
        });
        systemInstruction = "Analizează sesizările furnizate. Identifică cea mai frecventă problemă sau tipar de incident. Bazează-te strict pe datele primite.";
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: {
            categorie_principala: { type: SchemaType.STRING, description: "Categoria predominantă" },
            incident_recurent: { type: SchemaType.STRING, description: "Problemele recurente sau tiparul recurent identificat" },
            frecventa_estimata: { type: SchemaType.INTEGER, description: "Numărul estimat de apariții" },
          },
          required: ["categorie_principala", "incident_recurent", "frecventa_estimata"],
        };
        break;

      case "DAILY_SUMMARY":
        const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        dataContext = await prisma.sesizare.findMany({
          where: { ora_incident: { gte: twentyFourHoursAgo } },
          select: { id: true, text_sursa: true, prioritate: true, categorie: true },
        });
        systemInstruction = "Realizează un rezumat concis al incidentelor raportate în ultimele 24 de ore.";
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: {
            total_incidente: { type: SchemaType.INTEGER },
            sinteza_generala: { type: SchemaType.STRING },
            departament_afectat: { type: SchemaType.STRING, description: "Departamentul sau zona cu cele mai multe probleme" },
          },
          required: ["total_incidente", "sinteza_generala", "departament_afectat"],
        };
        break;

      case "ABUSE_ANALYSIS":
        const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
        dataContext = await prisma.sesizare.findMany({
          where: {
            ora_incident: { gte: sevenDaysAgo },
            scor_abuz: { gt: 0.7 },
          },
          select: { text_sursa: true, scor_abuz: true, categorie: true },
        });
        systemInstruction = "Analizează sesizările marcate cu risc mare de abuz (>0.7) din ultimele 7 zile. Identifică de ce aceste texte sunt considerate abuzive sau spam.";
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: {
            tipar_abuziv: { type: SchemaType.STRING, description: "Comportamentul abuziv detectat" },
            justificare_scor: { type: SchemaType.STRING },
            actiune_recomandata: { type: SchemaType.STRING },
          },
          required: ["tipar_abuziv", "justificare_scor", "actiune_recomandata"],
        };
        break;

      case "CRITICAL_INCIDENTS":
        const fortyEightHoursAgo = new Date(new Date().getTime() - 48 * 60 * 60 * 1000);
        dataContext = await prisma.sesizare.findMany({
          where: {
            ora_incident: { gte: fortyEightHoursAgo },
            prioritate: { in: [4, 5] },
            status: { not: StatusSesizare.REZOLVAT },
          },
          select: { text_sursa: true, categorie: true, prioritate: true },
        });
        systemInstruction = "Evaluează incidentele critice active (prioritate 4 și 5) raportate în ultimele 48 de ore.";
        responseSchema = {
          type: SchemaType.OBJECT,
          properties: {
            risc_major: { type: SchemaType.STRING, description: "Riscul principal identificat" },
            necesar_interventie_imediata: { type: SchemaType.BOOLEAN },
            rezumat_urgente: { type: SchemaType.STRING },
          },
          required: ["risc_major", "necesar_interventie_imediata", "rezumat_urgente"],
        };
        break;
    }

    // Gestiune caz fără date
    if (!dataContext || dataContext.length === 0) {
      return NextResponse.json({
        mesaj_sistem: "Nu există suficiente date în baza de date pentru perioada selectată pentru a genera acest raport.",
      });
    }

    // Configurare model Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Temperatură joasă pentru analiză deterministă, nu creativă
      },
    });

    const prompt = `${systemInstruction}\n\nDate de analizat (JSON extrase din DB):\n${JSON.stringify(dataContext)}`;
    const result = await model.generateContent(prompt);
    
    // Extragere și validare răspuns
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("[API AI Insights] Eroare:", error);
    return NextResponse.json(
      { error: "A apărut o eroare la procesarea datelor prin AI." },
      { status: 500 }
    );
  }
}