import { Toaster, toast } from "sonner";

export function ToastProvider() {
  return <Toaster position="top-right" richColors />;
}

export function useToast() {
  return {
    showToast: (message: string, type: "success" | "error" | "info" = "info") => {
      if (type === "success") toast.success(message);
      else if (type === "error") toast.error(message);
      else toast.info(message);
    },
    toast
  };
}
