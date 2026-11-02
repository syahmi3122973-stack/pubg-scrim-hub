import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Shield, Video, Search, Plus, Award, 
  Copy, Check, AlertTriangle, RotateCcw, ChevronRight, 
  Layers, MapPin, Eye, ExternalLink, Flame
} from 'lucide-react';

const PUBGM_PTS_TABLE = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

const DEFAULT_TEAMS = [
  { id: 't1', name: 'Geek Fam MY', tag: 'GEEK' },
  { id: 't2', name: 'Yoodo Alliance', tag: 'YALL' },
  { id: 't3', name: 'SEM9 Esports', tag: 'SEM9' },
  { id: 't4', name: 'Selangor Red Giants', tag: 'SRG' },
  { id: 't5', name: 'Todak Gaming', tag: 'TDK' },
  { id: 't6', name: 'HomeBois', tag: 'HB' },
  { id: 't7', name: 'Team Secret MY', tag: 'TS' },
  { id: 't8', name: 'Farang Lejund', tag: 'FL' },
  { id: 't9', name: 'Crit Esports', tag: 'CRIT' },
  { id: 't10', name: 'RSG Malaysia', tag: 'RSG' },
  { id: 't11', name: 'Entropiq MY', tag: 'EIQ' },
  { id: 't12', name: 'Dingoz Esports', tag: 'DGZ' },
  { id: 't13', name: 'Vampire Esports', tag: 'VPE' },
  { id: 't14', name: 'Genatos Esports', tag: 'GNT' },
  { id: 't15', name: 'Axis Esports', tag: 'AXIS' },
  { id: 't16', name: 'Raptor Squad', tag: 'RPT' },
];

function generateInitialSlots(teamsList) {
  return Array.from({ length: 16 }, (_, i) => ({
    slot: i + 1,
    teamName: teamsList[i] ? teamsList[i].name : `Team #${i + 1}`,
    placement: i + 1,
    kills: 0,
    placementPts: PUBGM_PTS_TABLE[i + 1] || 0,
    totalPts: PUBGM_PTS_TABLE[i + 1] || 0
  }));
}

