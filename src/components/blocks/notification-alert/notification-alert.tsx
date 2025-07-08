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
    error: "border-destructive/20 bg-destructive/10",
    success: "border-green-600/20 bg-green-500/10",
    info: "border-primary/20 bg-primary/10",
  };

  const descriptionClasses: Record<string, string> = {
    error: "text-destructive",
    success: "text-green-700",
    info: "text-primary",
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
