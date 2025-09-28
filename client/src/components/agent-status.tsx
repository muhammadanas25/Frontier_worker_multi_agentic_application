import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, Bot, MapPin, Calendar, MessageSquare } from "lucide-react";

interface AgentStatusProps {
  caseId: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "waiting" | "processing" | "complete" | "error";
  progress: number;
  completedAt?: string;
  result?: string;
}

export default function AgentStatus({ caseId }: AgentStatusProps) {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "triage",
      name: "Triage Agent",
      description: "Analyzing case urgency and priority...",
      icon: <Bot className="w-6 h-6 text-blue-600" />,
      status: "processing",
      progress: 0
    },
    {
      id: "guidance",
      name: "Guidance Agent", 
      description: "Finding nearest appropriate service...",
      icon: <MapPin className="w-6 h-6 text-green-600" />,
      status: "waiting",
      progress: 0
    },
    {
      id: "booking",
      name: "Booking Agent",
      description: "Will handle appointment booking...",
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
      status: "waiting",
      progress: 0
    },
    {
      id: "followup",
      name: "Follow-up Agent",
      description: "Will provide status updates...",
      icon: <MessageSquare className="w-6 h-6 text-orange-600" />,
      status: "waiting", 
      progress: 0
    }
  ]);

  // Query for case details to track progress
  const { data: emergencyCase, isLoading } = useQuery({
    queryKey: ["/api/emergency-cases/case-id", caseId],
    enabled: !!caseId,
    refetchInterval: 3000, // Poll every 3 seconds for updates
  });

  // Query for case updates to show agent progress
  const { data: caseUpdates } = useQuery({
    queryKey: ["/api/case-updates", caseId],
    enabled: !!caseId,
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  // Update agent status based on case data
  useEffect(() => {
    if (!emergencyCase) return;

    setAgents(prevAgents => {
      const newAgents = [...prevAgents];
      
      // Update based on case status
      switch ((emergencyCase as any)?.status) {
        case "submitted":
          newAgents[0].status = "processing";
          newAgents[0].progress = 25;
          break;
          
        case "triaged":
          newAgents[0].status = "complete";
          newAgents[0].progress = 100;
          newAgents[0].completedAt = new Date().toLocaleTimeString();
          newAgents[0].result = `Priority: ${(emergencyCase as any)?.triageResults?.priority}`;
          newAgents[1].status = "processing";
          newAgents[1].progress = 30;
          break;
          
        case "assigned":
          newAgents[0].status = "complete";
          newAgents[0].progress = 100;
          newAgents[1].status = "complete";
          newAgents[1].progress = 100;
          newAgents[1].completedAt = new Date().toLocaleTimeString();
          newAgents[1].result = `Assigned: ${(emergencyCase as any)?.assignedService?.hospitalName}`;
          newAgents[2].status = "processing";
          newAgents[2].progress = 50;
          break;
          
        case "in_progress":
          newAgents[0].status = "complete";
          newAgents[0].progress = 100;
          newAgents[1].status = "complete";
          newAgents[1].progress = 100;
          newAgents[2].status = "complete";
          newAgents[2].progress = 100;
          newAgents[2].completedAt = new Date().toLocaleTimeString();
          newAgents[2].result = `Appointment: ${(emergencyCase as any)?.bookingDetails?.appointmentTime}`;
          newAgents[3].status = "processing";
          newAgents[3].progress = 75;
          break;
          
        case "resolved":
          newAgents.forEach((agent, index) => {
            agent.status = "complete";
            agent.progress = 100;
            if (!agent.completedAt) {
              agent.completedAt = new Date().toLocaleTimeString();
            }
          });
          break;
      }
      
      return newAgents;
    });
  }, [emergencyCase]);

  // Simulate progress animation for processing agents
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          if (agent.status === "processing" && agent.progress < 90) {
            return { ...agent, progress: agent.progress + Math.random() * 10 };
          }
          return agent;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "processing":
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200" data-testid="badge-complete">Complete</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 animate-pulse" data-testid="badge-processing">Processing</Badge>;
      case "error":
        return <Badge variant="destructive" data-testid="badge-error">Error</Badge>;
      default:
        return <Badge variant="secondary" data-testid="badge-waiting">Waiting</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">AI Agents Processing Your Request</h3>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-secondary rounded-lg">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8" data-testid="agent-status-card">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4" data-testid="agent-status-title">
          AI Agents Processing Your Request
        </h3>
        
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                agent.status === "processing" 
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
                  : agent.status === "complete"
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-secondary"
              }`}
              data-testid={`agent-card-${agent.id}`}
            >
              {/* Agent Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                agent.status === "processing" 
                  ? "bg-blue-100 dark:bg-blue-900/30" 
                  : agent.status === "complete"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}>
                {agent.icon}
              </div>

              {/* Agent Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium" data-testid={`agent-name-${agent.id}`}>
                    {agent.name}
                  </h4>
                  {getStatusIcon(agent.status)}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1" data-testid={`agent-description-${agent.id}`}>
                  {agent.status === "complete" && agent.result ? agent.result : agent.description}
                </p>

                {/* Progress Bar */}
                {(agent.status === "processing" || agent.status === "complete") && (
                  <div className="mt-2">
                    <Progress 
                      value={agent.progress} 
                      className="h-2"
                      data-testid={`agent-progress-${agent.id}`}
                    />
                  </div>
                )}

                {/* Completion Time */}
                {agent.completedAt && (
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`agent-completed-${agent.id}`}>
                    Completed at {agent.completedAt}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div data-testid={`agent-status-${agent.id}`}>
                {getStatusBadge(agent.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Latest Updates */}
        {Array.isArray(caseUpdates) && caseUpdates.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-medium mb-3" data-testid="latest-updates-title">Latest Updates</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Array.isArray(caseUpdates) && caseUpdates.slice(0, 3).map((update: any, index: number) => (
                <div 
                  key={update.id} 
                  className="text-sm p-2 bg-muted rounded text-muted-foreground"
                  data-testid={`update-${index}`}
                >
                  <span className="font-medium capitalize">{update.agentType.replace('_', ' ')}: </span>
                  {update?.message || 'Update message not available'}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
