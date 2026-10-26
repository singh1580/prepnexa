import Link from "next/link";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import {
  BUSINESS_ADDRESS,
  BUSINESS_ENTITY_TYPE,
  BUSINESS_GRIEVANCE_OFFICER,
  BUSINESS_LEGAL_OWNER,
  BUSINESS_SUPPORT_EMAIL,
  BUSINESS_SUPPORT_PHONE,
  BUSINESS_SUPPORT_PHONE_E164,
} from "@/config/business";
import { ContactForm } from "@/features/contact/ui/contact-form";

export const metadata = {
  title: "Contact us",
  description:
    "Contact Prepstore for account support, payment help, business enquiries, privacy requests and formal grievances.",
};

const eyebrow =
  "block text-[.72rem] font-extrabold tracking-[.12em] text-prep-orange";
const sectionHeading =
  "max-w-[42rem] [&>h2]:mt-[.55rem] [&>h2]:mb-[.65rem] [&>h2]:text-[clamp(2rem,4vw,3.15rem)] [&>h2]:tracking-[-.04em] [&>p]:m-0 [&>p]:leading-[1.7] [&>p]:text-[#626a70]";
const routeCard =
  "flex min-h-96 flex-col rounded-[.9rem] border border-[#dfddd9] bg-white p-[clamp(1.5rem,3vw,2.25rem)] shadow-[0_1rem_2.6rem_#3120160a] max-[850px]:min-h-80 max-[560px]:min-h-0 max-[560px]:p-[1.3rem]";
const routeIcon =
  "grid size-[3.1rem] place-items-center rounded-[.65rem] bg-[#fff0e9] text-prep-orange [&_svg]:w-[1.45rem]";

