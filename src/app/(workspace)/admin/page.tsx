import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { getAdminDashboard } from "@/features/operations/admin-dashboard";

export const metadata = { title: "Admin dashboard" };
function MetricIcon({
  name,
}: {
  name: "revenue" | "orders" | "students" | "packages";
}) {
  const paths = {
    revenue: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-8M22 19H2" />
        <path d="m4 7 5-3 5 3 6-5" />
      </>
    ),
    orders: (
      <>
        <path d="M5 4h14l-1 16H6zM9 8a3 3 0 0 0 6 0" />
      </>
    ),
    students: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    packages: (
      <>
        <path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
function change(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
function Trend({ value }: { value: number }) {
  return (
    <small
      className={`col-span-full text-[0.65rem] font-bold ${value < 0 ? "text-[#c83b31]" : "text-[#0b7144]"}`}
    >
      {value < 0 ? "↓" : "↑"} {Math.abs(value)}%{" "}
      <span className="ml-1 font-normal text-prep-muted">
        vs. previous period
      </span>
    </small>
  );
}
const chartMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function chartDate(value: Date, includeYear = false) {
  const date = new Date(value);
  const label = `${date.getUTCDate()} ${chartMonths[date.getUTCMonth()]}`;
  return includeYear ? `${label} ${date.getUTCFullYear()}` : label;
}
function RevenueChart({
  items,
}: {
  items: { day: Date; revenuePaise: number }[];
}) {
  const width = 760,
    height = 220,
    left = 64,
    right = 18,
    top = 14,
    bottom = 24,
    max = Math.max(1, ...items.map((i) => i.revenuePaise));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const points = items
    .map(
      (item, index) =>
        `${left + (index / Math.max(1, items.length - 1)) * (width - left - right)},${height - bottom - (item.revenuePaise / max) * (height - top - bottom)}`,
    )
    .join(" ");
  const area = `${left},${height - bottom} ${points} ${width - right},${height - bottom}`;
  return (
    <div
      className="min-w-0 overflow-x-auto px-[0.2rem] pt-[0.2rem]"
      tabIndex={0}
      aria-label="Scrollable revenue chart"
    >
      <svg
        className="block h-auto min-w-[42rem] overflow-visible [aspect-ratio:760/220] [&_text]:font-sans"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue in rupees over selected period"
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ef4b17" stopOpacity=".28" />
            <stop offset="1" stopColor="#ef4b17" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {ticks.map((value) => {
          const y = height - bottom - value * (height - top - bottom);
          return (
            <g key={value}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#ebe8e4"
                strokeWidth="1"
              />
              <text
                x={left - 8}
                y={y + 4}
                textAnchor="end"
                fill="#747b80"
                fontSize="11"
              >
                {formatMoney(Math.round(max * value), "INR")}
              </text>
            </g>
          );
        })}
        <text
          x="12"
          y={height / 2}
          transform={`rotate(-90 12 ${height / 2})`}
          textAnchor="middle"
          fill="#62686d"
          fontSize="11"
        >
          Revenue
        </text>
        <polygon points={area} fill="url(#revenueFill)" />
        <polyline
          points={points}
          fill="none"
          stroke="#ef4b17"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {items.map((item, index) => {
          const [x, y] = points.split(" ")[index].split(",");
          return (
            <circle key={String(item.day)} cx={x} cy={y} r="3.5" fill="#ef4b17">
              <title>{`${chartDate(item.day, true)}: ${formatMoney(item.revenuePaise, "INR")}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="flex min-w-[42rem] justify-between gap-[0.35rem] pl-[3.8rem] text-[0.62rem] text-prep-muted">
        <span className="ml-[-3.6rem] font-[750] text-[#62686d]">Date</span>
        {items
          .filter(
            (_, index) =>
              index === 0 ||
              index === items.length - 1 ||
              index % Math.max(1, Math.floor(items.length / 5)) === 0,
          )
          .map((item) => (
            <span key={String(item.day)}>{chartDate(item.day)}</span>
          ))}
      </div>
    </div>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const requested = Number((await searchParams).days ?? 30);
  const auth = await requireWorkspace(true);
  const data = await getAdminDashboard(requested);
  const revenueChange = change(
      data.summary.revenuePaise,
      data.summary.previousRevenuePaise,
    ),
    orderChange = change(data.summary.orders, data.summary.previousOrders),
    studentChange = change(
      data.summary.newUsers,
      data.summary.previousNewUsers,
    ),
    packageChange = change(
      data.summary.newLiveProducts,
      data.summary.previousNewLiveProducts,
    );
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="overview"
    >
      <header className="mb-[1.1rem] flex items-center justify-between gap-5 max-[700px]:items-stretch max-[700px]:flex-col">
        <div>
          <h1 className="m-0 mb-[0.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-0.04em] text-[#101828]">
            Dashboard
          </h1>
          <p className="m-0 max-w-3xl text-[0.88rem] leading-[1.55] text-prep-muted">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>
        <form className="flex items-center gap-2 max-[700px]:w-full">
          <label className="min-w-48 max-[700px]:min-w-0 max-[700px]:flex-1">
            <span className="sr-only">Reporting period</span>
            <select
              className="h-[2.6rem] w-full rounded-[0.4rem] border border-[#dcdedf] bg-white px-[0.8rem] py-[0.55rem]"
              name="days"
              defaultValue={data.days}
            >
              {[7, 14, 30, 90].map((days) => (
                <option key={days} value={days}>
                  Last {days} days
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex min-h-[2.6rem] cursor-pointer items-center justify-center rounded-prep-control border border-prep-orange bg-white px-[0.9rem] py-[0.55rem] text-sm font-bold text-prep-orange-dark hover:bg-prep-orange-wash"
            type="submit"
          >
            Update
          </button>
        </form>
      </header>
      <section className="mb-4 grid grid-cols-4 gap-4 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1 [&>article]:relative [&>article]:grid [&>article]:grid-cols-[2.4rem_1fr] [&>article]:gap-x-[0.7rem] [&>article]:gap-y-[0.2rem] [&>article]:rounded-lg [&>article]:border [&>article]:border-prep-line [&>article]:bg-white [&>article]:p-4">
        <article>
          <i className="row-span-2 grid size-9 place-items-center rounded-[0.42rem] bg-[#fff0e8] text-[#e84a17] [&_svg]:size-[1.2rem]">
            <MetricIcon name="revenue" />
          </i>
          <span className="text-[0.72rem] text-[#50575d]">Revenue</span>
          <strong className="col-span-full mt-[0.45rem] text-[1.65rem] tracking-[-0.04em]">
            {formatMoney(data.summary.revenuePaise, "INR")}
          </strong>
          <Trend value={revenueChange} />
        </article>
        <article>
          <i className="row-span-2 grid size-9 place-items-center rounded-[0.42rem] bg-[#fff0e8] text-[#e84a17] [&_svg]:size-[1.2rem]">
            <MetricIcon name="orders" />
          </i>
          <span className="text-[0.72rem] text-[#50575d]">Paid Orders</span>
          <strong className="col-span-full mt-[0.45rem] text-[1.65rem] tracking-[-0.04em]">
            {data.summary.orders}
          </strong>
          <Trend value={orderChange} />
        </article>
        <article>
          <i className="row-span-2 grid size-9 place-items-center rounded-[0.42rem] bg-[#fff0e8] text-[#e84a17] [&_svg]:size-[1.2rem]">
            <MetricIcon name="students" />
          </i>
          <span className="text-[0.72rem] text-[#50575d]">Students</span>
          <strong className="col-span-full mt-[0.45rem] text-[1.65rem] tracking-[-0.04em]">
            {data.summary.users}
          </strong>
          <Trend value={studentChange} />
        </article>
        <article>
          <i className="row-span-2 grid size-9 place-items-center rounded-[0.42rem] bg-[#fff0e8] text-[#e84a17] [&_svg]:size-[1.2rem]">
            <MetricIcon name="packages" />
          </i>
          <span className="text-[0.72rem] text-[#50575d]">Live Packages</span>
          <strong className="col-span-full mt-[0.45rem] text-[1.65rem] tracking-[-0.04em]">
            {data.summary.liveProducts}
          </strong>
          <Trend value={packageChange} />
        </article>
      </section>
      <section className="mb-[0.8rem] overflow-hidden rounded-[0.65rem] border border-prep-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="mb-[0.3rem] flex items-start justify-between gap-4">
          <h2 className="m-0 text-base">Revenue</h2>
          <form>
            <select
              className="h-9 rounded-[0.35rem] border border-[#dcdedf] bg-white px-[0.7rem] py-[0.4rem]"
              name="days"
              aria-label="Revenue reporting period"
              defaultValue={data.days}
            >
              {[7, 14, 30, 90].map((days) => (
                <option key={days} value={days}>
                  {days === 7 ? "Daily" : `Last ${days} days`}
                </option>
              ))}
            </select>
            <button className="sr-only">Update chart</button>
          </form>
        </div>
        <RevenueChart items={data.revenue} />
      </section>
      <div className="grid grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)] gap-[0.8rem] max-[1000px]:grid-cols-1">
        <section className="min-w-0 rounded-[0.65rem] border border-prep-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="my-1 text-base">Best-selling packages</h2>
            <Link className="text-[0.78rem] font-bold" href="/admin/packages">
              View all
            </Link>
          </div>
          {data.topProducts.length ? (
            <ol className="m-0 list-none p-0">
              {data.topProducts.map((product, index) => (
                <li
                  className="grid min-h-12 grid-cols-[1.5rem_1fr_auto] items-center gap-[0.65rem] border-t border-[#eef1f5] py-[0.7rem]"
                  key={product.id}
                >
                  <i className="not-italic text-[#94a3b8]">{index + 1}</i>
                  <span className="grid text-[0.82rem] font-[650]">
                    {product.name}
                    <small className="text-prep-muted">
                      {product.sold} orders
                    </small>
                  </span>
                  <strong>{formatMoney(product.revenuePaise, "INR")}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="leading-[1.65]">Sales will appear here.</p>
          )}
        </section>
        <section className="min-w-0 overflow-hidden rounded-[0.65rem] border border-prep-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
          <div className="flex items-start justify-between gap-4 p-5">
            <h2 className="my-1 text-base">Recent orders</h2>
            <Link className="text-[0.78rem] font-bold" href="/admin/orders">
              View all
            </Link>
          </div>
          <div
            className="overflow-auto"
            tabIndex={0}
            aria-label="Scrollable recent orders table"
          >
            <table className="w-full min-w-[36rem] border-collapse text-[0.78rem] [&_td]:border-b [&_td]:border-[#edf0f4] [&_td]:px-[0.8rem] [&_td]:py-[0.78rem] [&_td]:text-[0.82rem] [&_td]:text-[#344054] [&_td]:align-middle [&_td>small]:block [&_td>small]:text-[0.72rem] [&_td>small]:text-prep-muted [&_td>strong]:block [&_th]:border-y [&_th]:border-prep-line [&_th]:px-[0.8rem] [&_th]:py-[0.72rem] [&_th]:text-left [&_th]:text-[0.72rem] [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-[#60676d]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(0, 7).toUpperCase()}</td>
                    <td>
                      <strong>{order.name}</strong>
                      <small>{order.email}</small>
                    </td>
                    <td>{formatMoney(order.totalPaise, "INR")}</td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.recentOrders.length ? (
            <div className="flex min-h-32 flex-col items-center justify-center p-6 text-center text-prep-muted">
              <strong>No orders yet</strong>
            </div>
          ) : null}
        </section>
      </div>
    </WorkspaceShell>
  );
}
