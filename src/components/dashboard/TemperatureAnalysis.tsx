import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Label,
} from "recharts";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";

const CITIES = [
  { id: "CITY:US370001", name: "New York, US" },
  { id: "CITY:US060001", name: "Los Angeles, US" },
  { id: "CITY:US170001", name: "Chicago, US" },
];

const TIME_PERIODS = [
  { id: "90", name: "Last 3 Months" },
  { id: "180", name: "Last 6 Months" },
  { id: "365", name: "Last Year" },
];

export function ClimateEconomicAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [combinedData, setCombinedData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(CITIES[0].id);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS[1].id);
  const { token } = useAuth();

  const processDocuments = (documents = {}) => {
    return Object.values(documents).map((doc) => {
      const keywords = [
        "economic growth",
        "gdp",
        "economy",
        "financial",
        "market",
        "investment",
        "development",
      ];

      const text = [doc.display_title, doc.teratopic, doc.subtopic]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const economicScore =
        (keywords.reduce((score, keyword) => {
          return score + (text.includes(keyword) ? 1 : 0);
        }, 0) /
          keywords.length) *
        100;

      return {
        date: new Date(doc.docdt),
        economicScore,
        topics: doc.teratopic?.split(",") || [],
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(selectedPeriod));

        const formattedStartDate = startDate.toISOString().split("T")[0];
        const formattedEndDate = endDate.toISOString().split("T")[0];

        const tempResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/climate/temperature?` +
            `locationId=${selectedCity}&` +
            `startdate=${formattedStartDate}&` +
            `enddate=${formattedEndDate}&` +
            `datatypeid=TMAX`,
          {
            headers: { ...api.setAuthHeader(token) },
          },
        );

        const docResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/climate/documents?` +
            `topic=climate change AND economic&` +
            `startYear=${startDate.getFullYear()}&` +
            `endYear=${endDate.getFullYear()}`,
          {
            headers: { ...api.setAuthHeader(token) },
          },
        );

        if (!tempResponse.ok || !docResponse.ok) {
          const errorResponse = !tempResponse.ok
            ? await tempResponse.json()
            : await docResponse.json();

          throw new Error(
            errorResponse?.developerMessage ||
              errorResponse?.userMessage ||
              "Failed to fetch data",
          );
        }

        const [tempData, docData] = await Promise.all([
          tempResponse.json(),
          docResponse.json(),
        ]);

        if (!tempData.results?.length) {
          throw new Error(
            "No temperature data available for the selected criteria",
          );
        }

        if (!docData.documents || Object.keys(docData.documents).length === 0) {
          throw new Error(
            "No economic data available for the selected criteria",
          );
        }

        const economicData = processDocuments(docData.documents);

        const combined = tempData.results
          .map((temp) => {
            const tempDate = new Date(temp.date);
            const monthEconomicData = economicData.filter(
              (eco) =>
                eco.date.getMonth() === tempDate.getMonth() &&
                eco.date.getFullYear() === tempDate.getFullYear(),
            );

            const avgEconomicScore = monthEconomicData.length
              ? monthEconomicData.reduce(
                  (sum, eco) => sum + eco.economicScore,
                  0,
                ) / monthEconomicData.length
              : null;

            return {
              date: temp.date,
              temperature: parseFloat(temp.value),
              economicScore: avgEconomicScore,
              month: tempDate.toLocaleString("default", { month: "short" }),
              year: tempDate.getFullYear(),
              unit: "°C",
            };
          })
          .filter((d) => d.economicScore !== null)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (!combined.length) {
          throw new Error("No matching data points found for analysis");
        }

        setCombinedData(combined);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
        setCombinedData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedCity, selectedPeriod]);

  const correlation =
    combinedData.length >= 2 ? calculateCorrelation(combinedData) : 0;

  function calculateCorrelation(data) {
    const temps = data.map((d) => d.temperature);
    const scores = data.map((d) => d.economicScore);

    const tempMean = temps.reduce((a, b) => a + b) / temps.length;
    const scoreMean = scores.reduce((a, b) => a + b) / scores.length;

    const numerator = temps.reduce(
      (sum, temp, i) => sum + (temp - tempMean) * (scores[i] - scoreMean),
      0,
    );

    const tempStdDev = Math.sqrt(
      temps.reduce((sum, temp) => sum + Math.pow(temp - tempMean, 2), 0),
    );

    const scoreStdDev = Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - scoreMean, 2), 0),
    );

    return numerator / (tempStdDev * scoreStdDev);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:flex sm:flex-wrap">
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
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

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Temperature-Economic Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">
                  {(correlation * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Correlation between temperature changes and economic
                  indicators
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Economic Documents Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">
                  {combinedData.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Number of climate-economic documents analyzed
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Temperature and Economic Indicators Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={Math.ceil(combinedData.length / 15)}
                    />
                    <YAxis yAxisId="temp">
                      <Label
                        value="Temperature (°C)"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <YAxis yAxisId="eco" orientation="right">
                      <Label
                        value="Economic Impact Score"
                        angle={90}
                        position="insideRight"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperature"
                      stroke="hsl(var(--chart-1))"
                      name="Temperature"
                    />
                    <Line
                      yAxisId="eco"
                      type="monotone"
                      dataKey="economicScore"
                      stroke="hsl(var(--chart-2))"
                      name="Economic Impact Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temperature vs Economic Impact Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis
                      dataKey="temperature"
                      name="Temperature"
                      label={{ value: "Temperature (°C)", position: "bottom" }}
                    />
                    <YAxis
                      dataKey="economicScore"
                      name="Economic Impact Score"
                      label={{
                        value: "Economic Impact Score",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter
                      name="Temperature-Economic Correlation"
                      data={combinedData}
                      fill="hsl(var(--chart-3))"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  • Temperature changes show a{" "}
                  {correlation > 0 ? "positive" : "negative"} correlation with
                  economic indicators (
                  {(Math.abs(correlation) * 100).toFixed(1)}% strength)
                </p>
                <p className="text-sm text-muted-foreground">
                  • Analysis based on {combinedData.length} data points from
                  World Bank climate-economic documents
                </p>
                <p className="text-sm text-muted-foreground">
                  • Correlation strength is{" "}
                  {Math.abs(correlation) > 0.7
                    ? "strong"
                    : Math.abs(correlation) > 0.4
                      ? "moderate"
                      : "weak"}
                  , suggesting{" "}
                  {Math.abs(correlation) > 0.7
                    ? "significant"
                    : Math.abs(correlation) > 0.4
                      ? "moderate"
                      : "limited"}{" "}
                  economic impact from temperature variations
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
