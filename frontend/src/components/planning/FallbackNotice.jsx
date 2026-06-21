import { AlertIcon } from "../icons/AlertIcon";

export default function FallbackNotice({ warnings }) {
  const fallback = warnings?.find((w) => w.code === "milestone_fallback");
  if (!fallback) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-bg-watch px-4 py-3 border border-watch-2/20">
      <AlertIcon className="w-5 h-5 text-watch-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-watch-1">Fallback Used</p>
        <p className="text-xs text-text-secondary mt-0.5">{fallback.message}</p>
      </div>
    </div>
  );
}