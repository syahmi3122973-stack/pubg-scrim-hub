import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Shield, 
  Swords, 
  Search, 
  Video, 
  Share2, 
  Plus, 
  CheckCircle, 
  Flame, 
  Users, 
  Calendar, 
  Copy, 
  Play, 
  ExternalLink, 
  Heart, 
  BarChart3, 
  Save, 
  RefreshCw, 
  Layers, 
  Check, 
  Filter,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';

// --- POINT SYSTEM HELPER (Official PUBGM Standard) ---
const getPlacementPoints = (placement) => {
  const p = parseInt(placement, 10);
  switch (p) {
    case 1: return 10;
    case 2: return 6;
    case 3: return 5;
    case 4: return 4;
    case 5: return 3;
    case 6: return 2;
    case 7:
    case 8: return 1;
    default: return 0;
  }
};

// --- INITIAL SEED DATA ---
const DEFAULT_TEAMS = [
  { id: 'tm_1', name: 'Geek Fam MY', tag: 'GEEK', region: 'Malaysia', logo: 'GF' },
  { id: 'tm_2', name: 'Yoodo Alliance', tag: 'YALL', region: 'Malaysia', logo: 'YA' },
  { id: 'tm_3', name: 'SEM9 Esports', tag: 'SEM9', region: 'Malaysia', logo: 'S9' },
  { id: 'tm_4', name: 'Vampire Esports', tag: 'VPE', region: 'Thailand', logo: 'VP' },
  { id: 'tm_5', name: 'Bigetron RA', tag: 'BTR', region: 'Indonesia', logo: 'BT' },
  { id: 'tm_6', name: 'Alter Ego Ares', tag: 'AE', region: 'Indonesia', logo: 'AE' },
  { id: 'tm_7', name: 'FaZe Clan SEA', tag: 'FAZE', region: 'Thailand', logo: 'FZ' },
  { id: 'tm_8', name: 'Talon Esports', tag: 'TLN', region: 'APAC', logo: 'TL' },
  { id: 'tm_9', name: 'HomeBois', tag: 'HB', region: 'Malaysia', logo: 'HB' },
  { id: 'tm_10', name: 'Team Secret MY', tag: 'TS', region: 'Malaysia', logo: 'TS' },
  { id: 'tm_11', name: 'D\'Xavier', tag: 'DX', region: 'Vietnam', logo: 'DX' },
  { id: 'tm_12', name: 'Crit VIP', tag: 'CRIT', region: 'Malaysia', logo: 'CR' },
  { id: 'tm_13', name: '4Rivals', tag: '4R', region: 'Malaysia', logo: '4R' },
  { id: 'tm_14', name: 'Genesis Esports', tag: 'GEN', region: 'Malaysia', logo: 'GN' },
  { id: 'tm_15', name: 'NSJ Esports', tag: 'NSJ', region: 'Malaysia', logo: 'NS' },
  { id: 'tm_16', name: 'Rampage Pro', tag: 'RPG', region: 'Singapore', logo: 'RP' }
];

