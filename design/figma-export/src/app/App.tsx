import { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutDashboard, Users, Calendar, FileText, TestTube, CreditCard, Activity,
  Bell, MessageSquare, Settings, LogOut, Search, Filter, Plus, ChevronDown,
  ChevronRight, MoreVertical, Eye, Pencil, Trash2, Download, Upload, Clock,
  CheckCircle, XCircle, AlertCircle, Star, Phone, Mail, MapPin, Stethoscope,
  Pill, Heart, TrendingUp, TrendingDown, DollarSign, Shield, ClipboardList,
  User, Building2, Menu, X, ArrowRight, ArrowUpRight, RefreshCw, Lock,
  Printer, Send, MoreHorizontal, ChevronUp, Info, UserCheck, UserPlus,
  CalendarPlus, Thermometer, Weight, AlertTriangle, LayoutList, LayoutGrid,
  Layers, Flag, Hash, AtSign, BookOpen, Camera, Paperclip, Zap, Award,
  ChevronLeft, FileCheck, Target, CheckSquare, Wind, Monitor,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = "admin" | "doctor" | "patient" | "receptionist";
type View =
  | "login" | "admin-dashboard" | "doctor-dashboard" | "patient-dashboard"
  | "receptionist-dashboard" | "patient-list" | "patient-profile"
  | "doctor-list" | "doctor-profile" | "appointments" | "prescriptions"
  | "lab-reports" | "billing" | "vitals" | "notifications" | "messaging"
  | "user-management" | "audit-logs" | "profile-settings";

interface NavProps { navigate: (v: View, p?: any) => void; role: Role; }

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const apptTrendData = [
  { day: "Mon", appointments: 42, completed: 38 },
  { day: "Tue", appointments: 58, completed: 51 },
  { day: "Wed", appointments: 45, completed: 43 },
  { day: "Thu", appointments: 71, completed: 65 },
  { day: "Fri", appointments: 63, completed: 59 },
  { day: "Sat", appointments: 34, completed: 31 },
  { day: "Sun", appointments: 18, completed: 16 },
];

const revenueData = [
  { month: "Jan", revenue: 128400 },
  { month: "Feb", revenue: 142800 },
  { month: "Mar", revenue: 156200 },
  { month: "Apr", revenue: 149600 },
  { month: "May", revenue: 171300 },
  { month: "Jun", revenue: 183700 },
];

const apptStatusData = [
  { name: "Completed", value: 312, color: "#10B981" },
  { name: "Confirmed", value: 87, color: "#3B82F6" },
  { name: "Pending", value: 43, color: "#F59E0B" },
  { name: "Cancelled", value: 24, color: "#EF4444" },
];

const bpData = [
  { date: "Jun 1", systolic: 128, diastolic: 82 },
  { date: "Jun 5", systolic: 132, diastolic: 85 },
  { date: "Jun 10", systolic: 124, diastolic: 79 },
  { date: "Jun 15", systolic: 119, diastolic: 76 },
  { date: "Jun 20", systolic: 122, diastolic: 80 },
  { date: "Jun 22", systolic: 118, diastolic: 75 },
];

const weeklyPatientData = [
  { day: "Mon", patients: 8 },
  { day: "Tue", patients: 12 },
  { day: "Wed", patients: 9 },
  { day: "Thu", patients: 15 },
  { day: "Fri", patients: 11 },
];

const PATIENTS = [
  { id: "P001", name: "Margaret Sullivan", age: 54, gender: "F", phone: "+1 (555) 234-5678", email: "msullivan@email.com", blood: "A+", lastVisit: "Jun 20, 2026", status: "active", doctor: "Dr. Sarah Chen", condition: "Hypertension, Type 2 Diabetes", city: "Boston, MA" },
  { id: "P002", name: "Robert Harrington", age: 38, gender: "M", phone: "+1 (555) 345-6789", email: "rharrington@email.com", blood: "O+", lastVisit: "Jun 19, 2026", status: "active", doctor: "Dr. James Okonkwo", condition: "Asthma", city: "Cambridge, MA" },
  { id: "P003", name: "Elena Vasquez", age: 29, gender: "F", phone: "+1 (555) 456-7890", email: "evasquez@email.com", blood: "B-", lastVisit: "Jun 18, 2026", status: "active", doctor: "Dr. Sarah Chen", condition: "Migraine", city: "Somerville, MA" },
  { id: "P004", name: "Thomas Blackwood", age: 67, gender: "M", phone: "+1 (555) 567-8901", email: "tblackwood@email.com", blood: "AB+", lastVisit: "Jun 15, 2026", status: "inactive", doctor: "Dr. Priya Sharma", condition: "CAD, Arthritis", city: "Newton, MA" },
  { id: "P005", name: "Yuki Tanaka", age: 42, gender: "F", phone: "+1 (555) 678-9012", email: "ytanaka@email.com", blood: "O-", lastVisit: "Jun 14, 2026", status: "active", doctor: "Dr. James Okonkwo", condition: "Hypothyroidism", city: "Brookline, MA" },
  { id: "P006", name: "Marcus Johnson", age: 31, gender: "M", phone: "+1 (555) 789-0123", email: "mjohnson@email.com", blood: "A-", lastVisit: "Jun 12, 2026", status: "active", doctor: "Dr. Priya Sharma", condition: "Anxiety, GERD", city: "Quincy, MA" },
];

const DOCTORS = [
  { id: "D001", name: "Dr. Sarah Chen", specialty: "Cardiology", patients: 234, rating: 4.9, reviews: 128, status: "available", phone: "+1 (555) 111-2222", email: "schen@hapm.hospital", experience: "12 years", education: "Harvard Medical School", dept: "Cardiology" },
  { id: "D002", name: "Dr. James Okonkwo", specialty: "General Medicine", patients: 412, rating: 4.7, reviews: 203, status: "available", phone: "+1 (555) 222-3333", email: "jokonkwo@hapm.hospital", experience: "8 years", education: "Johns Hopkins", dept: "Internal Medicine" },
  { id: "D003", name: "Dr. Priya Sharma", specialty: "Endocrinology", patients: 187, rating: 4.8, reviews: 97, status: "on-leave", phone: "+1 (555) 333-4444", email: "psharma@hapm.hospital", experience: "15 years", education: "Stanford Medical", dept: "Endocrinology" },
  { id: "D004", name: "Dr. Michael Torres", specialty: "Orthopedics", patients: 298, rating: 4.6, reviews: 156, status: "available", phone: "+1 (555) 444-5555", email: "mtorres@hapm.hospital", experience: "10 years", education: "Mayo Clinic", dept: "Orthopedics" },
  { id: "D005", name: "Dr. Aisha Rahman", specialty: "Neurology", patients: 143, rating: 4.9, reviews: 89, status: "available", phone: "+1 (555) 555-6666", email: "arahman@hapm.hospital", experience: "9 years", education: "UCSF Medical", dept: "Neurology" },
];

const APPOINTMENTS = [
  { id: "APT001", patient: "Margaret Sullivan", doctor: "Dr. Sarah Chen", date: "Jun 22, 2026", time: "09:00 AM", type: "Follow-up", status: "confirmed", duration: "30 min" },
  { id: "APT002", patient: "Robert Harrington", doctor: "Dr. James Okonkwo", date: "Jun 22, 2026", time: "10:30 AM", type: "Consultation", status: "in-progress", duration: "45 min" },
  { id: "APT003", patient: "Elena Vasquez", doctor: "Dr. Sarah Chen", date: "Jun 22, 2026", time: "11:00 AM", type: "New Patient", status: "pending", duration: "60 min" },
  { id: "APT004", patient: "Thomas Blackwood", doctor: "Dr. Priya Sharma", date: "Jun 22, 2026", time: "02:00 PM", type: "Follow-up", status: "confirmed", duration: "30 min" },
  { id: "APT005", patient: "Yuki Tanaka", doctor: "Dr. James Okonkwo", date: "Jun 23, 2026", time: "09:30 AM", type: "Consultation", status: "confirmed", duration: "45 min" },
  { id: "APT006", patient: "Marcus Johnson", doctor: "Dr. Priya Sharma", date: "Jun 23, 2026", time: "03:00 PM", type: "Lab Review", status: "pending", duration: "30 min" },
  { id: "APT007", patient: "Margaret Sullivan", doctor: "Dr. Sarah Chen", date: "Jun 20, 2026", time: "10:00 AM", type: "Follow-up", status: "completed", duration: "30 min" },
  { id: "APT008", patient: "Robert Harrington", doctor: "Dr. James Okonkwo", date: "Jun 19, 2026", time: "04:00 PM", type: "Consultation", status: "cancelled", duration: "45 min" },
];

const PRESCRIPTIONS = [
  { id: "RX001", patient: "Margaret Sullivan", doctor: "Dr. Sarah Chen", date: "Jun 20, 2026", medications: [{ name: "Metformin", dose: "500mg", freq: "Twice daily", duration: "90 days" }, { name: "Lisinopril", dose: "10mg", freq: "Once daily", duration: "90 days" }], status: "active", refills: 2 },
  { id: "RX002", patient: "Robert Harrington", doctor: "Dr. James Okonkwo", date: "Jun 19, 2026", medications: [{ name: "Albuterol Inhaler", dose: "90mcg", freq: "As needed", duration: "30 days" }, { name: "Fluticasone", dose: "110mcg", freq: "Twice daily", duration: "30 days" }], status: "active", refills: 1 },
  { id: "RX003", patient: "Elena Vasquez", doctor: "Dr. Sarah Chen", date: "Jun 18, 2026", medications: [{ name: "Sumatriptan", dose: "50mg", freq: "As needed", duration: "30 days" }], status: "expired", refills: 0 },
  { id: "RX004", patient: "Yuki Tanaka", doctor: "Dr. James Okonkwo", date: "Jun 14, 2026", medications: [{ name: "Levothyroxine", dose: "75mcg", freq: "Once daily (morning)", duration: "90 days" }], status: "active", refills: 3 },
];

const LAB_REPORTS = [
  { id: "LAB001", patient: "Margaret Sullivan", test: "HbA1c Panel", date: "Jun 20, 2026", doctor: "Dr. Sarah Chen", status: "reviewed", result: "7.2% (Controlled)", category: "Endocrine" },
  { id: "LAB002", patient: "Robert Harrington", test: "Pulmonary Function Test", date: "Jun 19, 2026", doctor: "Dr. James Okonkwo", status: "reviewed", result: "FEV1: 78% predicted", category: "Respiratory" },
  { id: "LAB003", patient: "Thomas Blackwood", test: "Lipid Panel", date: "Jun 15, 2026", doctor: "Dr. Priya Sharma", status: "pending", result: "—", category: "Cardiovascular" },
  { id: "LAB004", patient: "Elena Vasquez", test: "CBC & Differential", date: "Jun 18, 2026", doctor: "Dr. Sarah Chen", status: "ready", result: "WNL", category: "Hematology" },
  { id: "LAB005", patient: "Marcus Johnson", test: "Thyroid Panel (TSH)", date: "Jun 12, 2026", doctor: "Dr. Priya Sharma", status: "ready", result: "TSH: 2.4 mIU/L", category: "Endocrine" },
];

const INVOICES = [
  { id: "INV-2026-0841", patient: "Margaret Sullivan", date: "Jun 20, 2026", amount: 420.00, paid: 420.00, status: "paid", services: ["Consultation", "ECG", "Blood Panel"] },
  { id: "INV-2026-0840", patient: "Robert Harrington", date: "Jun 19, 2026", amount: 285.00, paid: 0, status: "pending", services: ["Consultation", "PFT"] },
  { id: "INV-2026-0839", patient: "Elena Vasquez", date: "Jun 18, 2026", amount: 195.00, paid: 195.00, status: "paid", services: ["Consultation", "CBC"] },
  { id: "INV-2026-0838", patient: "Thomas Blackwood", date: "Jun 15, 2026", amount: 950.00, paid: 0, status: "overdue", services: ["Consultation", "X-Ray", "MRI Knee"] },
  { id: "INV-2026-0837", patient: "Yuki Tanaka", date: "Jun 14, 2026", amount: 160.00, paid: 160.00, status: "paid", services: ["Follow-up", "Thyroid Panel"] },
];

const NOTIFICATIONS = [
  { id: 1, type: "appointment", title: "Appointment Reminder", message: "You have a consultation with Margaret Sullivan at 09:00 AM today.", time: "5 min ago", read: false, priority: "normal" },
  { id: 2, type: "lab", title: "Lab Results Ready", message: "CBC & Differential results for Elena Vasquez are ready for review.", time: "22 min ago", read: false, priority: "high" },
  { id: 3, type: "message", title: "New Message from Dr. Okonkwo", message: "Please review the updated protocol for respiratory patients.", time: "1 hour ago", read: false, priority: "normal" },
  { id: 4, type: "billing", title: "Payment Received", message: "Invoice INV-2026-0841 has been settled. Amount: $420.00", time: "2 hours ago", read: true, priority: "normal" },
  { id: 5, type: "alert", title: "Critical Lab Value", message: "Potassium level for Thomas Blackwood: 5.8 mEq/L — Review immediately.", time: "3 hours ago", read: false, priority: "critical" },
  { id: 6, type: "appointment", title: "Appointment Cancelled", message: "Robert Harrington cancelled his 04:00 PM slot on Jun 19.", time: "Yesterday", read: true, priority: "normal" },
];

const MESSAGES = [
  { id: 1, from: "Dr. James Okonkwo", role: "Doctor", avatar: "JO", time: "10:32 AM", preview: "Can you pull up the last PFT results for Harrington?", unread: 2, online: true },
  { id: 2, from: "Nurse Kelly Brooks", role: "Nurse", avatar: "KB", time: "9:48 AM", preview: "Room 4 is ready for Dr. Chen's 11 AM patient.", unread: 0, online: true },
  { id: 3, from: "Admin — Front Desk", role: "Reception", avatar: "FD", time: "9:15 AM", preview: "3 walk-ins waiting. Estimated wait ~45 min.", unread: 1, online: false },
  { id: 4, from: "Dr. Priya Sharma", role: "Doctor", avatar: "PS", time: "Yesterday", preview: "I've uploaded the endocrinology protocol update.", unread: 0, online: false },
];

const AUDIT_LOGS = [
  { id: 1, user: "Dr. Sarah Chen", action: "Viewed patient record", resource: "Patient: Margaret Sullivan (P001)", ip: "192.168.1.42", time: "Jun 22, 10:02 AM", category: "access" },
  { id: 2, user: "Admin — Maria Ross", action: "Created user account", resource: "New user: Nurse David Park", ip: "192.168.1.10", time: "Jun 22, 09:47 AM", category: "create" },
  { id: 3, user: "Dr. James Okonkwo", action: "Issued prescription", resource: "RX002 — Albuterol (Harrington)", ip: "192.168.1.55", time: "Jun 22, 09:30 AM", category: "write" },
  { id: 4, user: "Receptionist — Jake Lim", action: "Scheduled appointment", resource: "APT005 — Yuki Tanaka", ip: "192.168.1.23", time: "Jun 21, 04:12 PM", category: "create" },
  { id: 5, user: "Admin — Maria Ross", action: "Exported billing report", resource: "May 2026 Revenue Report", ip: "192.168.1.10", time: "Jun 21, 03:58 PM", category: "export" },
  { id: 6, user: "Dr. Aisha Rahman", action: "Updated patient vitals", resource: "Patient: Elena Vasquez (P003)", ip: "192.168.1.67", time: "Jun 21, 02:45 PM", category: "write" },
];

const USERS = [
  { id: "U001", name: "Dr. Sarah Chen", email: "schen@hapm.hospital", role: "doctor", dept: "Cardiology", status: "active", lastLogin: "Jun 22, 09:15 AM" },
  { id: "U002", name: "Dr. James Okonkwo", email: "jokonkwo@hapm.hospital", role: "doctor", dept: "Internal Medicine", status: "active", lastLogin: "Jun 22, 08:30 AM" },
  { id: "U003", name: "Maria Ross", email: "mross@hapm.hospital", role: "admin", dept: "Administration", status: "active", lastLogin: "Jun 22, 07:45 AM" },
  { id: "U004", name: "Jake Lim", email: "jlim@hapm.hospital", role: "receptionist", dept: "Front Desk", status: "active", lastLogin: "Jun 22, 08:00 AM" },
  { id: "U005", name: "Dr. Priya Sharma", email: "psharma@hapm.hospital", role: "doctor", dept: "Endocrinology", status: "inactive", lastLogin: "Jun 10, 11:20 AM" },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-teal-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-indigo-500",
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── UI Primitives ─────────────────────────────────────────────────────────────

function Avatar({ name, size = "md", img }: { name: string; size?: "xs" | "sm" | "md" | "lg"; img?: string }) {
  const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-sm" };
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", avatarColor(name), sizes[size])}>
      {img ? <img src={img} alt={name} className="w-full h-full rounded-full object-cover" /> : initials(name)}
    </div>
  );
}

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "purple" | "teal";
function Badge({ variant, children, dot, className }: { variant: BadgeVariant; children: React.ReactNode; dot?: boolean; className?: string }) {
  const v: Record<BadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    error: "bg-red-50 text-red-700 ring-1 ring-red-200",
    info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    teal: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  };
  const dots: Record<BadgeVariant, string> = {
    success: "bg-emerald-500", warning: "bg-amber-500", error: "bg-red-500",
    info: "bg-blue-500", neutral: "bg-slate-400", purple: "bg-violet-500", teal: "bg-teal-500",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", v[variant], className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dots[variant])} />}
      {children}
    </span>
  );
}

function apptStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    confirmed: { variant: "info", label: "Confirmed" },
    pending: { variant: "warning", label: "Pending" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "error", label: "Cancelled" },
    "in-progress": { variant: "teal", label: "In Progress" },
    "no-show": { variant: "neutral", label: "No Show" },
  };
  const s = map[status] || { variant: "neutral", label: status };
  return <Badge variant={s.variant} dot>{s.label}</Badge>;
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
function Btn({
  variant = "primary", size = "md", children, onClick, className, icon, disabled,
}: {
  variant?: BtnVariant; size?: "sm" | "md" | "lg"; children?: React.ReactNode;
  onClick?: () => void; className?: string; icon?: React.ReactNode; disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants: Record<BtnVariant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-blue-700 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-blue-100",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-border text-foreground hover:bg-muted bg-card",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, sizes[size], variants[variant], className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function Input({ label, placeholder, value, onChange, type = "text", icon, className }: {
  label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void;
  type?: string; icon?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-colors",
            icon ? "pl-9 pr-3 py-2.5" : "px-3 py-2.5"
          )}
        />
      </div>
    </div>
  );
}

function Select({ label, options, value, onChange, className }: {
  label?: string; options: { value: string; label: string }[]; value?: string;
  onChange?: (v: string) => void; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-input-background border border-border rounded-lg text-sm text-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn("bg-card rounded-xl border border-border shadow-sm", onClick && "cursor-pointer hover:shadow-md transition-shadow", className)}>
      {children}
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, color, trend, trendValue }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ReactNode; color: string; trend?: "up" | "down" | "neutral"; trendValue?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trend && trend !== "neutral" && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium",
            trend === "up" ? "text-emerald-600" : "text-red-500")}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Card>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-3">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{message}</p>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-slate-200 animate-pulse rounded-lg", className)} />;
}

function Modal({ isOpen, onClose, title, children, size = "md" }: {
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!isOpen) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-card rounded-2xl shadow-2xl border border-border w-full mx-4 max-h-[90vh] overflow-y-auto", sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function SearchBar({ placeholder, value, onChange }: { placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-full bg-input-background border border-border rounded-lg text-sm pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-colors"
      />
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border">
        {cols.map(c => (
          <th key={c} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>{p.name}: {typeof p.value === "number" && p.value > 1000 ? `$${(p.value / 1000).toFixed(1)}k` : p.value}</p>
      ))}
    </div>
  );
};

// ─── Sidebar ───────────────────────────────────────────────────────────────────

interface NavGroup { label: string; items: { id: View; label: string; icon: any }[] }

