import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { NotificationActions, NotificationReadButton } from "@/features/operations/ui/student-actions";

export const metadata = { title: "Notifications" };
function NotificationIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}
export default async function Page({searchParams}:{searchParams:Promise<{filter?:string}>}) {
  const auth = await requireWorkspace(); if (auth.admin) redirect("/admin");
  const notifications = await getStudentNotifications(auth.user.id);
  const filter=(await searchParams).filter??"all";const items=filter==="unread"?notifications.items.filter(item=>!item.readAt):notifications.items;
  return <WorkspaceShell admin={false} name={auth.user.name} section="notifications" unreadNotifications={notifications.unreadCount}><header className="student-page-heading notification-page-heading"><div><h1>Notifications</h1><p>Purchase, result, security and support updates appear here.</p></div><NotificationActions unreadIds={notifications.items.filter((item) => !item.readAt).map((item) => item.id)} /></header><nav className="student-notification-tabs"><Link aria-current={filter==="all"?"page":undefined} className={filter==="all"?"active":""} href="/dashboard/notifications">All <b>{notifications.items.length}</b></Link><Link aria-current={filter==="unread"?"page":undefined} className={filter==="unread"?"active":""} href="/dashboard/notifications?filter=unread">Unread <b>{notifications.unreadCount}</b></Link></nav>{items.length ? <div className="notification-list reference-notification-list">{items.map((item) => <article className={item.readAt ? "notification-card" : "notification-card unread"} key={item.id}><i><NotificationIcon/></i><div><span>{item.type.replaceAll("_", " ")}</span><h2>{item.title}</h2><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></div>{item.readAt ? <span className="quiet-tag">Read</span> : <NotificationReadButton id={item.id} />}</article>)}</div> : <section className="panel empty-state"><h2>{filter==="unread"?"You’re all caught up":"No notifications yet"}</h2><p>{filter==="unread"?"There are no unread notifications.":"Important account and learning updates will appear here."}</p></section>}</WorkspaceShell>;
}
