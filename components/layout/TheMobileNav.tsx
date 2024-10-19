"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface MobileNavProps {
  items: {
    title: string;
    items: { title: string; href: string; onClick?: () => string }[];
  }[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pl-1 pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          {items.map((item) => (
            <div key={item.title} className="flex flex-col space-y-3 pt-6">
              <h4 className="font-semibold text-lg md:text-xl">{item.title}</h4>
              {item.items.map((subItem) => (
                <MobileLink
                  key={subItem.href}
                  href={subItem.onClick ? subItem.onClick() : subItem.href}
                  pathname={pathname}
                  setOpen={setOpen}
                  className="text-muted-foreground text-base md:text-lg"
                >
                  {subItem.title}
                </MobileLink>
              ))}
            </div>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface MobileLinkProps {
  children?: React.ReactNode;
  href: string;
  pathname: string;
  setOpen: (open: boolean) => void;
  className?: string;
}

function MobileLink({
  children,
  href,
  pathname,
  setOpen,
  className,
}: MobileLinkProps) {
  return (
    <Link
      href={href}
      className={cn(className, pathname === href && "text-foreground")}
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  );
}
