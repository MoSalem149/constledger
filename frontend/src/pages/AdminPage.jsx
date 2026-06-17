import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary">
        Admin — User Management
      </h1>
      <p className="text-text-secondary mt-2">
        Welcome, {user?.name || "Admin"}. User management features coming soon.
      </p>
    </div>
  );
}
