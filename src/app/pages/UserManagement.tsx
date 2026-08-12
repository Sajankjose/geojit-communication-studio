import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  KeyRound,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { TopNavBar } from "../components/TopNavBar";

import {
  AdminUser,
  createAdminUser,
  getAdminUsers,
  setAdminUserActive,
  UserRole,
} from "../services/adminUsers";

const ROLE_OPTIONS: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  {
    value: "creator",
    label: "Creator",
    description:
      "Creates, edits and submits communications.",
  },
  {
    value: "marketing_reviewer",
    label: "Marketing Reviewer",
    description:
      "Reviews creator submissions and sends approved copy to CorpCom.",
  },
  {
    value: "corpcom_reviewer",
    label: "CorpCom Reviewer",
    description:
      "Final communication approval authority.",
  },
  {
    value: "admin",
    label: "Admin",
    description:
      "Platform administration and oversight. Not an approver.",
  },
];

export function UserManagement() {
  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    showAddUser,
    setShowAddUser,
  ] = useState(false);

  const [
    statusTarget,
    setStatusTarget,
  ] =
    useState<AdminUser | null>(
      null
    );

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAdminUsers();

      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return users;
      }

      return users.filter(
        (user) =>
          [
            user.fullName,
            user.email,
            user.designation,
            user.department,
            getRoleLabel(
              user.role
            ),
            user.active
              ? "active"
              : "deactivated",
          ]
            .join(" ")
            .toLowerCase()
            .includes(term)
      );
    }, [search, users]);

  const roleCounts =
    useMemo(
      () => ({
        creator:
          users.filter(
            (user) =>
              user.role ===
                "creator" &&
              user.active
          ).length,

        marketing:
          users.filter(
            (user) =>
              user.role ===
                "marketing_reviewer" &&
              user.active
          ).length,

        corpcom:
          users.filter(
            (user) =>
              user.role ===
                "corpcom_reviewer" &&
              user.active
          ).length,

        admin:
          users.filter(
            (user) =>
              user.role ===
                "admin" &&
              user.active
          ).length,
      }),
      [users]
    );

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#07877B]">
              <ShieldCheck className="h-4 w-4" />
              Administration
            </div>

            <h1 className="text-3xl text-gray-900">
              User Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Add users, assign roles, and control platform access without deleting historical records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccess("");
              setError("");
              setShowAddUser(
                true
              );
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#07877B] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#06766a]"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RoleStat
            label="Active Creators"
            value={
              roleCounts.creator
            }
          />

          <RoleStat
            label="Active Marketing"
            value={
              roleCounts.marketing
            }
          />

          <RoleStat
            label="Active CorpCom"
            value={
              roleCounts.corpcom
            }
          />

          <RoleStat
            label="Active Admins"
            value={
              roleCounts.admin
            }
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-medium text-gray-900">
                Users
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {users.length} registered user
                {users.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search users..."
                  className="w-64 rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
                />
              </div>

              <button
                type="button"
                onClick={
                  loadUsers
                }
                disabled={
                  loading
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                aria-label="Refresh users"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-[#07877B]" />

              <p className="text-sm text-gray-500">
                Loading users...
              </p>
            </div>
          ) : filteredUsers.length ===
            0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-gray-300" />

              <p className="text-sm text-gray-500">
                No matching users.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map(
                (user) => (
                  <UserRow
                    key={
                      user.id
                    }
                    user={user}
                    onStatusChange={() => {
                      setError("");
                      setSuccess("");

                      setStatusTarget(
                        user
                      );
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      </main>

      {showAddUser && (
        <AddUserModal
          onClose={() =>
            setShowAddUser(
              false
            )
          }
          onCreated={(
            user
          ) => {
            setUsers(
              (current) => [
                user,
                ...current,
              ]
            );

            setShowAddUser(
              false
            );

            setSuccess(
              `${user.fullName} was created successfully as ${getRoleLabel(
                user.role
              )}.`
            );
          }}
        />
      )}

      {statusTarget && (
        <UserStatusModal
          user={
            statusTarget
          }
          onClose={() =>
            setStatusTarget(
              null
            )
          }
          onUpdated={async (
            active
          ) => {
            const userName =
              statusTarget.fullName ||
              statusTarget.email;

            setStatusTarget(
              null
            );

            setSuccess(
              `${userName} was ${
                active
                  ? "reactivated"
                  : "deactivated"
              } successfully.`
            );

            await loadUsers();
          }}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  onStatusChange,
}: {
  user: AdminUser;
  onStatusChange: () => void;
}) {
  const cannotDeactivateSelf =
    user.isCurrentUser &&
    user.active;

  return (
    <div
      className={`grid gap-4 p-5 md:grid-cols-[1.35fr,1fr,190px,140px,52px] md:items-center ${
        !user.active
          ? "bg-gray-50/70"
          : ""
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`font-medium ${
              user.active
                ? "text-gray-900"
                : "text-gray-500"
            }`}
          >
            {user.fullName ||
              "Unnamed User"}
          </p>

          {user.isCurrentUser && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              You
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-gray-500">
          {user.email}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-800">
          {user.designation ||
            "—"}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {user.department ||
            "—"}
        </p>
      </div>

      <RoleBadge
        role={
          user.role
        }
      />

      <StatusBadge
        active={
          user.active
        }
      />

      <button
        type="button"
        onClick={
          onStatusChange
        }
        disabled={
          cannotDeactivateSelf
        }
        title={
          cannotDeactivateSelf
            ? "You cannot deactivate your own account"
            : user.active
              ? "Deactivate user"
              : "Reactivate user"
        }
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

function UserStatusModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (
    active: boolean
  ) => void;
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const nextActive =
    !user.active;

  async function confirm() {
    try {
      setSaving(true);
      setError("");

      await setAdminUserActive({
        userId:
          user.id,
        active:
          nextActive,
      });

      onUpdated(
        nextActive
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user access."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
            nextActive
              ? "bg-green-50"
              : "bg-amber-50"
          }`}
        >
          {nextActive ? (
            <UserCheck className="h-5 w-5 text-green-700" />
          ) : (
            <UserMinus className="h-5 w-5 text-amber-700" />
          )}
        </div>

        <h2 className="text-xl text-gray-900">
          {nextActive
            ? "Reactivate User"
            : "Deactivate User"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          {nextActive
            ? `Restore platform access for ${
                user.fullName ||
                user.email
              }?`
            : `Deactivate ${
                user.fullName ||
                user.email
              }? The user will no longer be able to sign in, while their communications, reviews and audit history remain preserved.`}
        </p>

        {!nextActive && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            This does not delete the user or their historical records.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              confirm
            }
            disabled={
              saving
            }
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              nextActive
                ? "bg-[#07877B] hover:bg-[#06766a]"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {saving
              ? "Saving..."
              : nextActive
                ? "Reactivate User"
                : "Deactivate User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    user: AdminUser
  ) => void;
}) {
  const [form, setForm] =
    useState({
      fullName: "",
      email: "",
      designation: "",
      department: "",
      role:
        "creator" as UserRole,
      password: "",
    });

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  function update(
    key:
      keyof typeof form,
    value:
      string
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );

    if (error) {
      setError("");
    }
  }

  async function submit(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError(
        "Full name, email and temporary password are required."
      );

      return;
    }

    if (
      form.password.length <
      8
    ) {
      setError(
        "Temporary password must contain at least 8 characters."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      setError("");

      const user =
        await createAdminUser({
          fullName:
            form.fullName,
          email:
            form.email,
          designation:
            form.designation,
          department:
            form.department,
          role:
            form.role,
          password:
            form.password,
        });

      onCreated(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create user."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-200 bg-white p-6">
          <div>
            <h2 className="text-xl text-gray-900">
              Add User
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create the login and assign the user's role.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={
            submit
          }
          className="p-6"
        >
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Full Name"
              required
              value={
                form.fullName
              }
              onChange={(
                value
              ) =>
                update(
                  "fullName",
                  value
                )
              }
            />

            <FormField
              label="Email"
              type="email"
              required
              value={
                form.email
              }
              onChange={(
                value
              ) =>
                update(
                  "email",
                  value
                )
              }
            />

            <FormField
              label="Designation"
              value={
                form.designation
              }
              onChange={(
                value
              ) =>
                update(
                  "designation",
                  value
                )
              }
            />

            <FormField
              label="Department"
              value={
                form.department
              }
              onChange={(
                value
              ) =>
                update(
                  "department",
                  value
                )
              }
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Role
            </label>

            <div className="grid gap-2">
              {ROLE_OPTIONS.map(
                (option) => (
                  <label
                    key={
                      option.value
                    }
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      form.role ===
                      option.value
                        ? "border-[#07877B] bg-[#f3fbfa]"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="role"
                        checked={
                          form.role ===
                          option.value
                        }
                        onChange={() =>
                          update(
                            "role",
                            option.value
                          )
                        }
                        className="mt-1 accent-[#07877B]"
                      />

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {option.label}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {
                            option.description
                          }
                        </p>
                      </div>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-500" />

              <p className="text-sm font-medium text-gray-800">
                Temporary Password
              </p>
            </div>

            <FormField
              label=""
              type="password"
              required
              value={
                form.password
              }
              placeholder="Minimum 8 characters"
              onChange={(
                value
              ) =>
                update(
                  "password",
                  value
                )
              }
            />
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                submitting
              }
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#07877B] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#06766a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              {submitting
                ? "Creating..."
                : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  return (
    <span className="inline-flex rounded-full border border-[#b3d9d5] bg-[#e8f5f4] px-3 py-1 text-xs font-medium text-[#07877B]">
      {getRoleLabel(
        role
      )}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return active ? (
    <span className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="inline-flex w-fit rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      Deactivated
    </span>
  );
}

function RoleStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-2xl text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        {label}
      </p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>
      )}

      <input
        type={type}
        value={value}
        required={required}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#07877B] focus:outline-none focus:ring-2 focus:ring-[#07877B]/20"
      />
    </div>
  );
}

function getRoleLabel(
  role: UserRole
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
  }
}
