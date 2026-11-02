import React, { useState } from 'react';
import { 
  Trophy, Shield, Video, Search, Plus, Award, 
  Copy, Check
} from 'lucide-react';

const PUBGM_SCORING = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

export default function App() {
  const [activeTab, setActiveTab] = useState('calc');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Database Teams
  const [teams] = useState([
    { id: 't1', name: 'Geek Fam MY', tag: 'GEEK', matches: 12, wwcd: 4, kills: 78, pts: 142, logo: 'GF' },
    { id: 't2', name: 'Yoodo Alliance', tag: 'YALL', matches: 12, wwcd: 3, kills: 69, pts: 128, logo: 'YA' },
    { id: 't3', name: 'SEM9 Esports', tag: 'SEM9', matches: 12, wwcd: 2, kills: 55, pts: 98, logo: 'S9' },
    { id: 't4', name: 'Selangor Red Giants', tag: 'SRG', matches: 12, wwcd: 1, kills: 48, pts: 84, logo: 'SRG' },
    { id: 't5', name: 'Todak Gaming', tag: 'TDK', matches: 12, wwcd: 1, kills: 42, pts: 72, logo: 'TDK' }
  ]);

  // Scrim Match Slots (16 Slots)
  const [slots, setSlots] = useState(
    Array.from({ length: 16 }, (_, i) => ({
      slot: i + 1,
      teamName: teams[i] ? teams[i].name : `Slot #${i + 1}`,
      placement: i + 1,
      kills: 0,
      placementPts: PUBGM_SCORING[i + 1] || 0,
      totalPts: PUBGM_SCORING[i + 1] || 0
    }))
  );

  // Showcase Posts
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: '1v3 Clutch vs Bigetron RA - Final Circle Erangel',
      author: 'uHigh',
      team: 'SEM9',
      date: '2 jam lepas',
      likes: 42,
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 2,
      title: 'Juara PMPL Fall Split Season 2026 - Roster Showcase',
      author: 'DamRUDE',
      team: 'Geek Fam MY',
      date: 'Semalam',
      likes: 89,
      embedUrl: ''
    }
  ]);

  const handleSlotChange = (index, field, value) => {
    const updated = [...slots];
    if (field === 'teamName') {
      updated[index].teamName = value;
    } else {
      const numVal = Math.max(0, parseInt(value, 10) || 0);
      updated[index][field] = numVal;

      if (field === 'placement') {
        updated[index].placementPts = PUBGM_SCORING[numVal] ?? 0;
      }
      updated[index].totalPts = updated[index].placementPts + updated[index].kills;
    }
    setSlots(updated);
  };

  const handleQuickDemo = () => {
    const demo = slots.map((s, idx) => {
      const rank = idx + 1;
      const kills = Math.floor(Math.random() * 9);
      const placePts = PUBGM_SCORING[rank] || 0;
      return {
        ...s,
        placement: rank,
        kills: kills,
        placementPts: placePts,
        totalPts: placePts + kills
      };
    });
    setSlots(demo);
  };

  const sortedLeaderboard = [...slots].sort((a, b) => {
    if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
    if (a.placement === 1 && b.placement !== 1) return -1;
    if (b.placement === 1 && a.placement !== 1) return 1;
    if (b.placementPts !== a.placementPts) return b.placementPts - a.placementPts;
    return b.kills - a.kills;
  });

  const handleCopyText = () => {
    let text = `🏆 *PUBG MOBILE SCRIM STANDINGS*\n━━━━━━━━━━━━━━━━━━\n`;
    sortedLeaderboard.forEach((row, i) => {
      text += `${i + 1}. [${row.placement === 1 ? '👑 WWCD' : `#${row.placement}`}] ${row.teamName} - ${row.totalPts} pts (${row.kills} Kills)\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-400 text-slate-950 font-black rounded-lg flex items-center justify-center text-lg shadow-lg shadow-amber-400/20">
            P
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider uppercase">PUBG Scrim Hub</h1>
            <p className="text-xs text-slate-400">Competitive Scoring & Player Showcase</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('calc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'calc' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Scrim Admin
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'board' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Live Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'teams' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" /> Team Database
          </button>
          <button
            onClick={() => setActiveTab('showcase')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'showcase' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" /> Showcase
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* 1. SCRIM ADMIN & POINT ENTRY */}
        {activeTab === 'calc' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Match Score Matrix (16 Teams)
                </h2>
                <p className="text-xs text-slate-400">Standard PUBGM Official Scoring (1st: 10pts, 2nd: 6pts, 1 Kill: 1pt)</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleQuickDemo}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 rounded-lg transition"
                >
                  Quick Fill Demo
                </button>
                <button
                  onClick={() => setActiveTab('board')}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-amber-400/20"
                >
                  View Standings →
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/30">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-12 text-center">Slot</th>
                    <th className="p-3">Team Name</th>
                    <th className="p-3 w-28 text-center">Placement</th>
                    <th className="p-3 w-28 text-center">Kills</th>
                    <th className="p-3 w-28 text-center">Place Pts</th>
                    <th className="p-3 w-28 text-right font-bold text-amber-400">Total Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {slots.map((row, idx) => (
                    <tr key={row.slot} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 text-center text-slate-500 font-mono">#{row.slot}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.teamName}
                          onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                          className="bg-transparent border-b border-slate-700/60 focus:border-amber-400 focus:outline-none w-full max-w-xs font-medium text-slate-200"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={row.placement}
                          onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-slate-100"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.kills}
                          onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-slate-100"
                        />
                      </td>
                      <td className="p-3 text-center text-slate-400 font-medium">{row.placementPts}</td>
                      <td className="p-3 text-right font-black text-amber-400 text-sm">{row.totalPts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. LEADERBOARD */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" /> Scrim Overall Standings
                </h2>
                <p className="text-xs text-slate-400">Tie-breaker: Total Points → WWCD → Placement Pts → Kills</p>
              </div>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Discord / WA Format'}
              </button>
            </div>

            <div className="grid gap-2">
              {sortedLeaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs ${
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
                    <div>
                      <div className="font-bold flex items-center gap-2 text-sm">
                        {item.teamName}
                        {item.placement === 1 && (
                          <span className="text-[10px] uppercase font-black tracking-wider bg-amber-400/10 border border-amber-400/40 text-amber-400 px-2 py-0.5 rounded-full">
                            Winner Winner Chicken Dinner
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
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total Points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TEAM DATABASE */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari pasukan atau tag team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-400 text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams
                .filter(
                  (t) =>
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.tag.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((team) => (
                  <div
                    key={team.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center font-black text-sm text-amber-400">
                          {team.logo}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-100">{team.name}</h3>
                          <span className="text-xs text-slate-400 font-mono">[{team.tag}]</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        Win Rate {Math.round((team.wwcd / team.matches) * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-800/80 text-center text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Matches</div>
                        <div className="font-bold mt-0.5">{team.matches}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">WWCD</div>
                        <div className="font-bold text-amber-400 mt-0.5">{team.wwcd}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Kills</div>
                        <div className="font-bold mt-0.5">{team.kills}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Pts</div>
                        <div className="font-bold text-emerald-400 mt-0.5">{team.pts}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 4. SHOWCASE / PORTFOLIO */}
        {activeTab === 'showcase' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Gamer Highlights & Achievements</h2>
                <p className="text-xs text-slate-400">Portfolio klip perlawanan dan trofi pencapaian pemain</p>
              </div>
              <button
                onClick={() => {
                  const title = prompt('Masukkan tajuk pencapaian atau klip:');
                  if (title) {
                    setPosts([
                      {
                        id: Date.now(),
                        title,
                        author: 'Player One',
                        team: 'DEMO',
                        date: 'Baru tadi',
                        likes: 1,
                        embedUrl: ''
                      },
                      ...posts
                    ]);
                  }
                }}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-amber-400/20"
              >
                <Plus className="w-4 h-4" /> Post Highlight
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
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
                  </div>

                  <h3 className="font-bold text-sm text-slate-100">{post.title}</h3>

                  <div className="h-44 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center text-slate-600 text-xs">
                    {post.embedUrl ? (
                      <iframe
                        src={post.embedUrl}
                        title={post.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Award className="w-8 h-8 text-amber-400/40" />
                        <span>Verified Tournament Trophy Badge</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}