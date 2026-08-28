import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock3,
  LogOut,
  MessageSquareWarning,
  Settings,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../auth/useAuth";

import {
  clearCommunicationCache,
} from "../services/communications";

import {
  AppNotification,
  formatNotificationTime,
  getNotificationCentreItems,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToMyNotifications,
} from "../services/notifications";


/**
 * PERFORMANCE
 *
 * TopNavBar is mounted on almost every route.
 * Keep notification data and the realtime subscription
 * at module level so route changes do not trigger the same
 * Supabase work repeatedly.
 */
const NOTIFICATION_CACHE_TTL_MS =
  60_000;

const NOTIFICATION_LIVE_LIMIT =
  12;

const NOTIFICATION_HISTORY_LIMIT =
  18;

type NotificationCache = {
  userId: string;
  items: AppNotification[];
  loadedAt: number;
};

type NotificationListener = (
  userId: string,
  items: AppNotification[]
) => void;

let notificationCache:
  NotificationCache | null =
    null;

let notificationRequest:
  Promise<AppNotification[]> | null =
    null;

let notificationRequestUserId:
  string | null =
    null;

let notificationSubscriptionUserId:
  string | null =
    null;

let stopNotificationSubscription:
  (() => void) | null =
    null;

const notificationListeners =
  new Set<NotificationListener>();


function getCachedNotifications(
  userId: string
) {
  if (
    notificationCache?.userId !==
    userId
  ) {
    return null;
  }

  return notificationCache;
}


function isNotificationCacheFresh(
  userId: string
) {
  const cached =
    getCachedNotifications(
      userId
    );

  if (!cached) {
    return false;
  }

  return (
    Date.now() -
      cached.loadedAt <
    NOTIFICATION_CACHE_TTL_MS
  );
}


function publishNotificationItems(
  userId: string,
  items: AppNotification[]
) {
  notificationCache = {
    userId,
    items,
    loadedAt:
      Date.now(),
  };

  notificationListeners.forEach(
    (listener) => {
      listener(
        userId,
        items
      );
    }
  );
}


async function fetchNotificationItems(
  userId: string,
  force = false
) {
  const cached =
    getCachedNotifications(
      userId
    );

  if (
    !force &&
    cached &&
    isNotificationCacheFresh(
      userId
    )
  ) {
    return cached.items;
  }

  if (
    notificationRequest &&
    notificationRequestUserId ===
      userId
  ) {
    return notificationRequest;
  }

  notificationRequestUserId =
    userId;

  notificationRequest =
    getNotificationCentreItems({
      liveLimit:
        NOTIFICATION_LIVE_LIMIT,

      historyLimit:
        NOTIFICATION_HISTORY_LIMIT,
    })
      .then(
        (items) => {
          publishNotificationItems(
            userId,
            items
          );

          return items;
        }
      )
      .finally(
        () => {
          notificationRequest =
            null;

          notificationRequestUserId =
            null;
        }
      );

  return notificationRequest;
}


function ensureNotificationSubscription(
  userId: string
) {
  if (
    notificationSubscriptionUserId ===
      userId &&
    stopNotificationSubscription
  ) {
    return;
  }

  stopNotificationSubscription?.();

  notificationSubscriptionUserId =
    userId;

  stopNotificationSubscription =
    subscribeToMyNotifications({
      userId,

      onChange: () => {
        void fetchNotificationItems(
          userId,
          true
        ).catch(
          (error) => {
            console.error(
              "Unable to refresh notifications after realtime update:",
              error
            );
          }
        );
      },
    });
}


function resetNotificationRuntime() {
  notificationCache =
    null;

  notificationRequest =
    null;

  notificationRequestUserId =
    null;

  notificationSubscriptionUserId =
    null;

  stopNotificationSubscription?.();

  stopNotificationSubscription =
    null;
}


