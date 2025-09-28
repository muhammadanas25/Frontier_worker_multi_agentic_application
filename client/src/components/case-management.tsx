import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Clock, MapPin, Phone, User, CheckCircle, AlertTriangle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EmergencyCase } from "@shared/schema";

interface CaseManagementProps {
  cases: EmergencyCase[];
}

export default function CaseManagement({ cases }: CaseManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      status: "",
      resolutionNotes: ""
    }
  });

  const updateCase = useMutation({
    mutationFn: async ({ caseId, updates }: { caseId: string; updates: any }) => {
      const case_ = cases.find(c => c.caseId === caseId);
      if (!case_) throw new Error("Case not found");
      
      const response = await apiRequest("PATCH", `/api/emergency-cases/${case_.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Updated",
        description: "Case status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-cases-active"] });
      setSelectedCase(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update case. Please try again.",
        variant: "destructive",
      });
      console.error("Case update error:", error);
    }
  });

  const resolveCase = useMutation({
    mutationFn: async ({ caseId, resolutionNotes }: { caseId: string; resolutionNotes: string }) => {
      const response = await apiRequest("POST", `/api/cases/${caseId}/resolve`, { resolutionNotes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Case Resolved",
        description: "Case has been marked as resolved and notifications sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-cases-active"] });
      setSelectedCase(null);
    },
    onError: (error) => {
      toast({
        title: "Resolution Failed",
        description: "Failed to resolve case. Please try again.",
        variant: "destructive",
      });
      console.error("Case resolution error:", error);
    }
  });

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = searchQuery === "" || 
      case_.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.emergencyType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || statusFilter === "all" || case_.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
      case "high": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
      case "medium": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
      case "triaged": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200";
      case "assigned": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case "medical": return "🩺";
      case "crime": return "👮";
      case "fire": return "🚒";
      case "flood": return "🌊";
      case "earthquake": return "🏗️";
      case "urban": return "🏙️";
      case "public_safety": return "⚠️";
      default: return "📞";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const onSubmit = (data: any) => {
    if (!selectedCase) return;
    
    if (data.status === "resolved") {
      resolveCase.mutate({
        caseId: selectedCase.caseId,
        resolutionNotes: data.resolutionNotes || "Case resolved by frontline worker."
      });
    } else {
      updateCase.mutate({
        caseId: selectedCase.caseId,
        updates: { status: data.status }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center" data-testid="case-management-title">
          <User className="w-5 h-5 mr-2" />
          Case Management
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by Case ID, location, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            data-testid="input-search-cases"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="triaged">Triaged</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredCases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-cases-message">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No cases found</p>
            <p className="text-sm">
              {searchQuery || statusFilter 
                ? "Try adjusting your search criteria." 
                : "All cases have been resolved or no emergency cases have been submitted yet."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">Case ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Priority</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Assigned Service</th>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((case_, index) => (
                    <tr key={case_.id} className="border-b border-border hover:bg-secondary/50" data-testid={`case-row-${index}`}>
                      <td className="p-3">
                        <span className="font-mono font-medium" data-testid={`case-id-${index}`}>
                          {case_.caseId}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span>{getEmergencyIcon(case_.emergencyType)}</span>
                          <span className="capitalize" data-testid={`case-type-${index}`}>
                            {case_.emergencyType.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-32" data-testid={`case-location-${index}`}>
                            {case_.location}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getPriorityColor(case_.triageResults?.priority)} data-testid={`case-priority-${index}`}>
                          {case_.triageResults?.priority || case_.urgencyLevel}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(case_.status)} data-testid={`case-status-${index}`}>
                          {case_.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="max-w-32 truncate" data-testid={`case-service-${index}`}>
                          {case_.assignedService?.hospitalName || "Pending assignment"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs" data-testid={`case-time-${index}`}>
                            {formatTimeAgo(case_.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCase(case_);
                                form.setValue("status", case_.status);
                              }}
                              data-testid={`button-update-case-${index}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent data-testid="case-update-dialog">
                            <DialogHeader>
                              <DialogTitle>Update Case {case_.caseId}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="status"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-update-status">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="submitted">Submitted</SelectItem>
                                          <SelectItem value="triaged">Triaged</SelectItem>
                                          <SelectItem value="assigned">Assigned</SelectItem>
                                          <SelectItem value="in_progress">In Progress</SelectItem>
                                          <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                
                                {form.watch("status") === "resolved" && (
                                  <FormField
                                    control={form.control}
                                    name="resolutionNotes"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Resolution Notes</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Enter resolution details..."
                                            {...field}
                                            data-testid="textarea-resolution-notes"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <DialogTrigger asChild>
                                    <Button variant="outline" type="button" data-testid="button-cancel-update">
                                      Cancel
                                    </Button>
                                  </DialogTrigger>
                                  <Button 
                                    type="submit" 
                                    disabled={updateCase.isPending || resolveCase.isPending}
                                    data-testid="button-save-update"
                                  >
                                    {(updateCase.isPending || resolveCase.isPending) ? "Updating..." : "Update Case"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredCases.map((case_, index) => (
                <Card key={case_.id} className="border" data-testid={`case-card-mobile-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span>{getEmergencyIcon(case_.emergencyType)}</span>
                          <span className="font-mono font-medium" data-testid={`case-id-mobile-${index}`}>
                            {case_.caseId}
                          </span>
                        </div>
                        <Badge className={getPriorityColor(case_.triageResults?.priority)} data-testid={`case-priority-mobile-${index}`}>
                          {case_.triageResults?.priority || case_.urgencyLevel}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(case_.status)} data-testid={`case-status-mobile-${index}`}>
                        {case_.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`case-location-mobile-${index}`}>{case_.location}</span>
                      </div>
                      
                      {case_.assignedService?.hospitalName && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span data-testid={`case-service-mobile-${index}`}>{case_.assignedService.hospitalName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`case-time-mobile-${index}`}>{formatTimeAgo(case_.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedCase(case_);
                              form.setValue("status", case_.status);
                            }}
                            data-testid={`button-update-case-mobile-${index}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update Case
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
