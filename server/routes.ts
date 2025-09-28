import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmergencyCaseSchema, insertCaseUpdateSchema } from "@shared/schema";
import { triageAgent } from "./services/triage-agent";
import { guidanceAgent } from "./services/guidance-agent";
import { bookingAgent } from "./services/booking-agent";
import { followUpAgent } from "./services/follow-up-agent";
import { hospitalSearchService } from "./services/hospital-search";
import { smsService } from "./services/sms-service";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Emergency Case Management
  app.post("/api/emergency-cases", async (req, res) => {
    try {
      const validatedData = insertEmergencyCaseSchema.parse(req.body);
      
      // Create emergency case
      const emergencyCase = await storage.createEmergencyCase(validatedData);
      
      // Process through AI agents in sequence
      processEmergencyCase(emergencyCase.id);
      
      res.json(emergencyCase);
    } catch (error) {
      console.error("Create emergency case error:", error);
      res.status(400).json({ error: "Invalid emergency case data" });
    }
  });

  app.get("/api/emergency-cases/:id", async (req, res) => {
    try {
      const emergencyCase = await storage.getEmergencyCase(req.params.id);
      if (!emergencyCase) {
        return res.status(404).json({ error: "Emergency case not found" });
      }
      res.json(emergencyCase);
    } catch (error) {
      console.error("Get emergency case error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/emergency-cases/case-id/:caseId", async (req, res) => {
    try {
      const emergencyCase = await storage.getEmergencyCaseByCaseId(req.params.caseId);
      if (!emergencyCase) {
        return res.status(404).json({ error: "Emergency case not found" });
      }
      res.json(emergencyCase);
    } catch (error) {
      console.error("Get emergency case by case ID error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/emergency-cases", async (req, res) => {
    try {
      const cases = await storage.getAllEmergencyCases();
      res.json(cases);
    } catch (error) {
      console.error("Get all emergency cases error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/emergency-cases-active", async (req, res) => {
    try {
      const activeCases = await storage.getActiveCases();
      res.json(activeCases);
    } catch (error) {
      console.error("Get active cases error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/emergency-cases/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updatedCase = await storage.updateEmergencyCase(req.params.id, updates);
      if (!updatedCase) {
        return res.status(404).json({ error: "Emergency case not found" });
      }
      res.json(updatedCase);
    } catch (error) {
      console.error("Update emergency case error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Case Updates
  app.get("/api/case-updates/:caseId", async (req, res) => {
    try {
      const updates = await storage.getCaseUpdates(req.params.caseId);
      res.json(updates);
    } catch (error) {
      console.error("Get case updates error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/case-updates", async (req, res) => {
    try {
      const validatedData = insertCaseUpdateSchema.parse(req.body);
      const update = await storage.createCaseUpdate(validatedData);
      res.json(update);
    } catch (error) {
      console.error("Create case update error:", error);
      res.status(400).json({ error: "Invalid case update data" });
    }
  });

  // Hospital Search
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await hospitalSearchService.searchNearestHospitals(0, 0, 100, 1000);
      res.json(hospitals);
    } catch (error) {
      console.error("Get hospitals error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/hospitals/search", async (req, res) => {
    try {
      const { q, lat, lng, specialty } = req.query;
      
      let hospitals: any[] = [];
      
      if (specialty) {
        hospitals = await hospitalSearchService.searchHospitalsBySpecialty(
          specialty as string,
          lat ? parseFloat(lat as string) : undefined,
          lng ? parseFloat(lng as string) : undefined
        );
      } else if (q) {
        hospitals = await hospitalSearchService.searchHospitalsByName(
          q as string,
          lat ? parseFloat(lat as string) : undefined,
          lng ? parseFloat(lng as string) : undefined
        );
      } else if (lat && lng) {
        hospitals = await hospitalSearchService.searchNearestHospitals(
          parseFloat(lat as string),
          parseFloat(lng as string)
        );
      } else {
        hospitals = await hospitalSearchService.searchNearestHospitals(0, 0, 20, 1000);
      }
      
      res.json(hospitals);
    } catch (error) {
      console.error("Hospital search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/hospitals/capacity", async (req, res) => {
    try {
      const capacity = await hospitalSearchService.getHospitalCapacity();
      res.json(capacity);
    } catch (error) {
      console.error("Hospital capacity error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Agent Metrics
  app.get("/api/metrics/dashboard", async (req, res) => {
    try {
      const [triageMetrics, guidanceMetrics, bookingMetrics, followUpMetrics, hospitalCapacity] = 
        await Promise.all([
          triageAgent.getTriageMetrics(),
          guidanceAgent.getGuidanceMetrics(),
          bookingAgent.getBookingMetrics(),
          followUpAgent.getFollowUpMetrics(),
          hospitalSearchService.getHospitalCapacity()
        ]);

      res.json({
        triage: triageMetrics,
        guidance: guidanceMetrics,
        booking: bookingMetrics,
        followUp: followUpMetrics,
        hospitalCapacity
      });
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SMS Services
  app.post("/api/sms/emergency-contacts", async (req, res) => {
    try {
      const { phoneNumber, caseId, hospitalInfo } = req.body;
      const result = await smsService.sendEmergencyContactsSMS(phoneNumber, caseId, hospitalInfo);
      res.json(result);
    } catch (error) {
      console.error("SMS emergency contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sms/status-update", async (req, res) => {
    try {
      const { phoneNumber, caseId, status, details } = req.body;
      const result = await smsService.sendStatusUpdateSMS(phoneNumber, caseId, status, details);
      res.json(result);
    } catch (error) {
      console.error("SMS status update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Case Resolution
  app.post("/api/cases/:caseId/resolve", async (req, res) => {
    try {
      const { resolutionNotes } = req.body;
      await followUpAgent.resolveCase(req.params.caseId, resolutionNotes || "Case resolved successfully.");
      res.json({ success: true });
    } catch (error) {
      console.error("Case resolution error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // Async function to process emergency case through all agents
  async function processEmergencyCase(caseId: string) {
    try {
      console.log(`Starting multi-agent processing for case ID: ${caseId}`);
      
      let emergencyCase = await storage.getEmergencyCase(caseId);
      if (!emergencyCase) return;

      // Step 1: Triage Agent
      const triageResults = await triageAgent.processCase(emergencyCase);
      
      // Step 2: Guidance Agent  
      emergencyCase = await storage.getEmergencyCase(caseId);
      if (!emergencyCase) return;
      
      const guidanceResults = await guidanceAgent.processCase(emergencyCase);
      
      // Step 3: Booking Agent
      emergencyCase = await storage.getEmergencyCase(caseId);
      if (!emergencyCase) return;
      
      const bookingResults = await bookingAgent.processCase(emergencyCase);
      
      // Step 4: Follow-up Agent
      emergencyCase = await storage.getEmergencyCase(caseId);
      if (!emergencyCase) return;
      
      await followUpAgent.processCase(emergencyCase);
      
      // Schedule additional follow-ups
      await followUpAgent.scheduleFollowUp(emergencyCase.caseId, 30); // 30 min follow-up
      
      console.log(`Multi-agent processing completed for case: ${emergencyCase.caseId}`);
      
    } catch (error) {
      console.error(`Multi-agent processing error for case ${caseId}:`, error);
    }
  }

  return httpServer;
}
