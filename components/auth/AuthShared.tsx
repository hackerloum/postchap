import { AlertCircle, CheckCircle } from "lucide-react";

export function AuthDivider() {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="font-mono text-[11px] text-text-muted">or</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}

export function AuthErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-4">
      <AlertCircle size={14} className="text-error shrink-0" />
      <p className="font-mono text-[12px] text-error">{message}</p>
    </div>
  );
}

export function AuthSuccessMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl px-4 py-3 mb-4">
      <CheckCircle size={14} className="text-success shrink-0" />
      <p className="font-mono text-[12px] text-success">{message}</p>
    </div>
  );
}
