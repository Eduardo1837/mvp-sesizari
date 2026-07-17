-- CreateEnum
CREATE TYPE "CategorieSesizare" AS ENUM ('INSTALATII', 'CURATENIE', 'ZGOMOT', 'ADMINISTRATIV', 'ALTELE');

-- CreateEnum
CREATE TYPE "StatusSesizare" AS ENUM ('NOU', 'PRELUAT', 'REZOLVAT');

-- CreateTable
CREATE TABLE "Sesizare" (
    "id" TEXT NOT NULL,
    "text_sursa" TEXT NOT NULL,
    "categorie" "CategorieSesizare" NOT NULL,
    "prioritate" INTEGER NOT NULL,
    "scor_abuz" DOUBLE PRECISION NOT NULL,
    "ora_incident" TIMESTAMP(3) NOT NULL,
    "status" "StatusSesizare" NOT NULL DEFAULT 'NOU',
    "solutie_temporara" TEXT NOT NULL,
    "actiune_admin" TEXT NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesizare_pkey" PRIMARY KEY ("id")
);
