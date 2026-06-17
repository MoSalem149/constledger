import { useEffect, useState } from "react";
import { userService } from "../services/userService";
import AdminHeader from "../components/admin/AdminHeader";
import UserTable from "../components/admin/UserTable";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    setError(null);
    userService
      .getUsers()
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }

  return (
    <div className="bg-bg-main min-h-[calc(100vh-116px)]">
      <AdminHeader />
      <UserTable
        users={users}
        loading={loading}
        error={error}
        onRetry={loadUsers}
      />
    </div>
  );
}
