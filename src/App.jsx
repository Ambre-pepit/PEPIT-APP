import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://drtevlthwlzebjvustuf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydGV2bHRod2x6ZWJqdnVzdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTQ2ODMsImV4cCI6MjA5Njc3MDY4M30.T8DDBzoRqwHuVFuDyhSP0wgR1Dm29uKZDZkwBQFkqoc";
const ADMIN_CODE = "PEPIT-ADMIN-2026";
const STRIPE_ENTREPRISE = {
  "Essentiel": "https://buy.stripe.com/test_aFa28u3zIgU8gZe8jH5c403",
  "Trio": "https://buy.stripe.com/test_cNi14qgmu7jygZe57v5c404",
  "Prestige": "https://buy.stripe.com/test_28EaF04DM1Ze5gwdE15c405"
};

function createEntrepriseCheckout(offre, email, nbSalaries) {
  return STRIPE_ENTREPRISE[offre] + "?prefilled_email=" + encodeURIComponent(email) + "&quantity=" + nbSalaries;
}

async function getEntreprises() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/entreprises?order=created_at.desc`, { headers: dbHeaders });
  return res.json();
}

async function getSalariesEntreprise(entrepriseId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/membres?entreprise_id=eq.${entrepriseId}&select=*`, { headers: dbHeaders });
  return res.json();
}

async function updateEntreprise(id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/entreprises?id=eq.${id}`, { method: "PATCH", headers: dbHeaders, body: JSON.stringify(data) });
}

async function addEntreprise(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/entreprises`, {
    method: "POST",
    headers: { ...dbHeaders, "Prefer": "return=representation" },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function inviterSalarie(entrepriseId, emailSalarie) {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  await fetch(`${SUPABASE_URL}/rest/v1/invitations`, {
    method: "POST",
    headers: { ...dbHeaders, "Prefer": "return=minimal" },
    body: JSON.stringify({ entreprise_id: entrepriseId, email_salarie: emailSalarie, code, statut: "en_attente" })
  });
  return code;
}

const STRIPE_LINKS = {
  "Essentiel": "https://buy.stripe.com/test_8x29AW6LU8nC9wMarP5c400",
  "Trio": "https://buy.stripe.com/test_fZu7sO5HQ33i24k0Rf5c401",
  "Prestige": "https://buy.stripe.com/test_bJe7sO7PY6fu4cs57v5c402"
};

function createCheckoutSession(offre, email) {
  return STRIPE_LINKS[offre] + "?prefilled_email=" + encodeURIComponent(email);
}


const authHeaders = { "Content-Type": "application/json", "apikey": SUPABASE_KEY };
const dbHeaders = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

async function signUp(email, password, nom, offre, dept = "Guadeloupe") {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.msg);
  // Utiliser la clé admin pour garantir l'insertion
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/membres`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({ nom, email, offre, departement: offre === "Essentiel" ? dept : "Tous", statut: "actif", economies: 0, nb_scans: 0 })
  });
  if (!insertRes.ok) {
    const err = await insertRes.text();
    console.error("Erreur insertion membre:", err);
  }
  return data;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (data.error || data.error_description) throw new Error(data.error_description || data.error);
  return data;
}

async function resetPassword(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email }) });
  return res.ok;
}

async function getMembre(token, email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/membres?email=eq.${email}&select=*`, { headers: { ...dbHeaders, "Authorization": `Bearer ${token}` } });
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

async function addPartenaire(data) {
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/partenaires`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=minimal" },
    body: JSON.stringify(data)
  });
  return res2.ok;
}

async function uploadLogo(file) {
  const fileName = 'logo_' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/logos/${fileName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'true'
    },
    body: file
  });
  if (!res.ok) throw new Error('Upload échoué');
  return `${SUPABASE_URL}/storage/v1/object/public/logos/${fileName}`;
}

async function addPartenaireOLD(data) {
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

async function verifyMembre(code, partenairesDept = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/membres?id=eq.${code}&select=*`, { headers: dbHeaders });
  const data = await res.json();
  if (!data[0]) return null;
  const membre = data[0];
  // Vérifier accès département pour offre Essentiel
  if (membre.offre === "Essentiel" && partenairesDept) {
    if (membre.departement !== partenairesDept) {
      return { ...membre, acces_refuse: true, raison: `Votre offre Essentiel est valable uniquement en ${membre.departement}` };
    }
  }
  return membre;
}

const GOLD = "#BA7517";
const DARK = "#1B4172";
const DARK2 = "#13315C";

