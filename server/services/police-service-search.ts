import { calculateDistance } from '../utils/distance';

export interface PoliceService {
  id: string;
  stationName: string;
  city: string;
  area: string;
  latitude: string;
  longitude: string;
  contactNumber: string;
  policeHelpline: string;
  specializations: string[];
  status: 'active' | 'busy' | 'unavailable';
  distance?: number;
}

class PoliceServiceSearch {
  private policeServices: PoliceService[] = [];
  private loaded = false;

  async loadData() {
    if (this.loaded) return;

    try {
      // For now, using predefined police stations data for major Pakistan cities
      // In production, this should load from a CSV or database
      this.policeServices = [
        // Karachi Police Stations
        {
          id: 'police_001',
          stationName: 'Karachi City Police Station',
          city: 'Karachi',
          area: 'City Center',
          latitude: '24.8607',
          longitude: '67.0011',
          contactNumber: '021-99261000',
          policeHelpline: '15',
          specializations: ['General Crime', 'Theft', 'Burglary', 'Violence'],
          status: 'active'
        },
        {
          id: 'police_002',
          stationName: 'Clifton Police Station',
          city: 'Karachi',
          area: 'Clifton',
          latitude: '24.8138',
          longitude: '67.0299',
          contactNumber: '021-35830039',
          policeHelpline: '15',
          specializations: ['Crime Investigation', 'Fraud', 'Cyber Crime'],
          status: 'active'
        },
        {
          id: 'police_003',
          stationName: 'Gulshan-e-Iqbal Police Station',
          city: 'Karachi',
          area: 'Gulshan-e-Iqbal',
          latitude: '24.9207',
          longitude: '67.0982',
          contactNumber: '021-34964320',
          policeHelpline: '15',
          specializations: ['General Crime', 'Domestic Violence', 'Robbery'],
          status: 'active'
        },
        // Lahore Police Stations
        {
          id: 'police_004',
          stationName: 'Lahore Central Police Station',
          city: 'Lahore',
          area: 'City Center',
          latitude: '31.5804',
          longitude: '74.3587',
          contactNumber: '042-99201045',
          policeHelpline: '15',
          specializations: ['General Crime', 'Traffic', 'Public Safety'],
          status: 'active'
        },
        {
          id: 'police_005',
          stationName: 'Model Town Police Station',
          city: 'Lahore',
          area: 'Model Town',
          latitude: '31.4802',
          longitude: '74.3441',
          contactNumber: '042-35165040',
          policeHelpline: '15',
          specializations: ['Crime Investigation', 'White Collar Crime'],
          status: 'active'
        },
        {
          id: 'police_006',
          stationName: 'Gulberg Police Station',
          city: 'Lahore',
          area: 'Gulberg',
          latitude: '31.5052',
          longitude: '74.3441',
          contactNumber: '042-35714304',
          policeHelpline: '15',
          specializations: ['General Crime', 'Theft', 'Business Crime'],
          status: 'active'
        },
        // Islamabad Police Stations
        {
          id: 'police_007',
          stationName: 'Islamabad Central Police Station',
          city: 'Islamabad',
          area: 'Blue Area',
          latitude: '33.7077',
          longitude: '73.0563',
          contactNumber: '051-9252314',
          policeHelpline: '15',
          specializations: ['General Crime', 'VIP Security', 'Federal Crime'],
          status: 'active'
        },
        {
          id: 'police_008',
          stationName: 'Shalimar Police Station',
          city: 'Islamabad',
          area: 'Shalimar',
          latitude: '33.6844',
          longitude: '73.0479',
          contactNumber: '051-4435404',
          policeHelpline: '15',
          specializations: ['Crime Investigation', 'Robbery', 'Violence'],
          status: 'active'
        },
        // Peshawar Police Stations
        {
          id: 'police_009',
          stationName: 'Peshawar City Police Station',
          city: 'Peshawar',
          area: 'City Center',
          latitude: '34.0151',
          longitude: '71.5249',
          contactNumber: '091-9213444',
          policeHelpline: '15',
          specializations: ['General Crime', 'Terrorism Prevention', 'Border Security'],
          status: 'active'
        },
        {
          id: 'police_010',
          stationName: 'University Town Police Station',
          city: 'Peshawar',
          area: 'University Town',
          latitude: '34.0048',
          longitude: '71.5611',
          contactNumber: '091-9216789',
          policeHelpline: '15',
          specializations: ['Student Safety', 'Academic Crime', 'General Crime'],
          status: 'active'
        },
        // Multan Police Stations
        {
          id: 'police_011',
          stationName: 'Multan City Police Station',
          city: 'Multan',
          area: 'City Center',
          latitude: '30.1575',
          longitude: '71.5249',
          contactNumber: '061-9201234',
          policeHelpline: '15',
          specializations: ['General Crime', 'Rural Crime', 'Agriculture Crime'],
          status: 'active'
        },
        // Quetta Police Stations
        {
          id: 'police_012',
          stationName: 'Quetta Central Police Station',
          city: 'Quetta',
          area: 'City Center',
          latitude: '30.1798',
          longitude: '66.9750',
          contactNumber: '081-2414142',
          policeHelpline: '15',
          specializations: ['General Crime', 'Tribal Affairs', 'Border Security'],
          status: 'active'
        }
      ];

      this.loaded = true;
      console.log(`Loaded ${this.policeServices.length} police services`);
    } catch (error) {
      console.error('Error loading police services:', error);
      this.loaded = true;
    }
  }

  async searchNearestServices(
    lat: number, 
    lng: number, 
    maxResults: number = 5, 
    maxDistanceKm: number = 30,
    crimeType?: string
  ): Promise<PoliceService[]> {
    await this.loadData();

    let filteredServices = this.policeServices.filter(service => service.status === 'active');

    // Filter by crime specialization if provided
    if (crimeType) {
      const crimeSpecializationMap: { [key: string]: string[] } = {
        'theft': ['Theft', 'Burglary', 'General Crime'],
        'burglary': ['Burglary', 'Theft', 'General Crime'],
        'robbery': ['Robbery', 'Violence', 'General Crime'],
        'violence': ['Violence', 'Domestic Violence', 'General Crime'],
        'fraud': ['Fraud', 'White Collar Crime', 'Cyber Crime'],
        'cybercrime': ['Cyber Crime', 'Fraud', 'White Collar Crime'],
        'domestic': ['Domestic Violence', 'Violence', 'General Crime']
      };
      
      const relevantSpecs = crimeSpecializationMap[crimeType.toLowerCase()];
      if (relevantSpecs) {
        filteredServices = filteredServices.filter(service => 
          relevantSpecs.some(spec => 
            service.specializations.some(s => s.toLowerCase().includes(spec.toLowerCase()))
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

  async searchByCity(city: string, maxResults: number = 5): Promise<PoliceService[]> {
    await this.loadData();
    
    const cityServices = this.policeServices
      .filter(service => 
        service.city.toLowerCase().includes(city.toLowerCase()) &&
        service.status === 'active'
      )
      .slice(0, maxResults);

    return cityServices;
  }

  async searchBySpecialization(specialization: string, maxResults: number = 5): Promise<PoliceService[]> {
    await this.loadData();
    
    const specServices = this.policeServices
      .filter(service => 
        service.specializations.some(spec => 
          spec.toLowerCase().includes(specialization.toLowerCase())
        ) && service.status === 'active'
      )
      .slice(0, maxResults);

    return specServices;
  }
}

export const policeServiceSearch = new PoliceServiceSearch();