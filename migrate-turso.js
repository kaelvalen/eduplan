const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envLocal = path.resolve(__dirname, '.env.local');
const env = path.resolve(__dirname, '.env');

if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal });
    console.log('Loaded .env.local');
} else {
    dotenv.config({ path: env });
    console.log('Loaded .env');
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Turso credentials not found in env variables (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)');
    // If not found in env vars directly, try to parse from DATABASE_URL if it's a libsql url
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('libsql')) {
        console.log('Trying to use DATABASE_URL...');
        // Logic to parse auth token? Usually user sets distinct vars.
        // We will assume failure for now and ask user if needed.
    }
    process.exit(1);
}

const db = createClient({ url, authToken });

async function run() {
    console.log('Starting Turso schema migration...');

    // Helper to run safely
    const runSafe = async (query, label) => {
        try {
            await db.execute(query);
            console.log(`[SUCCESS] ${label}`);
        } catch (e) {
            if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
                console.log(`[SKIPPED] ${label} (Already exists)`);
            } else {
                console.log(`[ERROR] ${label}: ${e.message}`);
            }
        }
    };

    // Teacher
    await runSafe("ALTER TABLE Teacher ADD COLUMN title TEXT DEFAULT 'Öğr. Gör.'", 'Teacher.title');
    await runSafe("ALTER TABLE Teacher ADD COLUMN workingHours TEXT DEFAULT '{}'", 'Teacher.workingHours'); // Ensure exist

    // Classroom
    await runSafe("ALTER TABLE Classroom ADD COLUMN priorityDept TEXT", 'Classroom.priorityDept');
    await runSafe("ALTER TABLE Classroom ADD COLUMN availableHours TEXT DEFAULT '{}'", 'Classroom.availableHours');
    await runSafe("ALTER TABLE Classroom ADD COLUMN isActive BOOLEAN DEFAULT 1", 'Classroom.isActive');

    // Course
    await runSafe("ALTER TABLE Course ADD COLUMN capacityMargin INTEGER DEFAULT 0", 'Course.capacityMargin');
    // hardcodedSchedules is a table

    // Schedule
    await runSafe("ALTER TABLE Schedule ADD COLUMN isHardcoded BOOLEAN DEFAULT 0", 'Schedule.isHardcoded');
    await runSafe("ALTER TABLE Schedule ADD COLUMN sessionType TEXT DEFAULT 'teorik'", 'Schedule.sessionType');

    // New Tables
    await runSafe(`
    CREATE TABLE IF NOT EXISTS HardcodedSchedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        sessionType TEXT DEFAULT 'teorik',
        day TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        classroomId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE,
        FOREIGN KEY (classroomId) REFERENCES Classroom(id)
    )
  `, 'Create HardcodedSchedule Table');

    await runSafe(`
    CREATE TABLE IF NOT EXISTS SystemSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      capacityMarginEnabled BOOLEAN DEFAULT 0,
      capacityMarginPercent INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    )
  `, 'Create SystemSettings Table');

    console.log('Migration finished.');
}

run();
