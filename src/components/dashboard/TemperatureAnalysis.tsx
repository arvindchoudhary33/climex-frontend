import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  LineChart,
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
import { AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const TEMPERATURE_TYPES = [
  { id: "TMAX", name: "Maximum Temperature" },
  { id: "TMIN", name: "Minimum Temperature" },
];

const CITIES = [
  { id: "CITY:US370001", name: "New York, US" },
  { id: "CITY:US060001", name: "Los Angeles, US" },
  { id: "CITY:US170001", name: "Chicago, US" },
];

const TIME_RANGES = [
  { id: "7", name: "Last 7 Days" },
  { id: "30", name: "Last 30 Days" },
  { id: "90", name: "Last 90 Days" },
];

interface TemperatureDataPoint {
  date: string;
  rawDate: Date;
  value: number;
  unit: string;
}

export function TemperatureAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temperatureData, setTemperatureData] = useState<
    TemperatureDataPoint[]
  >([]);
  const [selectedCity, setSelectedCity] = useState(CITIES[0].id);
  const [selectedType, setSelectedType] = useState(TEMPERATURE_TYPES[0].id);
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[2].id);
  const { token } = useAuth();

  const fetchWithRetry = async (
    url: string,
    headers: any,
    retryCount = 0,
  ): Promise<any> => {
    try {
      const response = await fetch(url, { headers });

      if (response.status === 503) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return fetchWithRetry(url, headers, retryCount + 1);
        }
        throw new Error(
          "Service is temporarily unavailable. Please try again later.",
        );
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, headers, retryCount + 1);
      }
      throw err;
    }
  };

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedRange));

      const formattedEndDate = endDate.toISOString().split("T")[0];
      const formattedStartDate = startDate.toISOString().split("T")[0];

      const url =
        `http://localhost:8000/api/v1/climate/temperature?` +
        `locationId=${selectedCity}&` +
        `datatypeid=${selectedType}&` +
        `startdate=${formattedStartDate}&` +
        `enddate=${formattedEndDate}&` +
        `units=metric`;

      console.log("Fetching temperature data:", url);

      const data = await fetchWithRetry(url, {
        ...api.setAuthHeader(token),
      });

      if (!data?.results?.length) {
        setTemperatureData([]);
        return;
      }

      const processedData = data.results
        .map((item: any) => ({
          date: new Date(item.date).toLocaleDateString(),
          rawDate: new Date(item.date),
          value: parseFloat(item.value),
          unit: item.unit || "°C",
        }))
        .sort((a: any, b: any) => a.rawDate - b.rawDate);

      setTemperatureData(processedData);
    } catch (err) {
      console.error("Error fetching temperature data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch temperature data",
      );
      setTemperatureData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, selectedCity, selectedType, selectedRange]);

  const stats = temperatureData.length
    ? {
        average:
          temperatureData.reduce((sum, item) => sum + item.value, 0) /
          temperatureData.length,
        max: Math.max(...temperatureData.map((item) => item.value)),
        min: Math.min(...temperatureData.map((item) => item.value)),
      }
    : { average: 0, max: 0, min: 0 };

  const weeklyData = temperatureData.reduce((acc: any[], item) => {
    const weekNum = Math.floor(
      item.rawDate.getTime() / (7 * 24 * 60 * 60 * 1000),
    );
    const existingWeek = acc.find((w) => w.weekNum === weekNum);
    if (existingWeek) {
      existingWeek.values.push(item.value);
      existingWeek.avgValue =
        existingWeek.values.reduce((sum: number, v: number) => sum + v, 0) /
        existingWeek.values.length;
    } else {
      acc.push({
        weekNum,
        weekStart: item.date,
        values: [item.value],
        avgValue: item.value,
      });
    }
    return acc;
  }, []);

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

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select measurement" />
          </SelectTrigger>
          <SelectContent>
            {TEMPERATURE_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRange} onValueChange={setSelectedRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.id} value={range.id}>
                {range.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.average.toFixed(1)}°C
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Maximum Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.max.toFixed(1)}°C</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Minimum Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.min.toFixed(1)}°C</div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!loading && temperatureData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Daily Temperature Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={Math.ceil(temperatureData.length / 15)}
                    />
                    <YAxis
                      label={{
                        value: "Temperature (°C)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Temperature"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temperature Range Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={Math.ceil(temperatureData.length / 15)}
                    />
                    <YAxis
                      label={{
                        value: "Temperature (°C)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="value"
                      fill="hsl(var(--chart-2) / 0.2)"
                      stroke="hsl(var(--chart-2))"
                      name="Temperature Range"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-3))"
                      dot={false}
                      name="Temperature Trend"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {weeklyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Temperature Averages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="weekStart"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        label={{
                          value: "Average Temperature (°C)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="avgValue"
                        fill="hsl(var(--chart-4))"
                        name="Weekly Average"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && temperatureData.length === 0 && !error && (
        <Alert>
          <AlertDescription>
            No temperature data available for the selected criteria. Try
            adjusting your filters or selecting a different date range.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
