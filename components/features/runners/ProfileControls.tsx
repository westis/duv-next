"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_TABS, type ProfileTab } from "./format";

function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(name);
    else params.set(name, value);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return { setParam, isPending };
}

/** Toggles `?label=1`, which the server page passes to the API. */
export function IauLabelToggle({ checked }: { checked: boolean }) {
  const { setParam, isPending } = useSetParam();
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="iau-label"
        checked={checked}
        disabled={isPending}
        onCheckedChange={(on) => setParam("label", on ? "1" : null)}
      />
      <Label htmlFor="iau-label">IAU-labelled races only</Label>
    </div>
  );
}

/** Tabs whose selection lives in `?tab=` so links and the label toggle keep it. */
export function ProfileTabs({
  tab,
  labels,
  panels,
}: {
  tab: ProfileTab;
  labels: Record<ProfileTab, string>;
  panels: Record<ProfileTab, React.ReactNode>;
}) {
  const { setParam } = useSetParam();
  return (
    <Tabs
      defaultValue={tab}
      onValueChange={(value) =>
        setParam("tab", value === "performances" ? null : value)
      }
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        {PROFILE_TABS.map((t) => (
          <TabsTrigger key={t} value={t} className="px-1 text-xs sm:text-sm whitespace-normal">
            {labels[t]}
          </TabsTrigger>
        ))}
      </TabsList>
      {PROFILE_TABS.map((t) => (
        <TabsContent key={t} value={t} className="mt-4">
          {panels[t]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
