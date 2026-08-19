// src/components/DebugPanel.tsx
"use client";
import { useEffect, useRef, useState, MouseEvent } from "react";
import { debugLogger, LogEntry } from "@/lib/debug";
import { X, ChevronDown, Trash2, Download } from "lucide-react";

// Simple utility to download text as file
const downloadTxt = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function DebugPanel() {
  // Visibility controls
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Position for dragging (default bottom‑right)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -20, y: -20 }); // offset from right/bottom
  const draggingRef = useRef<boolean>(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number } | null>(null);

  // Logs state (client‑only)
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    if (typeof window === "undefined") return [];
    return debugLogger.getLogs();
  });
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<{ [k in LogEntry["level"]]: boolean }>({ INFO: true, WARN: true, ERROR: true, DEBUG: true });

  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to logger
  useEffect(() => {
    const unsub = debugLogger.subscribe((log) => {
      setLogs((prev) => {
        const newArr = [...prev, log];
        if (newArr.length > 500) newArr.shift();
        return newArr;
      });
    });
    return unsub;
  }, []);

  // Auto‑scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Keyboard shortcuts (development only)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      switch (e.key.toUpperCase()) {
        case "D":
          setIsOpen((v) => !v);
          break;
        case "C":
          setLogs([]);
          break;
        case "E":
          const txt = logs.map((l) => `[${l.timestamp}] [${l.level}] [${l.source}] — ${l.message}`).join("\n");
          downloadTxt(`debug-${Date.now()}.txt`, txt);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logs]);

  // Drag handlers
  const onMouseDown = (e: MouseEvent) => {
    draggingRef.current = true;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, offsetX: rect.left, offsetY: rect.top };
    e.stopPropagation();
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    setPos({ x: dragStart.current.offsetX + dx, y: dragStart.current.offsetY + dy });
  };
  const onMouseUp = () => {
    draggingRef.current = false;
    dragStart.current = null;
  };

  // Filtered logs
  const displayed = logs.filter((log) => {
    const levelOk = levelFilter[log.level];
    const textOk = log.message.toLowerCase().includes(filter.toLowerCase()) || log.source.toLowerCase().includes(filter.toLowerCase());
    return levelOk && textOk;
  });

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 bg-gray-800/80 text-white p-2 rounded-full shadow-lg"
        onClick={() => setIsMinimized(false)}
        title="Open Debug Panel (Ctrl+Shift+D)"
      >
        🐞
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-[500px] h-[600px] bg-gray-900/85 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-lg z-50 flex flex-col pointer-events-auto"
      style={{ left: pos.x, top: pos.y }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 cursor-move bg-gray-800/70 text-gray-200 rounded-t-lg"
        onMouseDown={onMouseDown}
      >
        <span className="font-mono text-sm">Debug Panel</span>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(true)} title="Minimize (Ctrl+Shift+M)" className="text-gray-300 hover:text-white">
            <ChevronDown size={16} />
          </button>
          <button onClick={() => setLogs([])} title="Clear (Ctrl+Shift+C)" className="text-gray-300 hover:text-white">
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => {
              const txt = logs.map((l) => `[${l.timestamp}] [${l.level}] [${l.source}] — ${l.message}`).join('\n');
              downloadTxt(`debug-${Date.now()}.txt`, txt);
            }}
            title="Export (Ctrl+Shift+E)"
            className="text-gray-300 hover:text-white"
          >
            <Download size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} title="Close" className="text-gray-300 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
      {/* Controls */}
      <div className="p-2 flex flex-col gap-2 bg-gray-800/60 text-gray-200">
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-2 py-1 rounded bg-gray-700 text-gray-100 text-sm focus:outline-none"
        />
        <div className="flex gap-2 text-xs">
          {(['INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((lvl) => (
            <label key={lvl} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={levelFilter[lvl]}
                onChange={() => setLevelFilter((prev) => ({ ...prev, [lvl]: !prev[lvl] }))}
              />
              <span className={lvl === 'ERROR' ? 'text-red-400' : lvl === 'WARN' ? 'text-yellow-300' : lvl === 'DEBUG' ? 'text-blue-300' : 'text-gray-300'}>
                {lvl}
              </span>
            </label>
          ))}
        </div>
      </div>
      {/* Log list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
        {displayed.map((log) => (
          <div key={log.id} className={log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-300' : log.level === 'DEBUG' ? 'text-blue-300' : 'text-gray-300'}>
            [{log.timestamp}] [{log.level}] [{log.source}] — {log.message}
          </div>
        ))}
        {displayed.length === 0 && <div className="text-gray-500">No logs match the filter.</div>}
      </div>
    </div>
  );
}
