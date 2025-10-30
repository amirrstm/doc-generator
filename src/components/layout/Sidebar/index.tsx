import SidebarMenus from "./Menus";

import type { ReactElement } from "react";

export default function Sidebar(): ReactElement {
  return (
    <div className="fixed start-auto top-16 bottom-0 z-20 hidden w-[18rem] lg:block">
      <div className="hide-scrollbar absolute inset-0 z-10 overflow-auto pr-8 pb-10">
        <SidebarMenus />
      </div>
    </div>
  );
}
