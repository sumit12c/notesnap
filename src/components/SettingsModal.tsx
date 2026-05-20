import React, { useState } from "react";
import { X, Key, Sliders, Globe, Eye, EyeOff, Bell, Moon, Sun, Monitor } from "lucide-react";
import { NotesNapSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotesNapSettings;
  onSave: (newSettings: NotesNapSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<NotesNapSettings>({ ...settings });
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof NotesNapSettings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);

    // Apply theme changes immediately for visual delight
    if (key === "theme") {
      if (value === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const languages = [
    { code: "eng", label: "English (Standard)" },
    { code: "spa", label: "Spanish (Español)" },
    { code: "fra", label: "French (Français)" },
    { code: "deu", label: "German (Deutsch)" },
    { code: "jpn", label: "Japanese (日本語)" },
    { code: "chi_sim", label: "Chinese Simplified (简体中文)" },
    { code: "por", label: "Portuguese (Português)" },
    { code: "ita", label: "Italian (Italiano)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-slide-up"
        id="settings-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">NotesNap Preferences</span>
          </div>
          <button 
            type="button"
            id="btn-close-settings"
            onClick={onClose} 
            className="p-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Default Document Title
            </label>
            <input
              type="text"
              id="input-doc-title"
              value={localSettings.documentTitle}
              onChange={(e) => handleChange("documentTitle", e.target.value)}
              placeholder="e.g. Operating Systems Lecture 4"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" /> Gemini API Key
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                Stored purely in your browser
              </span>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                id="input-api-key"
                value={localSettings.geminiApiKey}
                onChange={(e) => handleChange("geminiApiKey", e.target.value)}
                placeholder="Paste your GEMINI_API_KEY here (or leave blank for server default)"
                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                type="button"
                id="btn-toggle-key-visibility"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              If left blank, NotesNap will use the server's default environment key if loaded in the workspace.
            </p>
          </div>

          {/* Capture Interval */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Capture Interval
              </label>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                Every {localSettings.captureInterval} seconds
              </span>
            </div>
            <input
              type="range"
              id="slider-capture-interval"
              min="5"
              max="60"
              step="1"
              value={localSettings.captureInterval}
              onChange={(e) => handleChange("captureInterval", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 px-1 mt-1">
              <span>5s (Rapid capture)</span>
              <span>30s</span>
              <span>60s (Slower)</span>
            </div>
          </div>

          {/* OCR Language */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" /> OCR Reading Language
            </label>
            <select
              id="select-ocr-lang"
              value={localSettings.ocrLanguage}
              onChange={(e) => handleChange("ocrLanguage", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
            {/* Auto-pause Sensitivity */}
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Adaptive Focus Tracker (Tab Pause)
                </span>
                <span className="block text-xs text-slate-400 leading-normal">
                  Automatically pause capture while you are viewing this NotesNap dashboard tab, and resume when you focus on your study window. This reduces duplicate dashboard images.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-auto-pause"
                  checked={localSettings.autoPauseSensitivity}
                  onChange={(e) => handleChange("autoPauseSensitivity", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-slate-400" /> Desktop Push Alerts
                </span>
                <span className="block text-xs text-slate-400 leading-normal">
                  Send a local browser notification when OCR captures are paused or resumed automatically.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-notifications"
                  checked={localSettings.desktopNotifications}
                  onChange={(e) => handleChange("desktopNotifications", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Light / Dark Theme selector */}
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {localSettings.theme === "dark" ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Theme Mode
                </span>
                <span className="block text-xs text-slate-400">
                  Switch the user interface color palette between light and dark modes.
                </span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  id="btn-theme-light"
                  onClick={() => handleChange("theme", "light")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    localSettings.theme === "light"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  id="btn-theme-dark"
                  onClick={() => handleChange("theme", "dark")}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    localSettings.theme === "dark"
                      ? "bg-slate-900 text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-500"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            id="btn-cancel-settings"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-settings"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm transition"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
