import { db, prisma, isTurso } from './db';

// ==================== TEACHER ====================
export async function getAllTeachers() {
  if (isTurso && db) {
    const result = await db.execute('SELECT id, name, email, faculty, department, workingHours, isActive FROM Teacher ORDER BY name ASC');
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      email: row.email as string,
      faculty: row.faculty as string,
      department: row.department as string,
      working_hours: row.workingHours as string,
      is_active: Boolean(row.isActive),
    }));
  }
  const teachers = await prisma.teacher.findMany({ orderBy: { name: 'asc' } });
  return teachers.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    faculty: t.faculty,
    department: t.department,
    working_hours: t.workingHours,
    is_active: t.isActive,
  }));
}

export async function getTeacherById(id: number) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT * FROM Teacher WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      email: row.email as string,
      faculty: row.faculty as string,
      department: row.department as string,
      working_hours: row.workingHours as string,
      is_active: Boolean(row.isActive),
    };
  }
  const t = await prisma.teacher.findUnique({ where: { id } });
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    email: t.email,
    faculty: t.faculty,
    department: t.department,
    working_hours: t.workingHours,
    is_active: t.isActive,
  };
}

export async function findTeacherByEmail(email: string) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT id FROM Teacher WHERE email = ?', args: [email] });
    return result.rows.length > 0 ? result.rows[0] : null;
  }
  return prisma.teacher.findUnique({ where: { email } });
}

export async function createTeacher(data: { name: string; email: string; faculty: string; department: string; working_hours?: string }) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Teacher (name, email, faculty, department, workingHours, isActive) VALUES (?, ?, ?, ?, ?, 1)',
      args: [data.name, data.email, data.faculty, data.department, data.working_hours || '{}'],
    });
    return { id: Number(result.lastInsertRowid), ...data, is_active: true };
  }
  const t = await prisma.teacher.create({
    data: {
      name: data.name,
      email: data.email,
      faculty: data.faculty,
      department: data.department,
      workingHours: data.working_hours || '{}',
    },
  });
  return { id: t.id, name: t.name, email: t.email, faculty: t.faculty, department: t.department, working_hours: t.workingHours, is_active: t.isActive };
}

export async function updateTeacher(id: number, data: { name?: string; email?: string; faculty?: string; department?: string; working_hours?: string; is_active?: boolean }) {
  if (isTurso && db) {
    const sets: string[] = [];
    const args: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); args.push(data.name); }
    if (data.email !== undefined) { sets.push('email = ?'); args.push(data.email); }
    if (data.faculty !== undefined) { sets.push('faculty = ?'); args.push(data.faculty); }
    if (data.department !== undefined) { sets.push('department = ?'); args.push(data.department); }
    if (data.working_hours !== undefined) { sets.push('workingHours = ?'); args.push(data.working_hours); }
    if (data.is_active !== undefined) { sets.push('isActive = ?'); args.push(data.is_active ? 1 : 0); }
    args.push(id);
    await db.execute({ sql: `UPDATE Teacher SET ${sets.join(', ')} WHERE id = ?`, args });
    return getTeacherById(id);
  }
  const t = await prisma.teacher.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      faculty: data.faculty,
      department: data.department,
      workingHours: data.working_hours,
      isActive: data.is_active,
    },
  });
  return { id: t.id, name: t.name, email: t.email, faculty: t.faculty, department: t.department, working_hours: t.workingHours, is_active: t.isActive };
}

export async function deleteTeacher(id: number) {
  if (isTurso && db) {
    await db.execute({ sql: 'DELETE FROM Teacher WHERE id = ?', args: [id] });
    return true;
  }
  await prisma.teacher.delete({ where: { id } });
  return true;
}

// ==================== CLASSROOM ====================
export async function getAllClassrooms() {
  if (isTurso && db) {
    const result = await db.execute('SELECT id, name, capacity, type, faculty, department FROM Classroom ORDER BY name ASC');
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      capacity: row.capacity as number,
      type: row.type as string,
      faculty: row.faculty as string,
      department: row.department as string,
    }));
  }
  const classrooms = await prisma.classroom.findMany({ orderBy: { name: 'asc' } });
  return classrooms.map(c => ({
    id: c.id,
    name: c.name,
    capacity: c.capacity,
    type: c.type,
    faculty: c.faculty,
    department: c.department,
  }));
}

