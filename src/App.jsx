import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Shield, 
  Swords, 
  Search, 
  Plus, 
  Minus,
  CheckCircle, 
  Users, 
  Copy, 
  Play, 
  Heart, 
  Save, 
  RefreshCw, 
  Layers, 
  Check, 
  Sparkles, 
  Download, 
  Filter, 
  LogOut, 
  User, 
  Lock, 
  Mail,
  Flame,
  MessageCircle,
  Share2,
  ExternalLink,
  Upload,
  Calendar,
  Image as ImageIcon,
  X,
  Eye
} from 'lucide-react';
import { supabase } from './supabaseClient';

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

const TIER_OPTIONS = ['Tier 1 (Pro)', 'Tier 2 (Semi-Pro)', 'Tier 3 (Amateur)', 'Open Community'];

const DEFAULT_TEAMS = [
  { id: 'tm_1', name: 'Geek Fam MY', tag: 'GEEK' },
  { id: 'tm_2', name: 'Yoodo Alliance', tag: 'YALL' },
  { id: 'tm_3', name: 'SEM9 Esports', tag: 'SEM9' },
  { id: 'tm_4', name: 'Vampire Esports', tag: 'VPE' },
  { id: 'tm_5', name: 'Bigetron RA', tag: 'BTR' },
  { id: 'tm_6', name: 'Alter Ego Ares', tag: 'AE' },
  { id: 'tm_7', name: 'FaZe Clan SEA', tag: 'FAZE' },
  { id: 'tm_8', name: 'Talon Esports', tag: 'TLN' },
  { id: 'tm_9', name: 'HomeBois', tag: 'HB' },
  { id: 'tm_10', name: 'Team Secret MY', tag: 'TS' },
  { id: 'tm_11', name: "D'Xavier", tag: 'DX' },
  { id: 'tm_12', name: 'Crit VIP', tag: 'CRIT' },
  { id: 'tm_13', name: '4Rivals', tag: '4R' },
  { id: 'tm_14', name: 'Genesis Esports', tag: 'GEN' },
  { id: 'tm_15', name: 'NSJ Esports', tag: 'NSJ' },
  { id: 'tm_16', name: 'Rampage Pro', tag: 'RPG' }
];

