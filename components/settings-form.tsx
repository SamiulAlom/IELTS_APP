"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Save, SlidersHorizontal, Target, UserRound } from "lucide-react";
import { ErrorNotice } from "@/components/ui";
import { request } from "@/lib/client";
import type { ProfileSettings, Theme } from "@/lib/settings";

const estimateFields = [
  ["estimatedListening", "Listening"],
  ["estimatedReading", "Reading"],
  ["estimatedWriting", "Writing"],
  ["estimatedSpeaking", "Speaking"],
] as const;
const bands = Array.from({ length: 19 }, (_, index) => index / 2);

function FormField({ id, label, hint, full, children }: { id: string; label: string; hint?: string; full?: boolean; children: ReactNode }) {
  return <div className={full ? "full" : undefined} style={{ display: "grid", alignContent: "start", gap: 7 }}>
    <label htmlFor={id}>{label}</label>
    {children}
    {hint && <p className="small-note" id={`${id}-hint`}>{hint}</p>}
  </div>;
}

function formValues(settings: ProfileSettings) {
  return {
    name: settings.name,
    targetBand: String(settings.targetBand),
    examDate: settings.examDate ?? "",
    estimatedListening: settings.estimatedListening === null ? "" : String(settings.estimatedListening),
    estimatedReading: settings.estimatedReading === null ? "" : String(settings.estimatedReading),
    estimatedWriting: settings.estimatedWriting === null ? "" : String(settings.estimatedWriting),
    estimatedSpeaking: settings.estimatedSpeaking === null ? "" : String(settings.estimatedSpeaking),
    dailyStudyMinutes: String(settings.dailyStudyMinutes),
    vocabularySessionSize: String(settings.vocabularySessionSize),
    timezone: settings.timezone,
    theme: settings.theme,
  };
}

export function SettingsForm({ settings }: { settings: ProfileSettings }) {
  const router = useRouter();
  const [values, setValues] = useState(() => formValues(settings));
  const [baseline, setBaseline] = useState(() => formValues(settings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const change = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError("");
  };
  const changedFields = (Object.keys(values) as (keyof typeof values)[]).filter((key) => values[key] !== baseline[key]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changedFields.length) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const payload = {
        ...values,
        targetBand: Number(values.targetBand),
        examDate: values.examDate || null,
        estimatedListening: values.estimatedListening === "" ? null : Number(values.estimatedListening),
        estimatedReading: values.estimatedReading === "" ? null : Number(values.estimatedReading),
        estimatedWriting: values.estimatedWriting === "" ? null : Number(values.estimatedWriting),
        estimatedSpeaking: values.estimatedSpeaking === "" ? null : Number(values.estimatedSpeaking),
        dailyStudyMinutes: Number(values.dailyStudyMinutes),
        vocabularySessionSize: Number(values.vocabularySessionSize),
      };
      const updated = await request<ProfileSettings>("/api/settings", Object.fromEntries(changedFields.map((key) => [key, payload[key]])), "PATCH");
      setValues(formValues(updated));
      setBaseline(formValues(updated));
      document.documentElement.dataset.theme = updated.theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : updated.theme;
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} style={{ maxWidth: 900 }}>
    <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}>
      <section className="panel form-section">
        <div className="panel-heading"><h2>Your profile</h2><UserRound size={18} className="muted" /></div>
        <p className="muted">A clear destination makes daily practice easier.</p>
        <div className="form-grid">
          <FormField id="settings-name" label="Your name" full><input id="settings-name" name="name" value={values.name} onChange={(event) => change("name", event.target.value)} autoComplete="name" maxLength={80} required /></FormField>
          <FormField id="settings-target" label="Target band"><select id="settings-target" name="targetBand" value={values.targetBand} onChange={(event) => change("targetBand", event.target.value)}>{bands.filter((band) => band >= 1).map((band) => <option key={band} value={band}>{band.toFixed(1)}</option>)}</select></FormField>
          <FormField id="settings-exam" label="Exam date" hint="Optional. Leave blank if your exam is not booked."><input id="settings-exam" name="examDate" type="date" aria-describedby="settings-exam-hint" value={values.examDate} onChange={(event) => change("examDate", event.target.value)} /></FormField>
        </div>
      </section>

      <section className="panel form-section">
        <div className="panel-heading"><h2>Your current estimates</h2><Target size={18} className="muted" /></div>
        <p className="muted">Add your own practice estimates when you have them. Your overall estimate appears once all four are set.</p>
        <div className="form-grid">{estimateFields.map(([key, label]) => <FormField key={key} id={`settings-${key}`} label={label}><select id={`settings-${key}`} name={key} value={values[key]} onChange={(event) => change(key, event.target.value)}><option value="">Not set yet</option>{bands.map((band) => <option key={band} value={band}>{band.toFixed(1)}</option>)}</select></FormField>)}</div>
        <p className="small-note" style={{ marginTop: 18 }}>These are personal practice estimates, not official IELTS results.</p>
      </section>

      <section className="panel form-section">
        <div className="panel-heading"><h2>Your daily routine</h2><SlidersHorizontal size={18} className="muted" /></div>
        <p className="muted">A manageable routine is one you can return to.</p>
        <div className="form-grid">
          <FormField id="settings-duration" label="Daily study target (minutes)"><input id="settings-duration" name="dailyStudyMinutes" type="number" min={5} max={720} step={1} required list="study-durations" value={values.dailyStudyMinutes} onChange={(event) => change("dailyStudyMinutes", event.target.value)} /></FormField>
          <FormField id="settings-session" label="Words per learning session"><input id="settings-session" name="vocabularySessionSize" type="number" min={1} max={100} step={1} required list="word-counts" value={values.vocabularySessionSize} onChange={(event) => change("vocabularySessionSize", event.target.value)} /></FormField>
          <FormField id="settings-timezone" label="Timezone" hint="Sets the day boundary for your study plan."><input id="settings-timezone" name="timezone" list="timezones" aria-describedby="settings-timezone-hint" value={values.timezone} onChange={(event) => change("timezone", event.target.value)} required /></FormField>
          <FormField id="settings-theme" label="Appearance"><select id="settings-theme" name="theme" value={values.theme} onChange={(event) => change("theme", event.target.value as Theme)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">Use device setting</option></select></FormField>
        </div>
        <datalist id="study-durations">{[30, 60, 90, 120].map((value) => <option key={value} value={value} />)}</datalist>
        <datalist id="word-counts">{[10, 20, 25, 30].map((value) => <option key={value} value={value} />)}</datalist>
        <datalist id="timezones">{["Asia/Dhaka", "Asia/Kolkata", "Asia/Karachi", "Asia/Dubai", "Europe/London", "America/New_York", "Australia/Sydney", "UTC"].map((value) => <option key={value} value={value} />)}</datalist>
      </section>
      <ErrorNotice message={error} />
      <div className="form-footer">{saved && <span role="status" className="text-link"><Check size={16} />Preferences saved</span>}<button type="submit" className="button primary" disabled={!changedFields.length}><Save size={16} />{saving ? "Saving…" : "Save preferences"}</button></div>
    </fieldset>
  </form>;
}
