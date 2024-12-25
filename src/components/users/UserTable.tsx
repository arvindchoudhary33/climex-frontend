import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Key } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onDeleteUser: (id: string) => Promise<void>;
  onEditUser: (
    id: string,
    data: { name: string; email: string },
  ) => Promise<void>;
  onChangePassword: (id: string, password: string) => Promise<void>;
}

export function UserTable({
  users,
  onDeleteUser,
  onEditUser,
  onChangePassword,
}: UserTableProps) {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(
    null,
  );

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
  };

  const handlePasswordChangeClick = (user: User) => {
    setUserToChangePassword(user);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(user)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePasswordChangeClick(user)}
                        className="cursor-pointer"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(user.id)}
                        className="cursor-pointer text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteUserDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (userToDelete) {
            await onDeleteUser(userToDelete);
            return true;
          }
          return false;
        }}
      />

      <EditUserDialog
        user={userToEdit}
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        onSave={async (data) => {
          if (userToEdit) {
            await onEditUser(userToEdit.id, data);
            return true;
          }
          return false;
        }}
      />

      <ChangePasswordDialog
        isOpen={!!userToChangePassword}
        onClose={() => setUserToChangePassword(null)}
        onSave={async (password) => {
          if (userToChangePassword) {
            await onChangePassword(userToChangePassword.id, password);
            return true;
          }
          return false;
        }}
        userName={userToChangePassword?.name || ""}
      />
    </>
  );
}
