/*
  Warnings:

  - The primary key for the `DocumentEmbedding` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "DocumentEmbedding" DROP CONSTRAINT "DocumentEmbedding_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DocumentEmbedding_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DocumentEmbedding_id_seq";
