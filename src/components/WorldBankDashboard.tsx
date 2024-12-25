import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

import { DocumentDetails } from "./dashboard/DocumentDetails";
interface Document {
  id: string;
  docdt: string;
  display_title: string;
  teratopic?: string;
  subtopic?: string;
  pdfurl?: string;
}

interface ApiResponse {
  total: number;
  documents: { [key: string]: Document };
}

export function DocumentAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<Document[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoading(true);

        const response = await fetch(
          "http://localhost:8000/api/v1/climate/documents",
          {
            headers: {
              ...api.setAuthHeader(token),
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch climate data");
        }

        const data: ApiResponse = await response.json();

        const documentsArray = Object.entries(data.documents).map(
          ([key, doc]) => ({
            ...doc,
            id: key,
          }),
        );

        setDocumentData(documentsArray);
        setError(null);
      } catch (err) {
        console.error("Error fetching climate data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch climate data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const documentsByYear = documentData.reduce(
    (acc: Record<string, number>, doc) => {
      try {
        const year = new Date(doc.docdt).getFullYear();
        if (!isNaN(year)) {
          acc[year] = (acc[year] || 0) + 1;
        }
      } catch (err) {
        console.warn("Invalid date format:", doc.docdt);
      }
      return acc;
    },
    {},
  );

  const yearlyData = Object.entries(documentsByYear)
    .map(([year, count]) => ({
      year,
      count,
    }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const topicCounts = documentData.reduce(
    (acc: Record<string, number>, doc) => {
      try {
        const topics = doc.teratopic?.split(",") || [];
        topics.forEach((topic) => {
          if (topic) {
            const trimmedTopic = topic.trim();
            acc[trimmedTopic] = (acc[trimmedTopic] || 0) + 1;
          }
        });
      } catch (err) {
        console.warn("Error processing topics for document:", doc);
      }
      return acc;
    },
    {},
  );

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic: topic.length > 30 ? topic.substring(0, 30) + "..." : topic,
      count,
    }));

  const filteredDocuments = selectedYear
    ? documentData.filter((doc) => {
        const year = new Date(doc.docdt).getFullYear().toString();
        return year === selectedYear;
      })
    : documentData;

  const handleYearClick = (data: any) => {
    setSelectedYear(data?.year || null);
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{documentData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unique Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Object.keys(topicCounts).length}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>
                Climate Publications Over Time
                {selectedYear && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    (Click the graph to filter by year)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Publications"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={true}
                      onClick={handleYearClick}
                      cursor="pointer"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Most Common Climate Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTopics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="topic"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Number of Publications"
                      fill="hsl(var(--chart-2))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <CardTitle>
              Document List
              {selectedYear && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Filtered by year: {selectedYear})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentDetails documents={filteredDocuments} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
