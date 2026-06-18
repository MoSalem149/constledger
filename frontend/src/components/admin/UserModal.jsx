import { useState } from "react";
import { userService } from "../../services/userService";
import CloseModalIcon from "../icons/CloseModalIcon";
import PersonIcon from "../icons/PersonIcon";
import EyeIcon from "../icons/EyeIcon";
import EyeOffIcon from "../icons/EyeOffIcon";
import SpinnerIcon from "../icons/SpinnerIcon";
import PartiesIcon from "../icons/PartiesIcon";
import { PlusIcon } from "../icons/PlusIcon";

const ROLES = [
  { value: "contract_manager", label: "Contract Manager" },
  { value: "finance_team", label: "Finance Team" },
  { value: "top_management", label: "Top Management" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDuplicateEmailError(err) {
  const status = err.response?.status;
  const data = err.response?.data || {};
  if (status === 409) return true;
  if (status === 500 && data.code === 11000) return true;
  const msg = typeof data.message === "string" ? data.message : "";
  return /duplicate key|E11000/i.test(msg);
}

export default function UserModal({
  onClose,
  onCreated,
  editingUser = null,
  onUpdated,
}) {
  const isEditMode = Boolean(editingUser);
  const [name, setName] = useState(editingUser?.name ?? "");
  const [email, setEmail] = useState(editingUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(editingUser?.role ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Name is required";
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_REGEX.test(email.trim()))
      next.email = "Enter a valid email address";
    if (!isEditMode && !password) next.password = "Password is required";
    if (!role) next.role = "Select a role";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    if (isEditMode) {
      const userId = editingUser.id || editingUser._id;
      const payload = { name: name.trim(), email: email.trim(), role };
      if (password) payload.password = password;
      userService
        .updateUser(userId, payload)
        .then((res) => onUpdated(res.user))
        .catch((err) => {
          const status = err.response?.status;
          if (isDuplicateEmailError(err)) {
            setSubmitError("This email is already in use");
          } else if (status === 404) {
            setSubmitError("This user no longer exists");
          } else {
            setSubmitError("Something went wrong. Please try again.");
          }
          setSubmitting(false);
        });
    } else {
      userService
        .createUser({ name: name.trim(), email: email.trim(), password, role })
        .then(() => {
          onCreated();
        })
        .catch((err) => {
          if (isDuplicateEmailError(err)) {
            setSubmitError("This email is already in use");
          } else {
            setSubmitError("Something went wrong. Please try again.");
          }
          setSubmitting(false);
        });
    }
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) handleClose();
  }

  function isFormValid() {
    return (
      name.trim() &&
      email.trim() &&
      EMAIL_REGEX.test(email.trim()) &&
      (isEditMode || password) &&
      role
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-bg-main rounded-xl w-full max-w-[460px] "
        role="dialog"
        aria-modal="true"
        aria-labelledby={isEditMode ? "edit-user-title" : "add-user-title"}
      >
        <div className="flex items-start justify-between mb-6 gap-4 p-6 bg-bg-cards1 rounded-t-xl">
          <div className="flex items-start gap-3">
            <div className="flex w-12 h-12 items-center justify-center rounded-lg bg-[#FBE0D0]">
              <PartiesIcon className="text-primary w-6 h-6" />
            </div>
            <div className="">
              <h2
                id={isEditMode ? "edit-user-title" : "add-user-title"}
                className="text-lg font-medium  text-text-primary"
              >
                {isEditMode ? "Edit User" : "Add User"}
              </h2>
              <p className="text-text-placeholder font-normal text-xs ">
                Create a new team member account
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-text-secondary hover:text-text-primary  transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseModalIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex font-sans flex-col gap-4">
          <div className="px-6">
            <label className="block text-text-primary font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Sara Hassan"
              className="w-full bg-bg-cards1 border border-border rounded-[50px] px-6 py-4 text-xs placeholder:text-text-placeholder focus:outline-none focus:border-primary"
            />
            {errors.name && (
              <p className="text-status-risk text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="px-6">
            <label className="block text-text-primary font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="User@gmail.com"
              className="w-full bg-bg-cards1 border border-border rounded-[50px] px-6 py-4 text-xs placeholder:text-text-placeholder focus:outline-none focus:border-primary"
            />
            {errors.email && (
              <p className="text-status-risk text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div className="px-6">
            <label className="block text-text-primary  font-medium mb-2">
              Password
            </label>
            {isEditMode && (
              <p className="text-text-placeholder text-xs mb-2">
                Leave blank to keep the current password
              </p>
            )}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="********"
                className="w-full bg-bg-cards1 border border-border rounded-[50px] px-6 py-4 text-xs placeholder:text-text-placeholder focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="text-status-risk text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="px-6">
            <label className="block text-text-primary  font-medium mb-2">
              Role
            </label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setRole(r.value);
                    if (errors.role)
                      setErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    role === r.value
                      ? "bg-primary text-white border-primary"
                      : "bg-bg-cards1 text-text-secondary border-border hover:border-primary"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-status-risk text-xs mt-1">{errors.role}</p>
            )}
          </div>
          {submitError && (
            <p className="text-status-risk text-sm text-center">
              {submitError}
            </p>
          )}

          <div className="flex gap-3 pt-9 px-14 pb-11">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 bg-bg-cards1 text-text-secondary border border-border rounded-3xl px-5 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="flex-1 bg-primary text-white rounded-3xl px-7 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-evenly "
            >
              {submitting ? (
                <>
                  <SpinnerIcon className="animate-spin" />
                  {isEditMode ? "Saving…" : "Creating…"}
                </>
              ) : (
                <>
                  <PlusIcon />
                  {isEditMode ? "Save Changes" : "Add User"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
