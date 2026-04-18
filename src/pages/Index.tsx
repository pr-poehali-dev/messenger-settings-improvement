import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AuthStep = "login" | "twofa" | "app";
type Page = "home" | "chats" | "dm" | "channels" | "search" | "profile" | "settings";
type SettingsTab = "notifications" | "privacy" | "twofa" | "appearance" | "media" | "devices";
type Theme = "dark" | "light";
type ChatType = "dm" | "group" | "channel";

interface Contact {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "away" | "offline";
  lastMsg: string;
  time: string;
  unread: number;
  encrypted: boolean;
  type: ChatType;
  description?: string;
  members?: number;
  username?: string;
}

interface Message {
  id: number;
  from: string;
  text: string;
  time: string;
  mine: boolean;
  encrypted: boolean;
  reactions?: string[];
}

interface Device {
  id: number;
  name: string;
  os: string;
  location: string;
  lastActive: string;
  icon: string;
  current: boolean;
}

interface AppSettings {
  theme: Theme;
  soundEnabled: boolean;
  vibration: boolean;
  popup: boolean;
  dmNotify: boolean;
  groupNotify: boolean;
  previewOnLock: boolean;
  phoneVisible: string;
  onlineVisible: string;
  lastSeenVisible: string;
  photoVisible: string;
  addToGroups: string;
  twofa: boolean;
  tfaEmail: boolean;
  autoDownload: boolean;
  saveMedia: boolean;
  compactMode: boolean;
  fontSize: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  "А": "#e53e3e", "К": "#9f1239", "М": "#c53030", "Д": "#b91c1c",
  "И": "#dc2626", "Г": "#ef4444", "Н": "#f87171", "Я": "#e53e3e",
  "Р": "#be123c", "С": "#881337",
};
const getColor = (l: string) => AVATAR_COLORS[l] || "#e53e3e";

const INITIAL_CONTACTS: Contact[] = [
  { id: 1, name: "Алёна Смирнова", avatar: "А", status: "online", lastMsg: "Отправила файл", time: "14:32", unread: 2, encrypted: true, type: "dm", username: "@alena_s" },
  { id: 2, name: "Команда Kiscord", avatar: "К", status: "online", lastMsg: "Обновление v2.1 готово", time: "12:10", unread: 5, encrypted: true, type: "group", members: 24, description: "Внутренняя команда разработки Kiscord" },
  { id: 3, name: "Максим Волков", avatar: "М", status: "offline", lastMsg: "Хорошо, увидимся завтра", time: "вчера", unread: 0, encrypted: true, type: "dm", username: "@max_volkov" },
  { id: 4, name: "Дизайн Hub", avatar: "Д", status: "online", lastMsg: "Макет готов к ревью", time: "вчера", unread: 1, encrypted: true, type: "channel", members: 1240, description: "Новости дизайна и интерфейсов", username: "@design_hub" },
  { id: 5, name: "Ирина Ковалёва", avatar: "И", status: "away", lastMsg: "Спасибо за помощь!", time: "пн", unread: 0, encrypted: true, type: "dm", username: "@irina_k" },
  { id: 6, name: "Tech News RU", avatar: "Н", status: "online", lastMsg: "Apple выпустила обновление", time: "пн", unread: 3, encrypted: false, type: "channel", members: 58200, description: "Новости технологий на русском", username: "@technews_ru" },
  { id: 7, name: "Разработка", avatar: "Р", status: "online", lastMsg: "Кто знает как починить баг?", time: "вт", unread: 0, encrypted: true, type: "group", members: 8, description: "Наша команда разработки" },
];

const INITIAL_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, from: "Алёна", text: "Привет! Как дела с проектом?", time: "14:20", mine: false, encrypted: true },
    { id: 2, from: "Я", text: "Всё идёт по плану, сдаём в пятницу", time: "14:22", mine: true, encrypted: true },
    { id: 3, from: "Алёна", text: "Отлично! Я уже подготовила документацию", time: "14:25", mine: false, encrypted: true },
    { id: 4, from: "Я", text: "Пришли когда будет готово", time: "14:28", mine: true, encrypted: true },
    { id: 5, from: "Алёна", text: "Отправила файл", time: "14:32", mine: false, encrypted: true },
  ],
  2: [
    { id: 1, from: "Система", text: "Добро пожаловать в группу Команда Kiscord", time: "09:00", mine: false, encrypted: true },
    { id: 2, from: "Алёна", text: "Всем привет! Начинаем работу над v2.1", time: "10:15", mine: false, encrypted: true },
    { id: 3, from: "Максим", text: "Готов, жду задачи", time: "10:17", mine: false, encrypted: true },
    { id: 4, from: "Я", text: "Я занимаюсь авторизацией", time: "10:20", mine: true, encrypted: true },
    { id: 5, from: "Алёна", text: "Обновление v2.1 готово", time: "12:10", mine: false, encrypted: true },
  ],
  4: [
    { id: 1, from: "Дизайн Hub", text: "Новый тренд: Bento-грид в UI 2025", time: "вчера", mine: false, encrypted: false },
    { id: 2, from: "Дизайн Hub", text: "10 принципов минималистичного дизайна", time: "вчера", mine: false, encrypted: false },
    { id: 3, from: "Дизайн Hub", text: "Макет готов к ревью", time: "вчера", mine: false, encrypted: false },
  ],
  6: [
    { id: 1, from: "Tech News", text: "Google анонсировала новую модель Gemini Ultra", time: "пн", mine: false, encrypted: false },
    { id: 2, from: "Tech News", text: "OpenAI запускает GPT-5 в мае 2025", time: "пн", mine: false, encrypted: false },
    { id: 3, from: "Tech News", text: "Apple выпустила обновление iOS 18.4", time: "пн", mine: false, encrypted: false },
  ],
};

const INITIAL_DEVICES: Device[] = [
  { id: 1, name: "MacBook Pro 16″", os: "macOS Sequoia", location: "Москва, Россия", lastActive: "Сейчас", icon: "Laptop", current: true },
  { id: 2, name: "iPhone 15 Pro", os: "iOS 18.4", location: "Москва, Россия", lastActive: "2 часа назад", icon: "Smartphone", current: false },
  { id: 3, name: "iPad Air", os: "iPadOS 18", location: "Санкт-Петербург", lastActive: "3 дня назад", icon: "Tablet", current: false },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark", soundEnabled: true, vibration: false, popup: true, dmNotify: true,
  groupNotify: true, previewOnLock: false, phoneVisible: "contacts", onlineVisible: "contacts",
  lastSeenVisible: "nobody", photoVisible: "everyone", addToGroups: "contacts",
  twofa: true, tfaEmail: true, autoDownload: true, saveMedia: false, compactMode: false, fontSize: "medium",
};