export default function App() {
  const [activeTab, setActiveTab] = useState('calc');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);

  // 1. MATCH SESSIONS (Multi-Match Support)
  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('pubg_scrim_matches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 1, title: 'Match 1', map: 'Erangel', slots: generateInitialSlots(DEFAULT_TEAMS) },
      { id: 2, title: 'Match 2', map: 'Miramar', slots: generateInitialSlots(DEFAULT_TEAMS) },
      { id: 3, title: 'Match 3', map: 'Sanhok', slots: generateInitialSlots(DEFAULT_TEAMS) },
    ];
  });

  const [currentMatchId, setCurrentMatchId] = useState(1);
  const [leaderboardFilter, setLeaderboardFilter] = useState('overall'); // 'overall' or match id

  // 2. SHOWCASE POSTS
  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('pubg_scrim_posts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 1,
        title: 'PMGC Grand Final - 1v3 Clutch vs Bigetron RA',
        author: 'uHigh',
        team: 'SEM9',
        tag: 'Highlight',
        date: '2 jam lepas',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      {
        id: 2,
        title: 'Champion PMSL SEA Spring 2026 Trophy Showcase',
        author: 'DamRUDE',
        team: 'Geek Fam MY',
        tag: 'Tournament Win',
        date: '1 hari lepas',
        videoUrl: ''
      }
    ];
  });

  // Modal State for New Post
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', author: '', team: '', videoUrl: '', tag: 'Highlight' });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('pubg_scrim_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('pubg_scrim_posts', JSON.stringify(posts));
  }, [posts]);

  // Current Active Match Object
  const currentMatch = useMemo(() => {
    return matches.find(m => m.id === currentMatchId) || matches[0];
  }, [matches, currentMatchId]);

  // Check for Duplicate Placement Ranks
  const duplicateRanks = useMemo(() => {
    const counts = {};
    currentMatch.slots.forEach(s => {
      counts[s.placement] = (counts[s.placement] || 0) + 1;
    });
    return Object.keys(counts).filter(rank => counts[rank] > 1);
  }, [currentMatch]);

  // Handle Slot Input Change
  const handleSlotChange = (index, field, value) => {
    setMatches(prevMatches => {
      return prevMatches.map(m => {
        if (m.id !== currentMatchId) return m;

        const updatedSlots = [...m.slots];
        if (field === 'teamName') {
          updatedSlots[index].teamName = value;
        } else {
          const numVal = Math.max(0, parseInt(value, 10) || 0);
          updatedSlots[index][field] = numVal;

          if (field === 'placement') {
            updatedSlots[index].placementPts = PUBGM_PTS_TABLE[numVal] ?? 0;
          }
          updatedSlots[index].totalPts = updatedSlots[index].placementPts + updatedSlots[index].kills;
        }
        return { ...m, slots: updatedSlots };
      });
    });
  };

  // Quick Random Demo for current match
  const handleQuickDemo = () => {
    setMatches(prevMatches => {
      return prevMatches.map(m => {
        if (m.id !== currentMatchId) return m;

        // Shuffle ranks 1-16 without duplicates
        const ranks = Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        const demoSlots = m.slots.map((s, idx) => {
          const rank = ranks[idx];
          const kills = Math.floor(Math.random() * 8);
          const placePts = PUBGM_PTS_TABLE[rank] || 0;
          return {
            ...s,
            placement: rank,
            kills: kills,
            placementPts: placePts,
            totalPts: placePts + kills
          };
        });
        return { ...m, slots: demoSlots };
      });
    });
  };

  // Add Match
  const handleAddMatch = () => {
    const nextId = matches.length + 1;
    const maps = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'];
    const assignedMap = maps[(nextId - 1) % maps.length];

    // Inherit team names from current match
    const newSlots = currentMatch.slots.map(s => ({
      slot: s.slot,
      teamName: s.teamName,
      placement: s.slot,
      kills: 0,
      placementPts: PUBGM_PTS_TABLE[s.slot] || 0,
      totalPts: PUBGM_PTS_TABLE[s.slot] || 0
    }));

    setMatches([...matches, { id: nextId, title: `Match ${nextId}`, map: assignedMap, slots: newSlots }]);
    setCurrentMatchId(nextId);
  };

  // Reset Scrim
  const handleResetData = () => {
    if (window.confirm('Reset semua data scrim kepada asal?')) {
      localStorage.removeItem('pubg_scrim_matches');
      setMatches([
        { id: 1, title: 'Match 1', map: 'Erangel', slots: generateInitialSlots(DEFAULT_TEAMS) },
        { id: 2, title: 'Match 2', map: 'Miramar', slots: generateInitialSlots(DEFAULT_TEAMS) },
        { id: 3, title: 'Match 3', map: 'Sanhok', slots: generateInitialSlots(DEFAULT_TEAMS) },
      ]);
      setCurrentMatchId(1);
    }
  };

  // Aggregated Overall Leaderboard
  const overallLeaderboard = useMemo(() => {
    const teamStats = {};

    matches.forEach(match => {
      match.slots.forEach(slot => {
        const key = slot.teamName.trim().toLowerCase();
        if (!teamStats[key]) {
          teamStats[key] = {
            teamName: slot.teamName,
            matchesPlayed: 0,
            wwcd: 0,
            kills: 0,
            placementPts: 0,
            totalPts: 0,
            history: []
          };
        }
        teamStats[key].matchesPlayed += 1;
        if (slot.placement === 1) teamStats[key].wwcd += 1;
        teamStats[key].kills += slot.kills;
        teamStats[key].placementPts += slot.placementPts;
        teamStats[key].totalPts += slot.totalPts;
        teamStats[key].history.push({
          matchTitle: match.title,
          map: match.map,
          placement: slot.placement,
          kills: slot.kills,
          totalPts: slot.totalPts
        });
      });
    });

    return Object.values(teamStats).sort((a, b) => {
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
      if (b.placementPts !== a.placementPts) return b.placementPts - a.placementPts;
      return b.kills - a.kills;
    });
  }, [matches]);

  // Selected Match Leaderboard
  const singleMatchLeaderboard = useMemo(() => {
    if (leaderboardFilter === 'overall') return [];
    const match = matches.find(m => m.id === Number(leaderboardFilter));
    if (!match) return [];
    return [...match.slots].sort((a, b) => {
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      if (a.placement === 1 && b.placement !== 1) return -1;
      if (b.placement === 1 && a.placement !== 1) return 1;
      return b.kills - a.kills;
    });
  }, [matches, leaderboardFilter]);

  // Helper: Format Embed URL for YouTube
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // Copy Standings Format
  const handleCopyStandings = () => {
    let text = '';
    if (leaderboardFilter === 'overall') {
      text = `🏆 *PUBG MOBILE SCRIM - OVERALL STANDINGS* (${matches.length} Matches)\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      overallLeaderboard.forEach((row, i) => {
        text += `${i + 1}. [${row.wwcd > 0 ? `👑 x${row.wwcd}` : `#${i + 1}`}] ${row.teamName} - ${row.totalPts} pts (${row.kills} Kills)\n`;
      });
    } else {
      const match = matches.find(m => m.id === Number(leaderboardFilter));
      text = `🏆 *PUBG MOBILE SCRIM - ${match?.title.toUpperCase()} (${match?.map.toUpperCase()})*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      singleMatchLeaderboard.forEach((row, i) => {
        text += `${i + 1}. [${row.placement === 1 ? '👑 WWCD' : `#${row.placement}`}] ${row.teamName} - ${row.totalPts} pts (${row.kills} Kills)\n`;
      });
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center text-xl shadow-lg shadow-amber-400/20">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider uppercase">PUBG Scrim Engine</h1>
              <span className="text-[10px] bg-amber-400/20 border border-amber-400/30 text-amber-300 px-2 py-0.5 rounded font-mono">PRO</span>
            </div>
            <p className="text-xs text-slate-400">Competitive Scoring, Public Stats & Player Portfolio</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('calc')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'calc' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Scrim Admin
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'board' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'teams' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" /> Team Database
          </button>
          <button
            onClick={() => setActiveTab('showcase')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'showcase' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" /> Showcase
          </button>
        </nav>
      </header>

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* ============================================================ */}
        {/* 1. SCRIM ADMIN & MATCH ENTRY                                  */}
        {/* ============================================================ */}
        {activeTab === 'calc' && (
          <div className="space-y-5">
            {/* Session Match Selector Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Matches:</span>
                {matches.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setCurrentMatchId(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      currentMatchId === m.id
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.title}</span>
                    <span className="text-[10px] opacity-75 font-normal">({m.map})</span>
                  </button>
                ))}
                <button
                  onClick={handleAddMatch}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Match
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickDemo}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition"
                >
                  Quick Fill Demo
                </button>
                <button
                  onClick={handleResetData}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* Duplicate Placement Warning */}
            {duplicateRanks.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Amaran Ralat Kedudukan:</strong> Rank <strong>#{duplicateRanks.join(', #')}</strong> dimasukkan lebih dari sekali. Sila pastikan setiap pasukan mempunyai kedudukan unik (1 hingga 16).
                </span>
              </div>
            )}

            {/* Matrix Table */}
            <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{currentMatch.title} — {currentMatch.map}</span>
                  <span className="text-xs text-slate-400">• Standard Official PUBGM (1st: 10pts, 2nd: 6pts, 1 Kill: 1pt)</span>
                </div>
                <button
                  onClick={() => {
                    setLeaderboardFilter(String(currentMatch.id));
                    setActiveTab('board');
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  Lihat Standings Match Ini <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-3 w-14 text-center">Slot</th>
                      <th className="p-3">Team Name</th>
                      <th className="p-3 w-28 text-center">Placement</th>
                      <th className="p-3 w-28 text-center">Kills</th>
                      <th className="p-3 w-28 text-center">Place Pts</th>
                      <th className="p-3 w-28 text-right font-bold text-amber-400 pr-5">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {currentMatch.slots.map((row, idx) => {
                      const isDup = duplicateRanks.includes(String(row.placement));
                      return (
                        <tr key={row.slot} className="hover:bg-slate-900/50 transition">
                          <td className="p-3 text-center text-slate-500 font-mono">#{row.slot}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                              className="bg-transparent border-b border-slate-700/60 focus:border-amber-400 focus:outline-none w-full max-w-sm font-semibold text-slate-200"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max="16"
                              value={row.placement}
                              onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                              className={`w-16 border rounded p-1 text-center font-bold transition ${
                                isDup 
                                  ? 'bg-rose-950/50 border-rose-500 text-rose-300' 
                                  : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400'
                              }`}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={row.kills}
                              onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                              className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-slate-100 focus:border-amber-400"
                            />
                          </td>
                          <td className="p-3 text-center text-slate-400 font-mono font-medium">{row.placementPts}</td>
                          <td className="p-3 text-right font-black text-amber-400 text-sm font-mono pr-5">{row.totalPts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. LIVE LEADERBOARD (OVERALL & PER MATCH)                     */}
        {/* ============================================================ */}
        {activeTab === 'board' && (
          <div className="space-y-5">
            {/* Filter Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">View Mode:</span>
                <button
                  onClick={() => setLeaderboardFilter('overall')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    leaderboardFilter === 'overall'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  Overall Standings ({matches.length} Matches)
                </button>
                {matches.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setLeaderboardFilter(String(m.id))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      leaderboardFilter === String(m.id)
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyStandings}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Discord / WA Format'}
              </button>
            </div>

            {/* Overall Standings Table */}
            {leaderboardFilter === 'overall' ? (
              <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-3 w-16 text-center">Rank</th>
                      <th className="p-3">Team Name</th>
                      <th className="p-3 w-24 text-center">Matches</th>
                      <th className="p-3 w-24 text-center">WWCD</th>
                      <th className="p-3 w-24 text-center">Placement</th>
                      <th className="p-3 w-24 text-center">Kills</th>
                      <th className="p-3 w-28 text-right font-bold text-amber-400 pr-5">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {overallLeaderboard.map((team, idx) => (
                      <tr key={team.teamName} className="hover:bg-slate-900/60 transition">
                        <td className="p-3 text-center">
                          <span
                            className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg font-black text-xs ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : idx === 2
                                ? 'bg-amber-700 text-slate-100'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-sm text-slate-100 flex items-center gap-2">
                          {team.teamName}
                          {team.wwcd > 0 && (
                            <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                              👑 x{team.wwcd}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">{team.matchesPlayed}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-400">{team.wwcd}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{team.placementPts}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{team.kills}</td>
                        <td className="p-3 text-right font-black text-amber-400 text-base font-mono pr-5">{team.totalPts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Single Match Leaderboard
              <div className="grid gap-2">
                {singleMatchLeaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold flex items-center gap-2 text-sm">
                          {item.teamName}
                          {item.placement === 1 && (
                            <span className="text-[10px] uppercase font-black bg-amber-400/20 text-amber-400 border border-amber-400/40 px-2 py-0.5 rounded-full">
                              WWCD
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Placement: #{item.placement} ({item.placementPts} pts) • Kills: {item.kills}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-400 font-mono">{item.totalPts}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. TEAM DATABASE & PUBLIC HISTORY                             */}
        {/* ============================================================ */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari pasukan dalam database..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-400 text-slate-100 placeholder-slate-500"
                />
              </div>
              <p className="text-xs text-slate-400">
                Statistik ditarik terus daripada keseluruhan sesi scrim aktif.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overallLeaderboard
                .filter(t => t.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((team) => {
                  const winRate = team.matchesPlayed > 0 ? Math.round((team.wwcd / team.matchesPlayed) * 100) : 0;
                  return (
                    <div
                      key={team.teamName}
                      className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base text-slate-100">{team.teamName}</h3>
                            <span className="text-xs text-slate-400">Total Score: {team.totalPts} Pts</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
                            Win Rate {winRate}%
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-800/80 text-center text-xs">
                          <div>
                            <div className="text-slate-400 text-[10px] uppercase">Matches</div>
                            <div className="font-bold mt-0.5 font-mono">{team.matchesPlayed}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px] uppercase">WWCD</div>
                            <div className="font-bold text-amber-400 mt-0.5 font-mono">{team.wwcd}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px] uppercase">Kills</div>
                            <div className="font-bold mt-0.5 font-mono">{team.kills}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px] uppercase">Avg Pts</div>
                            <div className="font-bold text-emerald-400 mt-0.5 font-mono">
                              {(team.totalPts / (team.matchesPlayed || 1)).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTeamModal(team)}
                        className="w-full mt-2 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Lihat Rekod Sejarah Match
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Modal: Team Match History Breakdown */}
        {selectedTeamModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-slate-100">{selectedTeamModal.teamName}</h3>
                  <p className="text-xs text-slate-400">Rekod Terperinci Setiap Perlawanan</p>
                </div>
                <button
                  onClick={() => setSelectedTeamModal(null)}
                  className="text-slate-500 hover:text-slate-300 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {selectedTeamModal.history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{h.matchTitle} — {h.map}</div>
                      <div className="text-slate-400 text-[11px]">Kills: {h.kills}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold font-mono ${h.placement === 1 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {h.placement === 1 ? '👑 WWCD' : `Rank #${h.placement}`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{h.totalPts} PTS</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedTeamModal(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. SHOWCASE / PORTFOLIO (BEHANCE UNTUK GAMERS)                */}
        {/* ============================================================ */}
        {activeTab === 'showcase' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Gamer Showcase & Achievements</h2>
                <p className="text-xs text-slate-400">Platform portfolio untuk kongsikan klip highlight gameplay & trofi kejohanan</p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-amber-400/20"
              >
                <Plus className="w-4 h-4" /> Post Highlight Baru
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post) => {
                const embedUrl = getEmbedUrl(post.videoUrl);
                return (
                  <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                            {post.author[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-200">
                              {post.author} <span className="text-slate-500 font-normal">[{post.team}]</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{post.date}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-amber-400 rounded-full border border-slate-700">
                          {post.tag}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-100">{post.title}</h3>

                      <div className="h-48 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center text-slate-600 text-xs">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={post.title}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : post.videoUrl ? (
                          <a
                            href={post.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-amber-400 hover:underline text-xs"
                          >
                            <ExternalLink className="w-4 h-4" /> Tonton Video di Pautan Luar
                          </a>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Award className="w-10 h-10 text-amber-400/60" />
                            <span className="font-semibold">Official Verified Achievement Badge</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal: New Post */}
        {isPostModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-100">Post Showcase Baru</h3>
                <button onClick={() => setIsPostModalOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Tajuk Highlight / Trofi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Clutch 1v4 Final Circle"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Nama Player (IGN)</label>
                    <input
                      type="text"
                      placeholder="Contoh: uHigh"
                      value={newPost.author}
                      onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Nama Pasukan</label>
                    <input
                      type="text"
                      placeholder="Contoh: SEM9"
                      value={newPost.team}
                      onChange={(e) => setNewPost({ ...newPost, team: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pautan Video (YouTube URL)</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newPost.videoUrl}
                    onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsPostModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!newPost.title || !newPost.author) {
                      alert('Sila isi sekurang-kurangnya tajuk dan nama pemain.');
                      return;
                    }
                    setPosts([
                      {
                        id: Date.now(),
                        title: newPost.title,
                        author: newPost.author,
                        team: newPost.team || 'FREE AGENT',
                        tag: newPost.tag,
                        date: 'Baru tadi',
                        videoUrl: newPost.videoUrl
                      },
                      ...posts
                    ]);
                    setIsPostModalOpen(false);
                    setNewPost({ title: '', author: '', team: '', videoUrl: '', tag: 'Highlight' });
                  }}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition shadow-md shadow-amber-400/20"
                >
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}