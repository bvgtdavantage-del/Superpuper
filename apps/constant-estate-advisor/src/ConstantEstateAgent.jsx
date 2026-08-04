import React, { useState, useRef, useEffect } from "react";

// ————————————————————————————————————————————————
// CONSTANT ESTATE — AI Property Advisor
// Navy / gold / ivory · Fraunces + Cormorant + Manrope
// ————————————————————————————————————————————————

const MODES = {
  advisor: {
    label: "Advisor",
    ru: "Советник",
    hint: "Dubai market questions, buyer/seller guidance, area intel.",
    system: `You are the senior property advisor of Constant Estate, a RERA-licensed Dubai brokerage operated under Constant Private, a Dubai family office focused on distressed and off-market real estate. Brand voice: Spare. Exact. Contrarian. Cold. No exclamation marks, no hype, no emojis, no filler. Short declarative sentences. You know the Dubai market deeply: DLD/Trakheesi mechanics, Oqood, freehold vs leasehold zones, service charges, transfer fees (4% DLD + trustee), Golden Visa thresholds (AED 2M), off-plan payment plans, RERA escrow, Ejari, RDC. Areas: Palm Jumeirah, Emirates Hills, Dubai Hills, JBR, Downtown, Business Bay, Dubai Islands, Jumeirah Bay, District One, Tilal Al Ghaf, DAMAC Lagoons, JVC, Marina. When the client writes in Russian, answer in Russian with the same register. Distinguish what documents show from what they imply. Never state an inferred status as fact. Give numbers when you have them; say "verify against DLD" when you don't. End with one precise next step, not a list of options.`,
  },
  listing: {
    label: "Listing Writer",
    ru: "Листинг",
    hint: "Paste raw property details → institutional-grade listing copy.",
    system: `You write property listings for Constant Estate, Dubai. Voice: Spare, Exact, Contrarian, Cold — institutional, never portal-generic. Banned words: stunning, luxurious, breathtaking, dream home, oasis, prestigious, exclusive opportunity, don't miss. Structure every listing: 1) a one-line cold open that states the single strongest fact of the asset, 2) a tight body — layout, view, condition, building, service charge if known, 3) a closing line on position or scarcity, 4) a spec block (BUA, plot, beds/baths, parking, title, price, permit no. placeholder). If details are missing, produce the listing anyway and append a short "MISSING" line listing exactly what to supply. If asked in Russian, deliver Russian. Output the listing only — no commentary.`,
  },
  qualify: {
    label: "Lead Qualifier",
    ru: "Квалификация",
    hint: "Paste an inquiry or chat → verdict, profile, and reply draft.",
    system: `You qualify inbound leads for Constant Estate, Dubai. Given a message, chat excerpt, or description of a prospect, return exactly this structure: VERDICT — one of: PROCEED / PROBE / PARK, with one sentence why. PROFILE — inferred budget band, motive (end-use, investment, visa, relocation, flip), urgency, and cash vs mortgage, each flagged as stated or inferred. RISK — one line: anything off (unrealistic ask, broker fishing, sanctions-exposure signals, time-waster patterns). REPLY — a deployable message in the prospect's language, natural spoken tone, no AI phrasing, designed to advance or filter in one exchange. Never state an inference as fact. Be economical.`,
  },
  memo: {
    label: "Deal Memo",
    ru: "Меморандум",
    hint: "Asset details → concise investment memo for a principal.",
    system: `You write one-screen deal memos for Constant Private, a Dubai family office (distressed and off-market real estate, hospitality). Audience: a principal who decides in ninety seconds. Structure: ASSET (what it is, title, zone) · ASK vs BASIS (price, implied psf, comparable band) · ANGLE (why this deal exists — distress, mispricing, structure) · YIELD/EXIT (rent or resale math, hold period) · RISKS (max three, real ones) · VERDICT (Pursue / Pass / Pursue at X). Numbers over adjectives. Mark every unverified figure "(unverified)". If the input lacks numbers, build the frame and state precisely what is needed to complete it. Russian input → Russian memo.`,
  },
  negotiate: {
    label: "Negotiation",
    ru: "Переговоры",
    hint: "Describe the standoff → message drafts with implied leverage.",
    system: `You draft negotiation messages for a Dubai real estate principal. Doctrine: calm control, implied leverage over explicit threats, economy of words. Never bluff with specifics you don't have; leverage is implied through posture, timing, and readiness to walk. Given a situation, produce 2 labeled drafts with different strategic postures (e.g., "Anchor and hold" vs "Open the door"), each deployable verbatim in the counterparty's language. One line under each label stating what it trades off. No strategic essays unless asked.`,
  },
};