// ─── THEME UTILS ──────────────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.style.setProperty("--k-bg-deep", "#fff5f5");
    root.style.setProperty("--k-bg-base", "#ffffff");
    root.style.setProperty("--k-bg-surface", "#fff0f0");
    root.style.setProperty("--k-bg-elevated", "#ffe4e4");
    root.style.setProperty("--k-border", "#fecaca");
    root.style.setProperty("--k-text-primary", "#1a0a0a");
    root.style.setProperty("--k-text-secondary", "#6b2828");
    root.style.setProperty("--k-text-muted", "#9f6060");
  } else {
    root.style.setProperty("--k-bg-deep", "#0d0505");
    root.style.setProperty("--k-bg-base", "#120808");
    root.style.setProperty("--k-bg-surface", "#1a0a0a");
    root.style.setProperty("--k-bg-elevated", "#220d0d");
    root.style.setProperty("--k-border", "#3d1515");
    root.style.setProperty("--k-text-primary", "#f5e8e8");
    root.style.setProperty("--k-text-secondary", "#c4908a");
    root.style.setProperty("--k-text-muted", "#7a4040");
  }
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function KAvatar({ letter, size = 40, status }: { letter: string; size?: number; status?: string }) {
  const color = getColor(letter);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="rounded-full flex items-center justify-center font-bold text-white"
        style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
        {letter}
      </div>
      {status && (
        <span className="absolute bottom-0 right-0 rounded-full border-2"
          style={{ width: 11, height: 11, background: status === "online" ? "#22c55e" : status === "away" ? "#f59e0b" : "var(--k-text-muted)", borderColor: "var(--k-bg-deep)" }} />
      )}
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="relative rounded-full transition-all duration-200 flex-shrink-0"
      style={{ width: 44, height: 24, background: enabled ? "var(--k-accent)" : "var(--k-bg-elevated)" }}>
      <span className="absolute top-0.5 rounded-full transition-all duration-200"
        style={{ width: 20, height: 20, background: "#fff", left: enabled ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--k-text-muted)" }}>{title}</div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, icon, last, children }: { label: string; desc: string; icon: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: last ? "none" : "1px solid var(--k-border)" }}>
      <Icon name={icon} size={16} style={{ color: "var(--k-text-muted)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: "var(--k-text-primary)" }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--k-text-muted)" }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

function SelectRow({ label, icon, value, options, onChange, last }: {
  label: string; icon: string; value: string; options: [string, string][]; onChange: (v: string) => void; last?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: last ? "none" : "1px solid var(--k-border)" }}>
      <Icon name={icon} size={16} style={{ color: "var(--k-text-muted)", flexShrink: 0 }} />
      <div className="flex-1 text-sm" style={{ color: "var(--k-text-primary)" }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} className="text-sm rounded-lg px-2 py-1 outline-none border-0"
        style={{ background: "var(--k-bg-elevated)", color: "var(--k-text-primary)" }}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

function TypeBadge({ type }: { type: ChatType }) {
  const labels: Record<ChatType, string> = { dm: "", group: "группа", channel: "канал" };
  const label = labels[type];
  if (!label) return null;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
      style={{ background: "var(--k-accent-dim)", color: "var(--k-accent)", fontSize: 10 }}>
      {label}
    </span>
  );
}

// ─── CALL MODAL ───────────────────────────────────────────────────────────────

function CallModal({ contact, onClose, isVideo }: { contact: Contact; onClose: () => void; isVideo: boolean }) {
  const [stage, setStage] = useState<"calling" | "active">("calling");
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage("active"), 2500);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (stage !== "active") return;
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, [stage]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="rounded-3xl p-8 flex flex-col items-center gap-5 w-72 animate-slide-up"
        style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <div className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--k-text-muted)" }}>
          {isVideo ? "Видеозвонок" : "Голосовой звонок"}
        </div>
        <KAvatar letter={contact.avatar} size={80} />
        <div>
          <div className="text-lg font-bold text-center" style={{ color: "var(--k-text-primary)" }}>{contact.name}</div>
          <div className="text-sm text-center mt-1" style={{ color: "var(--k-text-muted)" }}>
            {stage === "calling" ? "Вызов..." : formatTime(elapsed)}
          </div>
        </div>
        {isVideo && stage === "active" && (
          <div className="w-full h-28 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)" }}>
            <div className="text-center">
              <Icon name="Video" size={28} style={{ color: "var(--k-text-muted)", margin: "0 auto 4px" }} />
              <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>Камера активна</div>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setMuted(!muted)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: muted ? "var(--k-accent)" : "var(--k-bg-elevated)", color: muted ? "#fff" : "var(--k-text-muted)" }}>
            <Icon name={muted ? "MicOff" : "Mic"} size={18} />
          </button>
          {isVideo && (
            <button className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--k-bg-elevated)", color: "var(--k-text-muted)" }}>
              <Icon name="Camera" size={18} />
            </button>
          )}
          <button onClick={() => setSpeakerOff(!speakerOff)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: speakerOff ? "var(--k-accent)" : "var(--k-bg-elevated)", color: speakerOff ? "#fff" : "var(--k-text-muted)" }}>
            <Icon name={speakerOff ? "VolumeX" : "Volume2"} size={18} />
          </button>
          <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "#ef4444", color: "#fff" }}>
            <Icon name="PhoneOff" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE CHAT MODAL ────────────────────────────────────────────────────────