const uploadMediaToSupabase = async (file, folder = 'uploads') => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;  const { error: uploadError } = await supabase.storage .from('scrim-assets') .upload(fileName, file);  if (uploadError) { throw uploadError; }  const { data } = supabase.storage .from('scrim-assets') .getPublicUrl(fileName);  return data.publicUrl; };  export default function App() { const [activeTab, setActiveTab] = useState('leaderboard'); const [scrims, setScrims] = useState([]); const [posts, setPosts] = useState([]); const [selectedScrimId, setSelectedScrimId] = useState(''); const [toastMessage, setToastMessage] = useState(null);  const [tierFilter, setTierFilter] = useState('All'); const [searchScrimQuery, setSearchScrimQuery] = useState('');  const [currentUser, setCurrentUser] = useState(null); const [authEmail, setAuthEmail] = useState(''); const [authPassword, setAuthPassword] = useState(''); const [isRegisterMode, setIsRegisterMode] = useState(false); const [authLoading, setAuthLoading] = useState(false);  const [inspectedScrim, setInspectedScrim] = useState(null);  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3500); };  useEffect(() => { async function initApp() { const { data: { session } } = await supabase.auth.getSession(); const user = session?.user \vert{}\vert{} null; setCurrentUser(user);  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setCurrentUser(session?.user \vert{}\vert{} null); });  const { data: scrimData } = await supabase .from('scrims') .select('*') .order('date', { ascending: false });  if (scrimData && scrimData.length > 0) { setScrims(scrimData); setSelectedScrimId(scrimData[0].id);  const params = new URLSearchParams(window.location.search); const claimId = params.get('claim_scrim'); const claimToken = params.get('token');  if (claimId && claimToken && user) { const target = scrimData.find(s => s.id === claimId); if (target && target.claim_token === claimToken) { const currentCoHosts = target.co_hosts \vert{}\vert{} []; if (!currentCoHosts.includes(user.id)) { const updated = [...currentCoHosts, user.id]; await supabase.from('scrims').update({ co_hosts: updated }).eq('id', claimId); showToast('Admin access granted! You are now a co-host.'); window.history.replaceState({}, document.title, window.location.pathname); } } } }  const { data: postData } = await supabase .from('posts') .select('*') .order('created_at', { ascending: false });  if (postData && postData.length > 0) { setPosts(postData); }  return () => subscription.unsubscribe(); }  initApp(); }, []);  const handleAuthSubmit = async (e) => { e.preventDefault(); setAuthLoading(true);  if (isRegisterMode) { const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });  if (error) { showToast('Registration Error: ' + error.message); } else { showToast('Registration complete! Please sign in.'); setIsRegisterMode(false); } } else { const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });  if (error) { showToast('Login Failed: ' + error.message); } else { setCurrentUser(data.user); showToast('Welcome back, ' + data.user.email); setAuthPassword(''); } } setAuthLoading(false); };  const handleLogout = async () => { await supabase.auth.signOut(); setCurrentUser(null); showToast('Signed out successfully.'); };  const isAuthorizedAdmin = (scrim) => { if (!currentUser \vert{}\vert{} !scrim) return false; const isOwner = scrim.created_by === currentUser.id \vert{}\vert{} scrim.created_by === currentUser.email; const isCoHost = scrim.co_hosts && scrim.co_hosts.includes(currentUser.id); return isOwner \vert{}\vert{} isCoHost; };  const adminHostedScrims = useMemo(() => { if (!currentUser) return []; return scrims.filter(s => isAuthorizedAdmin(s)); }, [scrims, currentUser]);  const [newScrimTitle, setNewScrimTitle] = useState(''); const [newScrimTier, setNewScrimTier] = useState('Tier 1 (Pro)'); const [newScrimDesc, setNewScrimDesc] = useState(''); const [newScrimDate, setNewScrimDate] = useState(new Date().toISOString().split('T')[0]); const [newHostContact, setNewHostContact] = useState(''); const [newMaxMatches, setNewMaxMatches] = useState(5); const [logoFile, setLogoFile] = useState(null); const [isUploadingLogo, setIsUploadingLogo] = useState(false);  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0); const [inputMap, setInputMap] = useState('Erangel');  const [matchSlots, setMatchSlots] = useState(() => { return DEFAULT_TEAMS.map((tm, idx) => ({ slot: idx + 1, teamId: tm.id, teamName: tm.name, tag: tm.tag, placement: idx + 1, kills: 0, placePts: getPlacementPoints(idx + 1), totalPts: getPlacementPoints(idx + 1) })); });  const activeScrim = useMemo(() => { return scrims.find(s => s.id === selectedScrimId) \vert{}\vert{} scrims[0]; }, [scrims, selectedScrimId]);  const filteredScrims = useMemo(() => { return scrims.filter(s => { const matchTier = tierFilter === 'All' \vert{}\vert{} s.tier === tierFilter; const matchSearch = s.title.toLowerCase().includes(searchScrimQuery.toLowerCase()) \vert{}\vert{} (s.tier && s.tier.toLowerCase().includes(searchScrimQuery.toLowerCase())); return matchTier && matchSearch; }); }, [scrims, tierFilter, searchScrimQuery]);  const handleSlotChange = (index, field, value) => { setMatchSlots(prev => { const updated = [...prev]; const row = { ...updated[index] };  if (field === 'placement') { const p = Math.max(1, Math.min(16, parseInt(value, 10) \vert{}\vert{} 16)); row.placement = p; row.placePts = getPlacementPoints(p); } else if (field === 'kills') { row.kills = Math.max(0, parseInt(value, 10) \vert{}\vert{} 0); } else if (field === 'teamName') { row.teamName = value; const matched = DEFAULT_TEAMS.find(t => t.name.toLowerCase() === value.toLowerCase() \vert{}\vert{} t.tag.toLowerCase() === value.toLowerCase()); if (matched) { row.teamId = matched.id; row.tag = matched.tag; } else { row.teamId = 'custom_' + value.replace(/\s+/g, '_').toLowerCase(); row.tag = value.slice(0, 4).toUpperCase(); } }  row.totalPts = row.placePts + row.kills; updated[index] = row; return updated; }); };  const handleAdjustKills = (index, delta) => { const current = matchSlots[index].kills; handleSlotChange(index, 'kills', Math.max(0, current + delta)); };  const handleRandomizeTestData = () => { const placements = Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5); setMatchSlots(prev => { return prev.map((row, idx) => { const place = placements[idx]; const kills = Math.floor(Math.random() * 12); const placePts = getPlacementPoints(place); return { ...row, placement: place, kills: kills, placePts: placePts, totalPts: placePts + kills }; }); }); showToast('Randomized values populated!'); };  const handleSaveMatchScore = async () => { if (!currentUser) { showToast('Please sign in as Admin to save match scores!'); return; } if (!activeScrim) { showToast('Please select or create a scrim session first!'); return; }  const compiledResults = matchSlots.map(s => ({ teamId: s.teamId \vert{}\vert{} 'tm_' + s.teamName, teamName: s.teamName, tag: s.tag \vert{}\vert{} s.teamName.slice(0, 4).toUpperCase(), placement: Number(s.placement), kills: Number(s.kills), placePts: Number(s.placePts), totalPts: Number(s.totalPts), wwcd: Number(s.placement) === 1 ? 1 : 0 }));  const existingMatches = activeScrim.matches ? [...activeScrim.matches] : []; const matchData = { matchNo: selectedMatchIdx + 1, map: inputMap, results: compiledResults };  if (existingMatches[selectedMatchIdx]) { existingMatches[selectedMatchIdx] = matchData; } else { existingMatches.push(matchData); }  const updatedScrim = { ...activeScrim, matches: existingMatches, total_matches: existingMatches.length };  const { error } = await supabase.from('scrims').upsert(updatedScrim);  if (error) { showToast('Error: ' + error.message); } else { setScrims(scrims.map(s => s.id === activeScrim.id ? updatedScrim : s)); showToast('Match ' + (selectedMatchIdx + 1) + ' results saved to cloud!'); } };  const handleCreateNewScrim = async (e) => { e.preventDefault(); if (!currentUser) { showToast('Only verified organizers can host scrims!'); return; } if (!newScrimTitle.trim()) return;  try { setIsUploadingLogo(true); let uploadedLogoUrl = '';  if (logoFile) { uploadedLogoUrl = await uploadMediaToSupabase(logoFile, 'logos'); }  const generatedToken = 'token_' + Math.random().toString(36).substring(2, 10);  const newSession = { id: 'scrim_' + Date.now(), title: newScrimTitle.trim(), tier: newScrimTier, description: newScrimDesc.trim() \vert{}\vert{} 'Official PUBG Mobile Scrim Session.', date: newScrimDate \vert{}\vert{} new Date().toISOString().split('T')[0], logo_url: uploadedLogoUrl \vert{}\vert{} 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80', host_name: currentUser.email.split('@')[0], host_contact: newHostContact.trim() \vert{}\vert{} '', max_matches: parseInt(newMaxMatches, 10) \vert{}\vert{} 5, total_matches: 0, matches: [], created_by: currentUser.id, co_hosts: [], claim_token: generatedToken };  const { error } = await supabase.from('scrims').insert([newSession]);  if (error) { showToast('Error: ' + error.message); } else { setScrims([newSession, ...scrims]); setSelectedScrimId(newSession.id); setSelectedMatchIdx(0); setNewScrimTitle(''); setNewScrimDesc(''); setNewHostContact(''); setLogoFile(null); showToast('Tournament scrim created with uploaded logo!'); } } catch (err) { showToast('Upload failed: ' + (err.message \vert{}\vert{} 'Please check Supabase Storage.')); } finally { setIsUploadingLogo(false); } };  const handleCopyHostShareLink = () => { if (!activeScrim) return; const shareUrl = `${window.location.origin}?claim_scrim=${activeScrim.id}&token=${activeScrim.claim_token || 'shared'}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Co-Host invite link copied to clipboard!');
    });
  };

  const [leaderboardFilter, setLeaderboardFilter] = useState('overall');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const calculateLeaderboard = (targetScrim, filterType) => {
    if (!targetScrim || !targetScrim.matches || targetScrim.matches.length === 0) {
      return [];
    }

    if (filterType === 'overall') {
      const summaryMap = {};

      targetScrim.matches.forEach((m) => {
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
      const mIdx = parseInt(filterType, 10);
      const match = targetScrim.matches[mIdx];
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
  };

  const leaderboardData = useMemo(() => {
    return calculateLeaderboard(activeScrim, leaderboardFilter);
  }, [activeScrim, leaderboardFilter]);

  const handleCopyDiscordText = () => {
    if (!leaderboardData.length) return;

    let output = '**' + (activeScrim?.title || 'SCRIM').toUpperCase() + '**\n';
    output += 'Tier: ' + (activeScrim?.tier || 'Tier 1') + ' | Date: ' + (activeScrim?.date || '') + '\n';
    if (activeScrim?.host_contact) output += 'Contact Host: ' + activeScrim.host_contact + '\n';
    output += '============================\n';
    output += '# | TEAM | MATCH | WWCD | KILLS | TOTAL\n';
    output += '============================\n';

    leaderboardData.forEach((row) => {
      const badge = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank + '.';
      output += badge + ' [' + row.tag + '] ' + row.teamName + ' | ' + row.matchesPlayed + 'M | ' + row.wwcd + 'W | ' + row.killPts + 'K | ' + row.totalPts + ' PTS\n';
    });

    output += '============================\n*Generated by PUBGM Scrim Hub*';

    navigator.clipboard.writeText(output).then(() => {
      setCopyFeedback(true);
      showToast('Standings copied to clipboard!');
      setTimeout(() => setCopyFeedback(false), 2500);
    });
  };

  const handleDownloadPoster = () => {
    if (!leaderboardData.length) {
      showToast('No data available to render poster!');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 0, 1480);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1480);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 1080, 14);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PUBGM TOURNAMENT LEADERBOARD', 60, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    const mainTitle = (activeScrim?.title || 'PUBG MOBILE SCRIM').toUpperCase();
    ctx.fillText(mainTitle.length > 30 ? mainTitle.slice(0, 28) + '...' : mainTitle, 60, 135);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('[' + (activeScrim?.tier || 'Tier 1') + ']', 60, 175);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px sans-serif';
    ctx.fillText('Date: ' + (activeScrim?.date || '') + '  •  ' + (leaderboardFilter === 'overall' ? 'Overall Standings' : 'Match ' + (parseInt(leaderboardFilter, 10) + 1)), 240, 175);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(60, 205, 960, 48);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('RANK', 85, 236);
    ctx.fillText('TEAM NAME', 200, 236);
    ctx.fillText('MATCH', 580, 236);
    ctx.fillText('WWCD', 700, 236);
    ctx.fillText('KILLS', 815, 236);
    ctx.fillText('TOTAL PTS', 920, 236);

    const rows = leaderboardData.slice(0, 16);
    let y = 290;
    rows.forEach((row, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(60, y - 28, 960, 52);
      }

      ctx.fillStyle = row.rank === 1 ? '#fbbf24' : row.rank === 2 ? '#cbd5e1' : row.rank === 3 ? '#d97706' : '#64748b';
      ctx.font = '900 20px sans-serif';
      ctx.fillText('#' + row.rank, 85, y + 4);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px sans-serif';
      const name = row.teamName.length > 24 ? row.teamName.slice(0, 22) + '..' : row.teamName;
      ctx.fillText(name, 200, y + 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px monospace';
      ctx.fillText(String(row.matchesPlayed || 1), 605, y + 4);

      ctx.fillStyle = row.wwcd > 0 ? '#f59e0b' : '#64748b';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(String(row.wwcd || 0), 725, y + 4);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 18px monospace';
      ctx.fillText(String(row.killPts || 0), 835, y + 4);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 22px monospace';
      ctx.fillText(String(row.totalPts || 0), 945, y + 4);

      y += 58;
    });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'scrim-leaderboard.png';
    link.href = image;
    link.click();
    showToast('Poster PNG downloaded!');
  };

  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [selectedTeamProfile, setSelectedTeamProfile] = useState(DEFAULT_TEAMS[0].name);

  const teamsStats = useMemo(() => {
    const stats = {};

    DEFAULT_TEAMS.forEach(t => {
      stats[t.name] = {
        name: t.name,
        tag: t.tag,
        scrimResults: [],
        totalKills: 0,
        totalPoints: 0,
        totalWWCD: 0,
        matchesCount: 0
      };
    });

    scrims.forEach(scrim => {
      const scrimSummary = {};
      (scrim.matches || []).forEach(m => {
        (m.results || []).forEach(r => {
          if (!scrimSummary[r.teamName]) {
            scrimSummary[r.teamName] = {
              teamName: r.teamName,
              tag: r.tag,
              totalPts: 0,
              totalKills: 0,
              wwcd: 0,
              matches: 0
            };
          }
          scrimSummary[r.teamName].totalPts += r.totalPts;
          scrimSummary[r.teamName].totalKills += r.kills;
          scrimSummary[r.teamName].matches += 1;
          scrimSummary[r.teamName].wwcd += (r.wwcd || (r.placement === 1 ? 1 : 0));
        });
      });

      const sortedTeams = Object.values(scrimSummary).sort((a, b) => b.totalPts - a.totalPts || b.wwcd - a.wwcd);

      sortedTeams.forEach((teamRes, idx) => {
        const tName = teamRes.teamName;
        if (!stats[tName]) {
          stats[tName] = {
            name: tName,
            tag: teamRes.tag,
            scrimResults: [],
            totalKills: 0,
            totalPoints: 0,
            totalWWCD: 0,
            matchesCount: 0
          };
        }

        stats[tName].totalKills += teamRes.totalKills;
        stats[tName].totalPoints += teamRes.totalPts;
        stats[tName].totalWWCD += teamRes.wwcd;
        stats[tName].matchesCount += teamRes.matches;

        stats[tName].scrimResults.push({
          scrimId: scrim.id,
          scrimData: scrim,
          scrimName: scrim.title,
          scrimTier: scrim.tier || 'Tier 1 (Pro)',
          ranking: idx + 1,
          points: teamRes.totalPts,
          kills: teamRes.totalKills,
          wwcd: teamRes.wwcd,
          matches: teamRes.matches,
          date: scrim.date
        });
      });
    });

    return stats;
  }, [scrims]);

  const filteredTeamList = useMemo(() => {
    return Object.values(teamsStats).filter(t => 
      t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) || 
      t.tag.toLowerCase().includes(teamSearchQuery.toLowerCase())
    );
  }, [teamsStats, teamSearchQuery]);

  const activeTeamData = teamsStats[selectedTeamProfile] || Object.values(teamsStats)[0];

  const [showcaseFilter, setShowcaseFilter] = useState('all');
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postType, setPostType] = useState('poster');
  const [postTournament, setPostTournament] = useState('');
  const [postRankBadge, setPostRankBadge] = useState('Official Tournament');
  const [postCaption, setPostCaption] = useState('');
  const [showcaseFile, setShowcaseFile] = useState(null);
  const [isUploadingShowcase, setIsUploadingShowcase] = useState(false);

  const handleCreateShowcasePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Only admins can publish tournament showcases!');
      return;
    }
    if (!postTitle.trim()) return;

    try {
      setIsUploadingShowcase(true);
      let mediaUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';

      if (showcaseFile) {
        mediaUrl = await uploadMediaToSupabase(showcaseFile, 'showcase');
      }

      const newPost = {
        id: 'post_' + Date.now(),
        author: currentUser.email.split('@')[0],
        player_role: 'Tournament Host',
        team_tag: 'PUBGM',
        type: postType === 'clip' ? 'clip' : 'achievement',
        title: postTitle.trim(),
        tournament: postTournament.trim() || activeScrim?.title || 'PUBGM Scrim Hub',
        rank: postRankBadge,
        caption: postCaption.trim() || 'Official tournament announcement & details.',
        media_type: postType === 'clip' ? 'video' : 'image',
        media_url: mediaUrl,
        likes: 1,
        date: 'Just now',
        tags: ['#PUBGM', '#Tournament', '#EsportsHub']
      };

      const { error } = await supabase.from('posts').insert([newPost]);

      if (error) {
        showToast('Error publishing post: ' + error.message);
      } else {
        setPosts([newPost, ...posts]);
        setIsShowcaseModalOpen(false);
        setPostTitle('');
        setShowcaseFile(null);
        setPostCaption('');
        showToast('Tournament poster published to feed!');
      }
    } catch (err) {
      showToast('Upload error: ' + (err.message || 'Check storage permissions.'));
    } finally {
      setIsUploadingShowcase(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-black pb-20 md:pb-6">
      
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 px-4 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center space-x-2 border border-amber-300">
          <CheckCircle className="w-4 h-4 text-slate-950"/>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Swords className="w-5 h-5 font-black"/>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wider text-slate-100">SCRIMHUB</span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded font-mono font-bold">
                  PRO
                </span>
              </div>
              <span className="text-[10px] block text-slate-400 -mt-0.5 font-medium">PUBG Mobile Point & League Hub</span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'leaderboard' ? 'bg-amber-400 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-100')}
            >
              <Trophy className="w-4 h-4"/>
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'teams' ? 'bg-amber-400 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-100')}
            >
              <Users className="w-4 h-4"/>
              <span>Team Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('showcase')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'showcase' ? 'bg-amber-400 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-100')}
            >
              <Sparkles className="w-4 h-4"/>
              <span>Showcase Feed</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'admin' ? 'bg-amber-400 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-100')}
            >
              {currentUser ? <User className="w-4 h-4 text-emerald-400"/> : <Lock className="w-3.5 h-3.5 text-amber-500"/>}
              <span>Admin Scrim</span>
            </button>
          </nav>

          <div className="flex md:hidden items-center gap-1.5">
            {currentUser && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Admin Active" />
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* VIEW 1: ADMIN SCRIM */}
        {activeTab === 'admin' && (
          <div className="space-y-4 sm:space-y-6">
            
            {!currentUser ? (
              <div className="max-w-md mx-auto my-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6"/>
                  </div>
                  <h2 className="text-lg font-black text-slate-100">
                    {isRegisterMode ? 'Register Host Account' : 'Admin Scrim Sign In'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Host scrims, upload custom logos, record match scores, and invite co-hosts.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Official Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3"/>
                      <input
                        type="email"
                        required
                        placeholder="host@esports.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3"/>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition shadow-lg shadow-amber-400/20 text-xs uppercase tracking-wider"
                  >
                    {authLoading ? 'Please wait...' : isRegisterMode ? 'Register as Admin' : 'Sign In as Admin'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an admin account? Register"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5"/>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-xs sm:text-sm">{currentUser.email}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                          VERIFIED HOST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Total Scrims in Profile: <strong className="text-amber-400 font-mono">{adminHostedScrims.length}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeScrim && isAuthorizedAdmin(activeScrim) && (
                      <button
                        onClick={handleCopyHostShareLink}
                        className="px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5"/>
                        <span>Share Host Access Link</span>
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="p-2 sm:px-3 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4"/>
                      <span className="hidden sm:inline">Log Out</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Scrim Session
                    </span>

                    <select
                      value={selectedScrimId}
                      onChange={(e) => setSelectedScrimId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      {scrims.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.tier?.slice(0, 6) || 'Tier'}] {s.title} ({s.date})
                        </option>
                      ))}
                    </select>

                    {activeScrim && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center space-x-3">
                          {activeScrim.logo_url && (
                            <img src={activeScrim.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-200">{activeScrim.title}</div>
                            <div className="text-[10px] text-amber-400">{activeScrim.tier} • {activeScrim.max_matches || 5} Maps</div>
                          </div>
                        </div>

                        {activeScrim.host_contact && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400"/>
                            <span className="truncate">Contact: {activeScrim.host_contact}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Plus className="w-4 h-4 text-amber-400"/>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Host New Scrim Session
                      </h3>
                    </div>

                    <form onSubmit={handleCreateNewScrim} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Scrim Title</label>
                          <input
                            type="text"
                            placeholder="e.g. PMSL SEA Pro Night Scrim"
                            value={newScrimTitle}
                            onChange={(e) => setNewScrimTitle(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category / Tier</label>
                          <select
                            value={newScrimTier}
                            onChange={(e) => setNewScrimTier(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
                          >
                            {TIER_OPTIONS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Upload Scrim Logo</label>
                          <label className="flex items-center justify-center gap-1.5 w-full bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl px-3 py-2 text-slate-300 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-amber-400"/>
                            <span className="truncate">{logoFile ? logoFile.name : 'Choose Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setLogoFile(e.target.files[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Host Contact (PM Tepi)</label>
                          <input
                            type="text"
                            placeholder="e.g. +60123456789 or @discord"
                            value={newHostContact}
                            onChange={(e) => setNewHostContact(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total Maps / Match</label>
                          <select
                            value={newMaxMatches}
                            onChange={(e) => setNewMaxMatches(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
                          >
                            {[3, 4, 5, 6, 7, 8].map(num => (
                              <option key={num} value={num}>{num} Maps</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description / Rules</label>
                          <input
                            type="text"
                            placeholder="e.g. 16 Invited Pro Teams, mandatory POV recording"
                            value={newScrimDesc}
                            onChange={(e) => setNewScrimDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
                            <input
                              type="date"
                              value={newScrimDate}
                              onChange={(e) => setNewScrimDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-200 focus:outline-none text-[11px]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isUploadingLogo}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl transition flex items-center justify-center shadow-md shadow-amber-400/20"
                          >
                            {isUploadingLogo ? '...' : <Plus className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                    {Array.from({ length: activeScrim?.max_matches || 5 }, (_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMatchIdx(idx)}
                        className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ' + (selectedMatchIdx === idx ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200')}
                      >
                        Match {idx + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <select
                      value={inputMap}
                      onChange={(e) => setInputMap(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-bold"
                    >
                      <option value="Erangel">Erangel</option>
                      <option value="Miramar">Miramar</option>
                      <option value="Sanhok">Sanhok</option>
                      <option value="Vikendi">Vikendi</option>
                    </select>

                    <button
                      onClick={handleRandomizeTestData}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-400/20 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5"/>
                      <span className="hidden sm:inline">Quick Fill</span>
                    </button>
                  </div>
                </div>

                <div className="md:hidden space-y-2.5">
                  {matchSlots.map((row, idx) => {
                    const isWWCD = Number(row.placement) === 1;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition ${
                          isWWCD 
                            ? 'bg-amber-400/10 border-amber-400/40' 
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded-md">
                              #{row.slot}
                            </span>
                            <input
                              type="text"
                              value={row.teamName}
                              onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                              className="bg-transparent font-bold text-slate-100 text-xs border-b border-transparent focus:border-amber-400 focus:outline-none flex-1 truncate"
                            />
                          </div>

                          <div className="text-right flex items-center gap-1.5">
                            {isWWCD && (
                              <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                WWCD
                              </span>
                            )}
                            <div className="text-xs font-black font-mono text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                              {row.totalPts} <span className="text-[9px] text-slate-500">PTS</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Rank:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">#</span>
                              <input
                                type="number"
                                min="1"
                                max="16"
                                value={row.placement}
                                onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                                className="w-10 bg-transparent text-center font-bold text-slate-100 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Kills:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustKills(idx, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-black"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-slate-100 text-xs">
                                {row.kills}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAdjustKills(idx, 1)}
                                className="w-6 h-6 rounded-lg bg-amber-400 active:bg-amber-300 text-slate-950 flex items-center justify-center font-black"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">Slot</th>
                          <th className="py-3 px-4 min-w-[200px]">Team Name</th>
                          <th className="py-3 px-4 w-28 text-center">Placement</th>
                          <th className="py-3 px-4 w-28 text-center">Kills</th>
                          <th className="py-3 px-4 w-24 text-center">Place Pts</th>
                          <th className="py-3 px-4 w-24 text-center text-amber-400">Total Pts</th>
                          <th className="py-3 px-4 w-24 text-center">WWCD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-xs">
                        {matchSlots.map((row, idx) => {
                          const isWWCD = Number(row.placement) === 1;
                          return (
                            <tr key={idx} className={isWWCD ? 'bg-amber-400/10' : 'hover:bg-slate-800/40'}>
                              <td className="py-2.5 px-4 text-center text-slate-500 font-bold">#{row.slot}</td>
                              <td className="py-2.5 px-4 font-sans">
                                <input
                                  type="text"
                                  value={row.teamName}
                                  onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-semibold focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max="16"
                                  value={row.placement}
                                  onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                                  className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg py-1 font-bold text-slate-200 focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.kills}
                                  onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                                  className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg py-1 font-bold text-slate-200 focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center text-slate-400 font-bold">{row.placePts}</td>
                              <td className="py-2.5 px-4 text-center text-amber-400 font-extrabold text-sm">{row.totalPts}</td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                {isWWCD ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">
                                    WWCD
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
                </div>

                <div className="fixed md:static bottom-16 md:bottom-auto left-0 right-0 p-3 bg-slate-950/90 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t md:border-t-0 border-slate-800 z-30">
                  <button
                    onClick={handleSaveMatchScore}
                    className="w-full py-3 md:py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl md:rounded-xl shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition"
                  >
                    <Save className="w-4 h-4"/>
                    <span>Save Match {selectedMatchIdx + 1} Scores</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                <div className="flex items-center space-x-3.5">
                  {activeScrim?.logo_url ? (
                    <img 
                      src={activeScrim.logo_url} 
                      alt="Scrim Logo" 
                      className="w-14 h-14 rounded-2xl object-cover border border-amber-400/30 shadow-lg shadow-amber-500/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl flex-shrink-0">
                      🏆
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase font-mono">
                        {activeScrim?.tier || 'Tier 1'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {activeScrim?.date}
                      </span>
                      {activeScrim?.max_matches && (
                        <span className="text-[10px] bg-slate-950 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                          {activeScrim.max_matches} Maps
                        </span>
                      )}
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-slate-100 mt-1 leading-tight">
                      {activeScrim?.title || 'No Scrim Session Available'}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeScrim?.host_contact && (
                    <a
                      href={activeScrim.host_contact.startsWith('http') 
                        ? activeScrim.host_contact 
                        : activeScrim.host_contact.replace(/[^0-9]/g, '').length >= 9
                        ? `https://wa.me/${activeScrim.host_contact.replace(/[^0-9]/g, '')}` : `https://t.me/${activeScrim.host_contact.replace('@', '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <MessageCircle className="w-4 h-4"/>
                      <span>PM Host / Join Scrim</span>
                    </a>
                  )}

                  <button
                    onClick={handleDownloadPoster}
                    className="p-2 sm:px-3 sm:py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-md shadow-amber-400/20"
                  >
                    <Download className="w-4 h-4"/>
                    <span className="hidden sm:inline">Poster</span>
                  </button>

                  <button
                    onClick={handleCopyDiscordText}
                    className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    {copyFeedback ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4 text-amber-400"/>}
                    <span className="hidden sm:inline">Copy Text</span>
                  </button>
                </div>

              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
                  <input
                    type="text"
                    placeholder="Search scrim name..."
                    value={searchScrimQuery}
                    onChange={(e) => setSearchScrimQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto py-0.5">
                  {['All', 'Tier 1 (Pro)', 'Tier 2 (Semi-Pro)', 'Tier 3 (Amateur)', 'Open Community'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ' + (tierFilter === t ? 'bg-amber-400 text-slate-950 shadow' : 'bg-slate-950 text-slate-400 hover:text-slate-200')}
                    >
                      {t === 'All' ? 'All Tiers' : t.split(' ')[0] + ' ' + t.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  onClick={() => setLeaderboardFilter('overall')}
                  className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ' + (leaderboardFilter === 'overall' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400')}
                >
                  Overall Standings
                </button>
                {activeScrim?.matches?.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLeaderboardFilter(idx.toString())}
                    className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ' + (leaderboardFilter === idx.toString() ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400')}
                  >
                    M{m.matchNo} ({m.map})
                  </button>
                ))}
              </div>
            </div>

            {leaderboardData.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="font-bold text-xs text-slate-400">No match records saved for this scrim yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((row) => {
                  const isFirst = row.rank === 1;
                  return (
                    <div
                      key={row.teamId}
                      className={`p-3 sm:p-4 rounded-2xl border transition flex items-center justify-between ${
                        isFirst
                          ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/50 shadow-lg shadow-amber-400/10'
                          : row.rank === 2
                          ? 'bg-slate-900/90 border-slate-400/40'
                          : row.rank === 3
                          ? 'bg-slate-900/90 border-amber-700/40'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            isFirst
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                              : row.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : row.rank === 3
                              ? 'bg-amber-700 text-slate-100'
                              : 'bg-slate-950 text-slate-500 font-mono'
                          }`}
                        >
                          {row.rank}
                        </div>

                        <div>
                          <div className="font-black text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                            <span>{row.teamName}</span>
                            {row.wwcd > 0 && (
                              <span className="text-[10px] bg-amber-400/15 border border-amber-400/30 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                                🍗 x{row.wwcd}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Matches: {row.matchesPlayed}</span>
                            <span>•</span>
                            <span className="text-slate-300 font-semibold">Kills: {row.killPts}</span>
                            <span>•</span>
                            <span>Place: {row.placePts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base sm:text-xl font-black font-mono text-amber-400">
                          {row.totalPts}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          PTS
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: TEAM STATS */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-100">Team Statistics & Performance</h2>
                <p className="text-xs text-slate-400">Aggregated tournament results, aggregate kills, and full match logs.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
                <input
                  type="text"
                  placeholder="Search team name or tag..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto py-1">
                {filteredTeamList.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTeamProfile(t.name)}
                    className={'px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ' + (selectedTeamProfile === t.name ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400')}
                  >
                    [{t.tag}] {t.name}
                  </button>
                ))}
              </div>
            </div>

            {activeTeamData && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-lg">
                      {activeTeamData.tag}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-100">{activeTeamData.name}</h3>
                      <span className="text-xs text-slate-400">Verified Competitive Roster</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Points</span>
                    <span className="text-lg font-black font-mono text-amber-400">{activeTeamData.totalPoints}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Kills</span>
                    <span className="text-lg font-black font-mono text-red-400">{activeTeamData.totalKills}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total WWCD</span>
                    <span className="text-lg font-black font-mono text-emerald-400">{activeTeamData.totalWWCD}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Scrims</span>
                    <span className="text-lg font-black font-mono text-slate-200">{activeTeamData.scrimResults.length}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Scrim Performance Log (Click row for full breakdown)
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3"/> Public Details
                    </span>
                  </div>

                  {activeTeamData.scrimResults && activeTeamData.scrimResults.length > 0 ? (
                    activeTeamData.scrimResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setInspectedScrim(item.scrimData)}
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 active:scale-[0.99] border border-slate-800 hover:border-amber-400/40 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          {item.scrimData?.logo_url && (
                            <img src={item.scrimData.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-800" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                              <span>{item.scrimName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500"/>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="text-amber-400 font-semibold">{item.scrimTier}</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Kills</span>
                            <span className="text-xs font-mono font-bold text-slate-300">{item.kills} K</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Points</span>
                            <span className="text-xs font-mono font-black text-amber-400">{item.points} PTS</span>
                          </div>
                          <div className="w-16 text-right">
                            <span className="text-xs font-black">
                              {item.ranking === 1 ? '👑 #1' : `#${item.ranking}`} </span> </div> </div> </div> )) ) : ( <div className="p-6 text-center text-slate-500 text-xs"> No recorded scrim finishes for this team. </div> )} </div> </div> )}  </div> )}  {/* VIEW 4: SHOWCASE */} {activeTab === 'showcase' && ( <div className="space-y-4">  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3"> <div> <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5"> <Sparkles className="w-4 h-4 text-amber-400"/> <span>Showcase & Tournament Hub</span> </h2> <p className="text-[11px] text-slate-400">Posters, registrations, and clutch gameplay clips.</p> </div>  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end"> <div className="flex items-center gap-1 text-xs"> <button onClick={() => setShowcaseFilter('all')} className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'all' ? 'bg-amber-400 text-slate-950' : 'text-slate-400')} > All </button> <button onClick={() => setShowcaseFilter('achievement')} className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'achievement' ? 'bg-amber-400 text-slate-950' : 'text-slate-400')} > Tournaments </button> <button onClick={() => setShowcaseFilter('clip')} className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'clip' ? 'bg-amber-400 text-slate-950' : 'text-slate-400')} > Clips </button> </div>  {currentUser && ( <button onClick={() => setIsShowcaseModalOpen(true)} className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md" > <Plus className="w-4 h-4"/> <span>Upload Poster</span> </button> )} </div> </div>  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {posts.map((post) => ( <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"> <div className="relative bg-black aspect-video overflow-hidden flex items-center justify-center"> {post.media_type === 'video' ? ( <video src={post.media_url} controls className="w-full h-full object-cover" /> ) : ( <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" /> )}  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950"> {post.rank \vert{}\vert{} 'Featured'} </span> </div>  <div className="p-4 space-y-2"> <div className="flex items-center justify-between text-xs"> <span className="font-bold text-slate-200">[{post.team_tag}] {post.author}</span> <span className="text-[10px] text-slate-500">{post.tournament}</span> </div>  <h3 className="font-bold text-sm text-slate-100 leading-snug">{post.title}</h3> <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{post.caption}</p> </div> </div> ))} </div>  </div> )}  </main>  {/* PUBLIC MODAL: SCRIM BREAKDOWN */} {inspectedScrim && ( <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"> <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">  <div className="flex items-center justify-between border-b border-slate-800 pb-3"> <div className="flex items-center space-x-3"> {inspectedScrim.logo_url && ( <img src={inspectedScrim.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40" /> )} <div> <div className="flex items-center gap-2"> <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono"> {inspectedScrim.tier \vert{}\vert{} 'Tier 1'} </span> <span className="text-[10px] text-slate-400">{inspectedScrim.date}</span> </div> <h3 className="text-base sm:text-lg font-black text-slate-100 mt-0.5"> {inspectedScrim.title} </h3> </div> </div>  <button onClick={() => setInspectedScrim(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold" > ✕ </button> </div>  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"> <div> <span className="text-[10px] text-slate-500 uppercase font-bold block">Organizer / Host</span> <span className="font-bold text-slate-200">{inspectedScrim.host_name \vert{}\vert{} 'Official Host'}</span> <p className="text-[11px] text-slate-400 mt-0.5">{inspectedScrim.description}</p> </div>  {inspectedScrim.host_contact && ( <a href={inspectedScrim.host_contact.startsWith('http') ? inspectedScrim.host_contact : `https://wa.me/${inspectedScrim.host_contact.replace(/[^0-9]/g, '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <MessageCircle className="w-3.5 h-3.5"/>
                  <span>PM Host</span>
                </a>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                Final Tournament Standings
              </span>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {calculateLeaderboard(inspectedScrim, 'overall').map((teamRow) => (
                  <div
                    key={teamRow.teamId}
                    className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-6 text-center font-black ${teamRow.rank === 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                        #{teamRow.rank}
                      </span>
                      <span className="font-bold text-slate-100">{teamRow.teamName}</span>
                      {teamRow.wwcd > 0 && (
                        <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-mono font-bold">
                          🍗 x{teamRow.wwcd}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-right font-mono">
                      <span className="text-slate-400 text-[11px]">{teamRow.killPts} K</span>
                      <span className="text-amber-400 font-black text-sm">{teamRow.totalPts} PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectedScrim(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
              >
                Close Breakdown
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADMIN MODAL: UPLOAD POSTER */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400"/>
                <span>Upload Tournament Poster / Clip</span>
              </h3>
              <button onClick={() => setIsShowcaseModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateShowcasePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Post Type</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="poster">Tournament Poster (Image File)</option>
                  <option value="clip">Gameplay Highlight (Video File)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PMSL SEA Spring Qualifier Open Slot"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Select File from Device</label>
                <label className="flex items-center justify-center gap-2 w-full bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl p-3 text-slate-300 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-amber-400"/>
                  <span className="font-medium truncate">{showcaseFile ? showcaseFile.name : 'Click to Upload Image / MP4'}</span>
                  <input
                    type="file"
                    accept={postType === 'clip' ? 'video/*' : 'image/*'}
                    onChange={(e) => setShowcaseFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Caption / Registration Link</label>
                <textarea
                  rows="3"
                  placeholder="Describe slot availability, prize pool, registration link..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingShowcase}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black"
                >
                  {isUploadingShowcase ? 'Uploading File...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE DOCK */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'leaderboard' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Standings</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'teams' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('showcase')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'showcase' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Showcase</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          {currentUser ? <User className="w-5 h-5 text-emerald-400"/> : <Lock className="w-5 h-5"/>}
          <span className="text-[10px] font-bold mt-0.5">Admin</span>
        </button>
      </div>

    </div>
  );
}