import { useState, useEffect } from "react";

const SUPABASE_URL = "https://drtevlthwlzebjvustuf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydGV2bHRod2x6ZWJqdnVzdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTQ2ODMsImV4cCI6MjA5Njc3MDY4M30.T8DDBzoRqwHuVFuDyhSP0wgR1Dm29uKZDZkwBQFkqoc";
const ADMIN_CODE = "PEPIT-ADMIN-2026";
const STRIPE_PUBLIC_KEY = "pk_test_51TgmfpV05dZ94v14";
const STRIPE_PRICES = {
  Essentiel: "price_1TkDxcV05dZ94v14WofhUUQ4",
  Trio:      "price_1TkDybV05dZ94v1415MGp0Dh",
  Prestige:  "price_1TkDyvV05dZ94v14f6UexiT1",
};
const APP_URL = "https://pepit-app-indol.vercel.app";

const authHeaders = { "Content-Type": "application/json", "apikey": SUPABASE_KEY };
const dbHeaders   = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

async function signUp(email, password, nom, offre) {
  const res  = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.msg);
  if (data.user?.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/membres`, {
      method: "POST",
      headers: { ...dbHeaders, "Authorization": `Bearer ${data.access_token}` },
      body: JSON.stringify({ nom, email, offre, statut: "en_attente", economies: 0, nb_scans: 0, auth_id: data.user.id }),
    });
  }
  return data;
}

async function signIn(email, password) {
  const res  = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.error || data.error_description) throw new Error(data.error_description || data.error);
  return data;
}

async function resetPassword(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email }) });
  return res.ok;
}

async function getMembre(token, userId) {
  const res  = await fetch(`${SUPABASE_URL}/rest/v1/membres?auth_id=eq.${userId}&select=*`, { headers: { ...dbHeaders, "Authorization": `Bearer ${token}` } });
  const data = await res.json();
  return data[0] || null;
}

async function getPartenaires() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/partenaires?order=nom`, { headers: dbHeaders });
  return res.json();
}

async function getMembres() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/membres?order=created_at.desc`, { headers: dbHeaders });
  return res.json();
}

async function uploadLogo(file) {
  const ext      = file.name.split(".").pop();
  const fileName = `logo_${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/Logos/${fileName}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Erreur upload logo");
  return `${SUPABASE_URL}/storage/v1/object/public/Logos/${fileName}`;
}

async function addPartenaire(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/partenaires`, { method: "POST", headers: { ...dbHeaders, "Prefer": "return=representation" }, body: JSON.stringify(data) });
  return res.json();
}

async function updatePartenaire(id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/partenaires?id=eq.${id}`, { method: "PATCH", headers: dbHeaders, body: JSON.stringify(data) });
}

async function deletePartenaire(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/partenaires?id=eq.${id}`, { method: "DELETE", headers: dbHeaders });
}

async function addMembreAdmin(data) {
  await fetch(`${SUPABASE_URL}/rest/v1/membres`, { method: "POST", headers: { ...dbHeaders, "Prefer": "return=representation" }, body: JSON.stringify(data) });
}

async function updateMembre(id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/membres?id=eq.${id}`, { method: "PATCH", headers: dbHeaders, body: JSON.stringify(data) });
}

