import { PlusIcon } from "../icons/PlusIcon";

export default function AdminHeader({ onAddUser }) {
  return (
    <div className="mb-6 flex flex-col gap-4 font-sans sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-medium font-sans text-text-primary">
          Admin Table
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Detailed information about every user
        </p>
      </div>
      <button
        onClick={onAddUser}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" />
        Add User
      </button>
    </div>
  );
}