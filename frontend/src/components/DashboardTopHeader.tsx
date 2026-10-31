"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  HelpCircle,
  Bell,
  ChevronDown,
  Check,
  CheckCheck,
  CreditCard,
  GitPullRequest,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserPresenceStatus } from "@/lib/auth-types";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api-client";
import { AppNotification } from "@/lib/notifications-data";

interface DashboardTopHeaderProps {
  title?: string;
  subtitle?: string;
  roleLabel?: string;
  onSearch?: (query: string) => void;
  centerSlot?: React.ReactNode;
  onHelpClick?: () => void;
  placeholder?: string;
}

export type TeamsStatus = UserPresenceStatus;

interface StatusOption {
  id: TeamsStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
}

const TEAMS_STATUSES: StatusOption[] = [
  {
    id: "available",
    label: "Available",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200/80",
    iconBg: "bg-emerald-500",
  },
  {
    id: "busy",
    label: "Busy",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200/80",
    iconBg: "bg-rose-500",
  },
  {
    id: "away",
    label: "Appear away",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200/80",
    iconBg: "bg-amber-400",
  },
  {
    id: "offline",
    label: "Appear offline",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    iconBg: "bg-slate-400",
  },
];

export default function DashboardTopHeader({
  onSearch,
  centerSlot,
  onHelpClick,
  placeholder = "Search projects, freelancers, messages...",
}: DashboardTopHeaderProps) {
  const router = useRouter();
  const { user, presence, updatePresence } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isUpdatingPresence, setIsUpdatingPresence] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Status config according to current active presence from context
  const currentStatus = presence || user?.presenceStatus || "available";
  const activeStatusConfig =
    TEAMS_STATUSES.find((s) => s.id === currentStatus) || TEAMS_STATUSES[0];

  // Fetch notifications on mount and whenever user changes
  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications(user?.role, user?.id);
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      }
    } catch (err) {
      console.warn("Could not load notifications:", err);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Close menus when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setIsStatusMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setIsNotifMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (onSearch) onSearch(q);
  };

  const handleStatusSelect = async (statusId: TeamsStatus) => {
    setIsStatusMenuOpen(false);
    if (statusId === currentStatus) return;
    setIsUpdatingPresence(true);
    try {
      await updatePresence(statusId);
    } finally {
      setIsUpdatingPresence(false);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead(user?.role, user?.id);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      // Optimistic mark as read
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationAsRead(notif.id);
    }
    if (notif.actionUrl) {
      setIsNotifMenuOpen(false);
      router.push(notif.actionUrl);
    }
  };

  // Filtered notifications
  const filteredNotifications =
    notifTab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "DELIVERABLE":
        return {
          icon: <Layers className="w-4 h-4 text-blue-600" />,
          bg: "bg-blue-50 border-blue-100",
        };
      case "PAYMENT":
        return {
          icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
          bg: "bg-emerald-50 border-emerald-100",
        };
      case "CHANGE_REQUEST":
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-600" />,
          bg: "bg-amber-50 border-amber-100",
        };
      case "CONSENSUS":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
          bg: "bg-indigo-50 border-indigo-100",
        };
      case "MILESTONE":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,
          bg: "bg-teal-50 border-teal-100",
        };
      case "DISPUTE":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bg: "bg-rose-50 border-rose-100",
        };
      case "PROPOSAL":
        return {
          icon: <Briefcase className="w-4 h-4 text-purple-600" />,
          bg: "bg-purple-50 border-purple-100",
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          bg: "bg-slate-50 border-slate-100",
        };
    }
  };

  // Fallback display names
  const displayName =
    user?.name || (user?.role === "FREELANCER" ? "Sambit Kumar Mohanty" : "Alex Rivera");

  return (
    <header className="h-16 border-b border-slate-100 bg-white px-5 sm:px-7 flex items-center justify-between sticky top-0 z-20 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* ==============================================================
          LEFT: SEARCH BAR (Matching Reference Image)
         ============================================================== */}
      <div className="flex-1 max-w-[340px] lg:max-w-[380px] mr-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="w-full h-9.5 pl-10 pr-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 focus:bg-white text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5] transition-all"
          />
        </div>
      </div>

      {/* ==============================================================
          CENTER: OPTIONAL CENTER SLOT (Segmented Toggle for Workspace)
         ============================================================== */}
      {centerSlot && (
        <div className="flex-1 flex justify-center px-2">
          {centerSlot}
        </div>
      )}

      {/* ==============================================================
          RIGHT: ICONS, USER PROFILE & PRESENCE STATUS
         ============================================================== */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Help Center Icon Button (Opens Mode 3: How Mediation Works) */}
        <button
          type="button"
          onClick={onHelpClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="How Nexum Works (Mediation & Safety Guide)"
        >
          <HelpCircle className="w-[18px] h-[18px] stroke-[1.9]" />
        </button>

        {/* Notifications Icon Button with Dynamic Badge and Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setIsNotifMenuOpen((prev) => !prev)}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isNotifMenuOpen
                ? "bg-[#eef2ff] text-[#4f46e5]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px] stroke-[1.9]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-75 duration-200">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px] rounded-2xl border border-slate-200/90 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eef2ff] text-[#4f46e5]">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center border-b border-slate-100 px-4 pt-1 bg-white">
                <button
                  type="button"
                  onClick={() => setNotifTab("all")}
                  className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
                    notifTab === "all"
                      ? "border-[#4f46e5] text-[#4f46e5]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifTab("unread")}
                  className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
                    notifTab === "unread"
                      ? "border-[#4f46e5] text-[#4f46e5]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notification Items List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 px-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {notifTab === "unread"
                        ? "No unread notifications to review."
                        : "No notifications found."}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const iconConfig = getNotifIcon(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                          notif.read ? "bg-white hover:bg-slate-50/70" : "bg-indigo-50/20 hover:bg-indigo-50/40"
                        }`}
                      >
                        {/* Type Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconConfig.bg}`}
                        >
                          {iconConfig.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {notif.projectName && (
                            <span className="inline-block text-[10px] font-semibold text-[#4f46e5] mb-0.5 truncate max-w-[240px]">
                              {notif.projectName}
                            </span>
                          )}
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs font-semibold truncate ${
                                notif.read ? "text-slate-800" : "text-slate-900 font-bold"
                              }`}
                            >
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {notif.createdAt}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                            {notif.message}
                          </p>

                          {/* Quick action link hint */}
                          {notif.actionUrl && (
                            <div className="mt-1.5 flex items-center text-[11px] font-semibold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform gap-1">
                              <span>Open action</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Unread indicator */}
                        {!notif.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#4f46e5] shrink-0 mt-2 ring-2 ring-indigo-200"
                            title="Unread"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Nexum Bilateral Consensus Engine</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifMenuOpen(false);
                    if (user?.role === "FREELANCER") {
                      router.push("/freelancer/dashboard");
                    } else {
                      router.push("/client/workspace");
                    }
                  }}
                  className="font-semibold text-[#4f46e5] hover:underline cursor-pointer"
                >
                  View Workspace Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-100">
          <div className="relative w-9 h-9 shrink-0">
            {user?.avatar ? (
              <div className="w-full h-full rounded-full overflow-hidden border border-slate-200">
                <Image
                  src={user.avatar}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-[#4f46e5]/10 text-[#4f46e5] font-bold text-xs flex items-center justify-center border border-[#4f46e5]/20">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            {/* Status indicator dot on avatar */}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-1.5 ring-white z-10 shadow-2xs ${activeStatusConfig.iconBg}`}
              title={`Status: ${activeStatusConfig.label}`}
            />
          </div>

          <div className="hidden sm:block">
            <span className="text-[13px] font-bold text-slate-900 leading-tight">
              {displayName}
            </span>
          </div>
        </div>

        {/* Presence Selector Dropdown */}
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => setIsStatusMenuOpen((prev) => !prev)}
            disabled={isUpdatingPresence}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full border text-[11.5px] font-semibold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 ${
              activeStatusConfig.bgColor
            } ${activeStatusConfig.borderColor} ${activeStatusConfig.color} ${
              isUpdatingPresence ? "opacity-75 cursor-wait" : ""
            }`}
            title="Set presence status (persists across sessions)"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${activeStatusConfig.iconBg}`} />
            <span>{activeStatusConfig.label}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 opacity-70 ${
                isStatusMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isStatusMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                <span>Presence Status</span>
                <span className="text-[9px] text-emerald-600 font-sans normal-case">Live Sync</span>
              </div>

              {TEAMS_STATUSES.map((status) => {
                const isSelected = currentStatus === status.id;
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => handleStatusSelect(status.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#eef2ff] text-[#4f46e5]"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${status.iconBg}`} />
                      <span>{status.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#4f46e5]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
