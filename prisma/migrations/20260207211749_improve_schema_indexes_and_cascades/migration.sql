-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Schedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "timeRange" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "isHardcoded" BOOLEAN NOT NULL DEFAULT false,
    "sessionType" TEXT NOT NULL DEFAULT 'teorik',
    "sessionHours" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Schedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Schedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("classroomId", "courseId", "createdAt", "day", "id", "isHardcoded", "sessionType", "timeRange") SELECT "classroomId", "courseId", "createdAt", "day", "id", "isHardcoded", "sessionType", "timeRange" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
CREATE INDEX "Schedule_day_timeRange_idx" ON "Schedule"("day", "timeRange");
CREATE INDEX "Schedule_courseId_classroomId_idx" ON "Schedule"("courseId", "classroomId");
CREATE INDEX "Schedule_isHardcoded_idx" ON "Schedule"("isHardcoded");
CREATE INDEX "Schedule_day_idx" ON "Schedule"("day");
CREATE INDEX "Schedule_courseId_day_timeRange_idx" ON "Schedule"("courseId", "day", "timeRange");
CREATE INDEX "Schedule_classroomId_day_timeRange_idx" ON "Schedule"("classroomId", "day", "timeRange");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CourseDepartment_courseId_idx" ON "CourseDepartment"("courseId");

-- CreateIndex
CREATE INDEX "CourseSession_courseId_idx" ON "CourseSession"("courseId");

-- CreateIndex
CREATE INDEX "HardcodedSchedule_courseId_idx" ON "HardcodedSchedule"("courseId");

-- CreateIndex
CREATE INDEX "HardcodedSchedule_classroomId_idx" ON "HardcodedSchedule"("classroomId");

-- CreateIndex
CREATE INDEX "HardcodedSchedule_day_idx" ON "HardcodedSchedule"("day");
