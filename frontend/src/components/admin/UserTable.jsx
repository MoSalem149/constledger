import RoleBadge from "./RoleBadge";
import SpinnerIcon from "../icons/SpinnerIcon";
import { EmptyIcon } from "../icons/EmptyIcon";
import { TrashIcon } from "../icons/TrashIcon";

export default function UserTable({
  users = [],
  loading = false,
  error = null,
  onRetry,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <SpinnerIcon className="animate-spin text-text-secondary" />
        <p className="text-text-secondary mt-3 text-sm">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-text-primary text-sm mb-4">
          Could not load users. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyIcon />
        <p className="text-text-secondary text-sm mt-3">No users yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-6 bg-bg-cards1 rounded-lg">
      <table className="table-auto w-full">
        <colgroup>
          <col className="w-1/2" />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="bg-bg-grey ">
            <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7">
              User
            </th>
            <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7">
              Email
            </th>
            <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7">
              Role
            </th>
            <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7"></th>
            <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id || index} className="border-b border-gray-100 ">
              <td className="px-6 py-7 font-medium text-text-primary text-sm">
                {user.name || "—"}
              </td>
              <td className="px-6 py-7 font-medium text-text-secondary text-sm">
                {user.email || "—"}
              </td>
              <td className="px-6 py-7">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-6 py-7">
                <button
                  onClick={() => onEdit?.(user)}
                  className="text-text-secondary text-sm font-medium hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </td>
              <td className="px-6 py-7">
                <button
                  onClick={() => onDelete?.(user)}
                  className="text-text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
