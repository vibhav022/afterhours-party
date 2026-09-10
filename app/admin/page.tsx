"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Download, Eye, EyeOff, LockKeyhole, LogOut, RefreshCw, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import "./admin.css";

type Rsvp = {
  id: string;
  name: string;
  college: string;
  phone: string;
  consent: string;
  created_at: string;
};

function csvCell(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function AdminPage() {
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [mode, setMode] = useState<"loading" | "login" | "dashboard">("loading");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Rsvp | null>(null);
  const [deletingId, setDeletingId] = useState("");

  const loadRsvps = useCallback(async () => {
    await Promise.resolve();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/rsvps", { cache: "no-store" });
      if (response.status === 401) {
        setMode("login");
        setRows([]);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load RSVPs.");
      setRows(data.rows || []);
      setMode("dashboard");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load RSVPs.");
      setMode((current) => current === "loading" ? "login" : current);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRsvps(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRsvps]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      setPassword("");
      setCode("");
      await loadRsvps();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setRows([]);
    setMode("login");
  }

  async function removeRsvp() {
    if (!removeTarget) return;
    setDeletingId(removeTarget.id);
    setError("");
    try {
      const response = await fetch("/api/admin/rsvps", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: removeTarget.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not remove this RSVP.");
      setRows((current) => current.filter((row) => row.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove this RSVP.");
    } finally {
      setDeletingId("");
    }
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => [row.name, row.college, row.phone].some((value) => value.toLowerCase().includes(term)));
  }, [query, rows]);

  function exportCsv() {
    const header = ["Name", "College / University", "Phone", "Submitted at"];
    const body = filtered.map((row) => [row.name, row.college, `+91 ${row.phone}`, row.created_at]);
    const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `afterhours-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (mode === "loading") return <main className="admin-shell admin-center"><div className="admin-loader"/><p>Opening backstage…</p></main>;

  if (mode === "login") return <main className="admin-shell admin-center">
    <section className="admin-login">
      <div className="admin-mark"><LockKeyhole size={25}/></div>
      <p className="admin-kicker">AFTERHOURS / PRIVATE ACCESS</p>
      <h1>Backstage<br/><em>only.</em></h1>
      <p className="admin-muted">Enter the admin password to view the RSVP list.</p>
      <form onSubmit={login}>
        <label htmlFor="admin-password">Admin password</label>
        <div className="admin-password">
          <input id="admin-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" required autoFocus/>
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
        </div>
        <label htmlFor="admin-code">Authenticator code</label>
        <input className="admin-code" id="admin-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" required/>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-primary" type="submit" disabled={busy}>{busy ? "Checking…" : <>Enter backstage <ArrowUpRight size={20}/></>}</button>
      </form>
      <Link className="admin-back" href="/">← Return to the party site</Link>
    </section>
  </main>;

  return <main className="admin-shell">
    <header className="admin-header">
      <Link href="/" className="admin-logo">afterhours</Link>
      <div><span className="admin-private"><LockKeyhole size={13}/> PRIVATE</span><button onClick={logout}><LogOut size={16}/> Log out</button></div>
    </header>
    <section className="admin-main">
      <div className="admin-title">
        <div><p className="admin-kicker">BACKSTAGE / RSVP CONTROL</p><h1>Guest <em>list.</em></h1><p className="admin-muted">Private responses for the 16 September party.</p></div>
        <div className="admin-count"><Users size={20}/><strong>{rows.length}</strong><span>Total RSVPs</span></div>
      </div>
      <div className="admin-tools">
        <label><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, college or number…"/></label>
        <button onClick={() => void loadRsvps()} disabled={busy}><RefreshCw size={17} className={busy ? "admin-spin" : ""}/> Refresh</button>
        <button className="admin-export" onClick={exportCsv} disabled={!filtered.length}><Download size={17}/> Export CSV</button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>College / University</th><th>Mobile</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>{filtered.map((row, index) => <tr key={row.id}><td>{String(index + 1).padStart(2, "0")}</td><td><strong>{row.name}</strong></td><td>{row.college}</td><td><a href={`tel:+91${row.phone}`}>+91 {row.phone}</a></td><td>{new Date(row.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</td><td><button className="admin-delete" onClick={() => setRemoveTarget(row)} aria-label={`Delete RSVP from ${row.name}`}><Trash2 size={16}/> Delete</button></td></tr>)}</tbody>
        </table>
        {!filtered.length && <div className="admin-empty">{rows.length ? "No matching guests." : "No RSVPs yet. The list will appear here."}</div>}
      </div>
      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => { if (!open && !deletingId) setRemoveTarget(null); }}>
        <AlertDialogContent className="admin-confirm">
          <AlertDialogHeader><AlertDialogTitle>Remove this RSVP?</AlertDialogTitle><AlertDialogDescription>{removeTarget ? `This permanently removes ${removeTarget.name}'s entry from the guest list.` : ""}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="admin-confirm-cancel">Keep entry</AlertDialogCancel><AlertDialogAction className="admin-confirm-delete" onClick={() => void removeRsvp()} disabled={Boolean(deletingId)}>{deletingId ? "Removing…" : "Delete entry"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  </main>;
}
