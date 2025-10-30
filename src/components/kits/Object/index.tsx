import NestedProperty from "./NestedProperty";

type Item = {
  title: string;
  type: string;
  description: string;
  required?: boolean;
  children?: { title: string; items: Item[] };
};

type Props = { title: string; subtitle?: string; data?: Item[] };

export default function ContentObject({ title, subtitle, data }: Props) {
  return (
    <div dir="ltr">
      <div className="flex w-full items-baseline justify-between border-gray-100 border-b pb-2.5 font-en dark:border-gray-800">
        <h4 className="flex-1 font-bold text-lg">{title}</h4>

        {subtitle && <p className="font-mono text-gray-500 text-xs">{subtitle}</p>}
      </div>

      {data?.map((item) => (
        <NestedProperty item={item} key={item.title} />
      ))}
    </div>
  );
}
