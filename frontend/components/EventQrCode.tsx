"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function EventQrCode({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, code, { width: 140, margin: 1 });
    }
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <canvas ref={canvasRef} />
      <p className="font-mono text-xs text-slate-500">{code}</p>
    </div>
  );
}