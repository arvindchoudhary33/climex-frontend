const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;

interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

interface UpdateUserData {
  name: string;
  email: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.message || "An error occurred while processing your request",
    );
  }
  return response.json();
};

export const api = {
  setAuthHeader: (token: string) => {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError ? error : new Error("Network error");
    }
  },

  changeUserPassword: async (
    token: string,
    userId: string,
    newPassword: string,
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/change-password`,
        {
          method: "POST",
          headers: api.setAuthHeader(token),
          body: JSON.stringify({ newPassword }),
        },
      );
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new Error("Failed to change password");
    }
  },
  getUsers: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users/all`, {
        headers: api.setAuthHeader(token),
      });
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new Error("Failed to fetch users");
    }
  },

  createUser: async (token: string, userData: CreateUserData) => {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: api.setAuthHeader(token),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new Error("Failed to create user");
    }
  },

  updateUser: async (
    token: string,
    userId: string,
    userData: UpdateUserData,
  ) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: api.setAuthHeader(token),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new Error("Failed to update user");
    }
  },

  deleteUser: async (token: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: api.setAuthHeader(token),
      });
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new Error("Failed to delete user");
    }
  },

  getProfile: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: api.setAuthHeader(token),
      });
      return handleResponse(response);
    } catch (error) {
      throw error instanceof ApiError
        ? error
        : new Error("Failed to fetch profile");
    }
  },
};
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};