const styles = {
  app: { fontFamily: "sans-serif", maxWidth: 400, margin: "0 auto", minHeight: "100vh", background: "#f9f9f9" },
  header: { background: DARK, color: "white", padding: "16px", textAlign: "center" },
  headerTitle: { fontSize: 26, fontWeight: 700, letterSpacing: 4, color: GOLD },
  headerSub: { fontSize: 12, color: "rgba(186,117,23,0.7)", marginTop: 2 },
  content: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "white", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "white" },
  btnPrimary: { background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 1 },
  btnSecondary: { background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "12px 20px", width: "100%", cursor: "pointer", fontSize: 14 },
  btnSmall: { background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnDanger: { background: "#f8d7da", color: "#721c24", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 },
  btnGift: { background: "#FFF8E7", color: "#856404", border: "1px solid #BA7517", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
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
  const [adminTab, setAdminTab] = useState("partenaires");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [partenaires, setPartenaires] = useState([]);
  const [membres, setMembres] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loginType, setLoginType] = useState("client");
  const [signupNom, setSignupNom] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupOffre, setSignupOffre] = useState("Essentiel");
  const [signupDept, setSignupDept] = useState("Guadeloupe");
  const [resetEmail, setResetEmail] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showParametres, setShowParametres] = useState(false);
  const [showApropos, setShowApropos] = useState(false);
  const [showEntreprise, setShowEntreprise] = useState(false);
  const [entreprises, setEntreprises] = useState([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [salariesEntreprise, setSalariesEntreprise] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [entrepriseNom2, setEntrepriseNom2] = useState("");
  const [entrepriseNbSalaries, setEntrepriseNbSalaries] = useState(7);
  const [entrepriseOffre, setEntrepriseOffre] = useState("Essentiel");
  const [entrepriseNom, setEntrepriseNom] = useState("");
  const [entrepriseEmail, setEntrepriseEmail] = useState("");
  const [entrepriseTel, setEntrepriseTel] = useState("");
  const [entrepriseSalaries, setEntrepriseSalaries] = useState("10-49");
  const [entrepriseMsg, setEntrepriseMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const qrRef = useRef(null);
  const scannerRef = useRef(null);

  // Partenaire form
  const [showPartForm, setShowPartForm] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [partNom, setPartNom] = useState("");
  const [partCat, setPartCat] = useState("Mode");
  const [partDept, setPartDept] = useState("Guadeloupe");
  const [partRemise, setPartRemise] = useState("");
  const [partAdresse, setPartAdresse] = useState("");
  const [partLogo, setPartLogo] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [partDepts, setPartDepts] = useState([]);
  const [partLogoFile, setPartLogoFile] = useState(null);

  // Membre form
  const [showMembreForm, setShowMembreForm] = useState(false);
  const [membreNom, setMembreNom] = useState("");
  const [membreEmail, setMembreEmail] = useState("");
  const [membreOffre, setMembreOffre] = useState("Essentiel");

  // Abonnement cadeau
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [giftMembre, setGiftMembre] = useState(null);
  const [giftOffre, setGiftOffre] = useState("Essentiel");
  const [giftDuree, setGiftDuree] = useState("1");

  const categories = ["Tous", "Mode", "Restaurant", "Bien-être", "Sport", "Culture", "Événements", "Autres"];
  const filteredPartners = filter === "Tous" ? partenaires.filter(p => p.actif) : partenaires.filter(p => p.actif && p.categorie === filter);

  useEffect(() => {
    if (screen === "main") loadPartenaires();
    if (screen === "admin") { loadPartenaires(); loadMembres(); }
  }, [screen]);

  async function loadPartenaires() { try { setPartenaires(await getPartenaires()); } catch (e) { } }
  async function loadMembres() { try { setMembres(await getMembres()); } catch (e) { } }

  async function doLogin() {
    setError(""); setLoading(true);
    if (email.trim() === ADMIN_CODE) { setScreen("admin"); setLoading(false); return; }
    try {
      const data = await signIn(email.trim().toLowerCase(), pass);
      if (loginType === "entreprise") {
        const emailLower = email.trim().toLowerCase();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/entreprises?email=eq.${emailLower}&select=*`, { headers: dbHeaders });
        const ents = await res.json();
        if (ents.length > 0) {
          setToken(data.access_token); setUser(ents[0]);
          setScreen("espace-entreprise");
        } else { setError("Compte entreprise non trouvé"); }
      } else if (loginType === "merchant") {
        const emailLower = email.trim().toLowerCase();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/partenaires?email=eq.${emailLower}&select=*`, { headers: dbHeaders });
        const parts = await res.json();
        if (parts.length > 0) {
          setToken(data.access_token); setUser(parts[0]);
          setAdminTab("dashboard"); setScreen("merchant");
        } else { setError("Compte partenaire non trouvé"); }
      } else {
        const membre = await getMembre(data.access_token, data.user.email);
        if (!membre) { setError("Compte introuvable. Contactez PEPIT'."); setLoading(false); return; }
        if (membre.statut === "résilié") { setError("Votre abonnement a été résilié. Pour vous réabonner, contactez-nous à admin.pepit@gmail.com"); setLoading(false); return; }
        setToken(data.access_token); setUser(membre);
        setScreen("main"); setTab("home");
      }
    } catch (e) { setError("Email ou mot de passe incorrect"); }
    setLoading(false);
  }

  async function doSignup() {
    setError(""); setLoading(true);
    try {
      await signUp(signupEmail.trim().toLowerCase(), signupPass, signupNom, signupOffre, signupDept);
      const checkoutUrl = createCheckoutSession(signupOffre, signupEmail.trim().toLowerCase());
      setSignupPass(checkoutUrl);
      setScreen("confirm-email");
    } catch (e) { setError("Erreur : " + e.message); }
    setLoading(false);
  }

  async function doReset() {
    setError(""); setLoading(true);
    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      setSuccess("Email de réinitialisation envoyé !"); setScreen("login");
    } catch (e) { setError("Erreur lors de l'envoi"); }
    setLoading(false);
  }


  async function startScanner() {
    setScanning(true);
    setScanResult(null);
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await scanner.stop();
            setScanning(false);
            const dept = user?.departements?.[0] || user?.departement || null;
            const m = await verifyMembre(decodedText, dept);
            setScanResult(m || { error: true });
          },
          () => {}
        );
      } catch (e) {
        console.error("Scanner error:", e);
        setScanning(false);
      }
    }, 300);
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch(e) {}
    }
    setScanning(false);
  }
  async function doVerify() {
    const dept = user?.departements?.[0] || user?.departement || null;
    const m = await verifyMembre(manualCode.trim(), dept);
    setScanResult(m || { error: true });
  }

  function doLogout() {
    setUser(null); setToken(null); setScreen("login");
    setScanResult(null); setEmail(""); setPass(""); setSuccess("");
  }

  function getDiscount(offre) {
    if (offre === "Prestige") return "-15%";
    if (offre === "Trio") return "-10%";
    return "-8%";
  }

  // Partenaires
  function openAddPart() { setEditPart(null); setPartNom(""); setPartCat("Mode"); setPartDept("Guadeloupe"); setPartRemise(""); setPartAdresse(""); setPartLogo(""); setPartLogoFile(null); setPartDescription(""); setPartDepts([]); setShowPartForm(true); }
  function openEditPart(p) { setEditPart(p); setPartNom(p.nom); setPartCat(p.categorie); setPartDept(p.departement); setPartRemise(p.remise); setPartAdresse(p.adresse || ""); setPartLogo(p.logo_url || ""); setPartLogoFile(null); setPartDescription(p.description || ""); setPartDepts(p.departements || []); setShowPartForm(true); }
  async function savePart() {
    let logoUrl = partLogo;
    if (partLogoFile) {
      try { logoUrl = await uploadLogo(partLogoFile); } catch(e) { alert("Erreur upload logo"); return; }
    }
    const data = { nom: partNom, categorie: partCat, departements: partDepts, remise: partRemise, adresse: partAdresse, logo_url: logoUrl, description: partDescription, actif: true };
    if (editPart) { await updatePartenaire(editPart.id, data); } else { await addPartenaire(data); }
    setShowPartForm(false); loadPartenaires();
  }
  async function removePart(id) { if (window.confirm("Supprimer ce partenaire ?")) { await deletePartenaire(id); loadPartenaires(); } }

  // Membres
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

  // CONFIRMATION EMAIL
  if (screen === "confirm-email") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "40px 24px 32px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 100, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>📧</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: DARK }}>Compte créé !</div>
        <div style={{ background: "#d4edda", borderRadius: 12, padding: 16, fontSize: 13, color: "#155724", lineHeight: 1.6 }}>
          Un email de confirmation a été envoyé à <strong>{signupEmail}</strong>.<br /><br />
          📌 Pensez à vérifier vos <strong>spams</strong> si vous ne le voyez pas.
        </div>
        <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
          Cliquez sur le bouton ci-dessous pour finaliser votre inscription en procédant au paiement.
        </div>
        <button style={styles.btnPrimary} onClick={() => { window.location.href = signupPass; }}>
          💳 PROCÉDER AU PAIEMENT
        </button>
        <div style={{ fontSize: 12, color: "#aaa" }}>
          Vous pourrez vous connecter après avoir confirmé votre email et effectué le paiement.
        </div>
      </div>
    </div>
  );

  // ENTREPRISE
  if (screen === "entreprise") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "32px 24px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 90, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 8 }}>Offre Entreprise — À partir de 7 salariés</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "#EEF2FF", borderRadius: 12, padding: 14, fontSize: 13, color: "#1B4172", lineHeight: 1.6, border: "1px solid #1B417233" }}>
          🏢 <strong>Offre spéciale entreprise</strong><br />
          À partir de 7 salariés : <strong>dès 7,90€/personne/mois</strong><br />
          Offrez à vos salariés les avantages d'un grand groupe !
        </div>

        <input style={styles.input} placeholder="Nom de l'entreprise" value={entrepriseNom} onChange={e => setEntrepriseNom(e.target.value)} />
        <input style={styles.input} type="email" placeholder="Email du dirigeant / RH" value={entrepriseEmail} onChange={e => setEntrepriseEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Créer un mot de passe (min. 6 caractères)" value={signupPass} onChange={e => setSignupPass(e.target.value)} />
        <input style={styles.input} type="tel" placeholder="Téléphone" value={entrepriseTel} onChange={e => setEntrepriseTel(e.target.value)} />

        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Nombre de salariés : <strong>{entrepriseNbSalaries}</strong></div>
          <input type="range" min="7" max="100" value={entrepriseNbSalaries} onChange={e => setEntrepriseNbSalaries(parseInt(e.target.value))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa" }}><span>7</span><span>100+</span></div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 4 }}>Choisissez l'offre pour vos salariés</div>
        {[
          ["Essentiel", entrepriseNbSalaries <= 49 ? "7,90€" : "6,90€", "1 département par salarié"],
          ["Trio", entrepriseNbSalaries <= 49 ? "12,90€" : "11,90€", "3 départements par salarié"],
          ["Prestige", entrepriseNbSalaries <= 49 ? "19,90€" : "18,90€", "Premium + offres flash"]
        ].map(([offre, prix, desc]) => (
          <div key={offre} onClick={() => setEntrepriseOffre(offre)} style={{ background: entrepriseOffre === offre ? DARK : "white", border: `2px solid ${entrepriseOffre === offre ? GOLD : "#eee"}`, borderRadius: 12, padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: entrepriseOffre === offre ? GOLD : "#333" }}>{offre}</div>
              <div style={{ fontSize: 11, color: entrepriseOffre === offre ? "#aaa" : "#888", marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: entrepriseOffre === offre ? GOLD : "#333" }}>{prix}/pers</div>
              <div style={{ fontSize: 11, color: entrepriseOffre === offre ? "#aaa" : "#888" }}>Total : {(parseFloat(prix) * entrepriseNbSalaries).toFixed(2).replace(".", ",")}€/mois</div>
            </div>
          </div>
        ))}

        <div style={{ background: "#f0f7ea", borderRadius: 10, padding: 12, fontSize: 12, color: "#27500A", lineHeight: 1.6 }}>
          💡 Les salariés pourront upgrader leur offre à leurs frais si souhaité.
        </div>

        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        {success && <div style={{ background: "#d4edda", color: "#155724", padding: 10, borderRadius: 8, fontSize: 13, textAlign: "center" }}>{success}</div>}

        <button style={styles.btnPrimary} onClick={async () => {
          if (!entrepriseNom || !entrepriseEmail || !signupPass) { setError("Veuillez remplir tous les champs obligatoires"); return; }
          if (signupPass.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères"); return; }
          if (entrepriseNbSalaries < 7) { setError("L'offre entreprise est disponible à partir de 7 salariés"); return; }
          setLoading(true); setError("");
          try {
            // Créer le compte d'authentification
            const authRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email: entrepriseEmail.trim().toLowerCase(), password: signupPass }) });
            const authData = await authRes.json();
            if (authData.error) { setError("Erreur : " + (authData.error.message || authData.msg)); setLoading(false); return; }
            // Créer la fiche entreprise
            await addEntreprise({ nom: entrepriseNom, email: entrepriseEmail.trim().toLowerCase(), telephone: entrepriseTel, nb_salaries: entrepriseNbSalaries, offre_base: entrepriseOffre, statut: "en_attente", valide: false });
            const url = createEntrepriseCheckout(entrepriseOffre, entrepriseEmail, entrepriseNbSalaries);
            setSuccess("✅ Compte créé ! Vérifiez votre email pour confirmer, puis vous serez redirigé vers le paiement...");
            setSignupPass(url);
            setTimeout(() => { setScreen("confirm-email-entreprise"); }, 2500);
          } catch(e) { setError("Erreur lors de l'inscription"); }
          setLoading(false);
        }} disabled={loading}>{loading ? "Traitement..." : "S'INSCRIRE ET PAYER"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>
          <span onClick={() => { setScreen("login"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Retour à la connexion</span>
        </div>
      </div>
    </div>
  );

  // CONFIRMATION EMAIL ENTREPRISE
  if (screen === "confirm-email-entreprise") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "40px 24px 32px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 100, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🏢</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: DARK }}>Compte entreprise créé !</div>
        <div style={{ background: "#d4edda", borderRadius: 12, padding: 16, fontSize: 13, color: "#155724", lineHeight: 1.6 }}>
          Un email de confirmation a été envoyé à <strong>{entrepriseEmail}</strong>.<br /><br />
          📌 Pensez à vérifier vos <strong>spams</strong> si vous ne le voyez pas.
        </div>
        <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
          Cliquez sur le bouton ci-dessous pour finaliser votre inscription en procédant au paiement.
        </div>
        <button style={styles.btnPrimary} onClick={() => { window.location.href = signupPass; }}>
          💳 PROCÉDER AU PAIEMENT
        </button>
        <div style={{ fontSize: 12, color: "#aaa" }}>
          Notre équipe validera votre compte sous 48h après confirmation.
        </div>
      </div>
    </div>
  );

  // LOGIN
  if (screen === "login") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "40px 24px 32px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 120, height: "auto", marginBottom: 8 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 6, letterSpacing: 1 }}>VOS AVANTAGES EN GUADELOUPE<br />MARTINIQUE & GUYANE</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: "#f0f0f0", borderRadius: 8, padding: 4 }}>
          <button onClick={() => setLoginType("client")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, background: loginType === "client" ? DARK : "none", color: loginType === "client" ? GOLD : "#666", fontWeight: loginType === "client" ? 700 : 400 }}>Membre</button>
          <button onClick={() => setLoginType("merchant")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, background: loginType === "merchant" ? DARK : "none", color: loginType === "merchant" ? GOLD : "#666", fontWeight: loginType === "merchant" ? 700 : 400 }}>Partenaire</button>
          <button onClick={() => setLoginType("entreprise")} style={{ flex: 1, padding: 8, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, background: loginType === "entreprise" ? DARK : "none", color: loginType === "entreprise" ? GOLD : "#666", fontWeight: loginType === "entreprise" ? 700 : 400 }}>Entreprise</button>
        </div>
        {success && <div style={{ background: "#d4edda", color: "#155724", padding: 10, borderRadius: 8, fontSize: 13, textAlign: "center" }}>{success}</div>}
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={pass} onChange={e => setPass(e.target.value)} />
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doLogin} disabled={loading}>{loading ? "Connexion..." : "SE CONNECTER"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>
          <span onClick={() => { setScreen("reset"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Mot de passe oublié ?</span>
        </div>
        {loginType === "client" && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Pas encore membre ? <span onClick={() => { setScreen("signup"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>S'inscrire</span></div>
        )}
        {loginType === "merchant" && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Pas encore partenaire ? <span onClick={() => { setScreen("signup-partner"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Inscription gratuite</span></div>
        )}
        {loginType === "entreprise" && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Pas encore inscrit ? <span onClick={() => { setScreen("entreprise"); setError(""); setSuccess(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Inscrire mon entreprise</span></div>
        )}
        <div style={{ background: "#f0f7ea", borderRadius: 10, padding: 12, textAlign: "center", cursor: "pointer", border: "1px solid #c3e6cb" }} onClick={() => { setScreen("entreprise"); setError(""); setSuccess(""); }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#27500A" }}>🏢 Vous êtes une entreprise ?</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Offre spéciale à partir de 7 salariés — 7,90€/pers/mois</div>
        </div>
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
        <input style={styles.input} placeholder="Prénom et nom" value={signupNom} onChange={e => setSignupNom(e.target.value)} />
        <input style={styles.input} type="email" placeholder="Email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
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
        {signupOffre === "Essentiel" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>Votre département</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Avec l'offre Essentiel vous avez accès aux réductions d'un seul département.</div>
            {["Guadeloupe", "Martinique", "Guyane"].map(d => (
              <div key={d} onClick={() => setSignupDept(d)} style={{ background: signupDept === d ? DARK : "white", border: `2px solid ${signupDept === d ? GOLD : "#eee"}`, borderRadius: 10, padding: 12, cursor: "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: signupDept === d ? GOLD : "#333" }}>{d}</span>
                {signupDept === d && <span style={{ color: GOLD }}>✓</span>}
              </div>
            ))}
          </div>
        )}
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={doSignup} disabled={loading}>{loading ? "Création..." : "CRÉER MON COMPTE ET PAYER"}</button>
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
        {[["partenaires", "🏪 Partenaires"], ["membres", "👥 Membres"], ["entreprises", "🏢 Entreprises"]].map(([t, label]) => (
          <button key={t} onClick={() => { setAdminTab(t); if(t==="entreprises") getEntreprises().then(setEntreprises); }} style={{ flex: 1, padding: "10px 4px", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: adminTab === t ? GOLD : "#aaa", fontWeight: adminTab === t ? 700 : 400, borderBottom: adminTab === t ? `2px solid ${GOLD}` : "2px solid transparent", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* PARTENAIRES */}
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
                {["Mode", "Restaurant", "Bien-être", "Sport", "Shopping", "Loisirs", "Culture", "Événements", "Autres"].map(c => <option key={c}>{c}</option>)}
              </select>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Départements (plusieurs possibles)</div>
                {["Guadeloupe", "Martinique", "Guyane"].map(d => (
                  <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={partDepts.includes(d)} onChange={e => {
                      if (e.target.checked) setPartDepts([...partDepts, d]);
                      else setPartDepts(partDepts.filter(x => x !== d));
                    }} />
                    {d}
                  </label>
                ))}
              </div>
              <input style={styles.input} placeholder="Remise (ex: -10%, Soin offert...)" value={partRemise} onChange={e => setPartRemise(e.target.value)} />
              <input style={styles.input} placeholder="Adresse (ex: 12 rue de la Paix, Pointe-à-Pitre)" value={partAdresse} onChange={e => setPartAdresse(e.target.value)} />
              <textarea style={{ ...styles.input, height: 80, resize: "vertical" }} placeholder="Description du partenaire..." value={partDescription} onChange={e => setPartDescription(e.target.value)} />
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Logo du partenaire</div>
                <input type="file" accept="image/*" onChange={e => { setPartLogoFile(e.target.files[0]); setPartLogo(""); }} style={{ fontSize: 12, width: "100%" }} />
                {partLogo && <img src={partLogo} alt="logo" style={{ width: 60, height: 60, objectFit: "contain", marginTop: 6, borderRadius: 6, border: "1px solid #eee" }} />}
                {partLogoFile && <div style={{ fontSize: 11, color: "#27500A", marginTop: 4 }}>✓ Image sélectionnée : {partLogoFile.name}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={savePart} style={{ ...styles.btnSmall, flex: 1, padding: "10px" }}>💾 Enregistrer</button>
                <button onClick={() => setShowPartForm(false)} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
              </div>
            </div>
          )}
          {partenaires.map(p => (
            <div key={p.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {p.adresse ? p.adresse + ", " : ""}{p.departement} · {p.categorie}</div>
                <div style={{ fontSize: 12, color: GOLD, marginTop: 2 }}>{p.remise}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                {!p.valide && <button onClick={async () => { await updatePartenaire(p.id, { valide: true, actif: true }); loadPartenaires(); }} style={{ ...styles.btnSmall, background: "#d4edda", color: "#155724", border: "none", fontSize: 11 }}>✅ Valider</button>}
                {p.valide && <span style={{ fontSize: 10, color: "#155724", fontWeight: 600 }}>✅ Validé</span>}
                <button onClick={() => openEditPart(p)} style={styles.btnSmall}>✏️</button>
                <button onClick={() => removePart(p.id)} style={styles.btnDanger}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MEMBRES */}
      {adminTab === "membres" && (
        <div style={styles.content}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{membres.length} membre(s)</div>
            <button onClick={() => setShowMembreForm(!showMembreForm)} style={styles.btnSmall}>+ Ajouter</button>
          </div>

          {/* Formulaire ajout membre */}
          {showMembreForm && (
            <div style={{ background: "white", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>Nouveau membre</div>
              <input style={styles.input} placeholder="Prénom et nom" value={membreNom} onChange={e => setMembreNom(e.target.value)} />
              <input style={styles.input} type="email" placeholder="Email" value={membreEmail} onChange={e => setMembreEmail(e.target.value)} />
              <select style={styles.select} value={membreOffre} onChange={e => setMembreOffre(e.target.value)}>
                {["Essentiel", "Trio", "Prestige"].map(o => <option key={o}>{o}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveMembreAdmin} style={{ ...styles.btnSmall, flex: 1, padding: "10px" }}>💾 Enregistrer</button>
                <button onClick={() => setShowMembreForm(false)} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
              </div>
            </div>
          )}

          {/* Formulaire abonnement cadeau */}
          {showGiftForm && giftMembre && (
            <div style={{ background: "#FFF8E7", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#856404" }}>🎁 Abonnement offert à {giftMembre.nom}</div>
              <select style={styles.select} value={giftOffre} onChange={e => setGiftOffre(e.target.value)}>
                {["Essentiel", "Trio", "Prestige"].map(o => <option key={o}>{o}</option>)}
              </select>
              <select style={styles.select} value={giftDuree} onChange={e => setGiftDuree(e.target.value)}>
                <option value="1">1 mois</option>
                <option value="2">2 mois</option>
                <option value="3">3 mois</option>
                <option value="6">6 mois</option>
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.nom}</div>
                    <span style={{ fontSize: 10, background: "#f0f0f0", color: "#666", padding: "2px 6px", borderRadius: 6, fontFamily: "monospace" }}>#{m.id?.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{m.email}</div>
                  {m.departement && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>📍 {m.departement}</div>}
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{m.offre}</span>
                    <span style={{ ...styles.badge, background: m.statut === "actif" ? "#d4edda" : "#f8d7da", color: m.statut === "actif" ? "#155724" : "#721c24" }}>{m.statut}</span>
                    {m.abonnement_offert && <span style={{ ...styles.badge, background: "#FFF8E7", color: "#856404" }}>🎁 Offert</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#aaa" }}>Économies</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GOLD }}>{m.economies}€</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Scans</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{m.nb_scans}</div>
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

      {/* ENTREPRISES */}
      {adminTab === "entreprises" && (
        <div style={styles.content}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{entreprises.length} entreprise(s)</div>

          {selectedEntreprise ? (
            <div>
              <button onClick={() => { setSelectedEntreprise(null); setSalariesEntreprise([]); }} style={{ ...styles.btnSecondary, fontSize: 12, padding: "6px 12px", width: "auto", marginBottom: 12 }}>‹ Retour</button>
              <div style={styles.card}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedEntreprise.nom}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{selectedEntreprise.email}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{selectedEntreprise.nb_salaries} salariés · {selectedEntreprise.offre_base}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <span style={{ ...styles.badge, background: selectedEntreprise.statut === "actif" ? "#d4edda" : "#f8d7da", color: selectedEntreprise.statut === "actif" ? "#155724" : "#721c24" }}>{selectedEntreprise.statut}</span>
                  {!selectedEntreprise.valide && <span style={{ ...styles.badge, background: "#FFF8E7", color: "#856404" }}>⏳ À valider</span>}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  {!selectedEntreprise.valide && <button onClick={async () => { await updateEntreprise(selectedEntreprise.id, { valide: true, statut: "actif" }); setSelectedEntreprise({...selectedEntreprise, valide: true, statut: "actif"}); }} style={styles.btnSmall}>✅ Valider</button>}
                  {selectedEntreprise.statut === "actif" ? (
                    <button onClick={async () => { await updateEntreprise(selectedEntreprise.id, { statut: "suspendu" }); setSelectedEntreprise({...selectedEntreprise, statut: "suspendu"}); }} style={styles.btnDanger}>⏸ Suspendre</button>
                  ) : (
                    <button onClick={async () => { await updateEntreprise(selectedEntreprise.id, { statut: "actif" }); setSelectedEntreprise({...selectedEntreprise, statut: "actif"}); }} style={styles.btnSmall}>▶ Réactiver</button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 8px" }}>👥 Salariés ({salariesEntreprise.length})</div>
              <button onClick={() => setShowInviteForm(true)} style={{ ...styles.btnSmall, marginBottom: 10 }}>+ Inviter un salarié</button>
              {showInviteForm && (
                <div style={{ background: "white", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <input style={{ ...styles.input, marginBottom: 8 }} placeholder="Email du salarié" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={async () => { const code = await inviterSalarie(selectedEntreprise.id, inviteEmail); alert(`Code d'accès : ${code}`); setInviteEmail(""); setShowInviteForm(false); }} style={{ ...styles.btnSmall, flex: 1, padding: "10px" }}>Envoyer</button>
                    <button onClick={() => setShowInviteForm(false)} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
                  </div>
                </div>
              )}
              {salariesEntreprise.map(s => (
                <div key={s.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.nom}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{s.email}</div>
                  </div>
                  <button onClick={async () => { const ns = s.statut === "actif" ? "suspendu" : "actif"; await updateMembre(s.id, { statut: ns }); setSalariesEntreprise(salariesEntreprise.map(x => x.id === s.id ? {...x, statut: ns} : x)); }} style={s.statut === "actif" ? styles.btnDanger : styles.btnSmall}>{s.statut === "actif" ? "Suspendre" : "Réactiver"}</button>
                </div>
              ))}
            </div>
          ) : (
            entreprises.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: 20 }}>Aucune entreprise inscrite</div>
            ) : (
              entreprises.map(e => (
                <div key={e.id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.nom}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{e.email}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{e.nb_salaries} salariés · {e.offre_base}</div>
                      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                        <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{e.offre_base}</span>
                        <span style={{ ...styles.badge, background: e.statut === "actif" ? "#d4edda" : "#f8d7da", color: e.statut === "actif" ? "#155724" : "#721c24" }}>{e.statut}</span>
                        {!e.valide && <span style={{ ...styles.badge, background: "#FFF8E7", color: "#856404" }}>⏳ À valider</span>}
                      </div>
                    </div>
                    <button onClick={async () => { setSelectedEntreprise(e); const s = await getSalariesEntreprise(e.id); setSalariesEntreprise(s); }} style={styles.btnSmall}>Voir →</button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );

  // INSCRIPTION PARTENAIRE
  if (screen === "signup-partner") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "24px", textAlign: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 80, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 8 }}>Espace Partenaire — Inscription gratuite</div>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={styles.input} placeholder="Nom de l'enseigne" value={signupNom} onChange={e => setSignupNom(e.target.value)} />
        <input style={styles.input} type="email" placeholder="Email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe (min. 6 caractères)" value={signupPass} onChange={e => setSignupPass(e.target.value)} />
        <select style={styles.input} value={signupOffre} onChange={e => setSignupOffre(e.target.value)}>
          {["Mode", "Restaurant", "Bien-être", "Sport", "Shopping", "Loisirs", "Culture", "Événements", "Autres"].map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ background: "#f0f7ea", borderRadius: 10, padding: 12, fontSize: 12, color: "#27500A" }}>
          ✅ L'inscription est <strong>gratuite</strong>. Votre fiche sera vérifiée avant publication.
        </div>
        {error && <div style={{ color: "#dc3545", fontSize: 13, textAlign: "center" }}>{error}</div>}
        <button style={styles.btnPrimary} onClick={async () => {
          setError(""); setLoading(true);
          try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: authHeaders, body: JSON.stringify({ email: signupEmail.trim().toLowerCase(), password: signupPass }) });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            await fetch(`${SUPABASE_URL}/rest/v1/partenaires`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({ nom: signupNom, email: signupEmail.trim().toLowerCase(), categorie: signupOffre, valide: false, actif: false })
            });
            setSuccess("Compte créé ! Votre fiche sera validée par notre équipe."); setScreen("login");
          } catch(e) { setError("Erreur : " + e.message); }
          setLoading(false);
        }} disabled={loading}>{loading ? "Création..." : "CRÉER MON COMPTE PARTENAIRE"}</button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Déjà partenaire ? <span onClick={() => { setScreen("login"); setLoginType("merchant"); setError(""); }} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Se connecter</span></div>
      </div>
    </div>
  );

  // ESPACE PARTENAIRE
  if (screen === "merchant") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
        <button onClick={doLogout} style={{ background: "none", border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Déconnexion</button>
      </div>

      {/* Tabs partenaire */}
      <div style={{ display: "flex", background: DARK, borderBottom: `1px solid ${GOLD}22` }}>
        {[["dashboard", "📊 Dashboard"], ["fiche", "📝 Ma fiche"], ["scanner", "📷 Scanner"]].map(([t, label]) => (
          <button key={t} onClick={() => setAdminTab(t)} style={{ flex: 1, padding: "10px 4px", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: adminTab === t ? GOLD : "#aaa", fontWeight: adminTab === t ? 700 : 400, borderBottom: adminTab === t ? `2px solid ${GOLD}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      {/* DASHBOARD */}
      {adminTab === "dashboard" && (
        <div style={styles.content}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Bienvenue {user?.nom} 👋</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: DARK, borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>{user?.nb_scans || 0}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Clients apportés</div>
            </div>
            <div style={{ background: DARK, borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>0</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Ce mois-ci</div>
            </div>
          </div>
          <div style={{ ...styles.card, background: user?.valide ? "#d4edda" : "#FFF8E7", border: `1px solid ${user?.valide ? "#c3e6cb" : GOLD}` }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: user?.valide ? "#155724" : "#856404" }}>
              {user?.valide ? "✅ Fiche validée — visible dans l'app" : "⏳ Fiche en attente de validation"}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {user?.valide ? "Votre enseigne est visible par tous les membres PEPIT'." : "Notre équipe vérifie votre inscription. Vous serez notifié par email."}
            </div>
          </div>
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 600 }}>Conseil PEPIT'</div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>Complétez votre fiche avec un logo et une description pour attirer plus de membres ! 🌟</div>
          </div>
        </div>
      )}

      {/* MA FICHE */}
      {adminTab === "fiche" && (
        <div style={styles.content}>
          <div style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>Modifier ma fiche partenaire</div>
          <input style={styles.input} placeholder="Nom de l'enseigne" value={partNom} onChange={e => setPartNom(e.target.value)} defaultValue={user?.nom} />
          <select style={styles.input} value={partCat} onChange={e => setPartCat(e.target.value)}>
            {["Mode", "Restaurant", "Bien-être", "Sport", "Shopping", "Loisirs", "Culture", "Événements", "Autres"].map(c => <option key={c}>{c}</option>)}
          </select>
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Départements</div>
            {["Guadeloupe", "Martinique", "Guyane"].map(d => (
              <label key={d} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={partDepts.includes(d)} onChange={e => {
                  if (e.target.checked) setPartDepts([...partDepts, d]);
                  else setPartDepts(partDepts.filter(x => x !== d));
                }} />{d}
              </label>
            ))}
          </div>
          <input style={styles.input} placeholder="Adresse" value={partAdresse} onChange={e => setPartAdresse(e.target.value)} />
          <textarea style={{ ...styles.input, height: 80, resize: "vertical" }} placeholder="Description de votre enseigne..." value={partDescription} onChange={e => setPartDescription(e.target.value)} />
          <input style={styles.input} placeholder="Remise proposée (ex: -10%, Café offert...)" value={partRemise} onChange={e => setPartRemise(e.target.value)} />
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Logo</div>
            <input type="file" accept="image/*" onChange={e => setPartLogoFile(e.target.files[0])} style={{ fontSize: 12, width: "100%" }} />
            {(partLogo || user?.logo_url) && <img src={partLogo || user?.logo_url} alt="logo" style={{ width: 60, height: 60, objectFit: "contain", marginTop: 6, borderRadius: 6, border: "1px solid #eee" }} />}
          </div>
          <button style={styles.btnPrimary} onClick={async () => {
            setLoading(true);
            let logoUrl = partLogo || user?.logo_url || "";
            if (partLogoFile) { try { logoUrl = await uploadLogo(partLogoFile); } catch(e) { alert("Erreur upload logo"); setLoading(false); return; } }
            await fetch(`${SUPABASE_URL}/rest/v1/partenaires?auth_id=eq.${user?.auth_id}`, {
              method: "PATCH",
              headers: dbHeaders,
              body: JSON.stringify({ nom: partNom, categorie: partCat, departements: partDepts, adresse: partAdresse, description: partDescription, remise: partRemise, logo_url: logoUrl })
            });
            setLoading(false);
            alert("✅ Fiche mise à jour !");
          }} disabled={loading}>{loading ? "Enregistrement..." : "💾 ENREGISTRER MA FICHE"}</button>
        </div>
      )}

      {/* SCANNER */}
      {adminTab === "scanner" && (
        <div style={styles.content}>
          {/* Scanner QR */}
          <div style={{ ...styles.card, textAlign: "center", padding: 16 }}>
            {!scanning ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Scanner la carte membre</div>
                <button onClick={startScanner} style={{ ...styles.btnPrimary, marginTop: 12 }}>📷 ACTIVER LA CAMÉRA</button>
              </>
            ) : (
              <>
                <div id="qr-reader" style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}></div>
                <button onClick={stopScanner} style={{ ...styles.btnSecondary, marginTop: 8 }}>Arrêter</button>
              </>
            )}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "#aaa" }}>— ou entrer manuellement —</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Numéro membre" value={manualCode} onChange={e => setManualCode(e.target.value)} />
            <button onClick={doVerify} style={{ background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Vérifier</button>
          </div>
          {scanResult && !scanResult.error && !scanResult.acces_refuse && (
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
          {scanResult?.acces_refuse && (
            <div style={{ background: "#f8d7da", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#721c24", fontWeight: 600, marginBottom: 8 }}>⛔ ACCÈS REFUSÉ</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#721c24" }}>{scanResult.nom}</div>
              <div style={{ fontSize: 12, color: "#721c24", marginTop: 6 }}>{scanResult.raison}</div>
              <div style={{ fontSize: 12, color: "#721c24", marginTop: 4 }}>Invitez ce membre à passer à l'offre Trio ou Prestige.</div>
            </div>
          )}
          {scanResult?.error && <div style={{ background: "#f8d7da", borderRadius: 8, padding: 12, textAlign: "center", color: "#721c24", fontSize: 13 }}>Membre non reconnu</div>}
        </div>
      )}
    </div>
  );


  // ESPACE ENTREPRISE
  if (screen === "espace-entreprise") return (
    <div style={styles.app}>
      <div style={{ background: DARK2, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD}44` }}>
        <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
        <button onClick={doLogout} style={{ background: "none", border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Déconnexion</button>
      </div>

      <div style={{ display: "flex", background: DARK, borderBottom: `1px solid ${GOLD}22` }}>
        {[["dashboard", "📊 Dashboard"], ["salaries", "👥 Salariés"]].map(([t, label]) => (
          <button key={t} onClick={() => { setAdminTab(t); if(t==="salaries") getSalariesEntreprise(user?.id).then(setSalariesEntreprise); }} style={{ flex: 1, padding: "12px", border: "none", background: "none", cursor: "pointer", fontSize: 12, color: adminTab === t ? GOLD : "#aaa", fontWeight: adminTab === t ? 700 : 400, borderBottom: adminTab === t ? `2px solid ${GOLD}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      {/* DASHBOARD ENTREPRISE */}
      {adminTab === "dashboard" && (
        <div style={styles.content}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Bienvenue, {user?.nom} 👋</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: DARK, borderRadius: 8, padding: 12, textAlign: "center", border: `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>{user?.nb_salaries}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Salariés</div>
            </div>
            <div style={{ background: DARK, borderRadius: 8, padding: 12, textAlign: "center", border: `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>{user?.offre_base}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>Offre actuelle</div>
            </div>
          </div>

          <div style={{ ...styles.card, background: user?.valide ? "#d4edda" : "#FFF8E7", border: `1px solid ${user?.valide ? "#c3e6cb" : GOLD}` }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: user?.valide ? "#155724" : "#856404" }}>
              {user?.valide ? "✅ Compte validé — Salariés actifs" : "⏳ Compte en attente de validation"}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {user?.valide ? "Vos salariés ont accès à tous les avantages PEPIT'." : "Notre équipe valide votre compte sous 48h."}
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 600 }}>Mon abonnement</div>
            <div style={{ fontSize: 13 }}>Offre : <strong>{user?.offre_base}</strong></div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Salariés : <strong>{user?.nb_salaries}</strong></div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Total mensuel : <strong style={{ color: GOLD }}>
              {user?.offre_base === "Essentiel" ? (user?.nb_salaries * 7.90).toFixed(2).replace(".", ",") :
               user?.offre_base === "Trio" ? (user?.nb_salaries * 12.90).toFixed(2).replace(".", ",") :
               (user?.nb_salaries * 19.90).toFixed(2).replace(".", ",")}€
            </strong></div>
          </div>

          <div style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
            Pour toute modification, contactez :<br/>
            <a href="mailto:admin.pepit@gmail.com" style={{ color: GOLD }}>admin.pepit@gmail.com</a>
          </div>
        </div>
      )}

      {/* SALARIÉS */}
      {adminTab === "salaries" && (
        <div style={styles.content}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{salariesEntreprise.length} / {user?.nb_salaries} salarié(s)</div>
            <button onClick={() => setShowInviteForm(!showInviteForm)} style={styles.btnSmall}>+ Ajouter</button>
          </div>

          {showInviteForm && (
            <div style={{ background: "white", border: `1px solid ${GOLD}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>Ajouter un salarié</div>
              <input style={styles.input} placeholder="Nom du salarié" value={entrepriseNom2 || ""} onChange={e => setEntrepriseNom2(e.target.value)} />
              <input style={styles.input} type="email" placeholder="Email du salarié" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={async () => {
                  if (!inviteEmail || !entrepriseNom2) { alert("Veuillez remplir le nom et l'email"); return; }
                  if (salariesEntreprise.length >= user?.nb_salaries) { alert("Vous avez atteint le nombre de salariés payés. Contactez admin.pepit@gmail.com pour augmenter votre quota."); return; }
                  await addMembreAdmin({ nom: entrepriseNom2, email: inviteEmail.trim().toLowerCase(), offre: user?.offre_base, statut: "actif", economies: 0, nb_scans: 0, entreprise_id: user?.id, departement: "Tous" });
                  const s = await getSalariesEntreprise(user?.id);
                  setSalariesEntreprise(s);
                  setInviteEmail(""); setEntrepriseNom2(""); setShowInviteForm(false);
                  alert("✅ Salarié ajouté ! Il pourra se connecter avec son email via 'Mot de passe oublié' pour créer son mot de passe, ou contactez-le pour lui transmettre l'accès.");
                }} style={{ ...styles.btnSmall, flex: 1, padding: "10px" }}>Ajouter</button>
                <button onClick={() => setShowInviteForm(false)} style={{ ...styles.btnSecondary, flex: 1, padding: "10px", fontSize: 12 }}>Annuler</button>
              </div>
            </div>
          )}

          {salariesEntreprise.length === 0 && !showInviteForm && (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: 20 }}>
              Aucun salarié inscrit pour l'instant.<br/>
              <span style={{ fontSize: 12 }}>Cliquez sur "+ Ajouter" pour inscrire vos salariés.</span>
            </div>
          )}
          {salariesEntreprise.map(s => (
            <div key={s.id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nom}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{s.email}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{s.offre}</span>
                    <span style={{ ...styles.badge, background: s.statut === "actif" ? "#d4edda" : "#f8d7da", color: s.statut === "actif" ? "#155724" : "#721c24" }}>{s.statut}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", textAlign: "right" }}>
                  <div>{s.nb_scans} scans</div>
                  <div style={{ color: GOLD }}>{s.economies}€</div>
                </div>
              </div>
              <button onClick={async () => {
                if (window.confirm(`Supprimer ${s.nom} de votre entreprise ? Son compte PEPIT' sera désactivé.`)) {
                  await updateMembre(s.id, { statut: "résilié", entreprise_id: null });
                  const updated = await getSalariesEntreprise(user?.id);
                  setSalariesEntreprise(updated);
                }
              }} style={{ ...styles.btnDanger, marginTop: 8, width: "100%" }}>🗑️ Retirer ce salarié</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // APP MEMBRE
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
              <div style={{ background: "white", borderRadius: 8, padding: 4 }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${user?.id}`}
                  alt="QR Code membre"
                  style={{ width: 72, height: 72, display: "block" }}
                />
              </div>
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
          <div onClick={() => { setTab("account"); setShowApropos(true); }} style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>ℹ️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1B4172" }}>Découvrir PEPIT'</div>
              <div style={{ fontSize: 11, color: "#888" }}>Notre mission, nos engagements</div>
            </div>
            <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
          </div>
        </div>
      </>}

            {tab === "partners" && (
        selectedPartner ? (
          <div>
            <div style={{ ...styles.header, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button onClick={() => setSelectedPartner(null)} style={{ position: "absolute", left: 12, background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 28, lineHeight: 1 }}>‹</button>
              <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
            </div>
            <div style={styles.content}>
              <div style={{ ...styles.card, textAlign: "center", padding: 24 }}>
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.nom} style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 12, border: "1px solid #eee", background: "white", padding: 4, margin: "0 auto 12px", display: "block" }} />
                ) : (
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
                )}
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedPartner.nom}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{selectedPartner.categorie}</div>
                <div style={{ marginTop: 10 }}>
                  <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD, fontSize: 14 }}>{selectedPartner.remise}</span>
                </div>
              </div>
              {selectedPartner.description && (
                <div style={styles.card}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>À propos</div>
                  <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>{selectedPartner.description}</div>
                </div>
              )}
              <div style={styles.card}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 600 }}>Informations</div>
                {selectedPartner.adresse && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13 }}>
                    <span>📍</span><span>{selectedPartner.adresse}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
                  <span>🗺️</span><span>{(selectedPartner.departements || []).join(", ")}</span>
                </div>
              </div>
              <div style={{ ...styles.card, background: "#1B4172", border: `1px solid ${GOLD}44` }}>
                <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 6 }}>Votre avantage</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{selectedPartner.remise}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Présentez votre carte membre PEPIT'</div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                <div key={p.id} onClick={() => setSelectedPartner(p)} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={p.nom} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, border: "1px solid #eee", background: "white", padding: 2, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏪</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {(p.departements || []).join(", ")} · {p.categorie}</div>
                      <div style={{ marginTop: 6 }}><span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{p.remise}</span></div>
                    </div>
                  </div>
                  <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {tab === "account" && showParametres && (
        <div>
          <div style={{ ...styles.header, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button onClick={() => setShowParametres(false)} style={{ position: "absolute", left: 12, background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 28, lineHeight: 1 }}>‹</button>
            <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
          </div>
          <div style={styles.content}>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>⚙️ Paramètres</div>
            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 12 }}>Mon compte</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Nom : <strong>{user?.nom}</strong></div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Email : <strong>{user?.email}</strong></div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Département : <strong>{user?.departement}</strong></div>
              <div style={{ fontSize: 13, color: "#666" }}>Offre : <strong>{user?.offre}</strong></div>
            </div>
            <div style={{ padding: "12px", background: "#fff5f5", borderRadius: 10, border: "1px solid #f8d7da" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#721c24", marginBottom: 6 }}>⚠️ Résilier mon abonnement</div>
              <div style={{ fontSize: 12, color: "#721c24", marginBottom: 10, lineHeight: 1.6 }}>En résiliant, vous perdrez l'accès à tous les avantages PEPIT' à la fin de votre période en cours.</div>
              <button onClick={async () => {
                if (window.confirm("Êtes-vous sûr de vouloir résilier votre abonnement PEPIT' ?")) {
                  await updateMembre(user.id, { statut: "résilié" });
                  alert("Votre abonnement a été résilié. Merci d'avoir été membre PEPIT'.");
                  doLogout();
                }
              }} style={{ background: "#dc3545", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>
                Résilier mon abonnement
              </button>
            </div>
            <div onClick={() => setShowApropos(true)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14 }}>
              <span>ℹ️ À propos de PEPIT'</span><span style={{ color: "#ccc" }}>›</span>
            </div>
            <div style={{ fontSize: 11, color: "#aaa", textAlign: "center" }}>PEPIT' SAS — Version 1.0<br />Contact : admin.pepit@gmail.com</div>
          </div>
        </div>
      )}

      {tab === "account" && showApropos && (
        <div>
          <div style={{ ...styles.header, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button onClick={() => { setShowApropos(false); setShowParametres(true); }} style={{ position: "absolute", left: 12, background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 28, lineHeight: 1 }}>‹</button>
            <img src="/logo.png" alt="PEPIT'" style={{ width: 50, height: "auto", background: "white", borderRadius: 8, padding: 4 }} />
          </div>
          <div style={styles.content}>
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <img src="/logo.png" alt="PEPIT'" style={{ width: 100, height: "auto" }} />
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Qui sommes-nous ?</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                PEPIT' est une plateforme d'avantages et de réductions exclusives, pensée pour améliorer le pouvoir d'achat des particuliers et des salariés en Guadeloupe, Martinique et Guyane.
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Notre mission</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                "PEPIT', c'est le pouvoir d'achat pour tous. Des avantages concrets, accessibles dès 9,90€/mois, pour améliorer votre quotidien en Guadeloupe, Martinique et Guyane."
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginTop: 10 }}>
                Nous connectons les habitants des Antilles-Guyane à des commerçants locaux engagés, pour des réductions accessibles à tous, sans condition de revenus ni d'employeur.
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 10 }}>Informations légales</div>
              {["Conditions Générales d'Utilisation", "Politique de confidentialité", "Mentions légales"].map(item => (
                <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 13, color: "#333" }}>
                  <span>{item}</span><span style={{ color: "#ccc" }}>›</span>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Contact</div>
              <a href="mailto:admin.pepit@gmail.com" style={{ fontSize: 13, color: GOLD, textDecoration: "none" }}>📧 admin.pepit@gmail.com</a>
            </div>

            <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 8 }}>
              PEPIT' SAS<br />
              Guadeloupe · Martinique · Guyane<br />
              Version 1.0<br /><br />
              © 2026 PEPIT' SAS — Tous droits réservés
            </div>
          </div>
        </div>
      )}

      {tab === "account" && !showParametres && !showApropos && <>
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

          {/* Abonnement actif */}
          <div style={styles.card}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Abonnement actif</div>
            <span style={{ ...styles.badge, background: "#1a1a00", color: GOLD }}>{user?.offre} · {user?.offre === "Prestige" ? "24,90€" : user?.offre === "Trio" ? "14,90€" : "9,90€"}/mois</span>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Changer d'offre</div>
              {[["Essentiel", "9,90€/mois", "1 département"], ["Trio", "14,90€/mois", "3 départements"], ["Prestige", "24,90€/mois", "3 dép. + goodies + événements"]].map(([offre, prix, desc]) => (
                <div key={offre} onClick={async () => {
                  if (offre === user?.offre) return;
                  if (window.confirm(`Changer votre offre pour ${offre} à ${prix} ?`)) {
                    const url = createCheckoutSession(offre, user.email);
                    window.location.href = url;
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

          <div onClick={() => setShowParametres(true)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14 }}>
            <span>Historique des utilisations</span><span style={{ color: "#ccc" }}>›</span>
          </div>
          <div onClick={() => setShowParametres(true)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14 }}>
            <span>⚙️ Paramètres</span><span style={{ color: "#ccc" }}>›</span>
          </div>
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
