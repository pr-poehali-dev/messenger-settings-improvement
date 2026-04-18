import { useState } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "chats" | "dm" | "profile" | "settings";
type SettingsTab = "notifications" | "privacy" | "twofa" | "appearance" | "media" | "chats";

const contacts = [
  { id: 1, name: "Алёна Смирнова", avatar: "А", status: "online", lastMsg: "Отправила файл", time: "14:32", unread: 2, encrypted: true },
  { id: 2, name: "Команда Kiscord", avatar: "К", status: "online", lastMsg: "Обновление v2.1 готово", time: "12:10", unread: 5, encrypted: true, isGroup: true },
  { id: 3, name: "Максим Волков", avatar: "М", status: "offline", lastMsg: "Хорошо, увидимся завтра", time: "вчера", unread: 0, encrypted: true },
  { id: 4, name: "Дизайн Hub", avatar: "Д", status: "online", lastMsg: "Макет готов к ревью", time: "вчера", unread: 1, encrypted: true, isGroup: true },
  { id: 5, name: "Ирина Ковалёва", avatar: "И", status: "away", lastMsg: "Спасибо за помощь!", time: "пн", unread: 0, encrypted: true },
  { id: 6, name: "Антон Чехов", avatar: "Г", status: "offline", lastMsg: "Жду ответа", time: "пн", unread: 0, encrypted: false },
];

const messages: Record<number, { id: number; from: string; text: string; time: string; mine: boolean; encrypted: boolean }[]> = {
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
};

const avatarColors: Record<string, string> = {
  "А": "#3b82f6", "К": "#8b5cf6", "М": "#06b6d4", "Д": "#f59e0b", "И": "#ec4899", "Г": "#10b981",
};

function Avatar({ letter, size = 40, status }: { letter: string; size?: number; status?: string }) {
  const color = avatarColors[letter] || "#6b7280";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white"
        style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      >
        {letter}
      </div>
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: 11, height: 11,
            background: status === "online" ? "var(--k-online)" : status === "away" ? "#f59e0b" : "var(--k-text-muted)",
            borderColor: "var(--k-bg-deep)",
          }}
        />
      )}
    </div>
  );
}

