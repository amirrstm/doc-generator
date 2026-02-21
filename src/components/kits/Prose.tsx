"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";

import type { ComponentPropsWithoutRef } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="absolute top-3 right-3 flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      type="button"
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
    </button>
  );
}

function Pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  let codeText = "";
  if (children && typeof children === "object" && "props" in (children as unknown as Record<string, unknown>)) {
    const child = children as unknown as { props: { children?: unknown } };
    codeText = typeof child.props.children === "string" ? child.props.children : "";
  }

  return (
    <div className="relative my-4">
      {codeText && <CopyButton text={codeText} />}
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-slate-200 text-sm leading-relaxed" dir="ltr" {...props}>
        {children}
      </pre>
    </div>
  );
}

function Code({ children, className, ...props }: ComponentPropsWithoutRef<"code">) {
  if (className) {
    return (
      <SyntaxHighlighter
        customStyle={{ background: "transparent", fontSize: "0.775rem", margin: 0, maxHeight: 350, padding: 0 }}
        language={className.replace("language-", "")}
        PreTag="div"
        showLineNumbers
        style={atomDark}
        wrapLines
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  }

  return (
    <code className="break-words rounded bg-muted px-1.5 py-0.5 font-medium text-foreground text-sm" {...props}>
      {children}
    </code>
  );
}

function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto py-4">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  );
}

function Thead(props: ComponentPropsWithoutRef<"thead">) {
  return <thead className="border-border border-b bg-muted/50" {...props} />;
}

function Th(props: ComponentPropsWithoutRef<"th">) {
  return <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide" {...props} />;
}

function Td(props: ComponentPropsWithoutRef<"td">) {
  return <td className="border-border border-b px-4 py-2.5 text-foreground" {...props} />;
}

function Tr(props: ComponentPropsWithoutRef<"tr">) {
  return <tr className="transition-colors hover:bg-muted/30" {...props} />;
}

const components = {
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="font-medium text-brand-primary underline underline-offset-4 hover:opacity-80" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="my-4 border-brand-primary/40 border-l-4 pl-4 text-muted-foreground italic" {...props} />
  ),
  code: Code,
  h1: (props: ComponentPropsWithoutRef<"h1">) => <h1 className="mb-2 font-bold text-2xl text-foreground" {...props} />,
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-10 mb-4 border-border border-b pb-2 font-semibold text-foreground text-xl" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => <h3 className="mt-8 mb-3 font-semibold text-foreground text-lg" {...props} />,
  h4: (props: ComponentPropsWithoutRef<"h4">) => <h4 className="mt-6 mb-2 font-semibold text-base text-foreground" {...props} />,
  hr: () => <hr className="my-8 border-border" />,
  li: (props: ComponentPropsWithoutRef<"li">) => <li className="leading-7" {...props} />,
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-3 ml-6 list-decimal space-y-1 text-muted-foreground" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="my-3 text-muted-foreground leading-7" {...props} />,
  pre: Pre,
  strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-foreground" {...props} />,
  table: Table,
  td: Td,
  th: Th,
  thead: Thead,
  tr: Tr,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="my-3 ml-6 list-disc space-y-1 text-muted-foreground" {...props} />
};

export function MarkdownIntro({ content }: { content: string }) {
  return (
    <Markdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </Markdown>
  );
}