// ————— Original Constant Private mark: dark circle, gold-gradient wordmark —————
const Monogram = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Constant Private">
    <defs>
      <linearGradient id="cpGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E8CE96" />
        <stop offset="45%" stopColor="#C9A45D" />
        <stop offset="100%" stopColor="#9C7A3C" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="58" fill="#071522" stroke="url(#cpGold)" strokeWidth="1.2" />
    <circle cx="60" cy="60" r="52.5" fill="none" stroke="#C9A45D" strokeWidth="0.4" opacity="0.45" />
    <text
      x="60"
      y="57"
      textAnchor="middle"
      fontFamily="'Cormorant Garamond', serif"
      fontWeight="600"
      fontSize="15.5"
      letterSpacing="2.2"
      fill="url(#cpGold)"
    >
      CONSTANT
    </text>
    <text
      x="61"
      y="73"
      textAnchor="middle"
      fontFamily="'Cormorant Garamond', serif"
      fontSize="11"
      letterSpacing="4.5"
      fill="#F2EBDD"
    >
      PRIVATE
    </text>
    <line x1="42" y1="80" x2="78" y2="80" stroke="#C9A45D" strokeWidth="0.5" opacity="0.7" />
    <text
      x="61"
      y="90"
      textAnchor="middle"
      fontFamily="'Manrope', sans-serif"
      fontSize="5.2"
      letterSpacing="2.4"
      fill="#7C8B96"
    >
      FAMILY OFFICE
    </text>
  </svg>
);

const T = {
  en: {
    title: "CONSTANT ESTATE",
    sub: "Private Property Advisory · Dubai",
    motto: "Constans in adversis",
    placeholder: "Write to the desk…",
    thinking: "Working",
    empty: "The desk is open.",
    emptySub: "Select a function. State the matter. No preamble required.",
    error: "Connection failed. Send again.",
    clear: "New matter",
  },
  ru: {
    title: "CONSTANT ESTATE",
    sub: "Частное консультирование · Дубай",
    motto: "Constans in adversis",
    placeholder: "Изложите вопрос…",
    thinking: "В работе",
    empty: "Стол открыт.",
    emptySub: "Выберите функцию. Изложите суть. Без предисловий.",
    error: "Сбой связи. Отправьте снова.",
    clear: "Новое дело",
  },
};

// Inside claude.ai artifacts the runtime proxies api.anthropic.com without
// credentials. For standalone deployment, set VITE_ANTHROPIC_API_KEY (.env)
// and the required direct-browser-access headers are added automatically.
const API_KEY = import.meta.env?.VITE_ANTHROPIC_API_KEY;
const API_HEADERS = {
  "Content-Type": "application/json",
  ...(API_KEY
    ? {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      }
    : {}),
};

