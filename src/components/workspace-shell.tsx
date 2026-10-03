import Link from "next/link";
import { Brand } from "./brand";
import { LogoutButton } from "@/features/account/account-actions";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { PublicSearch } from "./public-search";
import { getCurrentAuth } from "@/features/auth/authorization";
import {
  getStudentCourse,
  getStudentCourses,
} from "@/features/student-courses/service";
import type { StudentCourse } from "@/features/student-courses/repository";

type NavItem = { key: string; href: string; label: string; icon: string };

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    library: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16" />
      </>
    ),
    tests: (
      <>
        <path d="M9 4h6" />
        <path d="M9 8h6" />
        <rect x="4" y="2" width="16" height="20" rx="3" />
        <path d="m8 14 2 2 5-5" />
      </>
    ),
    product: (
      <>
        <path d="m12 2 9 5-9 5-9-5z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </>
    ),
    coupon: (
      <>
        <path d="M3 9a3 3 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a3 3 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        <path d="m9 9 6 6" />
        <path d="M15 9h.01M9 15h.01" />
      </>
    ),
    orders: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
        <path d="M9 7h6M9 11h6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M16 4a4 4 0 0 1 0 8M17 14a7 7 0 0 1 5 7" />
      </>
    ),
    support: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.6 2.6 0 1 1 4.2 2c-1 .7-1.7 1.2-1.7 2.5" />
        <path d="M12 17h.01" />
      </>
    ),
    notifications: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
  };
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.dashboard}
    </svg>
  );
}

function adminNavigation(permissions: readonly string[]): NavItem[] {
  return [
    { key: "overview", href: "/admin", label: "Dashboard", icon: "dashboard" },
    ...(permissions.includes(CONTENT_PERMISSIONS.manageMaterials)
      ? [
          {
            key: "materials",
            href: "/admin/materials",
            label: "Store & materials",
            icon: "library",
          },
        ]
      : []),
    ...([
      CONTENT_PERMISSIONS.manageTests,
      CONTENT_PERMISSIONS.manageSchedules,
    ].some((permission) => permissions.includes(permission))
      ? [
          {
            key: "tests",
            href: "/admin/tests",
            label: "Tests & practice sets",
            icon: "tests",
          },
        ]
      : []),
    ...(permissions.includes(CONTENT_PERMISSIONS.manageProducts)
      ? [
          {
            key: "packages",
            href: "/admin/packages",
            label: "Product package builder",
            icon: "product",
          },
        ]
      : []),
    {
      key: "coupons",
      href: "/admin/coupons",
      label: "Coupons",
      icon: "coupon",
    },
    {
      key: "orders",
      href: "/admin/orders",
      label: "Orders & payments",
      icon: "orders",
    },
    ...(permissions.includes(OPERATIONS_PERMISSIONS.readStudents)
      ? [
          {
            key: "students",
            href: "/admin/students",
            label: "Students",
            icon: "users",
          },
        ]
      : []),
    ...(permissions.includes(OPERATIONS_PERMISSIONS.manageSupport)
      ? [
          {
            key: "support",
            href: "/admin/support",
            label: "Support",
            icon: "support",
          },
        ]
      : []),
    ...(permissions.includes(OPERATIONS_PERMISSIONS.manageNotifications)
      ? [
          {
            key: "notifications",
            href: "/admin/notifications",
            label: "Notifications",
            icon: "notifications",
          },
        ]
      : []),
    {
      key: "profile",
      href: "/account/profile",
      label: "Profile & security",
      icon: "profile",
    },
  ];
}

const studentNavigation: NavItem[] = [
  {
    key: "overview",
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    key: "orders",
    href: "/dashboard/orders",
    label: "My orders",
    icon: "orders",
  },
  {
    key: "notifications",
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: "notifications",
  },
  {
    key: "support",
    href: "/dashboard/support",
    label: "Support",
    icon: "support",
  },
  {
    key: "explore",
    href: "/packages",
    label: "Explore packages",
    icon: "search",
  },
];

type PackageSummary = { id: string; slug: string; name: string };
type ActiveCourse = Awaited<ReturnType<typeof getStudentCourse>>;
type PackageView = "overview" | "materials" | "tests" | "results";

