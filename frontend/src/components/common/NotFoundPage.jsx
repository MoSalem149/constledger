import { Link } from 'react-router-dom';

/**
 * NotFoundPage — 404 fallback for any unmatched route.
 * Rendered by the catch-all `*` route in App.jsx.
 */
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-main">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="text-text-secondary mt-2">Page not found</p>
      <Link
        to="/dashboard"
        className="mt-4 text-primary underline"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