export default function ConstantEstateAgent() {
  const [mode, setMode] = useState("advisor");
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const scrollRef = useRef(null);
  const t = T[lang];

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setErr(false);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: MODES[mode].system,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (!reply) throw new Error("empty");
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (k) => {
    setMode(k);
    setMessages([]);
    setErr(false);
  };

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* ————— Sidebar ————— */}
      <aside style={S.side} className="ce-side">
        <div>
          <div style={S.brandBlock}>
            <div style={{ marginBottom: 16 }}>
              <Monogram size={78} />
            </div>
            <h1 style={S.brand}>{t.title}</h1>
            <div style={S.brandSub}>{t.sub}</div>
          </div>

          <nav style={S.nav}>
            {Object.entries(MODES).map(([k, m]) => (
              <button
                key={k}
                onClick={() => switchMode(k)}
                className="ce-mode"
                style={{
                  ...S.modeBtn,
                  ...(mode === k ? S.modeBtnActive : {}),
                }}
              >
                <span style={S.modeLabel}>
                  {lang === "ru" ? m.ru : m.label}
                </span>
                {mode === k && <span style={S.modeDot} />}
              </button>
            ))}
          </nav>
        </div>

        <div style={S.sideFoot}>
          <div style={S.langRow}>
            {["en", "ru"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="ce-lang"
                style={{
                  ...S.langBtn,
                  ...(lang === l ? S.langBtnActive : {}),
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={S.motto}>{t.motto}</div>
        </div>
      </aside>

      {/* ————— Main ————— */}
      <main style={S.main}>
        <header style={S.head}>
          <div>
            <div style={S.headMode}>
              {lang === "ru" ? MODES[mode].ru : MODES[mode].label}
            </div>
            <div style={S.headHint}>{MODES[mode].hint}</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => switchMode(mode)}
              className="ce-clear"
              style={S.clearBtn}
            >
              {t.clear}
            </button>
          )}
        </header>

        <div ref={scrollRef} style={S.thread} className="ce-thread">
          {messages.length === 0 && !busy && (
            <div style={S.empty}>
              <div style={{ marginBottom: 24 }}>
                <Monogram size={110} />
              </div>
              <div style={S.emptyTitle}>{t.empty}</div>
              <div style={S.emptySub}>{t.emptySub}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={m.role === "user" ? S.rowUser : S.rowAsst}
            >
              <div style={m.role === "user" ? S.bubUser : S.bubAsst}>
                <div style={S.bubTag}>
                  {m.role === "user"
                    ? lang === "ru" ? "Вы" : "You"
                    : "Constant Estate"}
                </div>
                <div style={S.bubText}>{m.content}</div>
              </div>
            </div>
          ))}
          {busy && (
            <div style={S.rowAsst}>
              <div style={{ ...S.bubAsst, ...S.thinking }}>
                <span className="ce-pulse">{t.thinking}</span>
              </div>
            </div>
          )}
          {err && <div style={S.err}>{t.error}</div>}
        </div>

        <div style={S.composer}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t.placeholder}
            rows={2}
            style={S.textarea}
            className="ce-ta"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="ce-send"
            style={{
              ...S.sendBtn,
              opacity: busy || !input.trim() ? 0.35 : 1,
            }}
          >
            →
          </button>
        </div>
      </main>
    </div>
  );
}

// ————— styles —————
const NAVY = "#0B1E2D";
const NAVY_DEEP = "#071522";
const NAVY_PANEL = "#0E2536";
const GOLD = "#C9A45D";
const IVORY = "#F2EBDD";
const MUTED = "#7C8B96";

