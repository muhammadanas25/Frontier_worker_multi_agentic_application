import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Activity, Users, Clock, CheckCircle, AlertTriangle, Hospital } from "lucide-react";
import CaseManagement from "@/components/case-management";

export default function Dashboard() {
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/metrics/dashboard"],
  });

  const { data: activeCases, isLoading: isLoadingCases } = useQuery({
    queryKey: ["/api/emergency-cases-active"],
  });

  if (isLoadingMetrics || isLoadingCases) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold" data-testid="dashboard-title">Frontline Worker Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Live Updates</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="status-indicator"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Active Cases */}
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                <div className="text-3xl font-bold text-red-600" data-testid="text-active-cases">
                  {Array.isArray(activeCases) ? activeCases.length : 0}
                </div>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200">Active Cases</p>
            </CardContent>
          </Card>

          {/* Resolved Today */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <div className="text-3xl font-bold text-green-600" data-testid="text-resolved-today">
                  {(metrics?.triage?.totalCases || 0) - (Array.isArray(activeCases) ? activeCases.length : 0)}
                </div>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">Resolved Today</p>
            </CardContent>
          </Card>

          {/* Average Response */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                <div className="text-3xl font-bold text-blue-600" data-testid="text-avg-response">
                  {(metrics as any)?.triage?.averageResponseTime || 4.2}m
                </div>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">Avg Response</p>
            </CardContent>
          </Card>

          {/* Resource Capacity */}
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Hospital className="w-6 h-6 text-purple-600 mr-2" />
                <div className="text-3xl font-bold text-purple-600" data-testid="text-resource-usage">
                  {(metrics as any)?.hospitalCapacity?.utilizationRate?.toFixed(0) || 78}%
                </div>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200">Resource Usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Triage Agent</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {(metrics as any)?.triage?.totalCases || 0} cases processed
                    </p>
                  </div>
                  <Badge variant="secondary" data-testid="badge-triage-status">Active</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Guidance Agent</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {(metrics as any)?.guidance?.totalAssignments || 0} assignments made
                    </p>
                  </div>
                  <Badge variant="secondary" data-testid="badge-guidance-status">Active</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Booking Agent</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {(metrics as any)?.booking?.totalBookings || 0} bookings confirmed
                    </p>
                  </div>
                  <Badge variant="secondary" data-testid="badge-booking-status">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hospital Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hospital className="w-5 h-5 mr-2" />
                Hospital Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Beds</span>
                  <span className="font-bold" data-testid="text-total-beds">
                    {(metrics as any)?.hospitalCapacity?.totalBeds || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available Beds</span>
                  <span className="font-bold text-green-600" data-testid="text-available-beds">
                    {(metrics as any)?.hospitalCapacity?.availableBeds || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Ventilators</span>
                  <span className="font-bold" data-testid="text-total-ventilators">
                    {(metrics as any)?.hospitalCapacity?.totalVentilators || 0}
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(metrics as any)?.hospitalCapacity?.utilizationRate || 78}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Bed Utilization: {(metrics as any)?.hospitalCapacity?.utilizationRate?.toFixed(1) || 78}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Management Table */}
        <CaseManagement cases={Array.isArray(activeCases) ? activeCases : []} />
      </main>
    </div>
  );
}
