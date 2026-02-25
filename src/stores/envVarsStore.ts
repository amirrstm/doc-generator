import { create } from "zustand";
import { persist } from "zustand/middleware";

type EnvVar = { key: string; value: string };

type EnvVarsState = {
  projectVars: Record<string, EnvVar[]>;
  isOpen: boolean;
};

type EnvVarsActions = {
  setIsOpen: (open: boolean) => void;
  getVars: (slug: string) => EnvVar[];
  addVar: (slug: string, envVar: EnvVar) => void;
  updateVar: (slug: string, index: number, envVar: EnvVar) => void;
  removeVar: (slug: string, index: number) => void;
  getVarsMap: (slug: string) => Record<string, string>;
};

export const useEnvVarsStore = create<EnvVarsState & EnvVarsActions>()(
  persist(
    (set, get) => ({
      addVar: (slug, envVar) =>
        set((state) => ({
          projectVars: {
            ...state.projectVars,
            [slug]: [...(state.projectVars[slug] ?? []), envVar]
          }
        })),

      getVars: (slug) => get().projectVars[slug] ?? [],

      getVarsMap: (slug) => {
        const vars = get().projectVars[slug] ?? [];
        const map: Record<string, string> = {};
        for (const v of vars) {
          if (v.key) map[v.key] = v.value;
        }
        return map;
      },
      isOpen: false,
      projectVars: {},

      removeVar: (slug, index) =>
        set((state) => {
          const vars = (state.projectVars[slug] ?? []).filter((_, i) => i !== index);
          return { projectVars: { ...state.projectVars, [slug]: vars } };
        }),

      setIsOpen: (open) => set({ isOpen: open }),

      updateVar: (slug, index, envVar) =>
        set((state) => {
          const vars = [...(state.projectVars[slug] ?? [])];
          vars[index] = envVar;
          return { projectVars: { ...state.projectVars, [slug]: vars } };
        })
    }),
    {
      name: "env-vars-storage",
      partialize: (state) => ({ projectVars: state.projectVars })
    }
  )
);