export async function getClassroomById(id: number) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT * FROM Classroom WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      capacity: row.capacity as number,
      type: row.type as string,
      faculty: row.faculty as string,
      department: row.department as string,
    };
  }
  const c = await prisma.classroom.findUnique({ where: { id } });
  if (!c) return null;
  return { id: c.id, name: c.name, capacity: c.capacity, type: c.type, faculty: c.faculty, department: c.department };
}

export async function findClassroomByNameAndDept(name: string, department: string) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT id FROM Classroom WHERE name = ? AND department = ?', args: [name, department] });
    return result.rows.length > 0 ? result.rows[0] : null;
  }
  return prisma.classroom.findFirst({ where: { name, department } });
}

export async function createClassroom(data: { name: string; capacity?: number; type?: string; faculty: string; department: string }) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Classroom (name, capacity, type, faculty, department) VALUES (?, ?, ?, ?, ?)',
      args: [data.name, data.capacity || 30, data.type || 'teorik', data.faculty, data.department],
    });
    return { id: Number(result.lastInsertRowid), name: data.name, capacity: data.capacity || 30, type: data.type || 'teorik', faculty: data.faculty, department: data.department };
  }
  const c = await prisma.classroom.create({ data: { name: data.name, capacity: data.capacity || 30, type: data.type || 'teorik', faculty: data.faculty, department: data.department } });
  return { id: c.id, name: c.name, capacity: c.capacity, type: c.type, faculty: c.faculty, department: c.department };
}

export async function updateClassroom(id: number, data: { name?: string; capacity?: number; type?: string; faculty?: string; department?: string }) {
  if (isTurso && db) {
    const sets: string[] = [];
    const args: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); args.push(data.name); }
    if (data.capacity !== undefined) { sets.push('capacity = ?'); args.push(data.capacity); }
    if (data.type !== undefined) { sets.push('type = ?'); args.push(data.type); }
    if (data.faculty !== undefined) { sets.push('faculty = ?'); args.push(data.faculty); }
    if (data.department !== undefined) { sets.push('department = ?'); args.push(data.department); }
    args.push(id);
    await db.execute({ sql: `UPDATE Classroom SET ${sets.join(', ')} WHERE id = ?`, args });
    return getClassroomById(id);
  }
  const c = await prisma.classroom.update({ where: { id }, data });
  return { id: c.id, name: c.name, capacity: c.capacity, type: c.type, faculty: c.faculty, department: c.department };
}

export async function deleteClassroom(id: number) {
  if (isTurso && db) {
    await db.execute({ sql: 'DELETE FROM Classroom WHERE id = ?', args: [id] });
    return true;
  }
  await prisma.classroom.delete({ where: { id } });
  return true;
}

// ==================== STATISTICS ====================
export async function getStatistics() {
  if (isTurso && db) {
    const [teachers, courses, classrooms, schedules] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM Teacher'),
      db.execute('SELECT COUNT(*) as count FROM Course'),
      db.execute('SELECT COUNT(*) as count FROM Classroom'),
      db.execute('SELECT COUNT(*) as count FROM Schedule'),
    ]);
    return {
      teacherCount: Number(teachers.rows[0].count),
      courseCount: Number(courses.rows[0].count),
      classroomCount: Number(classrooms.rows[0].count),
      scheduleCount: Number(schedules.rows[0].count),
    };
  }
  const [teacherCount, courseCount, classroomCount, scheduleCount] = await Promise.all([
    prisma.teacher.count(),
    prisma.course.count(),
    prisma.classroom.count(),
    prisma.schedule.count(),
  ]);
  return { teacherCount, courseCount, classroomCount, scheduleCount };
}

