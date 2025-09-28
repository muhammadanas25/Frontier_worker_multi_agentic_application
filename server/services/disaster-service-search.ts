import * as fs from 'fs';
import * as path from 'path';
import { calculateDistance } from '../utils/distance';

interface DisasterCSVRow {
  record_id?: string;
  city?: string;
  area?: string;
  incident_type?: string;
  shelter_name?: string;
  shelter_capacity?: string;
  shelter_lat?: string;
  shelter_long?: string;
  camp_status?: string;
  safe_evacuation_route?: string;
  route_notes?: string;
  relief_truck_date?: string;
  relief_truck_time?: string;
  relief_contact_phone?: string;
  rescue_hotline?: string;
  police_helpline?: string;
  sms_alert_radius_km?: string;
  water_stock_bottles?: string;
  food_stock_packs?: string;
  medical_kits?: string;
  last_updated?: string;
}

export interface DisasterService {
  id: string;
  recordId: string | null;
  city: string;
  area: string | null;
  incidentType: string | null;
  shelterName: string;
  shelterCapacity: number | null;
  latitude: string;
  longitude: string;
  campStatus: string | null;
  evacuationRoute: string | null;
  routeNotes: string | null;
  reliefContactPhone: string | null;
  rescueHotline: string | null;
  waterStock: number | null;
  foodStock: number | null;
  medicalKits: number | null;
  distance?: number;
}

class DisasterServiceSearch {
  private disasterServices: DisasterService[] = [];
  private loaded = false;

  async loadData() {
    if (this.loaded) return;

    try {
      const csvPath = path.join(process.cwd(), 'attached_assets', 'disaster_agent_resources_1759022140494.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        const row: DisasterCSVRow = {};
        
        headers.forEach((header, index) => {
          row[header.trim() as keyof DisasterCSVRow] = values[index]?.trim();
        });

        if (row.shelter_name && row.shelter_lat && row.shelter_long && row.city) {
          const service: DisasterService = {
            id: `disaster_${row.record_id || Math.random().toString(36).substr(2, 9)}`,
            recordId: row.record_id || null,
            city: row.city,
            area: row.area || null,
            incidentType: row.incident_type || null,
            shelterName: row.shelter_name,
            shelterCapacity: row.shelter_capacity ? parseInt(row.shelter_capacity) : null,
            latitude: row.shelter_lat,
            longitude: row.shelter_long,
            campStatus: row.camp_status || null,
            evacuationRoute: row.safe_evacuation_route || null,
            routeNotes: row.route_notes || null,
            reliefContactPhone: row.relief_contact_phone || row.rescue_hotline || "1122",
            rescueHotline: row.rescue_hotline || "1122",
            waterStock: row.water_stock_bottles ? parseInt(row.water_stock_bottles) : null,
            foodStock: row.food_stock_packs ? parseInt(row.food_stock_packs) : null,
            medicalKits: row.medical_kits ? parseInt(row.medical_kits) : null,
          };

          this.disasterServices.push(service);
        }
      }

      this.loaded = true;
      console.log(`Loaded ${this.disasterServices.length} disaster services from CSV`);
    } catch (error) {
      console.error('Error loading disaster services:', error);
      this.loaded = true; // Set to prevent repeated attempts
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  async searchNearestServices(
    lat: number, 
    lng: number, 
    maxResults: number = 5, 
    maxDistanceKm: number = 50,
    emergencyType?: string
  ): Promise<DisasterService[]> {
    await this.loadData();

    let filteredServices = this.disasterServices;

    // Filter by incident type if emergency type matches
    if (emergencyType) {
      const incidentTypeMap: { [key: string]: string[] } = {
        'fire': ['Fire'],
        'flood': ['Flood'],
        'earthquake': ['Earthquake'],
        'storm': ['Storm'],
        'heatwave': ['Heatwave']
      };
      
      const relevantTypes = incidentTypeMap[emergencyType.toLowerCase()];
      if (relevantTypes) {
        filteredServices = filteredServices.filter(service => 
          relevantTypes.some(type => 
            service.incidentType?.toLowerCase().includes(type.toLowerCase())
          )
        );
      }
    }

    // Calculate distances and filter by max distance
    const servicesWithDistance = filteredServices
      .map(service => ({
        ...service,
        distance: calculateDistance(
          lat, lng, 
          parseFloat(service.latitude), 
          parseFloat(service.longitude)
        )
      }))
      .filter(service => service.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

    return servicesWithDistance;
  }

  async searchByCity(city: string, maxResults: number = 5): Promise<DisasterService[]> {
    await this.loadData();
    
    const cityServices = this.disasterServices
      .filter(service => 
        service.city.toLowerCase().includes(city.toLowerCase())
      )
      .slice(0, maxResults);

    return cityServices;
  }

  async searchByCapacity(minCapacity: number, maxResults: number = 5): Promise<DisasterService[]> {
    await this.loadData();
    
    const capacityServices = this.disasterServices
      .filter(service => 
        service.shelterCapacity && service.shelterCapacity >= minCapacity &&
        service.campStatus !== 'Full' && service.campStatus !== 'Closed'
      )
      .sort((a, b) => (b.shelterCapacity || 0) - (a.shelterCapacity || 0))
      .slice(0, maxResults);

    return capacityServices;
  }
}

export const disasterServiceSearch = new DisasterServiceSearch();