import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Bed, Zap } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HospitalSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const { coordinates } = useGeolocation();

  const { data: hospitals, isLoading } = useQuery({
    queryKey: ["/api/hospitals/search", searchQuery, coordinates?.lat, coordinates?.lng, selectedSpecialty],
    enabled: searchQuery.length > 2 || selectedSpecialty.length > 0 || !!coordinates,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (coordinates) {
        params.append("lat", coordinates.lat.toString());
        params.append("lng", coordinates.lng.toString());
      }
      if (selectedSpecialty) params.append("specialty", selectedSpecialty);

      const response = await fetch(`/api/hospitals/search?${params.toString()}`);
      return response.json();
    },
  });

  const specialties = [
    { value: "emergency", label: "Emergency/Trauma" },
    { value: "cardiology", label: "Cardiology" },
    { value: "pediatric", label: "Pediatric" },
    { value: "surgical", label: "Surgical" },
    { value: "orthopedic", label: "Orthopedic" },
    { value: "gynecology", label: "Gynecology" },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4" data-testid="hospital-search-title">Find Nearest Hospital</h3>
        
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search by location or hospital name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-hospital-search"
          />
          
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger data-testid="select-specialty">
              <SelectValue placeholder="All specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All specialties</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Hospital Results */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))
            ) : hospitals && hospitals.length > 0 ? (
              hospitals.slice(0, 5).map((hospital: any, index: number) => (
                <div key={hospital.id || index} className="border border-border rounded-lg p-3" data-testid={`hospital-card-${index}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm" data-testid={`hospital-name-${index}`}>
                        {hospital.name}
                      </h4>
                      {hospital.distance && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span data-testid={`hospital-distance-${index}`}>
                            {hospital.distance < 1 
                              ? `${(hospital.distance * 1000).toFixed(0)} m` 
                              : `${hospital.distance.toFixed(1)} km`
                            } away
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        {hospital.bedsAvailable !== null && hospital.bedsAvailable !== undefined && (
                          <Badge 
                            variant={hospital.bedsAvailable > 0 ? "default" : "destructive"} 
                            className="text-xs"
                            data-testid={`hospital-beds-${index}`}
                          >
                            <Bed className="w-3 h-3 mr-1" />
                            Beds: {hospital.bedsAvailable || 0}
                          </Badge>
                        )}
                        {hospital.ventilators !== null && hospital.ventilators !== undefined && (
                          <Badge 
                            variant={hospital.ventilators > 0 ? "secondary" : "outline"} 
                            className="text-xs"
                            data-testid={`hospital-ventilators-${index}`}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Ventilators: {hospital.ventilators || 0}
                          </Badge>
                        )}
                      </div>
                      {hospital.speciality && (
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`hospital-specialty-${index}`}>
                          {hospital.speciality}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (hospital.contactNumber) {
                          window.open(`tel:${hospital.contactNumber}`);
                        } else {
                          window.open("tel:1122");
                        }
                      }}
                      data-testid={`button-contact-hospital-${index}`}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))
            ) : (searchQuery.length > 2 || selectedSpecialty) ? (
              <div className="text-center py-4 text-muted-foreground" data-testid="no-hospitals-found">
                <p>No hospitals found matching your criteria.</p>
                <p className="text-xs mt-1">Try adjusting your search or call 1122 for emergency assistance.</p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground" data-testid="search-prompt">
                <p>Enter a search term or location to find hospitals.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
