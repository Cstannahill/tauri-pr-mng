import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import ThemeToggle from '@/components/theme/theme-toggle';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <header className="border-b border-border bg-sidebar text-sidebar-foreground px-4 py-2 flex items-center justify-between">
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
                Analytics
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <NavLink to="/timeline" className="px-3 py-2">
                Timeline
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <NavLink to="/kanban" className="px-3 py-2">
                Kanban
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
