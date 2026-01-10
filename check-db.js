const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const courses = await prisma.course.count();
        const activeCourses = await prisma.course.count({ where: { isActive: true } });
        console.log(`Total Courses: ${courses}`);
        console.log(`Active Courses: ${activeCourses}`);
    } catch (e) {
        console.error(e);
    }
}

main();
