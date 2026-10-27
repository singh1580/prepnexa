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
import { MobileDrawer } from "./mobile-drawer";
import { UiIcon } from "./ui-icon";
import { normaliseProductName } from "@/features/catalog/presentation";
import { SidebarDisclosure } from "./sidebar-disclosure";
import { WorkspaceRouteEffects } from "./workspace-route-effects";

type NavItem = { key: string; href: string; label: string; icon: string };

function NavIcon({
  name,
  className = "",
  size = "default",
}: {
  name: string;
  className?: string;
  size?: "default" | "small";
}) {
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
    reviews: (
      <>
        <path d="M4 4h16v13H8l-4 4z" />
        <path d="m8 10 2.2 2.2L16 7" />
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
      className={`${size === "small" ? "size-4" : "size-[1.15rem]"} shrink-0 ${className}`}
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
      key: "reviews",
      href: "/admin/reviews",
      label: "Reviews & feedback",
      icon: "reviews",
    },
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
    key: "reviews",
    href: "/dashboard/reviews",
    label: "Review & Feedback",
    icon: "reviews",
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
  inDrawer = false,
}: {
  packages: PackageSummary[];
  activeCourse: ActiveCourse;
  activePackageSlug?: string;
  activePackageView?: PackageView;
  activeMaterialId?: string;
  expanded: boolean;
  inDrawer?: boolean;
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
    <SidebarDisclosure
      className="min-w-0"
      toggleClassName="mr-1"
      defaultOpen={expanded || Boolean(activePackageSlug)}
      openKey={activePackageSlug ?? (expanded ? "all-packages" : undefined)}
      label="My packages"
      trigger={
        <Link
          className={navItemClass(
            Boolean(expanded || activePackageSlug),
            false,
            inDrawer,
          )}
          href="/dashboard/courses"
        >
          <NavIcon name="library" />
          <span>My packages</span>
        </Link>
      }
    >
      <div className="my-1 mb-2 ml-0 grid gap-0.5 border-l border-[#e8e5e1] pl-4">
        <Link
          className="px-[.55rem] py-[.45rem] text-[.82rem] font-bold text-prep-orange"
          href="/dashboard/courses"
        >
          View all packages
        </Link>
        {packages.map((course) => (
          <SidebarDisclosure
            className="min-w-0 rounded-[.4rem]"
            summaryClassName="rounded-[.4rem] hover:bg-[#faf7f4]"
            primaryClassName={`p-[.55rem] text-[.84rem] font-bold ${course.slug === activePackageSlug ? "text-prep-orange" : "text-[#4d5459]"}`}
            defaultOpen={course.slug === activePackageSlug}
            openKey={
              course.slug === activePackageSlug ? course.slug : undefined
            }
            label={normaliseProductName(course.name)}
            trigger={<span>{normaliseProductName(course.name)}</span>}
            triggerToggles
            key={course.id}
          >
            <div className="mb-[.4rem] ml-[.35rem] grid border-l border-[#ece9e5] pl-[.55rem]">
              {sections.map(([key, label]) =>
                key === "materials" ? (
                  <div className="grid" key={key}>
                    <Link
                      className={`rounded-[.34rem] px-[.55rem] py-[.48rem] text-[.8rem] font-medium hover:bg-[#fff0e8] hover:text-prep-orange ${
                        course.slug === activePackageSlug &&
                        key === activePackageView
                          ? "bg-[#fff0e8] font-bold text-prep-orange"
                          : "text-[#656c72]"
                      }`}
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
                      <details
                        className="group/outline my-[.2rem] mr-0 mb-[.3rem] ml-[.45rem] min-w-0 border-l border-[#e6e3df] pl-[.45rem]"
                        open
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-[.32rem] bg-[#faf8f5] px-2 py-[.42rem] text-[.78rem] font-bold text-[#4f565b] [&::-webkit-details-marker]:hidden">
                          Course outline{" "}
                          <i className="grid place-items-center not-italic">
                            <UiIcon
                              className="size-4 transition-transform group-open/outline:rotate-180"
                              name="chevron"
                            />
                          </i>
                        </summary>
                        {groups.map((group) => (
                          <details
                            className="ml-[.35rem] min-w-0"
                            open={group.items.some(
                              (item) => item.id === activeMaterialId,
                            )}
                            key={group.subject}
                          >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-[.42rem] text-[.76rem] font-bold text-[#697075] [&::-webkit-details-marker]:hidden">
                              {group.subject}
                              <small className="text-[.68rem]">
                                {
                                  group.items.filter((item) => item.viewed)
                                    .length
                                }
                                /{group.items.length}
                              </small>
                            </summary>
                            {group.items.map((item) => (
                              <Link
                                className={`grid grid-cols-[1rem_minmax(0,1fr)] gap-[.35rem] px-[.45rem] py-[.4rem] text-[.73rem] leading-[1.35] ${
                                  item.id === activeMaterialId
                                    ? "bg-[#fff4ed] font-bold text-prep-orange"
                                    : "text-[#777d82]"
                                }`}
                                href={`/library/${item.id}?course=${encodeURIComponent(course.slug)}`}
                                key={item.id}
                              >
                                <span className="text-[#2b8a5b]">
                                  {item.viewed ? "✓" : "○"}
                                </span>
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
                    className={`rounded-[.34rem] px-[.55rem] py-[.48rem] text-[.8rem] font-medium hover:bg-[#fff0e8] hover:text-prep-orange ${
                      course.slug === activePackageSlug &&
                      key === activePackageView
                        ? "bg-[#fff0e8] font-bold text-prep-orange"
                        : "text-[#656c72]"
                    }`}
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
          </SidebarDisclosure>
        ))}
      </div>
    </SidebarDisclosure>
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
  inDrawer = false,
}: {
  items: NavItem[];
  section: string;
  unread?: number;
  packages?: PackageSummary[];
  activeCourse?: ActiveCourse;
  activePackageSlug?: string;
  activePackageView?: PackageView;
  activeMaterialId?: string;
  inDrawer?: boolean;
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
              className={navItemClass(section === item.key, !student, inDrawer)}
              aria-current={section === item.key ? "page" : undefined}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
              {item.key === "notifications" && unread > 0 ? (
                <b className="ml-auto grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-[#ee4a17] px-[.22rem] text-[.56rem] text-white">
                  {unread}
                </b>
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
              inDrawer={inDrawer}
            />
          ) : null}
        </div>
      ))}
    </nav>
  );
}

function navItemClass(active: boolean, admin: boolean, inDrawer = false) {
  const base =
    "relative flex min-h-[2.6rem] min-w-0 items-center gap-[.72rem] rounded-[.35rem] border-0 px-[.7rem] py-[.65rem] font-bold transition-colors";
  if (inDrawer) {
    return `${base} min-h-12 px-3 py-2.5 text-sm text-[#4f565c] hover:bg-[#fff6f1] hover:text-prep-orange ${
      active ? "bg-[#fff0e8] text-prep-orange" : "bg-transparent"
    }`;
  }
  if (admin) {
    return `${base} text-[.82rem] text-[#4f565c] hover:bg-[#faf4ef] hover:text-prep-orange ${
      active ? "bg-[#fff0e8] text-prep-orange" : "bg-transparent"
    }`;
  }
  return `${base} text-[.9rem] text-[#6b7177] hover:bg-[#fff6f1] hover:text-[#df4615] ${
    active
      ? "bg-[#fff1e9] text-prep-orange before:absolute before:top-[.42rem] before:bottom-[.42rem] before:left-[-.8rem] before:w-[3px] before:rounded-r-[3px] before:bg-[#eb4a16]"
      : "bg-transparent"
  }`;
}

export async function WorkspaceShell({
  admin,
  name,
  email,
  permissions = [],
  section,
  unreadNotifications = 0,
  userId,
  activePackageSlug,
  activePackageView,
  activeMaterialId,
  navigationPackages,
  mainClassName,
  children,
}: {
  admin: boolean;
  name: string;
  email: string;
  permissions?: readonly string[];
  section: string;
  unreadNotifications?: number;
  userId?: string;
  activePackageSlug?: string;
  activePackageView?: PackageView;
  activeMaterialId?: string;
  navigationPackages?: StudentCourse[];
  mainClassName?: string;
  children: React.ReactNode;
}) {
  const nav = admin ? adminNavigation(permissions) : studentNavigation;
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
  const dashboardMain = mainClassName === "student-dashboard-main";
  const rootClass = `workspace ${admin ? "admin-workspace" : "student-workspace"} grid min-h-screen min-w-0 grid-cols-1 bg-white print:block min-[1100px]:grid-cols-[minmax(240px,256px)_minmax(0,1fr)]`;
  const sidebarClass =
    "relative sticky top-0 hidden h-screen min-w-60 flex-col overflow-hidden border-r border-[#e6e2de] bg-white px-[.8rem] pb-5 pt-0 text-[#25292d] isolate before:pointer-events-none before:absolute before:top-[63px] before:right-0 before:left-0 before:z-[2] before:h-px before:bg-[#e6e2de] min-[1100px]:flex print:hidden";
  const mainClass = dashboardMain
    ? "workspace-main student-dashboard-main min-w-0 w-full max-w-none scroll-mt-[4.75rem] overflow-x-hidden p-0 print:max-w-none print:p-0"
    : `workspace-main mx-auto min-w-0 w-full scroll-mt-[4.75rem] overflow-x-clip bg-white px-[clamp(1rem,3vw,2.5rem)] pt-4 pb-16 min-[701px]:pt-5 print:max-w-none print:p-0 ${admin ? "max-w-[1440px]" : "max-w-[1240px]"}`;
  return (
    <div className={rootClass}>
      <a
        className="fixed top-3 left-3 z-[1000] -translate-y-[180%] rounded-lg bg-[#172554] px-4 py-3 font-extrabold text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <aside className={sidebarClass}>
        <div className="mb-4 ml-1.5 flex h-16 min-h-16 w-[188px] items-center [&_.brand-logo]:h-[34px] [&_.brand-logo]:w-[188px] [&_.brand-logo-link]:min-h-0 [&_.brand-logo-link]:min-w-[188px] [&_.brand-logo-link]:w-[188px]">
          <Brand />
        </div>
        <div className="mx-[.7rem] mt-1 mb-[.7rem] font-mono text-[.7rem] tracking-[.17em] text-prep-muted">
          {admin ? "ADMIN WORKSPACE" : "LEARNING WORKSPACE"}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-[.2rem] [overscroll-behavior:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>nav]:grid [&>nav]:content-start [&>nav]:gap-[.28rem]">
          <Navigation {...navigationProps} />
        </div>
        <Link
          className="mt-[.65rem] grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[.7rem] border-t border-[#eceae6] bg-white px-[.65rem] py-[.9rem] text-[#24282c]"
          href="/account/profile"
        >
          <span className="grid size-[2.2rem] place-items-center rounded-full bg-[#ecece8] font-extrabold text-[#111]">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="grid min-w-0">
            <strong className="overflow-hidden text-[.9rem] font-bold text-ellipsis whitespace-nowrap">
              {name}
            </strong>
            <small className="text-[.76rem] text-prep-muted">
              {admin ? "Profile & security" : "My account"}
            </small>
          </div>
          <NavIcon name="profile" size="small" className="text-prep-muted" />
        </Link>
      </aside>
      <div className="min-w-0">
        <WorkspaceRouteEffects />
        <header
          className={`sticky top-0 z-20 flex h-16 min-h-16 min-w-0 items-center justify-start gap-3 border-b border-[#e6e2de] bg-white px-[clamp(12px,2vw,16px)] text-sm print:hidden min-[1100px]:px-8 ${admin ? "" : "min-[1100px]:justify-end min-[1100px]:border-l"}`}
        >
          <MobileDrawer
            className="workspace-mobile-menu"
            drawerClassName="workspace-mobile-drawer"
            label={admin ? "Open admin navigation" : "Open student navigation"}
            variant="workspace"
          >
            <div className="mb-2 flex min-h-12 items-center border-b border-[#ebe7e2] pr-[52px] pb-2 [&_.brand-logo]:h-[34px] [&_.brand-logo]:w-[188px] [&_.brand-logo-link]:min-w-[188px] [&_.brand-logo-link]:w-[188px]">
              <Brand />
            </div>
            <Link
              className="mb-1.5 flex flex-col items-center border-b border-[#ebe7e2] px-2 pb-[9px] text-center text-[#17191c]"
              href="/account/profile"
            >
              <span className="mb-1 grid size-10 place-items-center rounded-full bg-[#fff0e8] text-base font-extrabold text-[#bd3d13]">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <strong className="w-full overflow-hidden text-[15px] leading-[1.3] font-bold text-ellipsis whitespace-nowrap text-[#24272a]">
                {name}
              </strong>
              <small className="mt-1 w-full overflow-hidden text-xs leading-[1.35] text-ellipsis whitespace-nowrap text-[#777d82]">
                {email}
              </small>
              <em className="mt-1 rounded-full bg-[#fff2eb] px-2 py-[3px] text-[11px] font-bold not-italic tracking-[.03em] text-[#b83c14]">
                {admin ? "Administrator" : "Student"}
              </em>
            </Link>
            <div className="grid w-full min-w-0 justify-stretch gap-0.5 [&>nav]:grid [&>nav]:gap-0.5">
              <Navigation {...navigationProps} inDrawer />
            </div>
            <div className="sticky bottom-[max(-18px,calc(-1*env(safe-area-inset-bottom)))] z-[4] mt-auto border-t border-[#ebe7e2] bg-white pt-3 pb-[max(2px,env(safe-area-inset-bottom))] [&>button]:flex [&>button]:min-h-[46px] [&>button]:w-full">
              <LogoutButton />
            </div>
          </MobileDrawer>
          <div className="order-2 block min-w-[188px] basis-[188px] min-[1100px]:hidden max-[340px]:min-w-[177px] max-[340px]:basis-[177px] [&_.brand-logo]:max-[340px]:h-8 [&_.brand-logo]:max-[340px]:w-[177px] [&_.brand-logo-link]:max-[340px]:min-w-[177px] [&_.brand-logo-link]:max-[340px]:w-[177px]">
            <Brand />
          </div>
          {admin ? (
            <>
              <PublicSearch variant="admin" />
              <Link
                className="relative hidden size-[2.35rem] shrink-0 place-items-center rounded-full border border-[#e1dfdc] text-[#62686e] min-[1100px]:grid"
                href="/admin/notifications"
                aria-label="Admin notifications"
              >
                <NavIcon name="notifications" />
              </Link>
              <Link
                className="hidden min-w-0 shrink-0 items-center gap-[.55rem] border-l border-[#e7e5e2] pl-[.9rem] text-[#34383c] min-[1100px]:flex"
                href="/account/profile"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[#fff0e9] font-extrabold text-[#a83712]">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <b className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap">
                  {name}
                </b>
              </Link>
            </>
          ) : (
            <>
              <PublicSearch variant="student" />
              <Link
                className="relative hidden size-[2.35rem] shrink-0 place-items-center rounded-full border border-[#e1dfdc] text-[#62686e] min-[1100px]:grid"
                href="/dashboard/notifications"
                aria-label={`${unreadNotifications} unread notifications`}
              >
                <NavIcon name="notifications" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -top-1 -right-[.15rem] grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-[#eb4814] px-[.15rem] text-[.52rem] text-white">
                    {unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <Link
                className="hidden min-w-0 shrink-0 items-center gap-[.55rem] border-l border-[#e7e5e2] pl-[.9rem] text-[#34383c] min-[1100px]:flex"
                href="/account/profile"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[#fff0e9] font-extrabold text-[#a83712]">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <b className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap">
                  {name}
                </b>
              </Link>
            </>
          )}
          <div className="hidden shrink-0 min-[1100px]:block [&>button]:min-h-8 [&>button]:border-[#e1dfdc] [&>button]:bg-white [&>button]:px-[.65rem] [&>button]:py-[.35rem] [&>button]:text-[.65rem] [&>button]:text-[#5d646a]">
            <LogoutButton />
          </div>
        </header>
        <main
          id="main-content"
          className={`${mainClass}${mainClassName ? ` ${mainClassName}` : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
