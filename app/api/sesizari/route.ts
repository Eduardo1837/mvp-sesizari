import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CategorieSesizare } from '@prisma/client';
import { GoogleGenerativeAI } from "@google/generative-ai";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const VALID_CATEGORIES: CategorieSesizare[] = [
    'INSTALATII', 'CURATENIE', 'ZGOMOT', 'ADMINISTRATIV', 'ALTELE'
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text_sursa, ora_incident } = body;

        if (!text_sursa || !ora_incident) {
            return NextResponse.json({ error: "Date incomplete" }, { status: 400 });
        }
    
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {responseMimeType: 'application/json'}
        });

        const prompt = `
            Analizează următoarea sesizare a unui locatar.
            Extrage datele strict în format JSON folosind exact următoarele chei și tipuri:
            - "categorie": String (Doar una din: INSTALATII, CURATENIE, ZGOMOT, ADMINISTRATIV, ALTELE)
            - "prioritate": Integer (Scala 1 - 5, unde 5 este urgență majoră)
            - "scor_abuz": Float (Între 0.0 pentru complet legitim și 1.0 pentru spam clar/injurii)
            - "solutie_temporara": String (Sfat imediat pentru locatar, max 150 caractere)
            - "actiune_admin": String (Recomandare decizională pentru administrator, max 150 caractere)

            Sesizare: "${text_sursa}"
        `;

        const result = await model.generateContent(prompt);
        const textOutput = result.response.text();
        const aiData = JSON.parse(textOutput);

        const isCategoryValid = VALID_CATEGORIES.includes(aiData.categorie as CategorieSesizare);
        const safeCategory = isCategoryValid ? (aiData.categorie as CategorieSesizare) : 'ALTELE';

        const sesizare = await prisma.sesizare.create({
        data: {
            text_sursa,
            ora_incident: new Date(ora_incident),
            categorie: safeCategory,
            prioritate: Number(aiData.prioritate) || 1,
            scor_abuz: Number(aiData.scor_abuz) || 0.0,
            solutie_temporara: aiData.solutie_temporara || 'Vă rugăm să așteptați preluarea sesizării.',
            actiune_admin: aiData.actiune_admin || 'Necesită investigație manuală.'
            }
        });

        return NextResponse.json({ solutie_temporara: sesizare.solutie_temporara }, { status: 200 });

    } catch (error) {
        console.error('Eroare API Sesizari:', error);
        return NextResponse.json({ error: 'Eroare internă a serverului' }, { status: 500 });
    }
}

export async function GET() {
  try {
    const sesizari = await prisma.sesizare.findMany({
      orderBy: [
        { prioritate: 'desc' }, // Urgențele primele
        { scor_abuz: 'asc' },   // Spam-ul la final
        { creatLa: 'desc' }     // Cele mai noi primele
      ]
    });
    return NextResponse.json(sesizari, { status: 200 });
  } catch (error) {
    console.error('Eroare GET Sesizari:', error);
    return NextResponse.json({ error: 'Eroare la extragerea datelor' }, { status: 500 });
  }
}