// ==================== COURSE ====================
export async function getAllCourses() {
  if (isTurso && db) {
    const courses = await db.execute(`
      SELECT c.*, t.id as teacherId, t.name as teacherName 
      FROM Course c 
      LEFT JOIN Teacher t ON c.teacherId = t.id 
      ORDER BY c.name ASC
    `);
    
    const courseIds = courses.rows.map(c => c.id);
    let sessions: any[] = [];
    let departments: any[] = [];
    
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const sessionsResult = await db.execute({
        sql: `SELECT * FROM CourseSession WHERE courseId IN (${placeholders})`,
        args: courseIds
      });
      const deptsResult = await db.execute({
        sql: `SELECT * FROM CourseDepartment WHERE courseId IN (${placeholders})`,
        args: courseIds
      });
      sessions = sessionsResult.rows;
      departments = deptsResult.rows;
    }
    
    return courses.rows.map(c => ({
      id: c.id as number,
      name: c.name as string,
      code: c.code as string,
      teacher_id: c.teacherId as number | null,
      faculty: c.faculty as string,
      level: c.level as string,
      category: c.category as string,
      semester: c.semester as string,
      ects: c.ects as number,
      total_hours: c.totalHours as number,
      is_active: Boolean(c.isActive),
      teacher: c.teacherId ? { id: c.teacherId as number, name: c.teacherName as string } : null,
      sessions: sessions.filter(s => s.courseId === c.id).map(s => ({ id: s.id, type: s.type, hours: s.hours })),
      departments: departments.filter(d => d.courseId === c.id).map(d => ({ id: d.id, department: d.department, student_count: d.studentCount })),
    }));
  }
  
  const courses = await prisma.course.findMany({
    include: { teacher: { select: { id: true, name: true } }, sessions: true, departments: true },
    orderBy: { name: 'asc' },
  });
  
  return courses.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    teacher_id: c.teacherId,
    faculty: c.faculty,
    level: c.level,
    category: c.category,
    semester: c.semester,
    ects: c.ects,
    total_hours: c.totalHours,
    is_active: c.isActive,
    teacher: c.teacher ? { id: c.teacher.id, name: c.teacher.name } : null,
    sessions: c.sessions.map(s => ({ id: s.id, type: s.type, hours: s.hours })),
    departments: c.departments.map(d => ({ id: d.id, department: d.department, student_count: d.studentCount })),
  }));
}

export async function getCourseById(id: number) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT c.*, t.name as teacherName FROM Course c LEFT JOIN Teacher t ON c.teacherId = t.id WHERE c.id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const c = result.rows[0];
    const sessions = await db.execute({ sql: 'SELECT * FROM CourseSession WHERE courseId = ?', args: [id] });
    const depts = await db.execute({ sql: 'SELECT * FROM CourseDepartment WHERE courseId = ?', args: [id] });
    return {
      id: c.id as number,
      name: c.name as string,
      code: c.code as string,
      teacher_id: c.teacherId as number | null,
      faculty: c.faculty as string,
      level: c.level as string,
      category: c.category as string,
      semester: c.semester as string,
      ects: c.ects as number,
      total_hours: c.totalHours as number,
      is_active: Boolean(c.isActive),
      teacher: c.teacherId ? { id: c.teacherId as number, name: c.teacherName as string } : null,
      sessions: sessions.rows.map(s => ({ id: s.id, type: s.type, hours: s.hours })),
      departments: depts.rows.map(d => ({ id: d.id, department: d.department, student_count: d.studentCount })),
    };
  }
  const c = await prisma.course.findUnique({
    where: { id },
    include: { teacher: { select: { id: true, name: true } }, sessions: true, departments: true },
  });
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    teacher_id: c.teacherId,
    faculty: c.faculty,
    level: c.level,
    category: c.category,
    semester: c.semester,
    ects: c.ects,
    total_hours: c.totalHours,
    is_active: c.isActive,
    teacher: c.teacher ? { id: c.teacher.id, name: c.teacher.name } : null,
    sessions: c.sessions.map(s => ({ id: s.id, type: s.type, hours: s.hours })),
    departments: c.departments.map(d => ({ id: d.id, department: d.department, student_count: d.studentCount })),
  };
}

export async function findCourseByCode(code: string) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT id FROM Course WHERE code = ?', args: [code] });
    return result.rows.length > 0 ? result.rows[0] : null;
  }
  return prisma.course.findUnique({ where: { code } });
}

