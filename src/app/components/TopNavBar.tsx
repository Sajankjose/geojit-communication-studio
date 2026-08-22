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
  User,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../auth/useAuth";

import {
  AppNotification,
  formatNotificationTime,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToMyNotifications,
} from "../services/notifications";

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
    profile?.full_name ||
    user?.email ||
    "Employee";

  const employeeInfo =
    profile?.designation ||
    profile?.department ||
    user?.email ||
    "";

  const isAdmin =
    profile?.role === "admin";

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            !item.is_read
        ).length,
      [notifications]
    );

  const loadNotifications =
    useCallback(
      async () => {
        if (!user?.id) {
          setNotifications(
            []
          );
          return;
        }

        try {
          setNotificationLoading(
            true
          );

          setNotificationError(
            ""
          );

          const items =
            await getMyNotifications(
              20
            );

          setNotifications(
            items
          );
        } catch (error) {
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
      [user?.id]
    );

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void loadNotifications();

    const unsubscribe =
      subscribeToMyNotifications({
        userId:
          user.id,

        onChange: () => {
          void loadNotifications();
        },
      });

    return unsubscribe;
  }, [
    user?.id,
    loadNotifications,
  ]);

  const handleLogout =
    async () => {
      try {
        await signOut();

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Logout error:",
          error
        );
      }
    };

  const handleSettings =
    () => {
      navigate(
        "/settings/rules"
      );
    };

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

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      is_read:
                        true,
                    }
                  : item
            )
        );
      }
    } catch (error) {
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
        `/approval/status?communicationId=${notification.communication_id}`
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              is_read: true,
            })
          )
      );
    } catch (error) {
      console.error(
        "Unable to mark all notifications read:",
        error
      );
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center px-6">

        <button
          onClick={() =>
            navigate("/")
          }
          className="flex items-center gap-4 text-left"
        >
          <div>
            <p className="text-lg font-semibold text-[#07877B]">
              Geojit Communication Engine
            </p>

            <p className="text-xs text-gray-500">
              AI-powered email creation
            </p>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-4">

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setIsNotificationOpen(
                  (current) =>
                    !current
                );

                setIsUserMenuOpen(
                  false
                );

                void loadNotifications();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />

              {unreadCount >
                0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
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
                  className="fixed inset-0 z-30"
                  onClick={() =>
                    setIsNotificationOpen(
                      false
                    )
                  }
                />

                <div className="absolute right-0 z-40 mt-2 w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Notifications
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {unreadCount}
                        {" "}
                        unread
                      </p>
                    </div>

                    {unreadCount >
                      0 && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleMarkAllRead()
                        }
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#07877B] hover:bg-[#F3FBFA]"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[430px] overflow-y-auto">
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
                        <Bell className="mx-auto mb-3 h-7 w-7 text-gray-300" />

                        <p className="text-sm font-medium text-gray-700">
                          You're all caught up
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          New workflow updates will appear here.
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
                            className={`flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                              !notification.is_read
                                ? "bg-[#F4FBFA]"
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
                                <p className="flex-1 text-sm font-medium text-gray-900">
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.is_read && (
                                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#07877B]" />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-1.5 text-[11px] text-gray-400">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </p>
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

          {isAdmin && (
            <button
              type="button"
              aria-label="Settings"
              onClick={
                handleSettings
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(
                  (current) =>
                    !current
                );

                setIsNotificationOpen(
                  false
                );
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07877B] text-white">
                <User className="h-4 w-4" />
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium">
                  {
                    employeeName
                  }
                </p>

                <p className="text-xs text-gray-500">
                  {
                    employeeInfo
                  }
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() =>
                    setIsUserMenuOpen(
                      false
                    )
                  }
                />

                <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">

                  <div className="border-b border-gray-100 p-4">
                    <p className="text-sm font-medium text-gray-900">
                      {
                        employeeName
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {
                        user?.email
                      }
                    </p>

                    {profile?.designation && (
                      <p className="mt-1 text-xs text-gray-500">
                        {
                          profile.designation
                        }
                      </p>
                    )}

                    {profile?.department && (
                      <p className="mt-1 text-xs text-gray-500">
                        {
                          profile.department
                        }
                      </p>
                    )}

                    {profile?.role && (
                      <div className="mt-3">
                        <span className="inline-flex rounded-full bg-[#e8f5f4] px-2.5 py-1 text-xs font-medium text-[#07877B]">
                          {formatRole(
                            profile.role
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
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

function NotificationIcon({
  type,
}: {
  type: string;
}) {
  const base =
    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full";

  switch (type) {
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

function formatRole(
  role: string
) {
  switch (role) {
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
