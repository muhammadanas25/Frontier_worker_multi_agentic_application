import { type User, type InsertUser, type EmergencyCase, type InsertEmergencyCase, type CaseUpdate, type InsertCaseUpdate, type Hospital, type InsertHospital } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Emergency Cases
  createEmergencyCase(emergencyCase: InsertEmergencyCase): Promise<EmergencyCase>;
  getEmergencyCase(id: string): Promise<EmergencyCase | undefined>;
  getEmergencyCaseByCaseId(caseId: string): Promise<EmergencyCase | undefined>;
  updateEmergencyCase(id: string, updates: Partial<EmergencyCase>): Promise<EmergencyCase | undefined>;
  getAllEmergencyCases(): Promise<EmergencyCase[]>;
  getActiveCases(): Promise<EmergencyCase[]>;
  
  // Case Updates
  createCaseUpdate(update: InsertCaseUpdate): Promise<CaseUpdate>;
  getCaseUpdates(caseId: string): Promise<CaseUpdate[]>;
  
  // Hospitals
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  getAllHospitals(): Promise<Hospital[]>;
  getHospitalsByLocation(lat: number, lng: number, radius: number): Promise<Hospital[]>;
  getHospitalsBySpecialty(specialty: string): Promise<Hospital[]>;
  searchHospitals(query: string): Promise<Hospital[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private emergencyCases: Map<string, EmergencyCase> = new Map();
  private caseUpdates: Map<string, CaseUpdate> = new Map();
  private hospitals: Map<string, Hospital> = new Map();
  private caseCounter = 1;

  constructor() {
    this.loadHospitalData();
  }

  private generateCaseId(): string {
    const year = new Date().getFullYear();
    const caseNumber = String(this.caseCounter++).padStart(4, '0');
    return `C-${year}-${caseNumber}`;
  }

  private async loadHospitalData() {
    // Load hospital data from CSV in real implementation
    // For now, we'll use sample data structure
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "citizen"
    };
    this.users.set(id, user);
    return user;
  }

  // Emergency Cases
  async createEmergencyCase(insertCase: InsertEmergencyCase): Promise<EmergencyCase> {
    const id = randomUUID();
    const caseId = this.generateCaseId();
    const now = new Date();
    
    const emergencyCase: EmergencyCase = {
      ...insertCase,
      id,
      caseId,
      status: "submitted",
      triageResults: null,
      assignedService: null,
      bookingDetails: null,
      coordinates: insertCase.coordinates || null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.emergencyCases.set(id, emergencyCase);
    return emergencyCase;
  }

  async getEmergencyCase(id: string): Promise<EmergencyCase | undefined> {
    return this.emergencyCases.get(id);
  }

  async getEmergencyCaseByCaseId(caseId: string): Promise<EmergencyCase | undefined> {
    return Array.from(this.emergencyCases.values()).find(case_ => case_.caseId === caseId);
  }

  async updateEmergencyCase(id: string, updates: Partial<EmergencyCase>): Promise<EmergencyCase | undefined> {
    const existingCase = this.emergencyCases.get(id);
    if (!existingCase) return undefined;

    const updatedCase: EmergencyCase = {
      ...existingCase,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.emergencyCases.set(id, updatedCase);
    return updatedCase;
  }

  async getAllEmergencyCases(): Promise<EmergencyCase[]> {
    return Array.from(this.emergencyCases.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveCases(): Promise<EmergencyCase[]> {
    return Array.from(this.emergencyCases.values())
      .filter(case_ => !["resolved", "cancelled"].includes(case_.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Case Updates
  async createCaseUpdate(insertUpdate: InsertCaseUpdate): Promise<CaseUpdate> {
    const id = randomUUID();
    const update: CaseUpdate = {
      ...insertUpdate,
      id,
      messageUrdu: insertUpdate.messageUrdu || null,
      createdAt: new Date(),
    };
    
    this.caseUpdates.set(id, update);
    return update;
  }

  async getCaseUpdates(caseId: string): Promise<CaseUpdate[]> {
    return Array.from(this.caseUpdates.values())
      .filter(update => update.caseId === caseId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Hospitals
  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const id = randomUUID();
    const hospital: Hospital = { 
      ...insertHospital, 
      id,
      osmId: insertHospital.osmId || null,
      amenity: insertHospital.amenity || null,
      speciality: insertHospital.speciality || null,
      address: insertHospital.address || null,
      contactNumber: insertHospital.contactNumber || null,
      beds: insertHospital.beds || null,
      bedsAvailable: insertHospital.bedsAvailable || null,
      ventilators: insertHospital.ventilators || null,
      operatorType: insertHospital.operatorType || null
    };
    this.hospitals.set(id, hospital);
    return hospital;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async getHospitalsByLocation(lat: number, lng: number, radius: number): Promise<Hospital[]> {
    // Simple distance filtering - in production use proper geospatial queries
    return Array.from(this.hospitals.values()).filter(hospital => {
      const hospitalLat = parseFloat(hospital.latitude);
      const hospitalLng = parseFloat(hospital.longitude);
      const distance = Math.sqrt(
        Math.pow(lat - hospitalLat, 2) + Math.pow(lng - hospitalLng, 2)
      );
      return distance <= radius;
    });
  }

  async getHospitalsBySpecialty(specialty: string): Promise<Hospital[]> {
    return Array.from(this.hospitals.values())
      .filter(hospital => 
        hospital.speciality?.toLowerCase().includes(specialty.toLowerCase()) ||
        hospital.amenity?.toLowerCase().includes(specialty.toLowerCase())
      );
  }

  async searchHospitals(query: string): Promise<Hospital[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.hospitals.values())
      .filter(hospital => 
        hospital.name.toLowerCase().includes(searchTerm) ||
        hospital.address?.toLowerCase().includes(searchTerm) ||
        hospital.speciality?.toLowerCase().includes(searchTerm)
      );
  }
}

export const storage = new MemStorage();