export async function createCourse(data: any) {
  const totalHours = data.sessions?.reduce((sum: number, s: { hours: number }) => sum + s.hours, 0) || 2;
  
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Course (name, code, teacherId, faculty, level, category, semester, ects, totalHours, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [data.name, data.code, data.teacher_id || null, data.faculty, data.level || '1', data.category || 'zorunlu', data.semester || 'güz', data.ects || 3, totalHours, data.is_active !== false ? 1 : 0],
    });
    const courseId = Number(result.lastInsertRowid);
    
    // Insert sessions
    for (const s of (data.sessions || [])) {
      await db.execute({ sql: 'INSERT INTO CourseSession (courseId, type, hours) VALUES (?, ?, ?)', args: [courseId, s.type, s.hours] });
    }
    
    // Insert departments
    for (const d of (data.departments || [])) {
      await db.execute({ sql: 'INSERT INTO CourseDepartment (courseId, department, studentCount) VALUES (?, ?, ?)', args: [courseId, d.department, d.student_count || 0] });
    }
    
    return getCourseById(courseId);
  }
  
  const course = await prisma.course.create({
    data: {
      name: data.name,
      code: data.code,
      teacherId: data.teacher_id || null,
      faculty: data.faculty,
      level: data.level || '1',
      category: data.category || 'zorunlu',
      semester: data.semester || 'güz',
      ects: data.ects || 3,
      totalHours,
      isActive: data.is_active ?? true,
      sessions: { create: data.sessions?.map((s: any) => ({ type: s.type, hours: s.hours })) || [] },
      departments: { create: data.departments?.map((d: any) => ({ department: d.department, studentCount: d.student_count || 0 })) || [] },
    },
    include: { teacher: { select: { id: true, name: true } }, sessions: true, departments: true },
  });
  
  return {
    id: course.id,
    name: course.name,
    code: course.code,
    teacher_id: course.teacherId,
    faculty: course.faculty,
    level: course.level,
    category: course.category,
    semester: course.semester,
    ects: course.ects,
    total_hours: course.totalHours,
    is_active: course.isActive,
    teacher: course.teacher,
    sessions: course.sessions.map(s => ({ id: s.id, type: s.type, hours: s.hours })),
    departments: course.departments.map(d => ({ id: d.id, department: d.department, student_count: d.studentCount })),
  };
}

export async function updateCourse(id: number, data: any) {
  if (isTurso && db) {
    const sets: string[] = [];
    const args: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); args.push(data.name); }
    if (data.code !== undefined) { sets.push('code = ?'); args.push(data.code); }
    if (data.teacher_id !== undefined) { sets.push('teacherId = ?'); args.push(data.teacher_id); }
    if (data.faculty !== undefined) { sets.push('faculty = ?'); args.push(data.faculty); }
    if (data.level !== undefined) { sets.push('level = ?'); args.push(data.level); }
    if (data.category !== undefined) { sets.push('category = ?'); args.push(data.category); }
    if (data.semester !== undefined) { sets.push('semester = ?'); args.push(data.semester); }
    if (data.ects !== undefined) { sets.push('ects = ?'); args.push(data.ects); }
    if (data.is_active !== undefined) { sets.push('isActive = ?'); args.push(data.is_active ? 1 : 0); }
    
    if (data.sessions) {
      const totalHours = data.sessions.reduce((sum: number, s: { hours: number }) => sum + s.hours, 0);
      sets.push('totalHours = ?');
      args.push(totalHours);
    }
    
    if (sets.length > 0) {
      args.push(id);
      await db.execute({ sql: `UPDATE Course SET ${sets.join(', ')} WHERE id = ?`, args });
    }
    
    // Update sessions
    if (data.sessions) {
      await db.execute({ sql: 'DELETE FROM CourseSession WHERE courseId = ?', args: [id] });
      for (const s of data.sessions) {
        await db.execute({ sql: 'INSERT INTO CourseSession (courseId, type, hours) VALUES (?, ?, ?)', args: [id, s.type, s.hours] });
      }
    }
    
    // Update departments
    if (data.departments) {
      await db.execute({ sql: 'DELETE FROM CourseDepartment WHERE courseId = ?', args: [id] });
      for (const d of data.departments) {
        await db.execute({ sql: 'INSERT INTO CourseDepartment (courseId, department, studentCount) VALUES (?, ?, ?)', args: [id, d.department, d.student_count || 0] });
      }
    }
    
    return getCourseById(id);
  }
  
  const totalHours = data.sessions?.reduce((sum: number, s: { hours: number }) => sum + s.hours, 0);
  
  const course = await prisma.course.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      teacherId: data.teacher_id,
      faculty: data.faculty,
      level: data.level,
      category: data.category,
      semester: data.semester,
      ects: data.ects,
      totalHours: totalHours,
      isActive: data.is_active,
      sessions: data.sessions ? { deleteMany: {}, create: data.sessions.map((s: any) => ({ type: s.type, hours: s.hours })) } : undefined,
      departments: data.departments ? { deleteMany: {}, create: data.departments.map((d: any) => ({ department: d.department, studentCount: d.student_count || 0 })) } : undefined,
    },
    include: { teacher: { select: { id: true, name: true } }, sessions: true, departments: true },
  });
  
  return {
    id: course.id,
    name: course.name,
    code: course.code,
    teacher_id: course.teacherId,
    faculty: course.faculty,
    level: course.level,
    category: course.category,
    semester: course.semester,
    ects: course.ects,
    total_hours: course.totalHours,
    is_active: course.isActive,
    teacher: course.teacher,
    sessions: course.sessions.map(s => ({ id: s.id, type: s.type, hours: s.hours })),
    departments: course.departments.map(d => ({ id: d.id, department: d.department, student_count: d.studentCount })),
  };
}

