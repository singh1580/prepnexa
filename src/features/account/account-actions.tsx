"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authRequest, ClientApiError } from "@/features/auth/ui/api";
import { Field } from "@/features/auth/ui/field";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <><button className="button secondary" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try { await authRequest("logout", {}); router.push("/login"); router.refresh(); }
    catch { setError("Couldn't sign out. Please try again."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert">{error}</p>}</>;
}
export function ProfileForm({ name, email, phone, verified }: { name: string; email: string; phone:string|null; verified: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { await authRequest("profile", Object.fromEntries(new FormData(e.currentTarget))); setMessage("Your profile has been updated."); router.refresh(); }
    catch(e) { if(e instanceof ClientApiError && e.code === "UNAUTHENTICATED") router.push("/login?reason=session"); else setError(e instanceof Error ? e.message : "Couldn't save changes."); }
    finally { setBusy(false); }
  }
  return <form className="profile-form" onSubmit={submit}><fieldset disabled={busy}><div className="profile-form-grid"><Field label="Full name" name="name" defaultValue={name} autoComplete="name" required minLength={2} maxLength={120} /><Field label="Phone number" name="phone" defaultValue={phone??""} autoComplete="tel" minLength={7} maxLength={20} /></div><Field label="Email address" name="email" value={email} readOnly hint={verified ? "Verified email. Email changes aren't available here." : "Email verification is pending."} /><button className="button">{busy ? "Saving…" : "Save changes"}</button></fieldset>{message && <p className="notice success" role="status">{message}</p>}{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

type StudentProfile = {
  name:string;
  email:string;
  phone:string|null;
  classLevel:string|null;
  board:string|null;
  targetExam:string|null;
  dateOfBirth:string|null;
  emailNotifications:boolean;
  inAppNotifications:boolean;
};

export function StudentProfileForm({profile,verified}:{profile:StudentProfile;verified:boolean}){
  const router=useRouter();
  const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");const[error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");setError("");const data=new FormData(event.currentTarget);try{await authRequest("profile",{name:data.get("name"),phone:data.get("phone"),classLevel:data.get("classLevel"),board:data.get("board"),targetExam:data.get("targetExam"),dateOfBirth:data.get("dateOfBirth")});setMessage("Your profile has been updated.");router.refresh();}catch(value){if(value instanceof ClientApiError&&value.code==="UNAUTHENTICATED")router.push("/login?reason=session");else setError(value instanceof Error?value.message:"Couldn't save changes.");}finally{setBusy(false);}}
  return <form className="profile-form student-profile-form" onSubmit={submit}><fieldset disabled={busy}><div className="profile-form-grid"><Field label="Full name" name="name" defaultValue={profile.name} autoComplete="name" required minLength={2} maxLength={120}/><Field label="Phone number" name="phone" defaultValue={profile.phone??""} autoComplete="tel" minLength={7} maxLength={20}/><Field label="Class / qualification" name="classLevel" defaultValue={profile.classLevel??""} maxLength={120} placeholder="For example: B.Tech, Class 12"/><Field label="Board / university" name="board" defaultValue={profile.board??""} maxLength={120}/><Field label="Target exam" name="targetExam" defaultValue={profile.targetExam??""} maxLength={160} placeholder="For example: TCS NQT"/><Field label="Date of birth" name="dateOfBirth" type="date" defaultValue={profile.dateOfBirth??""}/></div><Field label="Email address" name="email" value={profile.email} readOnly hint={verified?"Verified email. Email changes aren't available here.":"Email verification is pending."}/><button className="button">{busy?"Saving…":"Save changes"}</button></fieldset>{message?<p className="notice success" role="status">{message}</p>:null}{error?<p className="notice danger" role="alert">{error}</p>:null}</form>;
}

export function NotificationPreferencesForm({profile}:{profile:StudentProfile}){
  const router=useRouter();const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");const[error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");setError("");const data=new FormData(event.currentTarget);try{await authRequest("profile",{name:profile.name,phone:profile.phone,classLevel:profile.classLevel,board:profile.board,targetExam:profile.targetExam,dateOfBirth:profile.dateOfBirth,emailNotifications:data.has("emailNotifications"),inAppNotifications:data.has("inAppNotifications")});setMessage("Notification preferences saved.");router.refresh();}catch(value){setError(value instanceof Error?value.message:"Couldn't save preferences.");}finally{setBusy(false);}}
  return <form className="preference-form" onSubmit={submit}><fieldset disabled={busy}><label className="preference-toggle"><span><strong>Email notifications</strong><small>Order confirmations, support replies and important account updates.</small></span><input type="checkbox" name="emailNotifications" defaultChecked={profile.emailNotifications}/><i aria-hidden="true"/></label><label className="preference-toggle"><span><strong>In-app notifications</strong><small>Learning updates and announcements inside your dashboard.</small></span><input type="checkbox" name="inAppNotifications" defaultChecked={profile.inAppNotifications}/><i aria-hidden="true"/></label><button className="button secondary" type="submit">{busy?"Saving…":"Save preferences"}</button></fieldset>{message?<p className="notice success" role="status">{message}</p>:null}{error?<p className="notice danger" role="alert">{error}</p>:null}</form>;
}

export function ChangePasswordForm(){const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");const[error,setError]=useState("");async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");setError("");const form=event.currentTarget;const data=new FormData(form);if(data.get("newPassword")!==data.get("confirmPassword")){setError("New passwords do not match.");setBusy(false);return;}try{await authRequest("change-password",{currentPassword:data.get("currentPassword"),newPassword:data.get("newPassword")});form.reset();setMessage("Password updated. Other signed-in sessions were revoked.");}catch(value){setError(value instanceof Error?value.message:"Could not update password.");}finally{setBusy(false);}}return <form className="change-password-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required minLength={10}/><Field label="New password" name="newPassword" type="password" autoComplete="new-password" required minLength={10}/><Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10}/><button className="button" type="submit">{busy?"Updating…":"Update password"}</button></fieldset>{message?<p className="notice success" role="status">{message}</p>:null}{error?<p className="notice danger" role="alert">{error}</p>:null}</form>}
