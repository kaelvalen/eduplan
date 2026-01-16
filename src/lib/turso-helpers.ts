import { db, prisma, isTurso } from './db';

// ==================== TEACHER ====================
export async function getAllTeachers() {
  if (isTurso && db) {
    const result = await db.execute('SELECT id, name, email, title, faculty, department, workingHours, isActive FROM Teacher ORDER BY name ASC');
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      email: row.email as string,
      title: (row.title as string) || 'Öğr. Gör.',
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
    title: (t as any).title || 'Öğr. Gör.',
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
      title: (row.title as string) || 'Öğr. Gör.',
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
    title: (t as any).title || 'Öğr. Gör.',
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

export async function createTeacher(data: { name: string; email: string; title?: string; faculty: string; department: string; working_hours?: string; is_active?: boolean }) {
  const title = data.title || 'Öğr. Gör.';
  const isActive = data.is_active !== undefined ? data.is_active : true;

  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Teacher (name, email, title, faculty, department, workingHours, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [data.name, data.email, title, data.faculty, data.department, data.working_hours || '{}', isActive ? 1 : 0],
    });
    return { id: Number(result.lastInsertRowid), ...data, title, is_active: isActive };
  }
  // @ts-ignore - title field may not be in Prisma types until prisma generate
  const t = await prisma.teacher.create({
    data: {
      name: data.name,
      email: data.email,
      title: title,
      faculty: data.faculty,
      department: data.department,
      workingHours: data.working_hours || '{}',
      isActive: isActive,
    } as any,
  });
  return { id: t.id, name: t.name, email: t.email, title: (t as any).title || title, faculty: t.faculty, department: t.department, working_hours: t.workingHours, is_active: t.isActive };
}

export async function updateTeacher(id: number, data: { name?: string; email?: string; title?: string; faculty?: string; department?: string; working_hours?: string; is_active?: boolean }) {
  if (isTurso && db) {
    const sets: string[] = [];
    const args: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); args.push(data.name); }
    if (data.email !== undefined) { sets.push('email = ?'); args.push(data.email); }
    if (data.title !== undefined) { sets.push('title = ?'); args.push(data.title); }
    if (data.faculty !== undefined) { sets.push('faculty = ?'); args.push(data.faculty); }
    if (data.department !== undefined) { sets.push('department = ?'); args.push(data.department); }
    if (data.working_hours !== undefined) { sets.push('workingHours = ?'); args.push(data.working_hours); }
    if (data.is_active !== undefined) { sets.push('isActive = ?'); args.push(data.is_active ? 1 : 0); }
    args.push(id);
    if (sets.length > 0) {
      await db.execute({ sql: `UPDATE Teacher SET ${sets.join(', ')} WHERE id = ?`, args });
    }
    return getTeacherById(id);
  }
  const t = await prisma.teacher.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      title: data.title,
      faculty: data.faculty,
      department: data.department,
      workingHours: data.working_hours,
      isActive: data.is_active,
    } as any,
  });
  return { id: t.id, name: t.name, email: t.email, title: (t as any).title, faculty: t.faculty, department: t.department, working_hours: t.workingHours, is_active: t.isActive };
}

export async function deleteTeacher(id: number) {
  if (isTurso && db) {
    // First, set teacherId to NULL for any courses referencing this teacher
    await db.execute({ sql: 'UPDATE Course SET teacherId = NULL WHERE teacherId = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM Teacher WHERE id = ?', args: [id] });
    return true;
  }
  // First, disconnect courses from this teacher
  await prisma.course.updateMany({
    where: { teacherId: id },
    data: { teacherId: null },
  });
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

export async function createClassroom(data: { name: string; capacity?: number; type?: string; faculty: string; department: string; is_active?: boolean }) {
  const isActive = data.is_active !== undefined ? data.is_active : true;
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Classroom (name, capacity, type, faculty, department, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      args: [data.name, data.capacity || 30, data.type || 'teorik', data.faculty, data.department, isActive ? 1 : 0],
    });
    return { id: Number(result.lastInsertRowid), name: data.name, capacity: data.capacity || 30, type: data.type || 'teorik', faculty: data.faculty, department: data.department, is_active: isActive };
  }
  const c = await prisma.classroom.create({ data: { name: data.name, capacity: data.capacity || 30, type: data.type || 'teorik', faculty: data.faculty, department: data.department, isActive: isActive } as any });
  return { id: c.id, name: c.name, capacity: c.capacity, type: c.type, faculty: c.faculty, department: c.department, is_active: (c as any).isActive };
}

