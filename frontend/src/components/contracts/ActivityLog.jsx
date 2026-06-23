/**
 * ActivityLog — displays a list of timestamped processing events.
 *
 * Used inside the ProcessingCard during contract analysis.
 */
import ActivityLogsIcon from "../icons/ActivityLogsIcon";

export default function ActivityLog({ events }) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 h-6">
        <ActivityLogsIcon className="text-text-primary w-6 h-6" />
        <h4 className="text-sm font-medium text-text-primary">
          Activity Log ({events.length} events)
        </h4>
      </div>

      {/* Events container */}
      <div className="bg-bg-main border border-gray-100 rounded-lg p-6 flex flex-col gap-3">
        {events.map((event, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-xs text-text-placeholder shrink-0 min-w-[60px]">
              {event.timestamp}
            </span>
            <span className="text-xs text-text-primary">
              {event.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
