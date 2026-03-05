import React from "react";

/** Regex для виявлення емодзі (Unicode Extended_Pictographic) */
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

interface EmojiTextProps {
  children: string;
  className?: string;
}

/**
 * Рендерить текст з «живими» емодзі — кожне емодзі отримує CSS-анімацію
 */
export function EmojiText({ children, className = "" }: EmojiTextProps) {
  if (typeof children !== "string" || !children) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  try {
    const regex = new RegExp(EMOJI_REGEX.source, "gu");
    while ((match = regex.exec(children)) !== null) {
      if (match.index > lastIndex) {
        parts.push(children.slice(lastIndex, match.index));
      }
      parts.push(
        <span key={`emoji-${match.index}`} className="inline-block chat-emoji">
          {match[0]}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < children.length) {
      parts.push(children.slice(lastIndex));
    }
  } catch {
    return <span className={className}>{children}</span>;
  }

  return <span className={className}>{parts.length ? parts : children}</span>;
}