function StudentPackageMenu({
  packages,
  activeCourse,
  activePackageSlug,
  activePackageView = "overview",
  activeMaterialId,
  expanded,
}: {
  packages: PackageSummary[];
  activeCourse: ActiveCourse;
  activePackageSlug?: string;
  activePackageView?: PackageView;
  activeMaterialId?: string;
  expanded: boolean;
}) {
  const groups = activeCourse
    ? Array.from(
        new Set(activeCourse.materials.map((item) => item.subject)),
      ).map((subject) => ({
        subject,
        items: activeCourse.materials.filter(
          (item) => item.subject === subject,
        ),
      }))
    : [];
  const sections: [PackageView, string][] = [
    ["overview", "Overview"],
    ["materials", "Study materials"],
    ["tests", "Tests & practice sets"],
    ["results", "Results & analysis"],
  ];
  return (
    <details
      className="package-sidebar-menu"
      open={expanded || Boolean(activePackageSlug)}
    >
      <summary>
        <Link
          className={activePackageSlug ? "nav-item active" : "nav-item"}
          href="/dashboard/courses"
        >
          <NavIcon name="library" />
          <span>My packages</span>
        </Link>
        <i aria-hidden="true">⌄</i>
      </summary>
      <div className="package-sidebar-list">
        <Link className="package-view-all" href="/dashboard/courses">
          View all packages
        </Link>
        {packages.map((course) => (
          <details
            className="sidebar-course"
            open={course.slug === activePackageSlug}
            key={course.id}
          >
            <summary>
              <span>{course.name}</span>
              <i aria-hidden="true">⌄</i>
            </summary>
            <div className="sidebar-course-links">
              {sections.map(([key, label]) =>
                key === "materials" ? (
                  <div className="sidebar-materials-group" key={key}>
                    <Link
                      className={
                        course.slug === activePackageSlug &&
                        key === activePackageView
                          ? "active"
                          : ""
                      }
                      aria-current={
                        course.slug === activePackageSlug &&
                        key === activePackageView
                          ? "page"
                          : undefined
                      }
                      href={`/dashboard/courses/${course.slug}?view=${key}`}
                    >
                      {label}
                    </Link>
                    {course.slug === activePackageSlug &&
                    activePackageView === "materials" &&
                    groups.length ? (
                      <details className="sidebar-course-outline" open>
                        <summary>
                          Course outline <i aria-hidden="true">⌄</i>
                        </summary>
                        {groups.map((group) => (
                          <details
                            open={group.items.some(
                              (item) => item.id === activeMaterialId,
                            )}
                            key={group.subject}
                          >
                            <summary>
                              {group.subject}
                              <small>
                                {
                                  group.items.filter((item) => item.viewed)
                                    .length
                                }
                                /{group.items.length}
                              </small>
                            </summary>
                            {group.items.map((item) => (
                              <Link
                                className={
                                  item.id === activeMaterialId
                                    ? "active material-active"
                                    : ""
                                }
                                href={`/library/${item.id}?course=${encodeURIComponent(course.slug)}`}
                                key={item.id}
                              >
                                <span>{item.viewed ? "✓" : "○"}</span>
                                {item.title}
                              </Link>
                            ))}
                          </details>
                        ))}
                      </details>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    className={
                      course.slug === activePackageSlug &&
                      key === activePackageView
                        ? "active"
                        : ""
                    }
                    aria-current={
                      course.slug === activePackageSlug &&
                      key === activePackageView
                        ? "page"
                        : undefined
                    }
                    href={`/dashboard/courses/${course.slug}?view=${key}`}
                    key={key}
                  >
                    {label}
                  </Link>
                ),
              )}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

function Navigation({
  items,
  section,
  unread = 0,
  packages = [],
  activeCourse,
  activePackageSlug,
  activePackageView,
  activeMaterialId,
}: {
  items: NavItem[];
  section: string;
  unread?: number;
  packages?: PackageSummary[];
  activeCourse?: ActiveCourse;
  activePackageSlug?: string;
  activePackageView?: PackageView;
  activeMaterialId?: string;
}) {
  const student = !items.some(
    (item) => item.key === "overview" && item.href === "/admin",
  );
  return (
    <nav aria-label="Workspace">
      {items.map((item, index) => (
        <div className="nav-entry" key={item.key}>
          <div className="nav-group">
            <Link
              href={item.href}
              className={section === item.key ? "nav-item active" : "nav-item"}
              aria-current={section === item.key ? "page" : undefined}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
              {item.key === "notifications" && unread > 0 ? (
                <b className="nav-count">{unread}</b>
              ) : null}
            </Link>
          </div>
          {student && index === 0 ? (
            <StudentPackageMenu
              packages={packages}
              activeCourse={activeCourse}
              activePackageSlug={activePackageSlug}
              activePackageView={activePackageView}
              activeMaterialId={activeMaterialId}
              expanded={section === "courses"}
            />
          ) : null}
        </div>
      ))}
    </nav>
  );
}

export async function WorkspaceShell({
  admin,
  name,
  permissions = [],
  section,
  unreadNotifications = 0,
  userId,
  activePackageSlug,
  activePackageView,
  activeMaterialId,
  navigationPackages,
  children,
}: {
  admin: boolean;
  name: string;
  permissions?: readonly string[];
  section: string;
  unreadNotifications?: number;
  userId?: string;
  activePackageSlug?: string;
  activePackageView?: PackageView;
  activeMaterialId?: string;
  navigationPackages?: StudentCourse[];
  children: React.ReactNode;
}) {
  const nav = admin ? adminNavigation(permissions) : studentNavigation;
  const current =
    section === "courses"
      ? "My packages"
      : (nav.find((item) => item.key === section)?.label ??
        (admin ? "Administration" : "Dashboard"));
  const resolvedUserId = !admin
    ? (userId ?? (await getCurrentAuth())?.user.id)
    : undefined;
  const [packages, activeCourse] = resolvedUserId
    ? await Promise.all([
        navigationPackages ?? getStudentCourses(resolvedUserId),
        activePackageSlug
          ? getStudentCourse(activePackageSlug, resolvedUserId)
          : Promise.resolve(undefined),
      ])
    : [[], undefined];
  const navigationProps = {
    items: nav,
    section,
    unread: unreadNotifications,
    packages,
    activeCourse,
    activePackageSlug,
    activePackageView,
    activeMaterialId,
  };
  return (
    <div
      className={
        admin ? "workspace admin-workspace" : "workspace student-workspace"
      }
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">
          {admin ? "ADMIN WORKSPACE" : "LEARNING WORKSPACE"}
        </div>
        <Navigation {...navigationProps} />
        <Link className="sidebar-bottom" href="/account/profile">
          <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <small>{admin ? "Profile & security" : "My account"}</small>
          </div>
          <NavIcon name="profile" />
        </Link>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <div className="mobile-brand">
            <Brand />
          </div>
          {admin ? (
            <>
              <strong className="admin-header-title">{current}</strong>
              <PublicSearch />
              <Link
                className="student-header-bell"
                href="/admin/notifications"
                aria-label="Admin notifications"
              >
                <NavIcon name="notifications" />
              </Link>
              <Link className="student-header-account" href="/account/profile">
                <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
                <b>{name}</b>
              </Link>
            </>
          ) : (
            <>
              <strong className="student-header-title">{current}</strong>
              <PublicSearch />
              <Link
                className="student-header-bell"
                href="/dashboard/notifications"
                aria-label={`${unreadNotifications} unread notifications`}
              >
                <NavIcon name="notifications" />
                {unreadNotifications > 0 ? (
                  <span>{unreadNotifications}</span>
                ) : null}
              </Link>
              <Link className="student-header-account" href="/account/profile">
                <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
                <b>{name}</b>
              </Link>
            </>
          )}
          <LogoutButton />
        </header>
        <details
          className={admin ? "admin-mobile-menu" : "student-mobile-menu"}
        >
          <summary>
            <span aria-hidden="true">☰</span>{" "}
            {admin ? "Admin menu" : "Student menu"}
          </summary>
          <Navigation {...navigationProps} />
          {!admin ? (
            <Link className="mobile-account-link" href="/account/profile">
              <NavIcon name="profile" /> My account
            </Link>
          ) : null}
        </details>
        <main id="main-content" className="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}