const S = {
  root: {
    display: "flex",
    height: "100vh",
    background: NAVY_DEEP,
    color: IVORY,
    fontFamily: "'Manrope', system-ui, sans-serif",
    overflow: "hidden",
  },
  side: {
    width: 250,
    minWidth: 250,
    background: NAVY,
    borderRight: `1px solid ${GOLD}33`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "34px 24px 24px",
  },
  brandBlock: { marginBottom: 40 },
  brandRule: { width: 34, height: 1, background: GOLD, marginBottom: 16 },
  brand: {
    fontFamily: "'Fraunces', 'Cormorant Garamond', serif",
    fontSize: 21,
    fontWeight: 500,
    letterSpacing: "0.22em",
    margin: 0,
    color: IVORY,
  },
  brandSub: {
    fontSize: 10.5,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: MUTED,
    marginTop: 7,
  },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  modeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "transparent",
    border: "none",
    borderLeft: "1px solid transparent",
    color: MUTED,
    padding: "11px 0 11px 14px",
    fontSize: 13.5,
    letterSpacing: "0.04em",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "color .18s, border-color .18s",
  },
  modeBtnActive: { color: IVORY, borderLeft: `1px solid ${GOLD}` },
  modeLabel: {},
  modeDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: GOLD,
    marginRight: 4,
  },
  sideFoot: { display: "flex", flexDirection: "column", gap: 14 },
  langRow: { display: "flex", gap: 8 },
  langBtn: {
    background: "transparent",
    border: `1px solid ${GOLD}44`,
    color: MUTED,
    fontSize: 11,
    letterSpacing: "0.12em",
    padding: "5px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .18s",
  },
  langBtnActive: { color: NAVY, background: GOLD, borderColor: GOLD },
  motto: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: "italic",
    fontSize: 14,
    color: `${GOLD}AA`,
    letterSpacing: "0.05em",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  head: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: "26px 40px 18px",
    borderBottom: `1px solid ${GOLD}22`,
  },
  headMode: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 400,
    color: IVORY,
  },
  headHint: { fontSize: 12.5, color: MUTED, marginTop: 5 },
  clearBtn: {
    background: "transparent",
    border: `1px solid ${GOLD}44`,
    color: `${GOLD}CC`,
    fontSize: 11.5,
    letterSpacing: "0.08em",
    padding: "7px 16px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  thread: {
    flex: 1,
    overflowY: "auto",
    padding: "30px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  empty: {
    margin: "auto",
    textAlign: "center",
    maxWidth: 380,
  },
  emptyMark: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15,
    letterSpacing: "0.3em",
    color: GOLD,
    border: `1px solid ${GOLD}55`,
    width: 62,
    height: 62,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    borderRadius: "50%",
    paddingLeft: 4,
  },
  emptyTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    color: IVORY,
  },
  emptySub: { fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.6 },
  rowUser: { display: "flex", justifyContent: "flex-end" },
  rowAsst: { display: "flex", justifyContent: "flex-start" },
  bubUser: {
    maxWidth: "72%",
    background: NAVY_PANEL,
    border: `1px solid ${GOLD}26`,
    padding: "14px 18px",
  },
  bubAsst: {
    maxWidth: "78%",
    background: "transparent",
    borderLeft: `2px solid ${GOLD}`,
    padding: "10px 20px",
  },
  bubTag: {
    fontSize: 9.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: `${GOLD}BB`,
    marginBottom: 7,
  },
  bubText: {
    fontSize: 14.5,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    color: IVORY,
  },
  thinking: { color: MUTED, fontSize: 13, letterSpacing: "0.08em" },
  err: {
    alignSelf: "center",
    fontSize: 12.5,
    color: "#C97B5D",
    letterSpacing: "0.04em",
  },
  composer: {
    display: "flex",
    gap: 12,
    padding: "18px 40px 26px",
    borderTop: `1px solid ${GOLD}22`,
    background: NAVY_DEEP,
  },
  textarea: {
    flex: 1,
    background: NAVY,
    border: `1px solid ${GOLD}33`,
    color: IVORY,
    fontFamily: "inherit",
    fontSize: 14.5,
    lineHeight: 1.6,
    padding: "13px 16px",
    resize: "none",
    outline: "none",
  },
  sendBtn: {
    width: 52,
    background: GOLD,
    color: NAVY,
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity .18s",
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Cormorant+Garamond:ital@0;1&family=Manrope:wght@400;500;600&display=swap');
.ce-thread::-webkit-scrollbar { width: 4px; }
.ce-thread::-webkit-scrollbar-thumb { background: ${GOLD}44; }
.ce-mode:hover { color: ${IVORY}; }
.ce-ta:focus { border-color: ${GOLD}88 !important; }
.ce-clear:hover, .ce-lang:hover { border-color: ${GOLD}; color: ${GOLD}; }
.ce-pulse { animation: cePulse 1.4s ease-in-out infinite; }
@keyframes cePulse { 0%,100% { opacity: .4; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ce-pulse { animation: none; } }
@media (max-width: 700px) {
  .ce-side { display: none !important; }
}
`;
