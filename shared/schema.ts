import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("citizen"), // citizen, frontline_worker, admin
});

export const emergencyCases = pgTable("emergency_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().unique(),
  emergencyType: text("emergency_type").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  phoneNumber: text("phone_number").notNull(),
  urgencyLevel: text("urgency_level").notNull(), // critical, high, medium
  status: text("status").notNull().default("submitted"), // submitted, triaged, assigned, in_progress, resolved
  triageResults: jsonb("triage_results").$type<{
    priority: string;
    assessment: string;
    confidence: number;
  }>(),
  assignedService: jsonb("assigned_service").$type<{
    hospitalId?: string;
    hospitalName?: string;
    serviceType?: string;
    contactNumber?: string;
    address?: string;
    distance?: number;
  }>(),
  bookingDetails: jsonb("booking_details").$type<{
    appointmentTime?: string;
    confirmationNumber?: string;
    instructions?: string;
  }>(),
  language: text("language").notNull().default("en"), // en, ur
  degradedMode: boolean("degraded_mode").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  triagedAt: timestamp("triaged_at"),
  assignedAt: timestamp("assigned_at"),
  bookedAt: timestamp("booked_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const caseUpdates = pgTable("case_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull(),
  updateType: text("update_type").notNull(), // triage, guidance, booking, follow_up
  message: text("message").notNull(),
  messageUrdu: text("message_urdu"),
  agentType: text("agent_type").notNull(), // triage_agent, guidance_agent, booking_agent, follow_up_agent
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  osmId: text("osm_id"),
  name: text("name").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  amenity: text("amenity"),
  speciality: text("speciality"),
  address: text("address"),
  contactNumber: text("contact_number"),
  beds: integer("beds"),
  bedsAvailable: integer("beds_available"),
  ventilators: integer("ventilators"),
  operatorType: text("operator_type"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertEmergencyCaseSchema = createInsertSchema(emergencyCases).pick({
  emergencyType: true,
  description: true,
  location: true,
  coordinates: true,
  phoneNumber: true,
  urgencyLevel: true,
  language: true,
  degradedMode: true,
}).extend({
  emergencyType: z.enum(["medical", "crime", "fire", "flood", "earthquake", "urban", "public_safety", "unknown"]),
  urgencyLevel: z.enum(["critical", "high", "medium", "unknown"]),
  language: z.enum(["en", "ur"]),
});

export const insertCaseUpdateSchema = createInsertSchema(caseUpdates).pick({
  caseId: true,
  updateType: true,
  message: true,
  messageUrdu: true,
  agentType: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmergencyCase = typeof emergencyCases.$inferSelect;
export type InsertEmergencyCase = z.infer<typeof insertEmergencyCaseSchema>;

export type CaseUpdate = typeof caseUpdates.$inferSelect;
export type InsertCaseUpdate = z.infer<typeof insertCaseUpdateSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
