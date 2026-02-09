import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {props.required && <span className="text-danger-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 resize-none",
          error && "border-danger-500 focus:ring-danger-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-sm text-danger-600 mt-1">{error}</p>}
    </div>
  )
);

Textarea.displayName = "Textarea";

export { Textarea };
