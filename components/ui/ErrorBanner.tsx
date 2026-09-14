import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-status-error/20 bg-status-error/5 px-4 py-3 text-body-sm text-status-error">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-2">
          다시 시도
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} aria-label="닫기" className="shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
