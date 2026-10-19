"use client";

import React from "react";
// import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group nav-link",
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

export const navigationItems = [
  {
    title: "Events",
    items: [
      {
        title: "Calendar",
        href: "/events",
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
        href: "/countries",
        description: "National records and best performances by age class",
      },
      {
        title: "Country Stats",
        href: "/countries?view=abroad",
        description: "Top rankings of each country's runners abroad",
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

export function Navigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="space-x-1 md:space-x-2">
        {navigationItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            <NavigationMenuTrigger className="text-sm font-medium md:text-base lg:text-lg nav-link">
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
  );
}
