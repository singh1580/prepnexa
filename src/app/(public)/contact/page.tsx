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
import styles from "./contact.module.css";

export const metadata = {
  title: "Contact us",
  description: "Contact Prepstore for account support, payment help, business enquiries, privacy requests and formal grievances.",
};

function ContactIcon({ name }: { name: "help" | "email" | "phone" | "location" | "shield" }) {
  const paths = {
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 2-2.5 2-2.5 4M12 18h.01"/></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    phone: <path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-4-1-1.2 2a14 14 0 0 1-9.8-9.8L8 7Z"/>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default async function Page() {
  const auth = await getCurrentAuth();
  const isAdmin = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role));
  const supportHref = auth
    ? isAdmin ? "/admin/support" : "/dashboard/support"
    : "/login?next=%2Fdashboard%2Fsupport";

  return <main className={styles.page}>
    <nav className="store-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><b>Contact us</b></nav>

    <section className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>CONTACT PREPSTORE</span>
        <h1>Talk to the right team.</h1>
        <p>Whether you need help with a purchase, want to discuss a business enquiry or need to raise a formal grievance, choose the channel that matches your request.</p>
      </div>
      <div className={styles.heroNote}>
        <ContactIcon name="shield" />
        <div><strong>Your security comes first</strong><span>We will never ask for your password, OTP, UPI PIN, CVV or full card details.</span></div>
      </div>
    </section>

    <section className={styles.routeSection} aria-labelledby="contact-route-heading">
      <div className={styles.sectionHeading}>
        <span>START HERE</span>
        <h2 id="contact-route-heading">How can we help?</h2>
        <p>Using the correct channel helps us understand and resolve your request faster.</p>
      </div>
      <div className={styles.routeGrid}>
        <article className={styles.primaryRoute}>
          <i><ContactIcon name="help" /></i>
          <div><span>ACCOUNT &amp; PURCHASE SUPPORT</span><h3>Help Centre</h3><p>For payment status, orders, package access, tests, study material, account or technical issues. Signed-in learners can create a tracked support ticket and follow every reply.</p></div>
          <Link href={supportHref}>{isAdmin ? "Open support workspace" : auth ? "Open Help Centre" : "Sign in to get support"}<b aria-hidden="true">→</b></Link>
        </article>
        <article className={styles.secondaryRoute}>
          <i><ContactIcon name="email" /></i>
          <div><span>GENERAL &amp; BUSINESS ENQUIRIES</span><h3>Email Prepstore</h3><p>For partnerships, content permissions, institutional enquiries, privacy requests and matters that are not tied to an existing learner ticket.</p></div>
          <a href={`mailto:${BUSINESS_SUPPORT_EMAIL}`}>{BUSINESS_SUPPORT_EMAIL}<b aria-hidden="true">→</b></a>
        </article>
      </div>
    </section>

    <section className={styles.detailsSection} aria-labelledby="direct-contact-heading">
      <div className={styles.sectionHeading}>
        <span>DIRECT CONTACT</span>
        <h2 id="direct-contact-heading">Verified business details</h2>
      </div>
      <div className={styles.detailGrid}>
        <article><i><ContactIcon name="email" /></i><div><span>Email</span><a href={`mailto:${BUSINESS_SUPPORT_EMAIL}`}>{BUSINESS_SUPPORT_EMAIL}</a><small>General, business, privacy and grievance communication</small></div></article>
        <article><i><ContactIcon name="phone" /></i><div><span>Phone</span><a href={`tel:${BUSINESS_SUPPORT_PHONE_E164}`}>{BUSINESS_SUPPORT_PHONE}</a><small>Include your registered email or order ID when relevant</small></div></article>
        <article><i><ContactIcon name="location" /></i><div><span>Business address</span><address>{BUSINESS_ADDRESS}</address><small>Prepstore is an online digital-learning platform</small></div></article>
      </div>
    </section>

    <section className={styles.preparationSection}>
      <div>
        <span className={styles.eyebrow}>BEFORE YOU CONTACT US</span>
        <h2>Help us understand your request.</h2>
        <p>For a faster review, share only the information relevant to your issue.</p>
      </div>
      <ul>
        <li><b>Account issues</b><span>Your registered name and email address</span></li>
        <li><b>Payment or order issues</b><span>Order ID, payment reference and purchase date</span></li>
        <li><b>Technical issues</b><span>Device, browser, page URL and a safe screenshot</span></li>
        <li><b>Privacy or grievance requests</b><span>A clear description and the outcome you are requesting</span></li>
      </ul>
    </section>

    <section className={styles.businessSection}>
      <div><span>LEGAL OPERATOR</span><h2>{BUSINESS_LEGAL_OWNER}</h2><p>{BUSINESS_ENTITY_TYPE} operating under the brand name Prepstore.</p></div>
      <div><span>GRIEVANCE OFFICER</span><h2>{BUSINESS_GRIEVANCE_OFFICER}</h2><p>Formal consumer, privacy and grievance matters may be sent through the verified email or phone details above.</p></div>
      <div className={styles.policyLinks}><span>POLICIES</span><Link href="/legal/terms">Terms of service</Link><Link href="/legal/privacy">Privacy policy</Link><Link href="/legal/cancellation-refund">Cancellation &amp; refund</Link></div>
    </section>
  </main>;
}
