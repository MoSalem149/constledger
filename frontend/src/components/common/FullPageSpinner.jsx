/**
 * FullPageSpinner — shown by PrivateRoute while auth state is loading.
 *
 * Without this, the user would see a blank white screen while /auth/me
 * is in-flight. A spinner communicates "we're checking your session."
 */
import Spinner from "./Spinner";

export default function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg-main">
      <Spinner size="lg" />
    </div>
  );
}