import {
  LayoutDashboard,
  Car,
  Users,
  CalendarDays,
  LogOut,
  UserCog,
  ShoppingCart,
  ChevronDown,
  CirclePlus,
  ClipboardList,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userName, isAdmin } = useAppContext();
  const { t } = useLanguage();

  const items = [
    { title: t("Dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("Clientes"), url: "/clientes", icon: Users },
    { title: t("Veículos"), url: "/veiculos", icon: Car },
    { title: t("Agenda"), url: "/agenda", icon: CalendarDays },
    ...(isAdmin
      ? [{ title: t("Usuários"), url: "/usuarios", icon: UserCog }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-[#EB0A1E] flex items-center justify-center p-1">
          <img
            src="/toyota_logo.png"
            alt={t("Logo Toyota")}
            className="w-full h-full object-contain"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <span className="font-semibold text-foreground text-sm tracking-tight block">
              {t("ACE Vendedor")}
            </span>

            {userName && (
              <span className="text-xs text-muted-foreground truncate block">
                {userName}
              </span>
            )}
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.slice(0, 2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/80 transition-colors"
                      activeClassName="bg-primary/15 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <Collapsible
                defaultOpen={location.pathname.startsWith("/pedidos")}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={t("Pedidos")}
                      className={`hover:bg-sidebar-accent/80 ${location.pathname.startsWith("/pedidos") ? "bg-primary/15 text-primary font-medium" : ""}`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span>{t("Pedidos")}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className={collapsed ? "mt-1" : "ml-4 mt-1 border-l border-border pl-2"}>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={t("Novo pedido")}>
                          <NavLink
                            to="/pedidos/novo"
                            className="hover:bg-sidebar-accent/80"
                            activeClassName="bg-primary/15 text-primary font-medium"
                          >
                            <CirclePlus className="mr-2 h-4 w-4 shrink-0" />
                            {!collapsed && <span>{t("Novo pedido")}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={t("Meus pedidos")}>
                          <NavLink
                            to="/pedidos/meus"
                            className="hover:bg-sidebar-accent/80"
                            activeClassName="bg-primary/15 text-primary font-medium"
                          >
                            <ClipboardList className="mr-2 h-4 w-4 shrink-0" />
                            {!collapsed && <span>{t("Meus pedidos")}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {items.slice(2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/80 transition-colors"
                      activeClassName="bg-primary/15 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
              {!collapsed && <span>{t("Sair")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}