/*
  Warnings:

  - You are about to drop the column `priority` on the `Bug` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bug" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "screenshot" TEXT,
    "fixType" TEXT NOT NULL DEFAULT 'BUG',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "creatorId" INTEGER NOT NULL,
    "assigneeId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bug_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bug_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bug" ("assigneeId", "createdAt", "creatorId", "description", "id", "name", "screenshot", "status", "updatedAt", "url") SELECT "assigneeId", "createdAt", "creatorId", "description", "id", "name", "screenshot", "status", "updatedAt", "url" FROM "Bug";
DROP TABLE "Bug";
ALTER TABLE "new_Bug" RENAME TO "Bug";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
