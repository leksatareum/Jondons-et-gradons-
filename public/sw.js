// Service worker : réveiller l'appareil sur une notification push, et servir
// l'application sans réseau.
//
// Le hors-ligne se joue ici et nulle part ailleurs : sans cache, un téléphone
// sans 4G n'obtient même pas le fichier HTML, et l'écran reste blanc — aucun
// code applicatif n'a la moindre chance de s'exécuter. Une cave, un wifi qui
// tombe, et la séance s'arrête.
//
// Le cache se remplit à l'usage, pas par une liste écrite à l'avance : les
// noms des fichiers construits portent une empreinte que Vite calcule au
// dernier moment, et une liste figée ici serait fausse dès le déploiement
// suivant. Un passage en ligne suffit à tout garder — ce qui correspond à
// l'usage réel, où l'on ouvre l'appli chez soi avant de partir jouer.

const VERSION = 'jg-v1';

/**
 * `ignoreVary` — indispensable, et pas un raccourci.
 *
 * L'hébergeur renvoie `Vary: Origin` sur les fichiers statiques. Or un script
 * de type module est toujours demandé en mode CORS, donc AVEC un en-tête
 * `Origin` — que la mise en réserve, elle, n'avait pas envoyé. Sans cette
 * option, le cache refuse de reconnaître son propre fichier, et l'appli reste
 * blanche hors ligne alors que tout est là. Constaté en navigateur, pas
 * supposé.
 *
 * Sans danger ici : ces fichiers ne varient pas selon l'origine, leur nom
 * porte déjà l'empreinte de leur contenu.
 */
const RETROUVER = { ignoreVary: true };

// Ce qu'on garde, explicitement. Tout le reste passe DROIT au réseau — en
// particulier Supabase : servir un point de vie depuis le cache mentirait sur
// l'état de la partie, ce qui est pire que ne rien afficher.
const POLICES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

const estUneRessourceDuSite = (url) =>
  url.origin === self.location.origin
  && (url.pathname.startsWith('/assets/')
    || url.pathname === '/manifest.webmanifest'
    || /\.(?:png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname));

const estUnePolice = (url) => POLICES.includes(url.origin);

/**
 * La page elle-même : réseau d'abord, cache en secours.
 *
 * Dans cet ordre et pas l'inverse : servir le HTML depuis le cache ferait
 * tourner une version périmée de l'appli sur un téléphone parfaitement
 * connecté, et un déploiement ne serait visible qu'au deuxième lancement.
 */
