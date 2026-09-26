import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No records found",
  description = "There is nothing to display right now.",
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border border-dashed border-border rounded-xl ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200/80 flex items-center justify-center text-gold-600 mb-4 shadow-sm">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-bold text-text-main mb-1">{title}</h3>
      <p className="text-xs text-muted max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-gold-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