export async function deleteCourse(id: number) {
  if (isTurso && db) {
    await db.execute({ sql: 'DELETE FROM CourseSession WHERE courseId = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM CourseDepartment WHERE courseId = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM Course WHERE id = ?', args: [id] });
    return true;
  }
  await prisma.course.delete({ where: { id } });
  return true;
}

// ==================== SCHEDULE ====================
export async function getAllSchedules() {
  if (isTurso && db) {
    const result = await db.execute(`
      SELECT s.*, c.code as courseCode, c.name as courseName, c.teacherId, t.name as teacherName, cr.name as classroomName
      FROM Schedule s
      LEFT JOIN Course c ON s.courseId = c.id
      LEFT JOIN Teacher t ON c.teacherId = t.id
      LEFT JOIN Classroom cr ON s.classroomId = cr.id
      ORDER BY s.day, s.timeRange
    `);
    return result.rows.map(row => ({
      id: row.id as number,
      day: row.day as string,
      time_range: row.timeRange as string,
      course: row.courseId ? {
        id: row.courseId as number,
        code: row.courseCode as string,
        name: row.courseName as string,
        teacher: row.teacherId ? { id: row.teacherId as number, name: row.teacherName as string } : null,
      } : null,
      classroom: row.classroomId ? { id: row.classroomId as number, name: row.classroomName as string } : null,
    }));
  }
  
  const schedules = await prisma.schedule.findMany({
    include: {
      course: { include: { teacher: { select: { id: true, name: true } } } },
      classroom: true,
    },
    orderBy: [{ day: 'asc' }, { timeRange: 'asc' }],
  });
  
  return schedules.map(s => ({
    id: s.id,
    day: s.day,
    time_range: s.timeRange,
    course: s.course ? {
      id: s.course.id,
      code: s.course.code,
      name: s.course.name,
      teacher: s.course.teacher ? { id: s.course.teacher.id, name: s.course.teacher.name } : null,
    } : null,
    classroom: s.classroom ? { id: s.classroom.id, name: s.classroom.name } : null,
  }));
}

export async function createSchedule(data: { day: string; time_range: string; course_id: number; classroom_id: number }) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Schedule (day, timeRange, courseId, classroomId) VALUES (?, ?, ?, ?)',
      args: [data.day, data.time_range, data.course_id, data.classroom_id],
    });
    return { id: Number(result.lastInsertRowid), day: data.day, time_range: data.time_range, course_id: data.course_id, classroom_id: data.classroom_id };
  }
  const s = await prisma.schedule.create({
    data: { day: data.day, timeRange: data.time_range, courseId: data.course_id, classroomId: data.classroom_id },
  });
  return { id: s.id, day: s.day, time_range: s.timeRange, course_id: s.courseId, classroom_id: s.classroomId };
}

export async function deleteSchedule(id: number) {
  if (isTurso && db) {
    await db.execute({ sql: 'DELETE FROM Schedule WHERE id = ?', args: [id] });
    return true;
  }
  await prisma.schedule.delete({ where: { id } });
  return true;
}

export async function deleteAllSchedules() {
  if (isTurso && db) {
    await db.execute('DELETE FROM Schedule');
    return true;
  }
  await prisma.schedule.deleteMany();
  return true;
}

export async function deleteSchedulesByDay(day: string) {
  if (isTurso && db) {
    await db.execute({ sql: 'DELETE FROM Schedule WHERE day = ?', args: [day] });
    return true;
  }
  await prisma.schedule.deleteMany({ where: { day } });
  return true;
}

export async function countSchedulesByClassroom(classroomId: number): Promise<number> {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT COUNT(*) as count FROM Schedule WHERE classroomId = ?', args: [classroomId] });
    return Number(result.rows[0].count);
  }
  return prisma.schedule.count({ where: { classroomId } });
}

