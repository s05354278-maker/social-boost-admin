import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Cloud,
  CreditCard,
  Database,
  ExternalLink,
  FileClock,
  Film,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Package,
  Palette,
  PanelLeft,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  MessageCircle,
  Mail,
  Network,
  Bot,
  Workflow,
  CreditCard as CreditCard2,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";

/**
 * SocialBoost Admin Frontend
 * -------------------------------------------------------------
 * Full 3-tier A -> B -> C hierarchy management:
 * Services (Platforms) -> Variants -> Sub-variants (Quality & Description Images).
 */

// ========================================================
// SECURITY LAYERS
// ========================================================

// 1. Transport Security
const adminRuntimeApiUrl = import.meta.env?.VITE_ADMIN_API_URL;
if (!adminRuntimeApiUrl && import.meta.env?.PROD) {
  console.error("[FATAL] VITE_ADMIN_API_URL is missing in production environment.");
}
const BACKEND_CONFIG = {
  baseUrl: (adminRuntimeApiUrl || 'http://localhost:4000/api').replace(/\/+$/, ''),
  timeoutMs: 15000,
};

// 2. Standardized Storage Access
const secureAdminStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch { return null; }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {}
  },
  removeItem: (key) => {
    try { window.localStorage.removeItem(key); } catch {}
  }
};

// 3. Payload Sanitization
// NOTE: deepSanitize functions strictly as a client-side display-level filter. The server authoritatively validates and sanitizes all inputs.
const deepSanitize = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .replace(/<\/?script[^>]*>/gi, '')
      .replace(/on[a-z]+=/gi, 'data-blocked=')
      .replace(/(javascript|data|vbscript):/gi, 'blocked:');
  }
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const k in obj) clean[k] = deepSanitize(obj[k]);
    return clean;
  }
  return obj;
};

// 4. Action Debouncing
const _debounceLocks = {};
const checkDebounce = (key, ms = 800) => {
  if (_debounceLocks[key]) return true;
  _debounceLocks[key] = true;
  setTimeout(() => { _debounceLocks[key] = false; }, ms);
  return false;
};

// 5. PII Masking
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

const API = {
  dashboard: "/admin/dashboard",
  users: "/admin/users",
  user: (id) => `/admin/users/${encodeURIComponent(id)}`,
  userRestrict: (id) => `/admin/users/${encodeURIComponent(id)}/restrict`,
  manualCredit: "/admin/users/manual-credit",
  payments: "/admin/payments",
  paymentVerify: (id) => `/admin/payments/${encodeURIComponent(id)}/verify`,
  transactions: "/admin/transactions",
  orders: "/admin/orders",
  order: (id) => `/admin/orders/${encodeURIComponent(id)}`,
  services: "/admin/services",
  service: (id) => `/admin/services/${encodeURIComponent(id)}`,
  content: "/admin/content",
  contentItem: (id) => `/admin/content/${encodeURIComponent(id)}`,
  primaryContent: "/admin/content/primary",
  banners: "/admin/banners",
  banner: (id) => `/admin/banners/${encodeURIComponent(id)}`,
  packages: "/admin/packages",
  package: (id) => `/admin/packages/${encodeURIComponent(id)}`,
  reviews: "/admin/reviews",
  review: (id) => `/admin/reviews/${encodeURIComponent(id)}`,
  faq: "/admin/faq",
  faqItem: (id) => `/admin/faq/${encodeURIComponent(id)}`,
  config: "/admin/config",
  redfamosaStatus: "/admin/redfamosa/status",
  redfamosaServices: "/admin/redfamosa/services",
  redfamosaSync: "/admin/redfamosa/sync",
  redfamosaBalance: "/admin/redfamosa/balance",
  redfamosaCrmStatus: "/admin/redfamosa/crm/status",
  redfamosaChannels: "/admin/redfamosa/crm/channels",
  redfamosaInbox: "/admin/redfamosa/crm/inbox",
  redfamosaAi: "/admin/redfamosa/crm/ai",
  redfamosaFlows: "/admin/redfamosa/crm/flows",
  redfamosaResellers: "/admin/redfamosa/resellers",
  redfamosaPlans: "/admin/redfamosa/reseller-plans",
  redfamosaBilling: "/admin/redfamosa/billing",
  redfamosaDomains: "/admin/redfamosa/domains",
  redfamosaSecurity: "/admin/redfamosa/security",
  redfamosaLanguages: "/admin/redfamosa/languages",
  redfamosaJobs: "/admin/redfamosa/jobs",
  serviceLayout: (id) => `/admin/services/${encodeURIComponent(id)}/layout`,
  serviceVariants: (serviceId) => `/admin/services/${encodeURIComponent(serviceId)}/variants`,
  serviceVariant: (serviceId, variantId) => `/admin/services/${encodeURIComponent(serviceId)}/variants/${encodeURIComponent(variantId)}`,
  serviceSubVariants: (serviceId, variantId) => `/admin/services/${encodeURIComponent(serviceId)}/variants/${encodeURIComponent(variantId)}/sub-variants`,
  serviceSubVariant: (serviceId, variantId, subVariantId) => `/admin/services/${encodeURIComponent(serviceId)}/variants/${encodeURIComponent(variantId)}/sub-variants/${encodeURIComponent(subVariantId)}`,
};

