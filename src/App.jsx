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
  Bug,
  Crosshair,
  Radio,
  Send,
  Share,
  Medal
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
  const [activeTab, setActiveTab] = useState('teams');
  
  const [scrims, setScrims] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedScrimId, setSelectedScrimId] = useState('');
  const [adminSelectedScrimId, setAdminSelectedScrimId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const [tierFilter, setTierFilter] = useState('All');
  const [searchScrimQuery, setSearchScrimQuery] = useState('');
  const [leaderboardEventTypeFilter, setLeaderboardEventTypeFilter] = useState('All');

  // Filter Kategori Statistik Tim
  const [teamStatsCategory, setTeamStatsCategory] = useState('ALL');

  // Status Autentikasi
  const [currentUser, setCurrentUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Modal
  const [inspectedScrim, setInspectedScrim] = useState(null);
  const [isEditScrimModalOpen, setIsEditScrimModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceTeam, setPerformanceTeam] = useState(null);
  const [selectedPerformanceHost, setSelectedPerformanceHost] = useState('ALL');
  const [performanceModalCategory, setPerformanceModalCategory] = useState('ALL');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Modal Masukan / Laporan Bug
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Bug Report');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

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

      const { data: scrimData } = await supabase
        .from('scrims')
        .select('*')
        .order('date', { ascending: false });

      if (scrimData && scrimData.length > 0) {
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
        showToast('Pendaftaran selesai! Silakan masuk.');
        setIsRegisterMode(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        showToast('Gagal Masuk: ' + error.message);
      } else {
        setCurrentUser(data.user);
        showToast('Selamat datang kembali, ' + data.user.email);
        setAuthPassword('');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    showToast('Berhasil keluar.');
  };

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

  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser && profiles.length > 0) {
      const myProfile = profiles.find(p => p.id === currentUser.id);
      if (myProfile) {
        setProfileName(myProfile.display_name || '');
        setProfileContact(myProfile.contact || '');
        setProfileBio(myProfile.bio || '');
        setProfileAvatarUrl(myProfile.avatar_url || '');
      }
    }
  }, [currentUser, profiles]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsSavingProfile(true);
      let newAvatarUrl = profileAvatarUrl;

      if (avatarFile) {
        newAvatarUrl = await uploadMediaToSupabase(avatarFile, 'avatars');
      }

      const payload = {
        id: currentUser.id,
        display_name: profileName.trim() || currentUser.email.split('@')[0],
        contact: profileContact.trim(),
        bio: profileBio.trim(),
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(payload);

      if (error) {
        showToast('Ralat Profil: ' + error.message);
      } else {
        setProfiles(prev => {
          const filtered = prev.filter(p => p.id !== currentUser.id);
          return [...filtered, payload];
        });
        setProfileAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        setIsProfileModalOpen(false);
        showToast('Profil berhasil diperbarui!');
      }
    } catch (err) {
      showToast('Gagal mengunggah foto profil: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    try {
      setIsSendingFeedback(true);
      const payload = {
        id: 'fb_' + Date.now(),
        user_email: feedbackEmail.trim() || currentUser?.email || 'Anonymous Public User',
        category: feedbackCategory,
        message: feedbackMessage.trim(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feedbacks').insert([payload]);

      if (error) {
        showToast('Ralat: ' + error.message);
      } else {
        showToast('Terima kasih! Masukan telah dikirim ke Developer ry.khor.');
        setFeedbackMessage('');
        setIsFeedbackModalOpen(false);
      }
    } catch (err) {
      showToast('Gagal mengirim: ' + err.message);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const [newScrimTitle, setNewScrimTitle] = useState('');
  const [newEventType, setNewEventType] = useState('Scrim');
  const [newScrimTier, setNewScrimTier] = useState('Tier 1 (Pro)');
  const [newScrimDesc, setNewScrimDesc] = useState('');
  const [newScrimDate, setNewScrimDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHostContact, setNewHostContact] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editEventType, setEditEventType] = useState('Scrim');
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
      const matchType = leaderboardEventTypeFilter === 'All' || (s.event_type || 'Scrim') === leaderboardEventTypeFilter;
      const matchSearch = s.title.toLowerCase().includes(searchScrimQuery.toLowerCase()) || 
                          (s.tier && s.tier.toLowerCase().includes(searchScrimQuery.toLowerCase()));
      return matchTier && matchType && matchSearch;
    });
  }, [scrims, tierFilter, leaderboardEventTypeFilter, searchScrimQuery]);

  const activePublicScrim = useMemo(() => {
    return scrims.find(s => s.id === selectedScrimId) || filteredScrims[0] || scrims[0];
  }, [scrims, selectedScrimId, filteredScrims]);

  const openEditScrimModal = () => {
    if (!activeAdminScrim) return;
    setEditTitle(activeAdminScrim.title || '');
    setEditEventType(activeAdminScrim.event_type || 'Scrim');
    setEditTier(activeAdminScrim.tier || 'Tier 1 (Pro)');
    setEditDesc(activeAdminScrim.description || '');
    setEditContact(activeAdminScrim.host_contact || '');
    setEditLogoFile(null);
    setIsEditScrimModalOpen(true);
  };

  const handleUpdateScrimSettings = async (e) => {
    e.preventDefault();
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Akses tidak diizinkan!');
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
        event_type: editEventType,
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
        showToast('Pembaruan gagal: ' + error.message);
      } else {
        const merged = { ...activeAdminScrim, ...updatedData };
        setScrims(scrims.map(s => s.id === activeAdminScrim.id ? merged : s));
        setIsEditScrimModalOpen(false);
        showToast('Pengaturan dan kategori berhasil disimpan!');
      }
    } catch (err) {
      showToast('Gagal mengunggah logo: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleFinishScrim = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Hanya host yang dapat mengunci status!');
      return;
    }

    const nextState = !activeAdminScrim.is_finished;
    const { error } = await supabase
      .from('scrims')
      .update({ is_finished: nextState })
      .eq('id', activeAdminScrim.id);

    if (error) {
      showToast('Gagal memperbarui status: ' + error.message);
    } else {
      const updated = { ...activeAdminScrim, is_finished: nextState };
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updated : s));
      setSelectedScrimId(activeAdminScrim.id);
      showToast(nextState ? '🏁 Sesi ditandai SELESAI (Terkunci)!' : '🔓 Sesi dibuka kembali untuk diedit.');
    }
  };

  const handleAddNewMatch = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Tidak dapat menambah ronde pada sesi yang sudah selesai!');
      return;
    }
    const currentTotal = activeAdminScrim?.matches?.length || 0;
    const newMatchNumber = currentTotal + 1;
    setSelectedMatchIdx(newMatchNumber - 1);
    showToast('Match ' + newMatchNumber + ' siap diinput!');
  };

  const handleRemoveLastMatch = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) return;
    if (activeAdminScrim.is_finished) {
      showToast('⚠️ Tidak dapat menghapus ronde pada sesi yang sudah selesai!');
      return;
    }

    const currentMatches = activeAdminScrim.matches || [];
    if (currentMatches.length === 0) {
      showToast('Tidak ada ronde untuk dihapus.');
      return;
    }

    if (!window.confirm('Yakin ingin menghapus Match ' + currentMatches.length + '?')) return;

    const trimmed = currentMatches.slice(0, -1);
    const updated = {
      ...activeAdminScrim,
      matches: trimmed,
      total_matches: trimmed.length
    };

    const { error } = await supabase.from('scrims').upsert(updated);

    if (error) {
      showToast('Ralat: ' + error.message);
    } else {
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updated : s));
      setSelectedMatchIdx(Math.max(0, trimmed.length - 1));
      showToast('Ronde terakhir berhasil dihapus.');
    }
  };

  const handleSlotChange = (index, field, value) => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Skor terkunci karena sesi ini telah selesai!');
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
      showToast('⚠️ Skor terkunci!');
      return;
    }
    const current = matchSlots[index].kills;
    handleSlotChange(index, 'kills', Math.max(0, current + delta));
  };

  const handleRandomizeTestData = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('⚠️ Sesi ini telah dikunci!');
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
    showToast('Data simulasi berhasil diisi!');
  };

  const handleSaveMatchScore = async () => {
    if (!currentUser) {
      showToast('Silakan masuk sebagai Admin untuk menyimpan nilai!');
      return;
    }
    if (!activeAdminScrim) {
      showToast('Silakan buat atau pilih sesi terlebih dahulu!');
      return;
    }
    if (activeAdminScrim.is_finished) {
      showToast('⛔ Sesi ini telah selesai (Terkunci).');
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
      showToast('Ralat: ' + error.message);
    } else {
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updatedScrim : s));
      setSelectedScrimId(activeAdminScrim.id);
      showToast('Nilai Match ' + (selectedMatchIdx + 1) + ' berhasil disimpan!');
    }
  };

  const handleCreateNewScrim = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Hanya host terverifikasi yang dapat membuat sesi!');
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
        event_type: newEventType, // 'Scrim' | 'Tour'
        tier: newScrimTier,
        description: newScrimDesc.trim() || `Official PUBG Mobile ${newEventType === 'Tour' ? 'Tournament' : 'Scrim'} Session.`,
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
        showToast('Ralat: ' + error.message);
      } else {
        setScrims([newSession, ...scrims]);
        setAdminSelectedScrimId(newSession.id);
        setSelectedScrimId(newSession.id);
        setSelectedMatchIdx(0);
        setNewScrimTitle('');
        setNewScrimDesc('');
        setNewHostContact('');
        setLogoFile(null);
        showToast(`Sesi ${newEventType === 'Tour' ? 'Tournament' : 'Scrim'} berhasil dibuat!`);
      }
    } catch (err) {
      showToast('Gagal mengunggah: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCopyHostShareLink = () => {
    if (!activeAdminScrim) return;
    const shareUrl = window.location.origin + '?claim_scrim=' + activeAdminScrim.id + '&token=' + (activeAdminScrim.claim_token || 'shared');
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Tautan Co-Host berhasil disalin!');
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

    const eventLabel = (activePublicScrim?.event_type === 'Tour' ? 'TOURNAMENT' : 'SCRIM');
    let output = '**' + (activePublicScrim?.title || eventLabel).toUpperCase() + '**\n';
    output += 'Type: ' + eventLabel + ' | Tier: ' + (activePublicScrim?.tier || 'Tier 1') + ' | Date: ' + (activePublicScrim?.date || '') + '\n';
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
      showToast('Peringkat disalin ke clipboard!');
      setTimeout(() => setCopyFeedback(false), 2500);
    });
  };

  const handleDownloadPoster = () => {
    if (!leaderboardData.length) {
      showToast('Tidak ada data untuk mengunduh poster!');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 0, 1480);
    bg.addColorStop(0, '#f8fafc');
    bg.addColorStop(0.5, '#f1f5f9');
    bg.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1480);

    ctx.fillStyle = '#84cc16';
    ctx.fillRect(0, 0, 1080, 14);

    ctx.fillStyle = '#4d7c0f';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SCRIM HUB  •  BY RY.KHOR', 60, 75);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 38px sans-serif';
    const mainTitle = (activePublicScrim?.title || 'PUBG MOBILE SCRIM').toUpperCase();
    ctx.fillText(mainTitle.length > 30 ? mainTitle.slice(0, 28) + '...' : mainTitle, 60, 130);

    ctx.fillStyle = '#65a30d';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('[' + (activePublicScrim?.event_type === 'Tour' ? 'TOURNAMENT' : 'SCRIM').toUpperCase() + ' - ' + (activePublicScrim?.tier || 'Tier 1') + ']', 60, 170);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px sans-serif';
    ctx.fillText('Date: ' + (activePublicScrim?.date || '') + '  •  ' + (leaderboardFilter === 'overall' ? 'Overall Standings' : 'Match ' + (parseInt(leaderboardFilter, 10) + 1)), 400, 170);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(60, 200, 960, 48);

    ctx.fillStyle = '#bef264';
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(60, y - 28, 960, 52);
      }

      ctx.fillStyle = row.rank === 1 ? '#65a30d' : row.rank === 2 ? '#334155' : row.rank === 3 ? '#64748b' : '#94a3b8';
      ctx.font = '900 20px monospace';
      ctx.fillText('#' + row.rank, 85, y + 4);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      const name = row.teamName.length > 24 ? row.teamName.slice(0, 22) + '..' : row.teamName;
      ctx.fillText(name, 200, y + 4);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 17px monospace';
      ctx.fillText(String(row.matchesPlayed || 1), 605, y + 4);

      ctx.fillStyle = row.wwcd > 0 ? '#65a30d' : '#94a3b8';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(String(row.wwcd || 0), 725, y + 4);

      ctx.fillStyle = '#334155';
      ctx.font = '500 17px monospace';
      ctx.fillText(String(row.killPts || 0), 835, y + 4);

      ctx.fillStyle = '#4d7c0f';
      ctx.font = '900 22px monospace';
      ctx.fillText(String(row.totalPts || 0), 945, y + 4);

      y += 58;
    });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'scrim-hub-leaderboard.png';
    link.href = image;
    link.click();
    showToast('Poster turnamen berhasil diunduh!');
  };

  // ENGINE INSTAGRAM STORY INFOGRAFIS
  const handleShareToInstagramStory = async (team, stats, hostFilterName, eventTypeLabel) => {
    if (!team || !stats) {
      showToast('Tiada statistik untuk dijana!');
      return;
    }

    try {
      setIsGeneratingStory(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bg = ctx.createLinearGradient(0, 0, 0, 1920);
      bg.addColorStop(0, '#0a0d14');
      bg.addColorStop(0.4, '#10141f');
      bg.addColorStop(0.8, '#0b0e17');
      bg.addColorStop(1, '#05070b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 1080; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1920);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1080, 56);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(340, 0);
      ctx.lineTo(300, 56);
      ctx.lineTo(0, 56);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SCRIM HUB MATCHDAY', 40, 36);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('PUBGM COMPETITIVE LEAGUE • BY RY.KHOR', 1040, 36);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(0, 56, 1080, 140);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 194, 1080, 4);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 48px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${team.tag}]`, 60, 145);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      const cleanTeamName = team.name.length > 20 ? team.name.slice(0, 18) + '..' : team.name;
      ctx.fillText(cleanTeamName.toUpperCase(), 230, 142);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      const scopeBadge = `${eventTypeLabel.toUpperCase()} • ${hostFilterName === 'ALL' ? 'ALL HOSTS' : hostFilterName.toUpperCase()}`;
      ctx.fillText(scopeBadge, 1020, 142);

      const drawRibbonHeader = (title, y) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(440, y);
        ctx.lineTo(400, y + 42);
        ctx.lineTo(0, y + 42);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(title, 40, y + 28);
      };

      drawRibbonHeader('PERFORMANCE METRICS', 225);

      const drawCircularGauge = (centerX, centerY, radius, value, maxVal, title, unitColor = '#f97316') => {
        const startAngle = -0.75 * Math.PI;
        const totalAngle = 1.5 * Math.PI;
        const progress = Math.min(Math.max(parseFloat(value) || 0, 0) / maxVal, 1);
        const endAngle = startAngle + (totalAngle * (progress || 0.15));

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle);
        ctx.stroke();

        ctx.strokeStyle = unitColor;
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, centerX, centerY - 65);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px monospace';
        ctx.fillText(String(value), centerX, centerY + 10);
      };

      drawCircularGauge(200, 360, 68, stats.avgPts || 0, 35, 'AVG POINTS', '#f97316');
      drawCircularGauge(540, 360, 68, stats.avgKills || 0, 18, 'AVG ELIMS', '#ccff00');
      drawCircularGauge(880, 360, 68, stats.winRate || '0%', 100, 'WIN RATIO', '#f97316');

      drawRibbonHeader('SQUAD COMBAT PROFILE', 490);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 555, 960, 290);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 555, 960, 290);

      ctx.fillStyle = '#f97316';
      ctx.fillRect(60, 555, 10, 290);

      const isWinner = Number(stats.totalWwcd) >= 2;
      const isLethal = Number(stats.totalKills) >= 20;
      const archetype = isWinner ? 'CHICKEN DINNER HUNTER' : (isLethal ? 'LETHAL COMBAT PREDATOR' : 'TACTICAL SURVIVOR');

      ctx.fillStyle = '#f97316';
      ctx.fillRect(100, 585, 360, 38);
      ctx.fillStyle = '#000000';
      ctx.font = '900 15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`★ ${archetype}`, 115, 610);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px sans-serif';
      ctx.fillText(cleanTeamName.toUpperCase(), 100, 675);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px sans-serif';
      ctx.fillText(`Total Eliminations: ${stats.totalKills || 0} Kills`, 100, 725);
      ctx.fillText(`Total Points: ${stats.totalPts || 0} Pts`, 100, 760);
      ctx.fillText(`Chicken Dinners: 🍗 x${stats.totalWwcd || 0}`, 100, 795);

      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(680, 585, 310, 230);
      ctx.strokeStyle = '#f97316';
      ctx.strokeRect(680, 585, 310, 230);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CATEGORY SCOPE', 835, 625);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px monospace';
      ctx.fillText(`${stats.results ? stats.results.length : 0}`, 835, 695);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${eventTypeLabel.toUpperCase()} JOINED`, 835, 735);
      ctx.fillText(`(${stats.matchesCount || 0} TOTAL MATCHES)`, 835, 765);

      drawRibbonHeader('ANALYSIS STATEMENT', 885);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 950, 960, 210);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(60, 950, 960, 210);

      ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.font = '900 120px serif';
      ctx.textAlign = 'left';
      ctx.fillText('“', 90, 1050);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 18px monospace';
      ctx.fillText(`${eventTypeLabel.toUpperCase()} RECORD`, 170, 995);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic 500 21px sans-serif';
      const quoteText = isWinner 
        ? 'Squad ini mempamerkan konsistensi penaklukan zon pertempuran bertaraf elit dengan kadar kemenangan yang mengagumkan.'
        : 'Pasukan agresif berimpak tinggi yang sentiasa menekan lawan untuk mengutip mata eliminasi maksimum.';
      ctx.fillText(quoteText, 170, 1040);
      ctx.fillText('Disahkan untuk penyertaan peringkat kompetitif rasmi.', 170, 1075);

      drawRibbonHeader('NUMBERS TO KNOW', 1200);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 1265, 960, 270);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(60, 1265, 960, 270);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`DENGAN REKOD ${stats.totalPts || 0} MATA KESELURUHAN DAN`, 100, 1340);
      ctx.fillText(`${stats.totalKills || 0} ELIMINASI, [${team.tag}] KINI TERLETAK`, 100, 1380);
      ctx.fillText(`ANTARA SENARAI PASUKAN BERBAHAYA DALAM SIRI`, 100, 1420);
      ctx.fillText(`${eventTypeLabel.toUpperCase()} SCRIM HUB.`, 100, 1460);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 110px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(stats.totalPts || 0), 830, 1410);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 18px monospace';
      ctx.fillText('CAREER POINTS', 830, 1455);

      drawRibbonHeader('COLORWAY & METADATA', 1575);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 1635, 960, 130);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(60, 1635, 960, 130);

      const drawColorSwatch = (x, color, label) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, 1655, 90, 60);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 1655, 90, 60);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + 45, 1740);
      };

      drawColorSwatch(120, '#f97316', 'PRIMARY');
      drawColorSwatch(240, '#000000', 'SECONDARY');
      drawColorSwatch(360, '#ffffff', 'ACCENT');

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(cleanTeamName.toUpperCase(), 980, 1695);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${eventTypeLabel.toUpperCase()} DIVISION`, 980, 1725);

      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 1805, 1080, 115);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 1805, 1080, 4);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px monospace';
      ctx.fillText('SCRIM HUB', 60, 1860);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('BY RY.KHOR  •  POWERED BY SUPABASE', 60, 1890);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#f97316';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('scrim.rykhor.my', 1020, 1872);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${team.tag}-${eventTypeLabel.toLowerCase()}-stats.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `[${team.tag}] ${eventTypeLabel} Stats Infographic`,
              text: `Semak infografik prestasi ${eventTypeLabel} pasukan kami di SCRIM HUB! (scrim.rykhor.my)`
            });
            showToast('Infografik Instagram Story siap dibagikan!');
          } catch (err) {
            if (err.name !== 'AbortError') showToast('Ralat: ' + err.message);
          }
        } else {
          const link = document.createElement('a');
          link.download = `${team.tag}-${eventTypeLabel.toLowerCase()}-stats.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          showToast('Poster infografik berhasil diunduh!');
        }
      }, 'image/png');

    } catch (error) {
      showToast('Gagal menjana poster: ' + error.message);
    } finally {
      setIsGeneratingStory(false);
    }
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
      const eventType = scrim.event_type || 'Scrim';

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
          eventType: eventType,
          ranking: idx + 1,
          points: teamRes.totalPts,
          kills: teamRes.totalKills,
          wwcd: teamRes.wwcd,
          matches: teamRes.matches,
          date: scrim.date,
          isFinished: scrim.is_finished,
          hostKey: scrim.created_by || scrim.host_name || 'Admin',
          hostName: scrim.host_name || 'Tournament Organizer'
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

  const activeTeamScopedStats = useMemo(() => {
    if (!activeTeamData) return null;
    const all = activeTeamData.scrimResults || [];
    const filtered = teamStatsCategory === 'ALL'
      ? all
      : all.filter(r => (r.eventType || 'Scrim') === teamStatsCategory);

    const totalPoints = filtered.reduce((acc, c) => acc + c.points, 0);
    const totalKills = filtered.reduce((acc, c) => acc + c.kills, 0);
    const totalWWCD = filtered.reduce((acc, c) => acc + (c.wwcd || 0), 0);
    const matchesCount = filtered.reduce((acc, c) => acc + (c.matches || 1), 0);

    return {
      filteredResults: filtered,
      totalPoints,
      totalKills,
      totalWWCD,
      eventsCount: filtered.length,
      matchesCount
    };
  }, [activeTeamData, teamStatsCategory]);

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
          avatar_url: prof?.avatar_url || '',
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

  const filteredTeamPerformance = useMemo(() => {
    if (!performanceTeam) return null;
    const allResults = performanceTeam.scrimResults || [];
    
    let results = allResults;
    if (selectedPerformanceHost !== 'ALL') {
      results = results.filter(r => r.hostKey === selectedPerformanceHost || r.hostName === selectedPerformanceHost);
    }
    if (performanceModalCategory !== 'ALL') {
      results = results.filter(r => (r.eventType || 'Scrim') === performanceModalCategory);
    }

    const totalPts = results.reduce((acc, cur) => acc + cur.points, 0);
    const totalKills = results.reduce((acc, cur) => acc + cur.kills, 0);
    const totalWwcd = results.reduce((acc, cur) => acc + (cur.wwcd || 0), 0);
    const matchesCount = results.reduce((acc, cur) => acc + (cur.matches || 1), 0);

    return {
      results,
      totalPts,
      totalKills,
      totalWwcd,
      matchesCount,
      avgPts: results.length ? (totalPts / results.length).toFixed(1) : '0',
      avgKills: results.length ? (totalKills / results.length).toFixed(1) : '0',
      winRate: matchesCount ? ((totalWwcd / matchesCount) * 100).toFixed(0) + '%' : '0%'
    };
  }, [performanceTeam, selectedPerformanceHost, performanceModalCategory]);

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
      showToast('Hanya admin yang dapat menerbitkan poster!');
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
        showToast('Ralat menerbitkan: ' + error.message);
      } else {
        setPosts([newPost, ...posts]);
        setIsShowcaseModalOpen(false);
        setPostTitle('');
        setShowcaseFile(null);
        setPostCaption('');
        showToast('Poster turnamen berhasil diterbitkan!');
      }
    } catch (err) {
      showToast('Ralat unggah: ' + err.message);
    } finally {
      setIsUploadingShowcase(false);
    }
  };

  const handleDeletePost = async (postId, postOwnerId) => {
    if (!currentUser) return;
    if (postOwnerId && postOwnerId !== currentUser.id && postOwnerId !== currentUser.email) {
      showToast('Anda hanya dapat menghapus kiriman milik sendiri!');
      return;
    }

    if (!window.confirm('Yakin ingin menghapus kiriman ini?')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      showToast('Gagal menghapus: ' + error.message);
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      showToast('Kiriman berhasil dihapus!');
    }
  };

  const adminMatchCount = Math.max(1, (activeAdminScrim?.matches?.length || 0));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-lime-400 selection:text-black pb-24 md:pb-8">
      
      {/* Notifikasi Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-lime-400 px-4 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center space-x-2 border border-slate-800">
          <CheckCircle className="w-4 h-4 text-lime-400"/>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER NAVIGASI */}
      <header className="border-b border-slate-200/90 bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-400 flex items-center justify-center text-slate-950 shadow-md shadow-lime-400/30 font-black border border-lime-500/30">
              <Swords className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black tracking-wider text-slate-950">SCRIM HUB</span>
                <span className="text-[10px] text-slate-500 font-mono tracking-tight lowercase">
                  by <span className="text-lime-600 font-extrabold">ry.khor</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] block text-slate-400 font-semibold uppercase tracking-wider">
                  Tactical Esports Management
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" title="System Live"></span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('teams')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'teams' ? 'bg-white text-slate-950 shadow-sm font-black border border-slate-200/60' : 'text-slate-600 hover:text-slate-950')}
            >
              <Users className="w-4 h-4 text-lime-600"/>
              <span>Team Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'leaderboard' ? 'bg-white text-slate-950 shadow-sm font-black border border-slate-200/60' : 'text-slate-600 hover:text-slate-950')}
            >
              <Trophy className="w-4 h-4 text-lime-600"/>
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('hosts')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'hosts' ? 'bg-white text-slate-950 shadow-sm font-black border border-slate-200/60' : 'text-slate-600 hover:text-slate-950')}
            >
              <Award className="w-4 h-4 text-lime-600"/>
              <span>Host Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('showcase')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'showcase' ? 'bg-white text-slate-950 shadow-sm font-black border border-slate-200/60' : 'text-slate-600 hover:text-slate-950')}
            >
              <Sparkles className="w-4 h-4 text-lime-600"/>
              <span>Showcase</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'admin' ? 'bg-lime-400 text-slate-950 shadow-sm font-black border border-lime-500/40' : 'text-slate-600 hover:text-slate-950')}
            >
              {currentUser ? <User className="w-4 h-4 text-slate-950"/> : <Lock className="w-3.5 h-3.5 text-slate-500"/>}
              <span>Admin Scrim</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-2.5 py-1 bg-slate-200/80 hover:bg-lime-100 hover:text-lime-800 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-300/80"
              title="Laporkan Bug ke Developer ry.khor"
            >
              <Bug className="w-3.5 h-3.5 text-lime-600"/>
              <span className="hidden sm:inline">Feedback</span>
            </button>

            <div className="flex md:hidden items-center gap-1.5">
              {currentUser && (
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse" title="Admin Active" />
              )}
            </div>
          </div>

        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* VIEW 1: STATISTIK TIM */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-lime-400/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Crosshair className="w-3.5 h-3.5 text-lime-600"/>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full">
                      BATTLE ROYALE CAREER METRICS
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-950">Team Statistics & Career Performance</h2>
                  <p className="text-xs text-slate-500">Pilih tombol filter kategori di bawah untuk memisahkan catatan Scrim atau Tournament.</p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
                  <button
                    onClick={() => setTeamStatsCategory('ALL')}
                    className={'px-3 py-1.5 rounded-xl text-xs font-black transition ' + (teamStatsCategory === 'ALL' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950')}
                  >
                    All Events
                  </button>
                  <button
                    onClick={() => setTeamStatsCategory('Scrim')}
                    className={'px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ' + (teamStatsCategory === 'Scrim' ? 'bg-lime-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950')}
                  >
                    <Flame className="w-3.5 h-3.5 text-lime-700"/>
                    <span>Scrims Only</span>
                  </button>
                  <button
                    onClick={() => setTeamStatsCategory('Tour')}
                    className={'px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ' + (teamStatsCategory === 'Tour' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950')}
                  >
                    <Medal className="w-3.5 h-3.5 text-amber-200"/>
                    <span>Tour Only</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
                <input
                  type="text"
                  placeholder="Cari nama atau tag tim (contoh: Geek Fam, SEM9, YALL)..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-950 focus:outline-none focus:border-lime-500 transition"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto py-1">
                {filteredTeamList.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTeamProfile(t.name)}
                    className={'px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ' + (
                      selectedTeamProfile === t.name 
                        ? 'bg-slate-950 text-lime-400 shadow-sm font-mono' 
                        : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200 hover:border-slate-300'
                    )}
                  >
                    [{t.tag}] {t.name}
                  </button>
                ))}
              </div>
            </div>

            {activeTeamData && activeTeamScopedStats && (
              <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-400 to-lime-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm border border-lime-500/20">
                      {activeTeamData.tag}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-base text-slate-950">{activeTeamData.name}</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-semibold">
                          VERIFIED ROSTER
                        </span>
                        <span className={'text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ' + (
                          teamStatsCategory === 'Tour' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          teamStatsCategory === 'Scrim' ? 'bg-lime-100 text-lime-800 border border-lime-300' :
                          'bg-slate-200 text-slate-800'
                        )}>
                          VIEW: {teamStatsCategory.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">PUBG Mobile Competitive Team</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPerformanceTeam(activeTeamData);
                      setSelectedPerformanceHost('ALL');
                      setPerformanceModalCategory(teamStatsCategory);
                      setIsPerformanceModalOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-lime-400 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/10 border border-slate-800"
                  >
                    <TrendingUp className="w-4 h-4 text-lime-400"/>
                    <span>Team Performance Info</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Points</span>
                    <span className="text-xl font-black font-mono text-lime-700">{activeTeamScopedStats.totalPoints}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Eliminations</span>
                    <span className="text-xl font-black font-mono text-slate-900">{activeTeamScopedStats.totalKills}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Chicken Dinners</span>
                    <span className="text-xl font-black font-mono text-lime-700 flex items-center justify-center gap-1">
                      🍗 {activeTeamScopedStats.totalWWCD}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {teamStatsCategory === 'Tour' ? 'Tournaments' : teamStatsCategory === 'Scrim' ? 'Scrims' : 'Total Sessions'}
                    </span>
                    <span className="text-xl font-black font-mono text-slate-700">{activeTeamScopedStats.eventsCount}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Battle Records Log ({activeTeamScopedStats.filteredResults.length} Sessions)
                    </span>
                    <span className="text-[10px] text-lime-700 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3"/> Public Details
                    </span>
                  </div>

                  {activeTeamScopedStats.filteredResults && activeTeamScopedStats.filteredResults.length > 0 ? (
                    activeTeamScopedStats.filteredResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setInspectedScrim(item.scrimData)}
                        className="p-3 bg-slate-50 hover:bg-white active:scale-[0.99] border border-slate-200 hover:border-lime-400 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-xs"
                      >
                        <div className="flex items-center space-x-3">
                          {item.scrimData?.logo_url && (
                            <img src={item.scrimData.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{item.scrimName}</span>
                              <span className={'text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ' + (
                                (item.eventType || 'Scrim') === 'Tour' 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-lime-100 text-lime-900 border border-lime-300'
                              )}>
                                {(item.eventType || 'Scrim').toUpperCase()}
                              </span>
                              {item.isFinished && (
                                <span className="text-[9px] bg-slate-200 text-slate-800 px-1 rounded font-mono">Final</span>
                              )}
                              <ExternalLink className="w-3 h-3 text-slate-400"/>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="text-lime-700 font-bold">{item.scrimTier}</span>
                              <span>•</span>
                              <span>Host: {item.hostName}</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-right">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Kills</span>
                            <span className="text-xs font-mono font-bold text-slate-700">{item.kills} K</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Points</span>
                            <span className="text-xs font-mono font-black text-lime-700">{item.points} PTS</span>
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
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Tidak ada catatan riwayat di bawah kategori {teamStatsCategory} untuk tim ini.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-lime-600"/>
                    Session:
                  </span>
                  <select
                    value={activePublicScrim?.id || selectedScrimId}
                    onChange={(e) => {
                      setSelectedScrimId(e.target.value);
                      setLeaderboardFilter('overall');
                    }}
                    className="flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-lime-500 transition"
                  >
                    {filteredScrims.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.event_type || 'Scrim'}] [{s.tier?.slice(0, 6) || 'Tier'}] {s.title} ({s.date}) {s.is_finished ? '🏁 Final' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentUser && isAuthorizedAdmin(activePublicScrim) && (
                    <button
                      onClick={() => {
                        setAdminSelectedScrimId(activePublicScrim.id);
                        setActiveTab('admin');
                      }}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-lime-400 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5"/>
                      <span>Edit in Admin</span>
                    </button>
                  )}

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
                      className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4"/>
                      <span>PM Host</span>
                    </a>
                  )}

                  <button
                    onClick={handleDownloadPoster}
                    className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs"
                  >
                    <Download className="w-4 h-4"/>
                    <span className="hidden sm:inline">Poster PNG</span>
                  </button>

                  <button
                    onClick={handleCopyDiscordText}
                    className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    {copyFeedback ? <Check className="w-4 h-4 text-lime-600"/> : <Copy className="w-4 h-4 text-slate-600"/>}
                    <span className="hidden sm:inline">Copy Text</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 pt-1">
                {activePublicScrim?.logo_url ? (
                  <img 
                    src={activePublicScrim.logo_url} 
                    alt="Logo" 
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-lime-400 flex items-center justify-center text-slate-950 font-black text-xl flex-shrink-0 shadow-sm">
                    🏆
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={'text-[10px] font-black px-2 py-0.5 rounded-full font-mono ' + (
                      activePublicScrim?.event_type === 'Tour'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-lime-100 text-lime-800 border border-lime-300'
                    )}>
                      {(activePublicScrim?.event_type || 'Scrim').toUpperCase()}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {activePublicScrim?.tier || 'Tier 1'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {activePublicScrim?.date}
                    </span>
                    {activePublicScrim?.is_finished ? (
                      <span className="text-[10px] bg-slate-900 text-lime-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        🏁 Official Final
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase border border-slate-200">
                        Live Standings
                      </span>
                    )}
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-slate-950 mt-1 leading-tight">
                    {activePublicScrim?.title || 'No Scrim Session Available'}
                  </h1>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
                  <input
                    type="text"
                    placeholder="Search tournament or scrim name..."
                    value={searchScrimQuery}
                    onChange={(e) => setSearchScrimQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto py-0.5">
                  {['All', 'Scrim', 'Tour'].map(type => (
                    <button
                      key={type}
                      onClick={() => setLeaderboardEventTypeFilter(type)}
                      className={'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ' + (
                        leaderboardEventTypeFilter === type 
                          ? 'bg-slate-950 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      )}
                    >
                      {type === 'All' ? 'All Types' : type === 'Scrim' ? 'Scrims' : 'Tournaments'}
                    </button>
                  ))}

                  {['All', 'Tier 1 (Pro)', 'Tier 2 (Semi-Pro)', 'Tier 3 (Amateur)', 'Open Community'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ' + (
                        tierFilter === t 
                          ? 'bg-lime-400 text-slate-950 font-black shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      )}
                    >
                      {t === 'All' ? 'All Tiers' : t.split(' ')[0] + ' ' + t.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  onClick={() => setLeaderboardFilter('overall')}
                  className={'px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ' + (
                    leaderboardFilter === 'overall' 
                      ? 'bg-lime-400 text-slate-950 shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
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
                        ? 'bg-lime-400 text-slate-950 shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    )}
                  >
                    M{m.matchNo} ({m.map})
                  </button>
                ))}
              </div>
            </div>

            {leaderboardData.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400"/>
                <p className="font-bold text-xs text-slate-600">Tidak ada data ditemukan.</p>
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
                          ? 'bg-lime-50/70 border-lime-300 shadow-xs'
                          : row.rank === 2
                          ? 'bg-white border-slate-250 shadow-xs'
                          : row.rank === 3
                          ? 'bg-white border-slate-200'
                          : 'bg-white/80 border-slate-100'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={'w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ' + (
                            isFirst
                              ? 'bg-lime-400 text-slate-950 shadow-xs'
                              : row.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : row.rank === 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-500 font-mono'
                          )}
                        >
                          {row.rank}
                        </div>

                        <div>
                          <div className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                            <span>{row.teamName}</span>
                            {row.wwcd > 0 && (
                              <span className="text-[10px] bg-lime-100 border border-lime-300 text-lime-800 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                                🍗 x{row.wwcd}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Matches: {row.matchesPlayed}</span>
                            <span>•</span>
                            <span className="text-slate-700 font-semibold">Kills: {row.killPts}</span>
                            <span>•</span>
                            <span>Place: {row.placePts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base sm:text-xl font-black font-mono text-lime-700">
                          {row.totalPts}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
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

        {/* VIEW 3: DIREKTORI HOST */}
        {activeTab === 'hosts' && (
          <div className="space-y-4">
            
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-lime-600"/>
                  <span>Tournament Hosts & Organizers Directory</span>
                </h2>
                <p className="text-xs text-slate-500">Cari penyelenggara terverifikasi, lihat kontak, dan jelajahi turnamen yang diselenggarakan.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"/>
                <input
                  type="text"
                  placeholder="Cari nama host atau kontak..."
                  value={searchHostQuery}
                  onChange={(e) => setSearchHostQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizersList.map((host, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {host.avatar_url ? (
                          <img 
                            src={host.avatar_url} 
                            alt={host.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-lime-400 text-slate-950 font-black flex items-center justify-center text-base shadow-sm">
                            {host.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <h3 className="font-black text-base text-slate-950">{host.name}</h3>
                          <span className="text-[10px] bg-lime-100 text-lime-800 border border-lime-300 px-2 py-0.5 rounded-full font-mono font-bold">
                            {host.scrims.length} Events Hosted
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
                          className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5"/>
                          <span>PM Host</span>
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{host.bio}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hosted Events:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {host.scrims.slice(0, 4).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setInspectedScrim(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-lime-500 flex items-center gap-1 transition"
                        >
                          <span>{s.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono">({s.event_type || 'Scrim'})</span>
                          <ExternalLink className="w-3 h-3 text-slate-400"/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 4: SHOWCASE */}
        {activeTab === 'showcase' && (
          <div className="space-y-4">
            
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-lime-600"/>
                  <span>Showcase & Tournament Hub</span>
                </h2>
                <p className="text-[11px] text-slate-500">Posters, registrations, and clutch gameplay clips.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setShowcaseFilter('all')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'all' ? 'bg-slate-950 text-white' : 'text-slate-600')}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('achievement')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'achievement' ? 'bg-slate-950 text-white' : 'text-slate-600')}
                  >
                    Tournaments
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('clip')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'clip' ? 'bg-slate-950 text-white' : 'text-slate-600')}
                  >
                    Clips
                  </button>
                </div>

                {currentUser && (
                  <button
                    onClick={() => setIsShowcaseModalOpen(true)}
                    className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm"
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
                  <div key={post.id} className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="relative bg-black aspect-video overflow-hidden flex items-center justify-center">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" />
                      )}

                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-lime-400 text-slate-950">
                        {post.rank || 'Featured'}
                      </span>

                      {isMyPost && (
                        <button
                          onClick={() => handleDeletePost(post.id, post.created_by)}
                          className="absolute top-3 right-3 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition"
                          title="Hapus Kiriman Saya"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">[{post.team_tag}] {post.author}</span>
                        <span className="text-[10px] text-slate-500">{post.tournament}</span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-950 leading-snug">{post.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{post.caption}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW 5: PORTAL ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-4 sm:space-y-6">
            
            {!currentUser ? (
              <div className="max-w-md mx-auto my-8 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 bg-lime-100 border border-lime-300 text-lime-800 rounded-2xl flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6"/>
                  </div>
                  <h2 className="text-lg font-black text-slate-950">
                    Host Account Portal
                  </h2>
                  <p className="text-xs text-slate-500">
                    Masuk untuk mengelola Scrims & Tournaments, mengatur ronde pertempuran, dan data sesi privat Anda.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-600 uppercase font-bold mb-1">Email Resmi</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
                      <input
                        type="email"
                        required
                        placeholder="host@esports.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 uppercase font-bold mb-1">Kata Sandi</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl transition shadow-md shadow-lime-400/20 text-xs uppercase tracking-wider"
                  >
                    {authLoading ? 'Mohon tunggu...' : isRegisterMode ? 'Daftar sebagai Admin' : 'Masuk sebagai Admin'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                      className="text-xs text-lime-700 hover:underline font-semibold"
                    >
                      {isRegisterMode ? 'Sudah memiliki akun? Masuk' : 'Belum memiliki akun admin? Daftar'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                
                <div className="bg-lime-100/80 border border-lime-300/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-lime-800"/>
                    <span className="text-xs font-bold text-lime-950">
                      Sedang mengedit: <strong className="font-mono">[{activeAdminScrim?.event_type === 'Tour' ? 'Tour' : 'Scrim'}] {activeAdminScrim?.title || 'Tidak Ada Sesi'}</strong>
                    </span>
                  </div>

                  {activeAdminScrim && (
                    <button
                      onClick={() => {
                        setSelectedScrimId(activeAdminScrim.id);
                        setActiveTab('leaderboard');
                      }}
                      className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-lime-400 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <span>📊 Lihat Live Leaderboard</span>
                    </button>
                  )}
                </div>

                <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 bg-lime-400 text-slate-950 font-black rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5"/>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-950 text-xs sm:text-sm">
                          {profileName || currentUser.email}
                        </span>
                        <span className="text-[9px] bg-lime-100 text-lime-800 border border-lime-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          VERIFIED HOST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Info className="w-3 h-3 text-lime-600"/>
                        <span>Ruang kerja privat: Hanya sesi yang Anda kelola yang ditampilkan di sini.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-lime-700"/>
                      <span>Profil Host Saya</span>
                    </button>

                    {activeAdminScrim && isAuthorizedAdmin(activeAdminScrim) && (
                      <button
                        onClick={handleCopyHostShareLink}
                        className="px-3 py-1.5 bg-lime-50 hover:bg-lime-100 text-lime-800 border border-lime-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5"/>
                        <span className="hidden sm:inline">Salin Link Co-Host</span>
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="p-2 sm:px-3 sm:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4"/>
                      <span className="hidden sm:inline">Keluar</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Pilihan Sesi */}
                  <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Daftar Sesi Saya ({adminHostedScrims.length})
                      </span>
                    </div>

                    {adminHostedScrims.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        Belum ada sesi yang dibuat. Gunakan formulir di sebelah kanan untuk menyelenggarakan Scrim atau Tournament pertama Anda!
                      </div>
                    ) : (
                      <select
                        value={adminSelectedScrimId}
                        onChange={(e) => setSelectedMatchIdx(0) || setAdminSelectedScrimId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-500 font-bold"
                      >
                        {adminHostedScrims.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.event_type || 'Scrim'}] [{s.tier?.slice(0, 6) || 'Tier'}] {s.title} {s.is_finished ? '(🏁 Selesai)' : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {activeAdminScrim && (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center space-x-3">
                          {activeAdminScrim.logo_url && (
                            <img src={activeAdminScrim.logo_url} alt="Logo" className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                          )}
                          <div className="flex-1">
                            <div className="font-bold text-xs text-slate-900">{activeAdminScrim.title}</div>
                            <div className="text-[10px] text-lime-700 font-bold">
                              {activeAdminScrim.event_type || 'Scrim'} • {activeAdminScrim.tier} • {activeAdminScrim.matches?.length || 0} Ronde Dimainkan
                            </div>
                          </div>
                        </div>

                        {activeAdminScrim.is_finished ? (
                          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                            <span className="font-bold flex items-center gap-1">
                              <LockKeyhole className="w-3.5 h-3.5 text-lime-700"/> Sesi Selesai (Skor Terkunci)
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-between text-xs text-lime-800">
                            <span className="font-bold flex items-center gap-1">
                              <Unlock className="w-3.5 h-3.5"/> Sedang Berjalan & Bisa Diedit
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={openEditScrimModal}
                            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-200"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-lime-700"/>
                            <span>Edit Sesi</span>
                          </button>

                          <button
                            onClick={handleToggleFinishScrim}
                            className={'px-2.5 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm ' + (
                              activeAdminScrim.is_finished 
                                ? 'bg-slate-100 text-slate-700 border border-slate-300' 
                                : 'bg-lime-400 hover:bg-lime-300 text-slate-950'
                            )}
                          >
                            {activeAdminScrim.is_finished ? <Unlock className="w-3.5 h-3.5"/> : <CheckSquare className="w-3.5 h-3.5"/>}
                            <span>{activeAdminScrim.is_finished ? 'Buka Kembali' : 'Selesaikan'}</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Formulir Buat Scrim / Tour */}
                  <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Plus className="w-4 h-4 text-lime-600"/>
                        <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                          Buat Sesi Pertandingan Baru
                        </h3>
                      </div>

                      {/* Tombol Pilihan Kategori: Scrim vs Tour */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setNewEventType('Scrim')}
                          className={'px-3 py-1 rounded-lg font-bold transition ' + (newEventType === 'Scrim' ? 'bg-lime-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950')}
                        >
                          Scrim
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEventType('Tour')}
                          className={'px-3 py-1 rounded-lg font-bold transition ' + (newEventType === 'Tour' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950')}
                        >
                          Tour (Tournament)
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">
                      Pilihan kategori: <strong className="text-slate-800">{newEventType === 'Tour' ? 'Official Tournament' : 'Scrim Practice'}</strong>. Data statistik tim akan dipisahkan secara otomatis.
                    </p>

                    <form onSubmit={handleCreateNewScrim} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            {newEventType === 'Tour' ? 'Judul Tournament' : 'Judul Scrim'}
                          </label>
                          <input
                            type="text"
                            placeholder={newEventType === 'Tour' ? 'contoh: PMSL SEA Qualifier Season 2' : 'contoh: Pro Night Scrim Fast 4 Maps'}
                            value={newScrimTitle}
                            onChange={(e) => setNewScrimTitle(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-lime-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Kategori / Tier</label>
                          <select
                            value={newScrimTier}
                            onChange={(e) => setNewScrimTier(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none"
                          >
                            {TIER_OPTIONS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Unggah Logo</label>
                          <label className="flex items-center justify-center gap-1.5 w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-slate-600 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-lime-600"/>
                            <span className="truncate">{logoFile ? logoFile.name : 'Pilih File Gambar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setLogoFile(e.target.files[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Kontak Host (WhatsApp / Discord)</label>
                          <input
                            type="text"
                            placeholder="contoh: +60123456789 atau @discord"
                            value={newHostContact}
                            onChange={(e) => setNewHostContact(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Deskripsi & Peraturan</label>
                          <input
                            type="text"
                            placeholder="contoh: 16 Tim Undangan, rekaman POV wajib"
                            value={newScrimDesc}
                            onChange={(e) => setNewScrimDesc(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggal</label>
                            <input
                              type="date"
                              value={newScrimDate}
                              onChange={(e) => setNewScrimDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 focus:outline-none text-[11px]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isUploadingLogo}
                            className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-4 py-2 rounded-xl transition flex items-center justify-center shadow-sm"
                          >
                            {isUploadingLogo ? '...' : <Plus className="w-4 h-4"/>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                </div>

                {/* Kontrol Ronde Match */}
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-3.5 space-y-2 shadow-sm">
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
                                ? 'bg-slate-950 text-lime-400 shadow-sm' 
                                : 'bg-slate-100 text-slate-600 hover:text-slate-950 border border-slate-200'
                            )}
                          >
                            <span>Match {idx + 1}</span>
                            {isSaved && <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>}
                          </button>
                        );
                      })}

                      {!activeAdminScrim?.is_finished && (
                        <button
                          onClick={handleAddNewMatch}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-lime-100 hover:bg-lime-200 text-lime-800 border border-lime-300 transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5"/>
                          <span>Tambah Ronde</span>
                        </button>
                      )}

                      {!activeAdminScrim?.is_finished && (activeAdminScrim?.matches?.length > 1) && (
                        <button
                          onClick={handleRemoveLastMatch}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 transition flex items-center gap-1"
                        >
                          <Minus className="w-3.5 h-3.5"/>
                          <span>Hapus Terakhir</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <select
                        value={inputMap}
                        onChange={(e) => setInputMap(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none font-bold"
                      >
                        <option value="Erangel">Erangel</option>
                        <option value="Miramar">Miramar</option>
                        <option value="Sanhok">Sanhok</option>
                        <option value="Vikendi">Vikendi</option>
                      </select>

                      <button
                        onClick={handleRandomizeTestData}
                        disabled={activeAdminScrim?.is_finished}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5"/>
                        <span className="hidden sm:inline">Isi Cepat</span>
                      </button>
                    </div>

                  </div>

                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Info className="w-3 h-3 text-slate-400"/>
                    <span>Mengisi skor Match {selectedMatchIdx + 1} di peta {inputMap}. Sesuaikan posisi rank & kills, lalu simpan.</span>
                  </p>
                </div>

                {/* Tampilan Input Skor Mobile */}
                <div className="md:hidden space-y-2.5">
                  {matchSlots.map((row, idx) => {
                    const isWWCD = Number(row.placement) === 1;
                    return (
                      <div
                        key={idx}
                        className={'p-3.5 rounded-2xl border transition ' + (
                          isWWCD 
                            ? 'bg-lime-50 border-lime-300 shadow-xs' 
                            : 'bg-white border-slate-200 shadow-xs'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              #{row.slot}
                            </span>
                            <input
                              type="text"
                              disabled={activeAdminScrim?.is_finished}
                              value={row.teamName}
                              onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                              className="bg-transparent font-bold text-slate-900 text-xs border-b border-transparent focus:border-lime-500 focus:outline-none flex-1 truncate"
                            />
                          </div>

                          <div className="text-right flex items-center gap-1.5">
                            {isWWCD && (
                              <span className="bg-lime-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                WWCD
                              </span>
                            )}
                            <div className="text-xs font-black font-mono text-lime-800 bg-lime-100 px-2.5 py-1 rounded-lg border border-lime-200">
                              {row.totalPts} <span className="text-[9px] text-slate-500">PTS</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Rank:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">#</span>
                              <input
                                type="number"
                                min="1"
                                max="16"
                                disabled={activeAdminScrim?.is_finished}
                                value={row.placement}
                                onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                                className="w-10 bg-transparent text-center font-bold text-slate-900 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase font-bold pl-1">Kills:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={activeAdminScrim?.is_finished}
                                onClick={() => handleAdjustKills(idx, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-black disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-slate-900 text-xs">
                                {row.kills}
                              </span>
                              <button
                                type="button"
                                disabled={activeAdminScrim?.is_finished}
                                onClick={() => handleAdjustKills(idx, 1)}
                                className="w-6 h-6 rounded-lg bg-lime-400 active:bg-lime-300 text-slate-950 flex items-center justify-center font-black disabled:opacity-50"
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

                {/* Tabel Input Desktop */}
                <div className="hidden md:block bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-white text-xs font-bold uppercase tracking-wider border-b border-slate-200">
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
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {matchSlots.map((row, idx) => {
                          const isWWCD = Number(row.placement) === 1;
                          return (
                            <tr key={idx} className={isWWCD ? 'bg-lime-50/80' : 'hover:bg-slate-50'}>
                              <td className="py-2.5 px-4 text-center text-slate-400 font-bold">#{row.slot}</td>
                              <td className="py-2.5 px-4 font-sans">
                                <input
                                  type="text"
                                  disabled={activeAdminScrim?.is_finished}
                                  value={row.teamName}
                                  onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-semibold focus:outline-none focus:border-lime-500"
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
                                  className="w-16 bg-slate-50 border border-slate-200 text-center rounded-lg py-1 font-bold text-slate-900 focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={activeAdminScrim?.is_finished}
                                  value={row.kills}
                                  onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-200 text-center rounded-lg py-1 font-bold text-slate-900 focus:outline-none"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center text-slate-500 font-bold">{row.placePts}</td>
                              <td className="py-2.5 px-4 text-center text-lime-700 font-extrabold text-sm">{row.totalPts}</td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                {isWWCD ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-lime-400 text-slate-950">
                                    WWCD
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="fixed md:static bottom-16 md:bottom-auto left-0 right-0 p-3 bg-white/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 border-slate-200 z-30">
                  <button
                    onClick={handleSaveMatchScore}
                    disabled={activeAdminScrim?.is_finished}
                    className={'w-full py-3 md:py-2.5 font-black rounded-2xl md:rounded-xl shadow-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition ' + (
                      activeAdminScrim?.is_finished 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-lime-400 hover:bg-lime-300 active:bg-lime-500 text-slate-950 shadow-lime-400/20'
                    )}
                  >
                    <Save className="w-4 h-4"/>
                    <span>{activeAdminScrim?.is_finished ? 'Keputusan Dikunci (Selesai)' : 'Save Match ' + (selectedMatchIdx + 1) + ' Scores'}</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL: INFO PERFORMA TIM & SHARE STORY */}
      {isPerformanceModalOpen && performanceTeam && filteredTeamPerformance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                  {performanceTeam.tag}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-950 flex items-center gap-1.5">
                    <span>{performanceTeam.name}</span>
                    <span className="text-[10px] bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full font-mono">
                      Career Analytics
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Visual performance & organizer metrics</span>
                </div>
              </div>

              <button 
                onClick={() => setIsPerformanceModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Medal className="w-3.5 h-3.5 text-lime-600"/>
                  <span>Kategori Acara:</span>
                </span>
                <select
                  value={performanceModalCategory}
                  onChange={(e) => setPerformanceModalCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-lime-500 shadow-xs"
                >
                  <option value="ALL">Semua Kategori (Scrim + Tour)</option>
                  <option value="Scrim">Hanya Scrim (Latihan)</option>
                  <option value="Tour">Hanya Tournament (Resmi)</option>
                </select>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Filter className="w-3.5 h-3.5 text-lime-600"/>
                  <span>Penyelenggara / Host:</span>
                </span>
                <select
                  value={selectedPerformanceHost}
                  onChange={(e) => setSelectedPerformanceHost(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-lime-500 shadow-xs"
                >
                  <option value="ALL">Semua Host</option>
                  {organizersList.map(h => (
                    <option key={h.id || h.name} value={h.id || h.name}>
                      Host: {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Avg Points / Scrim</span>
                <span className="text-base font-black font-mono text-lime-700">
                  {filteredTeamPerformance.avgPts}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Avg Kills / Scrim</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {filteredTeamPerformance.avgKills}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Win Rate (WWCD)</span>
                <span className="text-base font-black font-mono text-lime-700">
                  {filteredTeamPerformance.winRate}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Sesi Terfilter</span>
                <span className="text-base font-black font-mono text-slate-700">
                  {filteredTeamPerformance.results.length} Sesi
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-lime-600"/>
                  <span>Points & Kills per Session</span>
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-lime-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-lime-500 inline-block"></span> Points
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 inline-block"></span> Kills
                  </span>
                </div>
              </div>

              {filteredTeamPerformance.results.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada catatan riwayat pertandingan di bawah filter ini.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {filteredTeamPerformance.results.map((item, idx) => {
                    const maxPts = Math.max(...filteredTeamPerformance.results.map(s => s.points), 40);
                    const ptsPct = Math.min(100, (item.points / maxPts) * 100);
                    const killsPct = Math.min(100, (item.kills / maxPts) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs flex items-center gap-1">
                            <span>{item.scrimName}</span>
                            <span className="text-[9px] text-slate-500 font-mono">[{item.eventType?.slice(0, 4) || 'Scri'}]</span>
                          </span>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {item.points} PTS • {item.kills} K ({item.date})
                          </span>
                        </div>
                        
                        <div className="h-4 bg-slate-200/80 rounded-lg overflow-hidden flex flex-col justify-center gap-0.5 p-0.5">
                          <div 
                            style={{ width: `${Math.max(5, ptsPct)}%` }} 
                            className="h-1.5 bg-lime-500 rounded-full transition-all"
                          />
                          <div 
                            style={{ width: `${Math.max(5, killsPct)}%` }} 
                            className="h-1 bg-slate-800 rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleShareToInstagramStory(
                  performanceTeam, 
                  filteredTeamPerformance, 
                  selectedPerformanceHost === 'ALL' 
                    ? 'ALL' 
                    : (organizersList.find(h => h.id === selectedPerformanceHost || h.name === selectedPerformanceHost)?.name || selectedPerformanceHost),
                  performanceModalCategory === 'ALL' ? 'Official Scrim & Tour' : (performanceModalCategory === 'Tour' ? 'Tournament' : 'Scrim')
                )}
                disabled={isGeneratingStory}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition"
              >
                <Share className="w-4 h-4"/>
                <span>{isGeneratingStory ? 'Rendering Card...' : 'Share to IG Story'}</span>
              </button>

              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="px-4 py-2.5 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL MASUKAN PENGEMBANG */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center">
                  <Bug className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-950">Developer Feedback & Bug Report</h3>
                  <span className="text-[10px] text-slate-400">Pesan langsung ke ry.khor</span>
                </div>
              </div>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Kategori</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                >
                  <option value="Bug Report">🐛 Laporan Bug / Error</option>
                  <option value="Feature Request">💡 Permintaan Fitur / Saran</option>
                  <option value="UI/Design Feedback">🎨 Masukan Tampilan Desain</option>
                  <option value="Other Inquiry">💬 Pertanyaan Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Email Anda (Opsional)</label>
                <input
                  type="email"
                  placeholder="name@email.com (jika ingin dihubungi kembali)"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Pesan / Detail Masukan</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Jelaskan masalah atau fitur yang ingin diperbaiki..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingFeedback}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5"/>
                  <span>{isSendingFeedback ? 'Mengirim...' : 'Kirim Masukan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFIL HOST */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-950 flex items-center gap-1.5">
                <User className="w-4 h-4 text-lime-600"/>
                <span>Profil Publik Host & Foto</span>
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Foto Profil Host</label>
                <div className="flex items-center space-x-3">
                  {avatarFile ? (
                    <div className="w-12 h-12 rounded-2xl bg-lime-100 border border-lime-300 flex items-center justify-center font-bold text-lime-800 text-[10px]">
                      Selected
                    </div>
                  ) : profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <User className="w-5 h-5"/>
                    </div>
                  )}

                  <label className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl p-2.5 text-slate-700 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-lime-600"/>
                    <span className="truncate">{avatarFile ? avatarFile.name : 'Unggah Foto Profil'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Nama Tampilan Penyelenggara</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: RYKHOR Esports Organizer"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Kontak Resmi (WhatsApp / Telegram)</label>
                <input
                  type="text"
                  placeholder="+60123456789 atau @username"
                  value={profileContact}
                  onChange={(e) => setProfileContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Tentang / Bio Host</label>
                <textarea
                  rows="3"
                  placeholder="Jelaskan mengenai turnamen atau slot scrim reguler Anda..."
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black shadow-xs"
                >
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PENGATURAN SESI */}
      {isEditScrimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-950 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-lime-600"/>
                <span>Edit Pengaturan Acara</span>
              </h3>
              <button onClick={() => setIsEditScrimModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateScrimSettings} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Kategori Acara</label>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditEventType('Scrim')}
                    className={'flex-1 py-1.5 rounded-lg font-bold transition ' + (editEventType === 'Scrim' ? 'bg-lime-400 text-slate-950 shadow-xs' : 'text-slate-600')}
                  >
                    Scrim (Latihan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditEventType('Tour')}
                    className={'flex-1 py-1.5 rounded-lg font-bold transition ' + (editEventType === 'Tour' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600')}
                  >
                    Tour (Turnamen Resmi)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Judul Acara</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Tier / Divisi</label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
                >
                  {TIER_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Ganti Logo Acara (Opsional)</label>
                <label className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl p-2.5 text-slate-700 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-lime-600"/>
                  <span className="truncate">{editLogoFile ? editLogoFile.name : 'Pilih file gambar logo baru'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditLogoFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Kontak Host</label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  placeholder="contoh: +60123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Deskripsi & Peraturan</label>
                <textarea
                  rows="2"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditScrimModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black shadow-xs"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PUBLIK: RINCIAN ACARA */}
      {inspectedScrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                {inspectedScrim.logo_url && (
                  <img src={inspectedScrim.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={'text-[10px] font-black px-2 py-0.5 rounded-full font-mono ' + (
                      inspectedScrim.event_type === 'Tour'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-lime-100 text-lime-800 border border-lime-300'
                    )}>
                      {(inspectedScrim.event_type || 'Scrim').toUpperCase()}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {inspectedScrim.tier || 'Tier 1'}
                    </span>
                    <span className="text-[10px] text-slate-500">{inspectedScrim.date}</span>
                    {inspectedScrim.is_finished && (
                      <span className="text-[10px] bg-slate-900 text-lime-400 font-black px-2 py-0.5 rounded-full uppercase">
                        Final
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                    {inspectedScrim.title}
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setInspectedScrim(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Penyelenggara / Host</span>
                <span className="font-bold text-slate-900">{inspectedScrim.host_name || 'Official Host'}</span>
                <p className="text-[11px] text-slate-600 mt-0.5">{inspectedScrim.description}</p>
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
                  className="px-3 py-1.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5"/>
                  <span>PM Host</span>
                </a>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-900 tracking-wider block">
                Peringkat Akhir (Standings)
              </span>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {calculateLeaderboard(inspectedScrim, 'overall').map((teamRow) => (
                  <div
                    key={teamRow.teamId}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={'w-6 text-center font-black ' + (teamRow.rank === 1 ? 'text-lime-700' : 'text-slate-500')}>
                        #{teamRow.rank}
                      </span>
                      <span className="font-bold text-slate-900">{teamRow.teamName}</span>
                      {teamRow.wwcd > 0 && (
                        <span className="text-[9px] text-lime-800 bg-lime-100 border border-lime-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          🍗 x{teamRow.wwcd}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-right font-mono">
                      <span className="text-slate-500 text-[11px]">{teamRow.killPts} K</span>
                      <span className="text-lime-700 font-black text-sm">{teamRow.totalPts} PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectedScrim(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL ADMIN: UNGGAH POSTER */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-950 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-lime-600"/>
                <span>Terbitkan Poster Turnamen / Cuplikan</span>
              </h3>
              <button onClick={() => setIsShowcaseModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateShowcasePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Tipe Post</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                >
                  <option value="poster">Poster Turnamen (Gambar)</option>
                  <option value="clip">Sorotan Gameplay (File Video)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Judul</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: PMSL SEA Spring Qualifier Open Slot"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Pilih File dari Perangkat</label>
                <label className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl p-3 text-slate-700 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-lime-600"/>
                  <span className="font-medium truncate">{showcaseFile ? showcaseFile.name : 'Klik untuk Unggah Gambar / MP4'}</span>
                  <input
                    type="file"
                    accept={postType === 'clip' ? 'video/*' : 'image/*'}
                    onChange={(e) => setShowcaseFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-bold mb-1">Keterangan / Tautan Pendaftaran</label>
                <textarea
                  rows="3"
                  placeholder="Keterangan ketersediaan slot, hadiah, syarat..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingShowcase}
                  className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black shadow-xs"
                >
                  {isUploadingShowcase ? 'Mengunggah...' : 'Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK NAVIGASI MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('teams')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'teams' ? 'text-lime-700 font-bold' : 'text-slate-400')}
        >
          <Users className="w-5 h-5"/>
          <span className="text-[10px] mt-0.5">Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'leaderboard' ? 'text-lime-700 font-bold' : 'text-slate-400')}
        >
          <Trophy className="w-5 h-5"/>
          <span className="text-[10px] mt-0.5">Standings</span>
        </button>

        <button
          onClick={() => setActiveTab('hosts')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'hosts' ? 'text-lime-700 font-bold' : 'text-slate-400')}
        >
          <Award className="w-5 h-5"/>
          <span className="text-[10px] mt-0.5">Hosts</span>
        </button>

        <button
          onClick={() => setActiveTab('showcase')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'showcase' ? 'text-lime-700 font-bold' : 'text-slate-400')}
        >
          <Sparkles className="w-5 h-5"/>
          <span className="text-[10px] mt-0.5">Showcase</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={'flex flex-col items-center py-1 px-3 rounded-xl transition ' + (activeTab === 'admin' ? 'text-lime-700 font-bold' : 'text-slate-400')}
        >
          {currentUser ? <User className="w-5 h-5 text-lime-700"/> : <Lock className="w-3.5 h-3.5 text-slate-500"/>}
          <span className="text-[10px] mt-0.5">Admin</span>
        </button>
      </div>

    </div>
  );
}
``