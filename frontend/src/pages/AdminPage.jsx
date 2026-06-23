import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import AdminHeader from "../components/admin/AdminHeader";
import UserTable from "../components/admin/UserTable";
import UserModal from "../components/admin/UserModal";
import DeleteConfirmModal from "../components/admin/DeleteConfirmModal";
import AdminSkeleton from "../components/admin/AdminSkeleton";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const { user: authUser } = useAuth();
  const isSelfDelete =
    deletingUser && authUser && (deletingUser.id || deletingUser._id) === authUser.id;

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

  if (loading) {
    return (
      <div className="bg-bg-main min-h-[calc(100vh-116px)]">
        <AdminSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-bg-main min-h-[calc(100vh-116px)] pr-0 lg:pr-10">
      <AdminHeader onAddUser={() => setModalOpen(true)} />
      <UserTable
        users={users}
        loading={false}
        error={error}
        onRetry={loadUsers}
        onEdit={(user) => setEditingUser(user)}
        onDelete={(user) => setDeletingUser(user)}
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
      {deletingUser && (
        <DeleteConfirmModal
          user={deletingUser}
          blocked={isSelfDelete}
          onClose={() => setDeletingUser(null)}
          onDeleted={() => {
            setDeletingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}