export async function updateClassroom(id: number, data: { name?: string; capacity?: number; type?: string; faculty?: string; department?: string; is_active?: boolean }) {
  if (isTurso && db) {
    const sets: string[] = [];
    const args: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); args.push(data.name); }
    if (data.capacity !== undefined) { sets.push('capacity = ?'); args.push(data.capacity); }
    if (data.type !== undefined) { sets.push('type = ?'); args.push(data.type); }
    if (data.faculty !== undefined) { sets.push('faculty = ?'); args.push(data.faculty); }
    if (data.department !== undefined) { sets.push('department = ?'); args.push(data.department); }
    if (data.is_active !== undefined) { sets.push('isActive = ?'); args.push(data.is_active ? 1 : 0); }
    args.push(id);
    if (sets.length > 0) {
      await db.execute({ sql: `UPDATE Classroom SET ${sets.join(', ')} WHERE id = ?`, args });
    }
    return getClassroomById(id);
  }
  // Prisma uses camelCase (isActive), so we need to convert
  const prismaData: any = {};
  if (data.name !== undefined) prismaData.name = data.name;
  if (data.capacity !== undefined) prismaData.capacity = data.capacity;
  if (data.type !== undefined) prismaData.type = data.type;
  if (data.faculty !== undefined) prismaData.faculty = data.faculty;
  if (data.department !== undefined) prismaData.department = data.department;
  if (data.is_active !== undefined) prismaData.isActive = data.is_active;
  
  const c = await prisma.classroom.update({ where: { id }, data: prismaData });
  return { id: c.id, name: c.name, capacity: c.capacity, type: c.type, faculty: c.faculty, department: c.department, is_active: (c as any).isActive };
}

export async function deleteClassroom(id: number) {
  if (isTurso && db) {
    // First, delete schedules and hardcoded schedules referencing this classroom
    await db.execute({ sql: 'DELETE FROM Schedule WHERE classroomId = ?', args: [id] });
    try {
      await db.execute({ sql: 'DELETE FROM HardcodedSchedule WHERE classroomId = ?', args: [id] });
    } catch { /* HardcodedSchedule table might not exist yet */ }
    await db.execute({ sql: 'DELETE FROM Classroom WHERE id = ?', args: [id] });
    return true;
  }
  // First, delete related schedules
  await prisma.schedule.deleteMany({ where: { classroomId: id } });
  try {
    // @ts-ignore - hardcodedSchedule might not exist in older schema
    await (prisma as any).hardcodedSchedule?.deleteMany({ where: { classroomId: id } });
  } catch { /* HardcodedSchedule model might not exist yet */ }
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
      capacity_margin: (c.capacityMargin as number) || 0,
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
    capacity_margin: c.capacityMargin || 0,
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
    const capacityMargin = data.capacity_margin !== undefined ? (Number(data.capacity_margin) || 0) : 0;
    const result = await db.execute({
      sql: 'INSERT INTO Course (name, code, teacherId, faculty, level, category, semester, ects, totalHours, capacityMargin, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [data.name, data.code, data.teacher_id || null, data.faculty, data.level || '1', data.category || 'zorunlu', data.semester || 'güz', data.ects || 3, totalHours, capacityMargin, data.is_active !== false ? 1 : 0],
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

  const capacityMargin = data.capacity_margin !== undefined ? (Number(data.capacity_margin) || 0) : 0;
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
      capacityMargin,
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

    if (data.capacity_margin !== undefined) {
      const capacityMargin = Number(data.capacity_margin) || 0;
      sets.push('capacityMargin = ?');
      args.push(capacityMargin);
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

  const updateData: any = {
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
  };

  // Only include capacityMargin if it's provided
  if (data.capacity_margin !== undefined) {
    updateData.capacityMargin = Number(data.capacity_margin) || 0;
  }

  const course = await prisma.course.update({
    where: { id },
    data: updateData,
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
      course_id: row.courseId as number,
      classroom_id: row.classroomId as number,
      session_type: row.sessionType as string,
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
    course_id: s.courseId,
    classroom_id: s.classroomId,
    session_type: (s as any).sessionType,
    course: s.course ? {
      id: s.course.id,
      code: s.course.code,
      name: s.course.name,
      teacher: s.course.teacher ? { id: s.course.teacher.id, name: s.course.teacher.name } : null,
    } : null,
    classroom: s.classroom ? { id: s.classroom.id, name: s.classroom.name } : null,
  }));
}

export async function createSchedule(data: { day: string; time_range: string; course_id: number; classroom_id: number; session_type?: string }) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'INSERT INTO Schedule (day, timeRange, courseId, classroomId, sessionType) VALUES (?, ?, ?, ?, ?)',
      args: [data.day, data.time_range, data.course_id, data.classroom_id, data.session_type || 'teorik'],
    });
    return {
      id: Number(result.lastInsertRowid),
      day: data.day,
      time_range: data.time_range,
      course_id: data.course_id,
      classroomId: data.classroom_id,
      session_type: data.session_type || 'teorik'
    };
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

