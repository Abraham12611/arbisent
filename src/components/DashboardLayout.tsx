import { useState, useEffect } from "react";
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
  ChevronDown,
  MessageSquare,
  Trash2
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentChats();
  }, []);

  const loadRecentChats = async () => {
    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentChats(chats || []);
    } catch (error) {
      console.error('Error loading recent chats:', error);
      toast.error("Failed to load recent chats");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      // Refresh the chat list
      await loadRecentChats();
      
      // If the deleted chat was selected, clear the selection
      if (selectedChatId === chatId) {
        setSelectedChatId(undefined);
        setShowNewTrade(false);
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error("Failed to delete chat");
    } finally {
      setShowDeleteDialog(false);
      setChatToDelete(null);
    }
  };

  const handleMenuClick = (title: string, url: string) => {
    setActiveItem(title);
    onViewChange(url);
    setShowNewTrade(false);
    setSelectedChatId(undefined);
  };

  const handleNewTrade = () => {
    setShowNewTrade(true);
    setSelectedChatId(undefined);
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

  const handleChatSelect = (chatId: string) => {
    setShowNewTrade(true);
    setSelectedChatId(chatId);
    setActiveItem("");
  };

  const confirmDelete = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    setChatToDelete(chatId);
    setShowDeleteDialog(true);
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

                    <SidebarMenuItem>
                      <Collapsible open={isChatsOpen} onOpenChange={setIsChatsOpen}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <MessageSquare className="mr-2" />
                            <span>Recent Chats</span>
                            <ChevronDown 
                              className={`ml-auto h-4 w-4 transform transition-transform duration-200 ${
                                isChatsOpen ? 'rotate-180' : ''
                              }`} 
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2">
                          {recentChats.map((chat) => (
                            <div
                              key={chat.id}
                              className="group relative"
                            >
                              <SidebarMenuButton
                                onClick={() => handleChatSelect(chat.id)}
                                className="pl-9 text-sm w-full pr-8"
                              >
                                <span className="truncate">{chat.title}</span>
                                <span className="ml-auto text-xs text-gray-500">
                                  {new Date(chat.created_at).toLocaleDateString()}
                                </span>
                              </SidebarMenuButton>
                              <button
                                onClick={(e) => confirmDelete(chat.id, e)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
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
            {showNewTrade ? <TradeExecutionModal chatId={selectedChatId} /> : children}
          </main>
        </div>

        <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Your Wallets</DialogTitle>
            </DialogHeader>
            <WalletConnector onClose={() => setShowWalletDialog(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chat</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setChatToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}
