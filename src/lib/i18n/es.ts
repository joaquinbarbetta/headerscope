import type { Dictionary } from ".";

/** Spanish (rioplatense-neutral). Header names, directives and code stay in English. */
const s = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const es: Dictionary = {
  // -------------------------------------------------------------------------
  // Metadata & chrome
  // -------------------------------------------------------------------------
  "meta.title": "HeaderScope — Scanner de headers de seguridad HTTP",
  "meta.description":
    "Escaneá los headers HTTP de cualquier sitio, obtené una calificación de seguridad y correcciones concretas para CSP, HSTS, cookies, clickjacking y más.",
  "nav.skip": "Ir al contenido",
  "nav.source": "Código",
  "nav.sourceLabel": "Código fuente de HeaderScope en GitHub (se abre en una pestaña nueva)",
  "nav.language": "Idioma",
  "footer.ethics":
    "Escaneá solo sitios propios o que tengas permiso para analizar. HeaderScope hace una única petición GET y lee los headers de la respuesta.",
  "footer.practice": "Esta página usa una CSP estricta con nonce, HSTS y compañía. Escaneala.",

  // -------------------------------------------------------------------------
  // Hero & form
  // -------------------------------------------------------------------------
  "hero.eyebrow": "Scanner de headers de seguridad HTTP",
  "hero.titleBefore": "¿Qué tan seguros son tus",
  "hero.titleAccent": "headers HTTP",
  "hero.titleAfter": "?",
  "hero.subtitle":
    "Auditá CSP, HSTS, protección contra clickjacking, flags de cookies y más. Obtené una nota y correcciones listas para copiar en segundos.",
  "form.label": "URL del sitio",
  "form.placeholder": "ejemplo.com",
  "form.submit": "Escanear",
  "form.scanning": "Escaneando…",
  "form.try": "Probá",
  "form.hint": "Una sola petición GET · solo headers · protegido contra SSRF",

  // -------------------------------------------------------------------------
  // Loading & empty states
  // -------------------------------------------------------------------------
  "loading.title": (p) => `Escaneando ${p.host}`,
  "loading.step.validate": "Validando la URL",
  "loading.step.dns": "Resolviendo DNS y verificando que la IP sea pública",
  "loading.step.tls": "Negociando TLS",
  "loading.step.request": "Enviando la petición GET",
  "loading.step.redirects": "Siguiendo redirecciones",
  "loading.step.audit": "Auditando los headers de la respuesta",
  "empty.title": "Qué se revisa",
  "empty.subtitle": "13 chequeos, ponderados según su impacto. Los informativos no afectan la nota.",
  "empty.weight": (p) => `${p.weight} pts`,
  "empty.info": "info",

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------
  "status.pass": "Correcto",
  "status.warn": "Advertencia",
  "status.fail": "Falla",
  "status.info": "Info",
  "report.heading": "Reporte del escaneo",
  "report.scoreAria": (p) => `Nota ${p.grade}, puntaje ${p.score} de 100`,
  "report.verdict.A+": "Excelente. Blindado como corresponde.",
  "report.verdict.A": "Muy bien. Quedan un par de detalles.",
  "report.verdict.B": "Aceptable, con margen para mejorar.",
  "report.verdict.C": "Faltan varios headers importantes.",
  "report.verdict.D": "Débil. Hay mejoras rápidas disponibles.",
  "report.verdict.F": "Totalmente expuesto. Empezá por HTTPS, HSTS y CSP.",
  "report.meta.status": "Estado",
  "report.meta.redirects": "Redirecciones",
  "report.meta.tls": "TLS",
  "report.meta.time": "Tiempo",
  "report.meta.none": "ninguno",
  "report.redirectChain": "Cadena de redirecciones",
  "report.filterLabel": "Filtrar chequeos por estado",
  "report.filterAll": "Todos",
  "report.downloadJson": "Descargar JSON",
  "report.rawHeaders": (p) => `Headers de la respuesta (${p.count})`,
  "report.noChecks": "No hay chequeos con este estado.",
  "card.observed": "Valor observado",
  "card.howToFix": "Cómo solucionarlo",
  "card.example": "Ejemplo",
  "card.copy": "Copiar",
  "card.copied": "Copiado",
  "card.copyLabel": "Copiar el ejemplo al portapapeles",
  "card.learnMore": "Más información",
  "card.newTab": "(se abre en una pestaña nueva)",

  // -------------------------------------------------------------------------
  // Errors
  // -------------------------------------------------------------------------
  "error.generic": "Algo salió mal.",
  "error.network": "Error de red. ¿Está corriendo el servidor?",
  "error.rateLimited": (p) => `Demasiados escaneos. Probá de nuevo en ${p.seconds} s.`,
  "error.invalidJson": "El cuerpo no es un JSON válido.",
  "error.invalidBody": 'El cuerpo debe ser { "url": string, "lang"?: "en" | "es" }.',
  "error.emptyUrl": "Ingresá una URL.",
  "error.urlTooLong": "La URL es demasiado larga.",
  "error.invalidUrl": "Eso no parece una URL válida.",
  "error.protocol": "Solo se pueden escanear URLs http:// y https://.",
  "error.credentials": "No se permiten URLs con credenciales incluidas.",
  "error.port": "Solo se permiten los puertos 80, 443, 8080 y 8443.",
  "error.internalHost": "No se pueden escanear hostnames locales o internos.",
  "error.privateIp": "No se pueden escanear direcciones IP privadas o reservadas.",
  "error.fullDomain": "Ingresá un nombre de dominio completo (por ejemplo, ejemplo.com).",
  "error.resolvesPrivate": "Este host resuelve a una dirección IP privada o reservada.",
  "error.tooManyRedirects": (p) => `Demasiadas redirecciones (más de ${p.max}).`,
  "error.timeout": (p) => `Se agotó el tiempo de espera (${p.seconds} s).`,
  "error.notFound": "No se encontró el dominio. Revisá cómo está escrito.",
  "error.refused": "El servidor rechazó la conexión.",
  "error.reset": "El servidor cerró la conexión.",
  "error.certExpired": "El certificado TLS del sitio está vencido.",
  "error.selfSigned": "El sitio usa un certificado TLS autofirmado.",
  "error.altName": "El certificado TLS no corresponde a este dominio.",
  "error.incompleteChain": "La cadena del certificado TLS está incompleta.",
  "error.unreachable": "No se pudo acceder al sitio.",

  // -------------------------------------------------------------------------
  // Checks — shared
  // -------------------------------------------------------------------------
  "check.missing": "El header no está presente.",

  // HTTPS
  "check.https.title": "HTTPS",
  "check.https.about": "Servido por TLS, con redirección de HTTP a HTTPS",
  "check.https.pass": "El sitio se sirve por HTTPS.",
  "check.https.upgraded": "La petición por HTTP se redirigió a HTTPS.",
  "check.https.fail": "El sitio se sirve por HTTP sin cifrar.",
  "check.https.failDetail": "Cualquiera en el camino de red puede leer y modificar el tráfico.",
  "check.https.failRec": "Serví el sitio por HTTPS y redirigí todas las peticiones HTTP hacia ahí (301).",

  // TLS
  "check.tls.title": "TLS y certificado",
  "check.tls.about": "Protocolo negociado y vencimiento del certificado",
  "check.tls.protocol": (p) => `Protocolo: ${p.protocol}`,
  "check.tls.issuer": (p) => `Emisor: ${p.issuer}`,
  "check.tls.expires": (p) => `Vence: ${p.date}`,
  "check.tls.legacy": (p) => `Se negoció un protocolo obsoleto (${p.protocol}).`,
  "check.tls.legacyRec": "Deshabilitá TLS 1.0/1.1 y habilitá TLS 1.2 y 1.3.",
  "check.tls.expired": "El certificado está vencido.",
  "check.tls.expiredRec": "Renová el certificado.",
  "check.tls.expiring": (p) => `El certificado vence en ${p.days} ${s(p.days, "día", "días")}.`,
  "check.tls.expiringRec": "Renová el certificado pronto o automatizá la renovación (por ejemplo, Let's Encrypt + certbot).",
  "check.tls.pass": "TLS moderno.",
  "check.tls.passDays": (p) => `TLS moderno, certificado válido por ${p.days} ${s(p.days, "día", "días")} más.`,

  // HSTS
  "check.hsts.title": "Strict-Transport-Security",
  "check.hsts.about": "max-age ≥ 6 meses, includeSubDomains, preload",
  "check.hsts.requiresHttps": "HSTS requiere HTTPS.",
  "check.hsts.requiresHttpsDetail": "Los navegadores ignoran HSTS si se envía por HTTP sin cifrar.",
  "check.hsts.requiresHttpsRec": "Habilitá HTTPS primero y después enviá HSTS.",
  "check.hsts.missingDetail": "Sin HSTS, una primera visita por HTTP puede ser interceptada (SSL stripping).",
  "check.hsts.missingRec": "Enviá HSTS con un max-age de al menos 6 meses (idealmente 2 años).",
  "check.hsts.subdomains": "Cubre los subdominios (includeSubDomains).",
  "check.hsts.noSubdomains": "No cubre los subdominios.",
  "check.hsts.preload": "Marcado para las listas de preload de los navegadores.",
  "check.hsts.maxAgeInvalid": "max-age falta o no es válido.",
  "check.hsts.maxAgeZero": "max-age=0 desactiva HSTS.",
  "check.hsts.maxAgeRec": "Configurá max-age en al menos 15552000 (6 meses).",
  "check.hsts.short": (p) => `max-age es corto (${p.days} ${s(p.days, "día", "días")}).`,
  "check.hsts.shortRec": "Aumentá max-age a al menos 15552000 (6 meses).",
  "check.hsts.pass": (p) => `Activo por ${p.days} ${s(p.days, "día", "días")}.`,

  // CSP
  "check.csp.title": "Content-Security-Policy",
  "check.csp.about": "Política activa sin unsafe-inline, unsafe-eval ni comodines",
  "check.csp.reportOnly": "Solo hay una política en modo report-only.",
  "check.csp.reportOnlyDetail": "El modo report-only registra las violaciones pero no bloquea nada.",
  "check.csp.reportOnlyRec": "Cuando los reportes estén limpios, pasá al header Content-Security-Policy, que sí bloquea.",
  "check.csp.missingDetail": "CSP es la principal defensa del navegador contra XSS e inyección de contenido.",
  "check.csp.missingRec":
    "Agregá una CSP. Empezá con Content-Security-Policy-Report-Only para detectar qué se rompe y después aplicala.",
  "check.csp.weak": (p) =>
    `Hay política, pero es débil (${p.count} ${s(p.count, "problema grave", "problemas graves")}).`,
  "check.csp.weakRec": "Reemplazá 'unsafe-inline'/'unsafe-eval' y las fuentes amplias por nonces o hashes.",
  "check.csp.minor": "Hay política, con sugerencias menores.",
  "check.csp.strong": "Política sólida.",
  "check.csp.issue.noScriptSrc": "No hay directiva script-src ni default-src: los scripts se pueden cargar desde cualquier lado.",
  "check.csp.issue.unsafeInline": "'unsafe-inline' permite scripts inline, lo que anula casi toda la protección contra XSS.",
  "check.csp.issue.unsafeEval": "'unsafe-eval' permite eval() y similares, un vector habitual de XSS.",
  "check.csp.issue.broad": (p) => `Fuentes de scripts demasiado amplias: ${p.sources}.`,
  "check.csp.issue.noObjectSrc": "No hay directiva object-src. Considerá object-src 'none' para bloquear plugins.",
  "check.csp.issue.noBaseUri":
    "No hay directiva base-uri. Considerá base-uri 'self' para evitar la inyección de etiquetas <base>.",

  // X-Content-Type-Options
  "check.xcto.title": "X-Content-Type-Options",
  "check.xcto.about": "nosniff desactiva el MIME sniffing",
  "check.xcto.pass": "El MIME sniffing está desactivado.",
  "check.xcto.invalid": (p) => `Valor inválido "${p.value}".`,
  "check.xcto.detail": "Los navegadores podrían interpretar archivos subidos como scripts o HTML (confusión de MIME).",
  "check.xcto.rec": "Enviá X-Content-Type-Options: nosniff en todas las respuestas.",

  // Framing
  "check.framing.title": "Protección contra clickjacking",
  "check.framing.about": "CSP frame-ancestors o X-Frame-Options",
  "check.framing.wildcard": "frame-ancestors permite que cualquier sitio embeba esta página.",
  "check.framing.wildcardRec": "Restringí frame-ancestors a 'self' o a orígenes de confianza.",
  "check.framing.viaCsp": "Controlado mediante CSP frame-ancestors.",
  "check.framing.xfo": (p) => `X-Frame-Options: ${p.value}.`,
  "check.framing.xfoDetail": "Considerá agregar también CSP frame-ancestors, su reemplazo moderno.",
  "check.framing.allowFrom": "ALLOW-FROM está obsoleto y los navegadores modernos lo ignoran.",
  "check.framing.allowFromRec": "Usá CSP frame-ancestors con el origen permitido.",
  "check.framing.invalid": (p) => `Valor de X-Frame-Options inválido "${p.value}".`,
  "check.framing.none": "No hay frame-ancestors ni X-Frame-Options.",
  "check.framing.detail":
    "Cualquier sitio puede embeber esta página en un iframe y engañar a los usuarios para que hagan clic (clickjacking).",
  "check.framing.rec":
    "Agregá CSP frame-ancestors 'self' (y, opcionalmente, X-Frame-Options: SAMEORIGIN para navegadores viejos).",

  // COOP
  "check.coop.title": "Cross-Origin-Opener-Policy",
  "check.coop.about": "Aísla el contexto de navegación de ventanas de otros orígenes",
  "check.coop.pass": (p) => `Contexto de navegación aislado (${p.value}).`,
  "check.coop.weak": (p) => `Valor débil "${p.value}".`,
  "check.coop.detail":
    "Las ventanas de otros orígenes abiertas desde esta página conservan una referencia a ella (XS-Leaks, tabnabbing).",
  "check.coop.rec":
    "Enviá Cross-Origin-Opener-Policy: same-origin (o same-origin-allow-popups si dependés de popups de OAuth).",

  // Referrer-Policy
  "check.referrer.title": "Referrer-Policy",
  "check.referrer.about": "Política explícita que no filtre URLs completas",
  "check.referrer.missingDetail":
    "Los navegadores modernos usan strict-origin-when-cross-origin por defecto, pero los más viejos pueden filtrar URLs completas.",
  "check.referrer.missingRec": "Definí la política de forma explícita.",
  "check.referrer.pass": (p) => `Política: ${p.policy}.`,
  "check.referrer.leaky": (p) => `"${p.policy}" filtra URLs completas a otros sitios.`,
  "check.referrer.unrecognized": (p) => `Valor no reconocido "${p.value}".`,
  "check.referrer.detail": "Las URLs completas pueden contener tokens, búsquedas u otros datos privados.",
  "check.referrer.rec": "Usá strict-origin-when-cross-origin o algo más estricto.",

  // Permissions-Policy
  "check.permissions.title": "Permissions-Policy",
  "check.permissions.about": "Restringe cámara, micrófono, geolocalización…",
  "check.permissions.pass": "Las funciones del navegador están restringidas.",
  "check.permissions.legacyOnly": "Solo está el header obsoleto Feature-Policy.",
  "check.permissions.detail":
    "Código inyectado o de terceros podría pedir acceso a la cámara, el micrófono, la geolocalización, etc.",
  "check.permissions.rec": "Deshabilitá las funciones del navegador que tu sitio no usa.",

  // Cookies
  "check.cookies.title": "Flags de cookies",
  "check.cookies.about": "Secure, HttpOnly, SameSite y reglas de prefijos, cookie por cookie",
  "check.cookies.none": "Esta respuesta no setea cookies.",
  "check.cookies.cookie": (p) => `${p.name}: ${p.problems}`,
  "check.cookies.ok": (p) => `${p.name}: OK`,
  "check.cookies.fail": (p) =>
    `${p.count} ${s(p.count, "cookie", "cookies")}; algunas pueden filtrarse por conexiones inseguras.`,
  "check.cookies.failRec": "Agregá Secure a todas las cookies, y HttpOnly y SameSite a las de sesión.",
  "check.cookies.warn": (p) => `${p.count} ${s(p.count, "cookie", "cookies")}; a algunas les falta HttpOnly o SameSite.`,
  "check.cookies.warnRec":
    "Agregá HttpOnly a las cookies que JavaScript no necesita leer y configurá SameSite=Lax o Strict.",
  "check.cookies.pass": (p) =>
    `${p.count} ${s(p.count, "cookie", "cookies")}, ${s(p.count, "configurada", "todas configuradas")} correctamente.`,
  "check.cookies.problem.missingSecure": "falta Secure",
  "check.cookies.problem.sameSiteNone": "SameSite=None sin Secure (los navegadores la rechazan)",
  "check.cookies.problem.prefix": (p) => `el prefijo ${p.prefix} requiere Secure`,
  "check.cookies.problem.missingHttpOnly": "falta HttpOnly",
  "check.cookies.problem.noSameSite": "sin atributo SameSite",

  // Information disclosure
  "check.disclosure.title": "Exposición de información",
  "check.disclosure.about": "Server con versión, X-Powered-By y similares",
  "check.disclosure.server": (p) => `Server: ${p.value} (revela un número de versión)`,
  "check.disclosure.header": (p) => `${p.name}: ${p.value}`,
  "check.disclosure.pass": "No se filtran detalles de tecnología ni versiones.",
  "check.disclosure.warn": "Los headers revelan el stack tecnológico.",
  "check.disclosure.rec":
    "Quitá o generalizá estos headers (por ejemplo, server_tokens off en nginx, expose_php = Off en php.ini) para que nadie pueda cruzarlos con CVEs conocidos.",

  // X-XSS-Protection
  "check.xxss.title": "X-XSS-Protection",
  "check.xxss.about": "Auditor XSS obsoleto que sigue activo",
  "check.xxss.enabled": "El auditor XSS obsoleto está activado.",
  "check.xxss.disabled": "Header obsoleto, correctamente desactivado.",
  "check.xxss.enabledDetail":
    "El auditor XSS fue eliminado de los navegadores y podía introducir filtraciones por sí mismo. Confiá en CSP.",
  "check.xxss.rec": "Configurá X-XSS-Protection: 0 o quitá el header.",

  // CORS
  "check.cors.title": "CORS",
  "check.cors.about": "Exposición mediante Access-Control-Allow-Origin",
  "check.cors.wildcard": "Cualquier origen puede leer esta respuesta.",
  "check.cors.origin": (p) => `Legible desde el origen ${p.origin}.`,
  "check.cors.wildcardDetail": "Está bien para recursos y APIs públicas; es un problema si la página tiene datos privados.",
  "check.cors.originDetail": "Asegurate de que este origen sea intencional y no un reflejo del de la petición.",
  "check.cors.credentials": "Access-Control-Allow-Credentials: true está activado.",
};
