import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoIcon from "../components/icons/LogoIcon";
import EyeIcon from "../components/icons/EyeIcon";
import EyeOffIcon from "../components/icons/EyeOffIcon";
import loginImg from "../assets/login_img.png";
import Spinner from "../components/common/Spinner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate({ email, password }) {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email";
    }
    if (!password) {
      nextErrors.password = "Password is required";
    }
    return nextErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === "pmo") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setErrors({ form: "Invalid email or password" });
      } else {
        setErrors({ form: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailChange(v) {
    setEmail(v);
    if (errors.email || errors.form) {
      setErrors((prev) => {
        const { email: _, form: __, ...rest } = prev;
        return rest;
      });
    }
  }

  function handlePasswordChange(v) {
    setPassword(v);
    if (errors.password || errors.form) {
      setErrors((prev) => {
        const { password: _, form: __, ...rest } = prev;
        return rest;
      });
    }
  }

  return (
    <div className="flex h-screen bg-bg-main font-sans">
      {/* Left panel — illustration + overlay */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-center p-12"
        style={{
          backgroundImage: `url(${loginImg})`,
          backgroundSize: "cover",
          backgroundPosition: "left center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-shadow/50" />

        {/* Content */}
        <div className="relative z-10 pl-3">
          {/* Badge */}
          <div className="inline-block px-4 py-2 bg-primary rounded-sm mb-6">
            <span className="text-white font-sans text-base font-medium">
              ENTERPRISE READY
            </span>
          </div>

          {/* Heading */}
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-white font-sans text-5xl font-medium leading-tight">
              Engineered For The
              <br />
              Modern Jobsite
            </h1>
          </div>

          {/* Description */}
          <p className="text-white/90 font-sans text-base font-medium max-w-[462px] pb-4 border-b ">
            Precision tracking, contract compliance, and financial oversight for
            large-scale infrastructure projects. Build with certainty.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-20 pt-6">
            <div>
              <div className="text-white font-sans text-base font-medium">
                40%
              </div>
              <div className="text-white font-sans text-base font-medium">
                EFFICIENCY GAIN
              </div>
            </div>
            <div>
              <div className="text-white font-sans text-base font-medium">
                100%
              </div>
              <div className="text-white font-sans text-base font-medium">
                COMPLIANCE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[614px]">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-text-primary font-sans text-3xl sm:text-4xl lg:text-5xl font-medium mb-4">
              Welcome Back
            </h2>
            <p className="text-text-secondary font-sans text-sm sm:text-base font-medium">
              Everything you need to track contracts, budgets, and project
              performance
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-text-secondary font-sans text-base font-medium"
              >
                Work Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="User@gmail.com"
                  disabled={submitting}
                  className="w-full h-[60px] px-6 rounded-full bg-white font-sans text-base font-normal text-text-primary placeholder:text-text-placeholder outline-none border border-transparent focus:border-primary transition-colors disabled:opacity-60"
                />
              </div>
              {errors.email && (
                <span className="text-status-risk font-sans text-base font-medium">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-text-secondary font-sans text-base font-medium"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="********"
                  disabled={submitting}
                  className="w-full h-[60px] px-6 pr-14 rounded-full bg-white font-sans text-base font-normal text-text-primary placeholder:text-text-placeholder outline-none border border-transparent focus:border-primary transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-text-placeholder hover:text-text-secondary transition-colors disabled:opacity-60"
                  disabled={submitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeIcon className="w-6 h-6" />
                  ) : (
                    <EyeOffIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-status-risk font-sans text-base font-medium">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Form-level error */}
            {errors.form && (
              <div className="text-status-risk font-sans text-base font-medium">
                {errors.form}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[60px] rounded-full bg-primary text-white font-sans text-lg sm:text-xl lg:text-2xl font-medium flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" variant="onPrimary" showLabel={false} />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}