"use client";

import React, { useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { MobileNav } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium mb-1 md:text-base lg:text-lg">
            {title}
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground group-hover:text-accent-foreground md:text-sm">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

const navigationItems = [
  {
    title: "Events",
    items: [
      {
        title: "Calendar",
        href: "/events?year=futur",
        description: "View upcoming ultramarathon events",
      },
      {
        title: "Results",
        href: "/events?year=past1",
        description: "Check results from past events",
      },
      {
        title: "Championships",
        href: "/championships",
        description: "Explore major championship events",
      },
    ],
  },
  {
    title: "Statistics",
    items: [
      {
        title: "Toplists",
        href: "/toplists",
        description: "View rankings for various distances and categories",
      },
      {
        title: "Records",
        href: "/records",
        description: "Explore world and national records in ultrarunning",
      },
      {
        title: "Country Stats",
        href: "/countrystats",
        description: "Analyze ultrarunning statistics by country",
      },
    ],
  },
  {
    title: "About",
    items: [
      {
        title: "About DUV",
        href: "/about",
        description: "Learn about DUV and our mission",
      },
      {
        title: "What's New",
        href: "/whatsnew",
        description: "Check out the latest updates and features",
      },
      {
        title: "FAQ",
        href: "/faq",
        description: "Find answers to frequently asked questions",
      },
      {
        title: "Credits",
        href: "/credits",
        description: "See who contributes to DUV",
      },
      {
        title: "Contact",
        href: "/contact",
        description: "Get in touch with us",
      },
    ],
  },
];

const TheNavbar = memo(function TheNavbar() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between py-2 md:py-4">
        <Link href="/" className="flex items-center">
          <div className="relative w-[100px] h-[40px] md:w-[120px] md:h-[48px]">
            <Image
              src="/duv_logo_with_name.png"
              alt="DUV Logo Light"
              fill
              className="logo-light object-contain"
            />
            <Image
              src="/duv_logo_with_name_white.png"
              alt="DUV Logo Dark"
              fill
              className="logo-dark object-contain"
            />
          </div>
        </Link>

        <div className="hidden lg:block">
          <NavigationMenu>
            <NavigationMenuList className="space-x-1 md:space-x-2">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className="text-sm font-medium md:text-base lg:text-lg">
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-2 p-2 md:w-[400px] md:gap-3 md:p-4 lg:w-[500px] lg:grid-cols-2">
                      {item.items.map((subItem) => (
                        <ListItem
                          key={subItem.href}
                          title={subItem.title}
                          href={subItem.href}
                        >
                          {subItem.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative">
            <Button
              variant="outline"
              className="w-64 sm:w:72 md:w-80 justify-start text-left font-normal text-sm md:text-base text-muted-foreground group"
              onClick={() => setOpen(true)}
              aria-label="Open search"
            >
              <span className="">Search runner, event or club...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex group-hover:bg-accent">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-base md:text-lg"
          >
            <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <MobileNav items={navigationItems} />
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Results</CommandItem>
            <CommandItem>Toplists</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </nav>
  );
});

TheNavbar.displayName = "TheNavbar";

export { TheNavbar };
