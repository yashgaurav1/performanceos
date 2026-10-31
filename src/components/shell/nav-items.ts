import { BookOpen, Bot, Dumbbell, LayoutDashboard, Target, UtensilsCrossed, Wallet } from "lucide-react";

export const PRIMARY_NAV = [
  { href: "/today", label: "Today", icon: LayoutDashboard },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/eat", label: "Eat", icon: UtensilsCrossed },
  { href: "/coach", label: "Coach", icon: Bot },
] as const;

export const SECONDARY_NAV = [
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
] as const;

export const ALL_NAV = [PRIMARY_NAV[0], SECONDARY_NAV[0], PRIMARY_NAV[1], PRIMARY_NAV[2], SECONDARY_NAV[1], SECONDARY_NAV[2], PRIMARY_NAV[3]] as const;
