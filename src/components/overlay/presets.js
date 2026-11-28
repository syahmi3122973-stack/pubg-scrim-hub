const rykhorMediaLogo = '/overlay/rykhor-media.png';
const bbcCltvLogo = '/overlay/bbc-cltv.png';
export const diyStingerLogo = '/overlay/diy-stinger-logo.png';
export const defaultStartingSoonImage = '/overlay/starting-soon-bg.png';

export const PLACEMENT_POINTS_TABLE = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
};

export function getPlacementPoints(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r <= 0) return 0;
  return PLACEMENT_POINTS_TABLE[Math.trunc(r)] || 0;
}

export const SCENE_KIND_OPTIONS = [
  { kind: 'starting-soon', label: 'Starting Soon', subtitle: 'BERSIAP SEDIA • LOBBY AKAN BERMULA' },
  { kind: 'in-game-flight', label: 'In game flight', subtitle: 'FLIGHT PATH • DROP ZONE PHASE' },
  { kind: 'caster', label: 'Caster Scene', subtitle: 'ANALISIS & ULASAN PENYIAR' },
  { kind: 'ingame-map', label: 'Ingame Map', subtitle: 'PAPARAN PETA & ZON SEMASA' },
  { kind: 'standings', label: 'Standings Match', subtitle: 'KEDUDUKAN MATA RASMI' },
  { kind: 'point-system', label: 'Point System', subtitle: 'FORMAT PEMARKAHAN PMGC' },
  { kind: 'intermission', label: 'Intermission', subtitle: 'REHAT SEBENTAR • MATCH SETERUSNYA' },
  { kind: 'custom', label: 'Custom Scene', subtitle: 'SIARAN LANGSUNG KEJOHANAN' },
];

export function createDefaultScenes() {
  return [
    {
      id: 'starting-soon',
      name: 'Starting Soon',
      kind: 'starting-soon',
      subtitle: 'BERSIAP SEDIA • LOBBY AKAN BERMULA',
      imageDataUrl: defaultStartingSoonImage,
      builtIn: true,
    },
    {
      id: 'in-game-flight',
      name: 'In game flight',
      kind: 'in-game-flight',
      subtitle: 'FLIGHT PATH • DROP ZONE PHASE',
      builtIn: true,
    },
    {
      id: 'caster',
      name: 'Caster Scene',
      kind: 'caster',
      subtitle: 'ANALISIS & ULASAN PENYIAR',
      builtIn: true,
    },
    {
      id: 'ingame-map',
      name: 'Ingame Map',
      kind: 'ingame-map',
      subtitle: 'PAPARAN PETA & ZON SEMASA',
      builtIn: true,
    },
    {
      id: 'standings',
      name: 'Standings Match',
      kind: 'standings',
      subtitle: 'KEDUDUKAN MATA RASMI',
      builtIn: true,
    },
    {
      id: 'point-system',
      name: 'Point System',
      kind: 'point-system',
      subtitle: 'FORMAT PEMARKAHAN PMGC',
      builtIn: true,
    },
    {
      id: 'intermission',
      name: 'Intermission',
      kind: 'intermission',
      subtitle: 'REHAT SEBENTAR • MATCH SETERUSNYA',
      builtIn: true,
    },
  ];
}

export function createDefaultStandings() {
  const sampleTeams = [
    { name: 'RY.KHOR ESPORTS', rank: 1, kills: 12 },
    { name: 'VOLT UNITED', rank: 2, kills: 9 },
    { name: 'KESTREL PRO', rank: 3, kills: 8 },
    { name: 'HYPERNET SQUAD', rank: 4, kills: 6 },
    { name: 'AEGIS ZERO', rank: 5, kills: 5 },
    { name: 'APEX LEGION', rank: 6, kills: 4 },
    { name: 'PULSE GAMING', rank: 7, kills: 4 },
    { name: 'CRATE HUNTERS', rank: 8, kills: 3 },
  ];

  return {
    matchLabel: 'MATCH 1 • ERANGEL',
    rows: Array.from({ length: 16 }, (_, idx) => {
      const sample = sampleTeams[idx];
      return {
        id: `st-slot-${idx + 1}`,
        slot: idx + 1,
        teamName: sample ? sample.name : `SQUAD ${idx + 1}`,
        rank: sample ? sample.rank : idx + 1,
        kills: sample ? sample.kills : 0,
      };
    }),
  };
}