export async function deleteNonHardcodedSchedules() {
  if (isTurso && db) {
    await db.execute('DELETE FROM Schedule WHERE isHardcoded = 0');
    return true;
  }
  await prisma.schedule.deleteMany({ where: { isHardcoded: false } as any });
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
// Get active courses for scheduler with full details
export async function getActiveCoursesForScheduler() {
  if (isTurso && db) {
    // Get courses
    const courses = await db.execute(`
      SELECT c.*, t.workingHours as teacherWorkingHours
      FROM Course c
      LEFT JOIN Teacher t ON c.teacherId = t.id
      WHERE c.isActive = 1
    `);

    const courseIds = courses.rows.map(c => c.id);
    let sessions: any[] = [];
    let departments: any[] = [];
    let hardcodedSchedules: any[] = [];

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

      // Try fetching hardcoded schedules (table might not exist yet)
      try {
        const hsResult = await db.execute({
          sql: `SELECT * FROM HardcodedSchedule WHERE courseId IN (${placeholders})`,
          args: courseIds
        });
        hardcodedSchedules = hsResult.rows;
      } catch (e) {
        // Table might not exist, ignore
      }

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
      category: (c.category as string) || 'zorunlu',
      semester: (c.semester as string) || 'güz',
      totalHours: c.totalHours as number,
      capacityMargin: (c.capacityMargin as number) || 0,
      sessions: sessions.filter(s => s.courseId === c.id).map(s => ({ type: s.type as string, hours: s.hours as number })),
      departments: departments.filter(d => d.courseId === c.id).map(d => ({ department: d.department as string, studentCount: d.studentCount as number })),
      teacherWorkingHours: c.teacherWorkingHours ? JSON.parse(c.teacherWorkingHours as string) : {},
      hardcodedSchedules: hardcodedSchedules.filter(hs => hs.courseId === c.id).map(hs => ({
        day: hs.day as string,
        startTime: hs.startTime as string,
        endTime: hs.endTime as string,
        sessionType: hs.sessionType as string,
        classroomId: hs.classroomId as number | null,
      })),
    }));
  }

  const coursesRaw = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      teacher: true,
      sessions: true,
      departments: true,
      // @ts-ignore - hardcodedSchedules might not be in Prisma types yet
      hardcodedSchedules: true,
    },
  });

  return coursesRaw.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    teacherId: c.teacherId,
    faculty: c.faculty,
    level: c.level,
    category: (c as any).category || 'zorunlu',
    semester: (c as any).semester || 'güz',
    totalHours: c.totalHours,
    capacityMargin: (c as any).capacityMargin || 0,
    sessions: (c as any).sessions.map((s: any) => ({ type: s.type, hours: s.hours })),
    departments: (c as any).departments.map((d: any) => ({ department: d.department, studentCount: d.studentCount })),
    teacherWorkingHours: (c as any).teacher ? JSON.parse((c as any).teacher.workingHours || '{}') : {},
    hardcodedSchedules: (c as any).hardcodedSchedules?.map((hs: any) => ({
      day: hs.day,
      startTime: hs.startTime,
      endTime: hs.endTime,
      sessionType: hs.sessionType,
      classroomId: hs.classroomId,
    })) || [],
  }));
}

export async function getAllClassroomsForScheduler() {
  if (isTurso && db) {
    const result = await db.execute('SELECT id, name, capacity, type, priorityDept, availableHours, isActive FROM Classroom WHERE isActive = 1');
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      capacity: row.capacity as number,
      type: row.type as string,
      priorityDept: row.priorityDept as string | null,
      availableHours: row.availableHours ? JSON.parse(row.availableHours as string) : {},
      isActive: Boolean(row.isActive),
    }));
  }
  // @ts-ignore - new fields might not be in Prisma types yet
  const classrooms = await prisma.classroom.findMany({ where: { isActive: true } as any });
  return classrooms.map(c => ({
    id: c.id,
    name: c.name,
    capacity: c.capacity,
    type: c.type,
    priorityDept: (c as any).priorityDept,
    availableHours: (c as any).availableHours ? JSON.parse((c as any).availableHours) : {},
    isActive: (c as any).isActive,
  }));
}

