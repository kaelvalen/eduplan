-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "capacityMarginEnabled" BOOLEAN NOT NULL DEFAULT false,
    "capacityMarginPercent" INTEGER NOT NULL DEFAULT 0,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "dayStart" TEXT NOT NULL DEFAULT '08:00',
    "dayEnd" TEXT NOT NULL DEFAULT '18:00',
    "lunchBreakStart" TEXT NOT NULL DEFAULT '12:00',
    "lunchBreakEnd" TEXT NOT NULL DEFAULT '13:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemSettings" ("capacityMarginEnabled", "capacityMarginPercent", "createdAt", "id", "updatedAt") SELECT "capacityMarginEnabled", "capacityMarginPercent", "createdAt", "id", "updatedAt" FROM "SystemSettings";
DROP TABLE "SystemSettings";
ALTER TABLE "new_SystemSettings" RENAME TO "SystemSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Classroom_faculty_department_idx" ON "Classroom"("faculty", "department");

-- CreateIndex
CREATE INDEX "Classroom_type_idx" ON "Classroom"("type");

-- CreateIndex
CREATE INDEX "Classroom_isActive_idx" ON "Classroom"("isActive");

-- CreateIndex
CREATE INDEX "Course_faculty_level_idx" ON "Course"("faculty", "level");

-- CreateIndex
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");

-- CreateIndex
CREATE INDEX "Course_teacherId_idx" ON "Course"("teacherId");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX "Schedule_day_timeRange_idx" ON "Schedule"("day", "timeRange");

-- CreateIndex
CREATE INDEX "Schedule_courseId_classroomId_idx" ON "Schedule"("courseId", "classroomId");

-- CreateIndex
CREATE INDEX "Schedule_isHardcoded_idx" ON "Schedule"("isHardcoded");

-- CreateIndex
CREATE INDEX "Schedule_day_idx" ON "Schedule"("day");

-- CreateIndex
CREATE INDEX "Teacher_faculty_department_idx" ON "Teacher"("faculty", "department");

-- CreateIndex
CREATE INDEX "Teacher_isActive_idx" ON "Teacher"("isActive");