export function normalizeOverlayConfig(raw) {
  const base = structuredClone(PRESETS.tournament);
  if (!raw || typeof raw !== 'object') return base;

  const rawSponsors = Array.isArray(raw.sponsors) && raw.sponsors.length > 0 ? raw.sponsors : base.sponsors;
  const legacyPlaceholderIds = new Set(['sp-diy-main', 'sp-kestrel', 'sp-hypernet', 'sp-aegis']);
  let sponsors = rawSponsors;
  if (!raw.loop?.startingSoonSponsorsSeeded) {
    const customSponsors = rawSponsors.filter((sp) => !legacyPlaceholderIds.has(sp?.id));
    const hasRk = customSponsors.some((sp) => sp?.id === 'sp-rykhor-media');
    const hasBbc = customSponsors.some((sp) => sp?.id === 'sp-bbc-cltv');
    const seededDefaults = [
      ...(hasRk ? [] : [base.sponsors[0]]),
      ...(hasBbc ? [] : [base.sponsors[1]]),
    ];
    sponsors = [...seededDefaults, ...customSponsors];
  }
  sponsors = sponsors.map((sp) => ({
    ...sp,
    imgOffsetX: Number.isFinite(Number(sp?.imgOffsetX)) ? Number(sp.imgOffsetX) : 0,
    imgOffsetY: Number.isFinite(Number(sp?.imgOffsetY)) ? Number(sp.imgOffsetY) : 0,
    imgScale: Number.isFinite(Number(sp?.imgScale)) ? Number(sp.imgScale) : 1,
  }));
  const rawScenes = Array.isArray(raw.scenes) && raw.scenes.length > 0 ? raw.scenes : createDefaultScenes();
  const scenes = rawScenes.map((sc) =>
    sc?.id === 'starting-soon' && sc.imageDataUrl === undefined
      ? { ...sc, imageDataUrl: defaultStartingSoonImage }
      : sc
  );
  const activeSceneId =
    raw.activeSceneId && scenes.some((sc) => sc.id === raw.activeSceneId)
      ? raw.activeSceneId
      : scenes[0].id;

  const standings =
    raw.standings && Array.isArray(raw.standings.rows) && raw.standings.rows.length > 0
      ? {
          matchLabel: String(raw.standings.matchLabel || 'MATCH 1 • ERANGEL'),
          rows: raw.standings.rows.map((r, i) => ({
            id: r?.id || `st-slot-${i + 1}`,
            slot: Number(r?.slot) || i + 1,
            teamName: String(r?.teamName || `SQUAD ${i + 1}`),
            rank: r?.rank === '' || r?.rank === null || r?.rank === undefined ? '' : Number(r.rank),
            kills: Math.max(0, Number(r?.kills) || 0),
          })),
        }
      : createDefaultStandings();

  const mergedLoop = {
    ...base.loop,
    ...(raw.loop || {}),
    logoBoxEnabled: raw.loop?.logoBoxEnabled ?? true,
    startingSoonSponsorsSeeded: true,
  };
  if (!raw.loop?.startingSoonSponsorsSeeded && mergedLoop.logoStageX === 16 && mergedLoop.logoStageY === 14) {
    mergedLoop.logoStageX = 54;
    mergedLoop.logoStageY = 89;
    mergedLoop.logoStageScale = 0.88;
  }

  return {
    ...base,
    ...raw,
    sponsors,
    scenes,
    activeSceneId,
    standings,
    loop: mergedLoop,
    stinger: {
      ...base.stinger,
      ...(raw.stinger || {}),
      emblemDataUrl: raw.stinger?.emblemDataUrl || diyStingerLogo,
    },
  };
}

