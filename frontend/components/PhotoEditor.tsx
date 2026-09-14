"use client";
import { useEffect, useId, useState } from "react";
import { apiRequest } from "@/lib/api";
import { preparePhoto } from "@/lib/photo";

const photos = ["Wits university (1).jpg", "TW Khambule building @Wits University.jpg", "Tower of  light.jpg", "wits library.jpg", "Wits CLM building.jpg", "Wits university fountain.jpg", "wits university.jpg", "Wits.jpg", "995436323902947317.jpg", "🤍.jpg"];

export default function PhotoEditor({ endpoint, album = false }: { endpoint: string; album?: boolean }) {
  const inputId = useId();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const field = album ? "image" : "avatar";
  useEffect(() => {
    let active = true;
    apiRequest<Record<string, string | null>>(endpoint).then(result => {
      if (!active) return;
      if (result.error) { setError(result.error.message); setLoadFailed(true); }
      else setPhoto(result.data?.[field] ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, [endpoint, field]);
  async function save() {
    setBusy(true); setError(""); setMessage("");
    const result = await apiRequest(endpoint, "PUT", { [field]: photo });
    if (result.error) setError(result.error.message);
    else { setMessage("Picture saved."); if (!album) window.dispatchEvent(new Event("profile-photo-updated")); }
    setBusy(false);
  }
  return <div className="space-y-4">
    {loading ? <p role="status">Loading picture…</p> : <>
      <div className={album ? "h-48 overflow-hidden rounded-xl bg-slate-100" : "h-32 w-32 overflow-hidden rounded-full bg-slate-100"}>
        {/* Uploaded images are already resized, and may be data URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt={album ? "Album cover preview" : "Profile picture preview"} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center p-4 text-center text-sm text-slate-600">{album ? "Automatic quest photo" : "No picture"}</span>}
      </div>
      <fieldset disabled={busy || loadFailed} className="space-y-4 disabled:opacity-60">
        {album && <label className="block text-sm font-semibold">Choose a Wits photo<select aria-label="Choose a Wits photo" value={photo?.startsWith("/wits") ? photo : ""} onChange={event => { setPhoto(event.target.value || null); setMessage(""); }} className="mt-2 block w-full rounded-lg border border-slate-300 p-2"><option value="">{photo?.startsWith("data:") ? "Uploaded photo" : "Automatic quest photo"}</option>{photos.map(name => <option key={name} value={`/wits%20pictures/${encodeURIComponent(name)}`}>{name.replace(/\.jpg$/, "")}</option>)}</select></label>}
        <label htmlFor={inputId} className="block text-sm font-semibold">{album ? "Or upload a cover" : "Choose a profile picture"}</label>
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file) return;
          setBusy(true); setError(""); setMessage("");
          try { setPhoto(await preparePhoto(file, album ? 800 : 320)); }
          catch (error) { setError(error instanceof Error ? error.message : "Could not read this image."); }
          finally { setBusy(false); }
        }} />
        <p className="text-xs text-slate-600">JPEG, PNG or WebP, up to 10 MB. Preview your picture before saving.</p>
        <div className="flex flex-wrap gap-4"><button type="button" onClick={save} className="rounded-xl bg-[#043673] px-4 py-2 font-semibold text-white">{busy ? "Please wait…" : "Save picture"}</button><button type="button" onClick={() => { setPhoto(null); setMessage(""); }} className="text-sm text-red-700 underline">{album ? "Use automatic photo" : "Remove picture"}</button></div>
      </fieldset>
    </>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-green-800">{message}</p>}
  </div>;
}
