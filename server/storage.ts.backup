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
    
    // Get all progress entries for this user and course
    const lessonProgressEntries = await this.getLessonProgressByCourse(userId, courseId);
    
    // Filter to only include completed lessons
    const completedLessons = lessonProgressEntries.filter(progress => progress.completed);
    
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
    const [batch] = await db.insert(batches).values(insertBatch).returning();
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
    const [enrollment] = await db.insert(batchEnrollments).values(insertEnrollment).returning();
    return enrollment;
  }
  
  async createBatchEnrollmentsBulk(enrollmentsData: InsertBatchEnrollment[]): Promise<BatchEnrollment[]> {
    if (enrollmentsData.length === 0) {
      return [];
    }
    
    const enrollments = await db.insert(batchEnrollments)
      .values(enrollmentsData)
      .returning();
    return enrollments;
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
  // Implementation of the MemStorage class (if needed)
  // This would be the in-memory version of the storage
  // ...
}