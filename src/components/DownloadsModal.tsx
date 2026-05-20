import React, { useState } from "react";
import { X, FileText, FileDown, Copy, Check, Printer, RotateCcw, Award, CheckCircle } from "lucide-react";

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  totalWords: number;
  totalScreenshots: number;
  activeTimeFormatted: string;
  onDownloadDocx: () => void;
  onDownloadMarkdown: () => void;
  markdownContent: string;
  onStartNewSession: () => void;
}

export default function DownloadsModal({
  isOpen,
  onClose,
  documentTitle,
  totalWords,
  totalScreenshots,
  activeTimeFormatted,
  onDownloadDocx,
  onDownloadMarkdown,
  markdownContent,
  onStartNewSession,
}: DownloadsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handlePrintPdf = () => {
    // We open a temporary clean iframe or window containing the markdown rendered in readable format inside, then print it!
    // This allows downloading PDF via standard browser print dialog without cluttering the page.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to utilize browser PDF print formatting.");
      return;
    }

    // Direct elegant print document markup
    printWindow.document.write(`
      <html>
        <head>
          <title>${documentTitle || "Study Session Notes"}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; padding: 40px; color: #1a202c; }
            h1 { color: #1a365d; font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; }
            h2 { color: #2b6cb0; font-size: 20px; margin-top: 30px; }
            h3 { color: #4a5568; font-size: 16px; }
            p { margin-bottom: 15px; }
            code { background: #f7fafc; padding: 2px 5px; font-family: monospace; border-radius: 4px; color: #c7254e; }
            pre { background: #f7fafc; border-left: 4px solid #3182ce; padding: 15px; overflow-x: auto; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #ebf8ff; color: #2b6cb0; font-weight: bold; }
            tr:nth-child(even) { background-color: #f7fafc; }
            .meta { background: #edf2f7; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 30px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #ebf8ff; color: #2b6cb0; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 13px; text-align: center;">
            💻 Safe print format active. Change destination printer to <b>"Save as PDF"</b> inside settings, then click Print.
          </div>
          <h1>${documentTitle.toUpperCase() || "STUDY SESSION NOTES"}</h1>
          <div class="meta">
            <strong>Study Duration:</strong> ${activeTimeFormatted} | 
            <strong>Screenshots Compressed:</strong> ${totalScreenshots} screens | 
            <strong>Total Words:</strong> ${totalWords} words processed
          </div>
          <div>
            ${markdownContent
              .replace(/#\s+(.*)/g, "<h1>$1</h1>")
              .replace(/##\s+(.*)/g, "<h2>$1</h2>")
              .replace(/###\s+(.*)/g, "<h3>$1</h3>")
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.*?)\*/g, "<em>$1</em>")
              .replace(/`([^`]+)`/g, "<code>$1</code>")
              .replace(/```([\s\S]*?)```/g, "<pre>$1</pre>")
              // Replace bullets
              .replace(/^\*\s+(.*)/gm, "<li>$1</li>")
              .replace(/^- \s+(.*)/gm, "<li>$1</li>")
              // Convert textbreaks
              .replace(/\n/g, "<br/>")}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-slide-up"
        id="downloads-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block font-sans">
                Compilation Successful
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                Study Notes Ready to Download
              </span>
            </div>
          </div>
          <button 
            type="button" 
            id="btn-close-downloads"
            onClick={onClose} 
            className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Export Options */}
        <div className="p-6 space-y-6">
          {/* Summary stats badge */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                Active Study
              </span>
              <span className="block text-sm font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                {activeTimeFormatted}
              </span>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                Captured
              </span>
              <span className="block text-sm font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                {totalScreenshots} screens
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                AI Processed
              </span>
              <span className="block text-sm font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                {totalWords.toLocaleString()} words
              </span>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Formatted Study Guides Download Formats
            </span>

            <div className="space-y-3">
              {/* .DOCX download option - Primary */}
              <button
                type="button"
                id="btn-download-docx"
                onClick={onDownloadDocx}
                className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-xs hover:shadow-md transition duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm">Download formatted Microsoft Word (.docx)</span>
                    <span className="block text-[10px] text-blue-100 font-normal">Includes Title Page, Table of Contents, formatted tables, lists & codes</span>
                  </div>
                </div>
                <FileDown className="w-5 h-5 text-blue-100 shrink-0 ml-2" />
              </button>

              {/* Grid of secondary options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Download Markdown */}
                <button
                  type="button"
                  id="btn-download-md"
                  onClick={onDownloadMarkdown}
                  className="flex items-center gap-2 justify-center p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Download .md</span>
                </button>

                {/* Print to PDF */}
                <button
                  type="button"
                  id="btn-print-pdf"
                  onClick={handlePrintPdf}
                  className="flex items-center gap-2 justify-center p-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <Printer className="w-4 h-4 text-emerald-500" />
                  <span>Print to PDF</span>
                </button>

                {/* Copy to clipboard */}
                <button
                  type="button"
                  id="btn-copy-clipboard"
                  onClick={handleCopyClipboard}
                  className={`flex items-center gap-2 justify-center p-3 border rounded-xl text-xs font-semibold transition ${
                    copied
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-purple-500" />}
                  <span>{copied ? "Copied!" : "Copy Notes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Start New Session action footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px]">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Completed study goals are synchronized securely locally</span>
          </div>

          <button
            type="button"
            id="btn-modal-start-new-session"
            onClick={onStartNewSession}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-950 active:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
