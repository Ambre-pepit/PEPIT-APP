import { useState, useEffect } from "react";

const SUPABASE_URL = "https://drtevlthwlzebjvustuf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydGV2bHRod2x6ZWJqdnVzdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTQ2ODMsImV4cCI6MjA5Njc3MDY4M30.T8DDBzoRqwHuVFuDyhSP0wgR1Dm29uKZDZkwBQFkqoc";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`
};

async function supabase(table, options = {}) {
  const { method = "GET", body, params = "" } = options;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  if (method === "GET") return res.json();
  return res;
}

const GOLD = "#BA7517";
const DARK = "#1a1a1a";
const DARK2 = "#111111";

const styles = {
  app: { fontFamily: "sans-serif", maxWidth: 400, margin: "0 auto", minHeight: "100vh", background: "#f9f9f9" },
  header: { background: DARK, color: "white", padding: "16px", textAlign: "center" },
  headerTitle: { fontSize: 26, fontWeight: 700, letterSpacing: 4, color: GOLD },
  headerSub: { fontSize: 12, color: "rgba(186,117,23,0.7)", marginTop: 2 },
  content: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "white", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
  btnPrimary: { background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 1 },
  btnSecondary: { background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14 },
  bottomNav: { display: "flex", borderTop: "1px solid #eee", background: "white", position: "sticky", bottom: 0 },
  navBtn: { flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  navBtnActive: { flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: GOLD, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  memberCard: { background: `linear-gradient(135deg, ${DARK2}, #2a2a2a)`, borderRadius: 16, padding: 20, color: "white", border: `1px solid ${GOLD}33` },
  tag: { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, background: "#f0f0f0", color: "#666", cursor: "pointer" },
  tagActive: { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, background: DARK, color: GOLD, cursor: "pointer", border: `1px solid ${GOLD}` },
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);
  const [partenaires, setPartenaires] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loginType, setLoginType] = useState("client");

  // Inscription
  const [signupNom, setSignupNom] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupOffre, setSignupOffre] = useState("Essentiel");

  // Commerçant
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState(null);

  const categories = ["Tous", "Mode", "Restaurant", "Bien-être", "Sport"];
  const filteredPartners = filter === "Tous" ? partenaires : partenaires.filter(p => p.categorie === filter);

  useEffect(() => {
    if (screen === "main") loadPartenaires();
  }, [screen]);

  async function loadPartenaires() {
    try {
      const data = await supabase("partenaires", { params: "?actif=eq.true&order=nom" });
      setPartenaires(data);
    } catch (e) { console.error(e); }
  }

  async function doLogin() {
    setError("");
    setLoading(true);
    try {
      const data = await supabase("membres", { params: `?email=eq.${email.trim().toLowerCase()}&select=*` });
      if (data.length === 0) { setError("Email ou mot de passe incorrect"); setLoading(false); return; }
      const membre = data[0];
      setUser(membre);
      setScreen("main");
      setTab("home");
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  }

  async function doSignup() {
    setError("");
    setLoading(true);
    try {
      await supabase("membres", {
        method: "POST",
        body: { nom: signupNom, email: signupEmail.trim().toLowerCase(), offre: signupOffre, statut: "actif", economies: 0, nb_scans: 0 },
        params: ""
      });
      const data = await supabase("membres", { params: `?email=eq.${signupEmail.trim().toLowerCase()}&select=*` });
      setUser(data[0]);
      setScreen("main");
      setTab("home");
    } catch (e) {
      setError("Erreur lors de l'inscription. Email déjà utilisé ?");
    }
    setLoading(false);
  }

  async function verifyCode() {
    const code = manualCode.trim();
    try {
      const data = await supabase("membres", { params: `?id=eq.${code}&select=*` });
      if (data.length > 0) { setScanResult(data[0]); }
      else { setScanResult({ error: true }); }
    } catch (e) { setScanResult({ error: true }); }
  }

  function doLogout() { setUser(null); setScreen("login"); setScanResult(null); setEmail(""); setPass(""); }

  function getDiscount(offre) {
    if (offre === "Prestige") return "-15%";
    if (offre === "Trio") return "-10%";
    return "-8%";
  }

  // ÉCRAN LOGIN
  if (screen === "login") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "48px 24px 36px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: 6, color: GOLD }}>PEPIT'</div>
        <div style={{ fontSize: 12, color: "rgba(186,117,23,0.6)", marginTop: 6, letterSpacing: 1 }}>VOS AVANTAGES EN GUADELOUPE<br />MARTINIQUE & GUYANE</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, background: "#f0f0f0", borderRadius: 8, padding: 4 }}>
          <button onClick={() => setLoginType("client")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: loginType === "client" ? DARK : "none", color: loginType === "client" ? GOLD : "#666", fontWeight: loginType === "client" ? 700 : 400 }}>Membre</button>
          <button onClick={() => setLoginType("merchant")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: loginType === "merchant" ? DARK : "none", color: loginType === "merchant" ? GOLD : "#666", fontWeight: loginType === "merchant" ? 700 : 400 }}>Commerçant</button>
        </div>
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={pass} onChange={e => setPass(e.target.value)} />
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doLogin} disabled={loading}>{loading ? "Connexion..." : "SE CONNECTER"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Pas encore membre ? <span onClick={() => { setScreen("signup"); setError(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>S'inscrire</span></div>
      </div>
    </div>
  );

  // ÉCRAN INSCRIPTION
  if (screen === "signup") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "24px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: GOLD }}>PEPIT'</div>
        <div style={{ fontSize: 12, color: "rgba(186,117,23,0.6)", marginTop: 4 }}>Créer mon compte</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={styles.input} placeholder="Prénom et nom" value={signupNom} onChange={e => setSignupNom(e.target.value)} />
        <input style={styles.input} type="email" placeholder="Email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={signupPass} onChange={e => setSignupPass(e.target.value)} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 4 }}>Choisissez votre offre</div>
        {[["Essentiel", "9,90€/mois", "1 département"], ["Trio", "14,90€/mois", "3 départements"], ["Prestige", "24,90€/mois", "3 dép. + goodies + événements"]].map(([offre, prix, desc]) => (
          <div key={offre} onClick={() => setSignupOffre(offre)} style={{ background: signupOffre === offre ? DARK : "white", border: `2px solid ${signupOffre === offre ? GOLD : "#eee"}`, borderRadius: 12, padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: signupOffre === offre ? GOLD : "#333" }}>{offre}</div>
              <div style={{ fontSize: 12, color: signupOffre === offre ? "#aaa" : "#888", marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: signupOffre === offre ? GOLD : "#333" }}>{prix}</div>
          </div>
        ))}
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doSignup} disabled={loading}>{loading ? "Création..." : "CRÉER MON COMPTE"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Déjà membre ? <span onClick={() => { setScreen("login"); setError(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Se connecter</span></div>
      </div>
    </div>
  );

  // ÉCRAN COMMERÇANT
  if (screen === "merchant") return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>PEPIT'</div>
        <div style={styles.headerSub}>Espace commerçant</div>
      </div>
      <div style={styles.content}>
        <div style={{ ...styles.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Scanner la carte membre</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Entrez le numéro membre</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...styles.input, flex: 1 }} placeholder="Numéro membre" value={manualCode} onChange={e => setManualCode(e.target.value)} />
          <button onClick={verifyCode} style={{ background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Vérifier</button>
        </div>
        {scanResult && !scanResult.error && (
          <div style={{ background: "#d4edda", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#155724", fontWeight: 600, marginBottom: 8 }}>✓ MEMBRE VALIDE</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#155724" }}>{scanResult.nom}</div>
            <div style={{ fontSize: 12, color: "#155724", marginTop: 2 }}>Offre : {scanResult.offre}</div>
            <div style={{ marginTop: 10, background: "white", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#666" }}>Avantage applicable</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: DARK, marginTop: 2 }}>{getDiscount(scanResult.offre)}</div>
            </div>
          </div>
        )}
        {scanResult?.error && <div style={{ background: "#f8d7da", borderRadius: 8, padding: 12, textAlign: "center", color: "#721c24", fontSize: 13 }}>Membre non reconnu</div>}
        <button style={styles.btnSecondary} onClick={doLogout}>Se déconnecter</button>
      </div>
    </div>
  );

  // ÉCRAN PRINCIPAL MEMBRE
  return (
    <div style={styles.app}>
      {tab === "home" && <>
        <div style={styles.header}>
          <div style={styles.headerTitle}>PEPIT'</div>
          <div style={styles.headerSub}>Bonjour {user?.nom?.split(" ")[0]}</div>
        </div>
        <div style={styles.content}>
          <div style={styles.memberCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: "uppercase" }}>Carte membre</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{user?.nom}</div>
                <div style={{ marginTop: 8 }}><span style={{ ...styles.badge, background: "#2a1a00", color: GOLD, border: `1px solid ${GOLD}44` }}>{user?.offre}</span></div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: GOLD, letterSpacing: 3 }}>PEPIT'</div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: GOLD, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: DARK, fontWeight: 800 }}>#{user?.id?.slice(0, 8).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa" }}>N° membre</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{user?.id?.slice(0, 8).toUpperCase()}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>Économies ce mois</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{user?.economies}€</div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: DARK, borderRadius: 8, padding: 12, textAlign: "center", border: `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: GOLD }}>{user?.nb_scans}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>utilisations</div>
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 12, textAlign: "center", border: `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: GOLD }}>{user?.economies}€</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>économisés</div>
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
          {filteredPartners.length === 0 && <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: 20 }}>Chargement des partenaires...</div>}
          {filteredPartners.map(p => (
            <div key={p.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {p.departement} · {p.categorie}</div>
                <div style={{ marginTop: 6 }}><span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{p.remise}</span></div>
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
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: DARK, border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontWeight: 700, fontSize: 16 }}>{user?.nom?.split(" ").map(n => n[0]).join("")}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.nom}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{user?.email}</div>
            </div>
          </div>
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Abonnement actif</div>
            <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{user?.offre} · {user?.offre === "Prestige" ? "24,90€" : user?.offre === "Trio" ? "14,90€" : "9,90€"}/mois</span>
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
