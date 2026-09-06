"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader, ScreenSkeleton, StatePanel } from "@/components/WitsScreen";
import { supabase } from "@/lib/supabaseClient";

type Notification = { id: string; title: string; message: string; href: string | null; read_at: string | null; created_at: string };

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("notifications").select("id, title, message, href, read_at, created_at").order("created_at", { ascending: false });
    if (loadError) { console.error("NOTIFICATIONS LOAD ERROR:", loadError); setError(loadError.message); }
    else setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, []);
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  async function openNotification(notification: Notification) {
    if (!notification.read_at) {
      const readAt = new Date().toISOString();
      const { error: updateError } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", notification.id);
      if (!updateError) setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: readAt } : item));
    }
    if (notification.href) router.push(notification.href);
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id);
    if (!unreadIds.length) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase.from("notifications").update({ read_at: readAt }).in("id", unreadIds);
    if (updateError) { setError(updateError.message); return; }
    setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;
  return (
    <div className="min-h-full px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <ScreenHeader eyebrow="Activity desk" title="Notifications" description="Battle results, forfeits and important game updates are recorded here." action={unreadCount > 0 ? <button type="button" onClick={markAllRead} className="shrink-0 rounded-xl border border-[#043673]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#043673] transition hover:bg-[#043673]/5 active:scale-[.98]">Mark all read</button> : undefined} />
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      {loading ? <ScreenSkeleton cards={3} /> : notifications.length === 0 ? <StatePanel title="You are all caught up" description="There are no battle results or game updates waiting for you." /> : (
        <section className="overflow-hidden rounded-2xl border border-[#043673]/12 bg-white" aria-label="Notification feed">
          <div className="grid grid-cols-[1fr_auto] border-b border-[#043673]/10 bg-[#E8EDF4] px-5 py-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#043673]/65"><span>Latest activity</span><span>{unreadCount} unread</span></div>
          {notifications.map((notification) => (
            <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`group grid w-full grid-cols-[4px_1fr] gap-4 border-b border-slate-100 px-5 py-5 text-left transition last:border-0 hover:bg-[#F7F9FC] active:bg-[#EEF2F7] ${notification.read_at ? "" : "bg-[#FCF8ED]"}`}>
              <span className={`h-full min-h-12 rounded-full ${notification.read_at ? "bg-slate-200" : "bg-[#C9A24B]"}`} />
              <span><span className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline"><strong className="text-sm text-[#043673]">{notification.title}</strong><time className="font-mono text-[10px] text-slate-400">{new Date(notification.created_at).toLocaleString()}</time></span><span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>{notification.href && <span className="mt-3 block text-xs font-bold text-[#043673]">Open update →</span>}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
