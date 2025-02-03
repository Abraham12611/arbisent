import { useState } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  LineChart, 
  History, 
  Settings, 
  Bell,
  Wallet
} from "lucide-react";

const menuItems = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    url: "#overview"
  },
  {
    title: "Active Trades",
    icon: Wallet,
    url: "#trades"
  },
  {
    title: "Analytics",
    icon: LineChart,
    url: "#analytics"
  },
  {
    title: "History",
    icon: History,
    url: "#history"
  },
  {
    title: "Settings",
    icon: Settings,
    url: "#settings"
  },
  {
    title: "Alerts",
    icon: Bell,
    url: "#alerts"
  }
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState("Overview");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-black to-arbisent-primary/20">
        <Sidebar>
          <SidebarHeader className="p-4">
            <span className="text-2xl font-bold text-arbisent-text">ArbiSent</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => setActiveItem(item.title)}
                        data-active={activeItem === item.title}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-arbisent-text/10 bg-black/20 px-4 backdrop-blur-lg">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Bell className="text-arbisent-text" />
              <div className="h-8 w-8 rounded-full bg-arbisent-accent" />
            </div>
          </div>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}