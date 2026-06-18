import { PlusIcon } from "../icons/PlusIcon";

export default function AdminHeader({ onAddUser }) {
  return (
    <div className="flex font-sans items-center justify-between mb-6 mr-10">
      <div>
        <h1 className="text-2xl font-medium font-sans text-text-primary">
          Admin Table
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Detailed information about every user
        </p>
      </div>
      <button
        onClick={onAddUser}
        className="bg-primary text-white flex items-center gap-2 px-4 py-2.5 rounded-3xl font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer "
      >
        <PlusIcon />
        Add User
      </button>
    </div>
  );
}
