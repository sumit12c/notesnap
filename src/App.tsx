import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Play, 
  Square, 
  Settings, 
  Flame, 
  BookOpen, 
  Sparkles, 
  History, 
  User, 
  Check, 
  Loader2, 
  Clock, 
  RotateCcw, 
  AlertTriangle, 
  Sliders, 
  Volume2, 
  BellRing,
  Award,
  AlertCircle
} from "lucide-react";
import Tesseract from "tesseract.js";

// Types and imports
import { CaptureItem, SessionStats, NotesNapSettings } from "./types";
import SettingsModal from "./components/SettingsModal";
import CaptureStatusIndicator, { formatDuration } from "./components/CaptureStatusIndicator";
import SessionStatsPanel from "./components/SessionStatsPanel";
import LiveCapturesList from "./components/LiveCapturesList";
import ProcessingOverlay from "./components/ProcessingOverlay";
import DownloadsModal from "./components/DownloadsModal";
import { generateDocxBlob } from "./utils/docxExporter";

// Default application preferences
const DEFAULT_SETTINGS: NotesNapSettings = {
  geminiApiKey: "",
  captureInterval: 15, // default 15 seconds
  ocrLanguage: "eng",
  documentTitle: "My Structured Notes",
  autoPauseSensitivity: true,
  desktopNotifications: true,
  theme: "light",
};