export async function createManySchedules(schedules: { day: string; timeRange: string; courseId: number; classroomId: number; sessionType?: string }[]) {
  if (isTurso && db) {
    for (const s of schedules) {
      await db.execute({
        sql: 'INSERT INTO Schedule (day, timeRange, courseId, classroomId, sessionType) VALUES (?, ?, ?, ?, ?)',
        args: [s.day, s.timeRange, s.courseId, s.classroomId, s.sessionType || 'teorik'],
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

export async function getTeacherSchedule(teacherId: number) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: `
        SELECT s.*, c.code as courseCode, c.name as courseName, c.teacherId, 
               cr.id as classroomId, cr.name as classroomName, cr.type as classroomType, cr.capacity as classroomCapacity
        FROM Schedule s
        JOIN Course c ON s.courseId = c.id
        LEFT JOIN Classroom cr ON s.classroomId = cr.id
        WHERE c.teacherId = ?
        ORDER BY s.day, s.timeRange
      `,
      args: [teacherId]
    });

    const coursesResult = await db.execute({
      sql: `SELECT * FROM Course WHERE teacherId = ?`,
      args: [teacherId]
    });

    const courseMap = new Map();
    for (const row of coursesResult.rows) {
      let studentCount = 0;
      try {
        // @ts-ignore
        const depts = typeof row.departments === 'string' ? JSON.parse(row.departments) : row.departments;
        if (Array.isArray(depts)) {
          studentCount = depts.reduce((acc: number, d: any) => acc + (d.studentCount || 0), 0);
        }
      } catch (e) { }
      courseMap.set(row.id, { ...row, studentCount });
    }

    return result.rows.map(row => {
      const course = courseMap.get(row.courseId);
      return {
        id: row.id as number,
        day: row.day as string,
        time_range: row.timeRange as string,
        is_hardcoded: Boolean(row.isHardcoded),
        session_type: row.sessionType as string,
        course: {
          id: row.courseId as number,
          code: row.courseCode as string,
          name: row.courseName as string,
          student_count: course?.studentCount || 0
        },
        classroom: row.classroomId ? {
          id: row.classroomId as number,
          name: row.classroomName as string,
          type: row.classroomType as string,
          capacity: row.classroomCapacity as number
        } : null,
      };
    });
  }

  // Prisma fallback
  const courses = await prisma.course.findMany({
    where: { teacherId },
    select: { id: true },
  });

  const courseIds = courses.map(c => c.id);

  const schedules = await prisma.schedule.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          departments: { select: { studentCount: true } }
        }
      },
      classroom: {
        select: {
          id: true,
          name: true,
          type: true,
          capacity: true
        }
      }
    },
    orderBy: [{ day: 'asc' }, { timeRange: 'asc' }]
  });

  return schedules.map(s => ({
    id: s.id,
    day: s.day,
    time_range: s.timeRange,
    // @ts-ignore
    is_hardcoded: s.isHardcoded,
    // @ts-ignore
    session_type: s.sessionType,
    course: s.course ? {
      id: s.course.id,
      name: s.course.name,
      code: s.course.code,
      // @ts-ignore
      student_count: s.course.departments?.reduce((acc: number, curr: any) => acc + curr.studentCount, 0) || 0
    } : null,
    classroom: s.classroom
  }));
}

