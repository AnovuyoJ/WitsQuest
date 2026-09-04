"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("id, title, message, href, read_at, created_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      console.error("NOTIFICATIONS LOAD ERROR:", loadError);
      setError(loadError.message);
    } else {
      setNotifications((data ?? []) as Notification[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function openNotification(notification: Notification) {
    if (!notification.read_at) {
      const readAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", notification.id);

      if (!updateError) {
        setNotifications((items) =>
          items.map((item) =>
            item.id === notification.id ? { ...item, read_at: readAt } : item
          )
        );
      }
    }

    if (notification.href) {
      router.push(notification.href);
    }
  }

  async function markAllRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.read_at)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .in("id", unreadIds);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotifications((items) =>
      items.map((item) => ({ ...item, read_at: item.read_at ?? readAt }))
    );
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length;

  return (
    <div className="min-h-full px-6 py-6 md:px-10 md:py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A24B]">
            Wits Quest
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#043673]">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Battle results and important game updates appear here.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#043673] hover:bg-slate-50"
          >
            Mark all as read
          </button>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-serif text-xl text-[#043673]">You are all caught up</h2>
          <p className="mt-2 text-sm text-slate-500">
            You do not have any notifications yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              className={`w-full rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                notification.read_at
                  ? "border-slate-200 bg-white"
                  : "border-[#C9A24B]/40 bg-amber-50/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.read_at ? "bg-slate-300" : "bg-[#C9A24B]"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-[#043673]">
                      {notification.title}
                    </h2>
                    <time className="text-xs text-slate-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