const DEFAULT_SCRIMS = [
  {
    id: 'scrim_001',
    title: 'SEA Elite Tier-1 Daily Scrim',
    date: '2025-05-12',
    totalMatches: 3,
    status: 'Completed',
    matches: [
      {
        matchNo: 1,
        map: 'Erangel',
        results: [
          { teamId: 'tm_1', teamName: 'Geek Fam MY', tag: 'GEEK', placement: 1, kills: 12, placePts: 10, totalPts: 22, wwcd: 1 },
          { teamId: 'tm_2', teamName: 'Yoodo Alliance', tag: 'YALL', placement: 2, kills: 8, placePts: 6, totalPts: 14, wwcd: 0 },
          { teamId: 'tm_4', teamName: 'Vampire Esports', tag: 'VPE', placement: 3, kills: 7, placePts: 5, totalPts: 12, wwcd: 0 },
          { teamId: 'tm_5', teamName: 'Bigetron RA', tag: 'BTR', placement: 4, kills: 5, placePts: 4, totalPts: 9, wwcd: 0 },
          { teamId: 'tm_3', teamName: 'SEM9 Esports', tag: 'SEM9', placement: 5, kills: 4, placePts: 3, totalPts: 7, wwcd: 0 },
          { teamId: 'tm_6', teamName: 'Alter Ego Ares', tag: 'AE', placement: 6, kills: 3, placePts: 2, totalPts: 5, wwcd: 0 },
          { teamId: 'tm_7', teamName: 'FaZe Clan SEA', tag: 'FAZE', placement: 7, kills: 2, placePts: 1, totalPts: 3, wwcd: 0 },
          { teamId: 'tm_8', teamName: 'Talon Esports', tag: 'TLN', placement: 8, kills: 1, placePts: 1, totalPts: 2, wwcd: 0 },
          { teamId: 'tm_9', teamName: 'HomeBois', tag: 'HB', placement: 9, kills: 2, placePts: 0, totalPts: 2, wwcd: 0 },
          { teamId: 'tm_10', teamName: 'Team Secret MY', tag: 'TS', placement: 10, kills: 3, placePts: 0, totalPts: 3, wwcd: 0 },
          { teamId: 'tm_11', teamName: 'D\'Xavier', tag: 'DX', placement: 11, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_12', teamName: 'Crit VIP', tag: 'CRIT', placement: 12, kills: 1, placePts: 0, totalPts: 1, wwcd: 0 },
          { teamId: 'tm_13', teamName: '4Rivals', tag: '4R', placement: 13, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_14', teamName: 'Genesis Esports', tag: 'GEN', placement: 14, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_15', teamName: 'NSJ Esports', tag: 'NSJ', placement: 15, kills: 1, placePts: 0, totalPts: 1, wwcd: 0 },
          { teamId: 'tm_16', teamName: 'Rampage Pro', tag: 'RPG', placement: 16, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 }
        ]
      },
      {
        matchNo: 2,
        map: 'Miramar',
        results: [
          { teamId: 'tm_4', teamName: 'Vampire Esports', tag: 'VPE', placement: 1, kills: 14, placePts: 10, totalPts: 24, wwcd: 1 },
          { teamId: 'tm_1', teamName: 'Geek Fam MY', tag: 'GEEK', placement: 2, kills: 6, placePts: 6, totalPts: 12, wwcd: 0 },
          { teamId: 'tm_3', teamName: 'SEM9 Esports', tag: 'SEM9', placement: 3, kills: 8, placePts: 5, totalPts: 13, wwcd: 0 },
          { teamId: 'tm_2', teamName: 'Yoodo Alliance', tag: 'YALL', placement: 4, kills: 4, placePts: 4, totalPts: 8, wwcd: 0 },
          { teamId: 'tm_7', teamName: 'FaZe Clan SEA', tag: 'FAZE', placement: 5, kills: 5, placePts: 3, totalPts: 8, wwcd: 0 },
          { teamId: 'tm_5', teamName: 'Bigetron RA', tag: 'BTR', placement: 6, kills: 2, placePts: 2, totalPts: 4, wwcd: 0 },
          { teamId: 'tm_6', teamName: 'Alter Ego Ares', tag: 'AE', placement: 7, kills: 3, placePts: 1, totalPts: 4, wwcd: 0 },
          { teamId: 'tm_10', teamName: 'Team Secret MY', tag: 'TS', placement: 8, kills: 1, placePts: 1, totalPts: 2, wwcd: 0 },
          { teamId: 'tm_9', teamName: 'HomeBois', tag: 'HB', placement: 9, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_8', teamName: 'Talon Esports', tag: 'TLN', placement: 10, kills: 2, placePts: 0, totalPts: 2, wwcd: 0 },
          { teamId: 'tm_11', teamName: 'D\'Xavier', tag: 'DX', placement: 11, kills: 1, placePts: 0, totalPts: 1, wwcd: 0 },
          { teamId: 'tm_12', teamName: 'Crit VIP', tag: 'CRIT', placement: 12, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_13', teamName: '4Rivals', tag: '4R', placement: 13, kills: 1, placePts: 0, totalPts: 1, wwcd: 0 },
          { teamId: 'tm_14', teamName: 'Genesis Esports', tag: 'GEN', placement: 14, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_15', teamName: 'NSJ Esports', tag: 'NSJ', placement: 15, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 },
          { teamId: 'tm_16', teamName: 'Rampage Pro', tag: 'RPG', placement: 16, kills: 0, placePts: 0, totalPts: 0, wwcd: 0 }
        ]
      }
    ]
  },
  {
    id: 'scrim_002',
    title: 'PUBGM MY/SG Weekly Challenger',
    date: '2025-05-10',
    totalMatches: 2,
    status: 'Completed',
    matches: [
      {
        matchNo: 1,
        map: 'Sanhok',
        results: [
          { teamId: 'tm_2', teamName: 'Yoodo Alliance', tag: 'YALL', placement: 1, kills: 11, placePts: 10, totalPts: 21, wwcd: 1 },
          { teamId: 'tm_3', teamName: 'SEM9 Esports', tag: 'SEM9', placement: 2, kills: 7, placePts: 6, totalPts: 13, wwcd: 0 },
          { teamId: 'tm_1', teamName: 'Geek Fam MY', tag: 'GEEK', placement: 3, kills: 9, placePts: 5, totalPts: 14, wwcd: 0 },
          { teamId: 'tm_9', teamName: 'HomeBois', tag: 'HB', placement: 4, kills: 3, placePts: 4, totalPts: 7, wwcd: 0 },
          { teamId: 'tm_12', teamName: 'Crit VIP', tag: 'CRIT', placement: 5, kills: 2, placePts: 3, totalPts: 5, wwcd: 0 }
        ]
      }
    ]
  }
];

const DEFAULT_POSTS = [
  {
    id: 'post_1',
    author: 'DamRUDE',
    playerRole: 'IGL & Rusher',
    teamName: 'Geek Fam MY',
    teamTag: 'GEEK',
    type: 'achievement',
    title: 'CHAMPION: PMSL SEA Spring 2025 Qualifier Grand Final',
    tournament: 'PMSL SEA Spring 2025',
    rank: '1st Place (Champion)',
    caption: 'Alhamdulillah, back-to-back WWCD on day 3 secured our championship slot! Big shoutout to our analyst and all fans yang non-stop support kami.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    likes: 184,
    liked: false,
    date: '2 days ago',
    tags: ['#PMSL', '#GeekFam', '#WWCD', '#Champion']
  },
  {
    id: 'post_2',
    author: 'uHigh',
    playerRole: 'Entry Fragger',
    teamName: 'SEM9 Esports',
    teamTag: 'SEM9',
    type: 'clip',
    title: '1v4 Clutch vs Vampire Esports in Miramar Final Circle',
    tournament: 'Tier 1 Pro Scrim Match 2',
    rank: 'WWCD Clutch',
    caption: 'M416 + DMR spray down when all teammates wiped early. Quick reflexes and high ground advantage!',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    likes: 342,
    liked: true,
    date: '3 days ago',
    tags: ['#Clutch', '#1v4', '#PUBGMobile', '#Highlights']
  },
  {
    id: 'post_3',
    author: 'Schwengg',
    playerRole: 'Support / Sniper',
    teamName: 'Vampire Esports',
    teamTag: 'VPE',
    type: 'clip',
    title: 'Double AWM Headshot through Smoke @ Pecado Hills',
    tournament: 'Predator League Invitational',
    rank: 'Top Fragger',
    caption: 'Sound cue prediction on the rotation buggy. Clean double tap.',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    likes: 215,
    liked: false,
    date: '5 days ago',
    tags: ['#Sniper', '#AWM', '#PUBGM', '#Headshot']
  },
  {
    id: 'post_4',
    author: 'Yoodo Management',
    playerRole: 'Official Org',
    teamName: 'Yoodo Alliance',
    teamTag: 'YALL',
    type: 'achievement',
    title: 'Top 3 Finish & Qualified for PMGO Brazil 2025',
    tournament: 'PUBG Mobile Global Open Qualifier',
    rank: '3rd Place Overall',
    caption: 'Proud of the boys consistency across 18 matches. Time to represent Malaysia in the international stage!',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    likes: 420,
    liked: false,
    date: '1 week ago',
    tags: ['#PMGO', '#YoodoAlliance', '#RoadToBrazil']
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('admin');
  const [scrims, setScrims] = useState(() => {
    const saved = localStorage.getItem('pubgm_scrims');
    return saved ? JSON.parse(saved) : DEFAULT_SCRIMS;
  });
  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('pubgm_posts');
    return saved ? JSON.parse(saved) : DEFAULT_POSTS;
  });
  const [selectedScrimId, setSelectedScrimId] = useState(scrims[0]?.id || '');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem('pubgm_scrims', JSON.stringify(scrims));
  }, [scrims]);

  useEffect(() => {
    localStorage.setItem('pubgm_posts', JSON.stringify(posts));
  }, [posts]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // TAB 1: SCRIM ADMIN & POINT CALCULATOR
  // -------------------------------------------------------------
  const [newScrimTitle, setNewScrimTitle] = useState('');
  const [newScrimDate, setNewScrimDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);
  const [inputMap, setInputMap] = useState('Erangel');
  
  const [matchSlots, setMatchSlots] = useState(() => {
    return DEFAULT_TEAMS.map((tm, idx) => ({
      slot: idx + 1,
      teamId: tm.id,
      teamName: tm.name,
      tag: tm.tag,
      placement: idx + 1,
      kills: 0,
      placePts: getPlacementPoints(idx + 1),
      totalPts: getPlacementPoints(idx + 1)
    }));
  });

  const activeScrim = useMemo(() => {
    return scrims.find(s => s.id === selectedScrimId) || scrims[0];
  }, [scrims, selectedScrimId]);

  const handleSlotChange = (index, field, value) => {
    setMatchSlots(prev => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === 'placement') {
        const p = Math.max(1, Math.min(16, parseInt(value, 10) || 16));
        row.placement = p;
        row.placePts = getPlacementPoints(p);
      } else if (field === 'kills') {
        row.kills = Math.max(0, parseInt(value, 10) || 0);
      } else if (field === 'teamName') {
        row.teamName = value;
        const matched = DEFAULT_TEAMS.find(t => t.name.toLowerCase() === value.toLowerCase() || t.tag.toLowerCase() === value.toLowerCase());
        if (matched) {
          row.teamId = matched.id;
          row.tag = matched.tag;
        } else {
          row.teamId = `custom_${value.replace(/\s+/g, '_').toLowerCase()}`; row.tag = value.slice(0, 4).toUpperCase(); } }  row.totalPts = row.placePts + row.kills; updated[index] = row; return updated; }); };  const handleRandomizeTestData = () => { const placements = Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5); setMatchSlots(prev => { return prev.map((row, idx) => { const place = placements[idx]; const kills = Math.floor(Math.random() * 12); const placePts = getPlacementPoints(place); return { ...row, placement: place, kills: kills, placePts: placePts, totalPts: placePts + kills }; }); }); showToast('⚡ Random Match Test Data Generated!'); };  const handleSaveMatchScore = () => { if (!activeScrim) return;  const placeSet = new Set(matchSlots.map(s => s.placement)); if (placeSet.size < matchSlots.length) { if (!window.confirm?.('Warning: Terdapat kedudukan (placement) yang sama berulang. Adakah anda ingin teruskan simpan?')) { return; } }  const compiledResults = matchSlots.map(s => ({ teamId: s.teamId \vert{}\vert{} `tm_${s.teamName}`,
      teamName: s.teamName,
      tag: s.tag || s.teamName.slice(0, 4).toUpperCase(),
      placement: Number(s.placement),
      kills: Number(s.kills),
      placePts: Number(s.placePts),
      totalPts: Number(s.totalPts),
      wwcd: Number(s.placement) === 1 ? 1 : 0
    }));

    setScrims(prev => {
      return prev.map(s => {
        if (s.id !== activeScrim.id) return s;
        const existingMatches = s.matches ? [...s.matches] : [];
        const matchData = {
          matchNo: selectedMatchIdx + 1,
          map: inputMap,
          results: compiledResults
        };

        if (existingMatches[selectedMatchIdx]) {
          existingMatches[selectedMatchIdx] = matchData;
        } else {
          existingMatches.push(matchData);
        }

        return {
          ...s,
          matches: existingMatches,
          totalMatches: existingMatches.length
        };
      });
    });

    showToast(`✅ Match ${selectedMatchIdx + 1} (${inputMap}) berjaya disimpan & Leaderboard dikemaskini!`);
  };

  const handleCreateNewScrim = (e) => {
    e.preventDefault();
    if (!newScrimTitle.trim()) return;

    const newId = `scrim_${Date.now()}`;
    const newSession = {
      id: newId,
      title: newScrimTitle,
      date: newScrimDate || new Date().toISOString().split('T')[0],
      totalMatches: 0,
      status: 'Active',
      matches: []
    };

    setScrims([newSession, ...scrims]);
    setSelectedScrimId(newId);
    setSelectedMatchIdx(0);
    setNewScrimTitle('');
    showToast('🏆 Sesi Scrim baru berjaya dicipta!');
  };

  // -------------------------------------------------------------
  // TAB 2: LIVE LEADERBOARD ENGINE
  // -------------------------------------------------------------
  const [leaderboardFilter, setLeaderboardFilter] = useState('overall');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const leaderboardData = useMemo(() => {
    if (!activeScrim || !activeScrim.matches || activeScrim.matches.length === 0) {
      return [];
    }

    if (leaderboardFilter === 'overall') {
      const summaryMap = {};

      activeScrim.matches.forEach((m) => {
        (m.results || []).forEach(r => {
          if (!summaryMap[r.teamId]) {
            summaryMap[r.teamId] = {
              teamId: r.teamId,
              teamName: r.teamName,
              tag: r.tag,
              matchesPlayed: 0,
              wwcd: 0,
              placePts: 0,
              killPts: 0,
              totalPts: 0
            };
          }
          summaryMap[r.teamId].matchesPlayed += 1;
          summaryMap[r.teamId].wwcd += (r.wwcd || (r.placement === 1 ? 1 : 0));
          summaryMap[r.teamId].placePts += r.placePts;
          summaryMap[r.teamId].killPts += r.kills;
          summaryMap[r.teamId].totalPts += r.totalPts;
        });
      });

      const list = Object.values(summaryMap);
      list.sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
        if (b.placePts !== a.placePts) return b.placePts - a.placePts;
        return b.killPts - a.killPts;
      });

      return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
    } else {
      const mIdx = parseInt(leaderboardFilter, 10);
      const match = activeScrim.matches[mIdx];
      if (!match) return [];

      const list = [...(match.results || [])].sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.placePts !== a.placePts) return b.placePts - a.placePts;
        return b.kills - a.kills;
      });

      return list.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        matchesPlayed: 1,
        killPts: item.kills
      }));
    }
  }, [activeScrim, leaderboardFilter]);

  const handleCopyDiscordText = () => {
    if (!leaderboardData.length) return;

    let output = `🏆 **${activeScrim?.title.toUpperCase()}**\n`;
    output += `📅 Date: ${activeScrim?.date} | Mode: ${leaderboardFilter === 'overall' ? 'OVERALL STANDINGS' : `MATCH ${parseInt(leaderboardFilter, 10) + 1}`}\n`; output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`; output += `# \vert{} TEAM \vert{} MATCH \vert{} WWCD \vert{} PLACE \vert{} KILLS \vert{} TOTAL\n`; output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;  leaderboardData.forEach((row) => { const rankBadge = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `${row.rank}.`;
      output += `${rankBadge} [${row.tag}] ${row.teamName.padEnd(16)} \vert{}${row.matchesPlayed}M | ${row.wwcd}W \vert{}${row.placePts}P | ${row.killPts}K \vert{} **${row.totalPts} PTS**\n`;
    });

    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*PUBG Mobile Automated Point Calculation by Esports Scrim Hub*`;

    navigator.clipboard.writeText(output).then(() => {
      setCopyFeedback(true);
      showToast('📋 Standings disalin ke clipboard! Sedia paste ke Discord / WhatsApp.');
      setTimeout(() => setCopyFeedback(false), 2500);
    });
  };

  // -------------------------------------------------------------
  // TAB 3: PUBLIC TEAM DATABASE & SEARCH
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamProfile, setSelectedTeamProfile] = useState(DEFAULT_TEAMS[0].name);

  const teamsStats = useMemo(() => {
    const stats = {};

    DEFAULT_TEAMS.forEach(t => {
      stats[t.name] = {
        name: t.name,
        tag: t.tag,
        region: t.region,
        logo: t.logo,
        totalMatches: 0,
        totalWWCD: 0,
        totalKills: 0,
        totalPts: 0,
        scrimHistory: []
      };
    });

    scrims.forEach(scrim => {
      (scrim.matches || []).forEach(match => {
        (match.results || []).forEach(res => {
          const tName = res.teamName;
          if (!stats[tName]) {
            stats[tName] = {
              name: tName,
              tag: res.tag,
              region: 'Challenger',
              logo: res.tag.slice(0, 2),
              totalMatches: 0,
              totalWWCD: 0,
              totalKills: 0,
              totalPts: 0,
              scrimHistory: []
            };
          }

          stats[tName].totalMatches += 1;
          stats[tName].totalWWCD += (res.wwcd || (res.placement === 1 ? 1 : 0));
          stats[tName].totalKills += res.kills;
          stats[tName].totalPts += res.totalPts;

          stats[tName].scrimHistory.push({
            scrimTitle: scrim.title,
            date: scrim.date,
            map: match.map,
            matchNo: match.matchNo,
            placement: res.placement,
            kills: res.kills,
            totalPts: res.totalPts,
            wwcd: res.placement === 1
          });
        });
      });
    });

    return stats;
  }, [scrims]);

  const filteredTeamList = useMemo(() => {
    return Object.values(teamsStats).filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamsStats, searchQuery]);

  const activeTeamData = teamsStats[selectedTeamProfile] || Object.values(teamsStats)[0];

  // -------------------------------------------------------------
  // TAB 4: GAMER SHOWCASE & PORTFOLIO (BEHANCE STYLE)
  // -------------------------------------------------------------
  const [showcaseFilter, setShowcaseFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newAuthor, setNewAuthor] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('Fragger');
  const [newTeamTag, setNewTeamTag] = useState('GEEK');
  const [newPostType, setNewPostType] = useState('clip');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newTournament, setNewTournament] = useState('');
  const [newRankBadge, setNewRankBadge] = useState('1st Place');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');

  const handleLikePost = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    const newPost = {
      id: `post_${Date.now()}`, author: newAuthor \vert{}\vert{} 'Pro Player', playerRole: newPlayerRole, teamName: newTeamTag, teamTag: newTeamTag, type: newPostType, title: newPostTitle, tournament: newTournament \vert{}\vert{} 'Community Scrim Tournament', rank: newRankBadge, caption: newCaption \vert{}\vert{} 'Check out this match highlight!', mediaType: newPostType === 'clip' ? 'video' : 'image', mediaUrl: newMediaUrl \vert{}\vert{} (newPostType === 'clip' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'), likes: 1, liked: true, date: 'Just now', tags: ['#PUBGM', `#${newTeamTag}`, '#Portfolio']
    };

    setPosts([newPost, ...posts]);
    setIsModalOpen(false);
    showToast('✨ Portfolio showcase berjaya diterbitkan!');

    setNewPostTitle('');
    setNewTournament('');
    setNewMediaUrl('');
    setNewCaption('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 px-4 py-3 rounded-lg shadow-xl font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Swords className="w-6 h-6 text-slate-950 font-black" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
                  PUBGM SCRIMHUB
                </span>
                <span className="text-xs block text-slate-400 -mt-1 font-medium tracking-tight">
                  Point Engine & Player Portfolio
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-1 sm:space-x-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Scrim</span>
                <span className="sm:hidden">Admin</span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'teams'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Team Database</span>
                <span className="sm:hidden">Teams</span>
              </button>

              <button
                onClick={() => setActiveTab('showcase')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'showcase'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Showcase</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ========================================================= */}
        {/* VIEW 1: ADMIN SCRIM & POINT CALCULATOR                    */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            
            {/* Top Bar: Scrim Session Select & Create Scrim Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Select Active Scrim */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Active Scrim Session
                </label>
                <select
                  value={selectedScrimId}
                  onChange={(e) => setSelectedScrimId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {scrims.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.date}) - {s.matches?.length || 0} Match(es)
                    </option>
                  ))}
                </select>

                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                  <span>Standard 10-6-5-4-3-2-1 Scoring</span>
                  <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">1 Kill = 1 Pt</span>
                </div>
              </div>

              {/* Create New Scrim */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <form onSubmit={handleCreateNewScrim} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Create New Scrim
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PMSL SEA Tier 1 Night Scrim"
                      value={newScrimTitle}
                      onChange={(e) => setNewScrimTitle(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newScrimDate}
                      onChange={(e) => setNewScrimDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Match Input Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
                
                {/* Match Tabs */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase mr-2">Match:</span>
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMatchIdx(idx)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        selectedMatchIdx === idx
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      M{idx + 1}
                    </button>
                  ))}
                </div>

                {/* Map Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Map:</span>
                  <select
                    value={inputMap}
                    onChange={(e) => setInputMap(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Erangel">Erangel</option>
                    <option value="Miramar">Miramar</option>
                    <option value="Sanhok">Sanhok</option>
                    <option value="Vikendi">Vikendi</option>
                    <option value="Rondo">Rondo</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    onClick={handleRandomizeTestData}
                    title="Generate randomized test values"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center space-x-1 font-medium transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Quick Fill Demo</span>
                  </button>

                  <button
                    onClick={handleSaveMatchScore}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Match {selectedMatchIdx + 1}</span>
                  </button>
                </div>
              </div>

              {/* Table of 16 slots */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Slot</th>
                      <th className="py-3 px-4 min-w-[200px]">Team Name / Clan</th>
                      <th className="py-3 px-4 w-28 text-center">Placement (1-16)</th>
                      <th className="py-3 px-4 w-28 text-center">Kills</th>
                      <th className="py-3 px-4 w-24 text-center">Place Pts</th>
                      <th className="py-3 px-4 w-24 text-center text-amber-400">Total Pts</th>
                      <th className="py-3 px-4 w-24 text-center">WWCD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {matchSlots.map((row, idx) => {
                      const isWWCD = Number(row.placement) === 1;
                      return (
                        <tr key={idx} className={isWWCD ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'}>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-bold">
                            #{row.slot}
                          </td>
                          <td className="py-2.5 px-4 font-sans">
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-500 rounded px-2.5 py-1 text-slate-100 font-semibold"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              min="1"
                              max="16"
                              value={row.placement}
                              onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                              className="w-16 bg-slate-950 border border-slate-700 text-center rounded py-1 font-bold text-slate-200 focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={row.kills}
                              onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                              className="w-16 bg-slate-950 border border-slate-700 text-center rounded py-1 font-bold text-slate-200 focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-400 font-bold">
                            {row.placePts}
                          </td>
                          <td className="py-2.5 px-4 text-center text-amber-400 font-extrabold text-sm">
                            {row.totalPts}
                          </td>
                          <td className="py-2.5 px-4 text-center font-sans">
                            {isWWCD ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950">
                                🍗 WWCD
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Note */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
                <span>Official Scoring: 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7-8th=1, 9-16th=0. 1 Kill = 1 Point.</span>
                <span className="text-slate-300 font-semibold">Changes are saved to local database upon clicking 'Save Match'.</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: LIVE LEADERBOARD ENGINE                           */}
        {/* ========================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            
            {/* Control & Header Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">
                  Scrim Tournament Standings
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                  <span>{activeScrim?.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeScrim?.date}
                  </span>
                </h1>
              </div>

              {/* Filter and Discord Export */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Scrim Selector */}
                <select
                  value={selectedScrimId}
                  onChange={(e) => setSelectedScrimId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  {scrims.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                {/* Match Filter pills */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setLeaderboardFilter('overall')}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      leaderboardFilter === 'overall' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Overall
                  </button>
                  {activeScrim?.matches?.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLeaderboardFilter(idx.toString())}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${ leaderboardFilter === idx.toString() ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200' }`} > M{m.matchNo} ({m.map.slice(0, 3)}) </button> ))} </div>  {/* Export text for WhatsApp / Discord */} <button onClick={handleCopyDiscordText} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors" > {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />} <span>{copyFeedback ? 'Copied!' : 'Copy Discord/WA'}</span> </button> </div> </div>  {/* Standings Table */} <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg"> {leaderboardData.length === 0 ? ( <div className="p-12 text-center text-slate-500"> <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /> <p className="font-bold text-slate-400">Belum ada match data untuk scrim ini.</p> <p className="text-xs mt-1">Sila pergi ke tab "Admin Scrim" untuk input dan simpan perlawanan pertama.</p> </div> ) : ( <div className="overflow-x-auto"> <table className="w-full text-left"> <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800"> <tr> <th className="py-3 px-4 w-16 text-center">Rank</th> <th className="py-3 px-4 min-w-[220px]">Team</th> <th className="py-3 px-4 text-center">Matches</th> <th className="py-3 px-4 text-center">🍗 WWCD</th> <th className="py-3 px-4 text-center">Placement Pts</th> <th className="py-3 px-4 text-center">Kill Pts</th> <th className="py-3 px-4 text-center text-amber-400 font-extrabold text-sm">Total Points</th> </tr> </thead> <tbody className="divide-y divide-slate-800 font-sans text-sm"> {leaderboardData.map((row) => { const isTop3 = row.rank <= 3; return ( <tr key={row.teamId} className={`transition-colors ${
                              row.rank === 1 ? 'bg-amber-500/10 hover:bg-amber-500/15' :
                              row.rank === 2 ? 'bg-slate-800/40 hover:bg-slate-800/70' :
                              row.rank === 3 ? 'bg-amber-900/10 hover:bg-amber-900/20' :
                              'hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-bold">
                              {row.rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20">
                                  1
                                </span>
                              ) : row.rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black">
                                  2
                                </span>
                              ) : row.rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-slate-100 font-black">
                                  3
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono font-medium">#{row.rank}</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-400">
                                  {row.tag || 'PUBG'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                                    <span>{row.teamName}</span>
                                    {isTop3 && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    TAG: {row.tag}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center font-mono text-slate-300">
                              {row.matchesPlayed}
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-bold">
                              {row.wwcd > 0 ? (
                                <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-black">
                                  {row.wwcd}
                                </span>
                              ) : (
                                <span className="text-slate-600">0</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center font-mono text-slate-300">
                              {row.placePts}
                            </td>

                            <td className="py-3 px-4 text-center font-mono text-slate-300">
                              {row.killPts}
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-black text-amber-400 text-base">
                              {row.totalPts}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PUBLIC TEAM DATABASE & CAREER STATS SEARCH        */}
        {/* ========================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-100">Public Team & Player Database</h2>
                  <p className="text-xs text-slate-400">Cari rekod mana-mana pasukan, rekod point scrim lampau & peratusan kemenangan.</p>
                </div>
                
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search team name or tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                {filteredTeamList.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTeamProfile(t.name)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                      selectedTeamProfile === t.name 
                        ? 'bg-amber-500 text-slate-950 font-bold' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>[{t.tag}]</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeTeamData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-4 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                        {activeTeamData.tag}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Verified Esports Roster
                        </div>
                        <h2 className="text-xl font-black text-slate-100">{activeTeamData.name}</h2>
                        <span className="text-xs text-slate-400">Region: {activeTeamData.region || 'SEA / Malaysia'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Matches</span>
                        <span className="text-xl font-black text-slate-100 font-mono">{activeTeamData.totalMatches}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">WWCD (Wins)</span>
                        <span className="text-xl font-black text-amber-400 font-mono">{activeTeamData.totalWWCD}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Kills</span>
                        <span className="text-xl font-black text-slate-100 font-mono">{activeTeamData.totalKills}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Win Rate</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          {activeTeamData.totalMatches > 0 
                            ? ((activeTeamData.totalWWCD / activeTeamData.totalMatches) * 100).toFixed(1) + '%' 
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                    <span className="font-bold text-slate-300 block mb-1">Scout / Analyst Note:</span>
                    Profil ini merekodkan point yang disahkan daripada penganjur scrim rasmi. Pasukan luar boleh menyemak konsistensi kedudukan dan corak pembunuhan (kills) dalam sejarah perlawanan di sebelah.
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <span>Rekod Perlawanan Scrim Lampau ({activeTeamData.scrimHistory?.length || 0})</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Real-time aggregate</span>
                  </div>

                  {activeTeamData.scrimHistory && activeTeamData.scrimHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-4">Date & Scrim</th>
                            <th className="py-2.5 px-4 text-center">Match / Map</th>
                            <th className="py-2.5 px-4 text-center">Placement</th>
                            <th className="py-2.5 px-4 text-center">Kills</th>
                            <th className="py-2.5 px-4 text-center text-amber-400 font-bold">Total Pts</th>
                            <th className="py-2.5 px-4 text-center">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                          {activeTeamData.scrimHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-sans">
                                <div className="font-bold text-slate-200">{item.scrimTitle}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.date}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                Match {item.matchNo} ({item.map})
                              </td>
                              <td className="py-3 px-4 text-center font-bold">
                                #{item.placement}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {item.kills}
                              </td>
                              <td className="py-3 px-4 text-center text-amber-400 font-black">
                                {item.totalPts}
                              </td>
                              <td className="py-3 px-4 text-center font-sans">
                                {item.wwcd ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                                    WWCD
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-medium text-[11px]">Rank #{item.placement}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-10 text-center text-slate-500 text-xs">
                      Tiada rekod scrim yang direkodkan lagi untuk pasukan ini.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: GAMER SHOWCASE & PORTFOLIO (BEHANCE STYLE)        */}
        {/* ========================================================= */}
        {activeTab === 'showcase' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h1 className="text-xl font-black text-slate-100">Gamer Portfolio & Highlight Feed</h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Platform ala Behance untuk pemain & clan PUBGM pamerkan pencapaian trofi, 1v4 clutch clip, dan tournament history.
                </p>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setShowcaseFilter('all')}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      showcaseFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('achievement')}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      showcaseFilter === 'achievement' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🏆 Tournaments
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('clip')}
                    className={`px-3 py-1 rounded font-bold transition-all ${
                      showcaseFilter === 'clip' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🎬 Clips
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Achievement / Clip</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {posts
                .filter(p => showcaseFilter === 'all' || p.type === showcaseFilter)
                .map((post) => (
                  <div
                    key={post.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div className="relative bg-black aspect-video overflow-hidden flex items-center justify-center">
                      {post.mediaType === 'video' ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      <div className="absolute top-3 left-3 flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide flex items-center space-x-1 ${
                          post.type === 'achievement' 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {post.type === 'achievement' ? <Trophy className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{post.type === 'achievement' ? 'Achievement' : 'Highlight Clip'}</span>
                        </span>
                        {post.rank && (
                          <span className="bg-slate-950/80 backdrop-blur text-slate-200 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {post.rank}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                              {post.teamTag?.slice(0, 2) || 'PG'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                                <span>{post.author}</span>
                                <span className="text-slate-500 font-normal">({post.teamTag})</span>
                              </div>
                              <div className="text-[10px] text-slate-400">{post.playerRole} • {post.date}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {post.tournament}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-slate-100 group-hover:text-amber-400 transition-colors mb-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                          {post.caption}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex flex-wrap gap-1">
                          {post.tags?.map((tg, idx) => (
                            <span key={idx} className="text-[10px] text-amber-500/80 font-mono">
                              {tg}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${ post.liked ? 'text-red-400 bg-red-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' }`} > <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-current text-red-500' : ''}`} />
                          <span className="font-bold">{post.likes}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
            </div>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL: CREATE SHOWCASE POST (BEHANCE STYLE)               */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100">Publish to Gamer Portfolio</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Player / IGN</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. uHigh / DamRUDE"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Team Tag / Clan</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GEEK / YALL"
                    value={newTeamTag}
                    onChange={(e) => setNewTeamTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Post Type</label>
                  <select
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  >
                    <option value="clip">Gameplay Highlight Clip</option>
                    <option value="achievement">Tournament Trophy / Achievement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Tournament / Event</label>
                  <input
                    type="text"
                    placeholder="e.g. PMSL SEA Spring Qualifier"
                    value={newTournament}
                    onChange={(e) => setNewTournament(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1v4 Clutch vs Vampire Esports in Pecado"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Badge / Rank</label>
                <input
                  type="text"
                  placeholder="e.g. Champion / 1st Place / MVP / 15 Kills"
                  value={newRankBadge}
                  onChange={(e) => setNewRankBadge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  Media URL (Direct MP4 video or Poster Image URL)
                </label>
                <input
                  type="url"
                  placeholder="https://... (Leave blank to use default demo video/image)"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Tip: Boleh gunakan link fail .mp4 atau poster gambar Unsplash/Imgur.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Description & Story</label>
                <textarea
                  rows="3"
                  placeholder="Ceritakan serba sedikit tentang match tersebut atau strategi clutch anda..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  Publish Showcase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PUBGM Scrim Management & Player Showcase Hub</span>
          <span className="font-mono text-[11px] text-slate-600">PUBGM Scoring Rules (10-6-5-4-3-2-1) Engine</span>
        </div>
      </footer>

    </div>
  );
}