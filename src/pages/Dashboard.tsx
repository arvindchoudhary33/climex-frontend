import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentAnalysis } from "../components/WorldBankDashboard";
import { ClimateEconomicAnalysis } from "../components/dashboard/TemperatureAnalysis";
import { ClimateEconomicImpact } from "../components/dashboard/ClimateEconomicImpact";
import { AuthLayout } from "../components/AuthLayout";

export function Dashboard() {
  return (
    <AuthLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Climate Risk Dashboard
        </h1>
        <div className="rounded-lg bg-white dark:bg-black p-4 md:p-8 shadow">
          <Tabs defaultValue="economic" className="space-y-4">
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="px-4 md:px-0">
                <TabsList className="h-auto inline-flex flex-wrap md:flex-nowrap w-auto min-w-full md:w-auto gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="economic"
                    className="flex-1 md:flex-none whitespace-normal text-center h-auto py-2 px-3 data-[state=active]:text-primary"
                  >
                    <span className="block text-sm">
                      Climate-Economic Impact
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="flex-1 md:flex-none whitespace-normal text-center h-auto py-2 px-3 data-[state=active]:text-primary"
                  >
                    <span className="block text-sm">Document Analysis</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="temperature"
                    className="flex-1 md:flex-none whitespace-normal text-center h-auto py-2 px-3 data-[state=active]:text-primary"
                  >
                    <span className="block text-sm">Temperature Analysis</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="documents" className="mt-6">
              <DocumentAnalysis />
            </TabsContent>
            <TabsContent value="temperature" className="mt-6">
              <ClimateEconomicAnalysis />
            </TabsContent>
            <TabsContent value="economic" className="mt-6">
              <ClimateEconomicImpact />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthLayout>
  );
}