function ContactIcon({
  name,
}: {
  name: "help" | "email" | "phone" | "location" | "shield";
}) {
  const paths = {
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 2-2.5 2-2.5 4M12 18h.01" />
      </>
    ),
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    phone: (
      <path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-4-1-1.2 2a14 14 0 0 1-9.8-9.8L8 7Z" />
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
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

export default async function Page() {
  const auth = await getCurrentAuth();
  const isAdmin = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role));
  const supportHref = auth
    ? isAdmin
      ? "/admin/support"
      : "/dashboard/support"
    : "/login?next=%2Fdashboard%2Fsupport";

  return (
    <main className="mx-auto w-[min(76rem,calc(100%-3rem))] py-8 pb-20 text-[#202327] max-[560px]:w-[min(calc(100%-2rem),76rem)] max-[560px]:pt-4">
      <nav
        className="my-[0.2rem] mb-4 flex items-center gap-[0.55rem] text-[0.78rem] text-[#667078] [&_b]:text-[#202326]"
        aria-label="Breadcrumb"
      >
        <Link href="/">Home</Link>
        <span>›</span>
        <b>Contact us</b>
      </nav>

      <section className="relative mt-5 grid grid-cols-[minmax(0,1.45fr)_minmax(18rem,.65fr)] items-end gap-[clamp(2rem,6vw,6rem)] overflow-hidden rounded-[1.15rem] border border-[#f0d9cd] bg-[#fff7f2] p-[clamp(2.5rem,6vw,5rem)] text-[#1c2025] before:absolute before:top-0 before:left-0 before:h-full before:w-[.42rem] before:bg-[#eb4a15] after:pointer-events-none after:absolute after:-top-28 after:-right-20 after:size-72 after:rounded-full after:border after:border-[#ef4a1724] after:shadow-[0_0_0_3.5rem_#ef4a1709,0_0_0_7rem_#ef4a1705] max-[850px]:grid-cols-1 max-[850px]:items-start max-[560px]:mt-2 max-[560px]:rounded-[.8rem] max-[560px]:px-[1.35rem] max-[560px]:py-8">
        <div>
          <span className={eyebrow}>CONTACT PREPSTORE</span>
          <h1 className="mt-[.8rem] mb-4 max-w-[40rem] text-[clamp(2.7rem,6vw,5.25rem)] leading-[.98] tracking-[-.055em] max-[560px]:text-[2.65rem]">
            We&apos;re here to help.
          </h1>
          <p className="m-0 max-w-[42rem] text-[1.04rem] leading-7 text-[#60676d]">
            Get tracked learner support or send a general, business, privacy or
            grievance enquiry directly to the Prepstore team.
          </p>
        </div>
        <div className="relative z-[1] grid grid-cols-[2.8rem_1fr] gap-4 rounded-[.8rem] border border-[#ecd6ca] bg-white p-5 shadow-[0_1rem_2.5rem_#6d3d2210] max-[850px]:max-w-[34rem] max-[560px]:grid-cols-[2.3rem_1fr] max-[560px]:p-4 [&>svg]:w-[2.2rem] [&>svg]:text-[#e94a16] max-[560px]:[&>svg]:w-[1.8rem]">
          <ContactIcon name="shield" />
          <div className="grid gap-[.35rem]">
            <strong className="text-sm">Your security comes first</strong>
            <span className="text-[.76rem] leading-[1.55] text-[#686f75]">
              We will never ask for your password, OTP, UPI PIN, CVV or full
              card details.
            </span>
          </div>
        </div>
      </section>

      <section
        className="mt-[clamp(3.5rem,7vw,6rem)] grid grid-cols-[minmax(15rem,.75fr)_minmax(0,1.25fr)] items-start gap-[clamp(2rem,6vw,5rem)] rounded-2xl bg-[#1e2227] p-[clamp(2rem,5vw,4rem)] text-white max-[850px]:grid-cols-1 max-[560px]:p-6"
        aria-labelledby="contact-form-heading"
      >
        <div className="sticky top-24 max-[850px]:static">
          <span className="block text-[.72rem] font-extrabold tracking-[.12em] text-[#ff8a61]">
            SEND AN ENQUIRY
          </span>
          <h2
            className="mt-[.65rem] mb-[.9rem] text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] tracking-[-.045em]"
            id="contact-form-heading"
          >
            Tell us what you need.
          </h2>
          <p className="m-0 leading-[1.7] text-[#c6cbd0]">
            Use this form for general, business, content-permission, privacy and
            formal grievance matters. Your submission is recorded securely and
            receives a reference number.
          </p>
          <ul className="mt-6 mb-0 grid list-none gap-[.7rem] p-0 text-[.78rem] text-[#e2e5e8] [&>li]:before:mr-[.55rem] [&>li]:before:inline-grid [&>li]:before:size-[1.4rem] [&>li]:before:place-items-center [&>li]:before:rounded-full [&>li]:before:bg-[#ed4a15] [&>li]:before:text-[.68rem] [&>li]:before:text-white [&>li]:before:content-['✓']">
            <li>Choose the closest enquiry type</li>
            <li>Use an email address you monitor</li>
            <li>Include an order ID only when relevant</li>
          </ul>
        </div>
        <div className="min-w-0 rounded-[.8rem] bg-white p-[clamp(1.25rem,3vw,2rem)] text-[#202327] max-[560px]:p-[1.1rem]">
          <ContactForm
            defaultName={auth?.user.name}
            defaultEmail={auth?.user.email}
            defaultPhone={auth?.user.phone}
          />
        </div>
      </section>

      <section
        className="pt-[clamp(3.5rem,7vw,6rem)] max-[560px]:pt-14"
        aria-labelledby="contact-route-heading"
      >
        <div className={sectionHeading}>
          <span className={eyebrow}>START HERE</span>
          <h2 id="contact-route-heading">How can we help?</h2>
          <p>
            Using the correct channel helps us understand and resolve your
            request faster.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-[1.15fr_.85fr] gap-4 max-[850px]:grid-cols-1">
          <article className={`${routeCard} bg-[#fffaf7]`}>
            <i className={routeIcon}>
              <ContactIcon name="help" />
            </i>
            <div className="mt-auto max-[560px]:mt-10">
              <span className={eyebrow}>ACCOUNT &amp; PURCHASE SUPPORT</span>
              <h3 className="mt-[.55rem] mb-[.7rem] text-[1.75rem] tracking-[-.035em]">
                Help Centre
              </h3>
              <p className="m-0 leading-[1.7] text-[#626a70]">
                For payment status, orders, package access, tests, study
                material, account or technical issues. Signed-in learners can
                create a tracked support ticket and follow every reply.
              </p>
            </div>
            <Link
              className="mt-6 flex items-center justify-between gap-4 border-t border-[#e6e3df] pt-4 font-extrabold text-prep-orange [overflow-wrap:anywhere] [&>b]:text-[1.3rem]"
              href={supportHref}
            >
              {isAdmin
                ? "Open support workspace"
                : auth
                  ? "Open Help Centre"
                  : "Sign in to get support"}
              <b aria-hidden="true">→</b>
            </Link>
          </article>
          <article className={routeCard}>
            <i className={`${routeIcon} bg-[#edf2ff] text-[#396fc8]`}>
              <ContactIcon name="email" />
            </i>
            <div className="mt-auto max-[560px]:mt-10">
              <span className={eyebrow}>GENERAL &amp; BUSINESS ENQUIRIES</span>
              <h3 className="mt-[.55rem] mb-[.7rem] text-[1.75rem] tracking-[-.035em]">
                Email Prepstore
              </h3>
              <p className="m-0 leading-[1.7] text-[#626a70]">
                For partnerships, content permissions, institutional enquiries,
                privacy requests and matters that are not tied to an existing
                learner ticket.
              </p>
            </div>
            <a
              className="mt-6 flex items-center justify-between gap-4 border-t border-[#e6e3df] pt-4 font-extrabold text-prep-orange [overflow-wrap:anywhere] [&>b]:text-[1.3rem]"
              href={`mailto:${BUSINESS_SUPPORT_EMAIL}`}
            >
              {BUSINESS_SUPPORT_EMAIL}
              <b aria-hidden="true">→</b>
            </a>
          </article>
        </div>
      </section>

      <section
        className="pt-[clamp(3.5rem,7vw,6rem)] max-[560px]:pt-14"
        aria-labelledby="direct-contact-heading"
      >
        <div className={sectionHeading}>
          <span className={eyebrow}>DIRECT CONTACT</span>
          <h2 id="direct-contact-heading">Verified business details</h2>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 max-[850px]:grid-cols-1">
          <article className="grid grid-cols-[3.1rem_minmax(0,1fr)] gap-4 rounded-[.8rem] border border-[#e2dfdb] bg-white p-[1.35rem] max-[560px]:grid-cols-[2.8rem_minmax(0,1fr)]">
            <i className={routeIcon}>
              <ContactIcon name="email" />
            </i>
            <div className="grid min-w-0 content-start gap-[.35rem]">
              <span className={eyebrow}>Email</span>
              <a
                className="text-[.87rem] leading-[1.55] font-[750] text-[#25282c] [overflow-wrap:anywhere]"
                href={`mailto:${BUSINESS_SUPPORT_EMAIL}`}
              >
                {BUSINESS_SUPPORT_EMAIL}
              </a>
              <small className="text-[.69rem] leading-normal text-prep-muted">
                General, business, privacy and grievance communication
              </small>
            </div>
          </article>
          <article className="grid grid-cols-[3.1rem_minmax(0,1fr)] gap-4 rounded-[.8rem] border border-[#e2dfdb] bg-white p-[1.35rem] max-[560px]:grid-cols-[2.8rem_minmax(0,1fr)]">
            <i className={routeIcon}>
              <ContactIcon name="phone" />
            </i>
            <div className="grid min-w-0 content-start gap-[.35rem]">
              <span className={eyebrow}>Phone</span>
              <a
                className="text-[.87rem] leading-[1.55] font-[750] text-[#25282c] [overflow-wrap:anywhere]"
                href={`tel:${BUSINESS_SUPPORT_PHONE_E164}`}
              >
                {BUSINESS_SUPPORT_PHONE}
              </a>
              <small className="text-[.69rem] leading-normal text-prep-muted">
                Include your registered email or order ID when relevant
              </small>
            </div>
          </article>
          <article className="grid grid-cols-[3.1rem_minmax(0,1fr)] gap-4 rounded-[.8rem] border border-[#e2dfdb] bg-white p-[1.35rem] max-[560px]:grid-cols-[2.8rem_minmax(0,1fr)]">
            <i className={routeIcon}>
              <ContactIcon name="location" />
            </i>
            <div className="grid min-w-0 content-start gap-[.35rem]">
              <span className={eyebrow}>Business address</span>
              <address className="text-[.87rem] leading-[1.55] font-[750] text-[#25282c] not-italic [overflow-wrap:anywhere]">
                {BUSINESS_ADDRESS}
              </address>
              <small className="text-[.69rem] leading-normal text-prep-muted">
                Prepstore is an online digital-learning platform
              </small>
            </div>
          </article>
        </div>
      </section>

      <section className="mt-[clamp(3.5rem,7vw,6rem)] grid grid-cols-[.8fr_1.2fr] gap-[clamp(2rem,6vw,6rem)] rounded-2xl bg-[#f5f2ee] p-[clamp(2rem,5vw,4rem)] max-[850px]:grid-cols-1 max-[560px]:p-6">
        <div>
          <span className={eyebrow}>BEFORE YOU CONTACT US</span>
          <h2 className="mt-[.65rem] mb-[.8rem] text-[clamp(1.8rem,3vw,2.65rem)] tracking-[-.04em]">
            Help us understand your request.
          </h2>
          <p className="m-0 leading-[1.7] text-[#687076]">
            For a faster review, share only the information relevant to your
            issue.
          </p>
        </div>
        <ul className="m-0 grid list-none gap-0 p-0 [&>li]:grid [&>li]:grid-cols-[minmax(8rem,.6fr)_1.4fr] [&>li]:gap-4 [&>li]:border-b [&>li]:border-[#dddad5] [&>li]:py-4 [&>li:first-child]:pt-0 [&>li:last-child]:border-b-0 [&>li:last-child]:pb-0 max-[560px]:[&>li]:grid-cols-1 max-[560px]:[&>li]:gap-[.35rem] [&_b]:text-[.8rem] [&_span]:text-[.78rem] [&_span]:leading-normal [&_span]:text-[#626a70]">
          <li>
            <b>Account issues</b>
            <span>Your registered name and email address</span>
          </li>
          <li>
            <b>Payment or order issues</b>
            <span>Order ID, payment reference and purchase date</span>
          </li>
          <li>
            <b>Technical issues</b>
            <span>Device, browser, page URL and a safe screenshot</span>
          </li>
          <li>
            <b>Privacy or grievance requests</b>
            <span>A clear description and the outcome you are requesting</span>
          </li>
        </ul>
      </section>

      <section className="mt-4 grid grid-cols-[1fr_1fr_.8fr] gap-8 rounded-[.9rem] border border-[#e1ded9] bg-white p-8 max-[850px]:grid-cols-2 max-[560px]:grid-cols-1 max-[560px]:p-[1.4rem] [&>div>span]:block [&>div>span]:text-[.72rem] [&>div>span]:font-extrabold [&>div>span]:tracking-[.12em] [&>div>span]:text-prep-orange [&_h2]:my-[.45rem] [&_h2]:text-[1.1rem] [&_p]:m-0 [&_p]:text-[.76rem] [&_p]:leading-[1.6] [&_p]:text-[#687076]">
        <div>
          <span>LEGAL OPERATOR</span>
          <h2>{BUSINESS_LEGAL_OWNER}</h2>
          <p>
            {BUSINESS_ENTITY_TYPE} operating under the brand name Prepstore.
          </p>
        </div>
        <div>
          <span>GRIEVANCE OFFICER</span>
          <h2>{BUSINESS_GRIEVANCE_OFFICER}</h2>
          <p>
            Formal consumer, privacy and grievance matters may be sent through
            the verified email or phone details above.
          </p>
        </div>
        <div className="grid content-start gap-[.45rem] max-[850px]:col-span-full max-[560px]:col-span-1 [&>a]:text-[.76rem] [&>a]:font-bold [&>a]:text-[#4f575d] [&>a:hover]:text-[#d84311]">
          <span>POLICIES</span>
          <Link href="/legal/terms">Terms of service</Link>
          <Link href="/legal/privacy">Privacy policy</Link>
          <Link href="/legal/cancellation-refund">
            Cancellation &amp; refund
          </Link>
          <Link href="/legal/fair-use">Fair use policy</Link>
        </div>
      </section>
    </main>
  );
}