function CreateChatModal({ type, onClose, onCreate }: {
  type: "group" | "channel";
  onClose: () => void;
  onCreate: (c: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [username, setUsername] = useState("");

  const create = () => {
    if (!name.trim()) return;
    const newChat: Contact = {
      id: Date.now(),
      name: name.trim(),
      avatar: name.trim()[0].toUpperCase(),
      status: "online",
      lastMsg: "Чат создан",
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      unread: 0,
      encrypted: true,
      type,
      members: type === "channel" ? 1 : 1,
      description: desc.trim() || undefined,
      username: username ? `@${username.replace("@", "")}` : undefined,
    };
    onCreate(newChat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-2xl p-6 w-96 animate-slide-up"
        style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: "var(--k-text-primary)" }}>
            {type === "group" ? "Новая группа" : "Новый канал"}
          </h3>
          <button onClick={onClose} style={{ color: "var(--k-text-muted)" }}>
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Название *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={type === "group" ? "Название группы" : "Название канала"}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)", color: "var(--k-text-primary)" }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Описание</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Кратко опишите..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)", color: "var(--k-text-primary)" }} />
          </div>
          {type === "channel" && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Username (для публичного)</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)", color: "var(--k-text-primary)" }} />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--k-bg-elevated)", color: "var(--k-text-muted)" }}>
            Отмена
          </button>
          <button onClick={create} disabled={!name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
            style={{ background: "var(--k-accent)", opacity: name.trim() ? 1 : 0.5 }}>
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

function LoginScreen({ onAuth }: { onAuth: (name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "twofa">("form");

  // login fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // register fields
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPassConf, setRegPassConf] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [pendingName, setPendingName] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const switchMode = (m: "login" | "register") => {
    setMode(m); setError(""); setStep("form");
    setPhone(""); setPassword("");
    setRegName(""); setRegUsername(""); setRegPhone(""); setRegEmail(""); setRegPass(""); setRegPassConf(""); setAgreed(false);
    setCode(["","","","","",""]);
  };

  const handleLogin = () => {
    if (!phone.trim() || !password.trim()) { setError("Заполните все поля"); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); setPendingName("Пользователь"); setStep("twofa"); }, 1100);
  };

  const handleRegister = () => {
    if (!regName.trim()) { setError("Введите имя"); return; }
    if (!regUsername.trim()) { setError("Введите username"); return; }
    if (!regPhone.trim()) { setError("Введите номер телефона"); return; }
    if (!regEmail.trim() || !regEmail.includes("@")) { setError("Введите корректный email"); return; }
    if (regPass.length < 6) { setError("Пароль минимум 6 символов"); return; }
    if (regPass !== regPassConf) { setError("Пароли не совпадают"); return; }
    if (!agreed) { setError("Примите условия использования"); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); setPendingName(regName.trim()); setStep("twofa"); }, 1200);
  };

  const handleCodeInput = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) codeRefs.current[i + 1]?.focus();
    if (next.every(c => c !== "")) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onAuth(pendingName); }, 900);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const inputStyle = { background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)", color: "var(--k-text-primary)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-auto" style={{ background: "var(--k-bg-deep)" }}>
      <div className="w-full max-w-sm animate-slide-up py-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--k-accent)" }}>
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--k-text-primary)" }}>Kiscord</h1>
          <p className="text-xs mt-1" style={{ color: "var(--k-text-muted)" }}>Защищённый мессенджер</p>
        </div>

        {/* Tab switcher */}
        {step === "form" && (
          <div className="flex rounded-xl p-1 mb-4" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: mode === m ? "var(--k-accent)" : "transparent", color: mode === m ? "#fff" : "var(--k-text-muted)" }}>
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>

          {/* ── LOGIN FORM ── */}
          {step === "form" && mode === "login" && (
            <>
              <h2 className="font-bold text-base mb-4" style={{ color: "var(--k-text-primary)" }}>Вход в аккаунт</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Телефон или email</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+7 999 123-45-67"
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Пароль</label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)}
                      type={showPass ? "text" : "password"}
                      placeholder="Введите пароль"
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      className="w-full px-3 py-3 pr-10 rounded-xl text-sm outline-none"
                      style={inputStyle} />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--k-text-muted)" }}>
                      <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>
                </div>
                {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>{error}</div>}
                <button onClick={handleLogin} disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "var(--k-accent)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Проверяем..." : "Войти →"}
                </button>
              </div>
              <div className="text-center mt-3 text-xs" style={{ color: "var(--k-text-muted)" }}>
                Забыли пароль? <span className="cursor-pointer" style={{ color: "var(--k-accent)" }}>Восстановить</span>
              </div>
            </>
          )}

          {/* ── REGISTER FORM ── */}
          {step === "form" && mode === "register" && (
            <>
              <h2 className="font-bold text-base mb-4" style={{ color: "var(--k-text-primary)" }}>Создать аккаунт</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Имя *</label>
                    <input value={regName} onChange={e => setRegName(e.target.value)}
                      placeholder="Иван Иванов"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Username *</label>
                    <input value={regUsername} onChange={e => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="ivan_ivanov"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Номер телефона *</label>
                  <input value={regPhone} onChange={e => setRegPhone(e.target.value)}
                    placeholder="+7 999 123-45-67"
                    type="tel"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Email *</label>
                  <input value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="ivan@mail.ru"
                    type="email"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Пароль * (мин. 6 символов)</label>
                  <div className="relative">
                    <input value={regPass} onChange={e => setRegPass(e.target.value)}
                      type={showRegPass ? "text" : "password"}
                      placeholder="Придумайте пароль"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                      style={inputStyle} />
                    <button onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--k-text-muted)" }}>
                      <Icon name={showRegPass ? "EyeOff" : "Eye"} size={15} />
                    </button>
                  </div>
                  {regPass.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: regPass.length >= n * 2 ? (regPass.length >= 8 ? "#22c55e" : "var(--k-accent)") : "var(--k-bg-elevated)" }} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--k-text-muted)" }}>Подтвердите пароль *</label>
                  <div className="relative">
                    <input value={regPassConf} onChange={e => setRegPassConf(e.target.value)}
                      type="password"
                      placeholder="Повторите пароль"
                      className="w-full px-3 py-2.5 pr-8 rounded-xl text-sm outline-none"
                      style={{ ...inputStyle, borderColor: regPassConf && regPass !== regPassConf ? "#ef4444" : "var(--k-border)" }} />
                    {regPassConf && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Icon name={regPass === regPassConf ? "Check" : "X"} size={14}
                          style={{ color: regPass === regPassConf ? "#22c55e" : "#ef4444" }} />
                      </span>
                    )}
                  </div>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div onClick={() => setAgreed(!agreed)}
                    className="w-4 h-4 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-all"
                    style={{ background: agreed ? "var(--k-accent)" : "var(--k-bg-elevated)", border: `1.5px solid ${agreed ? "var(--k-accent)" : "var(--k-border)"}` }}>
                    {agreed && <Icon name="Check" size={10} style={{ color: "#fff" }} />}
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: "var(--k-text-muted)" }}>
                    Я согласен с <span style={{ color: "var(--k-accent)" }}>Условиями использования</span> и <span style={{ color: "var(--k-accent)" }}>Политикой конфиденциальности</span>
                  </span>
                </label>
                {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>{error}</div>}
                <button onClick={handleRegister} disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "var(--k-accent)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Создаём аккаунт..." : "Зарегистрироваться →"}
                </button>
              </div>
            </>
          )}

          {/* ── 2FA STEP ── */}
          {step === "twofa" && (
            <>
              <div className="flex flex-col items-center mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "var(--k-accent-dim)", border: "1px solid rgba(229,62,62,0.4)" }}>
                  <Icon name="ShieldCheck" size={22} style={{ color: "var(--k-accent)" }} />
                </div>
                <h2 className="font-bold text-base" style={{ color: "var(--k-text-primary)" }}>Двухфакторная аутентификация</h2>
                <p className="text-xs text-center mt-1" style={{ color: "var(--k-text-muted)" }}>
                  Введите 6-значный код из SMS или приложения
                </p>
              </div>
              <div className="flex gap-2 justify-center mb-4">
                {code.map((c, i) => (
                  <input key={i}
                    ref={el => { codeRefs.current[i] = el; }}
                    value={c}
                    onChange={e => handleCodeInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    maxLength={1}
                    className="w-11 h-12 text-center font-bold text-lg rounded-xl outline-none transition-all"
                    style={{ background: "var(--k-bg-elevated)", border: `2px solid ${c ? "var(--k-accent)" : "var(--k-border)"}`, color: "var(--k-text-primary)" }} />
                ))}
              </div>
              {loading && <div className="text-center text-sm mb-3" style={{ color: "var(--k-text-muted)" }}>Проверяем код...</div>}
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3"
                style={{ background: "var(--k-accent-dim)", border: "1px solid rgba(229,62,62,0.3)" }}>
                <Icon name="Lock" size={13} style={{ color: "var(--k-accent)", flexShrink: 0 }} />
                <span className="text-xs" style={{ color: "var(--k-text-secondary)" }}>Для демо введи код <b style={{ color: "var(--k-accent)" }}>123456</b></span>
              </div>
              <button onClick={() => { setStep("form"); setCode(["","","","","",""]); }}
                className="w-full text-sm py-2 rounded-xl" style={{ color: "var(--k-text-muted)" }}>
                ← Назад
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT VIEW ────────────────────────────────────────────────────────────────

function ChatView({ contact, onBack, onCall }: { contact: Contact; onBack: () => void; onCall: (v: boolean) => void }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Message[]>(INITIAL_MESSAGES[contact.id] || []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = useCallback(() => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, {
      id: Date.now(), from: "Я", text: input.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      mine: true, encrypted: true,
    }]);
    setInput("");

    if (contact.type === "dm") {
      const replies = ["Понял, спасибо!", "Хорошо!", "Окей, договорились", "Ясно, напишу позже", "👍"];
      setTimeout(() => {
        setMsgs(prev => [...prev, {
          id: Date.now() + 1, from: contact.name, text: replies[Math.floor(Math.random() * replies.length)],
          time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
          mine: false, encrypted: true,
        }]);
      }, 1200 + Math.random() * 800);
    }
  }, [input, contact]);

  const isChannel = contact.type === "channel";

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--k-border)", background: "var(--k-bg-base)" }}>
        <button className="mr-1 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
          onClick={onBack} style={{ color: "var(--k-text-muted)" }}>
          <Icon name="ArrowLeft" size={18} />
        </button>
        <KAvatar letter={contact.avatar} size={36} status={contact.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: "var(--k-text-primary)" }}>{contact.name}</span>
            <TypeBadge type={contact.type} />
          </div>
          <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>
            {contact.type === "dm"
              ? contact.status === "online" ? "онлайн" : contact.status === "away" ? "отошёл" : "не в сети"
              : `${contact.members?.toLocaleString()} ${contact.type === "channel" ? "подписчиков" : "участников"}`}
          </div>
        </div>
        {!isChannel && (
          <>
            <button onClick={() => onCall(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "var(--k-text-muted)" }}>
              <Icon name="Phone" size={16} />
            </button>
            <button onClick={() => onCall(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "var(--k-text-muted)" }}>
              <Icon name="Video" size={16} />
            </button>
          </>
        )}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "var(--k-text-muted)" }}>
          <Icon name="MoreVertical" size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ background: "var(--k-bg-elevated)", color: "var(--k-text-muted)" }}>
            <Icon name={contact.encrypted ? "ShieldCheck" : "Shield"} size={12} style={{ color: "var(--k-accent)" }} />
            {contact.encrypted ? "Сквозное шифрование активно" : "Обычный чат"}
          </div>
        </div>
        {msgs.map(msg => (
          <div key={msg.id} className={`flex animate-message-in ${msg.mine ? "justify-end" : "justify-start"}`}>
            {!msg.mine && (
              <div className="flex-shrink-0 mr-2 mt-1">
                <KAvatar letter={contact.avatar} size={26} />
              </div>
            )}
            <div style={{ maxWidth: "70%" }}>
              {!msg.mine && contact.type !== "dm" && (
                <div className="text-xs mb-0.5 px-1" style={{ color: "var(--k-accent)" }}>{msg.from}</div>
              )}
              <div className="px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: msg.mine ? "var(--k-accent)" : "var(--k-bg-elevated)",
                  color: msg.mine ? "#fff" : "var(--k-text-primary)",
                  borderRadius: msg.mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                }}>
                {msg.text}
              </div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${msg.mine ? "justify-end" : "justify-start"}`}
                style={{ color: "var(--k-text-muted)" }}>
                {msg.encrypted && <Icon name="Lock" size={9} />}
                {msg.time}
                {msg.mine && <Icon name="CheckCheck" size={11} style={{ color: "var(--k-accent)" }} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isChannel && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--k-border)" }}>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
            style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)" }}>
            <button style={{ color: "var(--k-text-muted)" }} className="hover:text-white transition-colors flex-shrink-0">
              <Icon name="Paperclip" size={18} />
            </button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--k-text-primary)" }} />
            <button style={{ color: "var(--k-text-muted)" }} className="hover:text-white transition-colors flex-shrink-0">
              <Icon name="Smile" size={18} />
            </button>
            <button onClick={send}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: input.trim() ? "var(--k-accent)" : "var(--k-bg-surface)", color: input.trim() ? "#fff" : "var(--k-text-muted)" }}>
              <Icon name="Send" size={15} />
            </button>
          </div>
        </div>
      )}
      {isChannel && (
        <div className="px-4 py-3 flex-shrink-0 text-center text-xs" style={{ borderTop: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}>
          <Icon name="Megaphone" size={12} style={{ display: "inline", marginRight: 4 }} />
          Только администраторы могут писать в этот канал
        </div>
      )}
    </div>
  );
}

// ─── CHAT LIST ────────────────────────────────────────────────────────────────

function ChatList({ contacts, selectedId, onSelect, filter, showCreate }: {
  contacts: Contact[];
  selectedId: number | null;
  onSelect: (c: Contact) => void;
  filter: ChatType | "all";
  showCreate?: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c => {
    const matchType = filter === "all" || c.type === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.username?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)" }}>
          <Icon name="Search" size={14} style={{ color: "var(--k-text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: "var(--k-text-primary)" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--k-text-muted)" }}>
              <Icon name="X" size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: "var(--k-text-muted)" }}>Ничего не найдено</div>
        )}
        {filtered.map(c => (
          <button key={c.id} onClick={() => onSelect(c)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
            style={{ background: selectedId === c.id ? "var(--k-accent-dim)" : "transparent" }}
            onMouseEnter={e => { if (selectedId !== c.id) e.currentTarget.style.background = "var(--k-bg-surface)"; }}
            onMouseLeave={e => { if (selectedId !== c.id) e.currentTarget.style.background = "transparent"; }}>
            <KAvatar letter={c.avatar} size={38} status={c.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-sm truncate" style={{ color: "var(--k-text-primary)" }}>{c.name}</span>
                  <TypeBadge type={c.type} />
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--k-text-muted)" }}>{c.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs truncate flex-1" style={{ color: "var(--k-text-secondary)" }}>{c.lastMsg}</span>
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                  {c.encrypted && <Icon name="Lock" size={10} style={{ color: "var(--k-accent)" }} />}
                  {c.unread > 0 && (
                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--k-accent)", fontSize: 10, minWidth: 18, textAlign: "center" }}>
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SEARCH PAGE ──────────────────────────────────────────────────────────────

function SearchPage({ contacts, onSelectChat }: { contacts: Contact[]; onSelectChat: (c: Contact) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "dm" | "group" | "channel">("all");

  const results = query.trim().length > 0 ? contacts.filter(c => {
    const q = query.toLowerCase();
    const matchType = filter === "all" || c.type === filter;
    return matchType && (
      c.name.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }) : [];

  return (
    <div className="flex flex-col h-full px-5 py-5 animate-fade-in">
      <h2 className="font-bold text-lg mb-4" style={{ color: "var(--k-text-primary)" }}>Поиск</h2>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
        style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <Icon name="Search" size={18} style={{ color: "var(--k-text-muted)" }} />
        <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
          placeholder="Поиск людей, групп, каналов..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--k-text-primary)" }} />
        {query && <button onClick={() => setQuery("")} style={{ color: "var(--k-text-muted)" }}><Icon name="X" size={14} /></button>}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "dm", "group", "channel"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === f ? "var(--k-accent)" : "var(--k-bg-surface)",
              color: filter === f ? "#fff" : "var(--k-text-muted)",
              border: `1px solid ${filter === f ? "var(--k-accent)" : "var(--k-border)"}`,
            }}>
            {{ all: "Все", dm: "Люди", group: "Группы", channel: "Каналы" }[f]}
          </button>
        ))}
      </div>

      {query.trim() === "" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: "var(--k-text-muted)" }}>
          <Icon name="Search" size={40} />
          <div className="text-sm">Введите запрос для поиска</div>
        </div>
      )}

      {query.trim() !== "" && results.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: "var(--k-text-muted)" }}>
          <Icon name="SearchX" size={40} />
          <div className="text-sm">Ничего не найдено</div>
        </div>
      )}

      <div className="space-y-1 overflow-y-auto">
        {results.map(c => (
          <button key={c.id} onClick={() => onSelectChat(c)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-white/5"
            style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
            <KAvatar letter={c.avatar} size={42} status={c.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>{c.name}</span>
                <TypeBadge type={c.type} />
              </div>
              {c.username && <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>{c.username}</div>}
              {c.description && <div className="text-xs truncate mt-0.5" style={{ color: "var(--k-text-secondary)" }}>{c.description}</div>}
              {c.members && <div className="text-xs mt-0.5" style={{ color: "var(--k-text-muted)" }}>{c.members.toLocaleString()} {c.type === "channel" ? "подписчиков" : "участников"}</div>}
            </div>
            <Icon name="ChevronRight" size={16} style={{ color: "var(--k-text-muted)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ contacts, onNavigate, onSelectChat, userName }: {
  contacts: Contact[];
  onNavigate: (p: Page) => void;
  onSelectChat: (c: Contact) => void;
  userName: string;
}) {
  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);
  const recentContacts = [...contacts].sort((a, b) => b.unread - a.unread).slice(0, 4);

  return (
    <div className="flex flex-col h-full px-6 py-6 overflow-y-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--k-accent)" }}>
          <span className="text-white font-bold text-lg">K</span>
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--k-text-primary)" }}>Добрый день, {userName}!</h1>
          <p className="text-xs" style={{ color: "var(--k-text-muted)" }}>Сб, 18 апреля 2026</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Чатов", value: contacts.length, icon: "MessageSquare" },
          { label: "Непрочитанных", value: totalUnread, icon: "Bell" },
          { label: "2FA", value: "Вкл", icon: "ShieldCheck" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
            <Icon name={s.icon} size={16} style={{ color: "var(--k-accent)", marginBottom: 6 }} />
            <div className="text-lg font-bold" style={{ color: "var(--k-text-primary)" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 2FA banner */}
      <div className="rounded-2xl p-3.5 mb-5 flex items-center gap-3"
        style={{ background: "var(--k-accent-dim)", border: "1px solid rgba(229,62,62,0.3)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--k-accent)" }}>
          <Icon name="ShieldCheck" size={16} style={{ color: "#fff" }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>2FA активна</div>
          <div className="text-xs" style={{ color: "var(--k-text-secondary)" }}>Аккаунт дополнительно защищён</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#22c55e", color: "#fff" }}>Активно</span>
      </div>

      {/* Quick actions */}
      <div className="mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--k-text-muted)" }}>Действия</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Чаты", icon: "MessageSquare", page: "chats" as Page },
            { label: "Личные", icon: "Mail", page: "dm" as Page },
            { label: "Поиск", icon: "Search", page: "search" as Page },
            { label: "Настройки", icon: "Settings", page: "settings" as Page },
          ].map(a => (
            <button key={a.label} onClick={() => onNavigate(a.page)}
              className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
              style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--k-accent)"; e.currentTarget.style.background = "var(--k-accent-dim)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--k-border)"; e.currentTarget.style.background = "var(--k-bg-surface)"; }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--k-bg-elevated)" }}>
                <Icon name={a.icon} size={15} style={{ color: "var(--k-accent)" }} />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--k-text-primary)" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--k-text-muted)" }}>Недавние</h2>
        <div className="space-y-1">
          {recentContacts.map(c => (
            <button key={c.id} onClick={() => onSelectChat(c)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/5"
              style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
              <KAvatar letter={c.avatar} size={34} status={c.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--k-text-primary)" }}>{c.name}</span>
                  <TypeBadge type={c.type} />
                </div>
                <div className="text-xs truncate" style={{ color: "var(--k-text-muted)" }}>{c.lastMsg}</div>
              </div>
              {c.unread > 0 && (
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: "var(--k-accent)" }}>{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage() {
  const [editField, setEditField] = useState<string | null>(null);
  const [fields, setFields] = useState({
    name: "Дмитрий Ковалёв", username: "@d.kovalev", phone: "+7 (999) *** **89",
    email: "d.kovalev@mail.ru", bio: "Разработчик. Люблю минимализм.",
  });
  const [editVal, setEditVal] = useState("");

  const startEdit = (key: string) => { setEditField(key); setEditVal(fields[key as keyof typeof fields]); };
  const saveEdit = () => {
    if (editField) setFields(prev => ({ ...prev, [editField]: editVal }));
    setEditField(null);
  };

  return (
    <div className="flex flex-col h-full px-6 py-6 overflow-y-auto animate-fade-in">
      <h2 className="font-bold text-lg mb-5" style={{ color: "var(--k-text-primary)" }}>Профиль</h2>
      <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <div className="flex justify-center mb-3">
          <div className="relative">
            <KAvatar letter="Д" size={72} status="online" />
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--k-accent)", border: "2px solid var(--k-bg-deep)" }}>
              <Icon name="Camera" size={12} style={{ color: "#fff" }} />
            </button>
          </div>
        </div>
        <div className="text-xl font-bold mb-1" style={{ color: "var(--k-text-primary)" }}>{fields.name}</div>
        <div className="text-sm mb-3" style={{ color: "var(--k-text-muted)" }}>{fields.username} · ID: 10247</div>
        <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
          style={{ background: "var(--k-accent-dim)", color: "var(--k-accent)" }}>
          <Icon name="ShieldCheck" size={11} /> Аккаунт защищён
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        {Object.entries({ name: "Имя", username: "Username", phone: "Телефон", email: "Email", bio: "О себе" }).map(([key, label], i, arr) => (
          <div key={key} className="px-4 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--k-border)" : "none" }}>
            {editField === key ? (
              <div className="flex items-center gap-2">
                <input value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditField(null); }}
                  className="flex-1 px-2 py-1 rounded-lg text-sm outline-none"
                  style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-accent)", color: "var(--k-text-primary)" }} />
                <button onClick={saveEdit} className="px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ background: "var(--k-accent)" }}>Ок</button>
                <button onClick={() => setEditField(null)} className="px-2 py-1 rounded-lg text-xs" style={{ color: "var(--k-text-muted)" }}>✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs mb-0.5" style={{ color: "var(--k-text-muted)" }}>{label}</div>
                  <div className="text-sm" style={{ color: "var(--k-text-primary)" }}>{fields[key as keyof typeof fields]}</div>
                </div>
                <button onClick={() => startEdit(key)} style={{ color: "var(--k-text-muted)" }} className="hover:text-white transition-colors">
                  <Icon name="Pencil" size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <button className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
          style={{ borderBottom: "1px solid var(--k-border)" }}>
          <Icon name="LogOut" size={16} style={{ color: "var(--k-text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--k-text-primary)" }}>Выйти из аккаунта</span>
        </button>
        <button className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-red-500/10">
          <Icon name="Trash2" size={16} style={{ color: "#ef4444" }} />
          <span className="text-sm" style={{ color: "#ef4444" }}>Удалить аккаунт</span>
        </button>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

function SettingsPage({ settings, onUpdate, devices, onDeleteDevice }: {
  settings: AppSettings;
  onUpdate: (k: keyof AppSettings, v: AppSettings[keyof AppSettings]) => void;
  devices: Device[];
  onDeleteDevice: (id: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const toggle = (k: keyof AppSettings) => onUpdate(k, !settings[k]);

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "notifications", label: "Уведомления", icon: "Bell" },
    { id: "privacy", label: "Приватность", icon: "Shield" },
    { id: "twofa", label: "2FA", icon: "KeyRound" },
    { id: "appearance", label: "Интерфейс", icon: "Palette" },
    { id: "media", label: "Медиа", icon: "Image" },
    { id: "devices", label: "Устройства", icon: "Monitor" },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--k-border)" }}>
        <h2 className="font-bold text-lg mb-3" style={{ color: "var(--k-text-primary)" }}>Настройки</h2>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeTab === tab.id ? "var(--k-accent)" : "var(--k-bg-surface)",
                color: activeTab === tab.id ? "#fff" : "var(--k-text-muted)",
                border: `1px solid ${activeTab === tab.id ? "var(--k-accent)" : "var(--k-border)"}`,
              }}>
              <Icon name={tab.icon} size={12} />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {activeTab === "notifications" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Общие">
              <SettingRow label="Звук" desc="Звук при получении сообщений" icon="Volume2">
                <Toggle enabled={settings.soundEnabled} onToggle={() => toggle("soundEnabled")} />
              </SettingRow>
              <SettingRow label="Вибрация" desc="Вибрация при новых сообщениях" icon="Vibrate">
                <Toggle enabled={settings.vibration} onToggle={() => toggle("vibration")} />
              </SettingRow>
              <SettingRow label="Всплывающие" desc="Показывать поверх экрана" icon="BellRing" last>
                <Toggle enabled={settings.popup} onToggle={() => toggle("popup")} />
              </SettingRow>
            </Section>
            <Section title="По типу">
              <SettingRow label="Личные сообщения" desc="Уведомления из ЛС" icon="Mail">
                <Toggle enabled={settings.dmNotify} onToggle={() => toggle("dmNotify")} />
              </SettingRow>
              <SettingRow label="Группы и каналы" desc="Уведомления из групп/каналов" icon="Users" last>
                <Toggle enabled={settings.groupNotify} onToggle={() => toggle("groupNotify")} />
              </SettingRow>
            </Section>
            <Section title="Экран блокировки">
              <SettingRow label="Предпросмотр" desc="Текст на экране блокировки" icon="Smartphone" last>
                <Toggle enabled={settings.previewOnLock} onToggle={() => toggle("previewOnLock")} />
              </SettingRow>
            </Section>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Кто видит мои данные">
              <SelectRow label="Номер телефона" icon="Phone" value={settings.phoneVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => onUpdate("phoneVisible", v)} />
              <SelectRow label="Онлайн-статус" icon="Circle" value={settings.onlineVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => onUpdate("onlineVisible", v)} />
              <SelectRow label="Время посещения" icon="Clock" value={settings.lastSeenVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => onUpdate("lastSeenVisible", v)} />
              <SelectRow label="Фото профиля" icon="Image" value={settings.photoVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => onUpdate("photoVisible", v)} last />
            </Section>
            <Section title="Взаимодействие">
              <SelectRow label="Добавление в группы" icon="UserPlus" value={settings.addToGroups} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => onUpdate("addToGroups", v)} last />
            </Section>
          </div>
        )}

        {activeTab === "twofa" && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "var(--k-accent-dim)", border: "1px solid rgba(229,62,62,0.3)" }}>
              <Icon name="ShieldCheck" size={22} style={{ color: "var(--k-accent)", flexShrink: 0 }} />
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: "var(--k-text-primary)" }}>Двухфакторная аутентификация</div>
                <div className="text-xs" style={{ color: "var(--k-text-secondary)" }}>
                  При входе с нового устройства потребуется дополнительный код подтверждения из приложения-аутентификатора.
                </div>
              </div>
            </div>
            <Section title="Настройки 2FA">
              <SettingRow label="2FA включена" desc="Требовать код при входе" icon="KeyRound">
                <Toggle enabled={settings.twofa} onToggle={() => toggle("twofa")} />
              </SettingRow>
              <SettingRow label="Резервный Email" desc="Код на почту как запасной вариант" icon="Mail" last>
                <Toggle enabled={settings.tfaEmail} onToggle={() => toggle("tfaEmail")} />
              </SettingRow>
            </Section>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Тема оформления">
              <div className="p-4" style={{ borderBottom: "1px solid var(--k-border)" }}>
                <div className="text-xs mb-3" style={{ color: "var(--k-text-muted)" }}>Выберите тему</div>
                <div className="flex gap-2">
                  {(["dark", "light"] as Theme[]).map(t => (
                    <button key={t} onClick={() => onUpdate("theme", t)}
                      className="flex-1 py-3 rounded-xl font-medium text-sm transition-all flex flex-col items-center gap-2"
                      style={{
                        background: settings.theme === t ? "var(--k-accent)" : "var(--k-bg-elevated)",
                        color: settings.theme === t ? "#fff" : "var(--k-text-muted)",
                        border: `2px solid ${settings.theme === t ? "var(--k-accent)" : "var(--k-border)"}`,
                      }}>
                      <Icon name={t === "dark" ? "Moon" : "Sun"} size={20} />
                      {t === "dark" ? "Тёмная" : "Светлая"}
                    </button>
                  ))}
                </div>
              </div>
              <SettingRow label="Компактный режим" desc="Уменьшить отступы" icon="AlignJustify" last>
                <Toggle enabled={settings.compactMode} onToggle={() => toggle("compactMode")} />
              </SettingRow>
            </Section>
            <Section title="Шрифт">
              <div className="flex gap-2 px-4 py-4">
                {["small", "medium", "large"].map(s => (
                  <button key={s} onClick={() => onUpdate("fontSize", s)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: settings.fontSize === s ? "var(--k-accent)" : "var(--k-bg-elevated)", color: settings.fontSize === s ? "#fff" : "var(--k-text-muted)" }}>
                    {s === "small" ? "А" : s === "medium" ? "А" : "А"}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Загрузка">
              <SettingRow label="Автозагрузка медиа" desc="Фото и видео загружаются автоматически" icon="Download">
                <Toggle enabled={settings.autoDownload} onToggle={() => toggle("autoDownload")} />
              </SettingRow>
              <SettingRow label="Сохранять в галерею" desc="Автосохранение медиафайлов" icon="FolderOpen" last>
                <Toggle enabled={settings.saveMedia} onToggle={() => toggle("saveMedia")} />
              </SettingRow>
            </Section>
          </div>
        )}

        {activeTab === "devices" && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-xs mb-2 px-1" style={{ color: "var(--k-text-muted)" }}>
              Активные сессии вашего аккаунта. Завершите доступ с незнакомых устройств.
            </div>
            {devices.map(d => (
              <div key={d.id} className="rounded-2xl p-4 flex items-start gap-4"
                style={{ background: "var(--k-bg-surface)", border: `1px solid ${d.current ? "var(--k-accent)" : "var(--k-border)"}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: d.current ? "var(--k-accent-dim)" : "var(--k-bg-elevated)" }}>
                  <Icon name={d.icon} size={18} style={{ color: d.current ? "var(--k-accent)" : "var(--k-text-muted)" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>{d.name}</span>
                    {d.current && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#22c55e", color: "#fff" }}>Текущее</span>}
                  </div>
                  <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>{d.os}</div>
                  <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>{d.location} · {d.lastActive}</div>
                </div>
                {!d.current && (
                  <button onClick={() => onDeleteDevice(d.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-red-500/20"
                    style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    Завершить
                  </button>
                )}
              </div>
            ))}
            {devices.filter(d => !d.current).length > 0 && (
              <button onClick={() => devices.filter(d => !d.current).forEach(d => onDeleteDevice(d.id))}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/20"
                style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                Завершить все другие сессии
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function Index() {
  const [authStep, setAuthStep] = useState<AuthStep>("login");
  const [userName, setUserName] = useState("Дмитрий");
  const [activePage, setActivePage] = useState<Page>("home");
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [callContact, setCallContact] = useState<Contact | null>(null);
  const [callVideo, setCallVideo] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<"group" | "channel" | null>(null);

  // Apply theme on mount and when changed
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);
  useEffect(() => { applyTheme("dark"); }, []);

  const updateSetting = useCallback((k: keyof AppSettings, v: AppSettings[keyof AppSettings]) => {
    setSettings(prev => {
      const next = { ...prev, [k]: v };
      if (k === "theme") applyTheme(v as Theme);
      return next;
    });
  }, []);

  const handleSelectChat = useCallback((c: Contact) => {
    setSelectedChat(c);
    setContacts(prev => prev.map(x => x.id === c.id ? { ...x, unread: 0 } : x));
    if (c.type === "dm") setActivePage("dm");
    else setActivePage("chats");
  }, []);

  const handleNavigate = useCallback((p: Page) => {
    setActivePage(p);
    if (p !== "chats" && p !== "dm" && p !== "channels") setSelectedChat(null);
  }, []);

  const handleCall = useCallback((contact: Contact, video: boolean) => {
    setCallContact(contact);
    setCallVideo(video);
  }, []);

  const handleDeleteDevice = useCallback((id: number) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  const handleCreateChat = useCallback((c: Contact) => {
    setContacts(prev => [c, ...prev]);
    setSelectedChat(c);
    setActivePage("chats");
  }, []);

  if (authStep === "login") return <LoginScreen onAuth={(name) => { setUserName(name); setAuthStep("app"); }} />;

  const navItems = [
    { id: "home" as Page, icon: "Home", label: "Главная" },
    { id: "chats" as Page, icon: "MessageSquare", label: "Чаты" },
    { id: "dm" as Page, icon: "Mail", label: "Личные" },
    { id: "search" as Page, icon: "Search", label: "Поиск" },
    { id: "profile" as Page, icon: "User", label: "Профиль" },
    { id: "settings" as Page, icon: "Settings", label: "Настройки" },
  ];

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);
  const showSidebar = activePage === "chats" || activePage === "dm";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--k-bg-deep)" }}>
      {/* Vertical nav */}
      <div className="flex flex-col items-center py-5 gap-1 flex-shrink-0 z-10"
        style={{ width: 64, background: "var(--k-bg-deep)", borderRight: "1px solid var(--k-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
          style={{ background: "var(--k-accent)" }}>
          <span className="text-white font-bold text-sm">K</span>
        </div>
        {navItems.map(item => {
          const isActive = activePage === item.id || (item.id === "chats" && selectedChat?.type !== "dm" && (activePage === "chats")) || (item.id === "dm" && activePage === "dm");
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)} title={item.label}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 relative"
              style={{ background: isActive ? "var(--k-accent-dim)" : "transparent", color: isActive ? "var(--k-accent)" : "var(--k-text-muted)" }}>
              <Icon name={item.icon} size={18} />
              {item.id === "chats" && totalUnread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "var(--k-accent)" }} />
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full"
                  style={{ height: 20, background: "var(--k-accent)" }} />
              )}
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Create buttons */}
        <button onClick={() => setShowCreateModal("group")} title="Новая группа"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
          style={{ color: "var(--k-text-muted)" }}>
          <Icon name="Users" size={16} />
        </button>
        <button onClick={() => setShowCreateModal("channel")} title="Новый канал"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 mb-2"
          style={{ color: "var(--k-text-muted)" }}>
          <Icon name="Megaphone" size={16} />
        </button>

        <button onClick={() => handleNavigate("profile")} className="transition-transform hover:scale-105">
          <KAvatar letter="Д" size={36} status="online" />
        </button>
      </div>

      {/* Chat list sidebar */}
      {showSidebar && (
        <div className="flex flex-col flex-shrink-0 animate-fade-in"
          style={{ width: 280, background: "var(--k-bg-base)", borderRight: "1px solid var(--k-border)" }}>
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>
                {activePage === "dm" ? "Личные сообщения" : "Все чаты"}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setShowCreateModal("group")} title="Новая группа"
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
                  style={{ color: "var(--k-text-muted)" }}>
                  <Icon name="Plus" size={15} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatList
              contacts={contacts}
              selectedId={selectedChat?.id ?? null}
              onSelect={handleSelectChat}
              filter={activePage === "dm" ? "dm" : "all"}
            />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {activePage === "home" && (
          <HomePage contacts={contacts} onNavigate={handleNavigate} onSelectChat={handleSelectChat} userName={userName} />
        )}
        {(activePage === "chats" || activePage === "dm") && (
          selectedChat
            ? <ChatView contact={selectedChat} onBack={() => setSelectedChat(null)} onCall={(v) => handleCall(selectedChat, v)} />
            : (
              <div className="flex flex-col items-center justify-center h-full animate-fade-in" style={{ color: "var(--k-text-muted)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
                  <Icon name="MessageSquare" size={28} />
                </div>
                <div className="font-medium mb-1" style={{ color: "var(--k-text-secondary)" }}>Выберите чат</div>
                <div className="text-sm">или начните новый диалог</div>
              </div>
            )
        )}
        {activePage === "search" && (
          <SearchPage contacts={contacts} onSelectChat={(c) => { handleSelectChat(c); }} />
        )}
        {activePage === "profile" && <ProfilePage />}
        {activePage === "settings" && (
          <SettingsPage settings={settings} onUpdate={updateSetting} devices={devices} onDeleteDevice={handleDeleteDevice} />
        )}
      </div>

      {/* Modals */}
      {callContact && (
        <CallModal contact={callContact} isVideo={callVideo} onClose={() => setCallContact(null)} />
      )}
      {showCreateModal && (
        <CreateChatModal type={showCreateModal} onClose={() => setShowCreateModal(null)} onCreate={handleCreateChat} />
      )}
    </div>
  );
}