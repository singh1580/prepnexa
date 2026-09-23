import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { NotificationActions, NotificationReadButton } from "@/features/operations/ui/student-actions";

export const metadata = { title: "Notifications" };
export default async function Page() {
  const auth = await requireWorkspace(); if (auth.admin) redirect("/admin");
  const notifications = await getStudentNotifications(auth.user.id);
  return <WorkspaceShell admin={false} name={auth.user.name} section="notifications"><header className="page-heading split-heading"><div><span className="eyebrow">UPDATES</span><h1>Notifications</h1><p>Purchase, result, security and support updates appear here.</p></div><NotificationActions unreadIds={notifications.items.filter((item) => !item.readAt).map((item) => item.id)} /></header>{notifications.items.length ? <div className="notification-list">{notifications.items.map((item) => <article className={item.readAt ? "panel notification-card" : "panel notification-card unread"} key={item.id}><div><span className="eyebrow">{item.type.replaceAll("_", " ")}</span><h2>{item.title}</h2><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small></div>{item.readAt ? <span className="quiet-tag">Read</span> : <NotificationReadButton id={item.id} />}</article>)}</div> : <section className="panel empty-state"><h2>No notifications yet</h2><p>Important account and learning updates will appear here.</p></section>}</WorkspaceShell>;
}
