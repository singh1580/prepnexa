import Link from "next/link";
import { Brand } from "./brand";
export function PublicHeader() { return <header className="public-header"><Brand /><nav aria-label="Primary navigation"><Link href="/exams">Exams</Link><Link href="/packages">Packages</Link><Link href="/free-tests">Free tests</Link><Link href="/login">Sign in</Link><Link className="button small" href="/signup">Create account</Link></nav></header>; }
