import {
  BadgeCheck, Bell, ListTree, BookA, BookOpen, Box, CalendarClock, ClipboardCheck, Flag, Lightbulb, Map, Package, Plug, Route, UserCheck, Wrench, CalendarDays, ChartColumn, CircleCheck, ClipboardList, FlaskConical, Gauge,
  GraduationCap, Handshake, IdCard, Link2, MessageSquare, Network, Rocket, School, ScrollText, Send, Shield,
  SlidersHorizontal, Palette, Star, Target, TriangleAlert, Upload, Users, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  gauge: Gauge, alert: TriangleAlert, school: School, bars: ChartColumn, target: Target, send: Send,
  flask: FlaskConical, clipboard: ClipboardList, graduation: GraduationCap, badge: BadgeCheck, calendar: CalendarDays,
  check: CircleCheck, network: Network, users: Users, shield: Shield, sliders: SlidersHorizontal, scroll: ScrollText,
  id: IdCard, link: Link2, box: Box, upload: Upload, handshake: Handshake, book: BookOpen, star: Star, rocket: Rocket,
  message: MessageSquare, route: Route, map: Map, "book-a": BookA, "clipboard-check": ClipboardCheck, package: Package,
  wrench: Wrench, "user-check": UserCheck, plug: Plug, bell: Bell, lightbulb: Lightbulb, flag: Flag, "calendar-clock": CalendarClock, list: ListTree, palette: Palette,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Gauge;
  return <Icon className={className} aria-hidden />;
}
