import { EmergencyCase } from '@shared/schema';
import { hospitalSearchService } from './hospital-search';
import { disasterServiceSearch } from './disaster-service-search';
import { policeServiceSearch } from './police-service-search';
import { recommendService } from './gemini';
import { storage } from '../storage';

export class GuidanceAgent {
  async processCase(emergencyCase: EmergencyCase): Promise<any> {
    console.log(`Guidance Agent processing case: ${emergencyCase.caseId}`);

    if (!emergencyCase.triageResults) {
      throw new Error("Case must be triaged before guidance processing");
    }

    try {
      let recommendedServices: any[] = [];
      let serviceType = this.getServiceTypeForEmergency(emergencyCase.emergencyType);

      // Search for appropriate services based on emergency type and coordinates
      if (emergencyCase.coordinates) {
        recommendedServices = await this.searchServicesByType(
          serviceType,
          emergencyCase.coordinates.lat,
          emergencyCase.coordinates.lng,
          emergencyCase.emergencyType,
          5, // max 5 services
          20 // within 20km
        );
      }

      // If no coordinates, search by location or fallback
      if (recommendedServices.length === 0) {
        recommendedServices = await this.searchServicesByTypeWithoutCoords(
          serviceType,
          emergencyCase.emergencyType,
          emergencyCase.location,
          5
        );
      }

      // Get AI recommendation for service type
      const serviceRecommendation = await recommendService(
        emergencyCase.emergencyType,
        {
          priority: emergencyCase.triageResults.priority as "critical" | "high" | "medium" | "low",
          assessment: emergencyCase.triageResults.assessment,
          confidence: emergencyCase.triageResults.confidence,
          recommendedActions: [],
          estimatedResponseTime: "5-10 minutes",
          emergencyType: emergencyCase.emergencyType as "medical" | "crime" | "fire" | "flood" | "earthquake" | "urban" | "public_safety" | "unknown",
          urgencyLevel: (emergencyCase.urgencyLevel || "unknown") as "critical" | "high" | "medium" | "unknown"
        },
        recommendedServices
      );

      // Select the best service based on priority and distance
      const selectedService = this.selectBestService(
        recommendedServices,
        emergencyCase.triageResults.priority,
        emergencyCase.emergencyType,
        serviceType
      );

      if (selectedService) {
        const assignedService = this.formatAssignedService(selectedService, serviceType, serviceRecommendation);

        // Update case with assigned service
        await storage.updateEmergencyCase(emergencyCase.id, {
          status: "assigned",
          assignedAt: new Date(),
          assignedService
        });

        // Log guidance update
        const serviceName = this.getServiceName(selectedService, serviceType);
        const serviceDistance = selectedService.distance?.toFixed(1) || 'Unknown';
        const serviceContact = this.getServiceContact(selectedService, serviceType);
        
        await storage.createCaseUpdate({
          caseId: emergencyCase.caseId,
          updateType: "guidance",
          message: `${serviceType} assigned: ${serviceName}. Distance: ${serviceDistance} km. Contact: ${serviceContact}`,
          messageUrdu: emergencyCase.language === "ur" ? `سروس تفویض: ${serviceName}` : undefined,
          agentType: "guidance_agent"
        });

        console.log(`Guidance completed for case ${emergencyCase.caseId}: ${serviceName}`);
        return { assignedService, serviceRecommendation, availableServices: recommendedServices };
      } else {
        throw new Error(`No suitable ${serviceType.toLowerCase()} found`);
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
        assignedAt: new Date(),
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

  private getServiceTypeForEmergency(emergencyType: string): string {
    const serviceTypeMap: { [key: string]: string } = {
      medical: "Hospital",
      crime: "Police Station", 
      fire: "Disaster Relief Center",
      flood: "Disaster Relief Center",
      earthquake: "Disaster Relief Center",
      urban: "Hospital",
      public_safety: "Police Station"
    };

    return serviceTypeMap[emergencyType] || "Hospital";
  }

  private async searchServicesByType(
    serviceType: string,
    lat: number,
    lng: number,
    emergencyType: string,
    maxResults: number,
    maxDistanceKm: number
  ): Promise<any[]> {
    switch (serviceType) {
      case "Hospital":
        return await hospitalSearchService.searchNearestHospitals(lat, lng, maxResults, maxDistanceKm);
      
      case "Police Station":
        return await policeServiceSearch.searchNearestServices(lat, lng, maxResults, maxDistanceKm, emergencyType);
      
      case "Disaster Relief Center":
        return await disasterServiceSearch.searchNearestServices(lat, lng, maxResults, maxDistanceKm, emergencyType);
      
      default:
        return await hospitalSearchService.searchNearestHospitals(lat, lng, maxResults, maxDistanceKm);
    }
  }

  private async searchServicesByTypeWithoutCoords(
    serviceType: string,
    emergencyType: string,
    location: string,
    maxResults: number
  ): Promise<any[]> {
    // Extract city from location if possible
    const cities = ['karachi', 'lahore', 'islamabad', 'peshawar', 'multan', 'quetta'];
    const locationLower = location.toLowerCase();
    const detectedCity = cities.find(city => locationLower.includes(city));

    switch (serviceType) {
      case "Hospital":
        if (detectedCity) {
          // For now, fallback to general specialty search as hospital search doesn't support city filtering
          const specialty = this.getSpecialtyForEmergencyType(emergencyType);
          return await hospitalSearchService.searchHospitalsBySpecialty(specialty, undefined, undefined, maxResults);
        }
        const specialty = this.getSpecialtyForEmergencyType(emergencyType);
        return await hospitalSearchService.searchHospitalsBySpecialty(specialty, undefined, undefined, maxResults);
      
      case "Police Station":
        if (detectedCity) {
          return await policeServiceSearch.searchByCity(detectedCity, maxResults);
        }
        return await policeServiceSearch.searchBySpecialization('General Crime', maxResults);
      
      case "Disaster Relief Center":
        if (detectedCity) {
          return await disasterServiceSearch.searchByCity(detectedCity, maxResults);
        }
        return await disasterServiceSearch.searchByCapacity(50, maxResults);
      
      default:
        return [];
    }
  }

  private selectBestService(
    services: any[],
    priority: string,
    emergencyType: string,
    serviceType: string
  ): any {
    if (services.length === 0) return null;

    let filteredServices = services;

    // Apply service-specific filtering
    switch (serviceType) {
      case "Hospital":
        // Filter by bed availability for hospitals
        filteredServices = services.filter(s => 
          !s.bedsAvailable || s.bedsAvailable > 0
        );
        
        // For critical cases, prioritize hospitals with ventilators
        if (priority === "critical") {
          const withVentilators = filteredServices.filter(s => s.ventilators && s.ventilators > 0);
          if (withVentilators.length > 0) {
            return withVentilators[0];
          }
        }
        break;

      case "Police Station":
        // Filter by active status
        filteredServices = services.filter(s => s.status === 'active');
        break;

      case "Disaster Relief Center":
        // Filter by camp status (not full or closed)
        filteredServices = services.filter(s => 
          s.campStatus !== 'Full' && s.campStatus !== 'Closed'
        );
        
        // For high capacity needs, prioritize larger shelters
        if (priority === "critical") {
          filteredServices.sort((a, b) => (b.shelterCapacity || 0) - (a.shelterCapacity || 0));
        }
        break;
    }

    if (filteredServices.length === 0) {
      filteredServices = services; // Fallback to all services
    }

    // Return the closest available service
    return filteredServices[0];
  }

  private formatAssignedService(
    selectedService: any,
    serviceType: string,
    serviceRecommendation: any
  ): any {
    switch (serviceType) {
      case "Hospital":
        return {
          hospitalId: selectedService.id,
          hospitalName: selectedService.name,
          serviceType: serviceRecommendation.serviceType || "Medical Emergency",
          contactNumber: selectedService.contactNumber || "1122",
          address: selectedService.address || "Address not available",
          distance: selectedService.distance || 0
        };

      case "Police Station":
        return {
          hospitalId: selectedService.id, // Keep same field name for compatibility
          hospitalName: selectedService.stationName,
          serviceType: serviceRecommendation.serviceType || "Crime Response",
          contactNumber: selectedService.contactNumber || "15",
          address: selectedService.area || "Address not available",
          distance: selectedService.distance || 0
        };

      case "Disaster Relief Center":
        return {
          hospitalId: selectedService.id, // Keep same field name for compatibility
          hospitalName: selectedService.shelterName,
          serviceType: serviceRecommendation.serviceType || "Disaster Relief",
          contactNumber: selectedService.reliefContactPhone || "1122",
          address: selectedService.area || "Address not available",
          distance: selectedService.distance || 0
        };

      default:
        return {
          hospitalId: selectedService.id,
          hospitalName: selectedService.name || selectedService.stationName || selectedService.shelterName,
          serviceType: serviceRecommendation.serviceType || "Emergency Response",
          contactNumber: selectedService.contactNumber || "1122",
          address: selectedService.address || "Address not available",
          distance: selectedService.distance || 0
        };
    }
  }

  private getServiceName(selectedService: any, serviceType: string): string {
    switch (serviceType) {
      case "Hospital":
        return selectedService.name;
      case "Police Station":
        return selectedService.stationName;
      case "Disaster Relief Center":
        return selectedService.shelterName;
      default:
        return selectedService.name || selectedService.stationName || selectedService.shelterName || "Emergency Service";
    }
  }

  private getServiceContact(selectedService: any, serviceType: string): string {
    switch (serviceType) {
      case "Hospital":
        return selectedService.contactNumber || "1122";
      case "Police Station":
        return selectedService.contactNumber || "15";
      case "Disaster Relief Center":
        return selectedService.reliefContactPhone || "1122";
      default:
        return selectedService.contactNumber || "1122";
    }
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
