import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Heart, Phone, Zap, Users } from "lucide-react";
import EmergencyForm from "@/components/emergency-form";
import HospitalSearch from "@/components/hospital-search";
import AgentStatus from "@/components/agent-status";

export default function EmergencyRequest() {
  const [language, setLanguage] = useState<"en" | "ur">("en");
  const [degradedMode, setDegradedMode] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "ur" : "en");
  };

  const handleEmergencyCaseCreated = (caseId: string) => {
    setCurrentCaseId(caseId);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold" data-testid="app-title">Emergency Response AI</h1>
              </div>
              <span className="text-sm text-muted-foreground">Pakistan Emergency Services</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                data-testid="button-language-toggle"
              >
                {language === "en" ? "اردو | EN" : "EN | اردو"}
              </Button>
              
              {/* Degraded Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">SMS Mode</span>
                <Switch
                  checked={degradedMode}
                  onCheckedChange={setDegradedMode}
                  data-testid="switch-degraded-mode"
                />
              </div>
              
              {/* Emergency Hotlines */}
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <Badge variant="destructive" data-testid="badge-emergency">Emergency: 1122</Badge>
                <span className="text-muted-foreground">|</span>
                <Badge variant="secondary" data-testid="badge-police">Police: 15</Badge>
              </div>
              
              {/* Dashboard Link */}
              <Link href="/dashboard">
                <Button variant="outline" size="sm" data-testid="button-dashboard">
                  <Users className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Emergency Request Form */}
          <div className="lg:col-span-2">
            <EmergencyForm
              language={language}
              degradedMode={degradedMode}
              onCaseCreated={handleEmergencyCaseCreated}
            />

            {/* AI Agent Collaboration Display */}
            {currentCaseId && (
              <AgentStatus caseId={currentCaseId} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="destructive"
                    data-testid="button-rescue-1122"
                    onClick={() => window.open("tel:1122")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    🚨 Call Rescue 1122
                  </Button>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-police-15"
                    onClick={() => window.open("tel:15")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    👮 Police Helpline 15
                  </Button>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    data-testid="button-fire-16"
                    onClick={() => window.open("tel:16")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    🚒 Fire Brigade 16
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hospital Search */}
            <HospitalSearch />

            {/* Recent Cases Status */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100" data-testid="text-system-status">System Online</p>
                      <p className="text-xs text-green-700 dark:text-green-300">All agents operational</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100" data-testid="text-response-time">Avg Response Time</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">4.2 minutes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
