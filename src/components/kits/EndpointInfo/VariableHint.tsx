import { extractVariableNames, hasVariableReferences } from "@/utils/envVars";

type Props = {
  value: string;
  varsMap: Record<string, string>;
};

export function VariableHint({ value, varsMap }: Props) {
  if (!value || !hasVariableReferences(value)) return null;

  const names = extractVariableNames(value);
  const resolved = names.filter((n) => n in varsMap);
  const undefined_ = names.filter((n) => !(n in varsMap));

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 text-xs">
      {resolved.length > 0 && <span className="text-green-600 dark:text-green-400">Resolved: {resolved.join(", ")}</span>}
      {undefined_.length > 0 && <span className="text-orange-600 dark:text-orange-400">Undefined: {undefined_.join(", ")}</span>}
    </div>
  );
}
