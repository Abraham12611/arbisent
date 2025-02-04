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
  SidebarTrigger,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  LineChart, 
  History, 
  Settings, 
  Bell,
  Wallet,
  LogOut,
  UserCog,
  WalletCards,
  Plus,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WalletConnector } from "./WalletConnector";
import { TradeExecutionModal } from "./trade/TradeExecutionModal";

const menuItems = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    url: "overview"
  },
  {
    title: "Active Trades",
    icon: Wallet,
    url: "trades"
  },
  {
    title: "Analytics",
    icon: LineChart,
    url: "analytics"
  },
  {
    title: "History",
    icon: History,
    url: "history"
  },
  {
    title: "Settings",
    icon: Settings,
    url: "settings"
  },
  {
    title: "Alerts",
    icon: Bell,
    url: "alerts"
  }
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  onViewChange: (view: string) => void;
}

export function DashboardLayout({ children, onViewChange }: DashboardLayoutProps) {
  const [activeItem, setActiveItem] = useState("Overview");
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showNewTrade, setShowNewTrade] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick = (title: string, url: string) => {
    setActiveItem(title);
    onViewChange(url);
    setShowNewTrade(false);
  };

  const handleNewTrade = () => {
    setShowNewTrade(true);
    setActiveItem("");
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleProfileSettings = () => {
    handleMenuClick("Settings", "settings");
  };

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
                        onClick={() => handleMenuClick(item.title, item.url)}
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

            <div className="mt-6">
              <SidebarSeparator className="mb-6" />
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton>
                            <Plus className="mr-2" />
                            <span>Create New</span>
                            <ChevronDown className="ml-auto h-4 w-4" />
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onClick={handleNewTrade}>
                            New Trade
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            New Alert
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            New Strategy
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-arbisent-text/10 bg-black/20 px-4 backdrop-blur-lg">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Bell className="text-arbisent-text cursor-pointer hover:text-arbisent-accent transition-colors" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-arbisent-accent text-arbisent-text">
                      AS
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileSettings} className="cursor-pointer">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowWalletDialog(true)} 
                    className="cursor-pointer"
                  >
                    <WalletCards className="mr-2 h-4 w-4" />
                    <span>Connect Wallets</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <main className="p-6">
            {showNewTrade ? <TradeExecutionModal /> : children}
          </main>
        </div>
      </div>

      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Your Wallets</DialogTitle>
          </DialogHeader>
          <WalletConnector onClose={() => setShowWalletDialog(false)} />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}