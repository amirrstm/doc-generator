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
      {description && <p className="text-gray-500 leading-7 dark:text-gray-400">{description}</p>}
    </div>
  );
}