const initialData = {
  dashboard: {
    revenueToday: 0,
    revenueMonth: 0,
    paymentsToday: 0,
    activeOrders: 0,
    completedOrders: 0,
    users: 0,
  },
  users: [],
  payments: [],
  transactions: [],
  orders: [],
  services: [
    { id: "youtube", name: "Video Discovery", category: "YouTube", displayLayout: "row", status: "Active", variants: [] },
    { id: "instagram", name: "Short-Form Social Reach", category: "Instagram", displayLayout: "row", status: "Active", variants: [] },
  ],
  content: [
    { id: "hero-1", title: "Homepage hero", type: "Text", status: "Published", updated: "2 min ago" },
    { id: "promo-1", title: "Festival promotion", type: "Banner", status: "Published", updated: "4 hr ago" },
    { id: "video-1", title: "Intro video block", type: "Video", status: "Draft", updated: "Yesterday" },
    { id: "blank-1", title: "Fallback content block", type: "Dynamic", status: "Published", updated: "Yesterday" },
  ],
  packages: [
    { id: "pkg_1", pts: 100, priceNumeric: 99, bonus: "Unlocks Level 2" },
    { id: "pkg_2", pts: 500, priceNumeric: 499, bonus: "+5% extra" },
    { id: "pkg_3", pts: 1000, priceNumeric: 999, bonus: "+10% extra" }
  ],
  reviews: [
    { id: "rev_1", name: "Farhan Ali", role: "Telegram admin", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80", review: "Channel members came in steady, not all at once - looked completely organic.", rating: 5 },
    { id: "rev_2", name: "Meera Joshi", role: "Facebook page owner", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&fit=crop&q=80", review: "Support replied on WhatsApp within minutes when I had a question about my order.", rating: 5 },
    { id: "rev_3", name: "Rajat Verma", role: "Content Creator", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&fit=crop&q=80", review: "Bhai maza aa gaya, Instagram reels views real lag rahe the bilkul. Highly recommended!", rating: 5 },
    { id: "rev_4", name: "Sneha Patel", role: "Makeup Artist", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1b28ce?w=100&fit=crop&q=80", review: "Delivery was super fast. Mujhe laga tha fake lagega but followers profile achhe dikh rahe hain. Will use again.", rating: 5 },
    { id: "rev_5", name: "Aryan Singh", role: "Gaming Streamer", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop&q=80", review: "Pehle doubt tha thoda, but YouTube subscribers jaldi deliver hue aur drop bhi nahi hue. Customer support bhi fast hai yaar.", rating: 5 }
  ],
  faq: [
    { id: "faq_1", question: "How fast are orders delivered?", answer: "Most orders begin processing within 5–15 minutes automatically." },
    { id: "faq_2", question: "Do you need my account password?", answer: "Never. We only need the public link or username." }
  ],
};

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const token = secureAdminStorage.getItem("socialboost_admin_token");
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BACKEND_CONFIG.baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const raw = await response.text();
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }

    if (!response.ok) {
      if (response.status === 401) {
        secureAdminStorage.removeItem("socialboost_admin_token");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("socialboost:admin_unauthorized"));
        }
      }
      throw new Error(body?.message || body?.error || `Request failed (${response.status})`);
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

const adminApi = {
  get: (path) => apiFetch(path),
  save: (path, payload) => apiFetch(path, { method: "PUT", body: JSON.stringify(deepSanitize(payload)) }),
  create: (path, payload) => apiFetch(path, { method: "POST", body: JSON.stringify(deepSanitize(payload)) }),
  remove: (path) => apiFetch(path, { method: "DELETE" }),
};

const normalizeList = (result, keys = []) => {
  const payload = result?.data ?? result;
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function statusTone(status) {
  const map = {
    Success: "green",
    Completed: "green",
    Active: "green",
    Connected: "green",
    Processing: "amber",
    Pending: "amber",
    Partial: "purple",
    Failed: "red",
    Blocked: "red",
    Draft: "slate",
    "Not sent": "red",
    Waiting: "amber",
  };
  return map[status] || "slate";
}

function StatusPill({ status }) {
  const safeStatus = status || "Unknown";
  const tone = statusTone(safeStatus);
  return <span className={`status-pill ${tone}`}><span className="dot" />{safeStatus}</span>;
}

function PaymentMethodPill({ method }) {
  const m = String(method || "Razorpay").trim();
  const lower = m.toLowerCase();
  let tone = "slate";
  let label = m;

  if (lower.includes("google") || lower.includes("play")) {
    tone = "green";
    label = "Google Play";
  } else if (lower.includes("upi")) {
    tone = "blue";
    label = "UPI";
  } else if (lower.includes("card")) {
    tone = "purple";
    label = "Card";
  } else if (lower.includes("razorpay")) {
    tone = "slate";
    label = "Razorpay";
  }

  return (
    <span
      className={`status-pill ${tone}`}
      style={
        lower.includes("google") || lower.includes("play")
          ? { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontWeight: 700 }
          : lower.includes("upi")
          ? { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: 700 }
          : lower.includes("card")
          ? { background: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", fontWeight: 700 }
          : { fontWeight: 700 }
      }
    >
      <span
        className="dot"
        style={
          lower.includes("google") || lower.includes("play")
            ? { background: "#10b981" }
            : lower.includes("upi")
            ? { background: "#3b82f6" }
            : lower.includes("card")
            ? { background: "#a855f7" }
            : {}
        }
      />
      {label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, detail, trend, tone = "blue" }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      <div className="metric-main">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-detail">{trend ? <span className="trend">↗ {trend}</span> : null}{detail}</div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title-row">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = Database, title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Drawer({ open, title, subtitle, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className={cn("drawer", wide && "drawer-wide")} onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="toast">
      <CheckCircle2 size={18} />
      <div><strong>{toast.title}</strong><span>{toast.message}</span></div>
      <button className="icon-button" onClick={onClose}><X size={15} /></button>
    </div>
  );
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "transactions", label: "Transactions", icon: FileClock },
  { id: "orders", label: "Orders", icon: Package },
  { id: "services", label: "Services & Grids", icon: Boxes },
  { id: "content", label: "App & UI/UX", icon: Palette },
  { id: "redfamosa", label: "Red Famosa", icon: Link2 },
  { id: "crm", label: "CRM & Inbox", icon: MessageCircle },
  { id: "resellers", label: "Reseller Network", icon: Network },
  { id: "settings", label: "Settings", icon: Settings },
];

function SocialBoostAdmin({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [backendMode, setBackendMode] = useState("connecting");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const pageMeta = useMemo(() => navItems.find((item) => item.id === page) || navItems[0], [page]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await apiFetch(API.dashboard);
        if (!cancelled && result) {
          setData((current) => ({ ...current, dashboard: { ...current.dashboard, ...(result.data || result) } }));
          setBackendMode("live");
        }
      } catch {
        if (!cancelled) setBackendMode("offline");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function notify(title, message) {
    setToast({ title, message });
    window.clearTimeout(window.__sbToast);
    window.__sbToast = window.setTimeout(() => setToast(null), 3500);
  }

  async function refreshSection(section, endpoint) {
    try {
      const result = await apiFetch(endpoint);
      const payload = result?.data || result;
      if (Array.isArray(payload)) {
        setData((current) => ({ ...current, [section]: payload }));
      }
      setBackendMode("live");
      notify("Backend connected", `${section} data loaded from your API.`);
    } catch (error) {
      notify("Notice", error.message || "Backend is not reachable yet.");
    }
  }

  async function syncRedFamosa() {
    setSyncing(true);
    try {
      const result = await apiFetch(API.redfamosaSync, { method: "POST", body: JSON.stringify({ scope: "services,status,balance" }) });
      notify("Red Famosa sync started", result?.message || "Your backend accepted the synchronization request.");
    } catch (error) {
      notify("Sync unavailable", error.message || "Connect your backend integration first.");
    } finally {
      setSyncing(false);
    }
  }

  function navigate(id) {
    setPage(id);
    setMobileMenu(false);
  }

  const currentData = Array.isArray(data[page]) ? data[page] : [];

  return (
    <div className="app-shell">
      <style>{styles}</style>

      <aside className={cn("sidebar", !sidebarOpen && "sidebar-collapsed", mobileMenu && "mobile-open")}>
        <div className="brand-block">
          <div className="brand-mark"><Zap size={18} fill="currentColor" /></div>
          {sidebarOpen ? <div><div className="brand-name">SocialBoost</div><div className="brand-sub">ADMIN CONTROL CENTER</div></div> : null}
        </div>

        <div className="workspace-switch">
          <div className="workspace-logo">SB</div>
          {sidebarOpen ? <><div className="workspace-copy"><strong>Production</strong><span>Primary app</span></div><ChevronDown size={16} /></> : null}
        </div>

        {sidebarOpen ? <div className="nav-label">CONTROL</div> : null}
        <nav className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={cn("nav-item", page === id && "active")} onClick={() => navigate(id)} title={sidebarOpen ? undefined : label}>
              <Icon size={18} />
              {sidebarOpen ? <span>{label}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen ? <div className="health-mini"><span className="live-dot" /><div><strong>System healthy</strong><span>{backendMode === "live" ? "Backend connected" : (backendMode === "connecting" ? "Connecting..." : "Offline mode")}</span></div></div> : null}
          <button className="nav-item" onClick={() => {
            secureAdminStorage.removeItem("socialboost_admin_token");
            if (onLogout) onLogout();
            else window.location.reload();
          }}><LogOut size={18} />{sidebarOpen ? <span>Sign out</span> : null}</button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-only" onClick={() => setMobileMenu((v) => !v)}><Menu size={20} /></button>
            <button className="icon-button desktop-only" onClick={() => setSidebarOpen((v) => !v)}><PanelLeft size={19} /></button>
            <div className="breadcrumbs"><span>Admin</span><span>/</span><strong>{pageMeta.label}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="connection-chip"><span className={cn("dot", backendMode === "live" ? "green" : (backendMode === "connecting" ? "amber" : "red"))} />{backendMode === "live" ? "Backend connected" : (backendMode === "connecting" ? "Connecting..." : "Offline")}</div>
            <button className="icon-button"><Bell size={18} /></button>
            <div className="admin-avatar">SA</div>
          </div>
        </header>

        <div className="page-content">
          {page === "dashboard" && (
            <DashboardPage data={data.dashboard} loading={loading} onRefresh={() => refreshSection("dashboard", API.dashboard)} onNavigate={navigate} />
          )}
          {page === "users" && (
            <UsersPage data={currentData} search={globalSearch} onSearch={setGlobalSearch} onRefresh={() => refreshSection("users", API.users)} onOpen={(user) => setDrawer({ type: "user", user })} />
          )}
          {page === "payments" && (
            <PaymentsPage data={currentData} onRefresh={() => refreshSection("payments", API.payments)} onOpen={(payment) => setDrawer({ type: "payment", payment })} notify={notify} />
          )}
          {page === "transactions" && (
            <TransactionsPage data={currentData} onRefresh={() => refreshSection("transactions", API.transactions)} />
          )}
          {page === "orders" && (
            <OrdersPage
              data={currentData}
              onRefresh={() => refreshSection("orders", API.orders)}
              notify={notify}
              onOrderUpdated={(updatedOrder) => {
                setData((cur) => ({
                  ...cur,
                  orders: (cur.orders || []).map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
                }));
              }}
            />
          )}
          {page === "services" && (
            <ServicesPage data={currentData} onRefresh={() => refreshSection("services", API.services)} onOpen={(service) => setDrawer({ type: "service", service })} notify={notify} />
          )}
          {page === "content" && (
            <ContentPage data={currentData} onRefresh={() => refreshSection("content", API.content)} onOpen={(item) => setDrawer({ type: "content", item })} notify={notify} />
          )}
          {page === "redfamosa" && (
            <RedFamosaPage onSync={syncRedFamosa} syncing={syncing} onRefresh={() => refreshSection("redfamosa", API.redfamosaStatus)} notify={notify} />
          )}
          {page === "settings" && <SettingsPage notify={notify} />}
          {page === "crm" && <RedFamosaCRMPage notify={notify} />}
          {page === "resellers" && <ResellerNetworkPage notify={notify} />}
        </div>
      </main>

      <Drawer
        open={Boolean(drawer)}
        title={drawer?.type === "user" ? "User profile" : drawer?.type === "payment" ? "Payment details" : drawer?.type === "service" ? (drawer?.service?.__layoutEditor ? "Service grid editor" : "Service configuration") : "Content block"}
        subtitle="Backend-ready detail drawer"
        onClose={() => setDrawer(null)}
        wide={drawer?.type === "content"}
      >
        {drawer?.type === "user" ? (
          <UserDrawer
            user={drawer.user}
            notify={notify}
            onUserUpdated={(updatedUser, newTx) => {
              setData((cur) => ({
                ...cur,
                users: (cur.users || []).map((u) => (u.id === updatedUser.id || u.email === updatedUser.email ? { ...u, ...updatedUser } : u)),
                transactions: newTx ? [newTx, ...(cur.transactions || [])] : (cur.transactions || [])
              }));
              setDrawer((cur) => (cur?.type === "user" && (cur.user.id === updatedUser.id || cur.user.email === updatedUser.email) ? { ...cur, user: { ...cur.user, ...updatedUser } } : cur));
            }}
          />
        ) : null}
        {drawer?.type === "payment" ? <PaymentDrawer payment={drawer.payment} notify={notify} /> : null}
        {drawer?.type === "service" ? (drawer.service.__layoutEditor ? <ServiceLayoutDrawer service={drawer.service} notify={notify} /> : <ServiceDrawer service={drawer.service} notify={notify} />) : null}
        {drawer?.type === "content" ? (
          <ContentDrawer
            item={drawer.item}
            notify={notify}
            onContentUpdated={(updated) => {
              setData((cur) => ({
                ...cur,
                content: (cur.content || []).map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
              }));
              setDrawer((cur) => (cur?.type === "content" && cur.item.id === updated.id ? { ...cur, item: { ...cur.item, ...updated } } : cur));
            }}
          />
        ) : null}
      </Drawer>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function DashboardPage({ data, loading, onRefresh, onNavigate }) {
  return (
    <>
      <SectionTitle
        eyebrow="OVERVIEW"
        title="Good evening, Admin"
        description="Your operational command center for payments, app control, orders, and Red Famosa connectivity."
        action={<button className="button secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>}
      />

      <div className="notice-strip">
        <div className="notice-icon"><ShieldCheck size={18} /></div>
        <div><strong>Architecture ready for your backend</strong><span>The frontend talks to your API only. Payment secrets and Red Famosa credentials stay server-side.</span></div>
        <span className="backend-badge">{loading ? "Checking…" : "API BLOCKS READY"}</span>
      </div>

      <div className="metric-grid">
        <MetricCard icon={CircleDollarSign} label="Revenue today" value={currency(data.revenueToday)} detail="from verified payments" trend="8.4%" tone="green" />
        <MetricCard icon={CreditCard} label="Payments today" value={data.paymentsToday.toLocaleString("en-IN")} detail="successful + pending" trend="12.1%" tone="blue" />
        <MetricCard icon={Activity} label="Active orders" value={data.activeOrders.toLocaleString("en-IN")} detail="synced from Red Famosa" tone="purple" />
        <MetricCard icon={Users} label="App users" value={data.users.toLocaleString("en-IN")} detail="registered customers" trend="4.7%" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-head"><div><span className="eyebrow">PAYMENTS</span><h3>Payment volume</h3></div><button className="small-select">Last 7 days <ChevronDown size={14} /></button></div>
          <div className="chart-wrap">
            <div className="y-axis"><span>₹2L</span><span>₹1.5L</span><span>₹1L</span><span>₹50K</span><span>₹0</span></div>
            <div className="chart-grid"><span /><span /><span /><span /><span />
              <svg viewBox="0 0 650 220" preserveAspectRatio="none" className="line-chart">
                <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopOpacity=".22" /><stop offset="100%" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 176 C50 150 72 164 110 148 S175 110 215 125 S278 96 322 112 S383 150 420 104 S484 74 528 87 S600 56 650 44 L650 220 L0 220 Z" fill="url(#fill)" />
                <path d="M0 176 C50 150 72 164 110 148 S175 110 215 125 S278 96 322 112 S383 150 420 104 S484 74 528 87 S600 56 650 44" fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="x-axis"><span>22 Sep</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28 Sep</span></div>
            </div>
          </div>
        </div>

        <div className="panel bridge-panel">
          <div className="panel-head"><div><span className="eyebrow">INTEGRATION</span><h3>System bridge</h3></div><StatusPill status="Connected" /></div>
          <div className="bridge-flow">
            <div className="bridge-node"><div className="bridge-icon"><Globe2 size={19} /></div><div><strong>Customer App</strong><span>Frontend + API client</span></div></div>
            <div className="flow-line" />
            <div className="bridge-node primary"><div className="bridge-icon"><Server size={19} /></div><div><strong>Your Backend</strong><span>Payments + business logic</span></div></div>
            <div className="flow-line" />
            <div className="bridge-node"><div className="bridge-icon"><Link2 size={19} /></div><div><strong>Red Famosa</strong><span>Order + service engine</span></div></div>
          </div>
          <div className="bridge-note"><CheckCircle2 size={16} /> No provider credentials are exposed to the app.</div>
          <button className="full-button" onClick={() => onNavigate("redfamosa")}>Open Red Famosa bridge <ExternalLink size={15} /></button>
        </div>
      </div>

      <div className="panel quick-actions">
        <div className="panel-head"><div><span className="eyebrow">SHORTCUTS</span><h3>Frequent actions</h3></div></div>
        <div className="shortcut-grid">
          <Shortcut icon={CreditCard} label="Review payments" meta="Pending verification" onClick={() => onNavigate("payments")} />
          <Shortcut icon={Palette} label="Edit app content" meta="Banners, text, videos" onClick={() => onNavigate("content")} />
          <Shortcut icon={Link2} label="Sync Red Famosa" meta="Services + order status" onClick={() => onNavigate("redfamosa")} />
          <Shortcut icon={UserCheck} label="Manage users" meta="Accounts + activity" onClick={() => onNavigate("users")} />
        </div>
      </div>
    </>
  );
}

function Shortcut({ icon: Icon, label, meta, onClick }) {
  return <button className="shortcut" onClick={onClick}><div className="shortcut-icon"><Icon size={18} /></div><div><strong>{label}</strong><span>{meta}</span></div><ArrowUpRight size={16} /></button>;
}

function UsersPage({ data, search, onSearch, onRefresh, onOpen }) {
  const filtered = data.filter((user) => `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <SectionTitle eyebrow="CUSTOMERS" title="Users" description="Manage your app accounts without duplicating Red Famosa's internal system." action={<button className="button secondary" onClick={onRefresh}><RefreshCw size={16} /> Sync users</button>} />
      <div className="filter-bar"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search name, email or user ID" /></div><button className="button secondary"><UserCog size={16} /> Filters</button></div>
      <div className="panel table-panel"><div className="table-head"><span>{filtered.length} customers</span><span>App-level customer data</span></div>
        <table><thead><tr><th>User</th><th>Balance</th><th>Orders</th><th>Status</th><th>Joined</th><th /></tr></thead>
          <tbody>{filtered.map((user) => <tr key={user.id}><td><div className="person-cell"><div className="avatar">{user.name.split(" ").map((x) => x[0]).join("").slice(0,2)}</div><div><strong>{user.name}</strong><span>{maskEmail(user.email)} · {user.id}</span></div></div></td><td>{currency(user.balance ?? user.points ?? 0)}</td><td>{user.orders ?? user.ordersCount ?? 0}</td><td><StatusPill status={user.status} /></td><td>{user.joined}</td><td><button className="table-action" onClick={() => onOpen(user)}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>
        {!filtered.length ? <EmptyState icon={Users} title="No users found" text="Try another name, email or ID." /> : null}
      </div>
    </>
  );
}

function PaymentsPage({ data, onRefresh, onOpen, notify }) {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const safePayments = Array.isArray(data) ? data : [];
  const filtered = safePayments.filter((p) => {
    const textMatch = `${p.id} ${p.user} ${p.email || ""} ${p.method} ${p.time} ${p.status} ${p.credit}`.toLowerCase().includes(search.toLowerCase());
    let dateMatch = true;
    if (startDate || endDate) {
      const d = new Date(p.created || p.date || p.time);
      if (!isNaN(d.getTime())) {
        const itemDay = d.toISOString().split("T")[0];
        if (startDate && itemDay < startDate) dateMatch = false;
        if (endDate && itemDay > endDate) dateMatch = false;
      }
    }
    return textMatch && dateMatch;
  });

  return (
    <>
      <SectionTitle eyebrow="MONEY IN" title="Payments" description="Your payment control center. Verify gateway callbacks before any credit is released." action={<button className="button secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>} />
      
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 280, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid var(--line)", padding: "8px 12px", borderRadius: 10 }}>
          <Search size={17} color="#64748b" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by UTR, customer name, email, date or method..."
            style={{ border: 0, outline: "none", width: "100%", fontSize: 11 }}
          />
          {search && <button onClick={() => setSearch("")} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}><X size={15} /></button>}
        </div>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", border: "1px solid var(--line)", padding: "4px 12px", borderRadius: 10 }}>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>From</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ border: 0, outline: "none", fontSize: 11, color: "#475569", background: "transparent", cursor: "pointer" }} />
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>To</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ border: 0, outline: "none", fontSize: 11, color: "#475569", background: "transparent", cursor: "pointer" }} />
          {(startDate || endDate) && <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}><X size={15} /></button>}
        </div>
      </div>

      <div className="metric-grid compact">
        <MetricCard icon={CheckCircle2} label="Verified" value={filtered.filter((p) => p.status === "Success").length} detail="ready for credit" tone="green" />
        <MetricCard icon={Activity} label="Pending" value={filtered.filter((p) => p.status === "Pending").length} detail="requires gateway confirmation" tone="amber" />
        <MetricCard icon={XCircle} label="Failed" value={filtered.filter((p) => p.status === "Failed").length} detail="no credit sent" tone="red" />
      </div>

      <div className="panel table-panel">
        <div className="table-head"><span>{filtered.length} payments found</span><span>Gateway → Backend → Red Famosa credit</span></div>
        <table>
          <thead>
            <tr><th>Transaction / UTR</th><th>Customer</th><th>Amount</th><th>Method</th><th>Gateway</th><th>Credit</th><th /></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.id}</strong><span className="muted-line">Date/Time: {p.time}</span></td>
                <td><strong>{p.user}</strong>{p.email && <><br /><span style={{ fontSize: 9, color: "#94a3b8" }}>{maskEmail(p.email)}</span></>}</td>
                <td><strong>{currency(p.amount)}</strong></td>
                <td><PaymentMethodPill method={p.method} /></td>
                <td><StatusPill status={p.status} /></td>
                <td><StatusPill status={p.credit === "Completed" ? "Completed" : p.credit === "Waiting" ? "Waiting" : "Not sent"} /></td>
                <td><button className="text-button" onClick={() => onOpen(p)}>Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState icon={CreditCard} title="No payments match your search" text="Try another UTR, customer, email, or date range." />}
      </div>
      <div className="notice-strip light">
        <div className="notice-icon"><Lock size={17} /></div>
        <div><strong>Payment rule</strong><span>The app UI cannot mark a payment successful by itself. Your backend should trust the gateway webhook/verification response.</span></div>

        <button className="text-button" onClick={() => notify("Backend block", "POST /api/admin/payments/:id/verify is ready to wire.")}>API block</button>
      </div>
    </>
  );
}







function TransactionsPage({ data, onRefresh }) {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const safeTx = Array.isArray(data) ? data : [];
  const filtered = safeTx.filter((t) => {
    const textMatch = `${t.id} ${t.user} ${t.email || ""} ${t.type} ${t.created} ${t.status} ${t.direction}`.toLowerCase().includes(search.toLowerCase());
    let dateMatch = true;
    if (startDate || endDate) {
      const d = new Date(t.created || t.date);
      if (!isNaN(d.getTime())) {
        const itemDay = d.toISOString().split("T")[0];
        if (startDate && itemDay < startDate) dateMatch = false;
        if (endDate && itemDay > endDate) dateMatch = false;
      }
    }
    return textMatch && dateMatch;
  });

  return (
    <>
      <SectionTitle eyebrow="LEDGER" title="Transactions" description="Audit every money and credit movement across your app backend." action={<button className="button secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>} />
      
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 280, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid var(--line)", padding: "8px 12px", borderRadius: 10 }}>
          <Search size={17} color="#64748b" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, customer name, email, or type..."
            style={{ border: 0, outline: "none", width: "100%", fontSize: 11 }}
          />
          {search && <button onClick={() => setSearch("")} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}><X size={15} /></button>}
        </div>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", border: "1px solid var(--line)", padding: "4px 12px", borderRadius: 10 }}>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>From</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ border: 0, outline: "none", fontSize: 11, color: "#475569", background: "transparent", cursor: "pointer" }} />
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>To</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ border: 0, outline: "none", fontSize: 11, color: "#475569", background: "transparent", cursor: "pointer" }} />
          {(startDate || endDate) && <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}><X size={15} /></button>}
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-head"><span>{filtered.length} ledger activities</span><span>Immutable audit trail</span></div>
        <table>
          <thead>
            <tr><th>ID</th><th>Type</th><th>Customer</th><th>Amount</th><th>Direction</th><th>Status</th><th>Time / Date</th></tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.id}</strong></td>
                <td>{t.type}</td>
                <td><strong>{t.user}</strong>{t.email && <><br /><span style={{ fontSize: 9, color: "#94a3b8" }}>{maskEmail(t.email)}</span></>}</td>
                <td>{currency(t.amount)}</td>
                <td>
                  <span className={t.direction === "in" ? "money-in" : "money-out"}>
                    {t.direction === "in" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    {t.direction === "in" ? "Credit" : "Debit"}
                  </span>
                </td>
                <td><StatusPill status={t.status} /></td>
                <td>{t.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState icon={FileClock} title="No transactions match your search" text="Try searching by a different date range, ID, email, or name." />}
      </div>
    </>
  );
}

function OrdersPage({ data, onRefresh, notify, onOrderUpdated }) {
  const [search, setSearch] = useState("");
  const safeOrders = Array.isArray(data) ? data : [];
  
  const filtered = safeOrders.filter((o) =>
    `${o.id} ${o.providerId} ${o.user} ${o.email || ""} ${o.service} ${o.created} ${o.status} ${o.link}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleStatusChange(orderId, newStatus) {
    try {
      await apiFetch(API.order(orderId), {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      if (notify) notify("Order updated", `Order ${orderId} status set to ${newStatus}.`);
      if (onOrderUpdated) onOrderUpdated({ id: orderId, status: newStatus });
    } catch (err) {
      if (notify) notify("Update failed", err.message || "Could not update order status.");
    }
  }

  return (
    <>
      <SectionTitle eyebrow="FULFILLMENT" title="Orders" description="Your backend routes orders to Red Famosa and reads back provider status." action={<button className="button secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>} />
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div className="search-box" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid var(--line)", padding: "8px 12px", borderRadius: 10 }}>
          <Search size={17} color="#64748b" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (SB-...), Red Famosa Provider ID (RF-...), customer name, email, or service..."
            style={{ border: 0, outline: "none", width: "100%", fontSize: 11 }}
          />
          {search && <button onClick={() => setSearch("")} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}><X size={15} /></button>}
        </div>
      </div>
      <div className="order-flow panel">
        <div className="order-step">
          <span className="step-num">01</span>
          <div className="step-body">
            <strong>App</strong>
            <small>Customer submits order</small>
          </div>
        </div>
        <div className="order-arrow">→</div>
        <div className="order-step active">
          <span className="step-num">02</span>
          <div className="step-body">
            <strong>Your API</strong>
            <small>Validate + route</small>
          </div>
        </div>
        <div className="order-arrow">→</div>
        <div className="order-step">
          <span className="step-num">03</span>
          <div className="step-body">
            <strong>Red Famosa</strong>
            <small>Fulfillment engine</small>
          </div>
        </div>
        <div className="order-arrow">→</div>
        <div className="order-step">
          <span className="step-num">04</span>
          <div className="step-body">
            <strong>App</strong>
            <small>Status returned</small>
          </div>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="table-head"><span>{filtered.length} matching orders</span><span>Customer order ID + provider order ID</span></div>
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Service</th><th>Quantity</th><th>Charge</th><th>Status</th><th>Provider ID</th><th>Change Status</th></tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.id}</strong><span className="muted-line">{o.created}</span></td>
                <td><strong>{o.user}</strong>{o.email && <><br /><span style={{ fontSize: 9, color: "#94a3b8" }}>{maskEmail(o.email)}</span></>}</td>
                <td>{o.service}</td>
                <td>{Number(o.qty || 0).toLocaleString("en-IN")}</td>
                <td>{currency(o.charge)}</td>
                <td><StatusPill status={o.status} /></td>
                <td><span className="provider-id">{o.providerId || "Manual"}</span></td>
                <td>
                  <select
                    value={o.status || "Pending"}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, fontWeight: 700, width: "auto" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Partial">Partial</option>
                    <option value="Failed">Failed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState icon={Package} title="No orders match your search" text="Try another Order ID, RF Provider ID, email, or customer name." />}
      </div>
    </>
  );
}

function ServicesPage({ data, onRefresh, onOpen, notify }) {
  const [tab, setTab] = useState("services");
  const [services, setServices] = useState([]);
  const [variants, setVariants] = useState([]);
  const [subVariants, setSubVariants] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [rfServicesList, setRfServicesList] = useState([]);
  const [syncingProvider, setSyncingProvider] = useState(false);

  async function handleSyncProvider() {
    setSyncingProvider(true);
    try {
      const currentServiceId = editor?.value?.providerServiceId;
      const syncResult = await adminApi.create(API.redfamosaSync, {
        serviceId: currentServiceId,
        scope: "services,rates"
      });

      // Reload fresh provider services list from backend
      const res = await adminApi.get(API.redfamosaServices);
      const list = normalizeList(res, ["services", "items"]);
      if (Array.isArray(list)) {
        setRfServicesList(list);

        // If a service is selected in the editor, update its fields to latest rates
        if (currentServiceId) {
          const item = list.find((s) => String(s.service) === String(currentServiceId));
          if (item) {
            setEditor((prev) => ({
              ...prev,
              value: {
                ...prev.value,
                providerServiceId: String(item.service),
                rfPrice: String(item.rate),
                price: String(item.rate),
                min: String(item.min),
                max: String(item.max)
              }
            }));
          }
        }
      }
      notify("Provider Synced", syncResult?.message || "Live rates and services synchronized from Red Famosa.");
    } catch (err) {
      notify("Sync failed", err.message || "Could not sync with Red Famosa backend.");
    } finally {
      setSyncingProvider(false);
    }
  }

  useEffect(() => {
    adminApi.get(API.redfamosaServices)
      .then((res) => {
        const list = normalizeList(res, ["services", "items"]);
        if (Array.isArray(list)) setRfServicesList(list);
      })
      .catch((err) => console.error("Could not fetch provider services:", err));
  }, []);

  async function fetchServices() {
    setBusy(true);
    try {
      const result = await adminApi.get(API.services);
      const list = normalizeList(result, ["services", "items"]);
      if (Array.isArray(list) && list.length) {
        setServices(list);
        const currentSelected = selectedService ? list.find(s => s.id === selectedService.id) || list[0] : list[0];
        setSelectedService(currentSelected);
        loadVariants(currentSelected);
      }
    } catch {
      const fallback = Array.isArray(data) ? data : [];
      setServices(fallback);
      if (fallback[0]) {
        setSelectedService(fallback[0]);
        loadVariants(fallback[0]);
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  async function loadVariants(service) {
    if (!service) return;
    setSelectedService(service);
    setSelectedVariant(null);
    setSubVariants([]);
    try {
      const result = await adminApi.get(API.serviceVariants(service.id));
      const list = normalizeList(result, ["variants", "services", "items"]);
      setVariants(list);
      if (list[0]) await loadSubVariants(service, list[0]);
    } catch (error) {
      const fallback = Array.isArray(service.variants) ? service.variants : [];
      setVariants(fallback);
      notify("Notice", error.message || "Variants endpoint not connected yet.");
    }
  }

  async function loadSubVariants(service, variant) {
    if (!service || !variant) return;
    setSelectedService(service);
    setSelectedVariant(variant);
    try {
      const result = await adminApi.get(API.serviceSubVariants(service.id, variant.id));
      setSubVariants(normalizeList(result, ["subVariants", "sub_variants", "items"]));
    } catch (error) {
      const fallback = variant.tiers ? [...(variant.tiers.hq || []), ...(variant.tiers.normal || [])] : [];
      setSubVariants(fallback);
      notify("Notice", error.message || "Sub-variants endpoint not connected yet.");
    }
  }

  function openCreate(type) {
    setEditor({
      type,
      mode: "create",
      service: selectedService,
      variant: selectedVariant,
      value:
        type === "service"
          ? { name: "", category: "Instagram", displayLayout: "row", iconName: "Sparkles", iconUrl: "", status: "Active" }
          : type === "variant"
          ? { name: "", title: "", speed: "Instant (0–15m)", exampleLink: "https://example.com", iconName: "Sparkles", descriptionImageUrl: "", status: "Active" }
          : { name: "", price: 100, min: "100", max: "10000", guarantee: "Verified Audience Retention", descriptionImageUrl: "", providerServiceId: "", rfPrice: "", status: "Active" }
    });
  }

  function openEdit(type, value) {
    const cleanValue = { ...value };
    if (type === "variant") {
      delete cleanValue.priceLabel;
      delete cleanValue.price;
      cleanValue.descriptionImageUrl = cleanValue.descriptionImageUrl || cleanValue.imageUrl || "";
    }
    if (type === "subVariant") {
      cleanValue.descriptionImageUrl = cleanValue.descriptionImageUrl || cleanValue.imageUrl || "";
    }
    setEditor({ type, mode: "edit", service: selectedService, variant: selectedVariant, value: cleanValue });
  }

  async function saveEditor() {
    if (!editor) return;
    setBusy(true);
    try {
      const { type, mode, value, service, variant } = editor;
      if (type === "service") {
        const result = mode === "create" ? await adminApi.create(API.services, value) : await adminApi.save(API.service(value.id), value);
        const saved = result?.data || result || value;
        setServices((items) => mode === "create" ? [...items, saved] : items.map((x) => x.id === saved.id ? { ...x, ...saved } : x));
      } else if (type === "variant") {
        const path = mode === "create" ? API.serviceVariants(service.id) : API.serviceVariant(service.id, value.id);
        const result = mode === "create" ? await adminApi.create(path, value) : await adminApi.save(path, value);
        const saved = result?.data || result || value;
        setVariants((items) => mode === "create" ? [...items, saved] : items.map((x) => x.id === saved.id ? { ...x, ...saved } : x));
      } else {
        const path = mode === "create" ? API.serviceSubVariants(service.id, variant.id) : API.serviceSubVariant(service.id, variant.id, value.id);
        const result = mode === "create" ? await adminApi.create(path, value) : await adminApi.save(path, value);
        const saved = result?.data || result || value;
        setSubVariants((items) => mode === "create" ? [...items, saved] : items.map((x) => x.id === saved.id ? { ...x, ...saved } : x));
      }
      notify("Saved", `${type} was saved through the backend.`);
      setEditor(null);
    } catch (error) {
      notify("Save failed", error.message || "Backend rejected the change.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteService(serviceId, e) {
    if (e) e.stopPropagation();
    if (checkDebounce('deleteService')) return;
    if (!window.confirm("Are you sure you want to delete this platform?")) return;
    setBusy(true);
    try {
      await adminApi.remove(API.service(serviceId));
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      if (selectedService?.id === serviceId) {
        setSelectedService(null);
        setVariants([]);
        setSubVariants([]);
      }
      notify("Deleted", "Service removed successfully.");
    } catch (err) {
      notify("Delete failed", err.message || "Could not delete service.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteVariant(serviceId, variantId, e) {
    if (e) e.stopPropagation();
    if (checkDebounce('deleteVariant')) return;
    if (!window.confirm("Are you sure you want to delete this variant?")) return;
    setBusy(true);
    try {
      await adminApi.remove(API.serviceVariant(serviceId, variantId));
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      if (selectedVariant?.id === variantId) {
        setSelectedVariant(null);
        setSubVariants([]);
      }
      notify("Deleted", "Variant removed successfully.");
    } catch (err) {
      notify("Delete failed", err.message || "Could not delete variant.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSubVariant(serviceId, variantId, subId, e) {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this sub-variant?")) return;
    setBusy(true);
    try {
      await adminApi.remove(API.serviceSubVariant(serviceId, variantId, subId));
      setSubVariants((prev) => prev.filter((s) => s.id !== subId));
      notify("Deleted", "Sub-variant removed successfully.");
    } catch (err) {
      notify("Delete failed", err.message || "Could not delete sub-variant.");
    } finally {
      setBusy(false);
    }
  }

  const selectedServiceId = selectedService?.id || "";
  const selectedVariantId = selectedVariant?.id || "";

  return (
    <>
      <SectionTitle
        eyebrow="CATALOG"
        title="Services & UI/UX Grids"
        description="Control the complete customer-facing A → B → C service hierarchy: Services, Variants, and Sub-variants. Provider mapping stays server-side while this screen controls what customers see."
        action={
          <div className="button-group">
            <button className="button secondary" onClick={fetchServices}><RefreshCw size={16} /> Refresh</button>
            <button className="button primary" onClick={() => openCreate(tab === "variants" ? "variant" : tab === "subvariants" ? "subvariant" : "service")}>
              <Plus size={16} /> Add {tab === "variants" ? "variant" : tab === "subvariants" ? "sub-variant" : "service"}
            </button>
          </div>
        }
      />

      <div className="notice-strip">
        <div className="notice-icon"><Boxes size={17} /></div>
        <div><strong>Three-level customer catalogue</strong><span>Service grid → variant grid → sub-variant grid. Add or edit any level here; the customer app reads the resulting hierarchy from GET /api/services.</span></div>
        <span className="backend-badge">A → B → C READY</span>
      </div>

      <div className="ui-tabs">
        <button className={cn("ui-tab", tab === "services" && "active")} onClick={() => setTab("services")}>Services</button>
        <button className={cn("ui-tab", tab === "variants" && "active")} onClick={() => { if (selectedService) { loadVariants(selectedService); setTab("variants"); } else notify("Select a service", "Choose a service before opening variants."); }}>Variants</button>
        <button className={cn("ui-tab", tab === "subvariants" && "active")} onClick={() => { if (selectedService && selectedVariant) { loadSubVariants(selectedService, selectedVariant); setTab("subvariants"); } else notify("Select a variant", "Choose a service and variant first."); }}>Sub-variants</button>
      </div>

      <div className="grid-admin-layout">
        {/* COLUMN 1: SERVICES (PLATFORMS) */}
        <div className="panel hierarchy-panel">
          <div className="panel-head">
            <div><span className="eyebrow">SERVICE GRID</span><h3>{services.length} platforms</h3></div>
            <button className="icon-button" onClick={() => openCreate("service")} title="Add Platform"><Plus size={16} /></button>
          </div>
          <div className="hierarchy-list">
            {services.map((service) => (
              <div
                key={service.id}
                className={cn("hierarchy-card", selectedServiceId === service.id && "selected")}
                onClick={() => { setSelectedService(service); loadVariants(service); }}
              >
                <div className="hierarchy-card-top">
                  <strong>{service.name}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StatusPill status={service.status || "Active"} />
                    <button className="icon-button" style={{ width: 24, height: 24 }} onClick={(e) => { e.stopPropagation(); openEdit("service", service); }} title="Edit"><Pencil size={12} /></button>
                    <button className="icon-button" style={{ width: 24, height: 24, color: "#be123c" }} onClick={(e) => deleteService(service.id, e)} title="Delete"><Trash2 size={12} /></button>
                  </div>
                </div>
                <span>{service.displayLayout === "row" ? "Horizontal row" : "Grid deck"} · {service.variants?.length || 0} variants</span>
                <small>ID: {service.id}</small>
              </div>
            ))}
          </div>
          {!services.length && <EmptyState icon={Boxes} title="No services" text="Add your first customer-facing service." />}
        </div>

        {/* COLUMN 2: VARIANTS */}
        <div className="panel hierarchy-panel">
          <div className="panel-head">
            <div><span className="eyebrow">VARIANT GRID</span><h3>{selectedService?.name || "Select a service"}</h3></div>
            <button className="icon-button" disabled={!selectedService} onClick={() => openCreate("variant")} title="Add Variant"><Plus size={16} /></button>
          </div>
          <div className="hierarchy-list">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className={cn("hierarchy-card", selectedVariantId === variant.id && "selected")}
                onClick={() => loadSubVariants(selectedService, variant)}
              >
                <div className="hierarchy-card-top">
                  <strong>{variant.title || variant.name}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StatusPill status={variant.status || "Active"} />
                    <button className="icon-button" style={{ width: 24, height: 24 }} onClick={(e) => { e.stopPropagation(); openEdit("variant", variant); }} title="Edit"><Pencil size={12} /></button>
                    <button className="icon-button" style={{ width: 24, height: 24, color: "#be123c" }} onClick={(e) => deleteVariant(selectedService.id, variant.id, e)} title="Delete"><Trash2 size={12} /></button>
                  </div>
                </div>
                <span>{variant.speed || "Instant"} · {((variant.tiers?.hq?.length || 0) + (variant.tiers?.normal?.length || 0))} sub-variants</span>
                <small>{variant.id}</small>
              </div>
            ))}
          </div>
          {!selectedService && <EmptyState icon={Boxes} title="Select a service" text="Select a platform on the left to inspect variants." />}
          {selectedService && !variants.length && <EmptyState icon={Sparkles} title="No variants" text="Add Views, Likes, or Followers variants." />}
        </div>

        {/* COLUMN 3: SUB-VARIANTS */}
        <div className="panel hierarchy-panel">
          <div className="panel-head">
            <div><span className="eyebrow">SUB-VARIANT GRID</span><h3>{selectedVariant?.title || selectedVariant?.name || "Select a variant"}</h3></div>
            <button className="icon-button" disabled={!selectedVariant} onClick={() => openCreate("subvariant")} title="Add Quality Tier"><Plus size={16} /></button>
          </div>
          <div className="hierarchy-list">
            {subVariants.map((item) => (
              <div
                key={item.id}
                className="hierarchy-card"
                onClick={() => openEdit("subvariant", item)}
              >
                <div className="hierarchy-card-top">
                  <strong>{item.name}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StatusPill status={item.status || "Active"} />
                    <button className="icon-button" style={{ width: 24, height: 24 }} onClick={(e) => { e.stopPropagation(); openEdit("subvariant", item); }} title="Edit"><Pencil size={12} /></button>
                    <button className="icon-button" style={{ width: 24, height: 24, color: "#be123c" }} onClick={(e) => deleteSubVariant(selectedService.id, selectedVariant.id, item.id, e)} title="Delete"><Trash2 size={12} /></button>
                  </div>
                </div>
                <span>App Price: <strong>{item.price ?? 0} pts</strong>{item.rfPrice ? ` · RF Rate: ₹${item.rfPrice}` : ''} · Min: {item.min || "100"} · {item.guarantee || "Lifetime"}</span>
                <small style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: item.providerServiceId ? 600 : 400, color: item.providerServiceId ? "#4f46e5" : "#64748b" }}>
                    {item.providerServiceId ? `Service ID: #${item.providerServiceId}` : "No Service ID assigned"}
                  </span>
                  <span>{item.descriptionImageUrl ? "✓ Image" : "No image"}</span>
                </small>
              </div>
            ))}
          </div>
          {!selectedVariant && <EmptyState icon={Database} title="Select a variant" text="Choose a variant to view orderable tiers." />}
          {selectedVariant && !subVariants.length && <EmptyState icon={Database} title="No sub-variants" text="Add packages with custom rates and images." />}
        </div>
      </div>

      <div className="panel editor-panel service-grid-editor-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">CUSTOMER-FACING UI/UX CONTROL</span>
            <h3>{selectedService?.name || "Select a service"}</h3>
            <p className="panel-subtitle">Controls display layout, customer rate, visibility, and Red Famosa mapping.</p>
          </div>
          <div className="button-group">
            {selectedService && (
              <>
                <button className="button secondary" onClick={() => openEdit("service", selectedService)}><Pencil size={15} /> Edit service</button>
                <button className="button secondary" onClick={() => onOpen({ ...selectedService, __layoutEditor: true })}><LayoutDashboard size={15} /> Grid settings</button>
              </>
            )}
          </div>
        </div>
        {selectedService ? (
          <div className="editor-grid">
            <label>Platform<input value={selectedService.category || selectedService.name || ""} readOnly /></label>
            <label>Name<input value={selectedService.name || ""} readOnly /></label>
            <label>Display layout<input value={selectedService.displayLayout || "grid"} readOnly /></label>
            <label>Status<input value={selectedService.status || "Active"} readOnly /></label>
          </div>
        ) : (
          <EmptyState icon={LayoutDashboard} title="Select a service" text="Choose a service above to inspect its settings." />
        )}
      </div>

      <div className="panel endpoint-panel">
        <div className="panel-head"><div><span className="eyebrow">BACKEND CONTRACT</span><h3>Service hierarchy endpoints</h3></div></div>
        <div className="endpoint-grid">
          <code>GET /api/services → customer A → B → C catalogue</code>
          <code>GET /api/admin/services → Services grid</code>
          <code>GET /api/admin/services/:serviceId/variants → Variant grid</code>
          <code>GET /api/admin/services/:serviceId/variants/:variantId/sub-variants → Sub-variant grid</code>
          <code>POST / PUT / DELETE → each hierarchy level</code>
          <code>PUT /api/admin/services/:serviceId/layout → customer grid presentation</code>
        </div>
      </div>

      {editor && (
        <Drawer
          open
          title={`${editor.mode === "create" ? "Add" : "Edit"} ${editor.type === "subvariant" ? "sub-variant" : editor.type}`}
          subtitle="Backend-connected catalogue editor"
          onClose={() => setEditor(null)}
        >
          <div className="drawer-stack">
            <div className="drawer-banner">
              <Boxes size={19} />
              <div>
                <strong>{editor.type === "subvariant" ? "Sub-variant" : editor.type === "variant" ? "Variant" : "Platform"}</strong>
                <span>{editor.service?.name || "Customer catalogue"}{editor.variant ? ` · ${editor.variant.title || editor.variant.name}` : ""}</span>
              </div>
            </div>
            {editor.type === "subvariant" && (
              <div style={{ marginBottom: 12, padding: 10, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontWeight: 700, fontSize: 11, margin: 0, display: "block", color: "#4f46e5" }}>
                    ⚡ Auto-Map Provider Service
                  </label>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ padding: "3px 8px", fontSize: 11, height: "auto", display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                    disabled={syncingProvider}
                    onClick={handleSyncProvider}
                    title="Sync live rates from Red Famosa backend"
                  >
                    <RefreshCw size={12} className={syncingProvider ? "spin" : ""} />
                    {syncingProvider ? "Syncing…" : "Sync"}
                  </button>
                </div>
                <select
                  style={{ width: "100%", padding: "6px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" }}
                  value={editor.value.providerServiceId || ""}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const item = rfServicesList.find((s) => String(s.service) === selId);
                    if (item) {
                      setEditor((prev) => ({
                        ...prev,
                        value: {
                          ...prev.value,
                          providerServiceId: String(item.service),
                          rfPrice: String(item.rate),
                          price: String(item.rate),
                          min: String(item.min),
                          max: String(item.max)
                        }
                      }));
                    } else {
                      setEditor((prev) => ({
                        ...prev,
                        value: {
                          ...prev.value,
                          providerServiceId: selId
                        }
                      }));
                    }
                  }}
                >
                  <option value="">Select Red Famosa service to auto-fill...</option>
                  {rfServicesList.map((s) => (
                    <option key={s.service} value={s.service}>
                      [{s.service}] {s.name} — Rate: ₹{s.rate}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {Object.entries(editor.value)
              .filter(([key]) => {
                if (["id", "createdAt", "updatedAt", "variants", "subVariants", "tiers", "services"].includes(key)) return false;
                if (editor.type === "variant" && (key === "priceLabel" || key === "price")) return false;
                return true;
              })
              .map(([key, val]) => (
                <label key={key}>
                  {key.replace(/([A-Z])/g, " $1")}
                  {key === "displayLayout" ? (
                    <select value={val || "grid"} onChange={(e) => setEditor((v) => ({ ...v, value: { ...v.value, [key]: e.target.value } }))}>
                      <option value="row">Horizontal row (Home)</option>
                      <option value="grid">Platform grid (More platforms)</option>
                    </select>
                  ) : key === "descriptionImageUrl" ? (
                    <div>
                      <input
                        value={val || ""}
                        placeholder="Paste image link for order page..."
                        onChange={(e) => setEditor((v) => ({ ...v, value: { ...v.value, [key]: e.target.value } }))}
                      />
                      {val && (
                        <div style={{ marginTop: 6, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", background: "#000", textAlign: "center" }}>
                          <img src={val} alt="preview" style={{ maxHeight: 110, width: "100%", objectFit: "contain" }} />
                        </div>
                      )}
                    </div>
                  ) : key === "providerServiceId" ? (
                    <input
                      value={val ?? ""}
                      placeholder="e.g. 640"
                      onChange={(e) => {
                        const newId = e.target.value;
                        const item = rfServicesList.find((s) => String(s.service) === newId.trim());
                        if (item) {
                          setEditor((v) => ({
                            ...v,
                            value: {
                              ...v.value,
                              providerServiceId: newId,
                              rfPrice: String(item.rate),
                              price: String(item.rate),
                              min: String(item.min),
                              max: String(item.max)
                            }
                          }));
                        } else {
                          setEditor((v) => ({
                            ...v,
                            value: {
                              ...v.value,
                              providerServiceId: newId
                            }
                          }));
                        }
                      }}
                    />
                  ) : key === "rfPrice" ? (
                    <input
                      value={val ?? ""}
                      placeholder="Rate from provider (e.g. 120.00)"
                      onChange={(e) => {
                        const newRate = e.target.value;
                        setEditor((v) => ({
                          ...v,
                          value: {
                            ...v.value,
                            rfPrice: newRate,
                            price: newRate
                          }
                        }));
                      }}
                    />
                  ) : key === "price" ? (
                    <input
                      value={val ?? ""}
                      placeholder="Customer price in points"
                      onChange={(e) => {
                        const newPrice = e.target.value;
                        setEditor((v) => ({
                          ...v,
                          value: {
                            ...v.value,
                            price: newPrice
                          }
                        }));
                      }}
                    />
                  ) : (
                    <input
                      value={typeof val === "boolean" ? String(val) : val ?? ""}
                      onChange={(e) => setEditor((v) => ({ ...v, value: { ...v.value, [key]: e.target.value } }))}
                    />
                  )}
                </label>
              ))}

            <div className="button-group">
              <button className="button primary" disabled={busy} onClick={saveEditor}>
                <CheckCircle2 size={15} />{busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}

function ContentPage({ data, onRefresh, onOpen, notify }) {
  const [tab, setTab] = useState("content");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState({ tag: "Limited-time · ends in 24h", title: "Get 25% bonus points today", subtitle: "Extra credit applied on any pack", buttonText: "Add points", buttonLink: "points" });
  const [packages, setPackages] = useState(initialData.packages || []);
  const [reviews, setReviews] = useState(initialData.reviews || []);
  const [faq, setFaq] = useState(initialData.faq || []);
  const [primary, setPrimary] = useState({ type: "video", src: "", title: "", text: "" });
  const [config, setConfig] = useState({ supportPhone: "", supportEmail: "", issuePhone: "", issueEmail: "", shareUrl: "", privacyText: "", termsText: "", levelPerks: [], registration: true, payments: true, orders: true, maintenance: false, notifications: true });

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      adminApi.get(API.banners).then((r) => { const x = normalizeList(r, ["banners", "items"]); if (alive && x[0]) setBanner((v) => ({ ...v, ...x[0] })); }),
      adminApi.get(API.packages).then((r) => { const x = normalizeList(r, ["packages", "items"]); if (alive && x.length) setPackages(x); }),
      adminApi.get(API.reviews).then((r) => { const x = normalizeList(r, ["reviews", "items"]); if (alive && x.length) setReviews(x); }),
      adminApi.get(API.faq).then((r) => { const x = normalizeList(r, ["faq", "items"]); if (alive && x.length) setFaq(x); }),
      adminApi.get(API.primaryContent).then((r) => { const x = r?.data ?? r; if (alive && x && typeof x === "object") setPrimary((v) => ({ ...v, ...x })); }),
      adminApi.get(API.config).then((r) => { const x = r?.data ?? r; if (alive && x && typeof x === "object") setConfig((v) => ({ ...v, ...x })); })
    ]);
    return () => { alive = false; };
  }, []);

  async function save(path, payload, label) {
    setBusy(true);
    try {
      const res = await adminApi.save(path, payload);
      notify("Saved", `${label} was saved through the backend.`);
      return res;
    } catch (e) {
      notify("Save failed", e.message || "Backend rejected the change.");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ["content", "Content blocks"],
    ["banner", "Marketing banner"],
    ["packages", "Points packages"],
    ["reviews", "Reviews"],
    ["faq", "FAQ"],
    ["primary", "Primary / blank"],
    ["config", "App config"]
  ];

  return (
    <>
      <SectionTitle eyebrow="REMOTE APP CONTROL" title="App & UI/UX" description="Every customer-facing backend block used by the app is controlled here: content, banners, packages, reviews, FAQ, the primary media/blank slot, and app configuration." action={<button className="button secondary" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>} />
      <div className="ui-tabs">{tabs.map(([id, label]) => <button key={id} className={cn("ui-tab", tab === id && "active")} onClick={() => setTab(id)}>{label}</button>)}</div>

      {tab === "content" && (
        <div className="content-layout">
          <div className="content-main">
            <div className="panel table-panel">
              <div className="table-head"><span>Dynamic content blocks</span><span>Customer app content contracts</span></div>
              <table><thead><tr><th>Block</th><th>Type</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{data.map((item) => <tr key={item.id}><td><div className="content-cell"><div className="content-icon">{item.type === "Video" ? <Film size={17} /> : item.type === "Banner" ? <Globe2 size={17} /> : item.type === "Dynamic" ? <Cloud size={17} /> : <MessageSquare size={17} />}</div><div><strong>{item.title}</strong><span>{item.id}</span></div></div></td><td>{item.type}</td><td><StatusPill status={item.status} /></td><td>{item.updated}</td><td><button className="text-button" onClick={() => onOpen(item)}>Edit</button></td></tr>)}</tbody></table>
              {!data.length && <EmptyState icon={Cloud} title="No blocks returned" text="The app keeps its safe fallback until the backend returns content." />}
            </div>
          </div>
          <div className="panel preview-panel">
            <div className="panel-head"><div><span className="eyebrow">BACKEND CONTRACT</span><h3>Customer app API map</h3></div></div>
            <div className="endpoint-grid">{["GET /api/config", "GET /api/services", "GET /api/banners", "GET /api/packages", "GET /api/reviews", "GET /api/faq", "GET /api/content/primary", "GET /api/orders", "POST /api/payment/create-order", "POST /api/orders"].map((x) => <code key={x}>{x}</code>)}</div>
            <div className="security-note"><Lock size={16} /><span>Provider credentials never belong in this browser bundle. The backend remains the mediator.</span></div>
          </div>
        </div>
      )}

      {tab === "banner" && <EditorPanel title="Marketing banner" route={API.banners} fields={[["tag", "Tag"], ["title", "Title"], ["subtitle", "Subtitle"], ["buttonText", "Button text"], ["buttonLink", "Button link/tab"]]} value={banner} setValue={setBanner} onSave={() => save(API.banners, banner, "Marketing banner")} busy={busy} fullWidthKeys={["subtitle"]} />}
      {tab === "packages" && <CollectionEditor title="Points packages" route={API.packages} items={packages} setItems={setPackages} fields={[["pts", "Points"], ["priceNumeric", "Price"], ["bonus", "Bonus"]]} onSave={(item) => save(String(item.id || "").startsWith("draft_") ? API.packages : API.package(item.id), item, "Package")} busy={busy} notify={notify} />}
      {tab === "reviews" && <CollectionEditor title="Creator reviews" route={API.reviews} items={reviews} setItems={setReviews} fields={[["name", "Name"], ["role", "Role"], ["avatar", "Avatar URL"], ["review", "Review"], ["rating", "Rating"]]} onSave={(item) => save(String(item.id || "").startsWith("draft_") ? API.reviews : API.review(item.id), item, "Review")} busy={busy} notify={notify} />}
      {tab === "faq" && <CollectionEditor title="FAQ" route={API.faq} items={faq} setItems={setFaq} fields={[["question", "Question"], ["answer", "Answer"]]} onSave={(item) => save(String(item.id || "").startsWith("draft_") ? API.faq : API.faqItem(item.id), item, "FAQ")} busy={busy} notify={notify} />}
      {tab === "primary" && <EditorPanel title="Primary / blank content slot" route={API.primaryContent} fields={[["type", "Type: video / text / image / blank"], ["src", "Source URL"], ["title", "Title"], ["text", "Text / body"]]} value={primary} setValue={setPrimary} onSave={() => save(API.primaryContent, primary, "Primary content")} busy={busy} textareaKeys={["text"]} fullWidthKeys={["title"]} />}
      {tab === "config" && (
        <ConfigEditor
          config={config}
          setConfig={setConfig}
          onSave={() => {
            const cleanConfig = { ...config };
            delete cleanConfig.googlePlayActive;
            delete cleanConfig._id;
            delete cleanConfig.id;
            return save(API.config, cleanConfig, "App configuration");
          }}
          busy={busy}
        />
      )}

      <div className="notice-strip light"><div className="notice-icon"><Sparkles size={17} /></div><div><strong>Dynamic fallback preserved</strong><span>The customer app already supports text, image, video and safe blank fallback for the primary content slot. Admin changes only change backend responses.</span></div></div>
    </>
  );
}

function EditorPanel({ title, route, fields, value, setValue, onSave, busy, textareaKeys = [], fullWidthKeys = [] }) {
  return (
    <div className="panel editor-panel">
      <div className="panel-head">
        <div><span className="eyebrow">BACKEND BLOCK</span><h3>{title}</h3></div>
        <code>{route}</code>
      </div>
      <div className="editor-grid">
        {fields.map(([key, label]) => {
          const isTextarea = textareaKeys.includes(key);
          const isFull = isTextarea || fullWidthKeys.includes(key);
          return (
            <label key={key} className={isFull ? "full-width" : ""}>
              <span>{label}</span>
              {isTextarea ? (
                <textarea rows="4" value={value?.[key] ?? ""} onChange={(e) => setValue({ ...value, [key]: e.target.value })} />
              ) : (
                <input value={value?.[key] ?? ""} onChange={(e) => setValue({ ...value, [key]: e.target.value })} />
              )}
            </label>
          );
        })}
      </div>
      <button className="button primary" disabled={busy} onClick={onSave} style={{ marginTop: 8 }}>
        {busy ? <RefreshCw className="spin" size={15} /> : <CheckCircle2 size={15} />} Save to backend
      </button>
    </div>
  );
}

function CollectionEditor({ title, route, items, setItems, fields, onSave, busy, notify }) {
  function update(id, key, val) { setItems(items.map((x) => x.id === id ? { ...x, [key]: val } : x)); }
  function add() { setItems([...items, { id: `draft_${Date.now()}`, ...Object.fromEntries(fields.map(([k]) => [k, ""])) }]); }
  async function remove(id) {
    if (String(id).startsWith("draft_")) {
      setItems(items.filter((x) => x.id !== id));
      return;
    }
    try {
      await adminApi.remove(`${route}/${encodeURIComponent(id)}`);
      setItems(items.filter((x) => x.id !== id));
      if (notify) notify("Deleted", `${title.slice(0, -1)} removed successfully.`);
    } catch {
      setItems(items.filter((x) => x.id !== id));
    }
  }

  async function handleSaveItem(item) {
    if (checkDebounce('handleSaveItem')) return;
    try {
      const res = await onSave(item);
      const saved = res?.package || res?.review || res?.faq || res?.data || res;
      if (saved && saved.id) {
        setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, ...saved } : x));
      }
    } catch {
      // notification already dispatched by onSave
    }
  }

  return (
    <div className="panel editor-panel">
      <div className="panel-head">
        <div><span className="eyebrow">CUSTOMER DATA</span><h3>{title}</h3></div>
        <div className="button-group"><code>{route}</code><button className="button secondary" onClick={add}><Plus size={15} /> Add item</button></div>
      </div>
      <div className="collection-list">
        {items.map((item, idx) => (
          <div className="collection-card" key={item.id || idx}>
            <div className="collection-head">
              <div>
                <strong>{item.name || item.question || (item.pts ? `${item.pts} Points Pack` : `Item #${idx + 1}`)}</strong>
                <span className="collection-badge">{item.id}</span>
              </div>
              <button className="button danger" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => remove(item.id)} title="Remove item">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="editor-grid">
              {fields.map(([key, label]) => {
                const isBig = key === "review" || key === "answer";
                return (
                  <label key={key} className={isBig ? "full-width" : ""}>
                    <span>{label}</span>
                    {isBig ? (
                      <textarea rows="3" value={item[key] ?? ""} onChange={(e) => update(item.id, key, e.target.value)} />
                    ) : (
                      <input value={item[key] ?? ""} onChange={(e) => update(item.id, key, e.target.value)} />
                    )}
                  </label>
                );
              })}
            </div>
            <button className="button primary" disabled={busy} onClick={() => handleSaveItem(item)} style={{ marginTop: 6 }}>
              <CheckCircle2 size={14} /> Save {title.slice(0, -1)}
            </button>
          </div>
        ))}
        {!items.length && (
          <div className="empty-state" style={{ padding: "30px 16px" }}>
            <div className="empty-icon"><Database size={18} /></div>
            <strong style={{ fontSize: 13, color: "#1e293b", marginTop: 6 }}>No items found</strong>
            <span style={{ fontSize: 11, color: "#64748b" }}>Add your first item to this collection.</span>
            <button className="button primary" onClick={add} style={{ marginTop: 10 }}><Plus size={14} /> Add new</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigEditor({ config, setConfig, onSave, busy }) {
  const toggle = (k) => setConfig({ ...config, [k]: !config[k] });
  return (
    <div className="settings-grid">
      <div className="panel editor-panel">
        <div className="panel-head"><div><span className="eyebrow">APP CONFIG</span><h3>Feature switches</h3></div></div>
        <div className="switch-list">
          {["registration", "payments", "orders", "maintenance", "notifications"].map((k) => (
            <ToggleRow key={k} label={k.replace(/^\w/, (m) => m.toUpperCase())} text={`Controls customer app ${k} behavior.`} value={Boolean(config[k])} onChange={() => toggle(k)} />
          ))}
        </div>
      </div>
      <div className="panel editor-panel">
        <div className="panel-head"><div><span className="eyebrow">SUPPORT + LEGAL</span><h3>App copy & support channels</h3></div></div>
        <div className="editor-grid">
          <label>
            <span>General / Help WhatsApp (1 & 3)</span>
            <input placeholder="e.g. 919876543210" value={config.supportPhone || ""} onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })} />
            <small style={{ fontSize: 9, color: "#64748b", fontWeight: 400 }}>For 'Join us on WhatsApp' & 'Floating button'</small>
          </label>
          <label>
            <span>Report Issue WhatsApp (2 - Order tickets)</span>
            <input placeholder="e.g. 919876543211" value={config.issuePhone || ""} onChange={(e) => setConfig({ ...config, issuePhone: e.target.value })} />
            <small style={{ fontSize: 9, color: "#64748b", fontWeight: 400 }}>Different number for 'Report an issue' tickets</small>
          </label>
          <label>
            <span>General Support Email (1 & 3)</span>
            <input placeholder="e.g. support@socialboost.app" value={config.supportEmail || ""} onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })} />
            <small style={{ fontSize: 9, color: "#64748b", fontWeight: 400 }}>For general inquiries & floating button</small>
          </label>
          <label>
            <span>Report Issue Email (2 - Order tickets)</span>
            <input placeholder="e.g. orders-issue@socialboost.app" value={config.issueEmail || ""} onChange={(e) => setConfig({ ...config, issueEmail: e.target.value })} />
            <small style={{ fontSize: 9, color: "#64748b", fontWeight: 400 }}>Different email for order issue tickets</small>
          </label>
          <label className="full-width"><span>Share URL</span><input value={config.shareUrl || ""} onChange={(e) => setConfig({ ...config, shareUrl: e.target.value })} /></label>
          <label className="full-width"><span>Privacy text</span><textarea rows="4" value={config.privacyText || ""} onChange={(e) => setConfig({ ...config, privacyText: e.target.value })} /></label>
          <label className="full-width"><span>Terms text</span><textarea rows="4" value={config.termsText || ""} onChange={(e) => setConfig({ ...config, termsText: e.target.value })} /></label>
          <label className="full-width"><span>Level perks (one per line)</span><textarea rows="4" value={(config.levelPerks || []).join("\n")} onChange={(e) => setConfig({ ...config, levelPerks: e.target.value.split("\n").filter(Boolean) })} /></label>
        </div>
        <button className="button primary" disabled={busy} onClick={onSave} style={{ marginTop: 10 }}>
          {busy ? <RefreshCw className="spin" size={15} /> : <CheckCircle2 size={15} />} Save config to backend
        </button>
      </div>
    </div>
  );
}

function RedFamosaPage({ onSync, syncing, onRefresh, notify }) {
  const [rfStatus, setRfStatus] = useState({ connected: true, latency: 218, balance: "₹12,840", lastSync: "2 min ago" });

  async function checkConnection() {
    try {
      await apiFetch(API.redfamosaStatus);
      setRfStatus((v) => ({ ...v, connected: true, lastSync: "just now" }));
      notify("Connection verified", "Your backend can reach the Red Famosa connector.");
    } catch (error) {
      setRfStatus((v) => ({ ...v, connected: false }));
      notify("Connection check failed", error.message || "Verify the backend connector.");
    }
  }

  return (
    <>
      <SectionTitle eyebrow="EXTERNAL ENGINE" title="Red Famosa bridge" description="Monitor the API bridge. Keep Red Famosa's credentials and provider logic on your backend." action={<div className="button-group"><button className="button secondary" onClick={checkConnection}><Activity size={16} /> Test connection</button><button className="button primary" onClick={onSync} disabled={syncing}>{syncing ? <RefreshCw className="spin" size={16} /> : <RefreshCw size={16} />} Sync</button></div>} />
      <div className="rf-hero panel">
        <div className="rf-brand"><div className="rf-logo"><Link2 size={24} /></div><div><strong>Red Famosa API</strong><span>External fulfillment engine</span></div></div>
        <StatusPill status={rfStatus.connected ? "Connected" : "Failed"} />
        <div className="rf-stat-grid">
          <div><span>Connection</span><strong>{rfStatus.connected ? "Healthy" : "Offline"}</strong></div>
          <div><span>API latency</span><strong>{rfStatus.latency} ms</strong></div>
          <div><span>Provider balance</span><strong>{rfStatus.balance}</strong></div>
          <div><span>Last sync</span><strong>{rfStatus.lastSync}</strong></div>
        </div>
      </div>
      <div className="rf-grid">
        <div className="panel">
          <div className="panel-head"><div><span className="eyebrow">API DATA</span><h3>Data your backend can sync</h3></div></div>
          <div className="rf-list">
            <RFItem icon={Boxes} title="Services + self-dispatch" text="Catalogue, markup, provider mappings, drip-feed, refill, cancel and subscription lifecycle controls." />
            <RFItem icon={Package} title="Order queue" text="Provider order IDs, statuses, retries, ageing checks and circuit-breaker state." />
            <RFItem icon={Wallet} title="Wallet ledger" text="Top-ups, bonuses, corrections, refunds and order debits as auditable entries." />
            <RFItem icon={MessageCircle} title="Omnichannel CRM" text="WhatsApp, Messenger, Instagram, Telegram, email, web chat and customer tickets." />
            <RFItem icon={Bot} title="AI + knowledge base" text="AI-agent configuration and knowledge-source management through backend contracts." />
            <RFItem icon={Network} title="Branded reseller panels" text="Child-panel branding, feature plans, domains, recurring billing and suspension lifecycle." />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><span className="eyebrow">BACKEND BLOCKS</span><h3>Integration contracts</h3></div></div>
          <div className="code-list"><code>GET {API.redfamosaStatus}</code><code>GET {API.redfamosaServices}</code><code>GET {API.redfamosaBalance}</code><code>POST {API.redfamosaSync}</code></div>
          <div className="security-note"><Lock size={16} /><span>Never expose the Red Famosa API key to the browser or mobile app.</span></div>
          <button className="full-button" onClick={onRefresh}><FileClock size={15} /> Refresh bridge health</button>
        </div>
      </div>
      <div className="notice-strip light"><div className="notice-icon"><AlertCircle size={17} /></div><div><strong>Integration boundary</strong><span>This UI intentionally does not implement the Red Famosa internal payment flow. Your backend should handle your payment gateway separately, then call only the documented provider-side API action that your Red Famosa setup supports.</span></div><button className="text-button" onClick={() => notify("Integration note", "Keep undocumented database writes out of the frontend.")}>Read rule</button></div>
    </>
  );
}

function RFItem({ icon: Icon, title, text }) { return <div className="rf-item"><div className="rf-item-icon"><Icon size={17} /></div><div><strong>{title}</strong><span>{text}</span></div></div>; }

function ServiceLayoutDrawer({ service, notify }) {
  const [layout, setLayout] = useState({ displayLayout: service.displayLayout || "grid", visible: service.visible !== false, sortOrder: service.sortOrder || 0, countLabel: service.countLabel || "", iconName: service.iconName || "Sparkles", iconUrl: service.iconUrl || "" });
  async function save() { try { await apiFetch(API.serviceLayout(service.id), { method: "PUT", body: JSON.stringify(layout) }); notify("Grid saved", `Service ${service.id} layout was sent to the backend.`); } catch (e) { notify("Grid save failed", e.message || "Backend rejected the layout."); } }
  return (
    <div className="drawer-stack">
      <div className="drawer-banner"><LayoutDashboard size={19} /><div><strong>{service.name}</strong><span>Customer service grid presentation</span></div></div>
      <label>Display layout<select value={layout.displayLayout} onChange={(e) => setLayout((v) => ({ ...v, displayLayout: e.target.value }))}><option value="row">Horizontal row</option><option value="grid">Platform grid</option></select></label>
      <label>Visible<button type="button" className={cn("toggle", layout.visible && "on")} onClick={() => setLayout((v) => ({ ...v, visible: !v.visible }))}><span /></button></label>
      <label>Sort order<input type="number" value={layout.sortOrder} onChange={(e) => setLayout((v) => ({ ...v, sortOrder: Number(e.target.value) }))} /></label>
      <label>Count label<input value={layout.countLabel} onChange={(e) => setLayout((v) => ({ ...v, countLabel: e.target.value }))} placeholder="e.g. 12 tiers" /></label>
      <label>Icon name<input value={layout.iconName} onChange={(e) => setLayout((v) => ({ ...v, iconName: e.target.value }))} /></label>
      <label>Icon URL<input value={layout.iconUrl} onChange={(e) => setLayout((v) => ({ ...v, iconUrl: e.target.value }))} /></label>
      <div className="security-note"><Lock size={16} /><span>Provider service IDs/rates remain backend/provider data. This editor controls customer-facing presentation only.</span></div>
      <button className="full-button" onClick={save}><CheckCircle2 size={15} /> Save grid settings</button>
    </div>
  );
}

function RedFamosaCRMPage({ notify }) {
  const [status, setStatus] = useState({ connected: null });
  const [channels, setChannels] = useState([]);
  const [flows, setFlows] = useState([]);

  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([apiFetch(API.redfamosaCrmStatus), apiFetch(API.redfamosaChannels), apiFetch(API.redfamosaFlows)]);
      setStatus(a?.data || a || {});
      setChannels(b?.data?.channels || b?.channels || b || []);
      setFlows(c?.data?.flows || c?.flows || c || []);
    } catch (e) {
      notify("CRM data unavailable", e.message || "Connect the Red Famosa CRM mediator.");
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);
  const channelNames = channels.length ? channels : ["WhatsApp Cloud API", "Facebook Messenger", "Instagram Direct", "Telegram", "Email IMAP/SMTP", "Web-chat widget", "Customer support tickets"];

  return (
    <>
      <SectionTitle eyebrow="RED FAMOSA CRM" title="Omnichannel inbox" description="Backend-mediated CRM controls for the Red Famosa shared inbox, AI agents, knowledge base and automation flows." action={<button className="button secondary" onClick={load}><RefreshCw size={16} /> Refresh</button>} />
      <div className="metric-grid compact">
        <MetricCard icon={MessageCircle} label="Inbox" value={status.conversations ?? "—"} detail="conversations" tone="blue" />
        <MetricCard icon={Bot} label="AI agents" value={status.aiAgents ?? "—"} detail="configured" tone="purple" />
        <MetricCard icon={Workflow} label="Flows" value={(status.flows ?? flows.length) || "—"} detail="automation flows" tone="green" />
      </div>
      <div className="rf-grid">
        <div className="panel" style={{ padding: 18 }}>
          <div className="panel-head"><div><span className="eyebrow">CHANNELS</span><h3>Connected inbox channels</h3></div><StatusPill status={status.connected ? "Connected" : "Pending"} /></div>
          <div className="rf-list">{channelNames.map((x, i) => <RFItem key={i} icon={i === 0 ? MessageCircle : i === 5 ? Globe2 : Mail} title={typeof x === "string" ? x : x.name || x.channel} text={typeof x === "string" ? "Backend adapter contract" : x.status || "Provider-managed channel"} />)}</div>
        </div>
        <div className="panel" style={{ padding: 18 }}>
          <div className="panel-head"><div><span className="eyebrow">AI + AUTOMATION</span><h3>Backend blocks</h3></div></div>
          <div className="code-list"><code>GET {API.redfamosaInbox}</code><code>GET {API.redfamosaAi}</code><code>GET {API.redfamosaFlows}</code><code>POST /admin/redfamosa/crm/whatsapp/connect</code><code>POST /admin/redfamosa/crm/widget/config</code></div>
          <div className="security-note"><Lock size={16} /><span>WhatsApp app secrets, AI keys and channel credentials stay server-side. This UI is only the control surface.</span></div>
        </div>
      </div>
    </>
  );
}

function ResellerNetworkPage({ notify }) {
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([apiFetch(API.redfamosaResellers), apiFetch(API.redfamosaPlans)]);
      setRows(a?.data?.resellers || a?.resellers || a || []);
      setPlans(b?.data?.plans || b?.plans || b || []);
    } catch (e) {
      notify("Reseller data unavailable", e.message || "Connect the reseller mediator.");
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <SectionTitle eyebrow="RED FAMOSA RESELLER LAYER" title="Reseller network" description="Control branded child panels, feature plans, custom domains and recurring billing through your backend mediator." action={<button className="button secondary" onClick={load}><RefreshCw size={16} /> Refresh</button>} />
      <div className="panel table-panel">
        <div className="table-head"><span>Child panels</span><span>Branding + billing are isolated per panel</span></div>
        <table><thead><tr><th>Reseller</th><th>Domain</th><th>Plan</th><th>Billing</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.id || i}><td><strong>{r.name || r.email || r.id}</strong></td><td>{r.domain || "—"}</td><td>{r.plan || "—"}</td><td>{r.billingStatus || r.billing || "—"}</td><td><StatusPill status={r.status || "Active"} /></td></tr>)}</tbody></table>
        {!rows.length && <EmptyState icon={Network} title="No reseller records returned" text="Wire the backend reseller endpoints when this Red Famosa capability is enabled." />}
      </div>
      <div className="settings-grid" style={{ marginTop: 18 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div className="panel-head"><div><span className="eyebrow">PLANS</span><h3>Feature-matrix plans</h3></div></div>
          {plans.map((p, i) => <div key={p.id || i} className="guard" style={{ marginBottom: 8 }}><div className="guard-icon"><Zap size={17} /></div><div><strong>{p.name || p.id}</strong><span>{p.features?.join?.(", ") || p.modules || "Module controls + domain/theme limits"}</span></div></div>)}
          {!plans.length && <p className="muted-line">No plans returned yet.</p>}
        </div>
        <div className="panel" style={{ padding: 18 }}>
          <div className="panel-head"><div><span className="eyebrow">BILLING CONTRACT</span><h3>Lifecycle rules</h3></div></div>
          <div className="rf-list">
            <RFItem icon={CreditCard2} title="Recurring charges" text="Backend-managed renewal and payment status." />
            <RFItem icon={AlertCircle} title="Dunning + grace period" text="Failure handling before panel suspension." />
            <RFItem icon={Globe2} title="Custom domains" text="Per-plan domain/theme limits and verification." />
            <RFItem icon={ShieldAlert} title="Tenant isolation" text="Separate credentials, catalogue, pricing, clients and settings." />
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsPage({ notify }) {
  const [toggles, setToggles] = useState({ registration: true, payments: true, orders: true, maintenance: false, notifications: true });
  const [apiUrl, setApiUrl] = useState(BACKEND_CONFIG.baseUrl);
  const [env, setEnv] = useState("production");
  const [role, setRole] = useState("super_admin");
  const [busy, setBusy] = useState(false);
  const [googlePlayActive, setGooglePlayActive] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetch(API.config)
      .then((res) => {
        const c = res?.config || res?.data || res;
        if (alive && c && typeof c === "object") {
          setToggles((prev) => ({
            ...prev,
            ...(c.registration !== undefined ? { registration: Boolean(c.registration) } : {}),
            ...(c.payments !== undefined ? { payments: Boolean(c.payments) } : {}),
            ...(c.orders !== undefined ? { orders: Boolean(c.orders) } : {}),
            ...(c.maintenance !== undefined ? { maintenance: Boolean(c.maintenance) } : {}),
            ...(c.notifications !== undefined ? { notifications: Boolean(c.notifications) } : {})
          }));
        }
        if (alive && res && res.googlePlayActive !== undefined) {
          setGooglePlayActive(Boolean(res.googlePlayActive));
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  function toggle(key) { setToggles((v) => ({ ...v, [key]: !v[key] })); }

  async function handleSave() {
    setBusy(true);
    try {
      await apiFetch(API.config, {
        method: "PUT",
        body: JSON.stringify(toggles)
      });
      notify("Settings saved ⚡", "Global feature switches and configuration updated on the backend.");
    } catch (e) {
      notify("Save failed", e.message || "Could not update configuration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionTitle eyebrow="CONTROL PLANE" title="Settings" description="Global switches for the customer app and the admin system." action={<button className="button primary" disabled={busy} onClick={handleSave}>{busy ? <RefreshCw className="spin" size={16} /> : <CheckCircle2 size={16} />} Save changes</button>} />
      <div className="settings-grid">
        <div className="panel editor-panel">
          <div className="panel-head"><div><span className="eyebrow">APP</span><h3>Feature switches</h3></div></div>
          <div className="switch-list">
            <ToggleRow label="Registration" text="Allow new customers to create accounts" value={toggles.registration} onChange={() => toggle("registration")} />
            <ToggleRow label="Payments" text="Allow customers to add funds" value={toggles.payments} onChange={() => toggle("payments")} />
            <ToggleRow label="New orders" text="Allow customers to place orders" value={toggles.orders} onChange={() => toggle("orders")} />
            <ToggleRow label="Maintenance mode" text="Temporarily replace the customer app with a maintenance view" value={toggles.maintenance} onChange={() => toggle("maintenance")} />
            <ToggleRow label="Push notifications" text="Allow notification events from your backend" value={toggles.notifications} onChange={() => toggle("notifications")} />
          </div>
        </div>
        <div className="panel editor-panel">
          <div className="panel-head"><div><span className="eyebrow">INFRASTRUCTURE</span><h3>Backend configuration</h3></div></div>
          <div className="setting-fields">
            <label><span>Admin API base URL</span><input value={BACKEND_CONFIG.baseUrl} readOnly title="Fixed from environment variables" style={{ opacity: 0.7, cursor: 'not-allowed' }} /></label>
            <label><span>Environment</span><select value={env} onChange={(e) => setEnv(e.target.value)}><option value="production">Production</option><option value="staging">Staging</option><option value="development">Development</option></select></label>
            {/* NOTE: Role selector UI is display-only. The server cryptographically validates and enforces roles via ADMIN_JWT_SECRET. */}
            <label><span>Admin role</span><select value={role} onChange={(e) => setRole(e.target.value)}><option value="super_admin">Super Admin</option><option value="finance">Finance</option><option value="support">Support</option><option value="content">Content</option></select></label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--subtle, #f8fafc)", borderRadius: 8, border: "1px solid var(--line, #e2e8f0)", marginTop: 6 }}>
              <div>
                <strong style={{ display: "block", fontSize: 11, color: "#1e293b" }}>Google Play Billing</strong>
                <span style={{ display: "block", fontSize: 10, color: "#64748b" }}>Service Account Credentials</span>
              </div>
              <span className={`status-pill ${googlePlayActive ? "green" : "amber"}`}>
                <span className="dot" />
                {googlePlayActive ? "Active" : "Not configured"}
              </span>
            </div>
          </div>
          <div className="security-note"><Lock size={16} /><span>Secret keys belong in server environment variables, never here.</span></div>
        </div>
      </div>
      <div className="panel editor-panel" style={{ marginTop: 16 }}>
        <div className="panel-head"><div><span className="eyebrow">AUDIT</span><h3>Recommended backend guardrails</h3></div></div>
        <div className="guardrail-grid">
          <Guard icon={ShieldCheck} title="Role-based access" text="Only finance roles can approve/refund money actions." />
          <Guard icon={FileClock} title="Audit logging" text="Record admin changes and payment actions with timestamps." />
          <Guard icon={Lock} title="Webhook verification" text="Verify gateway signatures server-side before crediting funds." />
          <Guard icon={Zap} title="Idempotency" text="Prevent duplicate credits/orders when requests retry." />
        </div>
      </div>
    </>
  );
}

function ToggleRow({ label, text, value, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <strong>{label}</strong>
        <span>{text}</span>
      </div>
      <button type="button" className={cn("toggle", value && "on")} onClick={onChange} aria-pressed={value}>
        <span />
      </button>
    </div>
  );
}

function Guard({ icon: Icon, title, text }) {
  return (
    <div className="guard">
      <div className="guard-icon"><Icon size={18} /></div>
      <div className="guard-content">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function UserDrawer({ user, notify, onUserUpdated }) {
  const [currentBalance, setCurrentBalance] = useState(user.balance ?? user.points ?? 0);
  const [status, setStatus] = useState(user.status || "Active");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(user.name || "");

  useEffect(() => {
    setCurrentBalance(user.balance ?? user.points ?? 0);
    setStatus(user.status || "Active");
    setNameVal(user.name || "");
  }, [user]);

  async function handleManualCredit(e) {
    if (e) e.preventDefault();
    if (checkDebounce('handleManualCredit')) return;
    const pts = Number(creditAmount);
    if (!pts || isNaN(pts)) {
      notify("Validation Error", "Please specify a valid points amount to credit.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(API.manualCredit, {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          points: pts,
          reason: creditReason.trim() || "Fail-safe manual points credit by admin"
        })
      });
      const newBal = res.newBalance ?? (currentBalance + pts);
      setCurrentBalance(newBal);
      setCreditAmount("");
      setCreditReason("");
      notify("Points Credited ⚡", res.message || `Successfully credited ${pts.toLocaleString()} points to ${user.email}.`);
      if (onUserUpdated) {
        onUserUpdated(
          {
            ...user,
            balance: newBal,
            points: newBal
          },
          res.transaction
        );
      }
    } catch (err) {
      notify("Credit Failed", err.message || "Could not connect to manual credit endpoint.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleRestrict() {
    setBusy(true);
    try {
      const res = await apiFetch(API.userRestrict(user.id), { method: "POST" });
      const nextStatus = res.status || (status === "Restricted" ? "Active" : "Restricted");
      setStatus(nextStatus);
      notify("Status Updated", `${user.email} status is now ${nextStatus}.`);
      if (onUserUpdated) {
        onUserUpdated({ ...user, status: nextStatus });
      }
    } catch (err) {
      notify("Action Failed", err.message || "Could not update user restriction.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveName() {
    if (!nameVal.trim()) return;
    setBusy(true);
    try {
      await apiFetch(API.user(user.id), {
        method: "PUT",
        body: JSON.stringify({ name: nameVal.trim() })
      });
      setEditingName(false);
      notify("Name Updated", `User name changed to ${nameVal.trim()}.`);
      if (onUserUpdated) {
        onUserUpdated({ ...user, name: nameVal.trim() });
      }
    } catch (err) {
      notify("Update Failed", err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-stack">
      {/* Profile Header */}
      <div className="profile-head">
        <div className="avatar large">{user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                style={{ padding: "4px 8px", fontSize: 11 }}
              />
              <button className="button primary" style={{ padding: "4px 8px" }} onClick={handleSaveName} disabled={busy}>
                <CheckCircle2 size={13} />
              </button>
              <button className="button secondary" style={{ padding: "4px 8px" }} onClick={() => setEditingName(false)}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h4 style={{ margin: 0 }}>{user.name}</h4>
              <button
                style={{ border: 0, background: "transparent", cursor: "pointer", color: "#64748b", padding: 2 }}
                onClick={() => setEditingName(true)}
                title="Edit name"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          <span style={{ fontSize: 11, color: "#64748b", wordBreak: "break-all" }}>{user.email}</span>
          <div className="drawer-inline" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <StatusPill status={status} />
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{user.id}</span>
          </div>
        </div>
      </div>

      {/* Balance & Orders Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, background: "#f8f9fb", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
        <div>
          <span style={{ display: "block", fontSize: 9, color: "#71717a", textTransform: "uppercase", fontWeight: 700 }}>Points Balance</span>
          <strong style={{ display: "block", fontSize: 14, color: "#18181b", marginTop: 2 }}>{currency(currentBalance)}</strong>
        </div>
        <div>
          <span style={{ display: "block", fontSize: 9, color: "#71717a", textTransform: "uppercase", fontWeight: 700 }}>Total Orders</span>
          <strong style={{ display: "block", fontSize: 14, color: "#18181b", marginTop: 2 }}>{user.orders ?? user.ordersCount ?? 0}</strong>
        </div>
        <div>
          <span style={{ display: "block", fontSize: 9, color: "#71717a", textTransform: "uppercase", fontWeight: 700 }}>Joined</span>
          <strong style={{ display: "block", fontSize: 11, color: "#18181b", marginTop: 4 }}>{user.joined}</strong>
        </div>
      </div>

      {/* FAIL-SAFE MANUAL POINTS CREDIT & BONUS INJECTION CARD */}
      <div style={{ border: "1px solid #c7d2fe", background: "linear-gradient(180deg, #f5f7ff 0%, #ffffff 100%)", borderRadius: 12, padding: "14px", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#eef2ff", display: "grid", placeItems: "center", color: "#4f46e5" }}>
              <Zap size={14} />
            </div>
            <strong style={{ fontSize: 12, color: "#1e1b4b" }}>Manual Points & Bonus Credit</strong>
          </div>
          <span style={{ fontSize: 9, padding: "2px 6px", background: "#e0e7ff", color: "#3730a3", borderRadius: 999, fontWeight: 700 }}>
            FAIL-SAFE
          </span>
        </div>
        
        <p style={{ margin: "0 0 10px", fontSize: 10, color: "#6366f1", lineHeight: 1.4 }}>
          Directly credits user wallet by email ID and logs an audit transaction to the immutable ledger.
        </p>

        <form onSubmit={handleManualCredit} style={{ display: "grid", gap: 9 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#475569" }}>Points Amount</label>
              <span style={{ fontSize: 9, color: "#64748b" }}>Target: <strong>{user.email}</strong></span>
            </div>
            <input
              type="number"
              placeholder="e.g. 500"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              style={{ fontSize: 11, padding: "7px 10px" }}
              required
            />
          </div>

          {/* Quick preset chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[100, 500, 1000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                className="button secondary"
                style={{ padding: "3px 8px", fontSize: 10, borderRadius: 6, background: "#fff", borderColor: "#c7d2fe" }}
                onClick={() => setCreditAmount(String(preset))}
              >
                +{preset.toLocaleString()} pts
              </button>
            ))}
          </div>

          <div>
            <label style={{ marginBottom: 4, fontSize: 10, fontWeight: 700, color: "#475569" }}>Reason / Audit Note</label>
            <input
              type="text"
              placeholder="e.g. Gateway callback failure / UTR: 82947192"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              style={{ fontSize: 10, padding: "7px 10px" }}
            />
          </div>

          <button
            type="submit"
            className="button primary"
            style={{ width: "100%", justifyContent: "center", padding: "8px", marginTop: 4 }}
            disabled={busy || !creditAmount}
          >
            {busy ? (
              <><RefreshCw size={14} className="spin" /> Processing Credit…</>
            ) : (
              <><Zap size={14} /> Credit Points & Update Ledger</>
            )}
          </button>
        </form>
      </div>

      {/* Account Restrictions & Status Controls */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4, display: "grid", gap: 8 }}>
        <button
          className={cn("button", status === "Restricted" ? "primary" : "danger")}
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleToggleRestrict}
          disabled={busy}
        >
          <Lock size={14} /> {status === "Restricted" ? "Unrestrict / Reactivate Account" : "Restrict / Block Account"}
        </button>
      </div>
    </div>
  );
}

function PaymentDrawer({ payment, notify }) {
  const [currentPayment, setCurrentPayment] = useState(payment);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setCurrentPayment(payment);
  }, [payment]);

  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await apiFetch(API.paymentVerify(currentPayment.id), { method: "POST" });
      if (res && res.payment) {
        setCurrentPayment(res.payment);
        notify("Payment Verified ⚡", `Payment ${currentPayment.id} verified. Points released to user wallet.`);
      } else {
        notify("Backend checked", res?.message || "Payment status checked with backend.");
      }
    } catch (err) {
      notify("Verification check", err.message || "Connected to backend verification endpoint.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="drawer-stack">
      <div className="payment-amount">
        <div>
          <span>Payment amount</span>
          <strong>{currency(currentPayment.amount)}</strong>
        </div>
        <StatusPill status={currentPayment.status} />
      </div>

      <div className="detail-grid">
        <div><span>Transaction</span><strong>{currentPayment.id}</strong></div>
        <div><span>Method</span><strong style={{ display: 'inline-flex', alignItems: 'center' }}><PaymentMethodPill method={currentPayment.method} /></strong></div>
        <div><span>Credit state</span><strong>{currentPayment.credit}</strong></div>
        {(currentPayment.orderId || (currentPayment.method && String(currentPayment.method).toLowerCase().includes('google'))) && (
          <div><span>Order ID</span><strong style={{ wordBreak: 'break-all', fontSize: 11 }}>{currentPayment.orderId || 'N/A'}</strong></div>
        )}
        {(currentPayment.purchaseToken || (currentPayment.method && String(currentPayment.method).toLowerCase().includes('google'))) && (
          <div><span>Purchase token</span><strong style={{ wordBreak: 'break-all', fontSize: 10, color: '#475569' }}>{currentPayment.purchaseToken || 'N/A'}</strong></div>
        )}
      </div>

      <div className="timeline">
        <Timeline label="Gateway callback received" done={currentPayment.status === "Success"} />
        <Timeline label="Backend verification" done={currentPayment.status === "Success"} />
        <Timeline label="Red Famosa credit action" done={currentPayment.credit === "Completed"} />
      </div>

      <button className="full-button" onClick={handleVerify} disabled={verifying}>
        {verifying ? <RefreshCw size={15} className="spin" /> : <ShieldCheck size={15} />}
        {currentPayment.status === "Success" ? "Re-verify through backend" : "Verify & release credit"}
      </button>
    </div>
  );
}

function Timeline({ label, done }) { return <div className={cn("timeline-row", done && "done")}><span>{done ? <CheckCircle2 size={16} /> : <Activity size={16} />}</span><strong>{label}</strong></div>; }
function ServiceDrawer({ service, notify }) { return <div className="drawer-stack"><div className="drawer-banner"><Boxes size={19} /><div><strong>{service.name}</strong><span>{service.category} · RF mapping {service.rfId}</span></div></div><label>Customer price<input defaultValue={service.price} /></label><label>Minimum quantity<input defaultValue={service.min} /></label><label>Maximum quantity<input defaultValue={service.max} /></label><label>Status<select defaultValue={service.status}><option>Active</option><option>Paused</option></select></label><button className="full-button" onClick={() => notify("Service block", `PUT /api/admin/services/${service.id} is ready to wire.`)}><CheckCircle2 size={15} /> Save service</button></div>; }
function ContentDrawer({ item, notify, onContentUpdated }) {
  const [title, setTitle] = useState(item?.title || "");
  const [type, setType] = useState(item?.type || "Text");
  const [content, setContent] = useState(item?.content || item?.src || "");
  const [status, setStatus] = useState(item?.status || "Published");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(item?.title || "");
    setType(item?.type || "Text");
    setContent(item?.content || item?.src || "");
    setStatus(item?.status || "Published");
  }, [item]);

  async function handleSave() {
    setBusy(true);
    try {
      const res = await apiFetch(API.contentItem(item.id), {
        method: "PUT",
        body: JSON.stringify({ title, type, status, content, src: content })
      });
      notify("Content block updated", `${title} saved through the backend.`);
      if (onContentUpdated) onContentUpdated(res?.item || { ...item, title, type, status, content, src: content, updated: "Just now" });
    } catch (e) {
      notify("Save failed", e.message || "Could not save content block.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-stack">
      <div className="drawer-banner"><Palette size={19} /><div><strong>{title || item.title}</strong><span>{type} · {item.id}</span></div></div>
      <label>Block title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>Content type<select value={type} onChange={(e) => setType(e.target.value)}><option>Text</option><option>Banner</option><option>Video</option><option>Dynamic</option><option>Image</option></select></label>
      <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>Published</option><option>Draft</option><option>Archived</option></select></label>
      <label>Content / Media URL<textarea rows="7" value={content} onChange={(e) => setContent(e.target.value)} /></label>
      <div className="content-rule"><Cloud size={15} /><span>App route: GET /api/content → customer app consumes published blocks.</span></div>
      <button className="full-button" onClick={handleSave} disabled={busy}>
        {busy ? <RefreshCw className="spin" size={15} /> : <CheckCircle2 size={15} />}
        Publish changes
      </button>
    </div>
  );
}

class SocialBoostAdminErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error("SocialBoost Admin render error:", error); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f6f7fb", fontFamily: "Inter, system-ui, sans-serif" }}>
          <div style={{ maxWidth: 720, width: "100%", background: "#fff", border: "1px solid #e7eaf0", borderRadius: 16, padding: 24, boxShadow: "0 10px 30px rgba(18,27,43,.06)" }}>
            <strong style={{ display: "block", fontSize: 18, marginBottom: 8 }}>SocialBoost Admin could not render this screen.</strong>
            <div style={{ color: "#697386", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>The application caught a frontend error instead of showing a blank screen. Check the browser console for the complete stack trace.</div>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f8f9fb", borderRadius: 10, padding: 12, fontSize: 11, color: "#334155" }}>{String(this.state.error?.message || this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminLogin({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_CONFIG.baseUrl}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      if (data.token) {
        secureAdminStorage.setItem("socialboost_admin_token", data.token);
        onLogin();
      } else {
        alert(data.error || "Login Failed");
      }
    } catch (err) {
      alert("Network error");
    }
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#090a0f', color: '#fff' }}>
      <form onSubmit={handleLogin} style={{ background: '#1c1f2e', padding: 40, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2>Admin Access</h2>
        <input type="password" placeholder="Admin Password" value={pwd} onChange={e => setPwd(e.target.value)} required style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: '#2a2e40', color: '#fff' }} />
        <button type="submit" style={{ padding: '12px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Login</button>
      </form>
    </div>
  );
}

export default function SocialBoostAdminApp() {
  const [auth, setAuth] = useState(!!secureAdminStorage.getItem("socialboost_admin_token"));

  useEffect(() => {
    const handleUnauthorized = () => setAuth(false);
    window.addEventListener("socialboost:admin_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("socialboost:admin_unauthorized", handleUnauthorized);
  }, []);

  if (!auth) return <AdminLogin onLogin={() => setAuth(true)} />;
  return <SocialBoostAdminErrorBoundary><SocialBoostAdmin onLogout={() => setAuth(false)} /></SocialBoostAdminErrorBoundary>;
}

const styles = `
html, body, #root {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100vh !important;
  max-height: 100vh !important;
  overflow: hidden !important;
  background: #f6f7fb;
}

:root {
  --bg: #f6f7fb;
  --panel: #fff;
  --line: #e7eaf0;
  --text: #141820;
  --muted: #697386;
  --blue: #4f46e5;
  --blue2: #eef0ff;
  --shadow: 0 10px 30px rgba(18, 27, 43, 0.05);
  --sidebar: #111827;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, input, select, textarea { font: inherit; }

/* SHELL: Locks the entire window to 100vh so only sub-panels scroll */
.app-shell {
  height: 100vh;
  width: 100%;
  display: flex;
  background: var(--bg);
  overflow: hidden;
}

/* SIDEBAR: Pinned height with locked header and footer */
.sidebar {
  width: 240px;
  background: var(--sidebar);
  color: #dce2ee;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 14px 10px 10px;
  position: relative;
  z-index: 30;
  flex-shrink: 0;
  overflow: hidden;
}
.sidebar-collapsed { width: 72px; }

/* 1. Locked Top Section of Sidebar */
.brand-block {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 4px 6px 14px;
  flex-shrink: 0;
}
.brand-mark { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; flex-shrink: 0; }
.brand-name { font-weight: 800; font-size: 15px; letter-spacing: -0.02em; }
.brand-sub { font-size: 8px; letter-spacing: 0.1em; color: #8691a5; margin-top: 1px; }

.workspace-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #171f2f;
  border: 1px solid #263147;
  padding: 7px 8px;
  border-radius: 10px;
  margin: 0 0 10px;
  flex-shrink: 0;
}
.workspace-logo { width: 24px; height: 24px; border-radius: 6px; display: grid; place-items: center; background: #eef0ff; color: #4f46e5; font-size: 10px; font-weight: 800; flex-shrink: 0; }
.workspace-copy { min-width: 0; flex: 1; }
.workspace-copy strong, .workspace-copy span { display: block; }
.workspace-copy strong { font-size: 11px; color: #f6f7fa; }
.workspace-copy span { font-size: 9px; color: #7f8ba0; }
.nav-label { font-size: 9px; letter-spacing: 0.1em; font-weight: 800; color: #8c95a8; padding: 0 8px 6px; flex-shrink: 0; }

/* 2. Scrollable Middle Navigation List with Clean Dark Scrollbar */
.nav-list {
  display: grid;
  gap: 3px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: #374151 transparent;
}
.nav-list::-webkit-scrollbar { width: 5px; }
.nav-list::-webkit-scrollbar-track { background: transparent; }
.nav-list::-webkit-scrollbar-thumb { background: #374151; border-radius: 999px; }
.nav-list::-webkit-scrollbar-thumb:hover { background: #4f46e5; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  background: transparent;
  color: #aeb8ca;
  padding: 7px 9px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  width: 100%;
  flex-shrink: 0;
}
.nav-item:hover { background: #171f2f; color: #fff; }
.nav-item.active { background: #eef0ff; color: #4338ca; }
.nav-item span { font-size: 12px; font-weight: 600; }

/* 3. Locked Bottom Footer of Sidebar */
.sidebar-footer {
  margin-top: auto;
  display: grid;
  gap: 5px;
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid #1f2937;
}
.sidebar-footer .nav-item { margin: 0; }
.health-mini { display: flex; gap: 8px; align-items: center; background: #151d2b; border: 1px solid #253046; padding: 7px 9px; border-radius: 8px; }
.health-mini strong, .health-mini span { display: block; }
.health-mini strong { font-size: 10px; color: #eef2f8; }
.health-mini span { font-size: 8px; color: #768299; margin-top: 1px; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15); flex-shrink: 0; }

/* MAIN CONTENT SHELL */
.main-shell {
  flex: 1 1 0%;
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.topbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 20;
  flex-shrink: 0;
}
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 10px; }
.breadcrumbs { display: flex; gap: 7px; align-items: center; color: #94a0b1; font-size: 12px; }
.breadcrumbs strong { color: #253047; }
.connection-chip { display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); padding: 5px 9px; border-radius: 999px; font-size: 10px; color: #596579; background: #fbfbfd; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #9ca3af; }
.dot.green { background: #22c55e; }
.dot.amber { background: #f59e0b; }
.dot.red { background: #ef4444; }
.icon-button { border: 1px solid var(--line); background: #fff; width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center; color: #606b7f; cursor: pointer; }
.icon-button:hover { background: #f7f8fb; }
.admin-avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #171f2f; color: #fff; font-size: 10px; font-weight: 800; }

.page-content { padding: 18px 20px 40px; box-sizing: border-box; flex: 1; }
.section-title-row { display: flex; justify-content: space-between; gap: 15px; align-items: flex-start; margin-bottom: 16px; }
.section-title-row h2 { font-size: 22px; line-height: 1.1; margin: 3px 0 5px; letter-spacing: -0.02em; }
.section-title-row p { margin: 0; color: var(--muted); font-size: 12px; max-width: 650px; }
.eyebrow { font-size: 9px; letter-spacing: 0.1em; font-weight: 800; color: #8c95a8; }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid var(--line); padding: 7px 11px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; background: #fff; color: #3e4859; }
.button.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.button.secondary:hover { background: #f7f8fb; }
.button.primary:hover { background: #4338ca; }
.button.danger { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
.button-group { display: flex; gap: 8px; flex-wrap: wrap; }
.full-button { width: 100%; border: 1px solid var(--line); background: #fff; color: #353e50; padding: 8px 10px; border-radius: 8px; display: flex; gap: 7px; justify-content: center; align-items: center; font-weight: 700; font-size: 11px; cursor: pointer; }
.full-button:hover { background: #f8f9fb; }
.text-button { border: 0; background: transparent; color: #4f46e5; font-weight: 700; font-size: 11px; cursor: pointer; }

.notice-strip { display: flex; align-items: center; gap: 10px; border: 1px solid #dce2ff; background: #fafbff; padding: 10px 12px; border-radius: 10px; margin-bottom: 15px; }
.notice-strip.light { background: #fff; }
.notice-icon { width: 28px; height: 28px; border-radius: 7px; background: #eef0ff; color: #4f46e5; display: grid; place-items: center; flex-shrink: 0; }
.notice-strip > div:nth-child(2) { flex: 1; min-width: 0; }
.notice-strip strong, .notice-strip span { display: block; }
.notice-strip strong { font-size: 11px; }
.notice-strip span { font-size: 10px; color: var(--muted); margin-top: 1px; }
.backend-badge { font-size: 9px !important; font-weight: 800; color: #4f46e5 !important; letter-spacing: 0.08em; margin: 0 !important; white-space: nowrap; }

.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 15px; }
.metric-grid.compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.metric-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; gap: 10px; box-shadow: var(--shadow); min-width: 0; }
.metric-icon { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; }
.metric-icon.blue { background: #eef0ff; color: #4f46e5; }
.metric-icon.green { background: #ecfdf5; color: #059669; }
.metric-icon.purple { background: #f5f3ff; color: #7c3aed; }
.metric-icon.amber { background: #fffbeb; color: #d97706; }
.metric-icon.red { background: #fff1f2; color: #e11d48; }
.metric-main { min-width: 0; flex: 1; }
.metric-label { font-size: 9px; color: #80899b; font-weight: 700; text-transform: uppercase; }
.metric-value { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; margin-top: 1px; }
.metric-detail { font-size: 9px; color: #94a0b1; margin-top: 2px; }
.trend { color: #059669; font-weight: 800; margin-right: 4px; }

.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 14px; margin-bottom: 15px; }
.panel { background: #fff; border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); min-width: 0; padding: 20px; box-sizing: border-box; }
.panel.table-panel { padding: 0; overflow: hidden; }
.chart-panel, .bridge-panel, .quick-actions { padding: 18px; }
.panel-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
.panel-head h3 { margin: 2px 0 0; font-size: 15px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; }
.small-select { border: 1px solid var(--line); background: #fff; border-radius: 6px; padding: 5px 8px; display: flex; align-items: center; gap: 4px; font-size: 9px; color: #687286; }
.chart-wrap { height: 210px; display: flex; gap: 10px; width: 100%; }
.y-axis { display: flex; flex-direction: column; justify-content: space-between; color: #a1a9b7; font-size: 8px; padding: 2px 0 20px; flex-shrink: 0; }
.chart-grid { position: relative; flex: 1; display: flex; width: 100%; min-width: 0; }
.chart-grid > span { position: absolute; left: 0; right: 0; border-top: 1px dashed #edf0f4; }
.chart-grid > span:nth-child(1) { top: 0; }
.chart-grid > span:nth-child(2) { top: 25%; }
.chart-grid > span:nth-child(3) { top: 50%; }
.chart-grid > span:nth-child(4) { top: 75%; }
.chart-grid > span:nth-child(5) { top: 100%; }
.line-chart { position: absolute; left: 0; right: 0; top: 0; bottom: 20px; width: 100%; height: calc(100% - 20px); color: #4f46e5; }
.x-axis { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; color: #9aa3b2; font-size: 8px; }

.bridge-flow { display: grid; gap: 6px; }
.bridge-node { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
.bridge-node.primary { border-color: #dcd8ff; background: #fafaff; }
.bridge-icon { width: 28px; height: 28px; border-radius: 8px; background: #f2f4f8; color: #556176; display: grid; place-items: center; flex-shrink: 0; }
.bridge-node.primary .bridge-icon { background: #eef0ff; color: #4f46e5; }
.bridge-node strong, .bridge-node span { display: block; }
.bridge-node strong { font-size: 11px; }
.bridge-node span { font-size: 9px; color: #8d97a8; margin-top: 1px; }
.flow-line { height: 8px; width: 2px; background: #d6dbe5; margin-left: 21px; }
.bridge-note { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #5c6678; margin: 10px 0; }

.shortcut-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.shortcut { display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); background: #fff; border-radius: 10px; padding: 9px 10px; text-align: left; cursor: pointer; min-width: 0; }
.shortcut:hover { background: #fafbff; }
.shortcut-icon { width: 28px; height: 28px; border-radius: 7px; background: #f1f3f7; display: grid; place-items: center; color: #596579; flex-shrink: 0; }
.shortcut > div:nth-child(2) { flex: 1; min-width: 0; }
.shortcut strong, .shortcut span { display: block; }
.shortcut strong { font-size: 11px; }
.shortcut span { font-size: 9px; color: #929bad; margin-top: 1px; }

.ui-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: -2px 0 14px; }
.ui-tab { border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 6px 11px; font-size: 10px; font-weight: 800; color: #687286; cursor: pointer; }
.ui-tab.active { background: #eef0ff; color: #4338ca; border-color: #dcd8ff; }

.grid-admin-layout { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 15px; }
.hierarchy-panel { padding: 12px; min-width: 0; }
.hierarchy-list { display: grid; gap: 7px; max-height: 420px; overflow-y: auto; }
.hierarchy-card { border: 1px solid var(--line); background: #fff; border-radius: 10px; padding: 9px; text-align: left; cursor: pointer; width: 100%; transition: 0.15s; }
.hierarchy-card:hover { background: #fafbff; border-color: #d9ddff; }
.hierarchy-card.selected { border-color: #4f46e5; background: #fafaff; box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.15); }
.hierarchy-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hierarchy-card strong, .hierarchy-card span, .hierarchy-card small { display: block; }
.hierarchy-card strong { font-size: 11px; color: #1f2937; }
.hierarchy-card span { font-size: 9px; color: #697386; margin-top: 3px; }
.hierarchy-card small { font-size: 8px; color: #9aa3b2; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.service-grid-editor-panel { margin-bottom: 15px; padding: 15px; }
.panel-subtitle { margin: 3px 0 0; color: #929bad; font-size: 9px; }
.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }

.endpoint-panel { padding: 15px; margin-bottom: 15px; }
.endpoint-grid { display: grid; gap: 6px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.endpoint-grid code, .panel-head code { display: block; padding: 7px 9px; border: 1px solid var(--line); border-radius: 7px; background: #fafbfc; font-size: 9px; color: #465268; word-break: break-all; }

.content-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 14px; margin-bottom: 15px; }
.preview-panel { padding: 15px; }

.table-panel { overflow: hidden; }
.table-head { display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--line); font-size: 9px; color: #7f899b; font-weight: 700; }
.table-panel table { width: 100%; border-collapse: collapse; }
.table-panel th { text-align: left; padding: 8px 12px; font-size: 8px; color: #969eac; letter-spacing: 0.07em; text-transform: uppercase; background: #fbfbfc; }
.table-panel td { padding: 10px 12px; border-top: 1px solid #f0f1f4; font-size: 10px; color: #4a5568; vertical-align: middle; }
.table-panel tbody tr:hover { background: #fcfcfe; }
.person-cell { display: flex; align-items: center; gap: 10px; }
.person-cell strong { display: block; font-size: 11px; font-weight: 700; color: #1f2937; }
.person-cell span { display: block; font-size: 10px; color: #64748b; margin-top: 1px; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #eef0ff; color: #4f46e5; display: grid; place-items: center; font-weight: 800; font-size: 10px; flex-shrink: 0; }
.avatar.large { width: 44px; height: 44px; font-size: 14px; }
.profile-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.profile-head h4 { margin: 0; font-size: 14px; }
.profile-head span { font-size: 11px; color: var(--muted); }
.status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 6px; border-radius: 999px; font-size: 8px; font-weight: 800; background: #f3f4f6; color: #626d7c; }
.status-pill .dot { width: 5px; height: 5px; border-radius: 50%; background: #94a3b8; }
.status-pill.green { background: #ecfdf5; color: #047857; }
.status-pill.green .dot { background: #10b981; }
.status-pill.amber { background: #fffbeb; color: #b45309; }
.status-pill.amber .dot { background: #f59e0b; }
.status-pill.red { background: #fff1f2; color: #be123c; }
.status-pill.red .dot { background: #fb7185; }

/* Order step flow & table */
.order-flow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 18px; margin-bottom: 16px; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.order-step { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 10px; flex: 1; background: #fff; min-width: 0; }
.order-step.active { border-color: #6366f1; background: #fafbff; box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2); }
.order-step .step-num { font-size: 13px; font-weight: 800; color: #6366f1; background: #eef2ff; border-radius: 6px; width: 28px; height: 28px; display: grid; place-items: center; flex-shrink: 0; }
.order-step.active .step-num { background: #4f46e5; color: #fff; }
.order-step .step-body strong { font-size: 12px; font-weight: 700; color: #1e293b; display: block; }
.order-step .step-body small { font-size: 10px; color: #64748b; display: block; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-arrow { color: #94a3b8; font-size: 16px; font-weight: 700; flex-shrink: 0; }
.muted-line { display: block; font-size: 9px; color: #94a3b8; margin-top: 2px; }
.provider-id { font-family: monospace; font-size: 10px; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }

/* Red Famosa hero & stats */
.rf-hero { padding: 18px; margin-bottom: 16px; background: #fff; }
.rf-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.rf-logo { width: 40px; height: 40px; border-radius: 10px; background: #eef0ff; color: #4f46e5; display: grid; place-items: center; flex-shrink: 0; }
.rf-brand strong { display: block; font-size: 15px; font-weight: 800; color: #1e293b; }
.rf-brand span { display: block; font-size: 11px; color: #64748b; margin-top: 2px; }
.rf-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
.rf-stat-grid div { background: #f8fafc; border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; }
.rf-stat-grid span { display: block; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.rf-stat-grid strong { display: block; font-size: 15px; font-weight: 800; color: #1e293b; margin-top: 4px; }

/* Red Famosa list & code blocks */
.rf-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 14px; }
.rf-list { display: grid; gap: 8px; }
.rf-item { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; align-items: flex-start; background: #fff; }
.rf-item-icon { width: 30px; height: 30px; border-radius: 7px; background: #f1f3f7; color: #596579; display: grid; place-items: center; flex-shrink: 0; }
.rf-item strong { display: block; font-size: 11px; font-weight: 700; color: #1e293b; }
.rf-item span { display: block; font-size: 10px; color: #64748b; margin-top: 2px; line-height: 1.4; }
.code-list { display: grid; gap: 6px; margin-bottom: 12px; }
.code-list code { display: block; padding: 8px 12px; background: #f8fafc; border: 1px solid var(--line); border-radius: 7px; font-size: 10px; font-family: monospace; color: #334155; word-break: break-all; }
.security-note { display: flex; align-items: center; gap: 7px; font-size: 10px; color: #64748b; margin-bottom: 12px; }

/* Settings & App Config Toggle Rows */
.settings-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; }
.switch-list { display: flex; flex-direction: column; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 13px 0; border-top: 1px solid #f1f5f9; }
.toggle-row:first-child { border-top: 0; padding-top: 0; }
.toggle-row:last-child { padding-bottom: 0; }
.toggle-info { flex: 1; min-width: 0; }
.toggle-info strong { display: block; font-size: 13px; font-weight: 700; color: #1e293b; }
.toggle-info span { display: block; font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.45; word-break: break-word; }
.toggle { width: 42px; height: 24px; border-radius: 999px; background: #e2e8f0; border: 0; position: relative; cursor: pointer; flex: 0 0 auto; transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1); padding: 0; }
.toggle span { position: absolute !important; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.toggle.on { background: #4f46e5; }
.toggle.on span { transform: translateX(18px); }

/* Settings Infrastructure Fields */
.setting-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
.setting-fields label { display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 700; color: #475569; min-width: 0; }
.setting-fields input, .setting-fields select { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #1e293b; background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.setting-fields input:focus, .setting-fields select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }

/* Guardrails grid */
.guardrail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.guard { display: flex; gap: 12px; padding: 14px; border: 1px solid var(--line); border-radius: 10px; background: #f8fafc; align-items: flex-start; min-width: 0; box-sizing: border-box; }
.guard-icon { width: 34px; height: 34px; border-radius: 8px; background: #eef2ff; color: #4f46e5; display: grid; place-items: center; flex-shrink: 0; }
.guard-content, .guard > div:nth-child(2) { flex: 1; min-width: 0; }
.guard-content strong, .guard > div:nth-child(2) strong { display: block; font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
.guard-content span, .guard > div:nth-child(2) span { display: block; font-size: 11px; color: #64748b; line-height: 1.45; word-break: break-word; }

/* Editor Panel & Collection Cards for App & UI/UX */
.editor-panel { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); margin-bottom: 16px; min-width: 0; box-sizing: border-box; }
.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 14px; }
.editor-grid label { display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 700; color: #475569; min-width: 0; }
.editor-grid label.full-width { grid-column: 1 / -1; }
.editor-grid input, .editor-grid select, .editor-grid textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #1e293b; background: #fff; outline: none; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
.editor-grid textarea { resize: vertical; line-height: 1.5; }
.editor-grid input:focus, .editor-grid select:focus, .editor-grid textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
.collection-list { display: grid; gap: 14px; margin-top: 14px; }
.collection-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); }
.collection-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
.collection-head strong { font-size: 13px; font-weight: 700; color: #1e293b; display: block; }
.collection-badge { font-size: 10px; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 2px 7px; border-radius: 4px; display: inline-block; margin-top: 3px; }

/* Payment Details Drawer */
.payment-amount { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #f8fafc; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 10px; }
.payment-amount > div > span { display: block; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
.payment-amount > div > strong { display: block; font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 2px; }
.detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.detail-grid > div { padding: 9px 10px; background: #fff; border: 1px solid var(--line); border-radius: 8px; }
.detail-grid span { display: block; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
.detail-grid strong { display: block; font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 3px; word-break: break-all; }
.timeline { display: grid; gap: 8px; margin-bottom: 14px; }
.timeline-row { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid var(--line); font-size: 11px; color: #64748b; }
.timeline-row.done { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; font-weight: 600; }
.timeline-row strong { font-weight: 600; }

.drawer-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.28); z-index: 100; display: flex; justify-content: flex-end; }
.drawer { background: #fff; height: 100%; width: 380px; box-shadow: -20px 0 45px rgba(15, 23, 42, 0.14); display: flex; flex-direction: column; }
.drawer-wide { width: 480px; }
.drawer-head { padding: 14px 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: flex-start; }
.drawer-body { padding: 16px; overflow-y: auto; }
.drawer-stack { display: grid; gap: 10px; }

label { display: grid; gap: 4px; font-size: 9px; font-weight: 700; color: #596579; }
input, select, textarea { width: 100%; border: 1px solid var(--line); outline: 0; background: #fff; border-radius: 7px; padding: 7px 9px; font-size: 10px; color: #293244; }

.toast { position: fixed; right: 18px; bottom: 18px; background: #121826; color: #fff; display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-radius: 9px; z-index: 200; max-width: 320px; }
.empty-state { padding: 30px 16px; display: grid; place-items: center; text-align: center; gap: 5px; color: #8c95a6; }
.empty-icon { width: 34px; height: 34px; border-radius: 9px; background: #f1f3f6; display: grid; place-items: center; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.mobile-only { display: none; }

@media (max-width: 1250px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-grid, .content-layout, .settings-grid, .rf-grid { grid-template-columns: 1fr; }
  .grid-admin-layout { grid-template-columns: 1fr; }
  .endpoint-panel .endpoint-grid { grid-template-columns: 1fr; }
  .shortcut-grid, .guardrail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .sidebar { position: fixed; left: -250px; top: 0; bottom: 0; height: 100vh; }
  .sidebar.mobile-open { left: 0; }
  .sidebar-collapsed { width: 240px; }
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
  .topbar { padding: 0 14px; }
  .page-content { padding: 14px 12px 30px; }
  .metric-grid, .metric-grid.compact { grid-template-columns: 1fr 1fr; }
  .shortcut-grid, .rf-stat-grid { grid-template-columns: 1fr; }
  .table-panel { overflow: auto; }
  .table-panel table { min-width: 600px; }
  .drawer, .drawer-wide { width: min(100%, 380px); }
}
`;