export async function getClassroomSchedule(classroomId: number) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: `
        SELECT s.*, c.code as courseCode, c.name as courseName, c.teacherId, 
               t.name as teacherName, t.title as teacherTitle
        FROM Schedule s
        JOIN Course c ON s.courseId = c.id
        LEFT JOIN Teacher t ON c.teacherId = t.id
        WHERE s.classroomId = ?
        ORDER BY s.day, s.timeRange
      `,
      args: [classroomId]
    });

    const courseIds = [...new Set(result.rows.map(r => r.courseId as number))];
    const courseMap = new Map();

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const coursesResult = await db.execute({
        sql: `SELECT * FROM Course WHERE id IN (${placeholders})`,
        args: courseIds
      });

      for (const row of coursesResult.rows) {
        let studentCount = 0;
        try {
          // @ts-ignore
          const depts = typeof row.departments === 'string' ? JSON.parse(row.departments) : row.departments;
          if (Array.isArray(depts)) {
            studentCount = depts.reduce((acc: number, d: any) => acc + (d.studentCount || 0), 0);
          }
        } catch (e) { }
        courseMap.set(row.id, { ...row, studentCount });
      }
    }

    return result.rows.map(row => {
      const course = courseMap.get(row.courseId);
      return {
        id: row.id as number,
        day: row.day as string,
        time_range: row.timeRange as string,
        is_hardcoded: Boolean(row.isHardcoded),
        session_type: row.sessionType as string,
        course: {
          id: row.courseId as number,
          code: row.courseCode as string,
          name: row.courseName as string,
          student_count: course?.studentCount || 0,
          teacher: row.teacherId ? {
            id: row.teacherId as number,
            name: row.teacherName as string,
            title: row.teacherTitle as string
          } : null
        }
      };
    });
  }

  // Prisma Fallback
  const schedules = await prisma.schedule.findMany({
    where: { classroomId },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          teacher: {
            select: {
              id: true, name: true, // @ts-ignore 
              title: true
            }
          },
          departments: { select: { studentCount: true } }
        }
      }
    },
    orderBy: [{ day: 'asc' }, { timeRange: 'asc' }]
  });

  return schedules.map(s => {
    const sAny = s as any;
    return {
      id: s.id,
      day: s.day,
      time_range: s.timeRange,
      is_hardcoded: sAny.isHardcoded,
      session_type: sAny.sessionType,
      course: sAny.course ? {
        id: sAny.course.id,
        name: sAny.course.name,
        code: sAny.course.code,
        teacher: sAny.course.teacher,
        student_count: sAny.course.departments?.reduce((acc: number, curr: any) => acc + curr.studentCount, 0) || 0
      } : null
    };
  });
}

// ==================== NOTIFICATIONS ====================
export async function getAllNotifications(userId?: number) {
  if (isTurso && db) {
    const sql = userId
      ? 'SELECT * FROM Notification WHERE userId IS NULL OR userId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM Notification ORDER BY createdAt DESC';
    const args = userId ? [userId] : [];
    const result = await db.execute({ sql, args });
    return result.rows.map(row => ({
      id: row.id as number,
      title: row.title as string,
      message: row.message as string,
      type: row.type as string,
      category: row.category as string,
      userId: row.userId as number | undefined,
      isRead: Boolean(row.isRead),
      actionUrl: row.actionUrl as string | undefined,
      data: row.data as string | undefined,
      createdAt: row.createdAt as string,
      readAt: row.readAt as string | undefined,
    }));
  }
  const where = userId ? { OR: [{ userId: null }, { userId }] } : {};
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  return notifications;
}

