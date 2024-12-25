import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";
import { AlertCircle } from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

const REGIONS = [{ id: "WLD", name: "All" }];

const TIME_PERIODS = [
  { id: "1", name: "Last Year" },
  { id: "3", name: "Last 3 Years" },
  { id: "5", name: "Last 5 Years" },
];

export function ClimateEconomicImpact() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [climateEconData, setClimateEconData] = useState([]);
  const [processedData, setProcessedData] = useState({
    yearlyData: [],
    drilldownInfo: {},
  });
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].id);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[2].id);
  const [drilldownData, setDrilldownData] = useState(null);
  const [showDrilldown, setShowDrilldown] = useState(false);
  const { token } = useAuth();

  const processDocuments = (data) => {
    let documents = [];
    if (data.documents) {
      documents =
        typeof data.documents === "object"
          ? Object.values(data.documents)
          : data.documents;
    }

    const yearlyData = {};
    const drilldownInfo = {};

    documents.forEach((doc) => {
      const docDate = doc.docdt ? new Date(doc.docdt) : null;
      if (!docDate || isNaN(docDate.getTime())) {
        return;
      }

      const year = docDate.getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          documentCount: 0,
          riskMentions: 0,
          economicMentions: 0,
          mitigationMentions: 0,
        };

        drilldownInfo[year] = {
          documents: [],
          topTopics: new Map(),
          riskTypes: new Map(),
        };
      }

      yearlyData[year].documentCount++;
      drilldownInfo[year].documents.push({
        title: doc.display_title,
        topics: doc.teratopic?.split(",") || [],
        date: docDate.toLocaleDateString(),
        docType: doc.docty,
      });

      const allText = [
        doc.display_title,
        doc.teratopic,
        doc.subtopic,
        doc.docty,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (allText.includes("risk")) {
        yearlyData[year].riskMentions++;
        doc.subtopic?.split(",").forEach((topic) => {
          const count = drilldownInfo[year].riskTypes.get(topic) || 0;
          drilldownInfo[year].riskTypes.set(topic, count + 1);
        });
      }
      if (
        allText.includes("economic") ||
        allText.includes("gdp") ||
        allText.includes("growth")
      ) {
        yearlyData[year].economicMentions++;
      }
      if (allText.includes("mitigation") || allText.includes("adaptation")) {
        yearlyData[year].mitigationMentions++;
      }

      doc.teratopic?.split(",").forEach((topic) => {
        const trimmedTopic = topic.trim();
        const count = drilldownInfo[year].topTopics.get(trimmedTopic) || 0;
        drilldownInfo[year].topTopics.set(trimmedTopic, count + 1);
      });
    });

    return {
      yearlyData: Object.values(yearlyData).sort((a, b) => a.year - b.year),
      drilldownInfo,
    };
  };

  const handleDataPointClick = (data) => {
    if (data && data.year) {
      const yearData = processedData.drilldownInfo[data.year];
      if (yearData) {
        setDrilldownData({
          year: data.year,
          topTopics: Array.from(yearData.topTopics.entries())
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          riskTypes: Array.from(yearData.riskTypes.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          documents: yearData.documents,
        });
        setShowDrilldown(true);
      }
    }
  };

  const DrilldownContent = ({ data }) => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Topics Distribution ({data.year})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topTopics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="topic"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Number of Documents"
                    fill="hsl(var(--chart-2))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Categories ({data.year})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.riskTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Number of Mentions"
                    fill="hsl(var(--chart-3))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const endYear = new Date().getFullYear();
        const startYear = endYear - parseInt(selectedPeriod);

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/climate/documents?` +
            `topic=climate change&` +
            `admreg_exact=${selectedRegion}&` +
            `startYear=${startYear}&` +
            `endYear=${endYear}`,
          {
            headers: {
              ...api.setAuthHeader(token),
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch climate-economic data");
        }

        const data = await response.json();
        const processed = processDocuments(data);
        setClimateEconData(processed.yearlyData);
        setProcessedData(processed);
      } catch (err) {
        console.error("Error fetching climate-economic data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch climate-economic data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedRegion, selectedPeriod]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:flex sm:flex-wrap">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIODS.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                {period.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {climateEconData.length > 0 ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {climateEconData.reduce(
                        (sum, item) => sum + item.documentCount,
                        0,
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Economic Impact Mentions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {climateEconData.reduce(
                        (sum, item) => sum + item.economicMentions,
                        0,
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Risk Assessment Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        (climateEconData.reduce(
                          (sum, item) => sum + item.riskMentions,
                          0,
                        ) /
                          climateEconData.reduce(
                            (sum, item) => sum + item.documentCount,
                            0,
                          )) *
                          100,
                      )}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Climate-Economic Impact Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={climateEconData}
                        onClick={(data) => {
                          if (data && data.activePayload) {
                            handleDataPointClick(data.activePayload[0].payload);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="riskMentions"
                          name="Climate Risks"
                          fill="hsl(var(--chart-1))"
                          cursor="pointer"
                        />
                        <Line
                          type="monotone"
                          dataKey="economicMentions"
                          name="Economic Impacts"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="mitigationMentions"
                          name="Mitigation Measures"
                          fill="hsl(var(--chart-3) / 0.2)"
                          stroke="hsl(var(--chart-3))"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Distribution by Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={climateEconData}
                        onClick={(data) => {
                          if (data && data.activePayload) {
                            handleDataPointClick(data.activePayload[0].payload);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="documentCount"
                          name="Total Documents"
                          fill="hsl(var(--chart-4))"
                          cursor="pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No climate-economic impact data available for the selected
                criteria. Try adjusting your filters or selecting a different
                region.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      <Dialog open={showDrilldown} onOpenChange={setShowDrilldown}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detailed Analysis for {drilldownData?.year}
            </DialogTitle>
          </DialogHeader>
          <DrilldownContent data={drilldownData} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
