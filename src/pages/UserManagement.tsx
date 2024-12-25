import { useEffect, useState } from "react";
import { api, ApiError } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { UserTable } from "../components/users/UserTable";
import { CreateUserDialog } from "../components/users/CreateUserDialog";
import { UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface MongoUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { token } = useAuth();

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers(token!);
      const mappedUsers = response.users.map((user: MongoUser) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }));
      setUsers(mappedUsers);
      setError(null);
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred";
      setError(errorMessage);
      toast.error("Failed to load users", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateUser = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      await api.createUser(token!, data);
      await fetchUsers();
      toast.success("User created successfully", {
        description: `${data.name} has been added to the system`,
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred";
      toast.error("Failed to create user", {
        description: errorMessage,
      });
      throw error;
    }
  };

  const handleEditUser = async (
    id: string,
    data: { name: string; email: string },
  ) => {
    try {
      await api.updateUser(token!, id, data);
      await fetchUsers();
      toast.success("User updated successfully", {
        description: `${data.name}'s information has been updated`,
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred";
      toast.error("Failed to update user", {
        description: errorMessage,
      });
      throw error;
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(token!, id);
      await fetchUsers();
      toast.success("User deleted successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred";
      toast.error("Failed to delete user", {
        description: errorMessage,
      });
      throw error;
    }
  };

  const handlePasswordChange = async (id: string, newPassword: string) => {
    try {
      await api.changeUserPassword(token!, id, newPassword);
      toast.success("Password changed successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred";
      toast.error("Failed to change password", {
        description: errorMessage,
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div>Loading...</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <UserTable
          users={users}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          onChangePassword={handlePasswordChange}
        />

        <CreateUserDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSave={handleCreateUser}
        />
      </div>
    </AuthLayout>
  );
}
