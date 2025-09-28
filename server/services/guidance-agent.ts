import { EmergencyCase } from '@shared/schema';
import { hospitalSearchService } from './hospital-search';
import { recommendService } from './gemini';
import { storage } from '../storage';

export class GuidanceAgent {
  async processCase(emergencyCase: EmergencyCase): Promise<any> {
    console.log(`Guidance Agent processing case: ${emergencyCase.caseId}`);

    if (!emergencyCase.triageResults) {
      throw new Error("Case must be triaged before guidance processing");
    }

    try {
      let recommendedHospitals: any[] = [];

      // Search for appropriate hospitals based on coordinates
      if (emergencyCase.coordinates) {
        recommendedHospitals = await hospitalSearchService.searchNearestHospitals(
          emergencyCase.coordinates.lat,
          emergencyCase.coordinates.lng,
          5, // max 5 hospitals
          20 // within 20km
        );
      }

      // If no coordinates, search by specialty and location name
      if (recommendedHospitals.length === 0) {
        const specialty = this.getSpecialtyForEmergencyType(emergencyCase.emergencyType);
        recommendedHospitals = await hospitalSearchService.searchHospitalsBySpecialty(specialty, undefined, undefined, 5);
      }

      // Get AI recommendation for service type
      const serviceRecommendation = await recommendService(
        emergencyCase.emergencyType,
        {
          priority: emergencyCase.triageResults.priority,
          assessment: emergencyCase.triageResults.assessment,
          confidence: emergencyCase.triageResults.confidence,
          recommendedActions: [],
          estimatedResponseTime: "5-10 minutes"
        },
        recommendedHospitals
      );

      // Select the best hospital based on priority and distance
      const selectedHospital = this.selectBestHospital(
        recommendedHospitals,
        emergencyCase.triageResults.priority,
        emergencyCase.emergencyType
      );

      if (selectedHospital) {
        const assignedService = {
          hospitalId: selectedHospital.id,
          hospitalName: selectedHospital.name,
          serviceType: serviceRecommendation.serviceType,
          contactNumber: selectedHospital.contactNumber || "1122",
          address: selectedHospital.address || "Address not available",
          distance: selectedHospital.distance || 0
        };

        // Update case with assigned service
        await storage.updateEmergencyCase(emergencyCase.id, {
          status: "assigned",
          assignedService
        });

        // Log guidance update
        await storage.createCaseUpdate({
          caseId: emergencyCase.caseId,
          updateType: "guidance",
          message: `Service assigned: ${selectedHospital.name}. Distance: ${selectedHospital.distance?.toFixed(1) || 'Unknown'} km. Contact: ${selectedHospital.contactNumber || '1122'}`,
          messageUrdu: emergencyCase.language === "ur" ? `سروس تفویض: ${selectedHospital.name}` : undefined,
          agentType: "guidance_agent"
        });

        console.log(`Guidance completed for case ${emergencyCase.caseId}: ${selectedHospital.name}`);
        return { assignedService, serviceRecommendation, availableHospitals: recommendedHospitals };
      } else {
        throw new Error("No suitable hospital found");
      }

    } catch (error) {
      console.error(`Guidance Agent error for case ${emergencyCase.caseId}:`, error);
      
      // Fallback to general emergency services
      const fallbackService = {
        hospitalId: "emergency_fallback",
        hospitalName: "Emergency Services (1122)",
        serviceType: "emergency_response",
        contactNumber: "1122",
        address: "Emergency Response Team",
        distance: 0
      };

      await storage.updateEmergencyCase(emergencyCase.id, {
        status: "assigned",
        assignedService: fallbackService
      });

      await storage.createCaseUpdate({
        caseId: emergencyCase.caseId,
        updateType: "guidance",
        message: "Assigned to general emergency services. Call 1122 for immediate assistance.",
        messageUrdu: emergencyCase.language === "ur" ? "عمومی ایمرجنسی سروسز کو تفویض۔ فوری مدد کے لیے 1122 کال کریں۔" : undefined,
        agentType: "guidance_agent"
      });

      return { assignedService: fallbackService, serviceRecommendation: null, availableHospitals: [] };
    }
  }

  private getSpecialtyForEmergencyType(emergencyType: string): string {
    const specialtyMap: { [key: string]: string } = {
      medical: "emergency",
      crime: "emergency",
      fire: "emergency",
      flood: "emergency", 
      earthquake: "emergency",
      urban: "clinic",
      public_safety: "emergency"
    };

    return specialtyMap[emergencyType] || "emergency";
  }

  private selectBestHospital(hospitals: any[], priority: string, emergencyType: string): any {
    if (hospitals.length === 0) return null;

    // Filter hospitals with available beds for non-critical cases
    let availableHospitals = hospitals.filter(h => 
      priority === "critical" || (h.bedsAvailable && h.bedsAvailable > 0)
    );

    if (availableHospitals.length === 0) {
      availableHospitals = hospitals; // Fallback to all hospitals
    }

    // For critical cases, prioritize hospitals with ventilators
    if (priority === "critical") {
      const hospitalsWithVentilators = availableHospitals.filter(h => h.ventilators && h.ventilators > 0);
      if (hospitalsWithVentilators.length > 0) {
        return hospitalsWithVentilators[0]; // Closest with ventilators
      }
    }

    // Return the closest available hospital
    return availableHospitals[0];
  }

  async getGuidanceMetrics(): Promise<{
    totalAssignments: number;
    averageDistance: number;
    successfulMatches: number;
    topHospitals: Array<{ name: string; assignments: number }>;
  }> {
    const allCases = await storage.getAllEmergencyCases();
    const assignedCases = allCases.filter(c => c.assignedService);

    const distances = assignedCases
      .map(c => c.assignedService?.distance || 0)
      .filter(d => d > 0);

    const averageDistance = distances.length > 0 
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length 
      : 0;

    return {
      totalAssignments: assignedCases.length,
      averageDistance,
      successfulMatches: assignedCases.filter(c => c.assignedService?.hospitalId !== "emergency_fallback").length,
      topHospitals: [] // Calculate from actual assignment data
    };
  }
}

export const guidanceAgent = new GuidanceAgent();
