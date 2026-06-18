import { useEffect, useState } from "react";
import { userService } from "../services/userService";
import AdminHeader from "../components/admin/AdminHeader";
import UserTable from "../components/admin/UserTable";
import UserModal from "../components/admin/UserModal";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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
      <AdminHeader onAddUser={() => setModalOpen(true)} />
      <UserTable
        users={users}
        loading={loading}
        error={error}
        onRetry={loadUsers}
        onEdit={(user) => setEditingUser(user)}
      />
      {modalOpen && (
        <UserModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            loadUsers();
          }}
        />
      )}
      {editingUser && (
        <UserModal
          editingUser={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
