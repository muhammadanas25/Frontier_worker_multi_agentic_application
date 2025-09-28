import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmergencyCaseSchema } from "@shared/schema";
import type { InsertEmergencyCase } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useGeolocation } from "@/hooks/use-geolocation";

interface EmergencyFormProps {
  language: "en" | "ur";
  degradedMode: boolean;
  onCaseCreated: (caseId: string) => void;
}

export default function EmergencyForm({ language, degradedMode, onCaseCreated }: EmergencyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { coordinates, isLoading: isLoadingLocation, error: locationError, requestLocation } = useGeolocation();
  const [generatedCaseId] = useState(() => `C-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`);

  const form = useForm<InsertEmergencyCase>({
    resolver: zodResolver(insertEmergencyCaseSchema),
    defaultValues: {
      emergencyType: undefined,
      description: "",
      location: "",
      coordinates: undefined,
      phoneNumber: "",
      urgencyLevel: undefined,
      language,
      degradedMode,
    },
  });

  const createEmergencyCase = useMutation({
    mutationFn: async (data: InsertEmergencyCase) => {
      const response = await apiRequest("POST", "/api/emergency-cases", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Emergency Request Submitted",
        description: `Case ID: ${data.caseId}. AI agents are processing your request.`,
      });
      onCaseCreated(data.caseId);
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-cases"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit emergency request. Please try again or call 1122.",
        variant: "destructive",
      });
      console.error("Emergency case creation error:", error);
    },
  });

  const onSubmit = (data: InsertEmergencyCase) => {
    const submissionData = {
      ...data,
      coordinates: coordinates || undefined,
      language,
      degradedMode,
    };
    createEmergencyCase.mutate(submissionData);
  };

  const emergencyTypes = [
    { value: "medical", label: "🩺 Medical Emergency", labelUr: "طبی ایمرجنسی" },
    { value: "crime", label: "👮 Crime Report", labelUr: "جرم کی رپورٹ" },
    { value: "fire", label: "🚒 Fire Emergency", labelUr: "آگ کی ایمرجنسی" },
    { value: "flood", label: "🌊 Flood Evacuation", labelUr: "سیلاب کی انخلاء" },
    { value: "earthquake", label: "🏗️ Earthquake Response", labelUr: "زلزلے کا جواب" },
    { value: "urban", label: "🏙️ Urban Services", labelUr: "شہری خدمات" },
    { value: "public_safety", label: "⚠️ Public Safety", labelUr: "عوامی تحفظ" }
  ];

  const urgencyLevels = [
    { value: "critical", label: "🔴 Critical - Life threatening", labelUr: "انتہائی خطرناک - جان کو خطرہ" },
    { value: "high", label: "🟡 High - Urgent attention needed", labelUr: "زیادہ - فوری توجہ درکار" },
    { value: "medium", label: "🟢 Medium - Can wait some time", labelUr: "درمیانہ - کچھ وقت انتظار ہو سکتا ہے" }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <h2 className="text-2xl font-bold" data-testid="form-title">
            {language === "en" ? "Submit Emergency Request" : "ایمرجنسی درخواست جمع کرائیں"}
          </h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Case ID Display */}
            <div className="bg-secondary p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === "en" ? "Case ID:" : "کیس ID:"}
                </span>
                <Badge variant="outline" className="font-mono font-bold text-lg" data-testid="text-case-id">
                  {generatedCaseId}
                </Badge>
              </div>
            </div>

            {/* Emergency Type */}
            <FormField
              control={form.control}
              name="emergencyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-emergency-type">
                    {language === "en" ? "Emergency Type" : "ایمرجنسی کی قسم"}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-emergency-type">
                        <SelectValue placeholder={
                          language === "en" ? "Select emergency type..." : "ایمرجنسی کی قسم منتخب کریں..."
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emergencyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === "en" ? type.label : type.labelUr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-location">
                    {language === "en" ? "Your Location" : "آپ کا مقام"}
                  </FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input
                        placeholder={
                          language === "en" 
                            ? "Enter your current location or area" 
                            : "اپنا موجودہ مقام یا علاقہ درج کریں"
                        }
                        {...field}
                        data-testid="input-location"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={requestLocation}
                      disabled={isLoadingLocation}
                      data-testid="button-get-location"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                  {coordinates && (
                    <p className="text-xs text-muted-foreground" data-testid="text-coordinates">
                      {language === "en" ? "Location detected:" : "مقام کا پتہ چل گیا:"} {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                    </p>
                  )}
                  {locationError && (
                    <p className="text-xs text-destructive" data-testid="text-location-error">
                      {language === "en" ? "Location access denied" : "مقام تک رسائی مسترد"}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emergency Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-description">
                    {language === "en" ? "Describe Your Emergency" : "اپنی ایمرجنسی کی تفصیل"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        language === "en"
                          ? "Describe what happened... (آپ کا کیا مسئلہ ہے اس کی تفصیل لکھیں)"
                          : "کیا ہوا اس کی تفصیل لکھیں... (You can write in English or Roman Urdu)"
                      }
                      className="h-32"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {language === "en" 
                      ? "You can write in English or Roman Urdu" 
                      : "آپ انگریزی یا رومن اردو میں لکھ سکتے ہیں"
                    }
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-phone">
                      {language === "en" ? "Phone Number" : "فون نمبر"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+92 300 1234567"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-urgency">
                      {language === "en" ? "Urgency Level" : "فوریت کی سطح"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-urgency">
                          <SelectValue placeholder={
                            language === "en" ? "Select urgency..." : "فوریت منتخب کریں..."
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {urgencyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {language === "en" ? level.label : level.labelUr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Degraded Mode Warning */}
            {degradedMode && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200" data-testid="text-degraded-mode-warning">
                  📱 {language === "en" 
                    ? "SMS Mode: Essential contact numbers will be sent to your phone." 
                    : "SMS موڈ: ضروری رابطہ نمبرز آپ کے فون پر بھیجے جائیں گے۔"
                  }
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createEmergencyCase.isPending}
              data-testid="button-submit-emergency"
            >
              {createEmergencyCase.isPending ? (
                language === "en" ? "Submitting..." : "جمع کر رہے ہیں..."
              ) : (
                language === "en" ? "🚨 Submit Emergency Request" : "🚨 ایمرجنسی درخواست جمع کریں"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
