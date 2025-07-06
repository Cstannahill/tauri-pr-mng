import { Alert, AlertDescription } from "@/components/ui/alert";

export interface Notification {
  message: string;
  type?: "info" | "success" | "error";
}

export interface NotificationAlertProps {
  notification: Notification | null;
}

export function NotificationAlert({ notification }: NotificationAlertProps) {
  if (!notification) return null;

  const alertClasses: Record<string, string> = {
    error: "border-red-200 bg-red-50 dark:bg-red-900/20",
    success: "border-green-200 bg-green-50 dark:bg-green-900/20",
    info: "border-blue-200 bg-blue-50 dark:bg-blue-900/20",
  };

  const descriptionClasses: Record<string, string> = {
    error: "text-red-800 dark:text-red-200",
    success: "text-green-800 dark:text-green-200",
    info: "text-blue-800 dark:text-blue-200",
  };

  const variant = notification.type ?? "info";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert className={alertClasses[variant]}> 
        <AlertDescription className={descriptionClasses[variant]}>
          {notification.message}
        </AlertDescription>
      </Alert>
    </div>
  );
}
