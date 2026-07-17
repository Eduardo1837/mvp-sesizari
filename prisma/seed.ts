import { PrismaClient, StatusSesizare } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Configurare Prisma cu adaptor PG
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// 2. Date mock
const mockData = [
  { cat: "INSTALATII", texte: ["Teava sparta in subsol, curge apa continuu.", "Fara apa calda la etajul 4 de 2 zile.", "Infiltratii pe peretele din baie de la vecinul de sus."] },
  { cat: "ADMINISTRATIV", texte: ["Bec ars pe casa scarii la etajul 2.", "Panoul electric de la parter scoate scantei.", "Intreruperi dese de curent in tot blocul."] },
  { cat: "CURATENIE", texte: ["Gunoaie lasate la ghena de la etajul 1.", "Miros insuportabil pe holul principal.", "Femeia de serviciu nu a mai sters pe jos de o saptamana."] },
  { cat: "ZGOMOT", texte: ["Bormasina duminica dimineata la apartamentul 12.", "Muzica la volum maxim dupa ora 23:00 la ap. 5.", "Caini care latra continuu pe palier."] },
  { cat: "ALTELE", texte: ["Mesaj de test ignorati.", "injuraturi la adresa administratorului!", "Vreau sa reclam vremea proasta."] }
]

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function getRandomDateWithin30Days(): Date {
  const date = new Date();
  const daysAgo = getRandomInt(0, 30);
  const hoursAgo = getRandomInt(0, 23);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date;
}

async function main() {
  // 3. Ștergem doar sesizările vechi
  await prisma.sesizare.deleteMany({});
  console.log('Baza de date curățată de sesizări vechi.');

  const sesizariDeAdaugat = [];
  const numarSesizari = 50;

  for (let i = 0; i < numarSesizari; i++) {
    const categorieSelectata = getRandomItem(mockData);
    const textSelectat = getRandomItem(categorieSelectata.texte);
    
    const esteAbuz = categorieSelectata.cat === "ALTELE" && textSelectat.includes("injuraturi");
    const scorAbuz = esteAbuz ? getRandomFloat(0.75, 1.0) : getRandomFloat(0.0, 0.3);
    
    const statusRandom = Math.random();
    let status = StatusSesizare.DESCHISA;
    if (statusRandom > 0.8) status = StatusSesizare.REZOLVAT;
    else if (statusRandom > 0.6) status = StatusSesizare.IN_ANALIZA;

    sesizariDeAdaugat.push({
      text_sursa: textSelectat,
      categorie: categorieSelectata.cat,
      prioritate: getRandomInt(1, 5),
      scor_abuz: scorAbuz,
      actiune_admin: "Necesită evaluare umană/intervenție tehnică.",
      status: status,
      solutie_temporara: "Se recomandă monitorizarea situației și luarea măsurilor corespunzătoare.",
      ora_incident: getRandomDateWithin30Days(),
    });
  }

  // 4. Inserare directă, fără useri
  const insertResult = await prisma.sesizare.createMany({
    data: sesizariDeAdaugat,
  });

  console.log(`Seed complet: Au fost inserate ${insertResult.count} sesizări pe o perioadă de 30 de zile.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })