import {
  Bus, Coffee, Dumbbell, Film, Gift, GraduationCap, HeartPulse, Home, type LucideIcon, Package, Plane, Repeat, ShoppingBag, ShoppingCart, Zap,
} from "lucide-react";
import type { ExpenseCategory } from "@/lib/math/budget-math";

export const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: LucideIcon; color: string }> = {
  food: { label: "Food", icon: Coffee, color: "#F59E0B" },
  groceries: { label: "Groceries", icon: ShoppingCart, color: "#84CC16" },
  transport: { label: "Transport", icon: Bus, color: "#06B6D4" },
  rent: { label: "Rent", icon: Home, color: "#8B5CF6" },
  utilities: { label: "Utilities", icon: Zap, color: "#EAB308" },
  education: { label: "Education", icon: GraduationCap, color: "#6366F1" },
  health: { label: "Health", icon: HeartPulse, color: "#F43F5E" },
  fitness: { label: "Fitness", icon: Dumbbell, color: "#10B981" },
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#EC4899" },
  entertainment: { label: "Fun", icon: Film, color: "#A855F7" },
  subscriptions: { label: "Subs", icon: Repeat, color: "#14B8A6" },
  social: { label: "Social", icon: Gift, color: "#FB7185" },
  travel: { label: "Travel", icon: Plane, color: "#38BDF8" },
  other: { label: "Other", icon: Package, color: "#8a8fa3" },
};
