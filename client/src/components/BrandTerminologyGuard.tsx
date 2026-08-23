import { useEffect, useRef } from "react";

const replacements: Array<[RegExp, string]> = [
  [/TAP Church/g, "RCCG, The Almighty Parish"],
  [/TAP accounts/g, "RCCG TAP accounts"],
  [/TAP account/g, "RCCG TAP account"],
  [/TAP home/g, "RCCG TAP home"],
  [/at TAP\b/g, "at RCCG TAP"],
  [/About TAP/g, "About RCCG TAP"],
  [/Find TAP/g, "Find RCCG TAP"],
];

export function normalizeBrandTerminology(value: string) {
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export default function BrandTerminologyGuard({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const normalize = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let current = walker.nextNode();
      while (current) { nodes.push(current as Text); current = walker.nextNode(); }
      nodes.forEach(node => {
        const original = node.nodeValue ?? "";
        const corrected = normalizeBrandTerminology(original);
        if (corrected !== original) node.nodeValue = corrected;
      });
    };
    normalize();
    const observer = new MutationObserver(normalize);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
