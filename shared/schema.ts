import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenant model
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  subdomain: true,
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// User model with role and tenant
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth").notNull(),
  profilePhoto: text("profile_photo"),
  educationLevel: text("education_level").notNull(),
  schoolCollege: text("school_college").notNull(),
  yearOfStudy: text("year_of_study").notNull(),
  role: text("role").notNull().default("student"),
  tenantId: integer("tenant_id").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  mobileNumber: true,
  gender: true,
  dateOfBirth: true,
  profilePhoto: true,
  educationLevel: true,
  schoolCollege: true,
  yearOfStudy: true,
  role: true,
  tenantId: true,
}).extend({
  // Make profilePhoto field accept both string and null
  profilePhoto: z.string().nullable().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Course model
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(), // Rich text field
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  duration: integer("duration").notNull(),
  moduleCount: integer("module_count").default(0), // Number of modules
  lessonCount: integer("lesson_count").default(0), // Total lessons/videos
  thumbnail: text("thumbnail"), // Course thumbnail/cover image
  instructorId: integer("instructor_id"), // Instructor ID if already in system
  isEnrollmentRequired: boolean("is_enrollment_required").default(true), // Free or enrollment required
  tenantId: integer("tenant_id").notNull(),
  createdBy: integer("created_by").notNull(),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  category: true,
  difficulty: true,
  duration: true,
  moduleCount: true,
  lessonCount: true,
  thumbnail: true,
  instructorId: true,
  isEnrollmentRequired: true,
  tenantId: true,
  createdBy: true,
}).extend({
  // Make these fields optional or nullable
  moduleCount: z.number().optional(),
  lessonCount: z.number().optional(),
  thumbnail: z.string().nullable().optional(),
  instructorId: z.number().nullable().optional(),
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Course modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"), // Optional module description
  courseId: integer("course_id").notNull(),
  order: integer("order").notNull(),
});

export const insertModuleSchema = createInsertSchema(modules).pick({
  title: true,
  description: true,
  courseId: true,
  order: true,
}).extend({
  description: z.string().nullable().optional(),
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

// Course lessons
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Content/URL/file path
  contentType: text("content_type").notNull(), // video, text, pdf, quiz
  moduleId: integer("module_id").notNull(),
  order: integer("order").notNull(),
  duration: integer("duration"), // Duration in minutes (for video content)
  isRequired: boolean("is_required").default(true), // Whether this lesson is required to complete the course
  quizData: jsonb("quiz_data"), // For quiz-type lessons, stores questions and answers
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  title: true,
  content: true,
  contentType: true,
  moduleId: true,
  order: true,
  duration: true,
  isRequired: true,
  quizData: true,
}).extend({
  duration: z.number().nullable().optional(),
  quizData: z.any().nullable().optional(),
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Enrollment model
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").notNull().default(0),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  userId: true,
  courseId: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Exam model
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  courseId: integer("course_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  createdBy: integer("created_by").notNull(),
  acceptingResponses: boolean("accepting_responses").default(true), // Toggle for accepting responses
});

export const insertExamSchema = createInsertSchema(exams)
  .pick({
    title: true,
    description: true,
    courseId: true,
    tenantId: true,
    createdBy: true,
  });

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

// Question model - Updated for text-based assignment questions
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  text: text("text").notNull(), // Question text
  order: integer("order").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  examId: true,
  text: true,
  order: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Exam attempt model - Updated for text-based answers
export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  examId: integer("exam_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  answers: jsonb("answers"), // User's text answers (JSON object with question ID as key and text answer as value)
  feedback: text("feedback"), // Instructor feedback on the answers
  reviewedAt: timestamp("reviewed_at"), // When the instructor reviewed the answers
});

export const insertExamAttemptSchema = createInsertSchema(examAttempts).pick({
  userId: true,
  examId: true,
});

export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;
export type ExamAttempt = typeof examAttempts.$inferSelect;

// Activity log model for tracking student engagement
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(), // course_view, lesson_complete, exam_start, etc.
  resourceId: integer("resource_id").notNull(), // ID of the resource being accessed
  resourceType: text("resource_type").notNull(), // course, lesson, exam
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  tenantId: integer("tenant_id").notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  activityType: true,
  resourceId: true,
  resourceType: true,
  tenantId: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Lesson Progress model for tracking completed lessons
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  moduleId: integer("module_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").notNull().default(true),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).pick({
  userId: true,
  lessonId: true,
  moduleId: true,
  courseId: true,
  completed: true,
});

export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;

// Batch model for grouping students and assigning courses
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  batchCode: text("batch_code").notNull().unique(),
  courseId: integer("course_id").notNull(),
  trainerId: integer("trainer_id").notNull(),
  startDate: date("start_date").notNull(),
  batchTime: text("batch_time").notNull(),
  tenantId: integer("tenant_id").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  description: text("description"),
  maxStudents: integer("max_students"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBatchSchema = createInsertSchema(batches).pick({
  name: true,
  batchCode: true,
  courseId: true,
  trainerId: true,
  startDate: true,
  batchTime: true,
  tenantId: true,
  createdBy: true,
  description: true,
  maxStudents: true,
  isActive: true,
}).extend({
  description: z.string().nullable().optional(),
  maxStudents: z.number().nullable().optional(),
  startDate: z.string().transform(str => new Date(str)),
});

export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

// BatchEnrollment model for connecting students to batches
export const batchEnrollments = pgTable("batch_enrollments", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull(),
  userId: integer("user_id").notNull(),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  enrolledBy: integer("enrolled_by").notNull(),
  status: text("status").notNull().default("active"), // active, completed, dropped
});

export const insertBatchEnrollmentSchema = createInsertSchema(batchEnrollments).pick({
  batchId: true,
  userId: true,
  enrolledBy: true,
  status: true,
});

export type InsertBatchEnrollment = z.infer<typeof insertBatchEnrollmentSchema>;
export type BatchEnrollment = typeof batchEnrollments.$inferSelect;
