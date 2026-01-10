const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
if (!process.env.TURSO_DATABASE_URL) {
    require('dotenv').config();
}

async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error('Turso credentials not found in .env');
        return;
    }

    const client = createClient({ url, authToken });

    console.log('Connected to Turso. Searching for teachers...');

    const result = await client.execute("SELECT * FROM Teacher WHERE name LIKE '%TEST%'");

    if (result.rows.length === 0) {
        console.log('No teacher found with name containing TEST');
        // List all just to be sure
        const all = await client.execute("SELECT id, name FROM Teacher LIMIT 5");
        console.log('First 5 teachers:', all.rows);
        return;
    }

    const teacher = result.rows[0];
    console.log('Teacher found:', teacher.id, teacher.name);

    // Get courses
    const coursesResult = await client.execute({
        sql: "SELECT * FROM Course WHERE teacherId = ?",
        args: [teacher.id]
    });
    console.log('Courses count:', coursesResult.rows.length);

    const courseIds = coursesResult.rows.map(c => c.id);

    if (courseIds.length > 0) {
        const placeholders = courseIds.map(() => '?').join(',');
        const scheduleResult = await client.execute({
            sql: `SELECT s.*, c.code, c.name FROM Schedule s JOIN Course c ON s.courseId = c.id WHERE s.courseId IN (${placeholders})`,
            args: courseIds
        });

        console.log('Schedules count:', scheduleResult.rows.length);
        scheduleResult.rows.slice(0, 5).forEach(s => {
            console.log(`- Day: "${s.day}", Time: "${s.timeRange}", Course: ${s.code}, Type: ${s.sessionType}`);
        });
    }
}

main().catch(console.error);
