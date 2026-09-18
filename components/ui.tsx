import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>;
}

export function EmptyState({ icon, title, description, href, action }: { icon?: ReactNode; title: string; description: string; href?: string; action?: string }) {
  return <div className="empty-state">{icon && <span className="empty-icon">{icon}</span>}<h3>{title}</h3><p>{description}</p>{href && <Link className="button primary" href={href}>{action || "Get started"}<ArrowRight size={16}/></Link>}</div>;
}

export function ErrorNotice({ message }: { message: string }) {
  return message ? <p role="alert" className="notice error">{message}</p> : null;
}

export function Loading({ message = "Loading your practice…" }: { message?: string }) {
  return <div className="loading" role="status"><LoaderCircle className="spin" size={22}/>{message}</div>;
}

export function StatCard({ label, value, detail, icon, color = "green" }: { label: string; value: ReactNode; detail: string; icon: ReactNode; color?: string }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`icon-box ${color}`}>{icon}</span></div><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div>;
}
