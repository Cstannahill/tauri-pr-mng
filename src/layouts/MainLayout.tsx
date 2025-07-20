import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import ThemeToggle from '@/components/theme/theme-toggle';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <header className="border-b border-border bg-sidebar text-sidebar-foreground px-4 py-2 flex items-center justify-between flex-shrink-0">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <NavLink to="/projects" className="px-3 py-2" end>
                Projects
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <NavLink to="/analytics" className="px-3 py-2">
                Global Analytics
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <NavLink to="/timeline" className="px-3 py-2">
                Global Timeline
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <NavLink to="/kanban" className="px-3 py-2">
                Global Kanban
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <ThemeToggle />
    </header>
    <main className="flex-1 bg-background">
      <Outlet />
    </main>
  </div>
);

export default MainLayout;
