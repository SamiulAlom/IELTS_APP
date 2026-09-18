"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardData } from "@/lib/dashboard";

export function ActivityChart({ data }: { data: DashboardData["week"] }) {
  return <div className="chart" role="img" aria-label={`Study minutes this week: ${data.map(day => `${day.label} ${day.minutes}`).join(", ")}`}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={data} margin={{ top: 10, right: 5, bottom: 0, left: -26 }} barSize={19}><CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} dy={8}/><YAxis domain={[0, "auto"]} allowDecimals={false} tick={{ fontSize: 9, fill: "var(--muted)" }} axisLine={false} tickLine={false}/><Tooltip cursor={{ fill: "var(--surface-alt)" }} contentStyle={{ borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 11 }} formatter={(value) => [`${value ?? 0} min`, "Study time"]}/><Bar dataKey="minutes" fill="#6f9982" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div>;
}
