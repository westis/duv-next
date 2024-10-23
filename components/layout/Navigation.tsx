"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export const navigationItems = [
  {
    title: "Events",
    items: [
      {
        title: "Calendar",
        href: "/events/calendar",
        description: "View upcoming ultramarathon events",
        onClick: () => {
          const today = new Date();
          const oneYearLater = new Date(today);
          oneYearLater.setFullYear(today.getFullYear() + 1);
          return `/events?from=${today.toISOString().split("T")[0]}&to=${
            oneYearLater.toISOString().split("T")[0]
          }&order=asc`;
        },
      },
      {
        title: "Results",
        href: "/events/results",
        description: "Check results from past events",
        onClick: () => {
          const today = new Date();
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          return `/events?from=${oneYearAgo.toISOString().split("T")[0]}&to=${
            today.toISOString().split("T")[0]
          }&order=desc`;
        },
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

export function Navigation() {
  const router = useRouter();

  return (
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
                    href={subItem.onClick ? "#" : subItem.href}
                    onClick={(e) => {
                      if (subItem.onClick) {
                        e.preventDefault();
                        const href = subItem.onClick();
                        router.push(href);
                      }
                    }}
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
