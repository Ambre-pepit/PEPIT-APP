import { useState } from "react";

const USERS = {
  "marie@email.com": { pass: "1234", name: "Marie Dupont", id: "USR001", offer: "Prestige", savings: "142€", scans: 8, type: "client" },
  "jean@email.com": { pass: "1234", name: "Jean Martin", id: "USR002", offer: "Trio", savings: "87€", scans: 5, type: "client" },
  "sophie@email.com": { pass: "1234", name: "Sophie Bernard", id: "USR003", offer: "Essentiel", savings: "34€", scans: 2, type: "client" },
  "bella@pepit.com": { pass: "shop", name: "Bella Moda", type: "merchant" },
  "zen@pepit.com": { pass: "shop", name: "Zen Spa", type: "merchant" },
};

const MEMBERS_BY_ID = {
  "USR001": { name: "Marie Dupont", offer: "Prestige", discount: "-15%" },
  "USR002": { name: "Jean Martin", offer: "Trio", discount: "-10%" },
  "USR003": { name: "Sophie Bernard", offer: "Essentiel", discount: "-8%" },
};

const PARTNERS = [
  { id: 1, name: "Bella Moda", category: "Mode", dept: "Guadeloupe", discount: "-15% Prestige" },
  { id: 2, name: "Zen Spa", category: "Bien-être", dept: "Guyane", discount: "Soin offert" },
  { id: 3, name: "Ti' Saveur", category: "Restaurant", dept: "Martinique", discount: "-10% Trio" },
  { id: 4, name: "Karib Sport", category: "Sport", dept: "Guadeloupe", discount: "-8% Essentiel" },
];

