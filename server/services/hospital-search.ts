import * as fs from 'fs';
import * as path from 'path';
import { Hospital } from '@shared/schema';
import { calculateDistance } from '../utils/distance';

interface HospitalCSVRow {
  X?: string;
  Y?: string;
  osm_id?: string;
  osm_type?: string;
  amenity?: string;
  speciality?: string;
  addr_full?: string;
  operator?: string;
  contact_number?: string;
  name?: string;
  healthcare?: string;
  operator_type?: string;
  lat?: string;
  long?: string;
  beds?: string;
  beds_available?: string;
  ventilators_available?: string;
}

export class HospitalSearchService {
  private hospitals: Hospital[] = [];
  private loaded = false;

  async loadHospitalData(): Promise<void> {
    if (this.loaded) return;

    try {
      const csvPath = path.join(process.cwd(), 'attached_assets', 'pakistan_with_resources(1)_1759022137242.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        const row: HospitalCSVRow = {};
        
        headers.forEach((header, index) => {
          row[header.trim() as keyof HospitalCSVRow] = values[index]?.trim();
        });

        if (row.name && row.lat && row.long) {
          const hospital: Hospital = {
            id: `hosp_${row.osm_id || Math.random().toString(36).substr(2, 9)}`,
            osmId: row.osm_id || null,
            name: row.name,
            latitude: row.lat,
            longitude: row.long,
            amenity: row.amenity || null,
            speciality: row.speciality || null,
            address: row.addr_full || null,
            contactNumber: row.contact_number || null,
            beds: row.beds ? parseInt(row.beds) : null,
            bedsAvailable: row.beds_available ? parseInt(row.beds_available) : null,
            ventilators: row.ventilators_available ? parseInt(row.ventilators_available) : null,
            operatorType: row.operator_type || null,
          };

          this.hospitals.push(hospital);
        }
      }

      this.loaded = true;
      console.log(`Loaded ${this.hospitals.length} hospitals from CSV`);
    } catch (error) {
      console.error('Error loading hospital data:', error);
      this.loaded = true; // Mark as loaded even on error to avoid repeated attempts
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

  async searchNearestHospitals(
    userLat: number, 
    userLng: number, 
    maxResults: number = 10,
    maxDistanceKm: number = 50
  ): Promise<Array<Hospital & { distance: number }>> {
    await this.loadHospitalData();

    const hospitalsWithDistance = this.hospitals
      .map(hospital => {
        const hospitalLat = parseFloat(hospital.latitude);
        const hospitalLng = parseFloat(hospital.longitude);
        
        if (isNaN(hospitalLat) || isNaN(hospitalLng)) {
          return null;
        }

        const distance = calculateDistance(userLat, userLng, hospitalLat, hospitalLng);
        return { ...hospital, distance };
      })
      .filter((hospital): hospital is Hospital & { distance: number } => 
        hospital !== null && hospital.distance <= maxDistanceKm
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

    return hospitalsWithDistance;
  }

  async searchHospitalsBySpecialty(
    specialty: string,
    userLat?: number,
    userLng?: number,
    maxResults: number = 10
  ): Promise<Array<Hospital & { distance?: number }>> {
    await this.loadHospitalData();

    let matchingHospitals = this.hospitals.filter(hospital => {
      const specialtyMatch = hospital.speciality?.toLowerCase().includes(specialty.toLowerCase()) ||
                           hospital.amenity?.toLowerCase().includes(specialty.toLowerCase()) ||
                           hospital.name.toLowerCase().includes(specialty.toLowerCase());
      return specialtyMatch;
    });

    if (userLat && userLng) {
      const hospitalsWithDistance = matchingHospitals
        .map(hospital => {
          const hospitalLat = parseFloat(hospital.latitude);
          const hospitalLng = parseFloat(hospital.longitude);
          
          if (isNaN(hospitalLat) || isNaN(hospitalLng)) {
            return { ...hospital, distance: undefined };
          }

          const distance = calculateDistance(userLat, userLng, hospitalLat, hospitalLng);
          return { ...hospital, distance };
        })
        .sort((a, b) => (a.distance || 999) - (b.distance || 999));

      return hospitalsWithDistance.slice(0, maxResults);
    }

    return matchingHospitals.slice(0, maxResults);
  }

  async searchHospitalsByName(
    query: string,
    userLat?: number,
    userLng?: number,
    maxResults: number = 10
  ): Promise<Array<Hospital & { distance?: number }>> {
    await this.loadHospitalData();

    const searchTerm = query.toLowerCase();
    let matchingHospitals = this.hospitals.filter(hospital => 
      hospital.name.toLowerCase().includes(searchTerm) ||
      hospital.address?.toLowerCase().includes(searchTerm)
    );

    if (userLat && userLng) {
      const hospitalsWithDistance = matchingHospitals
        .map(hospital => {
          const hospitalLat = parseFloat(hospital.latitude);
          const hospitalLng = parseFloat(hospital.longitude);
          
          if (isNaN(hospitalLat) || isNaN(hospitalLng)) {
            return { ...hospital, distance: undefined };
          }

          const distance = calculateDistance(userLat, userLng, hospitalLat, hospitalLng);
          return { ...hospital, distance };
        })
        .sort((a, b) => (a.distance || 999) - (b.distance || 999));

      return hospitalsWithDistance.slice(0, maxResults);
    }

    return matchingHospitals.slice(0, maxResults);
  }

  async getHospitalCapacity(): Promise<{
    totalBeds: number;
    availableBeds: number;
    totalVentilators: number;
    utilizationRate: number;
  }> {
    await this.loadHospitalData();

    const totalBeds = this.hospitals.reduce((sum, h) => sum + (h.beds || 0), 0);
    const availableBeds = this.hospitals.reduce((sum, h) => sum + (h.bedsAvailable || 0), 0);
    const totalVentilators = this.hospitals.reduce((sum, h) => sum + (h.ventilators || 0), 0);
    const utilizationRate = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;

    return {
      totalBeds,
      availableBeds,
      totalVentilators,
      utilizationRate
    };
  }
}

export const hospitalSearchService = new HospitalSearchService();
