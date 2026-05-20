import React, { useState } from "react";
import { Trash2, Edit3, Save, X, Eye, ImageIcon, Clock, BookOpen, AlertCircle } from "lucide-react";
import { CaptureItem } from "../types";

interface LiveCapturesListProps {
  captures: CaptureItem[];
  onDeleteCapture: (id: string) => void;
  onUpdateCaptureText: (id: string, newText: string) => void;
}

export default function LiveCapturesList({
  captures,
  onDeleteCapture,
  onUpdateCaptureText,
}: LiveCapturesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);

  const startEditing = (capture: CaptureItem) => {
    setEditingId(capture.id);
    setEditText(capture.text);
  };

  const saveEdit = (id: string) => {
    onUpdateCaptureText(id, editText);
    setEditingId(null);
  };

  if (captures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No screen captures stored yet in this session
        </h4>
        <p className="max-w-md text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
          Click <span className="font-semibold text-blue-600">Start Capture</span> above, select your study program window, and we will extract and record screen texts automatically in safety.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          OCR Extraction History Timeline ({captures.length})
        </h3>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          Tip: You can edit or purge captures to refine final notes
        </span>
      </div>

      <div className="relative overflow-y-auto max-h-[480px] pr-2 space-y-4 scrollbar-thin">
        {captures.map((capture, index) => {
          const isEditing = editingId === capture.id;
          const isViewingImg = viewingImageId === capture.id;

          return (
            <div 
              key={capture.id} 
              className="group p-4 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs hover:border-slate-200 dark:hover:border-slate-700 transition flex flex-col md:flex-row gap-4 relative"
            >
              {/* Thumbnail Display Panel */}
              <div className="w-full md:w-32 h-20 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex-none relative group/thumb">
                {capture.screenshotBase64 ? (
                  <>
                    <img 
                      src={capture.screenshotBase64} 
                      alt={`Capture ${index + 1}`} 
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                    />
                    <button
                      type="button"
                      id={`btn-zoom-${capture.id}`}
                      onClick={() => setViewingImageId(isViewingImg ? null : capture.id)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition text-xs font-semibold gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> zoom
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[9px] mt-1">No Image</span>
                  </div>
                )}
                {/* Visual badge */}
                <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                  #{captures.length - index}
                </span>
              </div>

              {/* Text, Metadata, and Controls */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> {capture.timestamp}
                      </span>
                      <span>•</span>
                      <span>{capture.wordCount} words extracted</span>
                    </div>

                    {/* Operational Commands */}
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            id={`btn-save-edit-${capture.id}`}
                            onClick={() => saveEdit(capture.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"
                            title="Save text edits"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`btn-cancel-edit-${capture.id}`}
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Cancel edits"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            id={`btn-start-edit-${capture.id}`}
                            onClick={() => startEditing(capture)}
                            className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded dark:text-slate-400"
                            title="Edit raw OCR transcription"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            id={`btn-delete-${capture.id}`}
                            onClick={() => onDeleteCapture(capture.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                            title="Purge capture"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body textual paragraph */}
                  {isEditing ? (
                    <textarea
                      id={`textarea-editing-${capture.id}`}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-24 p-2 text-xs font-mono rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    />
                  ) : (
                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 overflow-hidden break-words pr-2 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded border border-slate-50 dark:border-slate-800/40 font-mono">
                      {capture.text || <span className="italic text-slate-400 dark:text-slate-600">(Blank capture - No distinct text read or skip)</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Large Image Preview overlay per capture item */}
              {isViewingImg && capture.screenshotBase64 && (
                <div className="absolute inset-0 z-10 bg-black/95 rounded-xl p-2 flex flex-col animate-fade-in">
                  <div className="flex items-center justify-between text-white text-xs px-2 pb-2">
                    <span className="font-mono">Capture Zoomed View ({capture.timestamp})</span>
                    <button
                      type="button"
                      id={`btn-close-zoom-${capture.id}`}
                      onClick={() => setViewingImageId(null)}
                      className="text-slate-400 hover:text-white transition p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center p-1 bg-slate-900 rounded-lg overflow-hidden">
                    <img
                      src={capture.screenshotBase64}
                      alt="Zoomed Screenshot Preview Source"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
