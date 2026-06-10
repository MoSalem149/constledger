/**
 * FullPageSpinner — shown by PrivateRoute while auth state is loading.
 *
 * Without this, the user would see a blank white screen while /auth/me
 * is in-flight. A spinner communicates "we're checking your session."
 */
export default function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg-main">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="mt-7 font-sans text-secondary font-normal">
          Loading...
        </div>
      </div>
    </div>
  );
}
