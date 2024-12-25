const API_URL = "/api/v1";

export interface ClimateOverviewResponse {
  documents: {
    total: number;
    results: Array<{
      id: string;
      title: string;
      date: string;
      region: string;
    }>;
  };
  metadata: {
    startYear: number;
    endYear: number;
    totalCount: number;
  };
  timestamp: string;
}

export class ClimateService {
  static async getOverview(token: string): Promise<ClimateOverviewResponse> {
    try {
      const response = await fetch(`${API_URL}/climate/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text(); // Get the response body as text
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: text,
          headers: Object.fromEntries(response.headers.entries()),
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Success Response:", data);
      return data;
    } catch (error) {
      console.error("API Call Failed:", error);
      throw error;
    }
  }
}
