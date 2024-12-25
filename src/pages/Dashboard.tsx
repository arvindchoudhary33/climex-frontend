import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentAnalysis } from "../components/WorldBankDashboard";
import { TemperatureAnalysis } from "../components/dashboard/TemperatureAnalysis";
import { AuthLayout } from "../components/AuthLayout";

export function Dashboard() {
  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Climate Risk Dashboard
        </h1>
        <div className="rounded-lg bg-white p-4 md:p-8 shadow">
          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="documents">Document Analysis</TabsTrigger>
              <TabsTrigger value="temperature">
                Temperature Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <DocumentAnalysis />
            </TabsContent>

            <TabsContent value="temperature">
              <TemperatureAnalysis />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthLayout>
  );
}
