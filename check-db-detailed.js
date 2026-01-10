const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envLocal = path.resolve(__dirname, '.env.local');
const env = path.resolve(__dirname, '.env');

if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal });
} else {
    dotenv.config({ path: env });
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Turso credentials not found');
    process.exit(1);
}

const db = createClient({ url, authToken });

async function run() {
    console.log('--- Checking Active Courses in DB ---');

    try {
        const courses = await db.execute("SELECT id, name, code, teacherId, isActive FROM Course WHERE isActive = 1");
        console.log(`Found ${courses.rows.length} active courses:`);

        for (const c of courses.rows) {
            console.log(`\nCourse: [${c.id}] ${c.code} - ${c.name}`);
            console.log(`Teacher ID: ${c.teacherId}`);

            const teacher = await db.execute({ sql: "SELECT name, workingHours FROM Teacher WHERE id = ?", args: [c.teacherId] });
            if (teacher.rows.length > 0) {
                console.log(`Teacher Name: ${teacher.rows[0].name}`);
                const wh = JSON.parse(teacher.rows[0].workingHours || '{}');
                console.log(`Teacher Avail Raw:`, JSON.stringify(wh, null, 2));
            } else {
                console.log('Teacher: NOT FOUND');
            }

            const sessions = await db.execute({ sql: "SELECT * FROM CourseSession WHERE courseId = ?", args: [c.id] });
            console.log(`Sessions (${sessions.rows.length}):`);
            sessions.rows.forEach(s => {
                console.log(`  - Type: ${s.type}, Hours: ${s.hours}`);
            });

            const totalHours = sessions.rows.reduce((sum, s) => sum + s.hours, 0);
            console.log(`Total Hours: ${totalHours}`);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
