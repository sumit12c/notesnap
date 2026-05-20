import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Circle, Sparkles } from "lucide-react";

interface ProcessingOverlayProps {
  isOpen: boolean;
  totalWords: number;
  totalScreenshots: number;
  activeStep: number; // 1 to 4
}

export default function ProcessingOverlay({
  isOpen,
  totalWords,
  totalScreenshots,
  activeStep,
}: ProcessingOverlayProps) {
  const [estimatedSeconds, setEstimatedSeconds] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setEstimatedSeconds(15);
      return;
    }

    // Rough countdown to give visual pacing
    const interval = setInterval(() => {
      setEstimatedSeconds((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    { id: 1, text: `Compiling captured text (${totalWords} words from ${totalScreenshots} screens)` },
    { id: 2, text: "Sending payloads securely to Gemini API" },
    { id: 3, text: "AI formatting: establishing outlines, bullet structures, and formulas" },
    { id: 4, text: "Formatting Word Document (.docx) template blocks" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden p-6 border border-slate-100 dark:border-slate-800 text-center animate-scale-up"
        id="processing-overlay-card"
      >
        {/* Animated Spinnner */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-purple-500 animate-pulse" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          Processing Study Notes with Gemini AI
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Converting OCR transcripts into formatted publication-ready study guides.
        </p>

        {/* Diagnostic Steps Checklist */}
        <div className="text-left space-y-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-6">
          {steps.map((step) => {
            const isCompleted = activeStep > step.id;
            const IsCurrent = activeStep === step.id;

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-transparent" />
                  ) : IsCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                  )}
                </div>
                <span className={`text-xs ${
                  isCompleted 
                    ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-700" 
                    : IsCurrent 
                      ? "text-slate-800 dark:text-white font-semibold" 
                      : "text-slate-400 dark:text-slate-600"
                }`}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timer Estimation feedback */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span>Estimated time remaining: {estimatedSeconds}s</span>
        </div>
      </div>
    </div>
  );
}
