import React from "react";

interface BlogContentRendererProps {
  content: string;
  className?: string;
  isDarkMode?: boolean;
}

// Sanitize HTML to prevent XSS while preserving legitimate formatting tags
function sanitizeHtml(html: string): string {
  if (!html) return "";
  
  // Remove script tags and their content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove dangerous event handlers (onerror, onclick, onload, onmouseover, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  clean = clean.replace(/\son\w+\s*=\s*[^>\s]+/gi, "");
  
  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'src=""');
  
  return clean;
}

// Check if content is primarily HTML
function isHtmlContent(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  const htmlTagPattern = /<\/?(p|br|h[1-6]|strong|b|em|i|u|ul|ol|li|blockquote|a|img|div|span|table|pre|code)\b[^>]*>/i;
  return htmlTagPattern.test(trimmed);
}

// Helper to format inline markdown (bold, italic, code, links, underline)
function renderFormattedInlineText(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];

  // Match bold (**text** or __text__), italic (*text* or _text_), links [text](url), code `text`
  // We use regex tokenizer to split text into tokens
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<]+)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-t-${counter++}`;

    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      const inner = token.slice(2, -2);
      parts.push(<strong key={key} className="font-bold text-slate-900 dark:text-white">{inner}</strong>);
    } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      const inner = token.slice(1, -1);
      parts.push(<em key={key} className="italic text-slate-800 dark:text-slate-200">{inner}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const inner = token.slice(1, -1);
      parts.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-300 font-mono text-xs">
          {inner}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const closingBracket = token.indexOf("]");
      const linkText = token.substring(1, closingBracket);
      const url = token.substring(closingBracket + 2, token.length - 1);
      parts.push(
        <a 
          key={key} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-cyan-500 hover:text-cyan-400 underline decoration-cyan-500/50 hover:decoration-cyan-400 font-medium transition-colors"
        >
          {linkText}
        </a>
      );
    } else if (token.startsWith("http://") || token.startsWith("https://")) {
      parts.push(
        <a 
          key={key} 
          href={token} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-cyan-500 hover:text-cyan-400 underline decoration-cyan-500/50 hover:decoration-cyan-400 font-medium break-all transition-colors"
        >
          {token}
        </a>
      );
    } else {
      parts.push(token);
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}

export default function BlogContentRenderer({
  content,
  className = "",
  isDarkMode = true,
}: BlogContentRendererProps) {
  if (!content) {
    return <div className="text-gray-400 italic text-sm">No content provided.</div>;
  }

  // 1. If content is rich HTML, sanitize and render safely with exact whitespace preservation
  if (isHtmlContent(content)) {
    const sanitized = sanitizeHtml(content);
    return (
      <div
        className={`blog-rendered-content prose prose-slate dark:prose-invert max-w-none break-words font-sans text-base leading-relaxed ${className}`}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  // 2. Structured Line-by-Line & Block Parser that PRESERVES EXACT NEWLINES, BLANK LINES, AND LISTS
  // Split raw text by newline characters
  const rawLines = content.split("\n");
  
  const blocks: React.ReactNode[] = [];
  let currentListItems: { type: "ol" | "ul"; text: string; num?: string }[] = [];
  let listStartIndex = 0;

  const flushList = () => {
    if (currentListItems.length === 0) return;
    const isOrdered = currentListItems[0].type === "ol";
    const listKey = `list-block-${listStartIndex}`;

    if (isOrdered) {
      blocks.push(
        <ol key={listKey} className="list-decimal list-outside my-3 space-y-1.5 pl-6 text-slate-800 dark:text-slate-200">
          {currentListItems.map((item, idx) => (
            <li key={`ol-${idx}`} className="leading-relaxed pl-1">
              {renderFormattedInlineText(item.text, `ol-${listStartIndex}-${idx}`)}
            </li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={listKey} className="list-disc list-outside my-3 space-y-1.5 pl-6 text-slate-800 dark:text-slate-200">
          {currentListItems.map((item, idx) => (
            <li key={`ul-${idx}`} className="leading-relaxed pl-1">
              {renderFormattedInlineText(item.text, `ul-${listStartIndex}-${idx}`)}
            </li>
          ))}
        </ul>
      );
    }

    currentListItems = [];
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Check for Blank Line -> Preserve exact empty line spacing!
    if (trimmed === "") {
      flushList();
      blocks.push(
        <div key={`blank-${i}`} className="h-4" aria-hidden="true" />
      );
      continue;
    }

    // Check for Ordered List Item (e.g. "1. First item" or "1) First item")
    const olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      const itemText = olMatch[3];
      if (currentListItems.length === 0) listStartIndex = i;
      currentListItems.push({ type: "ol", text: itemText, num: olMatch[2] });
      continue;
    }

    // Check for Unordered List Item (e.g. "- item", "* item", "• item", "+ item")
    const ulMatch = line.match(/^(\s*)[-*•+]\s+(.*)$/);
    if (ulMatch) {
      const itemText = ulMatch[2];
      if (currentListItems.length === 0) listStartIndex = i;
      currentListItems.push({ type: "ul", text: itemText });
      continue;
    }

    // If we were collecting list items and encountered a regular line, flush the list
    flushList();

    // Check for Markdown Headings (# Heading 1, ## Heading 2, ### Heading 3, #### Heading 4)
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">
          {renderFormattedInlineText(line.substring(5), `h4-${i}`)}
        </h4>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2.5 tracking-tight font-serif">
          {renderFormattedInlineText(line.substring(4), `h3-${i}`)}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${i}`} className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight font-serif">
          {renderFormattedInlineText(line.substring(3), `h2-${i}`)}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={`h1-${i}`} className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-7 mb-4 tracking-tight font-serif">
          {renderFormattedInlineText(line.substring(2), `h1-${i}`)}
        </h1>
      );
      continue;
    }

    // Check for Blockquote (> text)
    if (line.startsWith("> ") || line.startsWith(">")) {
      const quoteText = line.startsWith("> ") ? line.substring(2) : line.substring(1);
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-amber-500/80 pl-4 py-1.5 my-2.5 bg-amber-500/5 dark:bg-amber-500/10 rounded-r-lg italic text-slate-700 dark:text-slate-300 font-serif"
        >
          {renderFormattedInlineText(quoteText, `quote-${i}`)}
        </blockquote>
      );
      continue;
    }

    // Check for All-Caps Section Heading (e.g. "IMPORTANT NOTICE", "MY FIRST BLOG", "SUMMARY")
    const isAllCapsHeading = trimmed.length >= 3 && trimmed.length <= 40 && trimmed === trimmed.toUpperCase() && /^[A-Z0-9\s:_-]+$/.test(trimmed);
    if (isAllCapsHeading) {
      blocks.push(
        <h3
          key={`caps-${i}`}
          className="text-sm md:text-base font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 mt-4 mb-1"
        >
          {trimmed}
        </h3>
      );
      continue;
    }

    // Standard text line: Render with exact line height, whitespace, and wrap
    blocks.push(
      <p
        key={`p-${i}`}
        className="leading-relaxed text-slate-800 dark:text-slate-200 my-1 break-words"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {renderFormattedInlineText(line, `p-${i}`)}
      </p>
    );
  }

  // Flush any trailing list
  flushList();

  return (
    <div
      className={`blog-rendered-content text-base font-sans leading-relaxed space-y-0.5 break-words max-w-none ${className}`}
      style={{
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      {blocks}
    </div>
  );
}
