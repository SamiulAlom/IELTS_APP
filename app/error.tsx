"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="empty-state"><h1>We couldn&apos;t load this page.</h1><p>Your saved work is still in your local database. Try loading the page again.</p><button className="button primary" onClick={reset}>Try again</button></div>; }