async function pageDemandee(request) {
  const cache = await caches.open(VERSION);
  try {
    const reponse = await fetch(request);
    // On garde la page sous une clé fixe : l'URL de navigation peut porter un
    // fragment ou une requête (retour d'un lien « mot de passe oublié »), et
    // on ne veut qu'une seule coquille en réserve.
    if (reponse.ok) await cache.put('/index.html', reponse.clone());
    return reponse;
  } catch (echecReseau) {
    const garde = await cache.match('/index.html', RETROUVER);
    if (garde) return garde;
    // Jamais ouverte en ligne sur ce téléphone : il n'y a rien à servir, et
    // la page d'erreur du navigateur ne dirait pas pourquoi.
    return new Response(PAGE_SANS_RESERVE, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/**
 * Les fichiers construits : cache d'abord.
 *
 * Sans risque de périmer, parce que leur nom porte l'empreinte de leur
 * contenu — `index-D7EN9cj.js` ne changera jamais de contenu, il sera
 * remplacé par un autre nom. Une nouvelle version de l'appli demande donc
 * naturellement de nouveaux fichiers.
 */
async function ressourceDemandee(request) {
  const cache = await caches.open(VERSION);
  const garde = await cache.match(request, RETROUVER);
  if (garde) return garde;
  const reponse = await fetch(request);
  // Les réponses opaques (polices en `no-cors`) ont un statut 0 : elles sont
  // parfaitement utilisables, et les refuser priverait l'appli de ses polices
  // hors ligne.
  if (reponse.ok || reponse.type === 'opaque') {
    await cache.put(request, reponse.clone());
    await elaguer(cache);
  }
  return reponse;
}

/**
 * Chaque déploiement crée de nouveaux noms de fichiers ; les anciens restent
 * en réserve sans que rien ne les demande plus. Sans cette coupe, le cache
 * grossirait d'un lot complet à chaque mise en ligne, indéfiniment.
 *
 * `keys()` rend les entrées dans leur ordre d'ajout : les premières sont donc
 * les plus anciennes, et ce sont elles qu'on retire.
 */
const ENTREES_MAX = 60;

async function elaguer(cache) {
  const entrees = await cache.keys();
  if (entrees.length <= ENTREES_MAX) return;
  for (const entree of entrees.slice(0, entrees.length - ENTREES_MAX)) {
    // Jamais la coquille : c'est elle qui décide si l'appli s'ouvre.
    if (new URL(entree.url).pathname === '/index.html') continue;
    await cache.delete(entree);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(pageDemandee(request));
    return;
  }
  if (estUneRessourceDuSite(url) || estUnePolice(url)) {
    event.respondWith(ressourceDemandee(request));
  }
  // Tout le reste — Supabase en tête — n'est pas intercepté du tout.
});

self.addEventListener('push', (event) => {
  let donnees = { title: 'Jondons et gradons', body: '' };
  try {
    if (event.data) donnees = { ...donnees, ...event.data.json() };
  } catch {
    // Corps non-JSON ou absent : on garde le titre par défaut plutôt que
    // de faire échouer toute la notification pour un format inattendu.
  }
  event.waitUntil(
    self.registration.showNotification(donnees.title || 'Jondons et gradons', {
      body: donnees.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const dejaOuverte = fenetres.find((fenetre) => 'focus' in fenetre);
      if (dejaOuverte) {
        await dejaOuverte.focus();
        return;
      }
      await self.clients.openWindow('/');
    })(),
  );
});

/**
 * Mise en réserve dès l'installation, sans attendre une deuxième visite.
 *
 * Nécessaire, et pas seulement confortable : un service worker prend le
 * contrôle APRÈS que la page a chargé ses propres fichiers. Sans cette étape,
 * la première ouverture ne garde rien du tout — vérifié : seules quelques
 * images demandées plus tard s'y trouvaient — et il fallait ouvrir l'appli
 * deux fois en ligne avant qu'elle sache s'ouvrir sans réseau. Personne
 * n'aurait deviné cette règle-là un soir de panne.
 *
 * La liste n'est pas écrite ici : elle se lit dans la page elle-même, dont les
 * noms de fichiers portent l'empreinte du dernier build.
 */
async function mettreEnReserve() {
  const cache = await caches.open(VERSION);
  const reponse = await fetch('/index.html', { cache: 'reload' });
  if (!reponse.ok) return;
  const html = await reponse.text();
  await cache.put('/index.html', new Response(html, { headers: reponse.headers }));

  const fichiers = new Set(html.match(/\/assets\/[A-Za-z0-9._-]+/g) || []);
  fichiers.add('/manifest.webmanifest');
  fichiers.add('/icon-192.png');
  // `allSettled` : une icône manquante ne doit pas faire échouer l'installation
  // et emporter avec elle la mise en réserve du paquet principal.
  await Promise.allSettled([...fichiers].map((chemin) => cache.add(chemin)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(mettreEnReserve().catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Les caches des versions précédentes n'ont plus rien à servir : leurs
      // fichiers portaient d'autres empreintes.
      const noms = await caches.keys();
      await Promise.all(noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom)));
      await self.clients.claim();
    })(),
  );
});

const PAGE_SANS_RESERVE = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jondons et gradons</title>
<style>
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px;
         background:#121417; color:#e7e3da; font:15px/1.5 system-ui, sans-serif; text-align:center; }
  p { max-width:24em; margin:0 0 18px; }
  strong { display:block; margin-bottom:10px; font-size:18px; }
  button { padding:10px 18px; border:1px solid #4a4a52; border-radius:8px;
           background:none; color:inherit; font:inherit; }
</style></head>
<body><div>
  <p><strong>Pas de réseau</strong>
  Cette application n'a jamais été ouverte en ligne sur cet appareil, il n'y a donc
  rien à afficher hors connexion. Ouvre-la une fois avec du réseau : ensuite, elle
  s'ouvrira partout.</p>
  <button onclick="location.reload()">Réessayer</button>
</div></body></html>`;
