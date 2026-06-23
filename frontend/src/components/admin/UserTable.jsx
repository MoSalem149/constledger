import RoleBadge from "./RoleBadge";
import Spinner from "../common/Spinner";
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
      <div className="flex items-center justify-center py-24">
        <Spinner size="md" label="Loading users…" />
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
    <div className="rounded-lg bg-bg-cards1 p-3 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] sm:p-6">
      {/* Compact cards keep user details and actions readable on phones. */}
      <div className="grid gap-3 md:hidden">
        {users.map((user, index) => (
          <article
            key={user.id || index}
            className="rounded-lg border border-gray-100 bg-bg-cards1 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-text-primary">
                  {user.name || "—"}
                </h2>
                <p className="mt-1 break-all text-xs text-text-secondary">
                  {user.email || "—"}
                </p>
              </div>
              <RoleBadge role={user.role} />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => onEdit?.(user)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(user)}
                aria-label={`Delete ${user.name || "user"}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                <TrashIcon />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] table-auto">
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
    </div>
  );
}