"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";

interface MathRendererProps {
  html: string;
  className?: string;
}

export function MathRenderer({ html, className = "" }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Render LaTeX delimiters inside container ($...$ and $$...$$)
    const el = containerRef.current;
    
    // Process math expressions in text nodes
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const text = node.nodeValue;
        if (text.includes("$")) {
          // Replace $$...$$ and $...$
          const parts: (Node | string)[] = [];
          let lastIndex = 0;
          const mathRegex = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;
          let match: RegExpExecArray | null;

          while ((match = mathRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
              parts.push(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            const isDisplay = !!match[1];
            const math = match[1] || match[2];
            const span = document.createElement("span");
            span.dir = "ltr";
            try {
              span.innerHTML = katex.renderToString(math, {
                displayMode: isDisplay,
                throwOnError: false,
              });
            } catch (err) {
              span.textContent = match[0];
            }
            parts.push(span);
            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < text.length) {
            parts.push(document.createTextNode(text.substring(lastIndex)));
          }

          if (parts.length > 0) {
            const parent = node.parentNode;
            if (parent) {
              const fragment = document.createDocumentFragment();
              parts.forEach((p) => {
                if (typeof p === "string") fragment.appendChild(document.createTextNode(p));
                else fragment.appendChild(p);
              });
              parent.replaceChild(fragment, node);
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as HTMLElement;
        const tag = elem.tagName.toLowerCase();
        if (tag !== "pre" && tag !== "code" && tag !== "script" && tag !== "style") {
          Array.from(node.childNodes).forEach(walkTextNodes);
        }
      }
    };

    walkTextNodes(el);
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`prose dark:prose-invert max-w-none text-foreground leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
