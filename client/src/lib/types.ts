// Common types for the emergency response system

export interface AgentStatus {
  id: string;
  name: string;
  status: "idle" | "processing" | "completed" | "error";
  progress: number;
  lastUpdate: Date;
  result?: any;
}

export interface EmergencyType {
  id: string;
  name: string;
  icon: string;
  priority: "low" | "medium" | "high" | "critical";
  requiredSpecialties: string[];
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface HospitalWithDistance {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  distance?: number;
  speciality?: string;
  amenity?: string;
  address?: string;
  contactNumber?: string;
  beds?: number;
  bedsAvailable?: number;
  ventilators?: number;
  operatorType?: string;
}

export interface DashboardMetrics {
  triage: {
    totalCases: number;
    criticalCases: number;
    highPriorityCases: number;
    averageResponseTime: number;
  };
  guidance: {
    totalAssignments: number;
    averageDistance: number;
    successfulMatches: number;
    topHospitals: Array<{ name: string; assignments: number }>;
  };
  booking: {
    totalBookings: number;
    emergencyBookings: number;
    averageWaitTime: number;
    successfulBookings: number;
  };
  followUp: {
    totalFollowUps: number;
    avgResponseTime: number;
    resolutionRate: number;
    patientSatisfaction: number;
  };
  hospitalCapacity: {
    totalBeds: number;
    availableBeds: number;
    totalVentilators: number;
    utilizationRate: number;
  };
}

export interface SMSConfig {
  enabled: boolean;
  fallbackMode: boolean;
  maxMessageLength: number;
  retryAttempts: number;
}

export interface AppConfig {
  language: "en" | "ur";
  degradedMode: boolean;
  smsConfig: SMSConfig;
  locationAccuracy: number;
  refreshInterval: number;
}

export interface CaseFilter {
  status?: string;
  emergencyType?: string;
  priority?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
}

export interface AgentProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  processingTime: number;
}

export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  push: boolean;
  language: "en" | "ur";
  urgencyLevels: string[];
}

// Utility types
export type EmergencyStatus = "submitted" | "triaged" | "assigned" | "in_progress" | "resolved" | "cancelled";
export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type AgentType = "triage_agent" | "guidance_agent" | "booking_agent" | "follow_up_agent" | "equity_oversight_agent";

// Form types
export interface EmergencyFormData {
  emergencyType: string;
  description: string;
  location: string;
  coordinates?: LocationCoordinates;
  phoneNumber: string;
  urgencyLevel: UrgencyLevel;
  language: "en" | "ur";
  degradedMode: boolean;
}

export interface CaseUpdateFormData {
  status: EmergencyStatus;
  resolutionNotes?: string;
  assignedService?: string;
  priority?: UrgencyLevel;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