export function TopNavBar() {
  const navigate =
    useNavigate();

  const [
    isUserMenuOpen,
    setIsUserMenuOpen,
  ] =
    useState(false);

  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] =
    useState(false);

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      AppNotification[]
    >([]);

  const [
    notificationLoading,
    setNotificationLoading,
  ] =
    useState(false);

  const [
    notificationError,
    setNotificationError,
  ] =
    useState("");

  const {
    profile,
    user,
    signOut,
  } =
    useAuth();


  const employeeName =
    profile?.full_name?.trim() ||
    user?.email ||
    "Employee";

  const employeeRole =
    profile?.role
      ? formatRole(
          profile.role
        )
      : "User";

  const employeeInfo =
    profile?.designation?.trim() ||
    employeeRole;

  const initials =
    getInitials(
      profile?.full_name ||
      user?.email ||
      "User"
    );

  const isAdmin =
    profile?.role ===
    "admin";


  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            !item.is_read
        ).length,
      [
        notifications,
      ]
    );


  const loadNotifications =
    useCallback(
      async (
        showLoading = true,
        force = false
      ) => {
        if (
          !user?.id
        ) {
          setNotifications(
            []
          );

          return;
        }

        const cached =
          getCachedNotifications(
            user.id
          );

        if (
          cached
        ) {
          setNotifications(
            cached.items
          );
        }

        try {
          if (
            showLoading &&
            !cached
          ) {
            setNotificationLoading(
              true
            );
          }

          setNotificationError(
            ""
          );

          const items =
            await fetchNotificationItems(
              user.id,
              force
            );

          setNotifications(
            items
          );
        } catch (
          error
        ) {
          console.error(
            "Unable to load notifications:",
            error
          );

          setNotificationError(
            "Unable to load notifications."
          );
        } finally {
          setNotificationLoading(
            false
          );
        }
      },
      [
        user?.id,
      ]
    );


  useEffect(() => {
    if (
      !user?.id
    ) {
      setNotifications(
        []
      );

      return;
    }

    const userId =
      user.id;

    const cached =
      getCachedNotifications(
        userId
      );

    if (
      cached
    ) {
      setNotifications(
        cached.items
      );
    }

    const listener:
      NotificationListener =
      (
        changedUserId,
        items
      ) => {
        if (
          changedUserId ===
          userId
        ) {
          setNotifications(
            items
          );
        }
      };

    notificationListeners.add(
      listener
    );

    ensureNotificationSubscription(
      userId
    );

    if (
      !isNotificationCacheFresh(
        userId
      )
    ) {
      void loadNotifications(
        false,
        false
      );
    }

    return () => {
      notificationListeners.delete(
        listener
      );
    };
  }, [
    user?.id,
    loadNotifications,
  ]);


  /**
   * Close floating menus with Escape.
   */
  useEffect(() => {
    function handleKeyDown(
      event:
        KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setIsUserMenuOpen(
          false
        );

        setIsNotificationOpen(
          false
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);


  const handleLogout =
    async () => {
      try {
        setIsUserMenuOpen(
          false
        );

        resetNotificationRuntime();
        clearCommunicationCache();

        await signOut();

        navigate(
          "/login",
          {
            replace:
              true,
          }
        );
      } catch (
        error
      ) {
        console.error(
          "Logout error:",
          error
        );
      }
    };


  const handleSettings =
    () => {
      setIsUserMenuOpen(
        false
      );

      setIsNotificationOpen(
        false
      );

      navigate(
        "/settings/rules"
      );
    };


  function handleHome() {
    setIsUserMenuOpen(
      false
    );

    setIsNotificationOpen(
      false
    );

    navigate(
      "/"
    );
  }


  async function handleNotificationClick(
    notification:
      AppNotification
  ) {
    try {
      if (
        !notification.is_read
      ) {
        await markNotificationRead(
          notification.id
        );

        const nextItems =
          notifications.map(
            (
              item
            ) =>
              item.id ===
              notification.id
                ? {
                    ...item,

                    is_read:
                      true,
                  }
                : item
          );

        setNotifications(
          nextItems
        );

        if (
          user?.id
        ) {
          publishNotificationItems(
            user.id,
            nextItems
          );
        }
      }
    } catch (
      error
    ) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }

    setIsNotificationOpen(
      false
    );

    if (
      notification.communication_id
    ) {
      navigate(
        `/approval/status?communicationId=${encodeURIComponent(
          notification.communication_id
        )}`
      );
    }
  }


  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();

      const nextItems =
        notifications.map(
          (
            item
          ) => ({
            ...item,

            is_read:
              true,
          })
        );

      setNotifications(
        nextItems
      );

      if (
        user?.id
      ) {
        publishNotificationItems(
          user.id,
          nextItems
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Unable to mark all notifications read:",
        error
      );
    }
  }


  return (
    <header className="relative z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-5 px-5 sm:px-6 lg:px-8">

        {/* Brand */}
        <button
          type="button"
          onClick={
            handleHome
          }
          className="group flex min-w-0 items-center gap-3 text-left"
        >
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f5f4] text-sm font-semibold text-[#07877B] sm:flex">
            CS
          </div>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-5 text-gray-900 transition-colors group-hover:text-[#07877B] sm:text-base">
              Geojit Communication Studio
            </p>

            <p className="mt-0.5 hidden text-xs leading-4 text-gray-500 sm:block">
              AI-enabled communication creation
            </p>
          </div>
        </button>


        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={
                isNotificationOpen
              }
              onClick={() => {
                setIsNotificationOpen(
                  (
                    current
                  ) =>
                    !current
                );

                setIsUserMenuOpen(
                  false
                );

                void loadNotifications(true, false);
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isNotificationOpen
                  ? "bg-[#e8f5f4] text-[#075f58]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Bell className="h-[19px] w-[19px]" />

              {unreadCount >
                0 && (
                <span className="absolute right-0 top-0 flex min-h-[18px] min-w-[18px] translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadCount >
                  99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </button>


            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() =>
                    setIsNotificationOpen(
                      false
                    )
                  }
                  aria-hidden="true"
                />

                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Notifications
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {unreadCount >
                        0
                          ? `${unreadCount} unread`
                          : "You're up to date"}
                      </p>
                    </div>

                    {unreadCount >
                      0 && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleMarkAllRead()
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#07877B] transition-colors hover:bg-[#f3fbfa]"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                      </button>
                    )}
                  </div>


                  <div className="max-h-[430px] overflow-y-auto overscroll-contain">
                    {notificationLoading &&
                    notifications.length ===
                      0 ? (
                      <div className="px-5 py-10 text-center text-sm text-gray-500">
                        Loading notifications...
                      </div>
                    ) : notificationError ? (
                      <div className="px-5 py-8 text-center text-sm text-red-600">
                        {notificationError}
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <Bell className="h-5 w-5 text-gray-400" />
                        </div>

                        <p className="mt-3 text-sm font-medium text-gray-800">
                          You're all caught up
                        </p>

                        <p className="mx-auto mt-1 max-w-[260px] text-xs leading-5 text-gray-500">
                          Workflow updates and recent approval activity will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (
                          notification
                        ) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              void handleNotificationClick(
                                notification
                              )
                            }
                            className={`flex w-full gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                              !notification.is_read
                                ? "bg-[#f6fbfa]"
                                : "bg-white"
                            }`}
                          >
                            <NotificationIcon
                              type={
                                notification.type
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p className="flex-1 text-sm font-medium leading-5 text-gray-900">
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.is_read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#07877B]" />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">
                                {
                                  notification.message
                                }
                              </p>

                              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                                <span>
                                  {formatNotificationTime(
                                    notification.created_at
                                  )}
                                </span>

                                {notification.is_historical && (
                                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 font-medium text-gray-500">
                                    History
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>


          {/* Admin settings */}
          {isAdmin && (
            <button
              type="button"
              aria-label="Settings"
              onClick={
                handleSettings
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Settings className="h-[19px] w-[19px]" />
            </button>
          )}


          <div className="mx-1 hidden h-7 w-px bg-gray-200 sm:block" />


          {/* User profile */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={
                isUserMenuOpen
              }
              onClick={() => {
                setIsUserMenuOpen(
                  (
                    current
                  ) =>
                    !current
                );

                setIsNotificationOpen(
                  false
                );
              }}
              className={`flex max-w-[290px] items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors sm:gap-3 sm:pr-3 ${
                isUserMenuOpen
                  ? "bg-[#f3fbfa]"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f5f4] text-xs font-semibold uppercase tracking-wide text-[#075f58] ring-1 ring-[#d6eeeb]">
                {initials}
              </div>

              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-[180px] truncate text-sm font-medium leading-5 text-gray-900">
                  {
                    employeeName
                  }
                </p>

                <p className="max-w-[180px] truncate text-xs leading-4 text-gray-500">
                  {
                    employeeInfo
                  }
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                  isUserMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>


            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() =>
                    setIsUserMenuOpen(
                      false
                    )
                  }
                  aria-hidden="true"
                />

                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
                >
                  {/* Identity */}
                  <div className="border-b border-gray-100 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f5f4] text-sm font-semibold uppercase tracking-wide text-[#075f58] ring-1 ring-[#d6eeeb]">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {
                            employeeName
                          }
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {
                            user?.email ||
                            "No email available"
                          }
                        </p>

                        {profile?.role && (
                          <span className="mt-2.5 inline-flex rounded-full bg-[#e8f5f4] px-2.5 py-1 text-[11px] font-medium text-[#075f58]">
                            {
                              employeeRole
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Profile details */}
                  <div className="space-y-3 px-5 py-4">
                    {profile?.designation && (
                      <ProfileDetail
                        label="Designation"
                        value={
                          profile.designation
                        }
                      />
                    )}

                    {profile?.department && (
                      <ProfileDetail
                        label="Department"
                        value={
                          profile.department
                        }
                      />
                    )}

                    {!profile?.designation &&
                      !profile?.department && (
                      <p className="text-xs leading-5 text-gray-500">
                        Your role and account information are shown above.
                      </p>
                    )}
                  </div>


                  {/* Sign out */}
                  <div className="border-t border-gray-100 p-2.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        void handleLogout()
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                        <LogOut className="h-4 w-4" />
                      </div>

                      <span>
                        Sign Out
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


function ProfileDetail({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-400">
        {label}
      </p>

      <p className="min-w-0 break-words text-sm leading-5 text-gray-700">
        {value}
      </p>
    </div>
  );
}


function NotificationIcon({
  type,
}: {
  type:
    string;
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";

  switch (
    type
  ) {
    case "approved":
    case "final_approved":
      return (
        <div
          className={`${base} bg-green-50 text-green-700`}
        >
          <CircleCheck className="h-4 w-4" />
        </div>
      );

    case "rejected":
      return (
        <div
          className={`${base} bg-red-50 text-red-600`}
        >
          <CircleX className="h-4 w-4" />
        </div>
      );

    case "changes_requested":
      return (
        <div
          className={`${base} bg-amber-50 text-amber-700`}
        >
          <MessageSquareWarning className="h-4 w-4" />
        </div>
      );

    case "review_required":
      return (
        <div
          className={`${base} bg-blue-50 text-blue-700`}
        >
          <Clock3 className="h-4 w-4" />
        </div>
      );

    default:
      return (
        <div
          className={`${base} bg-gray-100 text-gray-600`}
        >
          <Bell className="h-4 w-4" />
        </div>
      );
  }
}


function getInitials(
  value:
    string
) {
  const cleaned =
    value
      .trim()
      .replace(
        /@.*$/,
        ""
      );

  const parts =
    cleaned
      .split(
        /[\s._-]+/
      )
      .filter(
        Boolean
      );

  if (
    parts.length ===
    0
  ) {
    return "U";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[
      0
    ]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}


function formatRole(
  role:
    string
) {
  switch (
    role
  ) {
    case "creator":
      return "Creator";

    case "marketing_reviewer":
      return "Marketing Reviewer";

    case "corpcom_reviewer":
      return "CorpCom Reviewer";

    case "admin":
      return "Admin";

    default:
      return role;
  }
}
