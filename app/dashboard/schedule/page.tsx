import { ScheduleForm } from "./ScheduleForm";

export default async function SchedulePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ScheduleForm />
      </div>
    </div>
  );
}