export async function getNotificationById(id: number) {
  if (isTurso && db) {
    const result = await db.execute({ sql: 'SELECT * FROM Notification WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      title: row.title as string,
      message: row.message as string,
      type: row.type as string,
      category: row.category as string,
      userId: row.userId as number | undefined,
      isRead: Boolean(row.isRead),
      actionUrl: row.actionUrl as string | undefined,
      data: row.data as string | undefined,
      createdAt: row.createdAt as string,
      readAt: row.readAt as string | undefined,
    };
  }
  return await prisma.notification.findUnique({ where: { id } });
}

export async function createNotification(data: {
  title: string;
  message: string;
  type?: string;
  category?: string;
  userId?: number;
  actionUrl?: string;
  data?: string;
}) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: `INSERT INTO Notification (title, message, type, category, userId, actionUrl, data)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        data.title,
        data.message,
        data.type || 'info',
        data.category || 'general',
        data.userId || null,
        data.actionUrl || null,
        data.data || null
      ]
    });
    const row = result.rows[0];
    return {
      id: row.id as number,
      title: row.title as string,
      message: row.message as string,
      type: row.type as string,
      category: row.category as string,
      userId: row.userId as number | undefined,
      isRead: Boolean(row.isRead),
      actionUrl: row.actionUrl as string | undefined,
      data: row.data as string | undefined,
      createdAt: row.createdAt as string,
      readAt: row.readAt as string | undefined,
    };
  }
  return await prisma.notification.create({ data });
}

export async function markNotificationAsRead(id: number) {
  if (isTurso && db) {
    await db.execute({
      sql: 'UPDATE Notification SET isRead = true, readAt = CURRENT_TIMESTAMP WHERE id = ?',
      args: [id]
    });
    return true;
  }
  await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() }
  });
  return true;
}

export async function deleteNotification(id: number) {
  if (isTurso && db) {
    await db.execute({ sql: 'DELETE FROM Notification WHERE id = ?', args: [id] });
    return true;
  }
  await prisma.notification.delete({ where: { id } });
  return true;
}

// ==================== SYSTEM NOTIFICATIONS ====================
// Helper function to create system notifications
export async function createSystemNotification(
  title: string,
  message: string,
  options: {
    type?: 'info' | 'success' | 'warning' | 'error';
    category?: 'schedule' | 'teacher' | 'course' | 'classroom' | 'general';
    userId?: number; // If not provided, sends to all users
    actionUrl?: string;
    data?: any;
    sendPush?: boolean; // Whether to send push notification
  } = {}
) {
  try {
    const notification = await createNotification({
      title,
      message,
      type: options.type || 'info',
      category: options.category || 'general',
      userId: options.userId,
      actionUrl: options.actionUrl,
      data: options.data ? JSON.stringify(options.data) : undefined,
    });

    // Import here to avoid circular dependency
    const { sendPushNotification, broadcastPushNotification } = await import('../app/api/push/route');

    // Send push notification if requested
    if (options.sendPush !== false) { // Default to true
      if (options.userId) {
        await sendPushNotification(options.userId, title, message, {
          type: options.type || 'info',
          category: options.category || 'general',
          actionUrl: options.actionUrl,
          ...options.data
        });
      } else {
        await broadcastPushNotification(title, message, {
          type: options.type || 'info',
          category: options.category || 'general',
          actionUrl: options.actionUrl,
          ...options.data
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
}

// ==================== USER DASHBOARD PREFERENCES ====================
export async function getUserDashboardPreference(userId: number) {
  if (isTurso && db) {
    const result = await db.execute({
      sql: 'SELECT * FROM UserDashboardPreference WHERE userId = ?',
      args: [userId]
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      userId: row.userId as number,
      widgets: JSON.parse(row.widgets as string),
      layout: JSON.parse(row.layout as string),
      theme: row.theme as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
  const preference = await prisma.userDashboardPreference.findUnique({
    where: { userId }
  });
  if (!preference) return null;
  return {
    ...preference,
    widgets: JSON.parse(preference.widgets),
    layout: JSON.parse(preference.layout),
  };
}

export async function createOrUpdateUserDashboardPreference(data: {
  userId: number;
  widgets?: any[];
  layout?: any;
  theme?: string;
}) {
  const existing = await getUserDashboardPreference(data.userId);

  const preferenceData = {
    widgets: JSON.stringify(data.widgets || []),
    layout: JSON.stringify(data.layout || {}),
    theme: data.theme || 'default',
  };

  if (isTurso && db) {
    if (existing) {
      const result = await db.execute({
        sql: 'UPDATE UserDashboardPreference SET widgets = ?, layout = ?, theme = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? RETURNING *',
        args: [preferenceData.widgets, preferenceData.layout, preferenceData.theme, data.userId]
      });
      const row = result.rows[0];
      return {
        id: row.id as number,
        userId: row.userId as number,
        widgets: JSON.parse(row.widgets as string),
        layout: JSON.parse(row.layout as string),
        theme: row.theme as string,
        createdAt: row.createdAt as string,
        updatedAt: row.updatedAt as string,
      };
    } else {
      const result = await db.execute({
        sql: 'INSERT INTO UserDashboardPreference (userId, widgets, layout, theme) VALUES (?, ?, ?, ?) RETURNING *',
        args: [data.userId, preferenceData.widgets, preferenceData.layout, preferenceData.theme]
      });
      const row = result.rows[0];
      return {
        id: row.id as number,
        userId: row.userId as number,
        widgets: JSON.parse(row.widgets as string),
        layout: JSON.parse(row.layout as string),
        theme: row.theme as string,
        createdAt: row.createdAt as string,
        updatedAt: row.updatedAt as string,
      };
    }
  }

  if (existing) {
    const updated = await prisma.userDashboardPreference.update({
      where: { userId: data.userId },
      data: { ...preferenceData, updatedAt: new Date() }
    });
    return {
      ...updated,
      widgets: JSON.parse(updated.widgets),
      layout: JSON.parse(updated.layout),
    };
  } else {
    const created = await prisma.userDashboardPreference.create({
      data: { ...preferenceData, userId: data.userId }
    });
    return {
      ...created,
      widgets: JSON.parse(created.widgets),
      layout: JSON.parse(created.layout),
    };
  }
}