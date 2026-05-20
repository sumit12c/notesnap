export interface CaptureItem {
  id: string;
  timestamp: string; // HH:MM:SS
  text: string;
  wordCount: number;
  screenshotBase64: string; // Dynamic image thumbnail
}

export interface SessionStats {
  sessionStartTime: string | null;
  activeStudyTime: number; // in seconds
  totalSessionTime: number; // in seconds
  screenshotCount: number;
  wordCount: number;
  focusScore: number; // activeTime / totalTime * 100
  streakMinutes: number; // longest contiguous capture series (estimate)
}

export interface NotesNapSettings {
  geminiApiKey: string;
  captureInterval: number; // in seconds, 5 to 60
  ocrLanguage: string; // 'eng', etc.
  documentTitle: string;
  autoPauseSensitivity: boolean; // pause when returning to NotesNap applet
  desktopNotifications: boolean;
  theme: "light" | "dark";
}