export async function countSchedulesByCourse(courseId: number): Promise<number> {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT COUNT(*) as count FROM Schedule WHERE courseId = ?', args: [courseId] });
    return Number(result.rows[0].count);
  }
  return prisma.schedule.count({ where: { courseId } });
}

// ==================== SCHEDULER HELPERS ====================
export async function getActiveCoursesForScheduler() {
  if (isTurso && db) {
    const courses = await db.execute(`
      SELECT c.*, t.workingHours as teacherWorkingHours
      FROM Course c
      LEFT JOIN Teacher t ON c.teacherId = t.id
      WHERE c.isActive = 1
    `);
    
    const courseIds = courses.rows.map(c => c.id);
    let sessions: any[] = [];
    let departments: any[] = [];
    
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const sessionsResult = await db.execute({
        sql: `SELECT * FROM CourseSession WHERE courseId IN (${placeholders})`,
        args: courseIds
      });
      const deptsResult = await db.execute({
        sql: `SELECT * FROM CourseDepartment WHERE courseId IN (${placeholders})`,
        args: courseIds
      });
      sessions = sessionsResult.rows;
      departments = deptsResult.rows;
    }
    
    return courses.rows.map(c => ({
      id: c.id as number,
      name: c.name as string,
      code: c.code as string,
      teacherId: c.teacherId as number | null,
      faculty: c.faculty as string,
      level: c.level as string,
      totalHours: c.totalHours as number,
      sessions: sessions.filter(s => s.courseId === c.id).map(s => ({ type: s.type as string, hours: s.hours as number })),
      departments: departments.filter(d => d.courseId === c.id).map(d => ({ department: d.department as string, studentCount: d.studentCount as number })),
      teacherWorkingHours: c.teacherWorkingHours ? JSON.parse(c.teacherWorkingHours as string) : {},
    }));
  }
  
  const coursesRaw = await prisma.course.findMany({
    where: { isActive: true },
    include: { teacher: true, sessions: true, departments: true },
  });
  
  return coursesRaw.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    teacherId: c.teacherId,
    faculty: c.faculty,
    level: c.level,
    totalHours: c.totalHours,
    sessions: c.sessions.map(s => ({ type: s.type, hours: s.hours })),
    departments: c.departments.map(d => ({ department: d.department, studentCount: d.studentCount })),
    teacherWorkingHours: c.teacher ? JSON.parse(c.teacher.workingHours || '{}') : {},
  }));
}

export async function getAllClassroomsForScheduler() {
  if (isTurso && db) {
    const result = await db.execute('SELECT id, name, capacity, type FROM Classroom');
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      capacity: row.capacity as number,
      type: row.type as string,
    }));
  }
  const classrooms = await prisma.classroom.findMany();
  return classrooms.map(c => ({ id: c.id, name: c.name, capacity: c.capacity, type: c.type }));
}

export async function createManySchedules(schedules: { day: string; timeRange: string; courseId: number; classroomId: number }[]) {
  if (isTurso && db) {
    for (const s of schedules) {
      await db.execute({
        sql: 'INSERT INTO Schedule (day, timeRange, courseId, classroomId) VALUES (?, ?, ?, ?)',
        args: [s.day, s.timeRange, s.courseId, s.classroomId],
      });
    }
    return true;
  }
  await prisma.schedule.createMany({ data: schedules });
  return true;
}

export async function getSchedulerStatus() {
  if (isTurso && db) {
    const courses = await db.execute('SELECT id FROM Course WHERE isActive = 1');
    const courseIds = courses.rows.map(c => c.id);
    
    let totalActiveSessions = 0;
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const sessions = await db.execute({
        sql: `SELECT COUNT(*) as count FROM CourseSession WHERE courseId IN (${placeholders})`,
        args: courseIds
      });
      totalActiveSessions = Number(sessions.rows[0].count);
    }
    
    const scheduledSessions = await db.execute('SELECT COUNT(*) as count FROM Schedule');
    
    return {
      totalActiveCourses: courseIds.length,
      totalActiveSessions,
      scheduledSessions: Number(scheduledSessions.rows[0].count),
    };
  }
  
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: { sessions: true },
  });
  
  const totalActiveCourses = courses.length;
  const totalActiveSessions = courses.reduce((sum, c) => sum + c.sessions.length, 0);
  const scheduledSessions = await prisma.schedule.count();
  
  return { totalActiveCourses, totalActiveSessions, scheduledSessions };
}
