import React from "react";
import {
  Home,
  Car,
  DollarSign,
  CalendarDays,
  User,
  ShoppingBag,
  LogOut,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";

import toyotaicon from "@/assets/toyotaicon.png";



import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Veículo", url: "/veiculo", icon: Car },
  { title: "Financiamento", url: "/financiamento", icon: DollarSign },
  { title: "Agendamento", url: "/agendamento", icon: CalendarDays },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "Perfil", url: "/perfil", icon: User },
  
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 flex items-center gap-2 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-red flex items-center justify-center p-1 shrink-0">
          <img
            src={toyotaicon}
            alt="Toyota Logo"
            className="w-full h-full object-contain rounded-md"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <span className="font-semibold text-foreground text-sm tracking-tight block">
              ACE Cliente
            </span>
            
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`hover:bg-sidebar-accent/80 transition-colors ${
                          active ? "bg-primary/15 text-primary font-medium" : ""
                        }`}
                        activeClassName="bg-primary/15 text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="hover:bg-sidebar-accent/80 text-muted-foreground cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;