"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

type TabItem = {
  name: string;
  code: string;
  language?: string;
  copyCode?: string;
};

type BaseCodeBlockProps = { language?: string };
type SingleCodeBlockProps = BaseCodeBlockProps & { code: string; tabs?: never };
type TabsCodeBlockProps = BaseCodeBlockProps & { code?: never; tabs: Array<TabItem> };

type CodeBlockProps = SingleCodeBlockProps | TabsCodeBlockProps;

export const CodeBlock = ({ language, code, tabs }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabsExist = tabs && tabs.length > 0;

  const copyToClipboard = async () => {
    const textToCopy = tabsExist ? tabs[activeTab].copyCode || tabs[activeTab].code : code;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeCode = tabsExist ? tabs[activeTab].code : code;
  const activeLanguage = tabsExist ? tabs[activeTab].language || language : language;

  return (
    <div className="relative flex-1 overflow-hidden rounded-lg bg-slate-900 p-4 font-mono text-sm" dir="ltr">
      <div className="mb-4 flex flex-col gap-2">
        {tabsExist && (
          <div className="flex overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                className={`!py-2 px-3 font-sans text-xs transition-colors ${
                  activeTab === index ? "text-brand-primary" : "text-zinc-400 hover:text-zinc-200"
                }`}
                key={index}
                onClick={() => setActiveTab(index)}
                type="button"
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}

        <div className="absolute top-4 right-3 flex items-center justify-between py-2">
          <button
            className="flex items-center gap-1 font-sans text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            onClick={copyToClipboard}
            type="button"
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        customStyle={{ background: "transparent", fontSize: "0.775rem", margin: 0, maxHeight: 350, padding: 0 }}
        language={activeLanguage}
        PreTag="div"
        showLineNumbers
        style={atomDark}
        wrapLines
      >
        {String(activeCode)}
      </SyntaxHighlighter>
    </div>
  );
};
