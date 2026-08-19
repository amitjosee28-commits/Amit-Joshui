import React, { useState, useRef, useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Code,
  Heading1, Heading2, Heading3, Heading4, Type,
  Link, Image as ImageIcon, Sparkles, Eraser,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Palette, Highlighter, Table, Minus, HelpCircle,
  Eye, Code2, Columns, RotateCcw, AlertTriangle, Info, CheckCircle2
} from "lucide-react";
import BlogContentRenderer from "./BlogContentRenderer";

interface RichBlogEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  lang?: "en" | "np";
}

const FONT_FAMILIES = [
  { label: "Default (System)", value: "inherit" },
  { label: "Sans-Serif (Modern)", value: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { label: "Serif (Editorial)", value: "'Playfair Display', Georgia, serif" },
  { label: "Monospace (Code)", value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: "Poppins (Clean)", value: "'Poppins', sans-serif" },
  { label: "Merriweather (Classic)", value: "'Merriweather', serif" },
  { label: "Kalimati / Nepali", value: "'Kalimati', 'Preeti', sans-serif" },
];

const FONT_SIZES = [
  { label: "12px (Small)", value: "12px" },
  { label: "14px (Compact)", value: "14px" },
  { label: "16px (Normal Body)", value: "16px" },
  { label: "18px (Lead Text)", value: "18px" },
  { label: "20px (Subheading)", value: "20px" },
  { label: "24px (H3 Heading)", value: "24px" },
  { label: "28px (H2 Heading)", value: "28px" },
  { label: "34px (H1 Display)", value: "34px" },
  { label: "42px (Hero Banner)", value: "42px" },
];

const VIBGYOR_PALETTE = [
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Green", hex: "#10b981" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Orange", hex: "#f97316" },
  { name: "Red", hex: "#ef4444" },
  { name: "White", hex: "#ffffff" },
  { name: "Slate", hex: "#94a3b8" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Pink", hex: "#ec4899" },
];

const HIGHLIGHT_PALETTE = [
  { name: "None", hex: "transparent" },
  { name: "Yellow", hex: "rgba(234, 179, 8, 0.35)" },
  { name: "Cyan", hex: "rgba(6, 182, 212, 0.35)" },
  { name: "Green", hex: "rgba(16, 185, 129, 0.35)" },
  { name: "Pink", hex: "rgba(236, 72, 153, 0.35)" },
  { name: "Orange", hex: "rgba(249, 115, 22, 0.35)" },
  { name: "Purple", hex: "rgba(168, 85, 247, 0.35)" },
];

const TEXT_EFFECTS = [
  { id: "none", label: "No Effect", style: {} },
  { id: "glow-cyan", label: "Cyan Neon Glow", style: { textShadow: "0 0 10px rgba(6,182,212,0.8), 0 0 20px rgba(6,182,212,0.4)" } },
  { id: "glow-amber", label: "Amber Warm Glow", style: { textShadow: "0 0 10px rgba(245,158,11,0.8), 0 0 20px rgba(245,158,11,0.4)" } },
  { id: "glow-purple", label: "Purple Nebula Glow", style: { textShadow: "0 0 10px rgba(168,85,247,0.8), 0 0 20px rgba(168,85,247,0.4)" } },
  { id: "drop-shadow", label: "Crisp Drop Shadow", style: { textShadow: "2px 2px 4px rgba(0,0,0,0.8)" } },
  { id: "outline", label: "Text Outline", style: { WebkitTextStroke: "1px #06b6d4", color: "transparent" } },
];

const UNDERLINE_STYLES = [
  { label: "Solid", value: "solid" },
  { label: "Double", value: "double" },
  { label: "Dotted", value: "dotted" },
  { label: "Dashed", value: "dashed" },
  { label: "Wavy", value: "wavy" },
];

export default function RichBlogEditor({
  value,
  onChange,
  placeholder = "Write or paste article paragraphs, headings, lists, quotes, and media...",
  lang = "en"
}: RichBlogEditorProps) {
  const [viewMode, setViewMode] = useState<"visual" | "markdown" | "split">("split");
  const [selectedFont, setSelectedFont] = useState("inherit");
  const [selectedSize, setSelectedSize] = useState("16px");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedHighlight, setSelectedHighlight] = useState("transparent");
  const [underlineStyle, setUnderlineStyle] = useState("solid");
  const [textEffect, setTextEffect] = useState("none");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showUnderlineDropdown, setShowUnderlineDropdown] = useState(false);
  const [showEffectsDropdown, setShowEffectsDropdown] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProp = useRef(false);

  // Sync internal visual editor HTML when value prop changes externally
  useEffect(() => {
    if (visualEditorRef.current && !isUpdatingFromProp.current) {
      if (visualEditorRef.current.innerHTML !== value) {
        visualEditorRef.current.innerHTML = value || "";
      }
    }
    isUpdatingFromProp.current = false;
  }, [value]);

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      isUpdatingFromProp.current = true;
      onChange(html);
    }
  };

  // Helper to execute commands in visual mode or wrap in markdown mode
  const executeFormat = (cmd: string, val: string = "") => {
    if (viewMode === "visual" || viewMode === "split") {
      visualEditorRef.current?.focus();
      document.execCommand(cmd, false, val);
      handleVisualInput();
    } else {
      // In raw text mode, insert formatting tags or markdown wrappers
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);

      let replacement = "";
      switch (cmd) {
        case "bold":
          replacement = `**${selected || "Bold text"}**`;
          break;
        case "italic":
          replacement = `*${selected || "Italic text"}*`;
          break;
        case "underline":
          replacement = `<u>${selected || "Underlined text"}</u>`;
          break;
        case "strikeThrough":
          replacement = `~~${selected || "Strikethrough text"}~~`;
          break;
        case "formatBlock":
          if (val === "h1") replacement = `\n# ${selected || "Heading 1"}\n`;
          else if (val === "h2") replacement = `\n## ${selected || "Heading 2"}\n`;
          else if (val === "h3") replacement = `\n### ${selected || "Heading 3"}\n`;
          else if (val === "h4") replacement = `\n#### ${selected || "Heading 4"}\n`;
          else if (val === "blockquote") replacement = `\n> ${selected || "Blockquote callout text"}\n`;
          else if (val === "pre") replacement = `\n\`\`\`\n${selected || "// Code snippet"}\n\`\`\`\n`;
          else replacement = selected;
          break;
        case "insertOrderedList":
          replacement = `\n1. ${selected || "First item"}\n2. Second item\n`;
          break;
        case "insertUnorderedList":
          replacement = `\n- ${selected || "Bullet item"}\n- Next item\n`;
          break;
        default:
          replacement = selected;
      }

      const nextVal = value.substring(0, start) + replacement + value.substring(end);
      onChange(nextVal);
    }
  };

  // Change Case function (UPPERCASE, lowercase, Title Case, Sentence case)
  const handleChangeCase = (mode: "upper" | "lower" | "title" | "sentence") => {
    if (viewMode === "markdown" || !window.getSelection()?.toString()) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      if (!selected) return;

      let transformed = selected;
      if (mode === "upper") transformed = selected.toUpperCase();
      else if (mode === "lower") transformed = selected.toLowerCase();
      else if (mode === "title") transformed = selected.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
      else if (mode === "sentence") transformed = selected.charAt(0).toUpperCase() + selected.substring(1).toLowerCase();

      const nextVal = value.substring(0, start) + transformed + value.substring(end);
      onChange(nextVal);
    } else {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const selectedText = selection.toString();
      if (!selectedText) return;

      let transformed = selectedText;
      if (mode === "upper") transformed = selectedText.toUpperCase();
      else if (mode === "lower") transformed = selectedText.toLowerCase();
      else if (mode === "title") transformed = selectedText.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
      else if (mode === "sentence") transformed = selectedText.charAt(0).toUpperCase() + selectedText.substring(1).toLowerCase();

      document.execCommand("insertText", false, transformed);
      handleVisualInput();
    }
    setShowCaseDropdown(false);
  };

  // Apply custom styling via span wrap
  const applyInlineSpanStyle = (styleObj: Record<string, string>) => {
    visualEditorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    const span = document.createElement("span");
    Object.assign(span.style, styleObj);

    if (range.collapsed) {
      span.textContent = "Styled text";
      range.insertNode(span);
    } else {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    handleVisualInput();
  };

  // Clear Formatting
  const handleClearFormatting = () => {
    if (viewMode === "visual" || viewMode === "split") {
      document.execCommand("removeFormat", false);
      document.execCommand("unlink", false);
      handleVisualInput();
    } else {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const clean = selected.replace(/[*_~`#><[\]()]/g, "").replace(/<[^>]*>/g, "");
      const nextVal = value.substring(0, start) + clean + value.substring(end);
      onChange(nextVal);
    }
  };

  // Insert Link Prompt
  const handleInsertLink = () => {
    const url = prompt("Enter destination URL (e.g. https://example.com):");
    if (url) {
      if (viewMode === "visual" || viewMode === "split") {
        document.execCommand("createLink", false, url);
        handleVisualInput();
      } else {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.substring(start, end) || "Link Text";
        const linkMd = `[${selected}](${url})`;
        onChange(value.substring(0, start) + linkMd + value.substring(end));
      }
    }
  };

  // Insert Image Prompt
  const handleInsertImage = () => {
    const url = prompt("Enter Image URL (e.g. https://images.unsplash.com/...):");
    if (url) {
      const alt = prompt("Enter Image Caption / Alt description:") || "Blog Image";
      const imgHtml = `\n<div class="my-4 text-center"><img src="${url}" alt="${alt}" class="rounded-xl max-h-96 mx-auto border border-white/10 shadow-lg" /><p class="text-xs text-gray-400 mt-1 italic">${alt}</p></div>\n`;
      if (viewMode === "visual" || viewMode === "split") {
        document.execCommand("insertHTML", false, imgHtml);
        handleVisualInput();
      } else {
        onChange(value + "\n" + imgHtml);
      }
    }
  };

  // Insert 3x3 Table
  const handleInsertTable = () => {
    const tableHtml = `
<table class="w-full my-4 border-collapse border border-white/20 text-xs text-left">
  <thead>
    <tr class="bg-white/10 text-cyan-400 font-mono">
      <th class="border border-white/20 p-2">Header 1</th>
      <th class="border border-white/20 p-2">Header 2</th>
      <th class="border border-white/20 p-2">Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-white/20 p-2">Data 1A</td>
      <td class="border border-white/20 p-2">Data 1B</td>
      <td class="border border-white/20 p-2">Data 1C</td>
    </tr>
    <tr>
      <td class="border border-white/20 p-2">Data 2A</td>
      <td class="border border-white/20 p-2">Data 2B</td>
      <td class="border border-white/20 p-2">Data 2C</td>
    </tr>
  </tbody>
</table>
`;
    if (viewMode === "visual" || viewMode === "split") {
      document.execCommand("insertHTML", false, tableHtml);
      handleVisualInput();
    } else {
      onChange(value + "\n" + tableHtml);
    }
  };

  // Insert Callout Box
  const handleInsertCallout = (type: "info" | "tip" | "warning" | "success") => {
    const callouts = {
      info: `<div class="my-3 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex gap-2.5"><span>ℹ️</span><div><strong>Note:</strong> Enter important note or background information here.</div></div>`,
      tip: `<div class="my-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex gap-2.5"><span>💡</span><div><strong>Pro Tip:</strong> Key recommendation or insider workflow here.</div></div>`,
      warning: `<div class="my-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex gap-2.5"><span>⚠️</span><div><strong>Important Warning:</strong> Crucial safety notice or requirement.</div></div>`,
      success: `<div class="my-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex gap-2.5"><span>✅</span><div><strong>Success Milestone:</strong> Outcome or completed milestone information.</div></div>`,
    };
    const html = callouts[type];
    if (viewMode === "visual" || viewMode === "split") {
      document.execCommand("insertHTML", false, html);
      handleVisualInput();
    } else {
      onChange(value + "\n" + html);
    }
  };

  // Insert Checklist item
  const handleInsertChecklist = () => {
    const checklistHtml = `<div class="my-2 space-y-1"><label class="flex items-center space-x-2 text-xs text-gray-200 cursor-pointer"><input type="checkbox" class="rounded bg-black border-white/20 text-cyan-500" /><span>Checklist action item</span></label></div>`;
    if (viewMode === "visual" || viewMode === "split") {
      document.execCommand("insertHTML", false, checklistHtml);
      handleVisualInput();
    } else {
      onChange(value + "\n- [ ] Checklist action item");
    }
  };

  return (
    <div className="border border-cyan-500/30 rounded-2xl bg-black/60 shadow-2xl overflow-hidden text-xs">
      
      {/* ================= TOP TOOLBAR SYSTEM ================= */}
      <div className="bg-black/90 border-b border-white/10 p-2.5 space-y-2 select-none backdrop-blur-md">
        
        {/* ROW 1: Typography Controls, Font Family, Font Size, Case, Color, Highlights, Clear */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-white/5">
          
          {/* Font Family Picker */}
          <select
            value={selectedFont}
            onChange={(e) => {
              const font = e.target.value;
              setSelectedFont(font);
              if (font !== "inherit") {
                applyInlineSpanStyle({ fontFamily: font });
              }
            }}
            className="bg-black/60 border border-white/15 hover:border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none font-mono"
            title="Font Family"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value} className="bg-gray-900 text-white">
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size Selector */}
          <select
            value={selectedSize}
            onChange={(e) => {
              const size = e.target.value;
              setSelectedSize(size);
              applyInlineSpanStyle({ fontSize: size });
            }}
            className="bg-black/60 border border-white/15 hover:border-cyan-500/40 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none font-mono w-28"
            title="Font Size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value} className="bg-gray-900 text-white">
                {s.label}
              </option>
            ))}
          </select>

          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          {/* Font Color VIBGYOR Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setShowUnderlineDropdown(false);
                setShowEffectsDropdown(false);
                setShowCaseDropdown(false);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-white/15 hover:border-cyan-400 bg-white/5 text-gray-300 hover:text-white"
              title="Font Color (VIBGYOR Array)"
            >
              <Palette className="h-3.5 w-3.5" style={{ color: selectedColor }} />
              <span className="text-[10px] font-mono font-bold uppercase">Color</span>
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 z-50 p-3 bg-gray-950 border border-cyan-500/40 rounded-xl shadow-2xl space-y-2 w-56 animate-in fade-in zoom-in-95">
                <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Font Color (VIBGYOR)</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {VIBGYOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c.hex);
                        applyInlineSpanStyle({ color: c.hex });
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-md border border-white/20 hover:scale-110 transition-transform shadow"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-1 border-t border-white/10">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      applyInlineSpanStyle({ color: e.target.value });
                    }}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      applyInlineSpanStyle({ color: e.target.value });
                    }}
                    className="flex-1 bg-black/60 border border-white/20 rounded px-2 py-1 text-[10px] font-mono text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
                setShowUnderlineDropdown(false);
                setShowEffectsDropdown(false);
                setShowCaseDropdown(false);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-white/15 hover:border-amber-400 bg-white/5 text-gray-300 hover:text-white"
              title="Highlight Text Color"
            >
              <Highlighter className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono font-bold uppercase">Highlight</span>
            </button>

            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-2 z-50 p-3 bg-gray-950 border border-amber-500/40 rounded-xl shadow-2xl space-y-2 w-52 animate-in fade-in zoom-in-95">
                <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block">Highlight Color</span>
                <div className="grid grid-cols-4 gap-2">
                  {HIGHLIGHT_PALETTE.map((h) => (
                    <button
                      key={h.name}
                      type="button"
                      onClick={() => {
                        setSelectedHighlight(h.hex);
                        applyInlineSpanStyle({ backgroundColor: h.hex, padding: "2px 4px", borderRadius: "4px" });
                        setShowHighlightPicker(false);
                      }}
                      className="px-2 py-1.5 rounded text-[10px] font-mono font-bold border border-white/20 text-white truncate"
                      style={{ backgroundColor: h.hex !== "transparent" ? h.hex : "rgba(255,255,255,0.05)" }}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Change Case Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCaseDropdown(!showCaseDropdown);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowUnderlineDropdown(false);
                setShowEffectsDropdown(false);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-white/15 hover:border-purple-400 bg-white/5 text-gray-300 hover:text-white"
              title="Change Case (UPPERCASE / lowercase / Title Case)"
            >
              <Type className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] font-mono font-bold uppercase">Case</span>
            </button>

            {showCaseDropdown && (
              <div className="absolute top-full left-0 mt-2 z-50 p-2 bg-gray-950 border border-purple-500/40 rounded-xl shadow-2xl space-y-1 w-44 animate-in fade-in zoom-in-95 font-mono">
                <button
                  type="button"
                  onClick={() => handleChangeCase("upper")}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-purple-500/20 text-white text-[11px]"
                >
                  UPPERCASE
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeCase("lower")}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-purple-500/20 text-white text-[11px]"
                >
                  lowercase
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeCase("title")}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-purple-500/20 text-white text-[11px]"
                >
                  Title Case
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeCase("sentence")}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-purple-500/20 text-white text-[11px]"
                >
                  Sentence case
                </button>
              </div>
            )}
          </div>

          {/* Text Effects Dropdown (Shadow, Glow, Reflection, Outline) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowEffectsDropdown(!showEffectsDropdown);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowUnderlineDropdown(false);
                setShowCaseDropdown(false);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-white/15 hover:border-cyan-400 bg-white/5 text-gray-300 hover:text-white"
              title="Text Effects (Glow, Shadows, Outlines)"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase">FX Effects</span>
            </button>

            {showEffectsDropdown && (
              <div className="absolute top-full left-0 mt-2 z-50 p-2.5 bg-gray-950 border border-cyan-500/40 rounded-xl shadow-2xl space-y-1.5 w-56 animate-in fade-in zoom-in-95">
                <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block px-2">Visual Text FX</span>
                {TEXT_EFFECTS.map((fx) => (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => {
                      setTextEffect(fx.id);
                      applyInlineSpanStyle(fx.style as Record<string, string>);
                      setShowEffectsDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-cyan-500/20 text-white text-xs font-mono flex items-center justify-between"
                  >
                    <span>{fx.label}</span>
                    {textEffect === fx.id && <CheckCircle2 className="h-3 w-3 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Formatting Button */}
          <button
            type="button"
            onClick={handleClearFormatting}
            className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/40 bg-white/5 text-gray-400 hover:text-red-400 ml-auto"
            title="Clear All Formatting & Reset Styles"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ROW 2: Formatting Styles (Bold, Italic, Underline Variants, Strike, Sub, Sup, Headings, Alignments, Lists, Inserts) */}
        <div className="flex flex-wrap items-center gap-1">
          
          {/* Bold */}
          <button
            type="button"
            onClick={() => executeFormat("bold")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300 font-bold"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => executeFormat("italic")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          {/* Underline with Style Selector */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => executeFormat("underline")}
              className="p-1.5 rounded-l-lg border-y border-l border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUnderlineDropdown(!showUnderlineDropdown);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowEffectsDropdown(false);
                setShowCaseDropdown(false);
              }}
              className="p-1.5 rounded-r-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] font-mono"
              title="Underline Style (Solid, Double, Wavy, etc.)"
            >
              ▼
            </button>

            {showUnderlineDropdown && (
              <div className="absolute top-full left-0 mt-2 z-50 p-2 bg-gray-950 border border-cyan-500/40 rounded-xl shadow-2xl space-y-1 w-36 animate-in fade-in zoom-in-95 font-mono">
                {UNDERLINE_STYLES.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => {
                      setUnderlineStyle(u.value);
                      applyInlineSpanStyle({
                        textDecoration: "underline",
                        textDecorationStyle: u.value,
                        textDecorationColor: selectedColor || "#06b6d4"
                      });
                      setShowUnderlineDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1 rounded hover:bg-cyan-500/20 text-white text-xs"
                    style={{ textDecoration: "underline", textDecorationStyle: u.value as any }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => executeFormat("strikeThrough")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          {/* Subscript */}
          <button
            type="button"
            onClick={() => executeFormat("subscript")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Subscript (H₂O)"
          >
            <SubscriptIcon className="h-3.5 w-3.5" />
          </button>

          {/* Superscript */}
          <button
            type="button"
            onClick={() => executeFormat("superscript")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Superscript (E=mc²)"
          >
            <SuperscriptIcon className="h-3.5 w-3.5" />
          </button>

          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          {/* Headings H1, H2, H3, H4 */}
          <button
            type="button"
            onClick={() => executeFormat("formatBlock", "h1")}
            className="px-2 py-1 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300 font-mono font-bold text-[10px]"
            title="Heading 1 (Main Title)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => executeFormat("formatBlock", "h2")}
            className="px-2 py-1 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300 font-mono font-bold text-[10px]"
            title="Heading 2 (Section Title)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => executeFormat("formatBlock", "h3")}
            className="px-2 py-1 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300 font-mono font-bold text-[10px]"
            title="Heading 3 (Sub-section)"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => executeFormat("formatBlock", "p")}
            className="px-2 py-1 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300 font-mono text-[10px]"
            title="Normal Paragraph"
          >
            Paragraph
          </button>

          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          {/* Alignments */}
          <button
            type="button"
            onClick={() => executeFormat("justifyLeft")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat("justifyCenter")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat("justifyRight")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Align Right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat("justifyFull")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Justify Content"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          {/* Lists & Tasks */}
          <button
            type="button"
            onClick={() => executeFormat("insertUnorderedList")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Bullet List (•)"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat("insertOrderedList")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Numbered List (1, 2, 3)"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertChecklist}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Interactive Checklist Task"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </button>

          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          {/* Inserts: Blockquote, Code Block, Link, Image, Table, Callouts */}
          <button
            type="button"
            onClick={() => executeFormat("formatBlock", "blockquote")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-amber-400 hover:bg-white/10 text-gray-300"
            title="Quote Blockout"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat("formatBlock", "pre")}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Code Block"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Insert Hyperlink"
          >
            <Link className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Insert Embedded Image"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-gray-300"
            title="Insert 3x3 Table"
          >
            <Table className="h-3.5 w-3.5" />
          </button>

          {/* Callouts helper */}
          <div className="flex items-center space-x-1 border border-white/10 rounded-lg p-0.5 bg-white/5">
            <button
              type="button"
              onClick={() => handleInsertCallout("info")}
              className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 text-[10px]"
              title="Insert Info Box"
            >
              Info
            </button>
            <button
              type="button"
              onClick={() => handleInsertCallout("tip")}
              className="p-1 rounded hover:bg-purple-500/20 text-purple-400 text-[10px]"
              title="Insert Pro Tip Box"
            >
              Tip
            </button>
            <button
              type="button"
              onClick={() => handleInsertCallout("warning")}
              className="p-1 rounded hover:bg-amber-500/20 text-amber-400 text-[10px]"
              title="Insert Warning Box"
            >
              Warn
            </button>
          </div>

          {/* View Mode Switcher (Visual WYSIWYG / Markdown / Split) */}
          <div className="ml-auto flex items-center space-x-1 bg-black/80 border border-white/15 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                viewMode === "visual" ? "bg-cyan-500 text-black shadow" : "text-gray-400 hover:text-white"
              }`}
              title="Visual WYSIWYG Editor"
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                viewMode === "split" ? "bg-cyan-500 text-black shadow" : "text-gray-400 hover:text-white"
              }`}
              title="Split View (Editor + Live Formatted Preview)"
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode("markdown")}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                viewMode === "markdown" ? "bg-cyan-500 text-black shadow" : "text-gray-400 hover:text-white"
              }`}
              title="Source / Markdown Mode"
            >
              Raw
            </button>
          </div>

        </div>

      </div>

      {/* ================= EDITING BODY CANVAS ================= */}
      <div className={`grid ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10" : "grid-cols-1"} min-h-[320px]`}>
        
        {/* Left Side: Visual or Textarea input */}
        <div className="relative p-4 flex flex-col">
          {viewMode === "visual" ? (
            <div
              ref={visualEditorRef}
              contentEditable
              onInput={handleVisualInput}
              className="flex-1 min-h-[280px] max-h-[500px] overflow-y-auto focus:outline-none text-gray-100 font-sans text-sm leading-relaxed prose prose-invert max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600"
              data-placeholder={placeholder}
              style={{
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={12}
              className="flex-1 w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-100 font-mono text-xs leading-relaxed resize-y placeholder-gray-600"
            />
          )}

          {/* Quick status footer */}
          <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>
              Characters: <span className="text-cyan-400 font-bold">{value.length}</span> &bull; Words: <span className="text-cyan-400 font-bold">{value.trim() ? value.trim().split(/\s+/).length : 0}</span>
            </span>
            <span className="text-gray-400">
              Language payload: <strong className="uppercase text-white">{lang}</strong>
            </span>
          </div>
        </div>

        {/* Right Side (in Split mode) or Preview: Live exact formatting viewer */}
        {viewMode === "split" && (
          <div className="p-4 bg-black/40 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>Live Exact Client Preview</span>
              </span>
              <span className="text-[9px] font-mono text-gray-500">
                Preserves exact line breaks, headings, colors & effects
              </span>
            </div>

            <div className="flex-1 max-h-[500px] overflow-y-auto pr-2">
              <BlogContentRenderer content={value} />
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
