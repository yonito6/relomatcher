"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;

    const interval = setInterval(() => {
      // accelerate at first, slow near end
      p += Math.random() * 8 + 5; 
      if (p > 90) p = 90; 
      setProgress(p);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">

      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
        🤖 AI is calculating your best matches…
      </div>

      {/* Progress bar container */}
      <div className="w-full max-w-xs h-2 rounded-full bg-slate-800 overflow-hidden shadow-inner border border-slate-700">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-400">
        This usually takes a few seconds while we analyse countries and re-rank them using AI.
      </p>
    </div>
  );
}
