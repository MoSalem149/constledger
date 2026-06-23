import { useState } from "react";
import { userService } from "../../services/userService";
import { classifyUserError, userModalMessage } from "../../utils/userErrors";
import CloseModalIcon from "../icons/CloseModalIcon";
import PersonIcon from "../icons/PersonIcon";
import EyeIcon from "../icons/EyeIcon";
import EyeOffIcon from "../icons/EyeOffIcon";
import Spinner from "../common/Spinner";
import PartiesIcon from "../icons/PartiesIcon";
import { PlusIcon } from "../icons/PlusIcon";

const ROLES = [
  { value: "contract_manager", label: "Contract Manager" },
  { value: "top_management", label: "Top Management" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters (incl. Arabic), spaces, hyphens, apostrophes, periods. No digits / special chars.
const NAME_REGEX = /^[A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s'.-]*$/;
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

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
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) next.name = "Name is required";
    else if (trimmedName.length < 2)
      next.name = "Name must be at least 2 characters";
    else if (trimmedName.length > NAME_MAX)
      next.name = `Name must be at most ${NAME_MAX} characters`;
    else if (!NAME_REGEX.test(trimmedName))
      next.name = "Name may only contain letters, spaces, hyphens, apostrophes and periods";

    if (!trimmedEmail) next.email = "Email is required";
    else if (trimmedEmail.length > EMAIL_MAX)
      next.email = `Email must be at most ${EMAIL_MAX} characters`;
    else if (!EMAIL_REGEX.test(trimmedEmail))
      next.email = "Enter a valid email address";

    if (!isEditMode && !password) next.password = "Password is required";
    else if (password && password.length < PASSWORD_MIN)
      next.password = `Password must be at least ${PASSWORD_MIN} characters`;
    else if (password && password.length > PASSWORD_MAX)
      next.password = `Password must be at most ${PASSWORD_MAX} characters`;

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
          const type = classifyUserError(err);
          setSubmitError(userModalMessage(type, err));
          setSubmitting(false);
        });
    } else {
      userService
        .createUser({ name: name.trim(), email: email.trim(), password, role })
        .then(() => {
          onCreated();
        })
        .catch((err) => {
          const type = classifyUserError(err);
          setSubmitError(userModalMessage(type, err));
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-[460px] overflow-y-auto rounded-xl bg-bg-main sm:max-h-[calc(100dvh-3rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={isEditMode ? "edit-user-title" : "add-user-title"}
      >
        <div className="mb-5 flex items-start justify-between gap-3 rounded-t-xl bg-bg-cards1 p-4 sm:mb-6 sm:gap-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FBE0D0] sm:h-12 sm:w-12">
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
          <div className="px-4 sm:px-6">
            <label className="block text-text-primary font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              autoComplete="name"
              maxLength={NAME_MAX}
              required
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

          <div className="px-4 sm:px-6">
            <label className="block text-text-primary font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              maxLength={EMAIL_MAX}
              required
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

          <div className="px-4 sm:px-6">
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
                name="password"
                autoComplete={isEditMode ? "new-password" : "new-password"}
                minLength={PASSWORD_MIN}
                maxLength={PASSWORD_MAX}
                required={!isEditMode}
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

          <div className="px-4 sm:px-6">
            <label className="block text-text-primary  font-medium mb-2">
              Role
            </label>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setRole(r.value);
                    if (errors.role)
                      setErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  className={`min-h-10 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
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

          <div className="flex flex-col-reverse gap-3 px-4 pb-6 pt-5 min-[420px]:flex-row sm:px-14 sm:pb-11 sm:pt-9">
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
                  <Spinner size="sm" variant="onPrimary" showLabel={false} />
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