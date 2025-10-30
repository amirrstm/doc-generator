import { useParams } from "next/navigation";

import SidebarSingleMenu from "./Single";

import type { ReactElement } from "react";

type Props = {
  title: string;
  slug: string;
  items: { id: string; title: string; slug: string; type: { name: string } }[];
};

export default function SidebarGroup({ title, slug, items }: Props): ReactElement {
  const { documentSlug } = useParams();

  return (
    <div className="mt-8">
      <h5 className="mb-3 ps-4 font-extrabold text-gray-900 lg:mb-2 dark:text-gray-200">{title}</h5>
      <ul>
        {items.map((item) => (
          <li className="relative scroll-m-4 first:scroll-m-20" id={item.id.toString()} key={item.id}>
            <SidebarSingleMenu
              href={`/api/${slug}/${item.slug}`}
              isActive={item.slug === String(documentSlug)}
              title={item.title}
              type={item.type.name === "DELETE" ? "del" : item.type.name.toLocaleLowerCase()}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
