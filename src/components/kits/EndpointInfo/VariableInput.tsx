"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  variables: string[];
  placeholder?: string;
  type?: string;
  id?: string;
  className?: string;
};

export function VariableInput({ value, onChange, variables, placeholder, type, id, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1);

  const filtered = variables.filter((v) => v.toLowerCase().includes(filter.toLowerCase()));

  const checkForTrigger = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPos = input.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Find the last unmatched `{{` before cursor
    const lastOpen = textBeforeCursor.lastIndexOf("{{");
    if (lastOpen === -1) {
      setShowDropdown(false);
      return;
    }

    // Check there's no closing `}}` between the `{{` and cursor
    const textAfterOpen = textBeforeCursor.slice(lastOpen + 2);
    if (textAfterOpen.includes("}}")) {
      setShowDropdown(false);
      return;
    }

    setTriggerStart(lastOpen);
    setFilter(textAfterOpen);
    setShowDropdown(true);
    setSelectedIndex(0);
  }, [value]);

  const insertVariable = useCallback(
    (varName: string) => {
      const before = value.slice(0, triggerStart);
      const cursorPos = inputRef.current?.selectionStart ?? value.length;
      const after = value.slice(cursorPos);
      const newValue = `${before}{{${varName}}}${after}`;
      onChange(newValue);
      setShowDropdown(false);

      // Restore focus and cursor position after React re-renders
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (input) {
          input.focus();
          const pos = before.length + varName.length + 4; // {{ + name + }}
          input.setSelectionRange(pos, pos);
        }
      });
    },
    [value, triggerStart, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertVariable(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <Input
        className={className}
        id={id}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onInput={checkForTrigger}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        type={type}
        value={value}
      />
      {showDropdown && filtered.length > 0 && (
        <div
          className="absolute top-full z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          ref={dropdownRef}
        >
          {filtered.map((varName, i) => (
            <button
              className={cn(
                "flex w-full items-center rounded-sm px-2 py-1.5 text-left font-mono text-sm",
                i === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}
              key={varName}
              onMouseDown={(e) => {
                e.preventDefault();
                insertVariable(varName);
              }}
              type="button"
            >
              <span className="text-muted-foreground">{"{{"}</span>
              {varName}
              <span className="text-muted-foreground">{"}}"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
