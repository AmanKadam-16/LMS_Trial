import { 
  users, type User, type InsertUser,
  tenants, type Tenant, type InsertTenant,
  courses, type Course, type InsertCourse,
  modules, type Module, type InsertModule,
  lessons, type Lesson, type InsertLesson,
  enrollments, type Enrollment, type InsertEnrollment,
  exams, type Exam, type InsertExam,
  questions, type Question, type InsertQuestion,
  examAttempts, type ExamAttempt, type InsertExamAttempt,
  activityLogs, type ActivityLog, type InsertActivityLog,
  batches, type Batch, type InsertBatch,
  batchEnrollments, type BatchEnrollment, type InsertBatchEnrollment,
  lessonProgress, type LessonProgress, type InsertLessonProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, sql, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUsersByTenant(tenantId: number): Promise<User[]>;
  getUserCount(): Promise<number>;
  
  // Tenant operations
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByTenant(tenantId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Module operations
  getModule(id: number): Promise<Module | undefined>;
  getModulesByCourse(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;
  
  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByModule(moduleId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  // Lesson Progress operations
  getLessonProgress(userId: number, lessonId: number): Promise<LessonProgress | undefined>;
  getLessonProgressByUser(userId: number): Promise<LessonProgress[]>;
  getLessonProgressByCourse(userId: number, courseId: number): Promise<LessonProgress[]>;
  createLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;
  updateCourseProgress(userId: number, courseId: number): Promise<number>;
  
  // Exam operations
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByCourse(courseId: number): Promise<Exam[]>;
  getExamsByTenant(tenantId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Question operations
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Exam attempt operations
  getExamAttempt(id: number): Promise<ExamAttempt | undefined>;
  getExamAttemptsByUser(userId: number): Promise<ExamAttempt[]>;
  getExamAttemptsByExam(examId: number): Promise<ExamAttempt[]>;
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  updateExamAttempt(id: number, attempt: Partial<ExamAttempt>): Promise<ExamAttempt | undefined>;
  getAllExamAttemptsForAdmin(tenantId: number): Promise<any[]>;
  gradeExamAttempt(attemptId: number, feedback: string, tenantId: number): Promise<ExamAttempt>;
  getStudentExamResults(userId: number): Promise<any[]>;
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  getActivityLogsByTenant(tenantId: number): Promise<ActivityLog[]>;
  
  // Batch operations
  getBatch(id: number): Promise<Batch | undefined>;
  getBatchesByTenant(tenantId: number): Promise<Batch[]>;
  getBatchesByCourse(courseId: number): Promise<Batch[]>;
  getBatchesByTrainer(trainerId: number): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, batch: Partial<Batch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<boolean>;
  
  // Batch enrollment operations
  getBatchEnrollment(id: number): Promise<BatchEnrollment | undefined>;
  getBatchEnrollmentsByBatch(batchId: number): Promise<BatchEnrollment[]>;
  getBatchEnrollmentsByUser(userId: number): Promise<BatchEnrollment[]>;
  createBatchEnrollment(enrollment: InsertBatchEnrollment): Promise<BatchEnrollment>;
  createBatchEnrollmentsBulk(enrollments: InsertBatchEnrollment[]): Promise<BatchEnrollment[]>;
  updateBatchEnrollment(id: number, enrollment: Partial<BatchEnrollment>): Promise<BatchEnrollment | undefined>;
  deleteBatchEnrollment(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Check if there's already a default tenant, create one if not
    this.initDefaultTenant();
  }
  
  private async initDefaultTenant() {
    const defaultTenant = await this.getTenantBySubdomain("central");
    if (!defaultTenant) {
      await this.createTenant({
        name: "Central University",
        subdomain: "central"
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getUsersByTenant(tenantId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0]?.count || 0);
  }
  
  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }
  
  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return tenant;
  }
  
  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }
  
  async getCoursesByTenant(tenantId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.tenantId, tenantId));
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }
  
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Module operations
  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }
  
  async getModulesByCourse(courseId: number): Promise<Module[]> {
    return await db.select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.order));
  }
  
  async createModule(insertModule: InsertModule): Promise<Module> {
    const [module] = await db.insert(modules).values(insertModule).returning();
    return module;
  }
  
  async updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined> {
    const [updatedModule] = await db.update(modules)
      .set(moduleData)
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }
  
  async deleteModule(id: number): Promise<boolean> {
    const result = await db.delete(modules).where(eq(modules.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }
  
  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return await db.select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(asc(lessons.order));
  }
  
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(insertLesson).returning();
    return lesson;
  }
  
  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | undefined> {
    const [updatedLesson] = await db.update(lessons)
      .set(lessonData)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }
  
  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }
  
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }
  
  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }
  
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const enrollmentWithDefaults = {
      ...insertEnrollment,
      enrolledAt: new Date(),
      progress: 0
    };
    
    const [enrollment] = await db.insert(enrollments)
      .values(enrollmentWithDefaults)
      .returning();
    return enrollment;
  }
  
  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const [updatedEnrollment] = await db.update(enrollments)
      .set(enrollmentData)
      .where(eq(enrollments.id, id))
      .returning();
    return updatedEnrollment;
  }
  
  // Lesson Progress operations
  async getLessonProgress(userId: number, lessonId: number): Promise<LessonProgress | undefined> {
    const [progress] = await db.select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId)
        )
      );
    return progress;
  }
  
  async getLessonProgressByUser(userId: number): Promise<LessonProgress[]> {
    return await db.select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId));
  }
  
  async getLessonProgressByCourse(userId: number, courseId: number): Promise<LessonProgress[]> {
    return await db.select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.courseId, courseId)
        )
      );
  }
  
  async createLessonProgress(progressData: InsertLessonProgress): Promise<LessonProgress> {
    const [progress] = await db.insert(lessonProgress)
      .values(progressData)
      .returning();
    
    // After creating a lesson progress entry, update the course progress
    await this.updateCourseProgress(progressData.userId, progressData.courseId);
    
    return progress;
  }
  
  async updateCourseProgress(userId: number, courseId: number): Promise<number> {
    // Get all modules in the course
    const modulesList = await this.getModulesByCourse(courseId);
    
    // If there are no modules, there can't be any progress
    if (modulesList.length === 0) {
      return 0;
    }
    
    // Get all lessons in all modules
    const allLessons: Lesson[] = [];
    for (const module of modulesList) {
      const moduleLessons = await this.getLessonsByModule(module.id);
      allLessons.push(...moduleLessons);
    }
    
    // If there are no lessons, there can't be any progress
    if (allLessons.length === 0) {
      return 0;
    }
    
    // Get all completed lessons for this user and course
    const completedLessons = await this.getLessonProgressByCourse(userId, courseId);
    
    // Calculate progress as a percentage
    const totalRequiredLessons = allLessons.filter(lesson => lesson.isRequired).length || allLessons.length;
    const completedCount = completedLessons.length;
    
    const progressPercentage = Math.round((completedCount / totalRequiredLessons) * 100);
    
    // Find the enrollment for this user and course
    const enrollmentList = await this.getEnrollmentsByUser(userId);
    const enrollment = enrollmentList.find(e => e.courseId === courseId);
    
    if (enrollment) {
      // Update the enrollment progress
      await this.updateEnrollment(enrollment.id, { 
        progress: progressPercentage,
        completedAt: progressPercentage === 100 ? new Date() : null 
      });
    }
    
    return progressPercentage;
  }
  
  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }
  
  async getExamsByCourse(courseId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.courseId, courseId));
  }
  
  async getExamsByTenant(tenantId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.tenantId, tenantId));
  }
  
  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db.insert(exams).values(insertExam).returning();
    return exam;
  }
  
  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const [updatedExam] = await db.update(exams)
      .set(examData)
      .where(eq(exams.id, id))
      .returning();
    return updatedExam;
  }
  
  async deleteExam(id: number): Promise<boolean> {
    const result = await db.delete(exams).where(eq(exams.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }
  
  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(asc(questions.order));
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }
  
  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question | undefined> {
    const [updatedQuestion] = await db.update(questions)
      .set(questionData)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Exam attempt operations
  async getExamAttempt(id: number): Promise<ExamAttempt | undefined> {
    const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return attempt;
  }
  
  async getExamAttemptsByUser(userId: number): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.userId, userId));
  }
  
  async getExamAttemptsByExam(examId: number): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.examId, examId));
  }
  
  async createExamAttempt(insertAttempt: InsertExamAttempt): Promise<ExamAttempt> {
    const attemptWithDefaults = {
      ...insertAttempt,
      startedAt: new Date()
    };
    
    const [attempt] = await db.insert(examAttempts)
      .values(attemptWithDefaults)
      .returning();
    return attempt;
  }
  
  async updateExamAttempt(id: number, attemptData: Partial<ExamAttempt>): Promise<ExamAttempt | undefined> {
    const [updatedAttempt] = await db.update(examAttempts)
      .set(attemptData)
      .where(eq(examAttempts.id, id))
      .returning();
    return updatedAttempt;
  }

  async getAllExamAttemptsForAdmin(tenantId: number): Promise<any[]> {
    const attempts = await db.select({
      id: examAttempts.id,
      userId: examAttempts.userId,
      examId: examAttempts.examId,
      startedAt: examAttempts.startedAt,
      completedAt: examAttempts.completedAt,
      answers: examAttempts.answers,
      feedback: examAttempts.feedback,
      reviewedAt: examAttempts.reviewedAt,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      username: users.username,
      examTitle: exams.title,
      examDescription: exams.description
    })
    .from(examAttempts)
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(and(
      eq(users.tenantId, tenantId),
      eq(exams.tenantId, tenantId)
    ))
    .orderBy(desc(examAttempts.startedAt));

    return attempts.map(attempt => ({
      id: attempt.id,
      userId: attempt.userId,
      examId: attempt.examId,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      answers: attempt.answers,
      feedback: attempt.feedback,
      reviewedAt: attempt.reviewedAt,
      user: {
        id: attempt.userId,
        username: attempt.username,
        firstName: attempt.userFirstName,
        lastName: attempt.userLastName
      },
      exam: {
        id: attempt.examId,
        title: attempt.examTitle,
        description: attempt.examDescription
      }
    }));
  }

  async gradeExamAttempt(attemptId: number, feedback: string, tenantId: number): Promise<ExamAttempt> {
    // First verify the attempt exists and belongs to the correct tenant
    const attempt = await db.select({
      attemptId: examAttempts.id,
      examId: examAttempts.examId,
      examTenantId: exams.tenantId
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.id, attemptId));

    if (!attempt.length || attempt[0].examTenantId !== tenantId) {
      throw new Error("Exam attempt not found or access denied");
    }

    const [updatedAttempt] = await db.update(examAttempts)
      .set({
        feedback,
        reviewedAt: new Date()
      })
      .where(eq(examAttempts.id, attemptId))
      .returning();
    
    return updatedAttempt;
  }

  async getStudentExamResults(userId: number): Promise<any[]> {
    const results = await db.select({
      id: examAttempts.id,
      userId: examAttempts.userId,
      examId: examAttempts.examId,
      startedAt: examAttempts.startedAt,
      completedAt: examAttempts.completedAt,
      answers: examAttempts.answers,
      feedback: examAttempts.feedback,
      reviewedAt: examAttempts.reviewedAt,
      examTitle: exams.title,
      examDescription: exams.description
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.userId, userId))
    .orderBy(desc(examAttempts.startedAt));

    return results.map(result => ({
      id: result.id,
      userId: result.userId,
      examId: result.examId,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      answers: result.answers,
      feedback: result.feedback,
      reviewedAt: result.reviewedAt,
      exam: {
        id: result.examId,
        title: result.examTitle,
        description: result.examDescription
      }
    }));
  }
  
  // Lesson Progress operations
  async getLessonProgress(userId: number, lessonId: number): Promise<LessonProgress | undefined> {
    const [progress] = await db.select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId)
        )
      );
    return progress;
  }
  
  async getLessonProgressByUser(userId: number): Promise<LessonProgress[]> {
    return await db.select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId));
  }
  
  async getLessonProgressByCourse(userId: number, courseId: number): Promise<LessonProgress[]> {
    return await db.select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.courseId, courseId)
        )
      );
  }
  
  async createLessonProgress(insertProgress: InsertLessonProgress): Promise<LessonProgress> {
    // First check if progress already exists
    const existingProgress = await this.getLessonProgress(
      insertProgress.userId,
      insertProgress.lessonId
    );
    
    if (existingProgress) {
      return existingProgress;
    }
    
    const [progress] = await db.insert(lessonProgress)
      .values([{ ...insertProgress, completed: true }])
      .returning();
    
    // Update course progress percentage
    await this.updateCourseProgress(insertProgress.userId, insertProgress.courseId);
    
    return progress;
  }
  
  async updateCourseProgress(userId: number, courseId: number): Promise<number> {
    // Get all modules in the course
    const modules = await this.getModulesByCourse(courseId);
    
    // If there are no modules, there can't be any progress
    if (modules.length === 0) {
      return 0;
    }
    
    // Get all lessons in all modules
    let allLessons: Lesson[] = [];
    for (const module of modules) {
      const lessons = await this.getLessonsByModule(module.id);
      allLessons = [...allLessons, ...lessons];
    }
    
    // If there are no lessons, there can't be any progress
    if (allLessons.length === 0) {
      return 0;
    }
    
    // Get all completed lessons for this user and course
    const completedLessons = await this.getLessonProgressByCourse(userId, courseId);
    
    // Calculate progress as a percentage
    const totalRequiredLessons = allLessons.filter(lesson => lesson.isRequired).length || allLessons.length;
    const completedCount = completedLessons.length;
    
    const progressPercentage = Math.round((completedCount / totalRequiredLessons) * 100);
    
    // Find the enrollment for this user and course
    const enrollments = await this.getEnrollmentsByUser(userId);
    const enrollment = enrollments.find(e => e.courseId === courseId);
    
    if (enrollment) {
      // Update the enrollment progress
      await this.updateEnrollment(enrollment.id, { 
        progress: progressPercentage,
        completedAt: progressPercentage === 100 ? new Date() : null 
      });
    }
    
    return progressPercentage;
  }
  
  // Activity log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const logWithTimestamp = {
      ...insertLog,
      timestamp: new Date()
    };
    
    const [log] = await db.insert(activityLogs)
      .values(logWithTimestamp)
      .returning();
    return log;
  }
  
  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }
  
  async getActivityLogsByTenant(tenantId: number): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.tenantId, tenantId))
      .orderBy(desc(activityLogs.timestamp));
  }
  
  // Batch operations
  async getBatch(id: number): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }
  
  async getBatchesByTenant(tenantId: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.tenantId, tenantId));
  }
  
  async getBatchesByCourse(courseId: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.courseId, courseId));
  }
  
  async getBatchesByTrainer(trainerId: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.trainerId, trainerId));
  }
  
  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    // Generate a unique batch code if one is not provided
    if (!insertBatch.batchCode) {
      const timestamp = Date.now().toString().slice(-6);
      const courseCode = insertBatch.courseId.toString().padStart(3, '0');
      insertBatch.batchCode = `B${courseCode}${timestamp}`;
    }
    
    // Create a proper object for insertion (not an array)
    // Convert startDate to string format if it's a Date object
    const startDateValue = insertBatch.startDate instanceof Date 
      ? insertBatch.startDate.toISOString().split('T')[0] 
      : insertBatch.startDate;
      
    const batchData = {
      name: insertBatch.name,
      batchCode: insertBatch.batchCode,
      courseId: insertBatch.courseId,
      trainerId: insertBatch.trainerId,
      startDate: startDateValue,
      batchTime: insertBatch.batchTime,
      tenantId: insertBatch.tenantId,
      createdBy: insertBatch.createdBy,
      description: insertBatch.description,
      maxStudents: insertBatch.maxStudents,
      isActive: insertBatch.isActive !== undefined ? insertBatch.isActive : true
    };
    
    const [batch] = await db.insert(batches).values([batchData]).returning();
    return batch;
  }
  
  async updateBatch(id: number, batchData: Partial<Batch>): Promise<Batch | undefined> {
    const [updatedBatch] = await db.update(batches)
      .set(batchData)
      .where(eq(batches.id, id))
      .returning();
    return updatedBatch;
  }
  
  async deleteBatch(id: number): Promise<boolean> {
    const result = await db.delete(batches).where(eq(batches.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Batch enrollment operations
  async getBatchEnrollment(id: number): Promise<BatchEnrollment | undefined> {
    const [enrollment] = await db.select().from(batchEnrollments).where(eq(batchEnrollments.id, id));
    return enrollment;
  }
  
  async getBatchEnrollmentsByBatch(batchId: number): Promise<BatchEnrollment[]> {
    return await db.select().from(batchEnrollments).where(eq(batchEnrollments.batchId, batchId));
  }
  
  async getBatchEnrollmentsByUser(userId: number): Promise<BatchEnrollment[]> {
    return await db.select().from(batchEnrollments).where(eq(batchEnrollments.userId, userId));
  }
  
  async createBatchEnrollment(insertEnrollment: InsertBatchEnrollment): Promise<BatchEnrollment> {
    const [enrollment] = await db.insert(batchEnrollments).values([insertEnrollment]).returning();
    
    // Also create a course enrollment since students in batches must be enrolled in the batch's course
    const batch = await this.getBatch(insertEnrollment.batchId);
    if (batch) {
      await this.createEnrollment({
        userId: insertEnrollment.userId,
        courseId: batch.courseId
      });
    }
    
    return enrollment;
  }
  
  async createBatchEnrollmentsBulk(enrollments: InsertBatchEnrollment[]): Promise<BatchEnrollment[]> {
    if (enrollments.length === 0) return [];
    
    const result = await db.insert(batchEnrollments).values(enrollments).returning();
    
    // Also create course enrollments for all students
    const batchId = enrollments[0].batchId;
    const batch = await this.getBatch(batchId);
    
    if (batch) {
      const courseEnrollments = enrollments.map(enrollment => ({
        userId: enrollment.userId,
        courseId: batch.courseId
      }));
      
      // Create course enrollments in bulk - note: we could optimize this with a proper batch insert
      await Promise.all(courseEnrollments.map(enrollment => this.createEnrollment(enrollment)));
    }
    
    return result;
  }
  
  async updateBatchEnrollment(id: number, enrollmentData: Partial<BatchEnrollment>): Promise<BatchEnrollment | undefined> {
    const [updatedEnrollment] = await db.update(batchEnrollments)
      .set(enrollmentData)
      .where(eq(batchEnrollments.id, id))
      .returning();
    return updatedEnrollment;
  }
  
  async deleteBatchEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(batchEnrollments).where(eq(batchEnrollments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

// For backward compatibility, we keep the MemStorage class definition
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private lessonProgressStore: LessonProgress[] = [];
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
  
  // Lesson Progress operations
  async getLessonProgress(userId: number, lessonId: number): Promise<LessonProgress | undefined> {
    return this.lessonProgressStore.find(
      progress => progress.userId === userId && progress.lessonId === lessonId
    );
  }
  
  async getLessonProgressByUser(userId: number): Promise<LessonProgress[]> {
    return this.lessonProgressStore.filter(progress => progress.userId === userId);
  }
  
  async getLessonProgressByCourse(userId: number, courseId: number): Promise<LessonProgress[]> {
    return this.lessonProgressStore.filter(
      progress => progress.userId === userId && progress.courseId === courseId
    );
  }
  
  async createLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const id = this.lessonProgressStore.length + 1;
    const completedAt = new Date();
    const newProgress: LessonProgress = {
      id,
      ...progress,
      completed: true, // Ensure completed is always set to true
      completedAt
    };
    
    this.lessonProgressStore.push(newProgress);
    
    // Update course progress
    await this.updateCourseProgress(progress.userId, progress.courseId);
    
    return newProgress;
  }
  
  async updateCourseProgress(userId: number, courseId: number): Promise<number> {
    // Get all modules in the course
    const modulesList = await this.getModulesByCourse(courseId);
    
    // If there are no modules, there can't be any progress
    if (modulesList.length === 0) {
      return 0;
    }
    
    // Get all lessons in all modules
    const allLessons: Lesson[] = [];
    for (const module of modulesList) {
      const moduleLessons = await this.getLessonsByModule(module.id);
      allLessons.push(...moduleLessons);
    }
    
    // If there are no lessons, there can't be any progress
    if (allLessons.length === 0) {
      return 0;
    }
    
    // Get all completed lessons for this user and course
    const completedLessons = await this.getLessonProgressByCourse(userId, courseId);
    
    // Calculate progress as a percentage
    const totalRequiredLessons = allLessons.filter(lesson => lesson.isRequired).length || allLessons.length;
    const completedCount = completedLessons.length;
    
    const progressPercentage = Math.round((completedCount / totalRequiredLessons) * 100);
    
    // Find the enrollment for this user and course
    const enrollmentList = await this.getEnrollmentsByUser(userId);
    const enrollment = enrollmentList.find(e => e.courseId === courseId);
    
    if (enrollment) {
      // Update the enrollment progress
      await this.updateEnrollment(enrollment.id, { 
        progress: progressPercentage,
        completedAt: progressPercentage === 100 ? new Date() : null 
      });
    }
    
    return progressPercentage;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getUsersByTenant(tenantId: number): Promise<User[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getUserCount(): Promise<number> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getCoursesByTenant(tenantId: number): Promise<Course[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Module operations
  async getModule(id: number): Promise<Module | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getModulesByCourse(courseId: number): Promise<Module[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createModule(insertModule: InsertModule): Promise<Module> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteModule(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteLesson(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Exam operations
  async getExam(id: number): Promise<Exam | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getExamsByCourse(courseId: number): Promise<Exam[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getExamsByTenant(tenantId: number): Promise<Exam[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createExam(insertExam: InsertExam): Promise<Exam> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteExam(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getQuestionsByExam(examId: number): Promise<Question[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateQuestion(id: number, questionData: Partial<Question>): Promise<Question | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Exam attempt operations
  async getExamAttempt(id: number): Promise<ExamAttempt | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getExamAttemptsByUser(userId: number): Promise<ExamAttempt[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getExamAttemptsByExam(examId: number): Promise<ExamAttempt[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createExamAttempt(insertAttempt: InsertExamAttempt): Promise<ExamAttempt> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateExamAttempt(id: number, attemptData: Partial<ExamAttempt>): Promise<ExamAttempt | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Activity log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getActivityLogsByTenant(tenantId: number): Promise<ActivityLog[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Batch operations
  async getBatch(id: number): Promise<Batch | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getBatchesByTenant(tenantId: number): Promise<Batch[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getBatchesByCourse(courseId: number): Promise<Batch[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getBatchesByTrainer(trainerId: number): Promise<Batch[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createBatch(batch: InsertBatch): Promise<Batch> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateBatch(id: number, batch: Partial<Batch>): Promise<Batch | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteBatch(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  // Batch enrollment operations
  async getBatchEnrollment(id: number): Promise<BatchEnrollment | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getBatchEnrollmentsByBatch(batchId: number): Promise<BatchEnrollment[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async getBatchEnrollmentsByUser(userId: number): Promise<BatchEnrollment[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createBatchEnrollment(enrollment: InsertBatchEnrollment): Promise<BatchEnrollment> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async createBatchEnrollmentsBulk(enrollments: InsertBatchEnrollment[]): Promise<BatchEnrollment[]> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async updateBatchEnrollment(id: number, enrollment: Partial<BatchEnrollment>): Promise<BatchEnrollment | undefined> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
  
  async deleteBatchEnrollment(id: number): Promise<boolean> {
    throw new Error("MemStorage is no longer used. Please use DatabaseStorage instead.");
  }
}

// Update the export to use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
