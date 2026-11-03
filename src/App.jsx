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
  Eye,
  Trash2,
  Edit3,
  LockKeyhole,
  Unlock,
  CheckSquare,
  Award,
  TrendingUp,
  BarChart2,
  Info,
  ChevronRight
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
  const fileName = folder + '/' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '.' + fileExt;
  
  const { error: uploadError } = await supabase.storage
    .from('scrim-assets')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('scrim-assets')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export default function App() {
  // Laman utama dibuka ke Team Stats
  const [activeTab, setActiveTab] = useState('teams');
  
  const [scrims, setScrims] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedScrimId, setSelectedScrimId] = useState('');
  const [adminSelectedScrimId, setAdminSelectedScrimId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const [tierFilter, setTierFilter] = useState('All');
  const [searchScrimQuery, setSearchScrimQuery] = useState('');

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Modals
  const [inspectedScrim, setInspectedScrim] = useState(null);
  const [isEditScrimModalOpen, setIsEditScrimModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceTeam, setPerformanceTeam] = useState(null);

  // Directory Search
  const [searchHostQuery, setSearchHostQuery] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function initApp() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
      });

      // Susun mengikut masa ID terbaru secara menurun
      const { data: scrimData } = await supabase
        .from('scrims')
        .select('*')
        .order('date', { ascending: false });

      if (scrimData && scrimData.length > 0) {
        // Susun tepat: scrim terbaru Date.now() sentiasa di atas
        const sorted = [...scrimData].sort((a, b) => {
          const timeA = parseInt(a.id.replace('scrim_', ''), 10) || 0;
          const timeB = parseInt(b.id.replace('scrim_', ''), 10) || 0;
          return timeB - timeA;
        });

        setScrims(sorted);
        setSelectedScrimId(sorted[0].id);
        setAdminSelectedScrimId(sorted[0].id);
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postData && postData.length > 0) {
        setPosts(postData);
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*');

      if (profileData) {
        setProfiles(profileData);
      }

      return () => subscription.unsubscribe();
    }

    initApp();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    if (isRegisterMode) {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        showToast('Registration Error: ' + error.message);
      } else {
        showToast('Registration complete! Please sign in.');
        setIsRegisterMode(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        showToast('Login Failed: ' + error.message);
      } else {
        setCurrentUser(data.user);
        showToast('Welcome back, ' + data.user.email);
        setAuthPassword('');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  // Kawalan Akses Admin Sendiri
  const isAuthorizedAdmin = (scrim) => {
    if (!currentUser || !scrim) return false;
    const isOwner = scrim.created_by === currentUser.id || scrim.created_by === currentUser.email;
    const isCoHost = scrim.co_hosts && scrim.co_hosts.includes(currentUser.id);
    return isOwner || isCoHost;
  };

  const adminHostedScrims = useMemo(() => {
    if (!currentUser) return [];
    return scrims.filter(s => isAuthorizedAdmin(s));
  }, [scrims, currentUser]);

  useEffect(() => {
    if (adminHostedScrims.length > 0 && !adminHostedScrims.some(s => s.id === adminSelectedScrimId)) {
      setAdminSelectedScrimId(adminHostedScrims[0].id);
    }
  }, [adminHostedScrims, adminSelectedScrimId]);

  const activeAdminScrim = useMemo(() => {
    return adminHostedScrims.find(s => s.id === adminSelectedScrimId) || adminHostedScrims[0] || null;
  }, [adminHostedScrims, adminSelectedScrimId]);

  // Host Profile Edit
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileBio, setProfileBio] = useState('');

  useEffect(() => {
    if (currentUser && profiles.length > 0) {
      const myProfile = profiles.find(p => p.id === currentUser.id);
      if (myProfile) {
        setProfileName(myProfile.display_name || '');
        setProfileContact(myProfile.contact || '');
        setProfileBio(myProfile.bio || '');
      }
    }
  }, [currentUser, profiles]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const payload = {
      id: currentUser.id,
      display_name: profileName.trim() || currentUser.email.split('@')[0],
      contact: profileContact.trim(),
      bio: profileBio.trim(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('profiles').upsert(payload);

    if (error) {
      showToast('Profile Error: ' + error.message);
    } else {
      setProfiles(prev => {
        const filtered = prev.filter(p => p.id !== currentUser.id);
        return [...filtered, payload];
      });
      setIsProfileModalOpen(false);
      showToast('Host profile updated!');
    }
  };

  // Creation State
  const [newScrimTitle, setNewScrimTitle] = useState('');
  const [newScrimTier, setNewScrimTier] = useState('Tier 1 (Pro)');
  const [newScrimDesc, setNewScrimDesc] = useState('');
  const [newScrimDate, setNewScrimDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHostContact, setNewHostContact] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Edit Scrim State
  const [editTitle, setEditTitle] = useState('');
  const [editTier, setEditTier] = useState('Tier 1 (Pro)');
  const [editDesc, setEditDesc] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  useEffect(() => {
    if (activeAdminScrim && activeAdminScrim.matches && activeAdminScrim.matches[selectedMatchIdx]) {
      const saved = activeAdminScrim.matches[selectedMatchIdx];
      setInputMap(saved.map || 'Erangel');
      if (saved.results && saved.results.length === 16) {
        setMatchSlots(saved.results.map((r, i) => ({
          slot: i + 1,
          teamId: r.teamId,
          teamName: r.teamName,
          tag: r.tag,
          placement: r.placement,
          kills: r.kills,
          placePts: r.placePts,
          totalPts: r.totalPts
        })));
        return;
      }
    }
    setMatchSlots(DEFAULT_TEAMS.map((tm, idx) => ({
      slot: idx + 1,
      teamId: tm.id,
      teamName: tm.name,
      tag: tm.tag,
      placement: idx + 1,
      kills: 0,
      placePts: getPlacementPoints(idx + 1),
      totalPts: getPlacementPoints(idx + 1)
    })));
  }, [activeAdminScrim, selectedMatchIdx]);

  const filteredScrims = useMemo(() => {
    return scrims.filter(s => {
      const matchTier = tierFilter === 'All' || s.tier === tierFilter;
      const matchSearch = s.title.toLowerCase().includes(searchScrimQuery.toLowerCase()) || 
                          (s.tier && s.tier.toLowerCase().includes(searchScrimQuery.toLowerCase()));
      return matchTier && matchSearch;
    });
  }, [scrims, tierFilter, searchScrimQuery]);

  // Public Scrim yang Aktif di Leaderboard
  const activePublicScrim = useMemo(() => {
    return scrims.find(s => s.id === selectedScrimId) || filteredScrims[0] || scrims[0];
  }, [scrims, selectedScrimId, filteredScrims]);

  const openEditScrimModal = () => {
    if (!activeAdminScrim) return;
    setEditTitle(activeAdminScrim.title || '');
    setEditTier(activeAdminScrim.tier || 'Tier 1 (Pro)');
    setEditDesc(activeAdminScrim.description || '');
    setEditContact(activeAdminScrim.host_contact || '');
    setEditLogoFile(null);
    setIsEditScrimModalOpen(true);
  };

  const handleUpdateScrimSettings = async (e) => {
    e.preventDefault();
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Unauthorized access!');
      return;
    }

    try {
      setIsSavingEdit(true);
      let updatedLogoUrl = activeAdminScrim.logo_url;

      if (editLogoFile) {
        updatedLogoUrl = await uploadMediaToSupabase(editLogoFile, 'logos');
      }

      const updatedData = {
        title: editTitle.trim(),
        tier: editTier,
        description: editDesc.trim(),
        host_contact: editContact.trim(),
        logo_url: updatedLogoUrl
      };

      const { error } = await supabase
        .from('scrims')
        .update(updatedData)
        .eq('id', activeAdminScrim.id);

      if (error) {
        showToast('Update failed: ' + error.message);
      } else {
        const merged = { ...activeAdminScrim, ...updatedData };
        setScrims(scrims.map(s => s.id === activeAdminScrim.id ? merged : s));
        setIsEditScrimModalOpen(false);
        showToast('Scrim settings and logo updated!');
      }
    } catch (err) {
      showToast('Error uploading logo: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Ciri Scrim Finish (Sync ke Leaderboard)
  const handleToggleFinishScrim = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Only host can toggle finish status!');
      return;
    }

    const nextState = !activeAdminScrim.is_finished;
    const { error } = await supabase
      .from('scrims')
      .update({ is_finished: nextState })
      .eq('id', activeAdminScrim.id);

    if (error) {
      showToast('Error updating status: ' + error.message);
    } else {
      const updated = { ...activeAdminScrim, is_finished: nextState };
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updated : s));
      // Automatik pilih scrim ini untuk paparan Leaderboard
      setSelectedScrimId(activeAdminScrim.id);
      showToast(nextState ? '🏁 Scrim marked as FINISHED! Results are now locked and live on Leaderboard.' : '🔓 Scrim reopened for editing.');
    }
  };

  const handleAddNewMatch = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Cannot add match to a finished scrim!');
      return;
    }
    const currentTotal = activeAdminScrim?.matches?.length || 0;
    const newMatchNumber = currentTotal + 1;
    setSelectedMatchIdx(newMatchNumber - 1);
    showToast('Match ' + newMatchNumber + ' round ready!');
  };

  const handleRemoveLastMatch = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) return;
    if (activeAdminScrim.is_finished) {
      showToast('⚠️ Cannot remove match from a finished scrim!');
      return;
    }

    const currentMatches = activeAdminScrim.matches || [];
    if (currentMatches.length === 0) {
      showToast('No saved matches to remove.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove Match ' + currentMatches.length + '?')) return;

    const trimmed = currentMatches.slice(0, -1);
    const updated = {
      ...activeAdminScrim,
      matches: trimmed,
      total_matches: trimmed.length
    };

    const { error } = await supabase.from('scrims').upsert(updated);

    if (error) {
      showToast('Error: ' + error.message);
    } else {
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updated : s));
      setSelectedMatchIdx(Math.max(0, trimmed.length - 1));
      showToast('Last match removed.');
    }
  };

  const handleSlotChange = (index, field, value) => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Results are locked because this scrim is marked as Finished!');
      return;
    }

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
          row.teamId = 'custom_' + value.replace(/ /g, '_').toLowerCase();
          row.tag = value.slice(0, 4).toUpperCase();
        }
      }

      row.totalPts = row.placePts + row.kills;
      updated[index] = row;
      return updated;
    });
  };

  const handleAdjustKills = (index, delta) => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Results are locked!');
      return;
    }
    const current = matchSlots[index].kills;
    handleSlotChange(index, 'kills', Math.max(0, current + delta));
  };

  const handleRandomizeTestData = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Cannot edit locked scrim!');
      return;
    }
    const placements = Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setMatchSlots(prev => {
      return prev.map((row, idx) => {
        const place = placements[idx];
        const kills = Math.floor(Math.random() * 12);
        const placePts = getPlacementPoints(place);
        return {
          ...row,
          placement: place,
          kills: kills,
          placePts: placePts,
          totalPts: placePts + kills
        };
      });
    });
    showToast('Random demo values filled!');
  };

  const handleSaveMatchScore = async () => {
    if (!currentUser) {
      showToast('Please sign in as Admin to save match scores!');
      return;
    }
    if (!activeAdminScrim) {
      showToast('Please create or select your scrim session first!');
      return;
    }
    if (activeAdminScrim.is_finished) {
      showToast('⛔ This scrim is locked as FINISHED. Reopen it to modify scores.');
      return;
    }

    const compiledResults = matchSlots.map(s => ({
      teamId: s.teamId || 'tm_' + s.teamName,
      teamName: s.teamName,
      tag: s.tag || s.teamName.slice(0, 4).toUpperCase(),
      placement: Number(s.placement),
      kills: Number(s.kills),
      placePts: Number(s.placePts),
      totalPts: Number(s.totalPts),
      wwcd: Number(s.placement) === 1 ? 1 : 0
    }));

    const existingMatches = activeAdminScrim.matches ? [...activeAdminScrim.matches] : [];
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

    const updatedScrim = {
      ...activeAdminScrim,
      matches: existingMatches,
      total_matches: existingMatches.length
    };

    const { error } = await supabase.from('scrims').upsert(updatedScrim);

    if (error) {
      showToast('Error: ' + error.message);
    } else {
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updatedScrim : s));
      setSelectedScrimId(activeAdminScrim.id);
      showToast('Match ' + (selectedMatchIdx + 1) + ' results saved to cloud!');
    }
  };

  const handleCreateNewScrim = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Only verified organizers can host scrims!');
      return;
    }
    if (!newScrimTitle.trim()) return;

    try {
      setIsUploadingLogo(true);
      let uploadedLogoUrl = '';

      if (logoFile) {
        uploadedLogoUrl = await uploadMediaToSupabase(logoFile, 'logos');
      }

      const generatedToken = 'token_' + Math.random().toString(36).substring(2, 10);
      const hostProfile = profiles.find(p => p.id === currentUser.id);

      const newSession = {
        id: 'scrim_' + Date.now(),
        title: newScrimTitle.trim(),
        tier: newScrimTier,
        description: newScrimDesc.trim() || 'Official PUBG Mobile Scrim Session.',
        date: newScrimDate || new Date().toISOString().split('T')[0],
        logo_url: uploadedLogoUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        host_name: hostProfile?.display_name || currentUser.email.split('@')[0],
        host_contact: newHostContact.trim() || hostProfile?.contact || '',
        total_matches: 0,
        matches: [],
        created_by: currentUser.id,
        co_hosts: [],
        claim_token: generatedToken,
        is_finished: false
      };

      const { error } = await supabase.from('scrims').insert([newSession]);

      if (error) {
        showToast('Error: ' + error.message);
      } else {
        setScrims([newSession, ...scrims]);
        setAdminSelectedScrimId(newSession.id);
        setSelectedScrimId(newSession.id);
        setSelectedMatchIdx(0);
        setNewScrimTitle('');
        setNewScrimDesc('');
        setNewHostContact('');
        setLogoFile(null);
        showToast('New tournament scrim created!');
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCopyHostShareLink = () => {
    if (!activeAdminScrim) return;
    const shareUrl = window.location.origin + '?claim_scrim=' + activeAdminScrim.id + '&token=' + (activeAdminScrim.claim_token || 'shared');
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
    return calculateLeaderboard(activePublicScrim, leaderboardFilter);
  }, [activePublicScrim, leaderboardFilter]);

  const handleCopyDiscordText = () => {
    if (!leaderboardData.length) return;

    let output = '**' + (activePublicScrim?.title || 'SCRIM').toUpperCase() + '**\n';
    output += 'Tier: ' + (activePublicScrim?.tier || 'Tier 1') + ' | Date: ' + (activePublicScrim?.date || '') + '\n';
    if (activePublicScrim?.is_finished) output += 'STATUS: COMPLETED (FINAL STANDINGS)\n';
    if (activePublicScrim?.host_contact) output += 'Contact Host: ' + activePublicScrim.host_contact + '\n';
    output += '============================\n';
    output += '# | TEAM | MATCH | WWCD | KILLS | TOTAL\n';
    output += '============================\n';

    leaderboardData.forEach((row) => {
      const badge = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank + '.';
      output += badge + ' [' + row.tag + '] ' + row.teamName + ' | ' + row.matchesPlayed + 'M | ' + row.wwcd + 'W | ' + row.killPts + 'K | ' + row.totalPts + ' PTS\n';
    });

    output += '============================\n*Generated by SCRIM HUB by ry.khor*';

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
    bg.addColorStop(0, '#000000');
    bg.addColorStop(0.5, '#09090b');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1480);

    ctx.fillStyle = '#ccff00';
    ctx.fillRect(0, 0, 1080, 12);

    ctx.fillStyle = '#ccff00';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SCRIM HUB  •  BY RY.KHOR', 60, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px sans-serif';
    const mainTitle = (activePublicScrim?.title || 'PUBG MOBILE SCRIM').toUpperCase();
    ctx.fillText(mainTitle.length > 30 ? mainTitle.slice(0, 28) + '...' : mainTitle, 60, 130);

    ctx.fillStyle = '#ccff00';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('[' + (activePublicScrim?.tier || 'Tier 1') + ']', 60, 170);

    ctx.fillStyle = '#71717a';
    ctx.font = '500 16px sans-serif';
    ctx.fillText('Date: ' + (activePublicScrim?.date || '') + '  •  ' + (leaderboardFilter === 'overall' ? 'Overall Standings' : 'Match ' + (parseInt(leaderboardFilter, 10) + 1)), 240, 170);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(60, 200, 960, 48);

    ctx.fillStyle = '#ccff00';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('RANK', 85, 230);
    ctx.fillText('TEAM NAME', 200, 230);
    ctx.fillText('MATCH', 580, 230);
    ctx.fillText('WWCD', 700, 230);
    ctx.fillText('KILLS', 815, 230);
    ctx.fillText('TOTAL PTS', 920, 230);

    const rows = leaderboardData.slice(0, 16);
    let y = 285;
    rows.forEach((row, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(60, y - 28, 960, 52);
      }

      ctx.fillStyle = row.rank === 1 ? '#ccff00' : row.rank === 2 ? '#e4e4e7' : row.rank === 3 ? '#a1a1aa' : '#52525b';
      ctx.font = '900 20px monospace';
      ctx.fillText('#' + row.rank, 85, y + 4);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      const name = row.teamName.length > 24 ? row.teamName.slice(0, 22) + '..' : row.teamName;
      ctx.fillText(name, 200, y + 4);

      ctx.fillStyle = '#71717a';
      ctx.font = '500 17px monospace';
      ctx.fillText(String(row.matchesPlayed || 1), 605, y + 4);

      ctx.fillStyle = row.wwcd > 0 ? '#ccff00' : '#52525b';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(String(row.wwcd || 0), 725, y + 4);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 17px monospace';
      ctx.fillText(String(row.killPts || 0), 835, y + 4);

      ctx.fillStyle = '#ccff00';
      ctx.font = '900 22px monospace';
      ctx.fillText(String(row.totalPts || 0), 945, y + 4);

      y += 58;
    });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'scrim-hub-leaderboard.png';
    link.href = image;
    link.click();
    showToast('Modern Lime Poster downloaded!');
  };

  // Team History & Aggregated Stats
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
          date: scrim.date,
          isFinished: scrim.is_finished
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

  // Organizers Directory Calculation
  const organizersList = useMemo(() => {
    const map = {};

    scrims.forEach(s => {
      const hostKey = s.created_by || s.host_name || 'Admin';
      if (!map[hostKey]) {
        const prof = profiles.find(p => p.id === s.created_by);
        map[hostKey] = {
          id: s.created_by,
          name: prof?.display_name || s.host_name || 'Tournament Organizer',
          contact: prof?.contact || s.host_contact || '',
          bio: prof?.bio || 'Official Tournament Host & Scrim Coordinator.',
          scrims: []
        };
      }
      map[hostKey].scrims.push(s);
    });

    return Object.values(map).filter(h => 
      h.name.toLowerCase().includes(searchHostQuery.toLowerCase()) ||
      h.contact.toLowerCase().includes(searchHostQuery.toLowerCase())
    );
  }, [scrims, profiles, searchHostQuery]);

  // Showcase Feed
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

      const hostProfile = profiles.find(p => p.id === currentUser.id);

      const newPost = {
        id: 'post_' + Date.now(),
        author: hostProfile?.display_name || currentUser.email.split('@')[0],
        created_by: currentUser.id,
        player_role: 'Tournament Host',
        team_tag: 'PUBGM',
        type: postType === 'clip' ? 'clip' : 'achievement',
        title: postTitle.trim(),
        tournament: postTournament.trim() || activePublicScrim?.title || 'SCRIM HUB',
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
      showToast('Upload error: ' + err.message);
    } finally {
      setIsUploadingShowcase(false);
    }
  };

  const handleDeletePost = async (postId, postOwnerId) => {
    if (!currentUser) return;
    if (postOwnerId && postOwnerId !== currentUser.id && postOwnerId !== currentUser.email) {
      showToast('You can only delete your own posts!');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this tournament post?')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      showToast('Failed to delete post: ' + error.message);
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      showToast('Post deleted successfully!');
    }
  };

  const adminMatchCount = Math.max(1, (activeAdminScrim?.matches?.length || 0));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans antialiased selection:bg-lime-400 selection:text-black pb-24 md:pb-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-lime-400 text-black px-4 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center space-x-2 border border-lime-300">
          <CheckCircle className="w-4 h-4 text-black"/>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-400 flex items-center justify-center text-black shadow-lg shadow-lime-400/20 font-black">
              <Swords className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black tracking-wider text-white">SCRIM HUB</span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-tight lowercase">
                  by <span className="text-lime-400 font-bold">ry.khor</span>
                </span>
              </div>
              <span className="text-[9px] block text-zinc-500 font-medium -mt-0.5 uppercase tracking-wider">
                Official Competitive Tournament Engine
              </span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1 bg-zinc-950/90 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('teams')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'teams' ? 'bg-lime-400 text-black shadow-md font-black' : 'text-zinc-400 hover:text-white')}
            >
              <Users className="w-4 h-4"/>
              <span>Team Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'leaderboard' ? 'bg-lime-400 text-black shadow-md font-black' : 'text-zinc-400 hover:text-white')}
            >
              <Trophy className="w-4 h-4"/>
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('hosts')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'hosts' ? 'bg-lime-400 text-black shadow-md font-black' : 'text-zinc-400 hover:text-white')}
            >
              <Award className="w-4 h-4"/>
              <span>Host Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('showcase')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'showcase' ? 'bg-lime-400 text-black shadow-md font-black' : 'text-zinc-400 hover:text-white')}
            >
              <Sparkles className="w-4 h-4"/>
              <span>Showcase</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'admin' ? 'bg-lime-400 text-black shadow-md font-black' : 'text-zinc-400 hover:text-white')}
            >
              {currentUser ? <User className="w-4 h-4 text-lime-400"/> : <Lock className="w-3.5 h-3.5 text-zinc-500"/>}
              <span>Admin Scrim</span>
            </button>
          </nav>

          <div className="flex md:hidden items-center gap-1.5">
            {currentUser && (
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" title="Admin Active" />
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* ========================================================= */}
        {/* VIEW 1: TEAM STATS (DEFAULT HOMEPAGE)                     */}
        {/* ========================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">Team Statistics & Career Performance</h2>
                <p className="text-xs text-zinc-400">Aggregated tournament results, aggregate kills, and full match logs across all scrims.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3"/>
                <input
                  type="text"
                  placeholder="Search team name or tag..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400 transition"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto py-1">
                {filteredTeamList.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTeamProfile(t.name)}
                    className={'px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ' + (
                      selectedTeamProfile === t.name 
                        ? 'bg-lime-400 text-black shadow-md' 
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850'
                    )}
                  >
                    [{t.tag}] {t.name}
                  </button>
                ))}
              </div>
            </div>

            {activeTeamData && (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-500 to-lime-400 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-lime-400/20">
                      {activeTeamData.tag}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">{activeTeamData.name}</h3>
                      <span className="text-xs text-zinc-400">Official Tournament Profile</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPerformanceTeam(activeTeamData);
                      setIsPerformanceModalOpen(true);
                    }}
                    className="px-4 py-2 bg-lime-400 hover:bg-lime-300 active:scale-95 text-black font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-lime-400/20"
                  >
                    <TrendingUp className="w-4 h-4"/>
                    <span>Team Performance Info</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-black/60 border border-zinc-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Points</span>
                    <span className="text-lg font-black font-mono text-lime-400">{activeTeamData.totalPoints}</span>
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Kills</span>
                    <span className="text-lg font-black font-mono text-white">{activeTeamData.totalKills}</span>
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total WWCD</span>
                    <span className="text-lg font-black font-mono text-lime-400">{activeTeamData.totalWWCD}</span>
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Scrims</span>
                    <span className="text-lg font-black font-mono text-zinc-300">{activeTeamData.scrimResults.length}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Scrim Performance Log (Click row for tournament details)
                    </span>
                    <span className="text-[10px] text-lime-400 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3"/> Public Details
                    </span>
                  </div>

                  {activeTeamData.scrimResults && activeTeamData.scrimResults.length > 0 ? (
                    activeTeamData.scrimResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setInspectedScrim(item.scrimData)}
                        className="p-3 bg-black/60 hover:bg-zinc-900 active:scale-[0.99] border border-zinc-800 hover:border-lime-400/40 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          {item.scrimData?.logo_url && (
                            <img src={item.scrimData.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-zinc-800" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                              <span>{item.scrimName}</span>
                              {item.isFinished && (
                                <span className="text-[9px] bg-lime-400/20 text-lime-400 px-1 rounded font-mono">Final</span>
                              )}
                              <ExternalLink className="w-3 h-3 text-zinc-500"/>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                              <span className="text-lime-400 font-semibold">{item.scrimTier}</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold block">Kills</span>
                            <span className="text-xs font-mono font-bold text-zinc-300">{item.kills} K</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold block">Points</span>
                            <span className="text-xs font-mono font-black text-lime-400">{item.points} PTS</span>
                          </div>
                          <div className="w-16 text-right">
                            <span className="text-xs font-black">
                              {item.ranking === 1 ? '👑 #1' : '#' + item.ranking}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-500 text-xs">
                      No recorded scrim finishes for this team.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: LEADERBOARD (KINI LENGKAP DENGAN PEMILIH SCRIM)   */}
        {/* ========================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
              
              {/* Header Atas: Pilihan Scrim & Butang Aksi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    Active Tournament:
                  </span>
                  {/* Pemilih Scrim Utama Leaderboard */}
                  <select
                    value={activePublicScrim?.id || selectedScrimId}
                    onChange={(e) => {
                      setSelectedScrimId(e.target.value);
                      setLeaderboardFilter('overall');
                    }}
                    className="flex-1 max-w-md bg-black/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-lime-400 font-bold focus:outline-none focus:border-lime-400 transition"
                  >
                    {filteredScrims.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.tier?.slice(0, 6) || 'Tier'}] {s.title} ({s.date}) {s.is_finished ? '🏁 Final' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activePublicScrim?.host_contact && (
                    <a
                      href={activePublicScrim.host_contact.startsWith('http') 
                        ? activePublicScrim.host_contact 
                        : (activePublicScrim.host_contact.replace(/[^0-9]/g, '').length >= 9
                          ? 'https://wa.me/' + activePublicScrim.host_contact.replace(/[^0-9]/g, '')
                          : 'https://t.me/' + activePublicScrim.host_contact.replace('@', ''))
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-lime-400/20"
                    >
                      <MessageCircle className="w-4 h-4"/>
                      <span>PM Host</span>
                    </a>
                  )}

                  <button
                    onClick={handleDownloadPoster}
                    className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-black transition flex items-center gap-1 shadow-md"
                  >
                    <Download className="w-4 h-4"/>
                    <span className="hidden sm:inline">Poster PNG</span>
                  </button>

                  <button
                    onClick={handleCopyDiscordText}
                    className="p-2 sm:px-3 sm:py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    {copyFeedback ? <Check className="w-4 h-4 text-lime-400"/> : <Copy className="w-4 h-4 text-lime-400"/>}
                    <span className="hidden sm:inline">Copy Text</span>
                  </button>
                </div>
              </div>

              {/* Scrim Title & Info */}
              <div className="flex items-center space-x-3.5 pt-1">
                {activePublicScrim?.logo_url ? (
                  <img 
                    src={activePublicScrim.logo_url} 
                    alt="Scrim Logo" 
                    className="w-14 h-14 rounded-2xl object-cover border border-lime-400/40 shadow-lg shadow-lime-400/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-lime-500 to-lime-400 flex items-center justify-center text-black font-black text-xl flex-shrink-0">
                    🏆
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-lime-400 text-black uppercase font-mono">
                      {activePublicScrim?.tier || 'Tier 1'}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {activePublicScrim?.date}
                    </span>
                    {activePublicScrim?.is_finished ? (
                      <span className="text-[10px] bg-white text-black font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        🏁 Official Final
                      </span>
                    ) : (
                      <span className="text-[10px] bg-lime-400/20 text-lime-400 font-bold px-2 py-0.5 rounded-full uppercase">
                        Live Standings
                      </span>
                    )}
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-white mt-1 leading-tight">
                    {activePublicScrim?.title || 'No Scrim Session Available'}
                  </h1>
                </div>
              </div>

              {/* Search & Tier Filter */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5"/>
                  <input
                    type="text"
                    placeholder="Search tournament name..."
                    value={searchScrimQuery}
                    onChange={(e) => setSearchScrimQuery(e.target.value)}
                    className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto py-0.5">
                  {['All', 'Tier 1 (Pro)', 'Tier 2 (Semi-Pro)', 'Tier 3 (Amateur)', 'Open Community'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ' + (
                        tierFilter === t 
                          ? 'bg-lime-400 text-black shadow' 
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850'
                      )}
                    >
                      {t === 'All' ? 'All Tiers' : t.split(' ')[0] + ' ' + t.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  onClick={() => setLeaderboardFilter('overall')}
                  className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ' + (
                    leaderboardFilter === 'overall' 
                      ? 'bg-lime-400 text-black shadow-md' 
                      : 'bg-zinc-950 text-zinc-400 hover:text-white'
                  )}
                >
                  Overall Standings
                </button>
                {activePublicScrim?.matches?.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLeaderboardFilter(idx.toString())}
                    className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ' + (
                      leaderboardFilter === idx.toString() 
                        ? 'bg-lime-400 text-black shadow-md' 
                        : 'bg-zinc-950 text-zinc-400 hover:text-white'
                    )}
                  >
                    M{m.matchNo} ({m.map})
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-zinc-500 flex items-center gap-1 pt-1 border-t border-zinc-800/60 font-mono">
                <Info className="w-3 h-3 text-zinc-400"/>
                <span>Official standard 10-6-5-4-3-2-1 placement point system + 1 kill = 1 pt. Select Overall or specific Match to view detailed breakdown.</span>
              </p>
            </div>

            {leaderboardData.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-3xl">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="font-bold text-xs text-zinc-400">No match records saved for this scrim yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((row) => {
                  const isFirst = row.rank === 1;
                  return (
                    <div
                      key={row.teamId}
                      className={'p-3 sm:p-4 rounded-2xl border transition flex items-center justify-between ' + (
                        isFirst
                          ? 'bg-gradient-to-r from-lime-400/10 via-zinc-950 to-zinc-950 border-lime-400/50 shadow-lg shadow-lime-400/5'
                          : row.rank === 2
                          ? 'bg-zinc-900/80 border-zinc-700/80'
                          : row.rank === 3
                          ? 'bg-zinc-900/60 border-zinc-800'
                          : 'bg-black/60 border-zinc-800/80'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={'w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ' + (
                            isFirst
                              ? 'bg-lime-400 text-black shadow-md shadow-lime-400/30'
                              : row.rank === 2
                              ? 'bg-white text-black'
                              : row.rank === 3
                              ? 'bg-zinc-400 text-black'
                              : 'bg-zinc-950 text-zinc-500 font-mono'
                          )}
                        >
                          {row.rank}
                        </div>

                        <div>
                          <div className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                            <span>{row.teamName}</span>
                            {row.wwcd > 0 && (
                              <span className="text-[10px] bg-lime-400/15 border border-lime-400/30 text-lime-400 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                                🍗 x{row.wwcd}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span>Matches: {row.matchesPlayed}</span>
                            <span>•</span>
                            <span className="text-zinc-300 font-semibold">Kills: {row.killPts}</span>
                            <span>•</span>
                            <span>Place: {row.placePts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base sm:text-xl font-black font-mono text-lime-400">
                          {row.totalPts}
                        </div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
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

        {/* ========================================================= */}
        {/* VIEW 3: HOSTS DIRECTORY                                   */}
        {/* ========================================================= */}
        {activeTab === 'hosts' && (
          <div className="space-y-4">
            
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-lime-400"/>
                  <span>Tournament Hosts & Organizers Directory</span>
                </h2>
                <p className="text-xs text-zinc-400">Search verified organizers, check contact info, and browse hosted tournaments.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3"/>
                <input
                  type="text"
                  placeholder="Search host name or contact..."
                  value={searchHostQuery}
                  onChange={(e) => setSearchHostQuery(e.target.value)}
                  className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <Info className="w-3 h-3 text-zinc-400"/>
                <span>All listed hosts are registered tournament administrators. Click PM Host to contact organizers directly.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizersList.map((host, idx) => (
                <div key={idx} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-5 shadow-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-lime-400 text-black font-black flex items-center justify-center text-base shadow-lg shadow-lime-400/20">
                          {host.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-white">{host.name}</h3>
                          <span className="text-[10px] bg-lime-400/10 text-lime-400 border border-lime-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
                            {host.scrims.length} Tournaments Hosted
                          </span>
                        </div>
                      </div>

                      {host.contact && (
                        <a
                          href={host.contact.startsWith('http') 
                            ? host.contact 
                            : (host.contact.replace(/[^0-9]/g, '').length >= 9
                              ? 'https://wa.me/' + host.contact.replace(/[^0-9]/g, '')
                              : 'https://t.me/' + host.contact.replace('@', ''))
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl text-xs flex items-center gap-1 shadow"
                        >
                          <MessageCircle className="w-3.5 h-3.5"/>
                          <span>PM Host</span>
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "{host.bio}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Hosted Tournaments:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {host.scrims.slice(0, 4).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setInspectedScrim(s)}
                          className="px-2.5 py-1 rounded-lg bg-black/60 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:border-lime-400/40 flex items-center gap-1 transition"
                        >
                          <span>{s.title}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500"/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: SHOWCASE                                          */}
        {/* ========================================================= */}
        {activeTab === 'showcase' && (
          <div className="space-y-4">
            
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-lime-400"/>
                  <span>Showcase & Tournament Hub</span>
                </h2>
                <p className="text-[11px] text-zinc-400">Posters, registrations, and clutch gameplay clips.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setShowcaseFilter('all')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'all' ? 'bg-lime-400 text-black' : 'text-zinc-400')}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('achievement')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'achievement' ? 'bg-lime-400 text-black' : 'text-zinc-400')}
                  >
                    Tournaments
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('clip')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'clip' ? 'bg-lime-400 text-black' : 'text-zinc-400')}
                  >
                    Clips
                  </button>
                </div>

                {currentUser && (
                  <button
                    onClick={() => setIsShowcaseModalOpen(true)}
                    className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl text-xs flex items-center gap-1 shadow-md shadow-lime-400/20"
                  >
                    <Plus className="w-4 h-4"/>
                    <span>Upload Poster</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => {
                const isMyPost = currentUser && (post.created_by === currentUser.id || post.author === currentUser.email?.split('@')[0]);

                return (
                  <div key={post.id} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
                    <div className="relative bg-black aspect-video overflow-hidden flex items-center justify-center">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" />
                      )}

                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-lime-400 text-black">
                        {post.rank || 'Featured'}
                      </span>

                      {isMyPost && (
                        <button
                          onClick={() => handleDeletePost(post.id, post.created_by)}
                          className="absolute top-3 right-3 p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-lg transition"
                          title="Delete My Post"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200">[{post.team_tag}] {post.author}</span>
                        <span className="text-[10px] text-zinc-500">{post.tournament}</span>
                      </div>

                      <h3 className="font-bold text-sm text-white leading-snug">{post.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{post.caption}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: ADMIN SCRIM                                       */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-4 sm:space-y-6">
            
            {!currentUser ? (
              <div className="max-w-md mx-auto my-8 bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/30 text-lime-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6"/>
                  </div>
                  <h2 className="text-lg font-black text-white">
                    Host Account Portal
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Sign in to host tournaments, add custom match rounds, and manage your private scrim records.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-zinc-400 uppercase font-bold mb-1">Official Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3"/>
                      <input
                        type="email"
                        required
                        placeholder="host@esports.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-lime-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-bold mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3"/>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-lime-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl transition shadow-lg shadow-lime-400/20 text-xs uppercase tracking-wider"
                  >
                    {authLoading ? 'Please wait...' : isRegisterMode ? 'Register as Admin' : 'Sign In as Admin'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                      className="text-xs text-lime-400 hover:underline"
                    >
                      {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an admin account? Register"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                
                <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-lime-400 text-black font-black rounded-xl flex items-center justify-center shadow-lg shadow-lime-400/20">
                      <User className="w-5 h-5"/>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {profileName || currentUser.email}
                        </span>
                        <span className="text-[9px] bg-lime-400/20 text-lime-400 border border-lime-400/30 px-1.5 py-0.2 rounded font-mono font-bold">
                          VERIFIED HOST
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Info className="w-3 h-3 text-lime-400"/>
                        <span>Private workspace: You can only view and manage scrims hosted by your account.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-lime-400"/>
                      <span>My Host Profile</span>
                    </button>

                    {activeAdminScrim && isAuthorizedAdmin(activeAdminScrim) && (
                      <button
                        onClick={handleCopyHostShareLink}
                        className="px-3 py-1.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5"/>
                        <span className="hidden sm:inline">Share Co-Host Link</span>
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
                  
                  <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                        My Hosted Scrims ({adminHostedScrims.length})
                      </span>
                    </div>

                    {adminHostedScrims.length === 0 ? (
                      <div className="p-4 bg-black/60 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                        No scrims registered under your account yet. Use the form on the right to host your first tournament!
                      </div>
                    ) : (
                      <select
                        value={adminSelectedScrimId}
                        onChange={(e) => setSelectedMatchIdx(0) || setAdminSelectedScrimId(e.target.value)}
                        className="w-full bg-black/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                      >
                        {adminHostedScrims.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.tier?.slice(0, 6) || 'Tier'}] {s.title} {s.is_finished ? '(🏁 Locked)' : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {activeAdminScrim && (
                      <div className="pt-3 border-t border-zinc-800 space-y-3">
                        <div className="flex items-center space-x-3">
                          {activeAdminScrim.logo_url && (
                            <img src={activeAdminScrim.logo_url} alt="Logo" className="w-11 h-11 rounded-xl object-cover border border-zinc-800" />
                          )}
                          <div className="flex-1">
                            <div className="font-bold text-xs text-zinc-200">{activeAdminScrim.title}</div>
                            <div className="text-[10px] text-lime-400">{activeAdminScrim.tier} • {activeAdminScrim.matches?.length || 0} Matches Played</div>
                          </div>
                        </div>

                        {activeAdminScrim.is_finished ? (
                          <div className="p-2.5 rounded-xl bg-white/10 border border-zinc-700 flex items-center justify-between text-xs text-white">
                            <span className="font-bold flex items-center gap-1">
                              <LockKeyhole className="w-3.5 h-3.5 text-lime-400"/> Scrim Finished (Score Entry Locked)
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-between text-xs text-lime-400">
                            <span className="font-bold flex items-center gap-1">
                              <Unlock className="w-3.5 h-3.5"/> Live & Score Editable
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={openEditScrimModal}
                            className="px-2.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-lime-400"/>
                            <span>Edit Scrim</span>
                          </button>

                          <button
                            onClick={handleToggleFinishScrim}
                            className={'px-2.5 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow ' + (
                              activeAdminScrim.is_finished 
                                ? 'bg-zinc-950 text-lime-400 border border-lime-400/30' 
                                : 'bg-lime-400 hover:bg-lime-300 text-black'
                            )}
                          >
                            {activeAdminScrim.is_finished ? <Unlock className="w-3.5 h-3.5"/> : <CheckSquare className="w-3.5 h-3.5"/>}
                            <span>{activeAdminScrim.is_finished ? 'Reopen' : 'Finish Scrim'}</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Plus className="w-4 h-4 text-lime-400"/>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Host New Tournament Scrim
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-3">
                      Fill up the tournament details. You can add or remove match rounds dynamically anytime during the event.
                    </p>

                    <form onSubmit={handleCreateNewScrim} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Scrim Title</label>
                          <input
                            type="text"
                            placeholder="e.g. PMSL SEA Pro Night Scrim"
                            value={newScrimTitle}
                            onChange={(e) => setNewScrimTitle(e.target.value)}
                            required
                            className="w-full bg-black/70 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Category / Tier</label>
                          <select
                            value={newScrimTier}
                            onChange={(e) => setNewScrimTier(e.target.value)}
                            className="w-full bg-black/70 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 focus:outline-none"
                          >
                            {TIER_OPTIONS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Upload Scrim Logo</label>
                          <label className="flex items-center justify-center gap-1.5 w-full bg-black/70 hover:bg-zinc-800 border border-dashed border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-lime-400"/>
                            <span className="truncate">{logoFile ? logoFile.name : 'Choose Logo Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setLogoFile(e.target.files[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Host Contact (PM Tepi)</label>
                          <input
                            type="text"
                            placeholder="e.g. +60123456789 or @discord"
                            value={newHostContact}
                            onChange={(e) => setNewHostContact(e.target.value)}
                            className="w-full bg-black/70 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Description / Rules</label>
                          <input
                            type="text"
                            placeholder="e.g. 16 Invited Pro Teams, mandatory live recording"
                            value={newScrimDesc}
                            onChange={(e) => setNewScrimDesc(e.target.value)}
                            className="w-full bg-black/70 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Date</label>
                            <input
                              type="date"
                              value={newScrimDate}
                              onChange={(e) => setNewScrimDate(e.target.value)}
                              className="w-full bg-black/70 border border-zinc-800 rounded-xl px-2 py-1.5 text-zinc-200 focus:outline-none text-[11px]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isUploadingLogo}
                            className="bg-lime-400 hover:bg-lime-300 text-black font-black px-4 py-2 rounded-xl transition flex items-center justify-center shadow-md shadow-lime-400/20"
                          >
                            {isUploadingLogo ? '...' : <Plus className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                </div>

                {/* Match Switcher Control */}
                <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                      {Array.from({ length: adminMatchCount }, (_, idx) => {
                        const isSaved = activeAdminScrim?.matches && activeAdminScrim.matches[idx];
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedMatchIdx(idx)}
                            className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ' + (
                              selectedMatchIdx === idx 
                                ? 'bg-lime-400 text-black shadow-md' 
                                : 'bg-black/80 text-zinc-400 hover:text-white border border-zinc-850'
                            )}
                          >
                            <span>Match {idx + 1}</span>
                            {isSaved && <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>}
                          </button>
                        );
                      })}

                      {!activeAdminScrim?.is_finished && (
                        <button
                          onClick={handleAddNewMatch}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/30 transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5"/>
                          <span>Add Match</span>
                        </button>
                      )}

                      {!activeAdminScrim?.is_finished && (activeAdminScrim?.matches?.length > 1) && (
                        <button
                          onClick={handleRemoveLastMatch}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1"
                        >
                          <Minus className="w-3.5 h-3.5"/>
                          <span>Remove Last</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <select
                        value={inputMap}
                        onChange={(e) => setInputMap(e.target.value)}
                        className="bg-black/80 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none font-bold"
                      >
                        <option value="Erangel">Erangel</option>
                        <option value="Miramar">Miramar</option>
                        <option value="Sanhok">Sanhok</option>
                        <option value="Vikendi">Vikendi</option>
                      </select>

                      <button
                        onClick={handleRandomizeTestData}
                        disabled={activeAdminScrim?.is_finished}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 bg-black/80 hover:bg-zinc-800 text-lime-400 border border-lime-400/20 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5"/>
                        <span className="hidden sm:inline">Quick Fill</span>
                      </button>
                    </div>

                  </div>

                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Info className="w-3 h-3 text-zinc-400"/>
                    <span>Scoring Match {selectedMatchIdx + 1} on {inputMap}. Adjust placement and kills, then hit save below.</span>
                  </p>
                </div>

                {/* Mobile Score Matrix */}
                <div className="md:hidden space-y-2.5">
                  {matchSlots.map((row, idx) => {
                    const isWWCD = Number(row.placement) === 1;
                    return (
                      <div
                        key={idx}
                        className={'p-3.5 rounded-2xl border transition ' + (
                          isWWCD 
                            ? 'bg-lime-400/10 border-lime-400/40' 
                            : 'bg-zinc-900/60 backdrop-blur-xl border-zinc-800'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <span className="text-[10px] font-mono text-zinc-500 font-bold bg-black px-2 py-0.5 rounded-md">
                              #{row.slot}
                            </span>
                            <input
                              type="text"
                              disabled={activeAdminScrim?.is_finished}
                              value={row.teamName}
                              onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                              className="bg-transparent font-bold text-white text-xs border-b border-transparent focus:border-lime-400 focus:outline-none flex-1 truncate"
                            />
                          </div>

                          <div className="text-right flex items-center gap-1.5">
                            {isWWCD && (
                              <span className="bg-lime-400 text-black font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                WWCD
                              </span>
                            )}
                            <div className="text-xs font-black font-mono text-lime-400 bg-black px-2.5 py-1 rounded-lg border border-zinc-800">
                              {row.totalPts} <span className="text-[9px] text-zinc-500">PTS</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
                          <div className="flex items-center justify-between bg-black px-3 py-1.5 rounded-xl border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">Rank:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500">#</span>
                              <input
                                type="number"
                                min="1"
                                max="16"
                                disabled={activeAdminScrim?.is_finished}
                                value={row.placement}
                                onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                                className="w-10 bg-transparent text-center font-bold text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-black px-2 py-1.5 rounded-xl border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold pl-1">Kills:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={activeAdminScrim?.is_finished}
                                onClick={() => handleAdjustKills(idx, -1)}
                                className="w-6 h-6 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-300 flex items-center justify-center font-black disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-white text-xs">
                                {row.kills}
                              </span>
                              <button
                                type="button"
                                disabled={activeAdminScrim?.is_finished}
                                onClick={() => handleAdjustKills(idx, 1)}
                                className="w-6 h-6 rounded-lg bg-lime-400 active:bg-lime-300 text-black flex items-center justify-center font-black disabled:opacity-50"
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

                {/* Desktop Score Table */}
                <div className="hidden md:block bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">Slot</th>
                          <th className="py-3 px-4 min-w-[200px]">Team Name</th>
                          <th className="py-3 px-4 w-28 text-center">Placement</th>
                          <th className="py-3 px-4 w-28 text-center">Kills</th>
                          <th className="py-3 px-4 w-24 text-center">Place Pts</th>
                          <th className="py-3 px-4 w-24 text-center text-lime-400">Total Pts</th>
                          <th className="py-3 px-4 w-24 text-center">WWCD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/80 font-mono text-xs">
                        {matchSlots.map((row, idx) => {
                          const isWWCD = Number(row.placement) === 1;
                          return (
                            <tr key={idx} className={isWWCD ? 'bg-lime-400/10' : 'hover:bg-zinc-800/30'}>
                              <td className="py-2.5 px-4 text-center text-zinc-500 font-bold">#{row.slot}</td>
                              <td className="py-2.5 px-4 font-sans">
                                <input
                                  type="text"
                                  disabled={activeAdminScrim?.is_finished}
                                  value={row.teamName}
                                  onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                                  className="w-full bg-black/60 border border-zinc-800 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max="16"
                                  disabled={activeAdminScrim?.is_finished}
                                  value={row.placement}
                                  onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                                  className="w-16 bg-black border border-zinc-800 text-center rounded-lg py-1 font-bold text-zinc-200 focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={activeAdminScrim?.is_finished}
                                  value={row.kills}
                                  onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                                  className="w-16 bg-black border border-zinc-800 text-center rounded-lg py-1 font-bold text-zinc-200 focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center text-zinc-400 font-bold">{row.placePts}</td>
                              <td className="py-2.5 px-4 text-center text-lime-400 font-extrabold text-sm">{row.totalPts}</td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                {isWWCD ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-lime-400 text-black">
                                    WWCD
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="fixed md:static bottom-16 md:bottom-auto left-0 right-0 p-3 bg-black/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 border-zinc-800 z-30">
                  <button
                    onClick={handleSaveMatchScore}
                    disabled={activeAdminScrim?.is_finished}
                    className={'w-full py-3 md:py-2.5 font-black rounded-2xl md:rounded-xl shadow-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition ' + (
                      activeAdminScrim?.is_finished 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-lime-400 hover:bg-lime-300 active:bg-lime-500 text-black shadow-lime-400/20'
                    )}
                  >
                    <Save className="w-4 h-4"/>
                    <span>{activeAdminScrim?.is_finished ? 'Results Locked (Scrim Finished)' : 'Save Match ' + (selectedMatchIdx + 1) + ' Scores'}</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL GRAPH: TEAM PERFORMANCE INFO */}
      {isPerformanceModalOpen && performanceTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center text-black font-black text-base shadow-lg shadow-lime-400/20">
                  {performanceTeam.tag}
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-1.5">
                    <span>{performanceTeam.name}</span>
                    <span className="text-[10px] bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full font-mono">
                      Analytics Graph
                    </span>
                  </h3>
                  <span className="text-[11px] text-zinc-400">Visual performance & career metric breakdown</span>
                </div>
              </div>

              <button 
                onClick={() => setIsPerformanceModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-black rounded-2xl border border-zinc-800">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Avg Points / Scrim</span>
                <span className="text-base font-black font-mono text-lime-400">
                  {performanceTeam.scrimResults.length ? (performanceTeam.totalPoints / performanceTeam.scrimResults.length).toFixed(1) : 0}
                </span>
              </div>
              <div className="p-3 bg-black rounded-2xl border border-zinc-800">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Avg Kills / Scrim</span>
                <span className="text-base font-black font-mono text-white">
                  {performanceTeam.scrimResults.length ? (performanceTeam.totalKills / performanceTeam.scrimResults.length).toFixed(1) : 0}
                </span>
              </div>
              <div className="p-3 bg-black rounded-2xl border border-zinc-800">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Win Rate (WWCD)</span>
                <span className="text-base font-black font-mono text-lime-400">
                  {performanceTeam.matchesCount ? ((performanceTeam.totalWWCD / performanceTeam.matchesCount) * 100).toFixed(0) + '%' : '0%'}
                </span>
              </div>
              <div className="p-3 bg-black rounded-2xl border border-zinc-800">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Total Played</span>
                <span className="text-base font-black font-mono text-zinc-300">
                  {performanceTeam.scrimResults.length} Scrims
                </span>
              </div>
            </div>

            <div className="p-4 bg-black rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-lime-400"/>
                  <span>Points & Kills per Scrim Event</span>
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-lime-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-lime-400 inline-block"></span> Points
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <span className="w-2.5 h-2.5 rounded-sm bg-white inline-block"></span> Kills
                  </span>
                </div>
              </div>

              {performanceTeam.scrimResults.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No scrim history recorded yet to render chart.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {performanceTeam.scrimResults.map((item, idx) => {
                    const maxPts = Math.max(...performanceTeam.scrimResults.map(s => s.points), 40);
                    const ptsPct = Math.min(100, (item.points / maxPts) * 100);
                    const killsPct = Math.min(100, (item.kills / maxPts) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-300 truncate max-w-[200px] sm:max-w-xs">{item.scrimName}</span>
                          <span className="font-mono text-zinc-400 text-[10px]">
                            {item.points} PTS • {item.kills} K ({item.date})
                          </span>
                        </div>
                        
                        <div className="h-4 bg-zinc-950 rounded-lg overflow-hidden flex flex-col justify-center gap-0.5 p-0.5 border border-zinc-850">
                          <div 
                            style={{ width: `${Math.max(5, ptsPct)}\%` }} className="h-1.5 bg-lime-400 rounded-full transition-all" /> <div style={{ width: `${Math.max(5, killsPct)}%` }} 
                            className="h-1 bg-white rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl text-xs"
              >
                Close Info
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: EDIT SCRIM SETTINGS */}
      {isEditScrimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-lime-400"/>
                <span>Edit Scrim Settings & Change Logo</span>
              </h3>
              <button onClick={() => setIsEditScrimModalOpen(false)} className="text-zinc-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateScrimSettings} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Scrim Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Category / Tier</label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                >
                  {TIER_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Upload New Logo (Optional)</label>
                <label className="flex items-center justify-center gap-2 w-full bg-black hover:bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-2.5 text-zinc-300 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-lime-400"/>
                  <span className="truncate">{editLogoFile ? editLogoFile.name : 'Choose image to replace logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditLogoFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Host Contact (PM Tepi)</label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  placeholder="e.g. +60123456789"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Description / Rules</label>
                <textarea
                  rows="2"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditScrimModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT HOST PROFILE */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-lime-400"/>
                <span>My Public Host Profile</span>
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-zinc-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Organizer Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RYKHOR Esports Organizer"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Official Contact (WhatsApp / Telegram)</label>
                <input
                  type="text"
                  placeholder="+60123456789 or @username"
                  value={profileContact}
                  onChange={(e) => setProfileContact(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">About / Bio</label>
                <textarea
                  rows="3"
                  placeholder="Tell players about your tournament series, regular scrim slots, rules..."
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC MODAL: SCRIM BREAKDOWN */}
      {inspectedScrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-3">
                {inspectedScrim.logo_url && (
                  <img src={inspectedScrim.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border border-lime-400/40" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-lime-400 text-black font-mono">
                      {inspectedScrim.tier || 'Tier 1'}
                    </span>
                    <span className="text-[10px] text-zinc-400">{inspectedScrim.date}</span>
                    {inspectedScrim.is_finished && (
                      <span className="text-[10px] bg-white text-black font-black px-2 py-0.5 rounded-full uppercase">
                        Final
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {inspectedScrim.title}
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setInspectedScrim(null)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-black border border-zinc-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Organizer / Host</span>
                <span className="font-bold text-zinc-200">{inspectedScrim.host_name || 'Official Host'}</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{inspectedScrim.description}</p>
              </div>

              {inspectedScrim.host_contact && (
                <a
                  href={inspectedScrim.host_contact.startsWith('http') 
                    ? inspectedScrim.host_contact 
                    : (inspectedScrim.host_contact.replace(/[^0-9]/g, '').length >= 9
                      ? 'https://wa.me/' + inspectedScrim.host_contact.replace(/[^0-9]/g, '')
                      : 'https://t.me/' + inspectedScrim.host_contact.replace('@', ''))
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <MessageCircle className="w-3.5 h-3.5"/>
                  <span>PM Host</span>
                </a>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-lime-400 tracking-wider block">
                Final Tournament Standings
              </span>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {calculateLeaderboard(inspectedScrim, 'overall').map((teamRow) => (
                  <div
                    key={teamRow.teamId}
                    className="p-2.5 bg-black border border-zinc-850 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={'w-6 text-center font-black ' + (teamRow.rank === 1 ? 'text-lime-400' : 'text-zinc-500')}>
                        #{teamRow.rank}
                      </span>
                      <span className="font-bold text-white">{teamRow.teamName}</span>
                      {teamRow.wwcd > 0 && (
                        <span className="text-[9px] text-lime-400 bg-lime-400/10 px-1.5 py-0.2 rounded font-mono font-bold">
                          🍗 x{teamRow.wwcd}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-right font-mono">
                      <span className="text-zinc-400 text-[11px]">{teamRow.killPts} K</span>
                      <span className="text-lime-400 font-black text-sm">{teamRow.totalPts} PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectedScrim(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl text-xs"
              >
                Close Breakdown
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADMIN MODAL: UPLOAD POSTER */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-lime-400"/>
                <span>Upload Tournament Poster / Clip</span>
              </h3>
              <button onClick={() => setIsShowcaseModalOpen(false)} className="text-zinc-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateShowcasePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Post Type</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                >
                  <option value="poster">Tournament Poster (Image File)</option>
                  <option value="clip">Gameplay Highlight (Video File)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PMSL SEA Spring Qualifier Open Slot"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Select File from Device</label>
                <label className="flex items-center justify-center gap-2 w-full bg-black hover:bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-3 text-zinc-300 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-lime-400"/>
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
                <label className="block text-zinc-400 uppercase font-bold mb-1">Caption / Registration Link</label>
                <textarea
                  rows="3"
                  placeholder="Describe slot availability, prize pool, registration link..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingShowcase}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-black"
                >
                  {isUploadingShowcase ? 'Uploading File...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM DOCK */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-zinc-800 z-50 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('teams')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'teams' ? 'text-lime-400' : 'text-zinc-500')}
        >
          <Users className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'leaderboard' ? 'text-lime-400' : 'text-zinc-500')}
        >
          <Trophy className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Standings</span>
        </button>

        <button
          onClick={() => setActiveTab('hosts')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'hosts' ? 'text-lime-400' : 'text-zinc-500')}
        >
          <Award className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Hosts</span>
        </button>

        <button
          onClick={() => setActiveTab('showcase')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'showcase' ? 'text-lime-400' : 'text-zinc-500')}
        >
          <Sparkles className="w-5 h-5"/>
          <span className="text-[10px] font-bold mt-0.5">Showcase</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'admin' ? 'text-lime-400' : 'text-zinc-500')}
        >
          {currentUser ? <User className="w-5 h-5 text-lime-400"/> : <Lock className="w-5 h-5"/>}
          <span className="text-[10px] font-bold mt-0.5">Admin</span>
        </button>
      </div>

    </div>
  );
}