function Sidebar({ active, onNavigate, onSelectChat, selectedChat }: {
  active: Page;
  onNavigate: (p: Page) => void;
  onSelectChat: (id: number) => void;
  selectedChat: number | null;
}) {
  const navItems = [
    { id: "home" as Page, icon: "Home", label: "Главная" },
    { id: "chats" as Page, icon: "MessageSquare", label: "Чаты" },
    { id: "dm" as Page, icon: "Mail", label: "Личные" },
    { id: "profile" as Page, icon: "User", label: "Профиль" },
    { id: "settings" as Page, icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="flex h-full">
      {/* Icon nav */}
      <div
        className="flex flex-col items-center py-5 gap-1 flex-shrink-0"
        style={{ width: 64, background: "var(--k-bg-deep)", borderRight: "1px solid var(--k-border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
          style={{ background: "var(--k-accent)" }}
        >
          <span className="text-white font-bold text-sm">K</span>
        </div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 relative"
            style={{
              background: active === item.id ? "var(--k-accent-dim)" : "transparent",
              color: active === item.id ? "var(--k-accent)" : "var(--k-text-muted)",
            }}
          >
            <Icon name={item.icon} size={18} />
            {active === item.id && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full"
                style={{ height: 20, background: "var(--k-accent)" }}
              />
            )}
          </button>
        ))}

        <div className="flex-1" />

        <button onClick={() => onNavigate("profile")} className="transition-transform hover:scale-105">
          <Avatar letter="Д" size={36} status="online" />
        </button>
      </div>

      {/* Chat list panel */}
      {(active === "chats" || active === "dm") && (
        <div
          className="flex flex-col flex-shrink-0 animate-fade-in"
          style={{ width: 280, background: "var(--k-bg-base)", borderRight: "1px solid var(--k-border)" }}
        >
          <div className="px-4 pt-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>
                {active === "dm" ? "Личные сообщения" : "Все чаты"}
              </span>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "var(--k-text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--k-accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--k-text-muted)")}
              >
                <Icon name="Plus" size={16} />
              </button>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "var(--k-bg-surface)" }}
            >
              <Icon name="Search" size={14} style={{ color: "var(--k-text-muted)" }} />
              <input
                placeholder="Поиск..."
                className="bg-transparent outline-none text-sm flex-1"
                style={{ color: "var(--k-text-primary)" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {contacts
              .filter(c => active === "dm" ? !c.isGroup : true)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectChat(c.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                  style={{
                    background: selectedChat === c.id ? "var(--k-accent-dim)" : "transparent",
                  }}
                  onMouseEnter={e => { if (selectedChat !== c.id) e.currentTarget.style.background = "var(--k-bg-surface)"; }}
                  onMouseLeave={e => { if (selectedChat !== c.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar letter={c.avatar} size={38} status={c.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate" style={{ color: "var(--k-text-primary)" }}>
                        {c.name}
                      </span>
                      <span className="text-xs flex-shrink-0 ml-1" style={{ color: "var(--k-text-muted)" }}>{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs truncate" style={{ color: "var(--k-text-secondary)" }}>{c.lastMsg}</span>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                        {c.encrypted && <Icon name="Lock" size={10} style={{ color: "var(--k-accent)" }} />}
                        {c.unread > 0 && (
                          <span
                            className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--k-accent)", fontSize: 10, minWidth: 18, textAlign: "center" }}
                          >
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
      )}
    </div>
  );
}

function ChatView({ contactId, onBack }: { contactId: number; onBack: () => void }) {
  const contact = contacts.find(c => c.id === contactId);
  const msgs = messages[contactId] || [];
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState(msgs);

  const send = () => {
    if (!input.trim()) return;
    setLocalMsgs(prev => [...prev, {
      id: Date.now(), from: "Я", text: input.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      mine: true, encrypted: true,
    }]);
    setInput("");
  };

  if (!contact) return null;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div
        className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--k-border)", background: "var(--k-bg-base)" }}
      >
        <button className="md:hidden mr-1" onClick={onBack} style={{ color: "var(--k-text-muted)" }}>
          <Icon name="ArrowLeft" size={18} />
        </button>
        <Avatar letter={contact.avatar} size={36} status={contact.status} />
        <div>
          <div className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>{contact.name}</div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--k-text-muted)" }}>
            <Icon name="Lock" size={10} style={{ color: "var(--k-accent)" }} />
            <span>Сквозное шифрование</span>
            <span>·</span>
            <span style={{ color: contact.status === "online" ? "var(--k-online)" : "var(--k-text-muted)" }}>
              {contact.status === "online" ? "онлайн" : contact.status === "away" ? "отошёл" : "не в сети"}
            </span>
          </div>
        </div>
        <div className="flex-1" />
        {[{ icon: "Phone" }, { icon: "Video" }, { icon: "MoreVertical" }].map(btn => (
          <button key={btn.icon} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: "var(--k-text-muted)" }}>
            <Icon name={btn.icon} size={16} />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <div className="flex justify-center">
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ background: "var(--k-bg-elevated)", color: "var(--k-text-muted)" }}
          >
            <Icon name="ShieldCheck" size={12} style={{ color: "var(--k-accent)" }} />
            Сообщения защищены сквозным шифрованием
          </div>
        </div>

        {localMsgs.map((msg) => (
          <div key={msg.id} className={`flex animate-message-in ${msg.mine ? "justify-end" : "justify-start"}`}>
            {!msg.mine && (
              <div className="flex-shrink-0 mr-2 mt-1">
                <Avatar letter={contact.avatar} size={28} />
              </div>
            )}
            <div style={{ maxWidth: "68%" }}>
              <div
                className="px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: msg.mine ? "var(--k-accent)" : "var(--k-bg-elevated)",
                  color: msg.mine ? "#fff" : "var(--k-text-primary)",
                  borderRadius: msg.mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                }}
              >
                {msg.text}
              </div>
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${msg.mine ? "justify-end" : "justify-start"}`}
                style={{ color: "var(--k-text-muted)" }}
              >
                {msg.encrypted && <Icon name="Lock" size={9} />}
                {msg.time}
                {msg.mine && <Icon name="CheckCheck" size={11} style={{ color: "var(--k-accent)" }} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--k-border)" }}>
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
          style={{ background: "var(--k-bg-elevated)", border: "1px solid var(--k-border)" }}
        >
          <button style={{ color: "var(--k-text-muted)" }} className="hover:text-white transition-colors">
            <Icon name="Paperclip" size={18} />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--k-text-primary)" }}
          />
          <button style={{ color: "var(--k-text-muted)" }} className="hover:text-white transition-colors">
            <Icon name="Smile" size={18} />
          </button>
          <button
            onClick={send}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: input.trim() ? "var(--k-accent)" : "var(--k-bg-surface)", color: input.trim() ? "#fff" : "var(--k-text-muted)" }}
          >
            <Icon name="Send" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const totalUnread = contacts.reduce((sum, c) => sum + c.unread, 0);
  return (
    <div className="flex flex-col h-full px-8 py-8 animate-fade-in overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--k-accent)" }}>
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--k-text-primary)" }}>Kiscord</h1>
            <p className="text-sm" style={{ color: "var(--k-text-muted)" }}>Защищённый мессенджер</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Контактов", value: contacts.length, icon: "Users" },
            { label: "Непрочитанных", value: totalUnread, icon: "MessageSquare" },
            { label: "Защита", value: "2FA", icon: "ShieldCheck" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl p-4" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
              <Icon name={stat.icon} size={18} style={{ color: "var(--k-accent)", marginBottom: 8 }} />
              <div className="text-xl font-bold" style={{ color: "var(--k-text-primary)" }}>{stat.value}</div>
              <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-6 flex items-center gap-4" style={{ background: "var(--k-accent-dim)", border: "1px solid rgba(59,130,246,0.3)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--k-accent)" }}>
          <Icon name="ShieldCheck" size={18} style={{ color: "#fff" }} />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: "var(--k-text-primary)" }}>Двухфакторная аутентификация активна</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--k-text-secondary)" }}>Ваш аккаунт дополнительно защищён</div>
        </div>
        <div className="flex-1" />
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--k-online)", color: "#fff" }}>Активно</span>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--k-text-muted)" }}>Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Новый чат", icon: "Plus", page: "chats" as Page },
            { label: "Личное сообщение", icon: "Mail", page: "dm" as Page },
            { label: "Мой профиль", icon: "User", page: "profile" as Page },
            { label: "Настройки", icon: "Settings", page: "settings" as Page },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.page)}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-150"
              style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--k-accent)"; e.currentTarget.style.background = "var(--k-accent-dim)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--k-border)"; e.currentTarget.style.background = "var(--k-bg-surface)"; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--k-bg-elevated)" }}>
                <Icon name={action.icon} size={15} style={{ color: "var(--k-accent)" }} />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--k-text-primary)" }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--k-text-muted)" }}>Последние чаты</h2>
        <div className="space-y-1">
          {contacts.slice(0, 3).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
              <Avatar letter={c.avatar} size={34} status={c.status} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--k-text-primary)" }}>{c.name}</div>
                <div className="text-xs truncate" style={{ color: "var(--k-text-muted)" }}>{c.lastMsg}</div>
              </div>
              {c.unread > 0 && (
                <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full" style={{ background: "var(--k-accent)" }}>
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="flex flex-col h-full px-8 py-8 animate-fade-in overflow-y-auto">
      <h2 className="text-lg font-bold mb-6" style={{ color: "var(--k-text-primary)" }}>Профиль</h2>
      <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar letter="Д" size={72} status="online" />
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--k-accent)", border: "2px solid var(--k-bg-deep)" }}>
              <Icon name="Camera" size={12} style={{ color: "#fff" }} />
            </button>
          </div>
        </div>
        <div className="text-xl font-bold mb-1" style={{ color: "var(--k-text-primary)" }}>Дмитрий Ковалёв</div>
        <div className="text-sm mb-3" style={{ color: "var(--k-text-muted)" }}>@d.kovalev · ID: 10247</div>
        <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--k-accent-dim)", color: "var(--k-accent)" }}>
          <Icon name="ShieldCheck" size={11} />
          Аккаунт защищён
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        {[
          { label: "Имя", value: "Дмитрий Ковалёв", icon: "User" },
          { label: "Имя пользователя", value: "@d.kovalev", icon: "AtSign" },
          { label: "Телефон", value: "+7 (999) *** **89", icon: "Phone" },
          { label: "Email", value: "d.kovalev@mail.ru", icon: "Mail" },
          { label: "О себе", value: "Разработчик. Люблю минимализм.", icon: "Info" },
        ].map((field, i, arr) => (
          <div key={field.label} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--k-border)" : "none" }}>
            <Icon name={field.icon} size={16} style={{ color: "var(--k-text-muted)" }} />
            <div className="flex-1">
              <div className="text-xs mb-0.5" style={{ color: "var(--k-text-muted)" }}>{field.label}</div>
              <div className="text-sm" style={{ color: "var(--k-text-primary)" }}>{field.value}</div>
            </div>
            <button style={{ color: "var(--k-text-muted)" }} className="hover:text-white transition-colors">
              <Icon name="Pencil" size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <button className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5" style={{ borderBottom: "1px solid var(--k-border)" }}>
          <Icon name="LogOut" size={16} style={{ color: "var(--k-text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--k-text-primary)" }}>Выйти из аккаунта</span>
        </button>
        <button className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-red-500/10">
          <Icon name="Trash2" size={16} style={{ color: "var(--k-danger)" }} />
          <span className="text-sm" style={{ color: "var(--k-danger)" }}>Удалить аккаунт</span>
        </button>
      </div>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative rounded-full transition-all duration-200 flex-shrink-0"
      style={{ width: 44, height: 24, background: enabled ? "var(--k-accent)" : "var(--k-bg-elevated)" }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all duration-200"
        style={{ width: 20, height: 20, background: "#fff", left: enabled ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      />
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

function SettingRow({ label, desc, icon, children }: { label: string; desc: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: "1px solid var(--k-border)" }}>
      <Icon name={icon} size={16} style={{ color: "var(--k-text-muted)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: "var(--k-text-primary)" }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--k-text-muted)" }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

function SelectRow({ label, icon, value, options, onChange }: {
  label: string; icon: string; value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: "1px solid var(--k-border)" }}>
      <Icon name={icon} size={16} style={{ color: "var(--k-text-muted)", flexShrink: 0 }} />
      <div className="flex-1 text-sm" style={{ color: "var(--k-text-primary)" }}>{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm rounded-lg px-2 py-1 outline-none border-0"
        style={{ background: "var(--k-bg-elevated)", color: "var(--k-text-primary)" }}
      >
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const [settings, setSettings] = useState({
    soundEnabled: true, vibration: false, popup: true, dmNotify: true, groupNotify: true, previewOnLock: false,
    phoneVisible: "contacts", onlineVisible: "contacts", lastSeenVisible: "nobody", photoVisible: "everyone", addToGroups: "contacts",
    twofa: true, tfaEmail: true, autoDownload: true, saveMedia: false, darkTheme: true, compactMode: false, fontSize: "medium",
  });

  const toggle = (key: keyof typeof settings) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "notifications", label: "Уведомления", icon: "Bell" },
    { id: "privacy", label: "Конфиденциальность", icon: "Shield" },
    { id: "twofa", label: "2FA", icon: "KeyRound" },
    { id: "appearance", label: "Внешний вид", icon: "Palette" },
    { id: "media", label: "Медиа", icon: "Image" },
    { id: "chats", label: "Чаты", icon: "MessageSquare" },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--k-border)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--k-text-primary)" }}>Настройки</h2>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeTab === tab.id ? "var(--k-accent)" : "var(--k-bg-surface)",
                color: activeTab === tab.id ? "#fff" : "var(--k-text-muted)",
                border: `1px solid ${activeTab === tab.id ? "var(--k-accent)" : "var(--k-border)"}`,
              }}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "notifications" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Общие">
              <SettingRow label="Звуковые уведомления" desc="Воспроизводить звук при получении сообщений" icon="Volume2">
                <Toggle enabled={settings.soundEnabled} onToggle={() => toggle("soundEnabled")} />
              </SettingRow>
              <SettingRow label="Вибрация" desc="Вибрировать при новых сообщениях" icon="Vibrate">
                <Toggle enabled={settings.vibration} onToggle={() => toggle("vibration")} />
              </SettingRow>
              <SettingRow label="Всплывающие уведомления" desc="Показывать уведомления поверх экрана" icon="BellRing">
                <Toggle enabled={settings.popup} onToggle={() => toggle("popup")} />
              </SettingRow>
            </Section>
            <Section title="По типу чата">
              <SettingRow label="Личные сообщения" desc="Уведомления из личных диалогов" icon="Mail">
                <Toggle enabled={settings.dmNotify} onToggle={() => toggle("dmNotify")} />
              </SettingRow>
              <SettingRow label="Групповые чаты" desc="Уведомления из групповых чатов" icon="Users">
                <Toggle enabled={settings.groupNotify} onToggle={() => toggle("groupNotify")} />
              </SettingRow>
            </Section>
            <Section title="Экран блокировки">
              <SettingRow label="Предпросмотр сообщений" desc="Показывать текст сообщений на экране блокировки" icon="Smartphone">
                <Toggle enabled={settings.previewOnLock} onToggle={() => toggle("previewOnLock")} />
              </SettingRow>
            </Section>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Видимость данных">
              <SelectRow label="Номер телефона" icon="Phone" value={settings.phoneVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => setSettings(p => ({ ...p, phoneVisible: v }))} />
              <SelectRow label="Онлайн-статус" icon="Circle" value={settings.onlineVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => setSettings(p => ({ ...p, onlineVisible: v }))} />
              <SelectRow label="Время посещения" icon="Clock" value={settings.lastSeenVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => setSettings(p => ({ ...p, lastSeenVisible: v }))} />
              <SelectRow label="Фото профиля" icon="Image" value={settings.photoVisible} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => setSettings(p => ({ ...p, photoVisible: v }))} />
            </Section>
            <Section title="Взаимодействие">
              <SelectRow label="Добавление в группы" icon="UserPlus" value={settings.addToGroups} options={[["everyone","Все"],["contacts","Контакты"],["nobody","Никто"]]} onChange={v => setSettings(p => ({ ...p, addToGroups: v }))} />
            </Section>
          </div>
        )}

        {activeTab === "twofa" && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "var(--k-accent-dim)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <Icon name="ShieldCheck" size={24} style={{ color: "var(--k-accent)", flexShrink: 0 }} />
              <div>
                <div className="font-semibold mb-1" style={{ color: "var(--k-text-primary)" }}>Двухфакторная аутентификация</div>
                <div className="text-sm" style={{ color: "var(--k-text-secondary)" }}>
                  При входе с нового устройства потребуется дополнительный код подтверждения.
                </div>
              </div>
            </div>
            <Section title="Настройки 2FA">
              <SettingRow label="Двухфакторная аутентификация" desc="Требовать код при входе с нового устройства" icon="KeyRound">
                <Toggle enabled={settings.twofa} onToggle={() => toggle("twofa")} />
              </SettingRow>
              <SettingRow label="Email-подтверждение" desc="Отправлять код на почту как резервный вариант" icon="Mail">
                <Toggle enabled={settings.tfaEmail} onToggle={() => toggle("tfaEmail")} />
              </SettingRow>
            </Section>
            <Section title="Активные устройства">
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
                {[
                  { device: "MacBook Pro", location: "Москва", icon: "Laptop", current: true },
                  { device: "iPhone 15", location: "Москва", icon: "Smartphone", current: false },
                ].map((d, i, arr) => (
                  <div key={d.device} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--k-border)" : "none" }}>
                    <Icon name={d.icon} size={18} style={{ color: "var(--k-text-muted)" }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--k-text-primary)" }}>{d.device}</div>
                      <div className="text-xs" style={{ color: "var(--k-text-muted)" }}>{d.location}</div>
                    </div>
                    {d.current
                      ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--k-online)", color: "#fff" }}>Текущее</span>
                      : <button className="text-xs" style={{ color: "var(--k-danger)" }}>Завершить</button>
                    }
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Тема">
              <SettingRow label="Тёмная тема" desc="Использовать тёмное оформление" icon="Moon">
                <Toggle enabled={settings.darkTheme} onToggle={() => toggle("darkTheme")} />
              </SettingRow>
              <SettingRow label="Компактный режим" desc="Уменьшить размер сообщений и отступы" icon="AlignJustify">
                <Toggle enabled={settings.compactMode} onToggle={() => toggle("compactMode")} />
              </SettingRow>
            </Section>
            <Section title="Размер шрифта">
              <div className="flex gap-2 px-4 py-4">
                {["small", "medium", "large"].map(size => (
                  <button
                    key={size}
                    onClick={() => setSettings(p => ({ ...p, fontSize: size }))}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: settings.fontSize === size ? "var(--k-accent)" : "var(--k-bg-elevated)",
                      color: settings.fontSize === size ? "#fff" : "var(--k-text-muted)",
                    }}
                  >
                    {size === "small" ? "Мелкий" : size === "medium" ? "Средний" : "Крупный"}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Автозагрузка">
              <SettingRow label="Автозагрузка медиа" desc="Автоматически загружать фото и видео" icon="Download">
                <Toggle enabled={settings.autoDownload} onToggle={() => toggle("autoDownload")} />
              </SettingRow>
              <SettingRow label="Сохранять в галерею" desc="Автоматически сохранять медиа на устройство" icon="FolderOpen">
                <Toggle enabled={settings.saveMedia} onToggle={() => toggle("saveMedia")} />
              </SettingRow>
            </Section>
          </div>
        )}

        {activeTab === "chats" && (
          <div className="space-y-4 animate-slide-up">
            <Section title="Управление">
              <div>
                {[
                  { label: "Архивные чаты", icon: "Archive", count: "3" },
                  { label: "Заблокированные", icon: "Ban", count: "0" },
                  { label: "Очистить кэш", icon: "Trash2", count: "" },
                ].map((item, i, arr) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--k-border)" : "none" }}
                  >
                    <Icon name={item.icon} size={16} style={{ color: "var(--k-text-muted)" }} />
                    <span className="flex-1 text-sm" style={{ color: "var(--k-text-primary)" }}>{item.label}</span>
                    {item.count && <span className="text-xs" style={{ color: "var(--k-text-muted)" }}>{item.count}</span>}
                    <Icon name="ChevronRight" size={14} style={{ color: "var(--k-text-muted)" }} />
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in" style={{ color: "var(--k-text-muted)" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--k-bg-surface)", border: "1px solid var(--k-border)" }}>
        <Icon name="MessageSquare" size={28} style={{ color: "var(--k-text-muted)" }} />
      </div>
      <div className="font-medium mb-1" style={{ color: "var(--k-text-secondary)" }}>Выберите чат</div>
      <div className="text-sm">или начните новый диалог</div>
    </div>
  );
}

export default function Index() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const showChatList = activePage === "chats" || activePage === "dm";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--k-bg-deep)" }}>
      <Sidebar
        active={activePage}
        onNavigate={(p) => { setActivePage(p); if (p !== "chats" && p !== "dm") setSelectedChat(null); }}
        onSelectChat={setSelectedChat}
        selectedChat={selectedChat}
      />
      <div className="flex-1 min-w-0">
        {activePage === "home" && <HomePage onNavigate={setActivePage} />}
        {showChatList && (selectedChat ? <ChatView contactId={selectedChat} onBack={() => setSelectedChat(null)} /> : <EmptyState />)}
        {activePage === "profile" && <ProfilePage />}
        {activePage === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}
