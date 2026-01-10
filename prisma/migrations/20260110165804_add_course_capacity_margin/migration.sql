-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "teacherId" INTEGER,
    "faculty" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT '1',
    "category" TEXT NOT NULL DEFAULT 'zorunlu',
    "semester" TEXT NOT NULL DEFAULT 'güz',
    "ects" INTEGER NOT NULL DEFAULT 3,
    "totalHours" INTEGER NOT NULL DEFAULT 2,
    "capacityMargin" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("category", "code", "createdAt", "ects", "faculty", "id", "isActive", "level", "name", "semester", "teacherId", "totalHours", "updatedAt") SELECT "category", "code", "createdAt", "ects", "faculty", "id", "isActive", "level", "name", "semester", "teacherId", "totalHours", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
