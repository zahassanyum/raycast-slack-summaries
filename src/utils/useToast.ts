import { showToast, Toast } from "@raycast/api";

export function useToast() {
  const showLoadingToast = async (title: string) => {
    return await showToast({
      style: Toast.Style.Animated,
      title,
    });
  };

  const showSuccessToast = async (toast: Toast, title: string, message: string) => {
    toast.style = Toast.Style.Success;
    toast.title = title;
    toast.message = message;
  };

  const showErrorToast = async (toast: Toast, title: string, error: unknown) => {
    toast.style = Toast.Style.Failure;
    toast.title = title;
    toast.message = error instanceof Error ? error.message : String(error);
  };

  return { showLoadingToast, showSuccessToast, showErrorToast };
} 