import { supabase } from "../../lib/supabase";

export type NotificationType =
  | "review_required"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "final_approved"
  | "info";

export interface AppNotification {
  id: string;
  user_id: string;
  communication_id: string | null;
  type: NotificationType | string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export async function getMyNotifications(
  limit = 20
): Promise<AppNotification[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("notifications")
      .select(
        `
        id,
        user_id,
        communication_id,
        type,
        title,
        message,
        is_read,
        created_at,
        read_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(limit);

  if (error) {
    throw new Error(
      error.message
    );
  }

  return (
    data || []
  ) as AppNotification[];
}

export async function markNotificationRead(
  notificationId: string
) {
  const {
    error,
  } =
    await supabase.rpc(
      "mark_notification_read",
      {
        p_notification_id:
          notificationId,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }
}

export async function markAllNotificationsRead() {
  const {
    error,
  } =
    await supabase.rpc(
      "mark_all_notifications_read"
    );

  if (error) {
    throw new Error(
      error.message
    );
  }
}

export function subscribeToMyNotifications({
  userId,
  onChange,
}: {
  userId: string;
  onChange: () => void;
}) {
  const channel =
    supabase
      .channel(
        `notifications:${userId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter:
            `user_id=eq.${userId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

  return () => {
    void supabase
      .removeChannel(
        channel
      );
  };
}

export function formatNotificationTime(
  createdAt: string
): string {
  const created =
    new Date(createdAt);

  const diffMs =
    Date.now() -
    created.getTime();

  const minutes =
    Math.floor(
      diffMs / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hr${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days <= 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return created.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
