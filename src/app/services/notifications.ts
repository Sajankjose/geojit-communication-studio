import { supabase } from "../../lib/supabase";

export type NotificationType =
  | "review_required"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "final_approved"
  | "submitted"
  | "resubmitted"
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

  /**
   * Historical activity is derived from activity_logs through
   * get_my_activity(). It is shown in the notification centre
   * as history, but never contributes to the unread badge.
   */
  is_historical?: boolean;
}

interface ActivityRow {
  activity_id: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string;
  action: string;
  description: string;
  communication_id: string | null;
  communication_title: string | null;
  category: string | null;
  communication_status: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
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


/**
 * Historical workflow activity.
 *
 * This reuses the central activity_logs architecture already used
 * by the Review Queue "My Activity" feature.
 *
 * Historical items are intentionally marked read because they existed
 * before the notification centre was introduced.
 */
export async function getMyHistoricalNotifications(
  limit = 50
): Promise<AppNotification[]> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_my_activity",
      {
        p_limit: limit,
      }
    );

  if (error) {
    console.error(
      "Unable to load notification history:",
      error
    );

    /**
     * Do not break the live notification centre if the historical
     * activity RPC is unavailable for a particular role.
     */
    return [];
  }

  return (
    (data || []) as ActivityRow[]
  ).map(
    mapActivityToNotification
  );
}


export async function getNotificationCentreItems(
  {
    liveLimit = 20,
    historyLimit = 50,
  }: {
    liveLimit?: number;
    historyLimit?: number;
  } = {}
): Promise<AppNotification[]> {
  const [
    live,
    history,
  ] =
    await Promise.all([
      getMyNotifications(
        liveLimit
      ),
      getMyHistoricalNotifications(
        historyLimit
      ),
    ]);

  /**
   * Avoid showing the same workflow event twice when a newer
   * notification and an older activity-log row refer to the same
   * communication/action at approximately the same time.
   */
  const liveKeys =
    new Set(
      live.map(
        getNotificationDedupeKey
      )
    );

  const uniqueHistory =
    history.filter(
      (item) =>
        !liveKeys.has(
          getNotificationDedupeKey(
            item
          )
        )
    );

  return [
    ...live,
    ...uniqueHistory,
  ]
    .sort(
      (a, b) =>
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
    )
    .slice(
      0,
      liveLimit +
        historyLimit
    );
}


function mapActivityToNotification(
  row: ActivityRow
): AppNotification {
  const type =
    mapActivityActionToType(
      row.action,
      row.communication_status
    );

  const title =
    buildHistoricalTitle(
      row
    );

  const message =
    row.description?.trim() ||
    buildHistoricalMessage(
      row
    );

  return {
    id:
      `history:${row.activity_id}`,

    user_id:
      row.user_id || "",

    communication_id:
      row.communication_id,

    type,

    title,

    message,

    /**
     * Historical events are already part of the audit/activity
     * history. They should not suddenly appear as unread alerts.
     */
    is_read: true,

    created_at:
      row.created_at,

    read_at:
      row.created_at,

    is_historical:
      true,
  };
}


function mapActivityActionToType(
  action: string,
  status: string | null
): NotificationType {
  const value =
    `${action} ${status || ""}`
      .toLowerCase();

  if (
    value.includes(
      "changes_requested"
    ) ||
    value.includes(
      "changes requested"
    )
  ) {
    return "changes_requested";
  }

  if (
    value.includes(
      "reject"
    )
  ) {
    return "rejected";
  }

  if (
    value.includes(
      "final"
    ) &&
    value.includes(
      "approv"
    )
  ) {
    return "final_approved";
  }

  if (
    value.includes(
      "approv"
    )
  ) {
    return "approved";
  }

  if (
    value.includes(
      "resubmit"
    )
  ) {
    return "resubmitted";
  }

  if (
    value.includes(
      "submit"
    )
  ) {
    return "submitted";
  }

  if (
    value.includes(
      "review"
    )
  ) {
    return "review_required";
  }

  return "info";
}


function buildHistoricalTitle(
  row: ActivityRow
) {
  const communication =
    row.communication_title?.trim();

  const action =
    humaniseAction(
      row.action
    );

  if (
    communication &&
    action
  ) {
    return action;
  }

  if (action) {
    return action;
  }

  return "Workflow activity";
}


function buildHistoricalMessage(
  row: ActivityRow
) {
  const communication =
    row.communication_title?.trim();

  if (communication) {
    return communication;
  }

  return "Communication workflow activity";
}


function humaniseAction(
  action: string
) {
  const clean =
    String(
      action || ""
    )
      .replace(
        /_/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (!clean) {
    return "";
  }

  return clean
    .charAt(0)
    .toUpperCase() +
    clean.slice(1);
}


function getNotificationDedupeKey(
  item: AppNotification
) {
  const minute =
    item.created_at
      ? item.created_at.slice(
          0,
          16
        )
      : "";

  return [
    item.communication_id ||
      "none",
    item.type ||
      "info",
    minute,
  ].join("|");
}


export async function markNotificationRead(
  notificationId: string
) {
  /**
   * Historical items are generated from activity_logs and
   * therefore have no notifications-table row to update.
   */
  if (
    notificationId.startsWith(
      "history:"
    )
  ) {
    return;
  }

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
