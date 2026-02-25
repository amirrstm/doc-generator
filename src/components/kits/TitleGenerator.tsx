import Markdown from "react-markdown";

type Props = {
  title?: string;
  description?: string;
  subTitle: string;
};

export default function TitleGenerator({ title, description, subTitle }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">{title && <p className="font-medium text-brand-primary text-sm">{title}</p>}</div>
      <h1 className="font-bold text-2xl">{subTitle}</h1>
      {description && (
        <div className="prose prose-sm max-w-none text-gray-500 leading-7 dark:prose-invert dark:text-gray-400">
          <Markdown>{description}</Markdown>
        </div>
      )}
    </div>
  );
}
