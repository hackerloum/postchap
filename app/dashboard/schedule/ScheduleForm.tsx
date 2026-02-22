"use client";

import { useState } from "react";

export function ScheduleForm() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("08:00");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-sm text-text-primary">Daily generation</h2>
            <p className="font-mono text-[11px] text-text-muted mt-1">Automatically create a new poster every day</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-accent" : "bg-bg-elevated border border-border-default"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!enabled}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] text-text-muted mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!enabled}
              className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent disabled:opacity-50"
            >
              <option value="Africa/Lagos">Lagos (WAT)</option>
              <option value="Africa/Nairobi">Nairobi (EAT)</option>
              <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
              <option value="Africa/Accra">Accra (GMT)</option>
              <option value="America/New_York">New York (EST)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-text-primary mb-4">Notifications</h2>
        <p className="font-mono text-[11px] text-text-muted mb-4">Get alerted when your poster is ready</p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="w-4 h-4 rounded border-border-default bg-bg-elevated text-accent focus:ring-accent"
            />
            <span className="font-mono text-sm text-text-primary">Email notification</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifySms}
              onChange={(e) => setNotifySms(e.target.checked)}
              className="w-4 h-4 rounded border-border-default bg-bg-elevated text-accent focus:ring-accent"
            />
            <span className="font-mono text-sm text-text-primary">SMS notification</span>
          </label>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
        <h2 className="font-semibold text-sm text-text-primary mb-3">Upcoming</h2>
        <div className="space-y-2">
          {["Tomorrow 08:00", "Thu 22 Feb 08:00", "Fri 23 Feb 08:00"].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
              <span className="font-mono text-xs text-text-secondary">{d}</span>
              <span className="font-mono text-[10px] text-text-muted">Pending</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 bg-accent text-black font-semibold text-sm py-4 rounded-xl hover:bg-accent-dim transition-colors min-h-[52px]"
      >
        Save schedule
      </button>
    </div>
  );
}