export default function App() {
  // Configured Settings
  const [settings, setSettings] = useState<NotesNapSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Core Capturing States
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [pinnedWindowName, setPinnedWindowName] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
  // OCR processing visual state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Time metrics inside active sessions
  const [activeStudySeconds, setActiveStudySeconds] = useState(0);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(0);

  // Recovered crash state
  const [hasCrashSession, setHasCrashSession] = useState(false);

  // Gemini API Processing phases
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);

  // Custom modal trigger states replacing iframe-blocked alert() and confirm()
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [showDiscardSessionConfirm, setShowDiscardSessionConfirm] = useState(false);
  const [customFeedback, setCustomFeedback] = useState<{
    title: string;
    message: string;
    type: "error" | "info" | "success" | "warning";
  } | null>(null);

  // Promises and media pointers
  const [mediaStream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Study alerts / toast messages state
  const [studyToast, setStudyToast] = useState<string | null>(null);

  // Ref tracking time differences
  const lastCaptureTimeRef = useRef<number>(0);

  // ==========================================
  // INITIAL LOAD AND LOAD CRASH RECOVERY
  // ==========================================
  useEffect(() => {
    // 1. Restore settings from localStorage
    const savedSettings = localStorage.getItem("notesnap_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        // Enable dark mode immediately if set
        if (parsed.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }

    // 2. Scan for unfinished sessions for safety recovery
    const savedSession = localStorage.getItem("notesnap_active_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed?.captures && parsed?.captures.length > 0) {
          setHasCrashSession(true);
        }
      } catch (e) {
        console.error("Failed to parse crash session:", e);
      }
    }
  }, []);

  // Save settings helper
  const handleSaveSettings = (newSettings: NotesNapSettings) => {
    setSettings(newSettings);
    localStorage.setItem("notesnap_settings", JSON.stringify(newSettings));
  };

  // Restore session callback
  const handleRestoreSession = () => {
    const savedSessionString = localStorage.getItem("notesnap_active_session");
    if (savedSessionString) {
      try {
        const parsed = JSON.parse(savedSessionString);
        setCaptures(parsed.captures || []);
        setActiveStudySeconds(parsed.activeSeconds || 0);
        setTotalSessionSeconds(parsed.totalSeconds || 0);
        setPinnedWindowName(parsed.pinnedWindowName || "Restored Session");
        setSessionStartTime(parsed.sessionStartTime || new Date().toISOString());
        setIsCapturing(true);
        setIsPaused(true); // Restore but keep paused till trigger
        
        // request screen share again to bind stream
        alert("Session metrics loaded successfully. Please select your window layout to resume live capturing.");
      } catch (e) {
        console.error("Restore session failed:", e);
      }
    }
    setHasCrashSession(false);
  };

  // Discard saved session callback
  const handleDiscardCrash = () => {
    localStorage.removeItem("notesnap_active_session");
    setHasCrashSession(false);
  };

  // ==========================================
  // ADAPTIVE BLUR/FOCUS AUTOMATIC EVENTS
  // ==========================================
  useEffect(() => {
    if (!isCapturing || !settings.autoPauseSensitivity) return;

    const handleFocus = () => {
      // NotesNap tab is active -> Pause capturing
      setIsPaused(true);
      
      if (settings.desktopNotifications && Notification.permission === "granted") {
        new Notification("NotesNap Paused", {
          body: `Dashboard is active. Return to your homework/study slide window to resume capture.`,
          icon: "/favicon.ico",
        });
      }
    };

    const handleBlur = () => {
      // Switched away to slide or textbook -> Resume capturing
      setIsPaused(false);
      lastCaptureTimeRef.current = Date.now(); // reset timer offset to avoid instant capture surprise

      if (settings.desktopNotifications && Notification.permission === "granted") {
        new Notification("NotesNap Capturing", {
          body: `Screen tracking resumed on: ${pinnedWindowName}`,
          icon: "/favicon.ico",
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isCapturing, settings.autoPauseSensitivity, settings.desktopNotifications, pinnedWindowName]);

  // Tab Close Warning to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCapturing && captures.length > 0) {
        e.preventDefault();
        e.returnValue = "You have an active NotesNap session. Closing this tab will end your session statistics.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isCapturing, captures]);

  // Save session state locally for crash recovery as it develops
  useEffect(() => {
    if (!isCapturing) return;
    const sessionObj = {
      captures,
      activeSeconds: activeStudySeconds,
      totalSeconds: totalSessionSeconds,
      pinnedWindowName,
      sessionStartTime,
    };
    localStorage.setItem("notesnap_active_session", JSON.stringify(sessionObj));
  }, [captures, activeStudySeconds, totalSessionSeconds, isCapturing, pinnedWindowName, sessionStartTime]);

  // ==========================================
  // INTERVAL TIMERS (1s CLOCK TICKER & CAPTURER)
  // ==========================================
  useEffect(() => {
    if (!isCapturing) return;

    const mainClockInterval = setInterval(() => {
      // 1. Total running clock of the study event
      setTotalSessionSeconds((prev) => prev + 1);

      // 2. Active study clock (accrues only when running and not blurred/paused)
      if (!isPaused) {
        setActiveStudySeconds((prev) => {
          const nextVal = prev + 1;
          
          // Suggest breaks after 45 mins of continuous active focus (2700s)
          if (nextVal > 0 && nextVal % 2700 === 0) {
            setStudyToast("☕ Coffee/Water Break! You have been focused for 45 minutes. NotesNap suggests taking a 5-minute break.");
            if (settings.desktopNotifications && Notification.permission === "granted") {
              new Notification("NotesNap Break Suggestion", {
                body: "You've active studied for 45 minutes! Time for a short break to stand and stretch.",
              });
            }
          }
          return nextVal;
        });
      }
    }, 1000);

    return () => clearInterval(mainClockInterval);
  }, [isCapturing, isPaused, settings.desktopNotifications]);

  // Capture interval cycle watcher
  useEffect(() => {
    if (!isCapturing || isPaused || isOcrProcessing) return;

    const intervalMs = settings.captureInterval * 1000;
    
    const captureCycle = setInterval(() => {
      // Double check capture interval elapsed safely
      const now = Date.now();
      if (now - lastCaptureTimeRef.current >= intervalMs) {
        triggerSingleCapture();
      }
    }, 1000);

    return () => clearInterval(captureCycle);
  }, [isCapturing, isPaused, isOcrProcessing, settings.captureInterval]);

  // ==========================================
  // SCREEN CAPTURE AND OCR PROCESSING CORE
  // ==========================================
  const triggerSingleCapture = async () => {
    if (!isCapturing || isPaused) return;
    
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Screen stream video track does not contain pixel dimensions yet.");
      return;
    }

    lastCaptureTimeRef.current = Date.now();
    setIsOcrProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      let base64Image = "";

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas graphics content.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      base64Image = canvas.toDataURL("image/jpeg", 0.65);

      // Drive Tesseract Client OCR directly on the captured canvas pixels!
      const ocrResult = await Tesseract.recognize(canvas, settings.ocrLanguage);
      const rawText = ocrResult?.data?.text || "";

      const cleanedText = rawText.trim();
      const derivedWords = cleanedText ? cleanedText.split(/\s+/).length : 0;

      // 4. Run intelligent Jaccard similarity word difference detection!
      if (captures.length > 0) {
        const lastCap = captures[0]; // captures are unshifted (latest at index 0)
        
        // Calculate overlap coefficients
        const overlap = getJaccardWordSimilarity(cleanedText, lastCap.text);
        if (overlap >= 0.85) {
          console.log(`[NotesNap] Slide identical or minimal text change skipped (Similarity: ${overlap.toFixed(2)}).`);
          setIsOcrProcessing(false);
          return; // Skip duplicate frame storage completely
        }
      }

      // 5. Append new item into chronology state
      const timestampFormatted = new Date().toLocaleTimeString();
      const newCapture: CaptureItem = {
        id: `cap-${Date.now()}`,
        timestamp: timestampFormatted,
        text: cleanedText,
        wordCount: derivedWords,
        screenshotBase64: base64Image,
      };

      setCaptures((prev) => [newCapture, ...prev]);

    } catch (err) {
      console.error("NotesNap error capturing index slide:", err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Helper Jaccard overlap similarity
  const getJaccardWordSimilarity = (s1: string, s2: string): number => {
    if (!s1 || !s2) return 0;
    const words1 = new Set(s1.toLowerCase().match(/\w+/g) || []);
    const words2 = new Set(s2.toLowerCase().match(/\w+/g) || []);
    if (words1.size === 0 && words2.size === 0) return 1;

    let intersectCount = 0;
    words1.forEach((word) => {
      if (words2.has(word)) intersectCount++;
    });

    const unionCount = words1.size + words2.size - intersectCount;
    return unionCount === 0 ? 0 : intersectCount / unionCount;
  };

  // ==========================================
  // ACTION EVENT HANDLERS
  // ==========================================

  // START capturing routine
  const handleStartCapture = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window", // encourage choosing specific app window
        },
        audio: false, // video capture only
      });

      // Assign the active display stream to our background video element
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
        videoRef.current.play().catch((e) => console.error("Error launching video stream:", e));
      }

      setStream(displayStream);
      
      const track = displayStream.getVideoTracks()[0];
      const name = track.label || "Study Screen Capture";
      setPinnedWindowName(name);

      // Listen to the native Chrome "Stop Sharing" button click event
      track.onended = () => {
        setIsPaused(true);
        setCustomFeedback({
          title: "Stream Stopped",
          message: "Sharing of the study window was stopped. Capture is paused. Click End Session to compile your notes.",
          type: "warning"
        });
      };

      setIsCapturing(true);
      setIsPaused(false);
      setSessionStartTime(new Date().toISOString());
      setCaptures([]);
      setActiveStudySeconds(0);
      setTotalSessionSeconds(0);
      lastCaptureTimeRef.current = Date.now();

      // Trigger first capture instantly so timeline looks populated from start!
      setTimeout(() => {
        triggerSingleCapture();
      }, 1000);

      // Prompt desktop alerts permission
      if (settings.desktopNotifications && Notification.permission === "default") {
        Notification.requestPermission();
      }

    } catch (err: any) {
      console.error("Display media acquisition blocked:", err);
    }
  };

  // Turn Pause / Resume Toggles
  const handlePauseToggle = () => {
    setIsPaused((prev) => {
      const nextPaused = !prev;
      lastCaptureTimeRef.current = Date.now(); // Reset interval anchor
      return nextPaused;
    });
  };

  // Update item callback
  const handleUpdateCaptureText = (id: string, newText: string) => {
    setCaptures((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const words = newText.trim() ? newText.trim().split(/\s+/).length : 0;
          return { ...c, text: newText, wordCount: words };
        }
        return c;
      })
    );
  };

  // Delete item callback
  const handleDeleteCapture = (id: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  };

  // Click Trigger for ending session with confirmation
  const handleEndSessionPre = () => {
    if (captures.length === 0) {
      setShowDiscardSessionConfirm(true);
      return;
    }
    setShowEndSessionConfirm(true);
  };

  const handleConfirmEndSession = () => {
    setShowEndSessionConfirm(false);
    // Disconnect camera stream quickly to free up browser focus resource
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsPaused(true);
    setIsCapturing(false); // Stop capturing and stop all timers immediately
    processSessionWithGemini();
  };

  const handleConfirmDiscardSession = () => {
    setShowDiscardSessionConfirm(false);
    resetAppToIdle();
  };

  // BATCH PROCESSING PROCESSOR WITH AI
  const processSessionWithGemini = async () => {
    setIsProcessingWithGemini(true);
    setProcessingStep(1);

    // Filter empty captions or slides
    const validPayloadText = captures
      .slice()
      .reverse() // Sort to chronological order (first taken to last taken)
      .filter((cap) => cap.text.trim().length > 0)
      .map((cap) => ({
        timestamp: cap.timestamp,
        text: cap.text,
      }));

    const computedTotalWords = captures.reduce((acc, c) => acc + c.wordCount, 0);

    setTimeout(() => setProcessingStep(2), 2000); // Visual step animations
    setTimeout(() => setProcessingStep(3), 5000);

    try {
      const activeTimeFormatted = formatDuration(activeStudySeconds);
      const response = await fetch("/api/process-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textPayload: validPayloadText,
          metadata: {
            totalDuration: formatDuration(totalSessionSeconds),
            activeTime: activeTimeFormatted,
            count: captures.length,
            words: computedTotalWords,
            windowName: pinnedWindowName,
          },
          customApiKey: settings.geminiApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed API callback.");
      }

      setGeneratedMarkdown(data.markdown);
      setProcessingStep(4);
      
      setTimeout(() => {
        setIsProcessingWithGemini(false);
        setIsDownloadsOpen(true);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setCustomFeedback({
        title: "Study Guide Compilation Failed",
        message: err?.message || "Check your API connection settings or Gemini API Key validity in the settings drawer.",
        type: "error"
      });
      setIsProcessingWithGemini(false);
    }
  };

  // EXPORT .DOCX DOWNLOAD
  const handleDownloadDocx = async () => {
    try {
      const totalWords = captures.reduce((acc, c) => acc + c.wordCount, 0);
      const activeTimeStr = formatDuration(activeStudySeconds);

      // Compile formatted document
      const blob = await generateDocxBlob(generatedMarkdown, {
        title: settings.documentTitle || "My NotesNap Study Guide",
        date: new Date().toLocaleDateString(),
        totalDuration: formatDuration(totalSessionSeconds),
        activeTime: activeTimeStr,
        screenshotsCount: captures.length,
        totalWords: totalWords,
        windowName: pinnedWindowName,
      });

      // Save file local
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${(settings.documentTitle || "notesnap_notes").toLowerCase().replace(/\s+/g, "_")}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (e: any) {
      console.error("Docx generation failed:", e);
      setCustomFeedback({
        title: "Document Export Failed",
        message: `Word document export failed: ${e?.message || e}`,
        type: "error"
      });
    }
  };

  // EXPORT .MD DOWNLOAD
  const handleDownloadMarkdown = () => {
    const blob = new Blob([generatedMarkdown], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(settings.documentTitle || "notesnap_notes").toLowerCase().replace(/\s+/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // RESET idle state callback
  const resetAppToIdle = () => {
    // Clear live session cache
    localStorage.removeItem("notesnap_active_session");

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsCapturing(false);
    setIsPaused(false);
    setCaptures([]);
    setPinnedWindowName("");
    setSessionStartTime(null);
    setActiveStudySeconds(0);
    setTotalSessionSeconds(0);
    setGeneratedMarkdown("");
    setViewingImageIdCloseAll();
  };

  const setViewingImageIdCloseAll = () => {
    setIsDownloadsOpen(false);
  };

  // Focus score computation (Active focus seconds divided by total ticker clock * 10%)
  const calculatedFocusScore = totalSessionSeconds > 0 
    ? (activeStudySeconds / totalSessionSeconds) * 100 
    : 100;

  // Streak tracker index (Estimated: count continuous capturing sections in minutes)
  const calculatedStreakMinutes = Math.min(
    Math.round(activeStudySeconds / 60), 
    90 // logical ceiling
  );

  return (
    <div className={`min-h-screen font-sans ${settings.theme === "dark" ? "dark bg-[#0b0f19]" : "bg-slate-50"}`}>
      
      {/* Background hidden elements */}
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header toolbar */}
      <header className="border-b border-rose-50 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                NotesNap
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                AI Screen Capture Study Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct manual capture triggers (only visible if capturing) */}
            {isCapturing && !isPaused && (
              <button
                type="button"
                id="btn-manual-capture-trigger"
                onClick={triggerSingleCapture}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-100 transition border border-blue-100/50 dark:border-blue-900/40"
                disabled={isOcrProcessing}
              >
                {isOcrProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>Capture Now</span>
              </button>
            )}

            {/* Config parameters link toggle */}
            <button
              type="button"
              id="btn-header-configs"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
              title="Application Preferences"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Embedded active study breaks warning banners */}
      {studyToast && (
        <div className="bg-blue-600 text-white text-xs px-4 py-2.5 shadow-md flex items-center justify-between animate-fade-in z-40 sticky top-0">
          <div className="flex items-center gap-2 font-medium">
            <BellRing className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{studyToast}</span>
          </div>
          <button
            type="button"
            id="btn-dismiss-toast"
            className="font-bold underline text-[10px] opacity-90 hover:opacity-100 uppercase tracking-widest px-2 py-0.5 rounded hover:bg-white/10"
            onClick={() => setStudyToast(null)}
          >
            Got it
          </button>
        </div>
      )}

      {/* Sticky Banner indicator */}
      <CaptureStatusIndicator
        isCapturing={isCapturing}
        isPaused={isPaused}
        activeStudyTime={activeStudySeconds}
        screenshotCount={captures.length}
        wordCount={captures.reduce((acc, c) => acc + c.wordCount, 0)}
        pinnedWindowName={pinnedWindowName}
        onPauseToggle={handlePauseToggle}
        onEndSession={handleEndSessionPre}
        focusScore={calculatedFocusScore}
      />

      {/* Main Container screen grid */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Crash detected notice box */}
        {hasCrashSession && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-1 sm:mt-0 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  Unfinished Study Session Recovered!
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5 leading-relaxed">
                  We found recorded screenshots and focus tracking timers on this browser storage from a recent session. Would you like to restore it?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                id="btn-discard-recovered"
                onClick={handleDiscardCrash}
                className="px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 rounded-lg font-medium transition"
              >
                Discard
              </button>
              <button
                type="button"
                id="btn-restore-recovered"
                onClick={handleRestoreSession}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
              >
                Restore Session
              </button>
            </div>
          </div>
        )}

        {/* IDLE MAIN SCREEN DASHBOARD PORT */}
        {!isCapturing && (
          <div className="py-12 px-6 bg-white dark:bg-[#111827] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center max-w-3xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner border border-blue-100/40 dark:border-blue-900/30">
              <Camera className="w-8 h-8 animate-pulse text-blue-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                AI-Powered Study Capture to Word Converter
              </h2>
              <p className="max-w-xl text-sm text-slate-400 dark:text-slate-500 mx-auto leading-relaxed">
                Stream your study program or PDF slide window. NotesNap automatically compresses screens, processes OCR vocabulary, and formats rich notes into publication-ready docx documents with Google Gemini AI.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="btn-start-initial-capture"
                onClick={handleStartCapture}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition duration-200"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Capturing</span>
              </button>
              
              <button
                type="button"
                id="btn-initial-preferences"
                onClick={() => setIsSettingsOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Configure Settings</span>
              </button>
            </div>

            {/* Workflow instructions footer info */}
            <div className="border-t border-slate-50 dark:border-slate-800/60 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">STEP 1</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pin your PDF slides, video workspace, or screen window to begin.
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">STEP 2</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Focus on your studies. NotesNap auto-pauses when you switch away.
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">STEP 3</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  End session which compiles data into professional Microsoft Word docs!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE RUNNING DASHBOARD GRID */}
        {isCapturing && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            {/* Left Column: Capture Settings (col-span-3) */}
            <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-6 shadow-xs border border-slate-200 dark:border-slate-800/80">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Capture Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold block mb-2 text-slate-700 dark:text-slate-300">Capture Interval</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      step="5"
                      value={settings.captureInterval}
                      onChange={(e) => handleSaveSettings({ ...settings, captureInterval: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                      <span>5s</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{settings.captureInterval} seconds</span>
                      <span>60s</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Preferences</label>
                    
                    {/* Auto Pause Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Auto-pause on Switch</span>
                      <button 
                        type="button"
                        id="btn-sidebar-toggle-autopause"
                        onClick={() => handleSaveSettings({ ...settings, autoPauseSensitivity: !settings.autoPauseSensitivity })}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                          settings.autoPauseSensitivity ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                          settings.autoPauseSensitivity ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                    {/* Notifications Switch */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Desktop Notifications</span>
                      <button 
                        type="button"
                        id="btn-sidebar-toggle-notifications"
                        onClick={() => handleSaveSettings({ ...settings, desktopNotifications: !settings.desktopNotifications })}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                          settings.desktopNotifications ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                          settings.desktopNotifications ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                    {/* Change Detect info */}
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mt-2">
                      <span>Smart Change Detect</span>
                      <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 font-mono">Active (85%)</span>
                    </div>
                  </div>

                  {/* Language Preferences */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">OCR Language</label>
                    <select
                      value={settings.ocrLanguage}
                      id="select-sidebar-lang"
                      onChange={(e) => handleSaveSettings({ ...settings, ocrLanguage: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg p-2 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="eng">English (eng)</option>
                      <option value="spa">Spanish (spa)</option>
                      <option value="fra">French (fra)</option>
                      <option value="deu">German (deu)</option>
                      <option value="chi_sim">Simplified Chinese</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Gemini API Status</label>
                    {settings.geminiApiKey ? (
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
                          <span className="text-[11px] font-mono text-slate-650 dark:text-slate-400 truncate">
                            sk-••••{settings.geminiApiKey.slice(-4)}
                          </span>
                        </div>
                        <button
                          type="button"
                          id="btn-sidebar-clear-key"
                          onClick={() => handleSaveSettings({ ...settings, geminiApiKey: "" })}
                          className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-wider shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 animate-fade-in">
                        <input
                          type="password"
                          id="input-sidebar-apikey"
                          placeholder="sk-gemini-v1-••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg p-2 font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400"
                          value={settings.geminiApiKey}
                          onChange={(e) => handleSaveSettings({ ...settings, geminiApiKey: e.target.value })}
                        />
                        <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal">
                          Configured using safe system proxy by default. Access keys can be declared here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                id="btn-sidebar-pause-toggle"
                onClick={handlePauseToggle}
                className={`w-full py-4 rounded-[20px] font-bold text-base transition-all duration-200 shadow-sm ${
                  isPaused 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-slate-200 dark:shadow-none"
                }`}
              >
                {isPaused ? "Resume Session" : "Pause Session"}
              </button>
            </section>

            {/* Middle Column: Central Panel - Live Statistics & Review (col-span-4) */}
            <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Focus score card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-8 shadow-xs border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center text-center">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Focus Score</h2>
                
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent" 
                      className="text-slate-100 dark:text-slate-800" 
                    />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray="440" 
                      strokeDashoffset={440 - (calculatedFocusScore / 100) * 440} 
                      className="text-blue-600 dark:text-blue-400 transition-all duration-500" 
                    />
                  </svg>
                  <span className="absolute text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                    {Math.round(calculatedFocusScore)}%
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  You spent {Math.round(activeStudySeconds / 60)}m in active focus out of {Math.round(totalSessionSeconds / 60)}m total duration
                </p>
              </div>

              {/* Grid of secondary statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-6 shadow-xs border border-slate-200 dark:border-slate-800/80">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Captures</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono leading-none">{captures.length}</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-6 shadow-xs border border-slate-200 dark:border-slate-800/80">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Words</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-mono leading-none">
                    {captures.reduce((acc, c) => acc + c.wordCount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Ready to Review callout block */}
              <div className="bg-blue-600 rounded-[24px] p-6 text-white shadow-xl shadow-blue-500/10 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold mb-2 tracking-tight">Ready to Review?</h3>
                  <p className="text-blue-100 text-xs leading-relaxed opacity-90">
                    Your session has accumulated enough OCR snapshots for a high quality dynamic study guide. Click below to combine transcripts with Gemini AI.
                  </p>
                </div>
                <button 
                  type="button"
                  id="btn-sidebar-end-session"
                  onClick={handleEndSessionPre}
                  className="w-full bg-white text-blue-600 py-4 rounded-[16px] font-bold text-sm hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-md uppercase tracking-wider"
                >
                  End Session & Export
                </button>
              </div>
            </section>

            {/* Right Column: Recent OCR Captures timeline containing list (col-span-5) */}
            <section className="col-span-12 lg:col-span-5 bg-white dark:bg-[#1e293b] rounded-[24px] shadow-xs border border-slate-200 dark:border-slate-800/80 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Recent OCR Captures</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
                  Auto-Sync: ON
                </span>
              </div>

              {/* Live Preview monitor panel */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/80">
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 flex items-center justify-center">
                  {isOcrProcessing && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center z-10 text-white gap-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="text-xs font-mono font-semibold animate-pulse">Running OCR Extract...</span>
                    </div>
                  )}

                  {captures.length > 0 && captures[0].screenshotBase64 ? (
                    <img
                      src={captures[0].screenshotBase64}
                      alt="Current Live Sharing Crop Stream Feed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 dark:text-slate-600 p-6 space-y-2">
                      <Camera className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                      <span className="block text-xs font-semibold">Waiting for stream capture...</span>
                      <span className="block text-[10px] italic">Snapshot interval: {settings.captureInterval}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive captures core list */}
              <div className="p-4 flex-1">
                <LiveCapturesList
                  captures={captures}
                  onDeleteCapture={handleDeleteCapture}
                  onUpdateCaptureText={handleUpdateCaptureText}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Config Panel Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Processing Animation Screen */}
      <ProcessingOverlay
        isOpen={isProcessingWithGemini}
        totalWords={captures.reduce((acc, c) => acc + c.wordCount, 0)}
        totalScreenshots={captures.length}
        activeStep={processingStep}
      />

      {/* Downloads Action Dialog */}
      <DownloadsModal
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        documentTitle={settings.documentTitle}
        totalWords={captures.reduce((acc, c) => acc + c.wordCount, 0)}
        totalScreenshots={captures.length}
        activeTimeFormatted={formatDuration(activeStudySeconds)}
        markdownContent={generatedMarkdown}
        onDownloadDocx={handleDownloadDocx}
        onDownloadMarkdown={handleDownloadMarkdown}
        onStartNewSession={resetAppToIdle}
      />

      {/* Custom Discard Session Confirm Dialog Modal */}
      {showDiscardSessionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100">Discard Study Session?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              No course snapshots have been captured yet. Ending this session now will discard all timer logs.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
                onClick={() => setShowDiscardSessionConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-md"
                onClick={handleConfirmDiscardSession}
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom End Session Confirm Dialog Modal */}
      {showEndSessionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800/80 p-6 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100">Compile Study Guide?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Are you ready to end your study session and compile all <strong>{captures.length}</strong> accumulated screenshots into a structured, formatted Study Notes guide with Gemini AI?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
                onClick={() => setShowEndSessionConfirm(false)}
              >
                Back to study
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md"
                onClick={handleConfirmEndSession}
              >
                End & Compile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Feedback/Alert Dialog Modal */}
      {customFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800/80 p-6 max-w-md w-full text-center space-y-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              customFeedback.type === "error" 
                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" 
                : customFeedback.type === "warning"
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
            }`}>
              {customFeedback.type === "error" ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : customFeedback.type === "warning" ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </div>
            <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100">
              {customFeedback.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap text-left bg-slate-50 dark:bg-slate-900 leading-relaxed max-h-48 overflow-y-auto p-3.5 rounded-xl border border-slate-100 dark:border-slate-805/40 text-slate-705 dark:text-slate-300 font-medium">
              {customFeedback.message}
            </p>
            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                onClick={() => setCustomFeedback(null)}
              >
                Dismiss Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