const styles = {
  app: { fontFamily: "sans-serif", maxWidth: 400, margin: "0 auto", minHeight: "100vh", background: "#f9f9f9" },
  header: { background: "#27500A", color: "white", padding: "16px", textAlign: "center", position: "relative" },
  headerTitle: { fontSize: 22, fontWeight: 600, letterSpacing: 2 },
  headerSub: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  content: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "white", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
  btnPrimary: { background: "#27500A", color: "white", border: "none", borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnSecondary: { background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14 },
  bottomNav: { display: "flex", borderTop: "1px solid #eee", background: "white", position: "sticky", bottom: 0 },
  navBtn: { flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  navBtnActive: { flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: "#27500A", fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  memberCard: { background: "#1a1a1a", borderRadius: 16, padding: 20, color: "white" },
  tag: { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, background: "#f0f0f0", color: "#666", cursor: "pointer" },
  tagActive: { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, background: "#27500A", color: "white", cursor: "pointer" },
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [loginType, setLoginType] = useState("client");
  const [email, setEmail] = useState("marie@email.com");
  const [pass, setPass] = useState("1234");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [filter, setFilter] = useState("Tous");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loginError, setLoginError] = useState("");

  const categories = ["Tous", "Mode", "Restaurant", "Bien-être", "Sport"];

  function doLogin() {
    const u = USERS[email.trim().toLowerCase()];
    if (!u || u.pass !== pass) { setLoginError("Email ou mot de passe incorrect"); return; }
    setLoginError("");
    setUser(u);
    if (u.type === "merchant") { setScreen("merchant"); }
    else { setScreen("main"); setTab("home"); }
  }

  function doLogout() { setUser(null); setScreen("login"); setScanResult(null); }

  function simulateScan() {
    const ids = ["USR001", "USR002", "USR003"];
    const id = ids[Math.floor(Math.random() * ids.length)];
    setScanResult(MEMBERS_BY_ID[id]);
  }

  function verifyCode() {
    const code = manualCode.trim().toUpperCase();
    if (MEMBERS_BY_ID[code]) { setScanResult(MEMBERS_BY_ID[code]); }
    else { setScanResult({ error: true }); }
  }

  const filteredPartners = filter === "Tous" ? PARTNERS : PARTNERS.filter(p => p.category === filter);

  if (screen === "login") return (
    <div style={styles.app}>
      <div style={{ ...styles.header, padding: "40px 24px 32px" }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 3 }}>PEPIT'</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 }}>Vos avantages en Guadeloupe,<br />Martinique & Guyane</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, background: "#f0f0f0", borderRadius: 8, padding: 4 }}>
          <button onClick={() => setLoginType("client")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: loginType === "client" ? "#27500A" : "none", color: loginType === "client" ? "white" : "#666" }}>Membre</button>
          <button onClick={() => setLoginType("merchant")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: loginType === "merchant" ? "#27500A" : "none", color: loginType === "merchant" ? "white" : "#666" }}>Commerçant</button>
        </div>
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={pass} onChange={e => setPass(e.target.value)} />
        {loginError && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{loginError}</div>}
        <button style={styles.btnPrimary} onClick={doLogin}>Se connecter</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Pas encore membre ? <span style={{ color: "#27500A", cursor: "pointer", textDecoration: "underline" }}>S'inscrire</span></div>
      </div>
    </div>
  );

  if (screen === "merchant") return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>PEPIT'</div>
        <div style={styles.headerSub}>{user?.name}</div>
      </div>
      <div style={styles.content}>
        <div style={{ ...styles.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Scanner la carte membre</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Pointez la caméra vers le QR code</div>
          <button style={{ ...styles.btnPrimary, marginTop: 16 }} onClick={simulateScan}>Simuler un scan</button>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "#aaa" }}>— ou entrer manuellement —</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...styles.input, flex: 1 }} placeholder="Code membre (ex: USR001)" value={manualCode} onChange={e => setManualCode(e.target.value)} />
          <button onClick={verifyCode} style={{ background: "#27500A", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}>Vérifier</button>
        </div>
        {scanResult && !scanResult.error && (
          <div style={{ background: "#d4edda", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#155724", fontWeight: 600, marginBottom: 8 }}>MEMBRE VALIDE</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#155724" }}>{scanResult.name}</div>
            <div style={{ fontSize: 12, color: "#155724", marginTop: 2 }}>Offre : {scanResult.offer}</div>
            <div style={{ marginTop: 10, background: "white", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#666" }}>Avantage applicable</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#27500A", marginTop: 2 }}>{scanResult.discount}</div>
            </div>
          </div>
        )}
        {scanResult?.error && <div style={{ background: "#f8d7da", borderRadius: 8, padding: 12, textAlign: "center", color: "#721c24", fontSize: 13 }}>Code membre non reconnu</div>}
        <button style={styles.btnSecondary} onClick={doLogout}>Se déconnecter</button>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      {tab === "home" && <>
        <div style={styles.header}>
          <div style={styles.headerTitle}>PEPIT'</div>
          <div style={styles.headerSub}>Bonjour {user?.name?.split(" ")[0]}</div>
        </div>
        <div style={styles.content}>
          <div style={styles.memberCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: "#BA7517", letterSpacing: 1, textTransform: "uppercase" }}>Carte membre</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{user?.name}</div>
                <div style={{ marginTop: 8 }}><span style={{ ...styles.badge, background: "#2a2a00", color: "#BA7517" }}>{user?.offer}</span></div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#BA7517", letterSpacing: 2 }}>PEPIT'</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "white", borderRadius: 8, padding: 8, fontSize: 11, color: "#333", fontWeight: 700, letterSpacing: 1 }}>QR</div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa" }}>N° membre</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#BA7517" }}>{user?.id}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>Économies ce mois</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.savings}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "#f0f7ea", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#27500A" }}>{user?.scans}</div>
              <div style={{ fontSize: 11, color: "#666" }}>utilisations</div>
            </div>
            <div style={{ background: "#FFF8E7", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#BA7517" }}>{user?.savings}</div>
              <div style={{ fontSize: 11, color: "#666" }}>économisés</div>
            </div>
          </div>
        </div>
      </>}

      {tab === "partners" && <>
        <div style={styles.header}>
          <div style={styles.headerTitle}>PEPIT'</div>
          <div style={styles.headerSub}>Partenaires</div>
        </div>
        <div style={styles.content}>
          <input style={styles.input} placeholder="Rechercher un partenaire..." />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => (
              <span key={c} style={filter === c ? styles.tagActive : styles.tag} onClick={() => setFilter(c)}>{c}</span>
            ))}
          </div>
          {filteredPartners.map(p => (
            <div key={p.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {p.dept} · {p.category}</div>
                <div style={{ marginTop: 6 }}><span style={{ ...styles.badge, background: "#d4edda", color: "#155724" }}>{p.discount}</span></div>
              </div>
              <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
            </div>
          ))}
        </div>
      </>}

      {tab === "account" && <>
        <div style={styles.header}>
          <div style={styles.headerTitle}>PEPIT'</div>
          <div style={styles.headerSub}>Mon compte</div>
        </div>
        <div style={styles.content}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#27500A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16 }}>{user?.name?.split(" ").map(n => n[0]).join("")}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{Object.keys(USERS).find(k => USERS[k] === user)}</div>
            </div>
          </div>
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Abonnement actif</div>
            <span style={{ ...styles.badge, background: "#FFF8E7", color: "#856404" }}>{user?.offer} · {user?.offer === "Prestige" ? "24,90€" : user?.offer === "Trio" ? "14,90€" : "9,90€"}/mois</span>
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Renouvellement le 15 juillet 2026</div>
          </div>
          {["Historique des utilisations", "Offrir un abonnement", "Paramètres"].map(item => (
            <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14 }}>
              <span>{item}</span><span style={{ color: "#ccc" }}>›</span>
            </div>
          ))}
          <button style={{ ...styles.btnSecondary, color: "#dc3545" }} onClick={doLogout}>Se déconnecter</button>
        </div>
      </>}

      <div style={styles.bottomNav}>
        {[["home", "🏠", "Accueil"], ["partners", "🏪", "Partenaires"], ["account", "👤", "Compte"]].map(([t, icon, label]) => (
          <button key={t} style={tab === t ? styles.navBtnActive : styles.navBtn} onClick={() => setTab(t)}>
            <span style={{ fontSize: 20 }}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
}
