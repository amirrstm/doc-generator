"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

type Item = {
  title: string;
  type: string;
  description: string;
  required?: boolean;
  children?: { title: string; items: Item[] };
};

type Props = {
  item: Item;
  level?: number;
  isLastItem?: boolean;
};

export default function NestedProperty({ item, level = 0, isLastItem = false }: Props) {
  const hasChildren = item.children && item.children.items.length > 0;

  return (
    <div>
      <div
        className={cn("flex flex-col gap-3 border-b border-b-gray-100 py-6 last:border-b-0 dark:border-b-gray-800", {
          "!border-b py-4": level > 0,
          "!border-b-0": isLastItem
        })}
      >
        <div className="flex items-center gap-2 font-mono">
          <p className="text-brand-primary text-sm">{item.title}</p>
          <Badge variant="secondary">{item.type}</Badge>
          {item.required && <Badge variant="destructive">required</Badge>}
        </div>

        {item.description && (
          <p className="whitespace-pre-line font-en text-gray-700 text-sm dark:text-gray-300">{item.description}</p>
        )}

        {/* Accordion for nested children */}
        {hasChildren && item.children && (
          <div className="mt-2">
            <Accordion collapsible type="single">
              <AccordionItem className="rounded-md bg-gray-50 px-3 dark:bg-gray-900/50" value="children">
                <AccordionTrigger className="cursor-pointer hover:no-underline">
                  <div className="flex items-center gap-2 font-en">
                    <span>{item.children.title}</span>

                    <span className="text-gray-600 text-xs dark:text-gray-400">
                      {item.children.items.length} {item.children.items.length === 1 ? "property" : "properties"}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="">
                    {item.children.items.map((childItem, index) => (
                      <NestedProperty
                        isLastItem={item.children && index === item.children.items.length - 1}
                        item={childItem}
                        key={childItem.title}
                        level={level + 1}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}