async function deleteMembre(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/membres?id=eq.${id}`, { method: "DELETE", headers: dbHeaders });
}

async function verifyMembre(code) {
  const res  = await fetch(`${SUPABASE_URL}/rest/v1/membres?id=eq.${code}&select=*`, { headers: dbHeaders });
  const data = await res.json();
  return data[0] || null;
}

async function redirectToStripeCheckout(offre, email) {
  if (!window.Stripe) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  const stripe     = window.Stripe(STRIPE_PUBLIC_KEY);
  const priceId    = STRIPE_PRICES[offre];
  const successUrl = `${APP_URL}?paiement=succes&offre=${offre}`;
  const cancelUrl  = `${APP_URL}?paiement=annule`;
  const { error }  = await stripe.redirectToCheckout({ lineItems: [{ price: priceId, quantity: 1 }], mode: "subscription", successUrl, cancelUrl, customerEmail: email });
  if (error) throw new Error(error.message);
}

const GOLD  = "#BA7517";
const DARK  = "#1B4172";
const DARK2 = "#13315C";

const styles = {
  app:          { fontFamily: "sans-serif", maxWidth: 400, margin: "0 auto", minHeight: "100vh", background: "#f9f9f9" },
  header:       { background: DARK, color: "white", padding: "16px", textAlign: "center" },
  headerSub:    { fontSize: 12, color: "rgba(186,117,23,0.7)", marginTop: 2 },
  content:      { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  card:         { background: "white", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 },
  input:        { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select:       { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "white" },
  btnPrimary:   { background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 1 },
  btnSecondary: { background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14 },
  btnSmall:     { background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnDanger:    { background: "#f8d7da", color: "#721c24", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 },
  btnGift:      { background: "#FFF8E7", color: "#856404", border: "1px solid #BA7517", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  bottomNav:    { display: "flex", borderTop: "1px solid #eee", background: "white", position: "sticky", bottom: 0 },
  navBtn:       { flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  navBtnActive: { flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 10, color: GOLD, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  badge:        { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  memberCard:   { background: `linear-gradient(135deg, ${DARK2}, #2a2a2a)`, borderRadius: 16, padding: 20, color: "white", border: `1px solid ${GOLD}33` },
  tag:          { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, background: "#f0f0f0", color: "#666", cursor: "pointer" },
  tagActive:    { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, background: DARK, color: GOLD, cursor: "pointer", border: `1px solid ${GOLD}` },
};

export default function App() {
  const [screen,    setScreen]    = useState("login");
  const [tab,       setTab]       = useState("home");
  const [adminTab,  setAdminTab]  = useState("partenaires");
  const [user,      setUser]      = useState(null);
  const [token,     setToken]     = useState(null);
  const [partenaires,  setPartenaires]  = useState([]);
  const [membres,      setMembres]      = useState([]);
  const [filter,       setFilter]       = useState("Tous");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [selectedPart, setSelectedPart] = useState(null);

  const [email,       setEmail]       = useState("");
  const [pass,        setPass]        = useState("");
  const [loginType,   setLoginType]   = useState("client");
  const [signupNom,   setSignupNom]   = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass,  setSignupPass]  = useState("");
  const [signupOffre, setSignupOffre] = useState("Essentiel");
  const [resetEmail,  setResetEmail]  = useState("");
  const [manualCode,  setManualCode]  = useState("");
  const [scanResult,  setScanResult]  = useState(null);

  // Partenaire form
  const [showPartForm,  setShowPartForm]  = useState(false);
  const [editPart,      setEditPart]      = useState(null);
  const [partNom,       setPartNom]       = useState("");
  const [partCat,       setPartCat]       = useState("Mode");
  const [partDept,      setPartDept]      = useState("Guadeloupe");
  const [partRemise,    setPartRemise]    = useState("");
  const [partAdresse,   setPartAdresse]   = useState("");
  const [partLogoUrl,   setPartLogoUrl]   = useState("");
  const [partLogoFile,  setPartLogoFile]  = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMode,      setLogoMode]      = useState("url"); // "url" ou "upload"

  // Membre form
  const [showMembreForm, setShowMembreForm] = useState(false);
  const [membreNom,      setMembreNom]      = useState("");
  const [membreEmail,    setMembreEmail]    = useState("");
  const [membreOffre,    setMembreOffre]    = useState("Essentiel");

  // Abonnement cadeau
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [giftMembre,   setGiftMembre]   = useState(null);
  const [giftOffre,    setGiftOffre]    = useState("Essentiel");
  const [giftDuree,    setGiftDuree]    = useState("1");

  const categories       = ["Tous", "Mode", "Restaurant", "Bien-être", "Sport"];
  const filteredPartners = filter === "Tous"
    ? partenaires.filter(p => p.actif)
    : partenaires.filter(p => p.actif && p.categorie === filter);

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const paiement = params.get("paiement");
    const offre    = params.get("offre");
    if (paiement === "succes" && offre) {
      setSuccess(`✅ Paiement réussi ! Votre offre ${offre} est active. Connectez-vous.`);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paiement === "annule") {
      setError("❌ Paiement annulé. Vous pouvez réessayer.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (screen === "main")  loadPartenaires();
    if (screen === "admin") { loadPartenaires(); loadMembres(); }
  }, [screen]);

  async function loadPartenaires() { try { setPartenaires(await getPartenaires()); } catch (e) {} }
  async function loadMembres()     { try { setMembres(await getMembres()); }         catch (e) {} }

  async function doLogin() {
    setError(""); setLoading(true);
    if (email.trim() === ADMIN_CODE) { setScreen("admin"); setLoading(false); return; }
    try {
      const data   = await signIn(email.trim().toLowerCase(), pass);
      const membre = await getMembre(data.access_token, data.user.id);
      setToken(data.access_token); setUser(membre);
      setScreen("main"); setTab("home");
    } catch (e) { setError("Email ou mot de passe incorrect"); }
    setLoading(false);
  }

  async function doSignup() {
    setError(""); setLoading(true);
    try {
      await signUp(signupEmail.trim().toLowerCase(), signupPass, signupNom, signupOffre);
      await redirectToStripeCheckout(signupOffre, signupEmail.trim().toLowerCase());
    } catch (e) { setError("Erreur : " + e.message); setLoading(false); }
  }

  async function doReset() {
    setError(""); setLoading(true);
    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      setSuccess("Email de réinitialisation envoyé !"); setScreen("login");
    } catch (e) { setError("Erreur lors de l'envoi"); }
    setLoading(false);
  }

  async function doVerify() {
    const m = await verifyMembre(manualCode.trim());
    setScanResult(m || { error: true });
  }

  function doLogout() {
    setUser(null); setToken(null); setScreen("login");
    setScanResult(null); setEmail(""); setPass(""); setSuccess("");
  }

  function getDiscount(offre) {
    if (offre === "Prestige") return "-15%";
    if (offre === "Trio")     return "-10%";
    return "-8%";
  }

  // ── Partenaires ──────────────────────────────────────────────────────────
  function resetPartForm() {
    setEditPart(null); setPartNom(""); setPartCat("Mode"); setPartDept("Guadeloupe");
    setPartRemise(""); setPartAdresse(""); setPartLogoUrl(""); setPartLogoFile(null);
    setLogoPreview(null); setLogoMode("url");
  }

  function openAddPart()   { resetPartForm(); setShowPartForm(true); }
  function openEditPart(p) {
    setEditPart(p); setPartNom(p.nom); setPartCat(p.categorie); setPartDept(p.departement);
    setPartRemise(p.remise); setPartAdresse(p.adresse || ""); setPartLogoUrl(p.logo_url || "");
    setPartLogoFile(null); setLogoPreview(p.logo_url || null); setLogoMode(p.logo_url ? "url" : "url");
    setShowPartForm(true);
  }

  function handleLogoFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPartLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function savePart() {
    setUploadingLogo(true);
    let finalLogoUrl = partLogoUrl;
    try {
      if (logoMode === "upload" && partLogoFile) {
        finalLogoUrl = await uploadLogo(partLogoFile);
      }
      const data = { nom: partNom, categorie: partCat, departement: partDept, remise: partRemise, adresse: partAdresse, logo_url: finalLogoUrl, actif: true };
      if (editPart) { await updatePartenaire(editPart.id, data); } else { await addPartenaire(data); }
      setShowPartForm(false); resetPartForm(); loadPartenaires();
    } catch (e) { alert("Erreur : " + e.message); }
    setUploadingLogo(false);
  }

  async function removePart(id) {
    if (window.confirm("Supprimer ce partenaire ?")) { await deletePartenaire(id); loadPartenaires(); }
  }

  // ── Membres ──────────────────────────────────────────────────────────────
  async function saveMembreAdmin() {
    await addMembreAdmin({ nom: membreNom, email: membreEmail, offre: membreOffre, statut: "actif", economies: 0, nb_scans: 0 });
    setShowMembreForm(false); setMembreNom(""); setMembreEmail(""); setMembreOffre("Essentiel");
    loadMembres();
  }

  async function removeMembre(id) {
    if (window.confirm("Supprimer ce membre ?")) { await deleteMembre(id); loadMembres(); }
  }

  async function offrirAbonnement() {
    const dateExpiration = new Date();
    dateExpiration.setMonth(dateExpiration.getMonth() + parseInt(giftDuree));
    await updateMembre(giftMembre.id, { offre: giftOffre, statut: "actif", abonnement_offert: true, expiration_cadeau: dateExpiration.toISOString() });
    setShowGiftForm(false); setGiftMembre(null); loadMembres();
    alert(`✅ Abonnement ${giftOffre} offert pour ${giftDuree} mois à ${giftMembre.nom} !`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // ÉCRANS
  // ════════════════════════════════════════════════════════════════════════

  // LOGIN
  if (screen === "login") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "40px 24px 32px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 120, height: "auto", marginBottom: 8 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 6, letterSpacing: 1 }}>VOS AVANTAGES EN GUADELOUPE<br />MARTINIQUE & GUYANE</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, background: "#f0f0f0", borderRadius: 8, padding: 4 }}>
          <button onClick={() => setLoginType("client")}   style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: loginType === "client"   ? DARK : "none", color: loginType === "client"   ? GOLD : "#666", fontWeight: loginType === "client"   ? 700 : 400 }}>Membre</button>
          <button onClick={() => setLoginType("merchant")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, background: loginType === "merchant" ? DARK : "none", color: loginType === "merchant" ? GOLD : "#666", fontWeight: loginType === "merchant" ? 700 : 400 }}>Partenaire</button>
        </div>
        {success && <div style={{ background: "#d4edda", color: "#155724", padding: 10, borderRadius: 8, fontSize: 13, textAlign: "center" }}>{success}</div>}
        <input style={styles.input} type="email"    placeholder="Email"        value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={pass}  onChange={e => setPass(e.target.value)} />
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doLogin} disabled={loading}>{loading ? "Connexion..." : "SE CONNECTER"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>
          <span onClick={() => { setScreen("reset"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Mot de passe oublié ?</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Pas encore membre ? <span onClick={() => { setScreen("signup"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>S'inscrire</span></div>
      </div>
    </div>
  );

  // MOT DE PASSE OUBLIÉ
  if (screen === "reset") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "32px 24px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: GOLD }}>PEPIT'</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>Mot de passe oublié</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, color: "#666", textAlign: "center" }}>Entrez votre email pour recevoir un lien de réinitialisation</div>
        <input style={styles.input} type="email" placeholder="Votre email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doReset} disabled={loading}>{loading ? "Envoi..." : "ENVOYER LE LIEN"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}><span onClick={() => { setScreen("login"); setError(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Retour</span></div>
      </div>
    </div>
  );

  // INSCRIPTION
  if (screen === "signup") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "24px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: GOLD }}>PEPIT'</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>Créer mon compte</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={styles.input} placeholder="Prénom et nom"                          value={signupNom}   onChange={e => setSignupNom(e.target.value)} />
        <input style={styles.input} type="email"    placeholder="Email"                  value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe (min. 6 caractères)" value={signupPass} onChange={e => setSignupPass(e.target.value)} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Choisissez votre offre</div>
        {[["Essentiel", "9,90€/mois", "1 département"], ["Trio", "14,90€/mois", "3 départements"], ["Prestige", "24,90€/mois", "3 dép. + goodies + événements"]].map(([offre, prix, desc]) => (
          <div key={offre} onClick={() => setSignupOffre(offre)} style={{ background: signupOffre === offre ? DARK : "white", border: `2px solid ${signupOffre === offre ? GOLD : "#eee"}`, borderRadius: 12, padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: signupOffre === offre ? GOLD : "#333" }}>{offre}</div>
              <div style={{ fontSize: 12, color: signupOffre === offre ? "#aaa" : "#888", marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: signupOffre === offre ? GOLD : "#333" }}>{prix}</div>
          </div>
        ))}
        <div style={{ background: "#f0f7ff", border: "1px solid #cce3ff", borderRadius: 8, padding: 10, fontSize: 12, color: "#2c5f9e", textAlign: "center" }}>
          🔒 Paiement sécurisé par <strong>Stripe</strong>. Vous serez redirigé(e) après la création de votre compte.
        </div>
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doSignup} disabled={loading}>{loading ? "Redirection vers le paiement..." : "CONTINUER VERS LE PAIEMENT →"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Déjà membre ? <span onClick={() => { setScreen("login"); setError(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Se connecter</span></div>
      </div>
    </div>
  );

  // ADMIN
  if (screen === "admin") return (
    <div style={{ ...styles.app, maxWidth: 600 }}>
      <div style={{ background: DARK2, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 3, color: GOLD }}>PEPIT' Admin</div>
        <button onClick={doLogout} style={{ background: "none", border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Déconnexion</button>
      </div>
      <div style={{ display: "flex", background: DARK, borderBottom: `1px solid ${GOLD}22` }}>
        {[["partenaires", "🏪 Partenaires"], ["membres", "👥 Membres"]].map(([t, label]) => (
          <button key={t} onClick={() => setAdminTab(t)} style={{ flex: 1, padding: "12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: adminTab === t ? GOLD : "#aaa", fontWeight: adminTab === t ? 700 : 400, borderBottom: adminTab === t ? `2px solid ${GOLD}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      {/* ── PARTENAIRES ── */}
      {adminTab === "partenaires" && (
        <div style={styles.content}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{partenaires.length} partenaire(s)</div>
            <button onClick={openAddPart} style={styles.btnSmall}>+ Ajouter</button>
          </div>

          {showPartForm && (
            <div style={{ background: "white", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>{editPart ? "Modifier le partenaire" : "Nouveau partenaire"}</div>

              <input style={styles.input} placeholder="Nom de l'enseigne" value={partNom} onChange={e => setPartNom(e.target.value)} />

              <select style={styles.select} value={partCat} onChange={e => setPartCat(e.target.value)}>
                {["Mode", "Restaurant", "Bien-être", "Sport", "Shopping", "Loisirs"].map(c => <option key={c}>{c}</option>)}
              </select>

              <select style={styles.select} value={partDept} onChange={e => setPartDept(e.target.value)}>
                {["Guadeloupe", "Martinique", "Guyane"].map(d => <option key={d}>{d}</option>)}
              </select>

              <input style={styles.input} placeholder="Adresse (ex: 12 rue de la Victoire, Pointe-à-Pitre)" value={partAdresse} onChange={e => setPartAdresse(e.target.value)} />

              <input style={styles.input} placeholder="Remise (ex: -10%, Soin offert...)" value={partRemise} onChange={e => setPartRemise(e.target.value)} />

              {/* Logo */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Logo du partenaire</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setLogoMode("url")}    style={{ flex: 1, padding: "7px", border: `1px solid ${logoMode === "url"    ? GOLD : "#ddd"}`, borderRadius: 6, cursor: "pointer", fontSize: 12, background: logoMode === "url"    ? "#FFF8E7" : "white", color: logoMode === "url"    ? "#856404" : "#666", fontWeight: logoMode === "url"    ? 600 : 400 }}>🔗 URL</button>
                <button onClick={() => setLogoMode("upload")} style={{ flex: 1, padding: "7px", border: `1px solid ${logoMode === "upload" ? GOLD : "#ddd"}`, borderRadius: 6, cursor: "pointer", fontSize: 12, background: logoMode === "upload" ? "#FFF8E7" : "white", color: logoMode === "upload" ? "#856404" : "#666", fontWeight: logoMode === "upload" ? 600 : 400 }}>📁 Upload</button>
              </div>

              {logoMode === "url" && (
                <input style={styles.input} placeholder="https://... (URL du logo)" value={partLogoUrl} onChange={e => { setPartLogoUrl(e.target.value); setLogoPreview(e.target.value); }} />
              )}
              {logoMode === "upload" && (
                <input type="file" accept="image/*" onChange={handleLogoFileChange} style={{ fontSize: 13, padding: 4 }} />
              )}

              {/* Aperçu logo */}
              {logoPreview && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f9f9f9", borderRadius: 8, padding: 10 }}>
                  <img src={logoPreview} alt="Aperçu" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, border: "1px solid #eee", background: "white" }} onError={e => e.target.style.display = "none"} />
                  <div style={{ fontSize: 12, color: "#888" }}>Aperçu du logo</div>
                  <button onClick={() => { setLogoPreview(null); setPartLogoUrl(""); setPartLogoFile(null); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#aaa" }}>✕</button>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={savePart} disabled={uploadingLogo} style={{ ...styles.btnSmall, flex: 1, padding: "10px" }}>{uploadingLogo ? "Upload..." : "💾 Enregistrer"}</button>
                <button onClick={() => { setShowPartForm(false); resetPartForm(); }} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
              </div>
            </div>
          )}

          {partenaires.map(p => (
            <div key={p.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              {/* Logo miniature */}
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.nom} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: "1px solid #eee", background: "white", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏪</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {p.departement} · {p.categorie}</div>
                {p.adresse && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>🗺 {p.adresse}</div>}
                <div style={{ fontSize: 12, color: GOLD, marginTop: 2 }}>{p.remise}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEditPart(p)} style={styles.btnSmall}>✏️</button>
                <button onClick={() => removePart(p.id)} style={styles.btnDanger}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MEMBRES ── */}
      {adminTab === "membres" && (
        <div style={styles.content}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{membres.length} membre(s)</div>
            <button onClick={() => setShowMembreForm(!showMembreForm)} style={styles.btnSmall}>+ Ajouter</button>
          </div>
          {showMembreForm && (
            <div style={{ background: "white", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>Nouveau membre</div>
              <input style={styles.input} placeholder="Prénom et nom" value={membreNom}   onChange={e => setMembreNom(e.target.value)} />
              <input style={styles.input} type="email" placeholder="Email" value={membreEmail} onChange={e => setMembreEmail(e.target.value)} />
              <select style={styles.select} value={membreOffre} onChange={e => setMembreOffre(e.target.value)}>
                {["Essentiel", "Trio", "Prestige"].map(o => <option key={o}>{o}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveMembreAdmin}              style={{ ...styles.btnSmall,    flex: 1, padding: "10px" }}>💾 Enregistrer</button>
                <button onClick={() => setShowMembreForm(false)} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
              </div>
            </div>
          )}
          {showGiftForm && giftMembre && (
            <div style={{ background: "#FFF8E7", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#856404" }}>🎁 Abonnement offert à {giftMembre.nom}</div>
              <select style={styles.select} value={giftOffre} onChange={e => setGiftOffre(e.target.value)}>
                {["Essentiel", "Trio", "Prestige"].map(o => <option key={o}>{o}</option>)}
              </select>
              <select style={styles.select} value={giftDuree} onChange={e => setGiftDuree(e.target.value)}>
                <option value="1">1 mois</option><option value="2">2 mois</option>
                <option value="3">3 mois</option><option value="6">6 mois</option>
                <option value="12">12 mois</option>
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={offrirAbonnement} style={{ ...styles.btnGift, flex: 1, padding: "10px" }}>🎁 Offrir</button>
                <button onClick={() => { setShowGiftForm(false); setGiftMembre(null); }} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
              </div>
            </div>
          )}
          {membres.map(m => (
            <div key={m.id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.nom}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{m.email}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{m.offre}</span>
                    <span style={{ ...styles.badge, background: m.statut === "actif" ? "#d4edda" : m.statut === "en_attente" ? "#fff3cd" : "#f8d7da", color: m.statut === "actif" ? "#155724" : m.statut === "en_attente" ? "#856404" : "#721c24" }}>
                      {m.statut === "en_attente" ? "⏳ En attente paiement" : m.statut}
                    </span>
                    {m.abonnement_offert && <span style={{ ...styles.badge, background: "#FFF8E7", color: "#856404" }}>🎁 Offert</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#aaa" }}>Économies</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GOLD }}>{m.economies}€</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button onClick={() => { setGiftMembre(m); setShowGiftForm(true); setShowMembreForm(false); }} style={styles.btnGift}>🎁 Offrir abo</button>
                <button onClick={() => removeMembre(m.id)} style={styles.btnDanger}>🗑️ Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // PARTENAIRE (merchant)
  if (screen === "merchant") return (
    <div style={styles.app}>
      <div style={styles.header}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
        <div style={styles.headerSub}>Espace partenaire</div>
      </div>
      <div style={styles.content}>
        <div style={{ ...styles.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Vérifier un membre</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Entrez le numéro du membre</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...styles.input, flex: 1 }} placeholder="Numéro membre" value={manualCode} onChange={e => setManualCode(e.target.value)} />
          <button onClick={doVerify} style={{ background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Vérifier</button>
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

  // ── FICHE DÉTAIL PARTENAIRE ──────────────────────────────────────────────
  if (selectedPart) return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${GOLD}44` }}>
        <button onClick={() => setSelectedPart(null)} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>Détail partenaire</div>
      </div>
      <div style={styles.content}>
        {/* Logo grand format */}
        <div style={{ background: "white", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px solid #eee" }}>
          {selectedPart.logo_url ? (
            <img src={selectedPart.logo_url} alt={selectedPart.nom} style={{ width: 100, height: 100, objectFit: "contain", borderRadius: 12 }} />
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: 12, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>🏪</div>
          )}
          <div style={{ fontSize: 20, fontWeight: 700, textAlign: "center" }}>{selectedPart.nom}</div>
          <span style={{ ...styles.badge, background: "#f0f0f0", color: "#666" }}>{selectedPart.categorie}</span>
        </div>

        <div style={styles.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>DÉPARTEMENT</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>📍 {selectedPart.departement}</div>
            </div>
            {selectedPart.adresse && (
              <div>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>ADRESSE</div>
                <div style={{ fontSize: 14 }}>🗺 {selectedPart.adresse}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>VOTRE AVANTAGE</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>{selectedPart.remise}</div>
            </div>
          </div>
        </div>

        <div style={{ background: DARK, borderRadius: 12, padding: 16, textAlign: "center", border: `1px solid ${GOLD}33` }}>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Remise avec votre carte PEPIT'</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: GOLD }}>{selectedPart.remise}</div>
        </div>
      </div>
    </div>
  );

  // ── APP MEMBRE ────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      {tab === "home" && <>
        <div style={styles.header}>
          <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
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
              <div style={{ background: GOLD, borderRadius: 8, padding: "8px 12px", fontSize: 10, color: DARK, fontWeight: 800 }}>N°</div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa" }}>N° membre</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{user?.id?.slice(0, 8).toUpperCase()}</div>
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
          <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
          <div style={styles.headerSub}>Partenaires</div>
        </div>
        <div style={styles.content}>
          <input style={styles.input} placeholder="Rechercher un partenaire..." />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => <span key={c} style={filter === c ? styles.tagActive : styles.tag} onClick={() => setFilter(c)}>{c}</span>)}
          </div>
          {filteredPartners.length === 0 && <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: 20 }}>Chargement...</div>}
          {filteredPartners.map(p => (
            <div key={p.id} onClick={() => setSelectedPart(p)} style={{ ...styles.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              {/* Logo miniature */}
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.nom} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: "1px solid #eee", background: "white", flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏪</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {p.departement} · {p.categorie}</div>
                {p.adresse && <div style={{ fontSize: 11, color: "#aaa", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🗺 {p.adresse}</div>}
                <div style={{ marginTop: 4 }}><span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{p.remise}</span></div>
              </div>
              <span style={{ color: "#ccc", fontSize: 20, flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      </>}

      {tab === "account" && <>
        <div style={styles.header}>
          <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
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
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Changer d'offre</div>
              {[["Essentiel", "9,90€/mois", "1 département"], ["Trio", "14,90€/mois", "3 départements"], ["Prestige", "24,90€/mois", "3 dép. + goodies + événements"]].map(([offre, prix, desc]) => (
                <div key={offre} onClick={async () => {
                  if (offre === user?.offre) return;
                  if (window.confirm(`Changer votre offre pour ${offre} à ${prix} ?`)) {
                    await updateMembre(user.id, { offre });
                    setUser({ ...user, offre });
                  }
                }} style={{ background: user?.offre === offre ? DARK : "#f9f9f9", border: `2px solid ${user?.offre === offre ? GOLD : "#eee"}`, borderRadius: 10, padding: 12, cursor: user?.offre === offre ? "default" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: user?.offre === offre ? GOLD : "#333" }}>{offre} {user?.offre === offre ? "✓ Actuel" : ""}</div>
                    <div style={{ fontSize: 11, color: user?.offre === offre ? "#aaa" : "#888", marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: user?.offre === offre ? GOLD : "#333" }}>{prix}</div>
                </div>
              ))}
            </div>
          </div>
          {["Historique des utilisations", "Paramètres"].map(item => (
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
