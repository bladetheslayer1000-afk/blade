const PRESETS = [
  { id:"profile", label:"Profile", mask:"https://www.roblox.com/users/6700452/profile" },
  { id:"server",  label:"Private Server", mask:"https://www.roblox.com/games/2753915549/Adopt-Me?privateServerLinkCode=8721" },
  { id:"group",   label:"Group", mask:"https://www.roblox.com/groups/7384921/Roblox-Fans" }
];
const SERVICES = [
  { id:"is.gd", label:"is.gd" },
  { id:"v.gd",  label:"v.gd" },
  { id:"tinyurl", label:"TinyURL" }
];

let preset = PRESETS[0];
let service = "is.gd";

const $ = (s) => document.querySelector(s);
const presetsEl = $("#presets");
const servicesEl = $("#services");
const maskUrlEl = $("#maskUrl");

function renderPresets(){
  presetsEl.innerHTML = "";
  PRESETS.forEach(p => {
    const b = document.createElement("button");
    b.className = "opt" + (p.id===preset.id?" active":"");
    b.textContent = p.label;
    b.onclick = () => { preset = p; renderPresets(); maskUrlEl.textContent = preset.mask; };
    presetsEl.appendChild(b);
  });
}
function renderServices(){
  servicesEl.innerHTML = "";
  SERVICES.forEach(s => {
    const b = document.createElement("button");
    b.className = "opt mono" + (s.id===service?" active":"");
    b.textContent = s.label;
    b.onclick = () => { service = s.id; renderServices(); };
    servicesEl.appendChild(b);
  });
}
renderPresets(); renderServices();
maskUrlEl.textContent = preset.mask;

function endpointFor(s, url){
  const u = encodeURIComponent(url);
  if (s === "is.gd") return `https://is.gd/create.php?format=simple&url=${u}`;
  if (s === "v.gd")  return `https://v.gd/create.php?format=simple&url=${u}`;
  return `https://tinyurl.com/api-create.php?url=${u}`;
}

async function shorten(url, primary){
  const order = [primary, ...["tinyurl","is.gd","v.gd"].filter(s => s !== primary)];
  let lastErr = "";
  for (const s of order){
    try {
      const res = await fetch(endpointFor(s, url));
      const text = (await res.text()).trim();
      if (res.ok && text.startsWith("http")) return text;
      lastErr = text || `Shortener returned ${res.status}`;
    } catch (e) {
      lastErr = (e && e.message) ? e.message : String(e);
    }
  }
  throw new Error(lastErr || "All shorteners failed.");
}

const errEl = $("#err");
const resultEl = $("#result");
const mdEl = $("#markdown");
const shortEl = $("#shortUrl");
const forgeBtn = $("#forge");
const ctaLabel = $("#ctaLabel");
const ctaArrow = $("#ctaArrow");
const copyBtn = $("#copy");
const copyLabel = $("#copyLabel");

function setLoading(loading){
  forgeBtn.disabled = loading;
  if (loading){
    ctaLabel.textContent = "cloaking…";
    ctaArrow.style.display = "none";
    if (!forgeBtn.querySelector(".spin")){
      const s = document.createElement("span"); s.className = "spin";
      forgeBtn.insertBefore(s, ctaLabel);
    }
  } else {
    ctaLabel.textContent = "Cloak link";
    ctaArrow.style.display = "";
    const s = forgeBtn.querySelector(".spin"); if (s) s.remove();
  }
}

forgeBtn.onclick = async () => {
  errEl.style.display = "none";
  resultEl.style.display = "none";
  let url = $("#destination").value.trim();
  if (!url){
    errEl.textContent = "Drop a destination URL first.";
    errEl.style.display = ""; return;
  }
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try { new URL(url); } catch {
    errEl.textContent = "That doesn't look like a valid URL.";
    errEl.style.display = ""; return;
  }
  setLoading(true);
  try {
    const short = await shorten(url, service);
    const masked = preset.mask.replace("://", "__://__");
    const markdown = `[${masked}](${short})`;
    mdEl.textContent = markdown;
    shortEl.textContent = short;
    resultEl.style.display = "";
  } catch (e){
    errEl.textContent = (e && e.message) ? e.message : "Dead end. Switch shortener and try again.";
    errEl.style.display = "";
  } finally { setLoading(false); }
};

copyBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(mdEl.textContent);
    copyLabel.textContent = "copied";
    setTimeout(() => copyLabel.textContent = "copy", 1600);
  } catch {}
};

const pop = $("#pop");
setTimeout(() => pop.classList.remove("hidden"), 900);
pop.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) pop.classList.add("hidden");
});