const NAV_CONFIG: Record<Role, NavGroup[]> = {
  admin: [
    { label: "Overview", items: [{ id: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Management", items: [{ id: "user-management", label: "Users", icon: Users }, { id: "doctor-list", label: "Doctors", icon: Stethoscope }, { id: "patient-list", label: "Patients", icon: UserCheck }] },
    { label: "Operations", items: [{ id: "appointments", label: "Appointments", icon: Calendar }, { id: "billing", label: "Billing", icon: CreditCard }, { id: "lab-reports", label: "Lab Reports", icon: TestTube }] },
    { label: "System", items: [{ id: "audit-logs", label: "Audit Logs", icon: Shield }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "messaging", label: "Messages", icon: MessageSquare }, { id: "profile-settings", label: "Settings", icon: Settings }] },
  ],
  doctor: [
    { label: "Overview", items: [{ id: "doctor-dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Clinical", items: [{ id: "appointments", label: "My Schedule", icon: Calendar }, { id: "patient-list", label: "Patients", icon: UserCheck }, { id: "prescriptions", label: "Prescriptions", icon: Pill }, { id: "lab-reports", label: "Lab Reports", icon: TestTube }, { id: "vitals", label: "Vital Signs", icon: Activity }] },
    { label: "Communicate", items: [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "messaging", label: "Messages", icon: MessageSquare }] },
    { label: "Account", items: [{ id: "doctor-profile", label: "My Profile", icon: User }, { id: "profile-settings", label: "Settings", icon: Settings }] },
  ],
  patient: [
    { label: "Overview", items: [{ id: "patient-dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "My Health", items: [{ id: "appointments", label: "Appointments", icon: Calendar }, { id: "patient-profile", label: "Medical Records", icon: FileText }, { id: "prescriptions", label: "Prescriptions", icon: Pill }, { id: "lab-reports", label: "Lab Reports", icon: TestTube }, { id: "vitals", label: "Vital Signs", icon: Activity }] },
    { label: "Billing", items: [{ id: "billing", label: "Invoices", icon: CreditCard }] },
    { label: "Communication", items: [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "messaging", label: "Messages", icon: MessageSquare }] },
    { label: "Account", items: [{ id: "profile-settings", label: "Settings", icon: Settings }] },
  ],
  receptionist: [
    { label: "Overview", items: [{ id: "receptionist-dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Operations", items: [{ id: "appointments", label: "Appointments", icon: Calendar }, { id: "patient-list", label: "Patient Search", icon: UserCheck }, { id: "doctor-list", label: "Doctors", icon: Stethoscope }, { id: "billing", label: "Billing", icon: CreditCard }] },
    { label: "Communicate", items: [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "messaging", label: "Messages", icon: MessageSquare }] },
    { label: "Account", items: [{ id: "profile-settings", label: "Settings", icon: Settings }] },
  ],
};

const ROLE_USERS: Record<Role, { name: string; email: string; title: string }> = {
  admin: { name: "Maria Ross", email: "mross@hapm.hospital", title: "System Administrator" },
  doctor: { name: "Dr. Sarah Chen", email: "schen@hapm.hospital", title: "Cardiologist" },
  patient: { name: "Margaret Sullivan", email: "msullivan@email.com", title: "Patient — ID: P001" },
  receptionist: { name: "Jake Lim", email: "jlim@hapm.hospital", title: "Front Desk" },
};

function Sidebar({ role, currentView, navigate, collapsed, onToggle }: {
  role: Role; currentView: View; navigate: (v: View) => void;
  collapsed: boolean; onToggle: () => void;
}) {
  const groups = NAV_CONFIG[role];
  const user = ROLE_USERS[role];
  return (
    <aside className={cn(
      "h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white tracking-tight">HAPM</p>
            <p className="text-[10px] text-slate-500 tracking-wide">Hospital Management</p>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto p-1 hover:bg-sidebar-accent rounded-lg transition-colors text-slate-500 hover:text-white">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none">
        {groups.map(group => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-100 rounded-lg mx-0",
                    collapsed ? "justify-center px-2 mx-2 w-auto" : "mx-2 w-[calc(100%-16px)]",
                    active
                      ? "bg-blue-600/20 text-white"
                      : "text-slate-400 hover:bg-sidebar-accent hover:text-slate-200"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active && "text-blue-400")} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.id === "notifications" && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <Avatar name={user.name} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.title}</p>
            </div>
          )}
          {!collapsed && (
            <button className="p-1 hover:bg-sidebar-accent rounded-md transition-colors text-slate-500 hover:text-white">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Top Navigation ─────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "admin-dashboard": "Dashboard", "doctor-dashboard": "Dashboard",
  "patient-dashboard": "Dashboard", "receptionist-dashboard": "Dashboard",
  "patient-list": "Patients", "patient-profile": "Patient Profile",
  "doctor-list": "Doctors", "doctor-profile": "Doctor Profile",
  "appointments": "Appointments", "prescriptions": "Prescriptions",
  "lab-reports": "Lab Reports", "billing": "Billing & Invoices",
  "vitals": "Vital Signs", "notifications": "Notifications",
  "messaging": "Messages", "user-management": "User Management",
  "audit-logs": "Audit Logs", "profile-settings": "Profile & Settings",
};

const ROLES: Role[] = ["admin", "doctor", "patient", "receptionist"];
const ROLE_LABELS: Record<Role, string> = { admin: "Admin", doctor: "Doctor", patient: "Patient", receptionist: "Receptionist" };

function TopNav({ role, currentView, navigate, onRoleChange }: {
  role: Role; currentView: View; navigate: (v: View) => void;
  onRoleChange: (r: Role) => void;
}) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground hidden sm:block">HAPM</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
        <span className="font-medium text-foreground">{PAGE_TITLES[currentView] || "Dashboard"}</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients, doctors, appointments..."
            className="w-full bg-muted border border-border rounded-lg text-xs pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background border border-border rounded px-1">⌘K</kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Role Switcher */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                role === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate("notifications")}
          className="relative w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
        </button>

        {/* Messages */}
        <button
          onClick={() => navigate("messaging")}
          className="relative w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-card" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-border ml-1">
          <Avatar name={ROLE_USERS[role].name} size="sm" />
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-foreground leading-none">{ROLE_USERS[role].name.split(" ")[0]}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
        </div>
      </div>
    </header>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (role: Role) => void }) {
  const [email, setEmail] = useState("admin@hapm.hospital");
  const [password, setPassword] = useState("••••••••");
  const [role, setRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "forgot" | "reset">("login");

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(role); }, 1200);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 30%)" }} />
        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg tracking-tight">HAPM</p>
            <p className="text-blue-200 text-xs">Hospital Management Platform</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Healthcare operations,<br />unified and streamlined.
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm">
            One platform for appointments, EMR, prescriptions, billing, and real-time clinical collaboration.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { label: "Patients", value: "12,400+" },
              { label: "Doctors", value: "86 Active" },
              { label: "Appointments", value: "320/day" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 z-10">
          {["HIPAA Compliant", "SOC 2 Type II", "ISO 27001"].map(b => (
            <div key={b} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
              <Shield className="w-3 h-3 text-blue-200" />
              <span className="text-blue-100 text-[11px] font-medium">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {view === "login" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
              </div>

              {/* Role selector */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {ROLES.map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setEmail(`${r}@hapm.hospital`);
                    }}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      role === r
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 bg-card"
                    )}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Input label="Email address" value={email} onChange={setEmail} type="email" icon={<Mail className="w-4 h-4" />} />
                <Input label="Password" value={password} onChange={setPassword} type="password" icon={<Lock className="w-4 h-4" />} />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded accent-blue-600" />
                    <span className="text-xs text-muted-foreground">Remember me</span>
                  </label>
                  <button onClick={() => setView("forgot")} className="text-xs text-primary font-medium hover:underline">
                    Forgot password?
                  </button>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                  ) : (
                    <>Sign in as {ROLE_LABELS[role]} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              <div className="mt-6 p-3 bg-muted rounded-xl">
                <p className="text-[11px] text-muted-foreground text-center">
                  <span className="font-medium text-foreground">Demo mode</span> — Select a role above and click Sign In to explore the platform.
                </p>
              </div>
            </>
          )}

          {view === "forgot" && (
            <>
              <button onClick={() => setView("login")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to login
              </button>
              <div className="mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
                <p className="text-muted-foreground text-sm mt-1">Enter your email and we'll send a reset link.</p>
              </div>
              <div className="space-y-4">
                <Input label="Work email address" placeholder="your@hapm.hospital" type="email" icon={<Mail className="w-4 h-4" />} />
                <button
                  onClick={() => setView("reset")}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send reset link
                </button>
              </div>
            </>
          )}

          {view === "reset" && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
                <p className="text-muted-foreground text-sm mt-1">Password reset link sent to your email address.</p>
              </div>
              <button onClick={() => setView("login")} className="w-full border border-border bg-card text-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────────

function AdminDashboard({ navigate }: NavProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Good morning, Maria 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monday, June 22, 2026 — Here's your hospital overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>New Appointment</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Patients" value="12,487" subtitle="vs last month" icon={<UserCheck className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="up" trendValue="+8.2%" />
        <KPICard title="Active Doctors" value="86" subtitle="3 on leave today" icon={<Stethoscope className="w-5 h-5 text-teal-600" />} color="bg-teal-50" trend="neutral" />
        <KPICard title="Appointments Today" value="324" subtitle="41 remaining" icon={<Calendar className="w-5 h-5 text-violet-600" />} color="bg-violet-50" trend="up" trendValue="+12%" />
        <KPICard title="Monthly Revenue" value="$183.7k" subtitle="vs last month" icon={<DollarSign className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" trend="up" trendValue="+7.3%" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointment Trend */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Appointment Trends" subtitle="Last 7 days — appointments vs completed" action={
            <select className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-muted-foreground">
              <option>Last 7 days</option>
            </select>
          } />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={apptTrendData}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="appointments" name="Scheduled" stroke="#3B82F6" strokeWidth={2} fill="url(#apptGrad)" dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2} fill="url(#compGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Donut */}
        <Card className="p-5">
          <SectionHeader title="Appointment Status" subtitle="This week" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={apptStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {apptStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {apptStatusData.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue */}
        <Card className="p-5">
          <SectionHeader title="Revenue" subtitle="Jan – Jun 2026" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Appointments */}
        <Card className="lg:col-span-2">
          <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Appointments</h2>
              <p className="text-xs text-muted-foreground">Today, June 22</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => navigate("appointments")}>View all <ArrowRight className="w-3.5 h-3.5" /></Btn>
          </div>
          <div className="divide-y divide-border">
            {APPOINTMENTS.slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                <Avatar name={apt.patient} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{apt.patient}</p>
                  <p className="text-xs text-muted-foreground truncate">{apt.doctor} · {apt.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-foreground">{apt.time}</p>
                  <div className="mt-0.5">{apptStatusBadge(apt.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="p-5">
        <SectionHeader title="Recent Activity" subtitle="System events and actions" action={
          <Btn variant="ghost" size="sm" onClick={() => navigate("audit-logs")}>Audit logs <ArrowRight className="w-3.5 h-3.5" /></Btn>
        } />
        <div className="space-y-3">
          {AUDIT_LOGS.slice(0, 4).map((log, i) => (
            <div key={log.id} className="flex items-start gap-3">
              <Avatar name={log.user} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-medium">{log.user}</span>
                  <span className="text-muted-foreground"> {log.action}: </span>
                  <span className="text-primary">{log.resource}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{log.time} · {log.ip}</p>
              </div>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                log.category === "create" ? "bg-emerald-50 text-emerald-700" :
                log.category === "write" ? "bg-blue-50 text-blue-700" :
                log.category === "export" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
              )}>{log.category}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Doctor Dashboard ───────────────────────────────────────────────────────────

function DoctorDashboard({ navigate }: NavProps) {
  const today = APPOINTMENTS.filter(a => a.date === "Jun 22, 2026" && a.doctor === "Dr. Sarah Chen");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Good morning, Dr. Chen 🩺</h1>
          <p className="text-sm text-muted-foreground">Monday, June 22 — You have {today.length} appointments today</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Pill className="w-3.5 h-3.5" />} onClick={() => navigate("prescriptions")}>New Rx</Btn>
          <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />} onClick={() => navigate("appointments")}>Schedule</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Today's Patients" value={today.length} subtitle="2 remaining" icon={<Users className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="neutral" />
        <KPICard title="Pending Prescriptions" value="4" subtitle="Needs signature" icon={<Pill className="w-5 h-5 text-violet-600" />} color="bg-violet-50" trend="neutral" />
        <KPICard title="Avg Rating" value="4.9" subtitle="from 128 reviews" icon={<Star className="w-5 h-5 text-amber-500" />} color="bg-amber-50" trend="up" trendValue="+0.1" />
        <KPICard title="Lab Results" value="3" subtitle="Pending review" icon={<TestTube className="w-5 h-5 text-teal-600" />} color="bg-teal-50" trend="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 p-5">
          <SectionHeader title="Today's Schedule" subtitle="Your appointment queue — Jun 22" action={
            <Btn variant="ghost" size="sm" onClick={() => navigate("appointments")}>Full calendar <ArrowRight className="w-3.5 h-3.5" /></Btn>
          } />
          <div className="space-y-2">
            {today.map((apt, i) => (
              <div key={apt.id} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                apt.status === "in-progress" ? "border-teal-200 bg-teal-50" : "border-border hover:bg-muted/50"
              )}>
                <div className="text-right shrink-0 w-16">
                  <p className="text-xs font-semibold text-foreground">{apt.time}</p>
                  <p className="text-[10px] text-muted-foreground">{apt.duration}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <Avatar name={apt.patient} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{apt.patient}</p>
                  <p className="text-xs text-muted-foreground">{apt.type}</p>
                </div>
                {apptStatusBadge(apt.status)}
                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            {[{ time: "02:30 PM", label: "Administrative block", duration: "30 min", type: "internal" }].map(slot => (
              <div key={slot.time} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border">
                <div className="text-right shrink-0 w-16">
                  <p className="text-xs font-semibold text-muted-foreground">{slot.time}</p>
                  <p className="text-[10px] text-muted-foreground">{slot.duration}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{slot.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Stats */}
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader title="Patients This Week" />
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyPatientData}>
                <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="patients" fill="#1D4ED8" radius={[3, 3, 0, 0]} />
                <Tooltip content={<CustomTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <SectionHeader title="Quick Actions" />
            <div className="space-y-2">
              {[
                { label: "View patient records", icon: FileText, view: "patient-list" as View },
                { label: "Write prescription", icon: Pill, view: "prescriptions" as View },
                { label: "Check lab results", icon: TestTube, view: "lab-reports" as View },
                { label: "Record vitals", icon: Activity, view: "vitals" as View },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.view)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <a.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{a.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <Card className="p-5">
        <SectionHeader title="Recent Prescriptions" action={
          <Btn variant="ghost" size="sm" onClick={() => navigate("prescriptions")}>View all <ArrowRight className="w-3.5 h-3.5" /></Btn>
        } />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESCRIPTIONS.slice(0, 2).map(rx => (
            <div key={rx.id} className="p-3 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar name={rx.patient} size="xs" />
                  <span className="text-xs font-semibold text-foreground">{rx.patient}</span>
                </div>
                <Badge variant={rx.status === "active" ? "success" : "neutral"}>{rx.status}</Badge>
              </div>
              <div className="space-y-1">
                {rx.medications.map(m => (
                  <div key={m.name} className="flex items-center gap-2">
                    <Pill className="w-3 h-3 text-violet-400" />
                    <span className="text-xs text-foreground">{m.name} <span className="text-muted-foreground">{m.dose} · {m.freq}</span></span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{rx.id} · {rx.date}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Patient Dashboard ──────────────────────────────────────────────────────────

function PatientDashboard({ navigate }: NavProps) {
  const patient = PATIENTS[0];
  const upcoming = APPOINTMENTS.filter(a => a.patient === patient.name && (a.status === "confirmed" || a.status === "pending"));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Hello, Margaret 👋</h1>
          <p className="text-sm text-muted-foreground">Patient ID: P001 · Your health at a glance</p>
        </div>
        <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />} onClick={() => navigate("appointments")}>
          Book Appointment
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Upcoming Visits" value={upcoming.length} subtitle="Next: Jun 22" icon={<Calendar className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="neutral" />
        <KPICard title="Active Prescriptions" value="2" subtitle="Last updated Jun 20" icon={<Pill className="w-5 h-5 text-violet-600" />} color="bg-violet-50" trend="neutral" />
        <KPICard title="Lab Reports" value="3" subtitle="1 new result" icon={<TestTube className="w-5 h-5 text-teal-600" />} color="bg-teal-50" trend="neutral" />
        <KPICard title="Pending Invoices" value="$0" subtitle="All settled" icon={<CreditCard className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" trend="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming appointment card */}
        <Card className="p-5">
          <SectionHeader title="Next Appointment" />
          {upcoming[0] ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{upcoming[0].date}</p>
                  <p className="text-xs text-blue-600">{upcoming[0].time} · {upcoming[0].duration}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{upcoming[0].type}</p>
              <div className="flex items-center gap-2 mt-1">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{upcoming[0].doctor}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Btn variant="primary" size="sm" className="flex-1 justify-center">Check in</Btn>
                <Btn variant="outline" size="sm">Reschedule</Btn>
              </div>
            </div>
          ) : (
            <EmptyState icon={<Calendar />} title="No upcoming appointments" message="Book an appointment with your doctor." />
          )}
        </Card>

        {/* Vitals summary */}
        <Card className="p-5">
          <SectionHeader title="Recent Vitals" subtitle="Last recorded Jun 22" action={
            <Btn variant="ghost" size="sm" onClick={() => navigate("vitals")}>View <ArrowRight className="w-3.5 h-3.5" /></Btn>
          } />
          <div className="space-y-3">
            {[
              { label: "Blood Pressure", value: "118/75", unit: "mmHg", icon: Heart, status: "normal", color: "text-emerald-600" },
              { label: "Heart Rate", value: "72", unit: "bpm", icon: Activity, status: "normal", color: "text-emerald-600" },
              { label: "Blood Glucose", value: "138", unit: "mg/dL", icon: Thermometer, status: "borderline", color: "text-amber-600" },
              { label: "Weight", value: "68.4", unit: "kg", icon: Weight, status: "normal", color: "text-emerald-600" },
            ].map(v => (
              <div key={v.label} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
                  <v.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{v.label}</p>
                  <p className="text-sm font-semibold text-foreground">{v.value} <span className="text-xs font-normal text-muted-foreground">{v.unit}</span></p>
                </div>
                <span className={cn("text-xs font-medium", v.color)}>{v.status}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick access */}
        <Card className="p-5">
          <SectionHeader title="My Health Records" />
          <div className="space-y-2">
            {[
              { label: "Medical History & Allergies", icon: FileText, view: "patient-profile" as View, count: "" },
              { label: "Prescriptions", icon: Pill, view: "prescriptions" as View, count: "2 active" },
              { label: "Lab Reports", icon: TestTube, view: "lab-reports" as View, count: "1 new" },
              { label: "Vital Signs History", icon: Activity, view: "vitals" as View, count: "" },
              { label: "Invoices & Billing", icon: CreditCard, view: "billing" as View, count: "All paid" },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.view)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors text-left">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground flex-1">{item.label}</span>
                {item.count && <span className="text-[10px] text-muted-foreground">{item.count}</span>}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Receptionist Dashboard ─────────────────────────────────────────────────────

function ReceptionistDashboard({ navigate }: NavProps) {
  const queue = [
    { id: 1, name: "Harold Whitfield", time: "09:00 AM", doctor: "Dr. Chen", status: "in-progress", waitTime: "—" },
    { id: 2, name: "Yuki Tanaka", time: "09:30 AM", doctor: "Dr. Okonkwo", status: "waiting", waitTime: "12 min" },
    { id: 3, name: "Elena Vasquez", time: "11:00 AM", doctor: "Dr. Chen", status: "waiting", waitTime: "35 min" },
    { id: 4, name: "Marcus Johnson", time: "11:30 AM", doctor: "Dr. Torres", status: "checked-in", waitTime: "8 min" },
    { id: 5, name: "Grace Patel", time: "02:00 PM", doctor: "Dr. Rahman", status: "scheduled", waitTime: "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reception Desk 🏥</h1>
          <p className="text-sm text-muted-foreground">Monday, June 22 · Queue management & scheduling</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Search className="w-3.5 h-3.5" />} onClick={() => navigate("patient-list")}>Patient Search</Btn>
          <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />} onClick={() => navigate("appointments")}>Book Appointment</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Today's Total" value="52" subtitle="appointments" icon={<Calendar className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="neutral" />
        <KPICard title="Checked In" value="18" subtitle="patients arrived" icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" trend="neutral" />
        <KPICard title="Queue Waiting" value="4" subtitle="avg 18 min wait" icon={<Clock className="w-5 h-5 text-amber-500" />} color="bg-amber-50" trend="neutral" />
        <KPICard title="Walk-ins" value="3" subtitle="unscheduled today" icon={<UserPlus className="w-5 h-5 text-violet-600" />} color="bg-violet-50" trend="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue */}
        <Card className="lg:col-span-2">
          <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Patient Queue</h2>
              <p className="text-xs text-muted-foreground">Real-time status — refreshes automatically</p>
            </div>
            <Btn variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Btn>
          </div>
          <div className="divide-y divide-border">
            {queue.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-muted-foreground">{i + 1}</span>
                </div>
                <Avatar name={p.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.time} · {p.doctor}</p>
                </div>
                <div className="text-right shrink-0">
                  {p.status === "in-progress" && <Badge variant="teal" dot>In Progress</Badge>}
                  {p.status === "waiting" && <Badge variant="warning" dot>Waiting · {p.waitTime}</Badge>}
                  {p.status === "checked-in" && <Badge variant="info" dot>Checked In</Badge>}
                  {p.status === "scheduled" && <Badge variant="neutral">Scheduled</Badge>}
                </div>
                {p.status === "waiting" || p.status === "scheduled" ? (
                  <Btn variant="primary" size="sm">Check In</Btn>
                ) : (
                  <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Doctor Availability */}
        <Card className="p-5">
          <SectionHeader title="Doctor Availability" subtitle="Current status" action={
            <Btn variant="ghost" size="sm" onClick={() => navigate("doctor-list")}>All <ArrowRight className="w-3.5 h-3.5" /></Btn>
          } />
          <div className="space-y-2.5">
            {DOCTORS.slice(0, 4).map(d => (
              <div key={d.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar name={d.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.specialty}</p>
                </div>
                <div className={cn("w-2 h-2 rounded-full", d.status === "available" ? "bg-emerald-500" : "bg-amber-400")} />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs font-medium text-primary mb-0.5">Quick book</p>
            <p className="text-[11px] text-blue-600">3 doctors have open slots in next 2 hours</p>
            <Btn variant="primary" size="sm" className="mt-2 w-full justify-center" onClick={() => navigate("appointments")}>Book Now</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Patient List ───────────────────────────────────────────────────────────────

function PatientList({ navigate }: NavProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = PATIENTS.filter(p =>
    (filter === "all" || p.status === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">{PATIENTS.length} registered patients</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowModal(true)}>Register Patient</Btn>
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48 max-w-sm">
            <SearchBar value={search} onChange={setSearch} placeholder="Search patients by name or ID..." />
          </div>
          <div className="flex items-center gap-2">
            {["all", "active", "inactive"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize",
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >{f}</button>
            ))}
          </div>
          <Btn variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>Filters</Btn>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["Patient", "Age/Gender", "Blood", "Last Visit", "Doctor", "Condition", "Status", ""]} />
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate("patient-profile")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{p.age} yr</p>
                    <p className="text-[11px] text-muted-foreground">{p.gender === "M" ? "Male" : "Female"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-rose-600">{p.blood}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.lastVisit}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.doctor}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground max-w-32 truncate">{p.condition}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); navigate("patient-profile"); }} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" onClick={e => e.stopPropagation()}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {PATIENTS.length} patients</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={cn("w-7 h-7 text-xs rounded-lg transition-colors", p === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Registration Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register New Patient" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" placeholder="Margaret" />
          <Input label="Last Name" placeholder="Sullivan" />
          <Input label="Date of Birth" type="date" />
          <Select label="Gender" options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }, { value: "O", label: "Other" }]} />
          <Input label="Phone Number" placeholder="+1 (555) 234-5678" icon={<Phone className="w-4 h-4" />} />
          <Input label="Email Address" placeholder="patient@email.com" type="email" icon={<Mail className="w-4 h-4" />} />
          <Select label="Blood Group" className="col-span-1" options={["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b => ({ value: b, label: b }))} />
          <Select label="Assigned Doctor" className="col-span-1" options={DOCTORS.map(d => ({ value: d.id, label: d.name }))} />
          <Input label="Address" placeholder="123 Main St, Boston, MA" icon={<MapPin className="w-4 h-4" />} className="col-span-2" />
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Known Conditions / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Type 2 Diabetes, Hypertension..."
              className="w-full bg-input-background border border-border rounded-lg text-sm px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowModal(false)} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="primary" className="flex-1 justify-center" icon={<UserPlus className="w-4 h-4" />}>Register Patient</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Patient Profile ────────────────────────────────────────────────────────────

function PatientProfile({ navigate }: NavProps) {
  const patient = PATIENTS[0];
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "history", "prescriptions", "labs", "vitals", "billing"];

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate("patient-list")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Patients
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-foreground font-medium">{patient.name}</span>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar name={patient.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5 font-mono">{patient.id} · {patient.age} years · {patient.gender === "F" ? "Female" : "Male"}</p>
              </div>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Btn>
                <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>Book Appointment</Btn>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Phone", value: patient.phone, icon: Phone },
                { label: "Email", value: patient.email, icon: Mail },
                { label: "Location", value: patient.city, icon: MapPin },
                { label: "Blood Type", value: patient.blood, icon: Heart },
              ].map(info => (
                <div key={info.label} className="flex items-start gap-2">
                  <info.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{info.label}</p>
                    <p className="text-xs font-medium text-foreground">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="error" dot>Hypertension</Badge>
          <Badge variant="warning" dot>Type 2 Diabetes</Badge>
          <Badge variant="info">No Drug Allergies</Badge>
          <Badge variant="neutral">Last Visit: Jun 20, 2026</Badge>
          <Badge variant="success">Active Patient</Badge>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-4 py-2.5 text-xs font-medium capitalize transition-all border-b-2 -mb-px",
              activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >{t}</button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4 lg:col-span-2">
            {/* Medical History */}
            <Card className="p-5">
              <SectionHeader title="Medical History" />
              <div className="space-y-3">
                {[
                  { date: "Mar 2022", event: "Diagnosed with Type 2 Diabetes", doctor: "Dr. Priya Sharma", severity: "chronic" },
                  { date: "Aug 2020", event: "Hypertension diagnosed, started on Lisinopril", doctor: "Dr. Sarah Chen", severity: "chronic" },
                  { date: "Jun 2018", event: "Appendectomy — laparoscopic, uncomplicated", doctor: "Dr. M. Torres", severity: "resolved" },
                  { date: "Jan 2015", event: "Community-acquired pneumonia — hospitalized 4 days", doctor: "Dr. J. Okonkwo", severity: "resolved" },
                ].map(h => (
                  <div key={h.date} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="text-right shrink-0 w-20">
                      <p className="text-[11px] font-semibold text-muted-foreground">{h.date}</p>
                    </div>
                    <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", h.severity === "chronic" ? "bg-amber-400" : "bg-slate-300")} />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{h.event}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{h.doctor}</p>
                    </div>
                    <Badge variant={h.severity === "chronic" ? "warning" : "neutral"}>{h.severity}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Allergies */}
            <Card className="p-5">
              <SectionHeader title="Allergies & Intolerances" action={<Btn variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Add</Btn>} />
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-medium text-rose-700">Penicillin — Severe (anaphylaxis)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700">Shellfish — Mild (hives)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Latex — Contact dermatitis</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <Card className="p-5">
              <SectionHeader title="Emergency Contact" />
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Primary Contact</p>
                  <p className="text-sm font-semibold text-foreground">James Sullivan (Spouse)</p>
                  <p className="text-xs text-primary">+1 (555) 876-5432</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader title="Chronic Conditions" />
              <div className="space-y-2">
                {["Hypertension (Essential)", "Type 2 Diabetes Mellitus", "Hypercholesterolemia"].map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs text-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader title="Insurance" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">BlueCross BlueShield</p>
                <p className="text-xs text-muted-foreground">Plan: PPO Gold — ID: BCB4421-07</p>
                <p className="text-xs text-muted-foreground">Group: 00441-Sullivan</p>
                <Badge variant="success" className="mt-1">Active</Badge>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== "overview" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Showing {activeTab} tab — full content available in complete implementation</p>
          <Btn variant="outline" size="sm" className="mt-3" onClick={() => {
            if (activeTab === "prescriptions") navigate("prescriptions");
            else if (activeTab === "labs") navigate("lab-reports");
            else if (activeTab === "vitals") navigate("vitals");
            else if (activeTab === "billing") navigate("billing");
          }}>Open in {activeTab} module <ArrowRight className="w-3.5 h-3.5" /></Btn>
        </div>
      )}
    </div>
  );
}

// ─── Doctor List ────────────────────────────────────────────────────────────────

function DoctorList({ navigate }: NavProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = DOCTORS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Doctors</h1>
          <p className="text-sm text-muted-foreground">{DOCTORS.length} medical professionals</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md transition-all", view === "list" ? "bg-card shadow-sm" : "text-muted-foreground")}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md transition-all", view === "grid" ? "bg-card shadow-sm" : "text-muted-foreground")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Btn variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>Add Doctor</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or specialty..." />
        </div>
        <Select options={[{ value: "all", label: "All Departments" }, ...DOCTORS.map(d => ({ value: d.dept, label: d.dept }))]} />
        <Select options={[{ value: "all", label: "All Status" }, { value: "available", label: "Available" }, { value: "on-leave", label: "On Leave" }]} />
      </div>

      {view === "list" && (
        <Card>
          <table className="w-full">
            <TableHead cols={["Doctor", "Specialty", "Patients", "Rating", "Status", "Contact", ""]} />
            <tbody className="divide-y divide-border">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate("doctor-profile")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground">{d.experience} · {d.education}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{d.specialty}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{d.patients.toLocaleString()}</td>
                  <td className="px-4 py-3"><Stars rating={d.rating} /></td>
                  <td className="px-4 py-3">
                    <Badge variant={d.status === "available" ? "success" : "warning"} dot>
                      {d.status === "available" ? "Available" : "On Leave"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Mail className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Phone className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Btn variant="outline" size="sm" onClick={e => { e.stopPropagation(); navigate("doctor-profile"); }}>View</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <Card key={d.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("doctor-profile")}>
              <div className="flex items-start gap-3 mb-4">
                <Avatar name={d.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialty}</p>
                  <div className="mt-1"><Stars rating={d.rating} /></div>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full mt-1", d.status === "available" ? "bg-emerald-500" : "bg-amber-400")} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div><p className="text-[10px] text-muted-foreground">Patients</p><p className="text-sm font-bold text-foreground">{d.patients}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Reviews</p><p className="text-sm font-bold text-foreground">{d.reviews}</p></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Doctor Profile ─────────────────────────────────────────────────────────────

function DoctorProfile({ navigate }: NavProps) {
  const doctor = DOCTORS[0];
  const [activeTab, setActiveTab] = useState("schedule");

  const schedule = [
    { day: "Monday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
    { day: "Tuesday", slots: ["09:00 AM", "10:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"] },
    { day: "Wednesday", slots: ["09:00 AM", "11:00 AM", "02:00 PM"] },
    { day: "Thursday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
    { day: "Friday", slots: ["09:00 AM", "10:00 AM"] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate("doctor-list")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Doctors
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">{doctor.name}</span>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar name={doctor.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-foreground">{doctor.name}</h1>
                <p className="text-sm text-muted-foreground">{doctor.specialty} · {doctor.dept} · {doctor.experience}</p>
                <div className="mt-1"><Stars rating={doctor.rating} /></div>
              </div>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Btn>
                <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>Book Appointment</Btn>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Email", value: doctor.email, icon: Mail },
                { label: "Phone", value: doctor.phone, icon: Phone },
                { label: "Education", value: doctor.education, icon: BookOpen },
                { label: "Department", value: doctor.dept, icon: Building2 },
              ].map(info => (
                <div key={info.label} className="flex items-start gap-2">
                  <info.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{info.label}</p>
                    <p className="text-xs font-medium text-foreground">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{doctor.patients}</p>
            <p className="text-xs text-blue-600">Total Patients</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-600">{doctor.rating}</p>
            <p className="text-xs text-teal-600">Average Rating</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{doctor.reviews}</p>
            <p className="text-xs text-amber-600">Patient Reviews</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {["schedule", "reviews", "leave"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={cn(
            "px-4 py-2.5 text-xs font-medium capitalize transition-all border-b-2 -mb-px",
            activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}>{t}</button>
        ))}
      </div>

      {activeTab === "schedule" && (
        <Card className="p-5">
          <SectionHeader title="Weekly Availability" subtitle="Current week — slots open for booking" />
          <div className="grid grid-cols-5 gap-3">
            {schedule.map(s => (
              <div key={s.day}>
                <p className="text-xs font-semibold text-foreground mb-2">{s.day}</p>
                <div className="space-y-1.5">
                  {s.slots.map((slot, i) => (
                    <div key={i} className={cn(
                      "text-[11px] px-2 py-1.5 rounded-lg text-center font-medium cursor-pointer transition-colors",
                      i === 0 && s.day === "Monday" ? "bg-teal-500 text-white" :
                      i < 2 ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}>
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4">
            {[{ color: "bg-teal-500", label: "In Progress" }, { color: "bg-blue-100", label: "Available" }, { color: "bg-muted", label: "Booked" }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded", l.color)} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-3">
          {[
            { patient: "Robert H.", rating: 5, date: "Jun 18, 2026", comment: "Dr. Chen is incredibly thorough and caring. Took time to explain everything. Highly recommend." },
            { patient: "Patricia M.", rating: 5, date: "Jun 10, 2026", comment: "Excellent doctor. Very professional and attentive. She listened carefully and addressed all my concerns." },
            { patient: "David K.", rating: 4, date: "Jun 3, 2026", comment: "Great experience overall. Wait time was a bit long but the consultation was worth it." },
          ].map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar name={r.patient} size="sm" />
                  <span className="text-sm font-medium text-foreground">{r.patient}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "leave" && (
        <Card className="p-5">
          <SectionHeader title="Leave Management" action={<Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Request Leave</Btn>} />
          <div className="space-y-3">
            {[
              { type: "Annual Leave", from: "Jul 1, 2026", to: "Jul 7, 2026", days: 7, status: "approved" },
              { type: "CME Conference", from: "Aug 15, 2026", to: "Aug 17, 2026", days: 3, status: "pending" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{l.type}</p>
                  <p className="text-xs text-muted-foreground">{l.from} — {l.to} · {l.days} days</p>
                </div>
                <Badge variant={l.status === "approved" ? "success" : "warning"}>{l.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Appointments ───────────────────────────────────────────────────────────────

function AppointmentsView({ navigate }: NavProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showBook, setShowBook] = useState(false);
  const [calView, setCalView] = useState(false);

  const filtered = APPOINTMENTS.filter(a =>
    (filter === "all" || a.status === filter) &&
    (a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Appointments</h1>
          <p className="text-sm text-muted-foreground">{APPOINTMENTS.length} total appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setCalView(false)} className={cn("p-1.5 rounded-md transition-all", !calView ? "bg-card shadow-sm" : "text-muted-foreground")}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setCalView(true)} className={cn("p-1.5 rounded-md transition-all", calView ? "bg-card shadow-sm" : "text-muted-foreground")}>
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <Btn variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />} onClick={() => setShowBook(true)}>
            Book Appointment
          </Btn>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Today", value: 52, color: "bg-blue-50 text-blue-700" },
          { label: "Confirmed", value: 31, color: "bg-blue-50 text-blue-700" },
          { label: "In Progress", value: 4, color: "bg-teal-50 text-teal-700" },
          { label: "Pending", value: 12, color: "bg-amber-50 text-amber-700" },
          { label: "Cancelled", value: 5, color: "bg-red-50 text-red-700" },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center">
            <p className={cn("text-xl font-bold", s.color.split(" ")[1])}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {!calView ? (
        <Card>
          <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-48 max-w-sm">
              <SearchBar value={search} onChange={setSearch} placeholder="Search patient, doctor..." />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "confirmed", "pending", "in-progress", "completed", "cancelled"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn("px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-all",
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >{f}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHead cols={["", "Patient", "Doctor", "Date & Time", "Type", "Duration", "Status", ""]} />
              <tbody className="divide-y divide-border">
                {filtered.map(apt => (
                  <tr key={apt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="pl-4 pr-2 py-3">
                      <span className="text-[11px] font-mono text-muted-foreground">{apt.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={apt.patient} size="sm" />
                        <span className="text-sm font-medium text-foreground">{apt.patient}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{apt.doctor}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{apt.date}</p>
                      <p className="text-xs text-muted-foreground">{apt.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{apt.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{apt.duration}</td>
                    <td className="px-4 py-3">{apptStatusBadge(apt.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><XCircle className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Showing {filtered.length} of {APPOINTMENTS.length} appointments</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button key={p} className={cn("w-7 h-7 text-xs rounded-lg", p === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{p}</button>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        /* Calendar view */
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
              <h2 className="text-sm font-semibold text-foreground">June 2026</h2>
              <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs text-primary font-medium">Today</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 0; // June 1 starts on Monday (index 1)
              const date = i - 0 + 1;
              const inMonth = date >= 1 && date <= 30;
              const isToday = date === 22;
              const hasAppts = [8, 12, 15, 18, 19, 20, 22, 23].includes(date);
              const apptCount = hasAppts ? Math.floor(Math.random() * 5) + 1 : 0;
              return (
                <div key={i} className={cn(
                  "min-h-16 p-1.5 rounded-lg border transition-colors cursor-pointer",
                  !inMonth ? "opacity-30 border-transparent" : "border-border hover:bg-muted/50",
                  isToday ? "bg-blue-50 border-blue-200" : ""
                )}>
                  <span className={cn("text-xs font-medium block mb-1", isToday ? "text-primary" : inMonth ? "text-foreground" : "text-muted-foreground")}>
                    {inMonth ? date : ""}
                  </span>
                  {inMonth && hasAppts && (
                    <div className="space-y-0.5">
                      <div className="h-1.5 bg-blue-400 rounded-full w-full" />
                      {apptCount > 1 && <div className="h-1.5 bg-teal-400 rounded-full w-3/4" />}
                      {apptCount > 2 && <p className="text-[10px] text-muted-foreground">+{apptCount - 2} more</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Book Appointment Modal */}
      <Modal isOpen={showBook} onClose={() => setShowBook(false)} title="Book New Appointment" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Patient" className="col-span-2" options={PATIENTS.map(p => ({ value: p.id, label: `${p.name} (${p.id})` }))} />
          <Select label="Doctor" options={DOCTORS.map(d => ({ value: d.id, label: d.name }))} />
          <Select label="Appointment Type" options={[
            { value: "consultation", label: "Consultation" },
            { value: "followup", label: "Follow-up" },
            { value: "new", label: "New Patient" },
            { value: "lab", label: "Lab Review" },
            { value: "emergency", label: "Emergency" },
          ]} />
          <Input label="Date" type="date" />
          <Select label="Time Slot" options={["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM"].map(t => ({ value: t, label: t }))} />
          <Select label="Duration" options={[{ value: "30", label: "30 minutes" }, { value: "45", label: "45 minutes" }, { value: "60", label: "60 minutes" }]} />
          <Select label="Consultation Mode" options={[{ value: "in-person", label: "In-person" }, { value: "video", label: "Video call" }, { value: "phone", label: "Phone" }]} />
          <div className="col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes / Chief Complaint</label>
            <textarea rows={3} placeholder="Patient's reason for visit or any notes..." className="w-full bg-input-background border border-border rounded-lg text-sm px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowBook(false)} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="primary" className="flex-1 justify-center" icon={<CalendarPlus className="w-4 h-4" />}>Confirm Booking</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Prescriptions ──────────────────────────────────────────────────────────────

function PrescriptionsView({ navigate }: NavProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">{PRESCRIPTIONS.length} prescriptions on record</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>Print</Btn>
          <Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>Create Prescription</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by patient or medication..." />
        </div>
        <Select options={[{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "expired", label: "Expired" }]} />
      </div>

      <div className="space-y-3">
        {PRESCRIPTIONS.filter(r => r.patient.toLowerCase().includes(search.toLowerCase())).map(rx => (
          <Card key={rx.id} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={rx.patient} size="md" />
                <div>
                  <p className="text-sm font-bold text-foreground">{rx.patient}</p>
                  <p className="text-xs text-muted-foreground">{rx.doctor} · {rx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={rx.status === "active" ? "success" : "neutral"}>{rx.status}</Badge>
                <span className="text-xs text-muted-foreground font-mono">{rx.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {rx.medications.map(med => (
                <div key={med.name} className="flex items-start gap-2 p-3 bg-muted rounded-xl">
                  <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <Pill className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{med.name}</p>
                    <p className="text-[11px] text-muted-foreground">{med.dose} · {med.freq}</p>
                    <p className="text-[10px] text-muted-foreground">{med.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{rx.refills} refill{rx.refills !== 1 ? "s" : ""} remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>PDF</Btn>
                <Btn variant="ghost" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>Print</Btn>
                <Btn variant="outline" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Prescription Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Prescription" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Patient" options={PATIENTS.map(p => ({ value: p.id, label: p.name }))} />
            <Input label="Prescription Date" type="date" value="2026-06-22" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-foreground">Medications</label>
              <Btn variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Add Medication</Btn>
            </div>
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} className="grid grid-cols-4 gap-3 p-3 bg-muted rounded-xl">
                  <Input label="Medication Name" placeholder="e.g. Metformin" className="col-span-2" />
                  <Input label="Dosage" placeholder="e.g. 500mg" />
                  <Select label="Frequency" options={[
                    { value: "od", label: "Once daily" },
                    { value: "bd", label: "Twice daily" },
                    { value: "tds", label: "Three times daily" },
                    { value: "qid", label: "Four times daily" },
                    { value: "prn", label: "As needed" },
                  ]} />
                  <Input label="Duration" placeholder="e.g. 30 days" className="col-span-2" />
                  <Input label="Route" placeholder="e.g. Oral" />
                  <div className="flex items-end">
                    <button className="w-full p-2.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Doctor's Notes / Instructions</label>
            <textarea rows={3} placeholder="Special instructions, warnings, dietary advice..." className="w-full bg-input-background border border-border rounded-lg text-sm px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" />
          </div>

          <Select label="Refills Allowed" options={["0","1","2","3","6","12"].map(v => ({ value: v, label: `${v} refill${parseInt(v) !== 1 ? "s" : ""}` }))} />
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowCreate(false)} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="secondary" className="flex-1 justify-center">Save as Draft</Btn>
          <Btn variant="primary" className="flex-1 justify-center" icon={<FileCheck className="w-4 h-4" />}>Sign & Issue</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Lab Reports ────────────────────────────────────────────────────────────────

function LabReportsView({ navigate }: NavProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Lab Reports</h1>
          <p className="text-sm text-muted-foreground">Diagnostic results & file management</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>Filter</Btn>
          <Btn variant="primary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setShowUpload(true)}>Upload Report</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by patient, test, or doctor..." />
        </div>
        <Select options={[{ value: "all", label: "All Categories" }, { value: "Endocrine", label: "Endocrine" }, { value: "Respiratory", label: "Respiratory" }, { value: "Hematology", label: "Hematology" }]} />
        <Select options={[{ value: "all", label: "All Status" }, { value: "reviewed", label: "Reviewed" }, { value: "ready", label: "Ready" }, { value: "pending", label: "Pending" }]} />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["Report ID", "Patient", "Test", "Doctor", "Date", "Category", "Result", "Status", ""]} />
            <tbody className="divide-y divide-border">
              {LAB_REPORTS.filter(l => l.patient.toLowerCase().includes(search.toLowerCase())).map(lab => (
                <tr key={lab.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{lab.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={lab.patient} size="xs" />
                      <span className="text-sm font-medium text-foreground">{lab.patient}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{lab.test}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{lab.doctor}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{lab.date}</td>
                  <td className="px-4 py-3"><Badge variant="info">{lab.category}</Badge></td>
                  <td className="px-4 py-3 text-xs text-foreground">{lab.result}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lab.status === "reviewed" ? "success" : lab.status === "ready" ? "info" : "warning"}>
                      {lab.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Lab Report" size="md">
        <div className="space-y-4">
          <Select label="Patient" options={PATIENTS.map(p => ({ value: p.id, label: p.name }))} />
          <Select label="Ordering Doctor" options={DOCTORS.map(d => ({ value: d.id, label: d.name }))} />
          <Input label="Test Name" placeholder="e.g. Complete Blood Count" />
          <Select label="Category" options={["Hematology","Biochemistry","Endocrine","Cardiovascular","Respiratory","Microbiology","Radiology"].map(c => ({ value: c, label: c }))} />
          <Input label="Test Date" type="date" />

          {/* File drop zone */}
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-blue-50/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Drop report file here</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DICOM, PNG, JPG — up to 50MB</p>
            <Btn variant="outline" size="sm" className="mt-3">Browse Files</Btn>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">Files are securely stored in Azure Blob Storage and encrypted at rest.</p>
          </div>

          <Input label="Result Summary" placeholder="e.g. WNL — All values within normal range" />
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowUpload(false)} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="primary" className="flex-1 justify-center" icon={<Upload className="w-4 h-4" />}>Upload Report</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Billing ────────────────────────────────────────────────────────────────────

function BillingView({ navigate }: NavProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = INVOICES.filter(i =>
    (filter === "all" || i.status === filter) &&
    i.patient.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = INVOICES.reduce((s, i) => s + i.paid, 0);
  const pendingAmount = INVOICES.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground">Payment management and revenue tracking</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>New Invoice</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Collected" value={`$${(totalRevenue / 1000).toFixed(1)}k`} subtitle="this month" icon={<DollarSign className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" trend="up" trendValue="+7%" />
        <KPICard title="Pending Amount" value={`$${pendingAmount.toFixed(0)}`} subtitle={`${INVOICES.filter(i => i.status !== "paid").length} invoices`} icon={<Clock className="w-5 h-5 text-amber-500" />} color="bg-amber-50" trend="neutral" />
        <KPICard title="Overdue" value="$950" subtitle="1 overdue invoice" icon={<AlertCircle className="w-5 h-5 text-red-500" />} color="bg-red-50" trend="neutral" />
        <KPICard title="Paid Today" value="3" subtitle="invoices settled" icon={<CheckCircle className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="neutral" />
      </div>

      {/* Revenue Chart */}
      <Card className="p-5">
        <SectionHeader title="Revenue Trend" subtitle="January – June 2026" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48 max-w-sm">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by patient or invoice..." />
          </div>
          <div className="flex items-center gap-1.5">
            {["all", "paid", "pending", "overdue"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}>{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["Invoice", "Patient", "Date", "Services", "Amount", "Paid", "Status", ""]} />
            <tbody className="divide-y divide-border">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{inv.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={inv.patient} size="xs" />
                      <span className="text-sm font-medium text-foreground">{inv.patient}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inv.services.map(s => <span key={s} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{s}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">${inv.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">${inv.paid.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "error" : "warning"} dot>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Printer className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      {inv.status !== "paid" && <Btn variant="primary" size="sm">Pay</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Vital Signs ────────────────────────────────────────────────────────────────

function VitalSignsView({ navigate }: NavProps) {
  const [showRecord, setShowRecord] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vital Signs</h1>
          <p className="text-sm text-muted-foreground">Patient health metrics and trend monitoring</p>
        </div>
        <Btn variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowRecord(true)}>Record Vitals</Btn>
      </div>

      {/* Patient selector */}
      <Card className="p-4 flex items-center gap-4">
        <Avatar name="Margaret Sullivan" size="md" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Margaret Sullivan</p>
          <p className="text-xs text-muted-foreground">P001 · 54 years · Female · A+</p>
        </div>
        <Btn variant="outline" size="sm">Change Patient</Btn>
      </Card>

      {/* Current vitals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Blood Pressure", value: "118/75", unit: "mmHg", icon: Heart, status: "normal", statusColor: "text-emerald-600", bg: "bg-rose-50", iconColor: "text-rose-500", last: "Jun 22, 09:00 AM" },
          { label: "Heart Rate", value: "72", unit: "bpm", icon: Activity, status: "normal", statusColor: "text-emerald-600", bg: "bg-red-50", iconColor: "text-red-500", last: "Jun 22, 09:00 AM" },
          { label: "Blood Glucose", value: "138", unit: "mg/dL", icon: Thermometer, status: "borderline", statusColor: "text-amber-600", bg: "bg-amber-50", iconColor: "text-amber-500", last: "Jun 22, 08:30 AM" },
          { label: "SpO2", value: "98", unit: "%", icon: Wind, status: "normal", statusColor: "text-emerald-600", bg: "bg-blue-50", iconColor: "text-blue-500", last: "Jun 22, 09:00 AM" },
        ].map(v => (
          <Card key={v.label} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", v.bg)}>
                <v.icon className={cn("w-4 h-4", v.iconColor)} />
              </div>
              <span className={cn("text-xs font-medium", v.statusColor)}>{v.status}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{v.value}</p>
            <p className="text-xs text-muted-foreground">{v.unit} · {v.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{v.last}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionHeader title="Blood Pressure History" subtitle="Systolic / Diastolic — last 30 days" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bpData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 160]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: "#EF4444" }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: "#3B82F6" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Vital History Log" subtitle="Recent recordings" />
          <div className="space-y-2">
            {[
              { date: "Jun 22, 09:00 AM", bp: "118/75", hr: 72, spo2: 98, glucose: 138, weight: 68.4, by: "Nurse Kelly" },
              { date: "Jun 20, 10:00 AM", bp: "122/80", hr: 74, spo2: 97, glucose: 145, weight: 68.6, by: "Dr. Chen" },
              { date: "Jun 15, 11:30 AM", bp: "125/82", hr: 76, spo2: 98, glucose: 151, weight: 69.0, by: "Dr. Chen" },
            ].map((r, i) => (
              <div key={i} className="p-3 bg-muted rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">{r.date}</p>
                  <p className="text-[10px] text-muted-foreground">by {r.by}</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[{ label: "BP", value: r.bp }, { label: "HR", value: `${r.hr} bpm` }, { label: "SpO2", value: `${r.spo2}%` }, { label: "Glucose", value: `${r.glucose} mg/dL` }].map(v => (
                    <div key={v.label}>
                      <p className="text-[10px] text-muted-foreground">{v.label}</p>
                      <p className="text-xs font-semibold text-foreground">{v.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Record Vitals Modal */}
      <Modal isOpen={showRecord} onClose={() => setShowRecord(false)} title="Record Vital Signs" size="md">
        <div className="mb-3 p-3 bg-muted rounded-xl flex items-center gap-3">
          <Avatar name="Margaret Sullivan" size="sm" />
          <div>
            <p className="text-xs font-semibold text-foreground">Margaret Sullivan</p>
            <p className="text-[11px] text-muted-foreground">P001 · Jun 22, 2026</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Systolic BP (mmHg)" placeholder="e.g. 118" />
          <Input label="Diastolic BP (mmHg)" placeholder="e.g. 75" />
          <Input label="Heart Rate (bpm)" placeholder="e.g. 72" />
          <Input label="SpO2 (%)" placeholder="e.g. 98" />
          <Input label="Temperature (°F)" placeholder="e.g. 98.6" />
          <Input label="Respiratory Rate (/min)" placeholder="e.g. 16" />
          <Input label="Blood Glucose (mg/dL)" placeholder="e.g. 138" />
          <Input label="Weight (kg)" placeholder="e.g. 68.4" />
          <Input label="Height (cm)" placeholder="e.g. 165" />
          <Input label="BMI" placeholder="Auto-calculated" disabled />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
          <textarea rows={2} placeholder="Any observations..." className="w-full bg-input-background border border-border rounded-lg text-sm px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" />
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowRecord(false)} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="primary" className="flex-1 justify-center" icon={<CheckCircle className="w-4 h-4" />}>Save Vitals</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Notifications ──────────────────────────────────────────────────────────────

function NotificationsView({ navigate }: NavProps) {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unread = notifications.filter(n => !n.read).length;

  const notifIcon = (type: string) => {
    const icons: Record<string, { icon: any; bg: string; color: string }> = {
      appointment: { icon: Calendar, bg: "bg-blue-50", color: "text-blue-500" },
      lab: { icon: TestTube, bg: "bg-teal-50", color: "text-teal-500" },
      message: { icon: MessageSquare, bg: "bg-violet-50", color: "text-violet-500" },
      billing: { icon: CreditCard, bg: "bg-emerald-50", color: "text-emerald-500" },
      alert: { icon: AlertCircle, bg: "bg-red-50", color: "text-red-500" },
    };
    return icons[type] || icons.appointment;
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread notification{unread !== 1 ? "s" : ""}</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}>
          Mark all as read
        </Btn>
      </div>

      {["Today", "Earlier"].map(group => (
        <div key={group}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group}</p>
          <Card>
            <div className="divide-y divide-border">
              {notifications
                .filter(n => group === "Today" ? !n.time.includes("Yesterday") : n.time.includes("Yesterday"))
                .map(n => {
                  const { icon: Icon, bg, color } = notifIcon(n.type);
                  return (
                    <div
                      key={n.id}
                      className={cn("flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/30", !n.read && "bg-blue-50/40")}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", bg)}>
                        <Icon className={cn("w-4 h-4", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-medium", n.read ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
                          {n.priority === "critical" && <Badge variant="error">Critical</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

// ─── Staff Messaging ────────────────────────────────────────────────────────────

function MessagingView({ navigate }: NavProps) {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");

  const conversation = [
    { from: "Dr. James Okonkwo", me: false, text: "Can you pull up the last PFT results for Harrington?", time: "10:32 AM" },
    { from: "Dr. Sarah Chen", me: true, text: "Sure, pulling them up now. FEV1 was 78% predicted on Jun 19.", time: "10:34 AM" },
    { from: "Dr. James Okonkwo", me: false, text: "Thanks. And can you check if we have his allergen panel from last year?", time: "10:35 AM" },
    { from: "Dr. Sarah Chen", me: true, text: "Yes — allergen panel from Aug 2025 showed sensitivity to dust mites and cat dander. No drug allergies noted.", time: "10:37 AM" },
    { from: "Dr. James Okonkwo", me: false, text: "Perfect. I'll factor that in. Appreciate it!", time: "10:38 AM" },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversation list */}
      <Card className="w-72 flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <SearchBar placeholder="Search messages..." />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {MESSAGES.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelected(i)}
              className={cn("w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left", selected === i && "bg-blue-50")}
            >
              <div className="relative shrink-0">
                <Avatar name={m.from} size="md" />
                {m.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-card" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground truncate">{m.from}</p>
                  <p className="text-[10px] text-muted-foreground shrink-0 ml-1">{m.time}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{m.role}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{m.preview}</p>
              </div>
              {m.unread > 0 && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">{m.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative">
            <Avatar name={MESSAGES[selected].from} size="md" />
            {MESSAGES[selected].online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-card" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{MESSAGES[selected].from}</p>
            <p className="text-xs text-muted-foreground">{MESSAGES[selected].role} · {MESSAGES[selected].online ? "Online" : "Offline"}</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Phone className="w-4 h-4 text-muted-foreground" /></button>
            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {conversation.map((msg, i) => (
            <div key={i} className={cn("flex items-end gap-2.5", msg.me && "flex-row-reverse")}>
              {!msg.me && <Avatar name={msg.from} size="xs" />}
              <div className={cn("max-w-xs lg:max-w-sm xl:max-w-md")}>
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.me
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
                <p className={cn("text-[10px] text-muted-foreground mt-1", msg.me && "text-right")}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2.5">
            <button className="text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-4 h-4" /></button>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setMessage(""); } }}
              placeholder="Type a message... (Enter to send)"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all", message ? "bg-primary text-white" : "text-muted-foreground")}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── User Management ────────────────────────────────────────────────────────────

function UserManagementView({ navigate }: NavProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const ROLE_BADGE: Record<string, BadgeVariant> = { admin: "error", doctor: "info", receptionist: "teal", patient: "neutral" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">{USERS.length} system users</p>
        </div>
        <Btn variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>Create User</Btn>
      </div>

      <Card>
        <div className="px-5 py-3 border-b border-border flex items-center gap-3">
          <div className="flex-1 max-w-sm">
            <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
          </div>
          <Select options={[{ value: "all", label: "All Roles" }, { value: "admin", label: "Admin" }, { value: "doctor", label: "Doctor" }, { value: "receptionist", label: "Receptionist" }]} />
          <Select options={[{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        </div>

        <table className="w-full">
          <TableHead cols={["User", "Role", "Department", "Status", "Last Login", ""]} />
          <tbody className="divide-y divide-border">
            {USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_BADGE[u.role] || "neutral"} className="capitalize">{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.dept}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === "active" ? "success" : "neutral"} dot>{u.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Key className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="Maria" />
            <Input label="Last Name" placeholder="Ross" />
          </div>
          <Input label="Email Address" placeholder="user@hapm.hospital" icon={<Mail className="w-4 h-4" />} type="email" />
          <Select label="Role" options={[{ value: "admin", label: "Administrator" }, { value: "doctor", label: "Doctor" }, { value: "receptionist", label: "Receptionist" }, { value: "nurse", label: "Nurse" }]} />
          <Select label="Department" options={["Administration","Cardiology","Internal Medicine","Endocrinology","Orthopedics","Neurology","Front Desk","Nursing"].map(d => ({ value: d, label: d }))} />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">A temporary password will be emailed to the user. They must change it on first login.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowCreate(false)} className="flex-1 justify-center">Cancel</Btn>
          <Btn variant="primary" className="flex-1 justify-center" icon={<UserPlus className="w-4 h-4" />}>Create User</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────────

function AuditLogsView({ navigate }: NavProps) {
  const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
    access: "info", create: "success", write: "teal", export: "warning", delete: "error"
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Complete system activity trail — HIPAA compliant</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export CSV</Btn>
          <Btn variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>Filters</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchBar placeholder="Search by user, action, or resource..." />
        <Select options={[{ value: "all", label: "All Categories" }, { value: "access", label: "Access" }, { value: "create", label: "Create" }, { value: "write", label: "Write" }, { value: "export", label: "Export" }]} />
        <Input type="date" />
      </div>

      <Card>
        <table className="w-full">
          <TableHead cols={["User", "Action", "Resource", "Category", "IP Address", "Timestamp"]} />
          <tbody className="divide-y divide-border">
            {AUDIT_LOGS.map(log => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={log.user} size="xs" />
                    <span className="text-xs font-medium text-foreground">{log.user}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-foreground">{log.action}</td>
                <td className="px-4 py-3 text-xs text-primary font-medium">{log.resource}</td>
                <td className="px-4 py-3">
                  <Badge variant={CATEGORY_VARIANT[log.category] || "neutral"} className="capitalize">{log.category}</Badge>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.ip}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing 6 of 4,821 log entries</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "...", 804].map((p, i) => (
              <button key={i} className={cn("w-7 h-7 text-xs rounded-lg", p === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Profile Settings ────────────────────────────────────────────────────────────

function ProfileSettingsView({ navigate, role }: NavProps) {
  const user = ROLE_USERS[role];
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-foreground">Profile & Settings</h1>

      <div className="flex gap-4">
        {/* Sidebar sections */}
        <div className="w-44 space-y-1 shrink-0">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: Lock },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "appearance", label: "Appearance", icon: Monitor },
          ].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              activeSection === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}>
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          {activeSection === "profile" && (
            <>
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Profile Information</h2>
                <div className="flex items-center gap-4 mb-5">
                  <Avatar name={user.name} size="lg" />
                  <div>
                    <Btn variant="outline" size="sm" icon={<Camera className="w-3.5 h-3.5" />}>Change Photo</Btn>
                    <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG — max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={user.name.split(" ")[0]} />
                  <Input label="Last Name" value={user.name.split(" ").slice(1).join(" ")} />
                  <Input label="Email Address" value={user.email} icon={<Mail className="w-4 h-4" />} />
                  <Input label="Phone" value="+1 (555) 100-2000" icon={<Phone className="w-4 h-4" />} />
                  <Input label="Title / Role" value={user.title} className="col-span-2" />
                </div>
                <div className="mt-4 flex justify-end">
                  <Btn variant="primary" size="md" icon={<CheckCircle className="w-4 h-4" />}>Save Changes</Btn>
                </div>
              </Card>
            </>
          )}

          {activeSection === "security" && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Security Settings</h2>
              <div className="space-y-4">
                <Input label="Current Password" type="password" icon={<Lock className="w-4 h-4" />} />
                <Input label="New Password" type="password" icon={<Lock className="w-4 h-4" />} />
                <Input label="Confirm New Password" type="password" icon={<Lock className="w-4 h-4" />} />
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs font-medium text-primary mb-1">Password requirements</p>
                  <ul className="text-xs text-blue-600 space-y-0.5">
                    <li>• Minimum 12 characters</li>
                    <li>• Include uppercase, lowercase, numbers, and symbols</li>
                    <li>• Cannot reuse last 5 passwords</li>
                  </ul>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Secure your account with TOTP authenticator</p>
                  </div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                <div className="flex justify-end">
                  <Btn variant="primary" size="md">Update Password</Btn>
                </div>
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "Appointment Reminders", desc: "Get notified 30 minutes before appointments", enabled: true },
                  { label: "Lab Results Ready", desc: "When patient lab results are available for review", enabled: true },
                  { label: "New Messages", desc: "Real-time alerts for incoming staff messages", enabled: true },
                  { label: "Billing Updates", desc: "Payment confirmations and overdue alerts", enabled: false },
                  { label: "System Announcements", desc: "Platform updates and maintenance notices", enabled: true },
                ].map(pref => (
                  <div key={pref.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                    <div className={cn("w-10 h-6 rounded-full cursor-pointer transition-colors relative", pref.enabled ? "bg-primary" : "bg-muted")}>
                      <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all", pref.enabled ? "left-5" : "left-1")} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Light", "Dark", "System"].map(t => (
                      <button key={t} className={cn("p-3 rounded-xl border text-xs font-medium text-center transition-all",
                        t === "Light" ? "border-primary bg-blue-50 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      )}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Interface Density</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Compact", "Default", "Comfortable"].map(d => (
                      <button key={d} className={cn("p-3 rounded-xl border text-xs font-medium text-center transition-all",
                        d === "Default" ? "border-primary bg-blue-50 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      )}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View Router ────────────────────────────────────────────────────────────────

function renderView(view: View, props: NavProps) {
  switch (view) {
    case "admin-dashboard": return <AdminDashboard {...props} />;
    case "doctor-dashboard": return <DoctorDashboard {...props} />;
    case "patient-dashboard": return <PatientDashboard {...props} />;
    case "receptionist-dashboard": return <ReceptionistDashboard {...props} />;
    case "patient-list": return <PatientList {...props} />;
    case "patient-profile": return <PatientProfile {...props} />;
    case "doctor-list": return <DoctorList {...props} />;
    case "doctor-profile": return <DoctorProfile {...props} />;
    case "appointments": return <AppointmentsView {...props} />;
    case "prescriptions": return <PrescriptionsView {...props} />;
    case "lab-reports": return <LabReportsView {...props} />;
    case "billing": return <BillingView {...props} />;
    case "vitals": return <VitalSignsView {...props} />;
    case "notifications": return <NotificationsView {...props} />;
    case "messaging": return <MessagingView {...props} />;
    case "user-management": return <UserManagementView {...props} />;
    case "audit-logs": return <AuditLogsView {...props} />;
    case "profile-settings": return <ProfileSettingsView {...props} />;
    default: return <AdminDashboard {...props} />;
  }
}

// ─── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState<View>("login");
  const [currentRole, setCurrentRole] = useState<Role>("admin");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = (view: View) => setCurrentView(view);

  const handleLogin = (role: Role) => {
    setCurrentRole(role);
    const dashboards: Record<Role, View> = {
      admin: "admin-dashboard",
      doctor: "doctor-dashboard",
      patient: "patient-dashboard",
      receptionist: "receptionist-dashboard",
    };
    setCurrentView(dashboards[role]);
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    const dashboards: Record<Role, View> = {
      admin: "admin-dashboard",
      doctor: "doctor-dashboard",
      patient: "patient-dashboard",
      receptionist: "receptionist-dashboard",
    };
    setCurrentView(dashboards[role]);
  };

  if (currentView === "login") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const navProps: NavProps = { navigate, role: currentRole };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar
        role={currentRole}
        currentView={currentView}
        navigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          role={currentRole}
          currentView={currentView}
          navigate={navigate}
          onRoleChange={handleRoleChange}
        />
        <main className="flex-1 overflow-y-auto p-5 scrollbar-none">
          {renderView(currentView, navProps)}
        </main>
      </div>
    </div>
  );
}