export const PRESETS = {
  tournament: {
    presetMode: 'tournament',
    eventTitle: 'DIY TOURNAMENT // BROADCAST',
    primaryAccent: '#FACC15',
    activeSceneId: 'starting-soon',
    scenes: createDefaultScenes(),
    standings: createDefaultStandings(),
    sponsors: [
      {
        id: 'sp-rykhor-media',
        name: 'RY.KHOR MEDIA',
        tier: 'OFFICIAL MEDIA',
        tagline: 'CREW VS CREW • SEASON 10',
        accentColor: '#76B900',
        logoDataUrl: rykhorMediaLogo,
        monogram: 'RK',
        active: true,
        isSample: false,
      },
      {
        id: 'sp-bbc-cltv',
        name: 'BBC CLTV',
        tier: 'OFFICIAL PARTNER',
        tagline: 'CLOTHING & APPAREL PARTNER',
        accentColor: '#FACC15',
        logoDataUrl: bbcCltvLogo,
        monogram: 'BBC',
        active: true,
        isSample: false,
      },
    ],
    loop: {
      cornerEnabled: false,
      cornerPosition: 'top-right',
      cornerStageX: null,
      cornerStageY: null,
      cornerDurationSec: 5,
      cornerScale: 1,
      tickerEnabled: false,
      tickerLabel: 'OFFICIAL PARTNERS',
      tickerMessage: 'ERANGEL • MATCH 1 • LIVE BROADCAST',
      tickerSpeed: 105,
      podiumEnabled: false,
      podiumTitle: 'BROUGHT TO YOU BY',
      podiumDurationSec: 6,
      logoOnlyEnabled: true,
      logoBoxEnabled: true,
      logoDurationSec: 3.2,
      logoTransition: 'crossfade',
      logoStageX: 54,
      logoStageY: 89,
      logoStageScale: 0.88,
      startingSoonSponsorsSeeded: true,
    },
    stinger: {
      style: 'volt-slash',
      durationMs: 1200,
      cutPointRatio: 0.48,
      brandTitle: '',
      brandSubtitle: 'DO IT YOURSELF',
      emblemDataUrl: diyStingerLogo,
      primaryColor: '#FACC15',
      secondaryColor: '#0A0A0C',
    },
  },
  streamer: {
    presetMode: 'streamer',
    eventTitle: 'LIVE RANKED // BROADCAST',
    primaryAccent: '#FACC15',
    activeSceneId: 'in-game-flight',
    scenes: createDefaultScenes(),
    standings: createDefaultStandings(),
    sponsors: [
      {
        id: 'sp-diy-stream',
        name: 'DIY',
        tier: 'PRESENTING PARTNER',
        tagline: 'DO IT YOURSELF',
        accentColor: '#FACC15',
        logoDataUrl: diyStingerLogo,
        monogram: 'DIY',
        active: true,
        isSample: false,
      },
      {
        id: 'sp-pulse-audio',
        name: 'PULSE IEM',
        tier: 'AUDIO PARTNER',
        tagline: 'PINPOINT FOOTSTEP IMAGING',
        accentColor: '#8CC4FF',
        logoDataUrl: null,
        monogram: 'PI',
        active: true,
        isSample: true,
      },
      {
        id: 'sp-lootbox',
        name: 'CRATE DROP',
        tier: 'SPONSORED BY',
        tagline: 'UC & SKIN BUNDLES DAILY',
        accentColor: '#34D399',
        logoDataUrl: null,
        monogram: 'CD',
        active: true,
        isSample: true,
      },
    ],
    loop: {
      cornerEnabled: true,
      cornerPosition: 'bottom-left',
      cornerStageX: null,
      cornerStageY: null,
      cornerDurationSec: 6,
      cornerScale: 0.94,
      tickerEnabled: false,
      tickerLabel: 'SPONSORS',
      tickerMessage: 'LIVE MATCH STREAM',
      tickerSpeed: 95,
      podiumEnabled: false,
      podiumTitle: 'STREAM PARTNER',
      podiumDurationSec: 6,
      logoOnlyEnabled: true,
      logoDurationSec: 3.5,
      logoTransition: 'crossfade',
      logoStageX: 16,
      logoStageY: 14,
      logoStageScale: 0.85,
    },
    stinger: {
      style: 'volt-slash',
      durationMs: 1150,
      cutPointRatio: 0.5,
      brandTitle: '',
      brandSubtitle: 'DO IT YOURSELF',
      emblemDataUrl: diyStingerLogo,
      primaryColor: '#FACC15',
      secondaryColor: '#0A0A0C',
    },
  },
  'logo-only': {
    presetMode: 'logo-only',
    eventTitle: 'STARTING SOON // CUSTOM SCENE',
    primaryAccent: '#FACC15',
    activeSceneId: 'starting-soon',
    scenes: createDefaultScenes(),
    standings: createDefaultStandings(),
    sponsors: [
      {
        id: 'sp-diy-only',
        name: 'DIY',
        tier: 'OFFICIAL PARTNER',
        tagline: 'DO IT YOURSELF',
        accentColor: '#FACC15',
        logoDataUrl: diyStingerLogo,
        monogram: 'DIY',
        active: true,
        isSample: false,
      },
      {
        id: 'sp-rykhor-media',
        name: 'RY.KHOR MEDIA',
        tier: 'PRODUCTION',
        tagline: 'CREW VS CREW',
        accentColor: '#76B900',
        logoDataUrl: rykhorMediaLogo,
        monogram: 'RK',
        active: true,
        isSample: false,
      },
      {
        id: 'sp-bbc-cltv',
        name: 'BBC CLTV',
        tier: 'PARTNER',
        tagline: 'APPAREL PARTNER',
        accentColor: '#FFFFFF',
        logoDataUrl: bbcCltvLogo,
        monogram: 'BBC',
        active: true,
        isSample: false,
      },
    ],
    loop: {
      cornerEnabled: false,
      cornerPosition: 'top-left',
      cornerStageX: null,
      cornerStageY: null,
      cornerDurationSec: 5,
      cornerScale: 1,
      tickerEnabled: false,
      tickerLabel: 'OFFICIAL PARTNERS',
      tickerMessage: 'CREW VS CREW • STARTING SOON',
      tickerSpeed: 105,
      podiumEnabled: false,
      podiumTitle: 'BROUGHT TO YOU BY',
      podiumDurationSec: 6,
      logoOnlyEnabled: true,
      logoDurationSec: 3.5,
      logoTransition: 'crossfade',
      logoStageX: 50,
      logoStageY: 22,
      logoStageScale: 1.0,
    },
    stinger: {
      style: 'matrix-wipe',
      durationMs: 1200,
      cutPointRatio: 0.48,
      brandTitle: '',
      brandSubtitle: 'DO IT YOURSELF',
      emblemDataUrl: diyStingerLogo,
      primaryColor: '#FACC15',
      secondaryColor: '#0A0A0C',
    },
  },
};
