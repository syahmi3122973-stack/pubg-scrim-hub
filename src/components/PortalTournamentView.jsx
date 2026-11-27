import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Gamepad2,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Swords,
  Ticket,
  Trash2,
  Trophy,
  Upload,
  Users,
  X
} from 'lucide-react';
import RegistrationManagerTab from './RegistrationManagerTab';
import { optimizePosterForOcr } from './ScrimDataHubView';
import { scanReceiptImage } from '../utils/receiptOcr';
import { safeExternalUrl, safeMediaUrl, sanitizeTextInput, validateUploadFile } from '../utils/security';

const LEGACY_PLACEHOLDER_LOGO = 'photo-1542751371-adc38448a05e';

function getPortalSessionPosterUrl(scrim) {
  const rawLogo = String(scrim?.logo_url || '').trim();
  if (rawLogo && !rawLogo.includes(LEGACY_PLACEHOLDER_LOGO)) {
    const safe = safeMediaUrl(rawLogo);
    if (safe) return safe;
  }
  if (String(scrim?.title || '').trim().toLowerCase() === 'test') {
    return '/posters/test-tournament-blue.jpg';
  }
  return null;
}

function getUsedRosterSlots(scrim) {
  const used = new Set();
  const matches = Array.isArray(scrim?.matches) ? scrim.matches : [];
  for (const m of matches) {
    const results = Array.isArray(m?.results) ? m.results : [];
    for (const r of results) {
      if (r && (r.teamName || r.teamId) && Number(r.slot) > 0) {
        used.add(Number(r.slot));
      }
    }
  }
  return used.size;
}

export default function PortalTournamentView({
  supabase,
  scrims = [],
  currentUser,
  authGateNode,
  uploadMediaToSupabase,
  showToast,
  portalSection = 'register',
  onChangePortalSection,
  onExitPortal,
  canManageRegistrations = false,
  isMasterAdmin = false,
  portalApprovalRecord = null,
  onRequestPortalAccess = null,
  authorizedScrims = [],
  onAutoSeedSession,
  onSavePortalTournament = null,
  onTogglePortalRegistration = null,
  onOpenPortalQuickScore = null,
  renderQuickScorer = null
}) {
  const [timingFilter, setTimingFilter] = useState('Semua Masa');
  const [registerStep, setRegisterStep] = useState('list'); // 'list' -> 'detail' -> 'form'
  const [pendingDeepLinkSessionId, setPendingDeepLinkSessionId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return sanitizeTextInput(params.get('sesi') || '', 120);
    } catch {
      return '';
    }
  });
  const [urusResetKey, setUrusResetKey] = useState(0);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  useEffect(() => {
    if (portalSection === 'manage' && !canManageRegistrations) {
      onChangePortalSection?.('register');
    }
  }, [portalSection, canManageRegistrations, onChangePortalSection]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [slotCounts, setSlotCounts] = useState({});

  // Admin Create/Edit Portal Tournament Modal state
  const [isPortalFormOpen, setIsPortalFormOpen] = useState(false);
  const [editingPortalScrim, setEditingPortalScrim] = useState(null);
  const [ptTitle, setPtTitle] = useState('');
  const [ptTiming, setPtTiming] = useState('');
  const [ptDate, setPtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ptTotalMatches, setPtTotalMatches] = useState(5);
  const [ptRoomType, setPtRoomType] = useState('Squad TPP');
  const [ptPrizePool, setPtPrizePool] = useState('');
  const [ptEntryFee, setPtEntryFee] = useState('0');
  const [ptMaxSlots, setPtMaxSlots] = useState(16);
  const [ptWhatsappLink, setPtWhatsappLink] = useState('');
  const [ptDesc, setPtDesc] = useState('');
  const [ptPosterFile, setPtPosterFile] = useState(null);
  const [ptPosterPreviewUrl, setPtPosterPreviewUrl] = useState('');
  const [ptRemovePoster, setPtRemovePoster] = useState(false);
  const [ptQrFile, setPtQrFile] = useState(null);
  const [ptRemoveQr, setPtRemoveQr] = useState(false);
  const [isSavingPortal, setIsSavingPortal] = useState(false);

  // Registration form fields
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [captainWhatsapp, setCaptainWhatsapp] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [ocrStatus, setOcrStatus] = useState({
    scanning: false,
    progress: 0,
    done: false,
    ocrExtractedAmount: null,
    ocrReferenceNo: null,
    isDuplicateRef: false,
    error: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // /status lookup state
  const [statusWhatsappInput, setStatusWhatsappInput] = useState('');
  const [statusResults, setStatusResults] = useState([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasSearchedStatus, setHasSearchedStatus] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);

  useEffect(() => {
    if (currentUser?.email && !captainEmail) {
      setCaptainEmail(currentUser.email);
    }
  }, [currentUser, captainEmail]);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl && receiptPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  useEffect(() => {
    return () => {
      if (ptPosterPreviewUrl && ptPosterPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(ptPosterPreviewUrl);
      }
    };
  }, [ptPosterPreviewUrl]);

  const fetchSlotCounts = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('get_open_registration_slot_counts');
      if (error || !Array.isArray(data)) return;
      const next = {};
      for (const row of data) {
        next[row.scrim_id] = {
          verified: Number(row.verified_count || 0),
          pending: Number(row.pending_count || 0)
        };
      }
      setSlotCounts(next);
    } catch {
      // Non-fatal fallback to match slots only
    }
  }, [supabase]);

  useEffect(() => {
    fetchSlotCounts();
  }, [fetchSlotCounts]);

  const fetchMyRegistrations = useCallback(async () => {
    if (!supabase || !currentUser?.id) {
      setMyRegistrations([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('id, scrim_id, team_name, team_tag, captain_whatsapp, status, assigned_slot, created_at')
        .eq('registered_by', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && Array.isArray(data)) {
        setMyRegistrations(data);
      }
    } catch {
      // Ignore silent read failure
    }
  }, [supabase, currentUser]);

  useEffect(() => {
    if (currentUser?.id && (portalSection === 'register' || portalSection === 'status')) {
      fetchMyRegistrations();
    } else if (!currentUser?.id) {
      setMyRegistrations([]);
    }
  }, [portalSection, currentUser, fetchMyRegistrations]);

  const activeRegistrationByScrim = useMemo(() => {
    const map = new Map();
    for (const reg of myRegistrations) {
      if (reg?.scrim_id && reg.status !== 'rejected' && !map.has(reg.scrim_id)) {
        map.set(reg.scrim_id, reg);
      }
    }
    return map;
  }, [myRegistrations]);

  // STRICT ISOLATION: ONLY tournaments opened inside Portal Tournament (portal_enabled === true)
  const openSessions = useMemo(() => {
    return scrims.filter((s) => Boolean(s.portal_enabled) && !s.is_finished && !s.is_draft);
  }, [scrims]);

  const openPortalCreateModal = () => {
    setEditingPortalScrim(null);
    setPtTitle('');
    setPtTiming('');
    setPtDate(new Date().toISOString().split('T')[0]);
    setPtTotalMatches(5);
    setPtRoomType('Squad TPP');
    setPtPrizePool('');
    setPtEntryFee('0');
    setPtMaxSlots(16);
    setPtWhatsappLink('');
    setPtDesc('');
    setPtPosterFile(null);
    setPtPosterPreviewUrl('');
    setPtRemovePoster(false);
    setPtQrFile(null);
    setPtRemoveQr(false);
    setIsPortalFormOpen(true);
  };

  const openPortalEditModal = (scrim) => {
    if (!scrim) return;
    setEditingPortalScrim(scrim);
    setPtTitle(scrim.title || '');
    setPtTiming(scrim.session_timing || '');
    setPtDate(scrim.date || new Date().toISOString().split('T')[0]);
    setPtTotalMatches(Math.min(12, Math.max(1, Number(scrim.total_matches || scrim.matches?.length || 5))));
    setPtRoomType(scrim.room_type || 'Squad TPP');
    setPtPrizePool(scrim.prize_pool || '');
    setPtEntryFee(String(scrim.entry_fee ?? 0));
    setPtMaxSlots(Math.min(25, Math.max(2, Number(scrim.max_slots || 16))));
    setPtWhatsappLink(scrim.whatsapp_lobby_link || '');
    setPtDesc(scrim.description || '');
    setPtPosterFile(null);
    setPtPosterPreviewUrl('');
    setPtRemovePoster(false);
    setPtQrFile(null);
    setPtRemoveQr(false);
    setIsPortalFormOpen(true);
  };

  const handleSavePortalForm = async (e) => {
    e.preventDefault();
    if (!onSavePortalTournament || isSavingPortal) return;
    const cleanTitle = sanitizeTextInput(ptTitle, 120);
    if (!cleanTitle) {
      showToast?.('Sila masukkan nama tournament.');
      return;
    }

    setIsSavingPortal(true);
    try {
      let posterUrl =
        editingPortalScrim?.logo_url && !String(editingPortalScrim.logo_url).includes(LEGACY_PLACEHOLDER_LOGO)
          ? editingPortalScrim.logo_url
          : null;
      if (ptPosterFile) {
        posterUrl = await uploadMediaToSupabase(ptPosterFile, 'logos');
      } else if (ptRemovePoster) {
        posterUrl = null;
      }

      let qrUrl = editingPortalScrim?.qr_image_url || null;
      if (ptQrFile) {
        qrUrl = await uploadMediaToSupabase(ptQrFile, 'qr-codes');
      } else if (ptRemoveQr) {
        qrUrl = null;
      }

      const payload = {
        title: cleanTitle,
        event_category: editingPortalScrim?.event_category || 'Night Scrim',
        session_timing: sanitizeTextInput(ptTiming, 40) || null,
        date: ptDate || new Date().toISOString().split('T')[0],
        total_matches: Math.min(12, Math.max(1, Number.parseInt(ptTotalMatches, 10) || 5)),
        room_type: sanitizeTextInput(ptRoomType, 40) || 'Squad TPP',
        prize_pool: sanitizeTextInput(ptPrizePool, 140) || null,
        entry_fee: Number(Math.max(0, Number.parseFloat(ptEntryFee) || 0).toFixed(2)),
        max_slots: Math.min(25, Math.max(2, Number.parseInt(ptMaxSlots, 10) || 16)),
        whatsapp_lobby_link: safeExternalUrl(ptWhatsappLink),
        description: sanitizeTextInput(ptDesc, 1200),
        logo_url: safeMediaUrl(posterUrl),
        qr_image_url: safeMediaUrl(qrUrl),
        portal_enabled: true
      };

      const res = await onSavePortalTournament(payload, editingPortalScrim?.id || null);
      if (res?.error) {
        throw new Error(res.error);
      }
      setIsPortalFormOpen(false);
      setEditingPortalScrim(null);
      await fetchSlotCounts();
    } catch (err) {
      showToast?.(`Gagal simpan tournament portal: ${err?.message || 'ralat'}`);
    } finally {
      setIsSavingPortal(false);
    }
  };

  // Dynamic custom timings derived strictly from open sessions
  const availableTimings = useMemo(() => {
    const set = new Set();
    for (const s of openSessions) {
      const timing = String(s.session_timing || '').trim();
      if (timing) set.add(timing);
    }
    return ['Semua Masa', ...Array.from(set)];
  }, [openSessions]);

  useEffect(() => {
    if (!availableTimings.includes(timingFilter)) {
      setTimingFilter('Semua Masa');
    }
  }, [availableTimings, timingFilter]);

  const filteredSessions = useMemo(() => {
    return openSessions.filter((s) => {
      if (timingFilter !== 'Semua Masa' && String(s.session_timing || '').trim() !== timingFilter) {
        return false;
      }
      return true;
    });
  }, [openSessions, timingFilter]);

  const getSessionSlotMeta = useCallback(
    (scrim) => {
      const maxSlots = Math.max(2, Math.min(25, Number(scrim?.max_slots || 16)));
      const regMeta = slotCounts[scrim?.id] || { verified: 0, pending: 0 };
      const rosterUsed = getUsedRosterSlots(scrim);
      const occupied = Math.max(rosterUsed, regMeta.verified);
      const remaining = Math.max(0, maxSlots - occupied);
      return {
        maxSlots,
        occupied,
        pending: regMeta.pending,
        remaining,
        isFull: remaining <= 0
      };
    },
    [slotCounts]
  );

  useEffect(() => {
    if (selectedSessionId && !openSessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId('');
      setRegisterStep('list');
    }
  }, [openSessions, selectedSessionId]);

  const syncSessionQueryParam = useCallback((sessionId) => {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    if (path !== '/portal-tournament' && path !== '/register') return;
    const nextUrl = sessionId
      ? `${path}?sesi=${encodeURIComponent(sessionId)}`
      : path;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, []);

  useEffect(() => {
    if (!pendingDeepLinkSessionId) return;
    const matchedOpen = openSessions.find((s) => s.id === pendingDeepLinkSessionId);
    if (matchedOpen) {
      setTimingFilter('Semua Masa');
      setSelectedSessionId(matchedOpen.id);
      setSubmittedRecord(null);
      setRegisterStep('detail');
      setPendingDeepLinkSessionId('');
      return;
    }
    if (scrims.length > 0) {
      const matchedClosed = scrims.find((s) => s.id === pendingDeepLinkSessionId);
      setPendingDeepLinkSessionId('');
      if (matchedClosed) {
        showToast?.('Sesi tournament ini telah ditutup atau belum dibuka.');
      }
    }
  }, [pendingDeepLinkSessionId, openSessions, scrims, showToast]);

  const handleShareSessionLink = useCallback(
    async (session) => {
      if (!session?.id || typeof window === 'undefined') return;
      const shareUrl = `${window.location.origin}/portal-tournament?sesi=${encodeURIComponent(session.id)}`;
      const feeVal = Number(session.entry_fee || 0);
      const totalM = Number(session.total_matches || session.matches?.length || 5);
      const summaryParts = [
        session.session_timing ? `Masa: ${session.session_timing}` : null,
        session.date ? `Tarikh: ${session.date}` : null,
        `${session.room_type || 'Squad TPP'} · ${totalM} Match`,
        feeVal > 0 ? `Yuran: RM ${feeVal.toFixed(2)}` : 'Yuran: PERCUMA',
        session.prize_pool ? `Prize Pool: ${session.prize_pool}` : null
      ].filter(Boolean);
      const shareText = `${session.title}\n${summaryParts.join(' · ')}\n\nTekan link untuk info penuh & daftar pasukan:\n${shareUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${session.title} — Portal Tournament`,
            text: shareText,
            url: shareUrl
          });
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return;
        }
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast?.('Link sesi disalin! Sedia dikongsi ke group.');
      } catch {
        showToast?.(`Salin link sesi: ${shareUrl}`);
      }
    },
    [showToast]
  );

  const selectedSession = useMemo(
    () => filteredSessions.find((s) => s.id === selectedSessionId) || null,
    [filteredSessions, selectedSessionId]
  );

  const selectedSlotMeta = useMemo(
    () => (selectedSession ? getSessionSlotMeta(selectedSession) : null),
    [selectedSession, getSessionSlotMeta]
  );

  const activeUserRegForSession = useMemo(
    () => (selectedSession ? activeRegistrationByScrim.get(selectedSession.id) || null : null),
    [selectedSession, activeRegistrationByScrim]
  );

  const entryFee = Number(selectedSession?.entry_fee || 0);
  const requiresReceipt = entryFee > 0;
  const sessionQrUrl = safeMediaUrl(selectedSession?.qr_image_url);
  const selectedPosterUrl = useMemo(
    () => (selectedSession ? getPortalSessionPosterUrl(selectedSession) : null),
    [selectedSession]
  );
  const modalPosterPreviewUrl =
    ptPosterPreviewUrl ||
    (!ptRemovePoster && editingPortalScrim ? getPortalSessionPosterUrl(editingPortalScrim) : null);

  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateUploadFile(file, { maxMb: 8 });
    if (!check.ok) {
      showToast?.(check.error);
      return;
    }

    if (receiptPreviewUrl && receiptPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(receiptPreviewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setReceiptFile(file);
    setReceiptPreviewUrl(objectUrl);
    setOcrStatus({
      scanning: true,
      progress: 0,
      done: false,
      ocrExtractedAmount: null,
      ocrReferenceNo: null,
      isDuplicateRef: false,
      error: ''
    });

    try {
      const result = await scanReceiptImage(file, (progress) => {
        setOcrStatus((prev) => ({ ...prev, progress }));
      });
      let isDuplicateRef = false;
      if (result.ocrReferenceNo && supabase) {
        const { data: dupFlag } = await supabase.rpc('check_ocr_reference_exists', {
          p_ref: result.ocrReferenceNo
        });
        isDuplicateRef = Boolean(dupFlag);
      }
      setOcrStatus({
        scanning: false,
        progress: 100,
        done: true,
        ocrExtractedAmount: result.ocrExtractedAmount,
        ocrReferenceNo: result.ocrReferenceNo,
        isDuplicateRef,
        error: ''
      });
    } catch (err) {
      setOcrStatus({
        scanning: false,
        progress: 0,
        done: true,
        ocrExtractedAmount: null,
        ocrReferenceNo: null,
        isDuplicateRef: false,
        error: err?.message || 'Imbasan OCR gagal, resit masih boleh dihantar untuk semakan manual.'
      });
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedSession || isSubmitting) return;
    if (activeUserRegForSession) {
      showToast?.('Team anda sudah berdaftar untuk sesi ini.');
      return;
    }
    if (selectedSlotMeta?.isFull) {
      showToast?.('Sesi ini sudah penuh.');
      return;
    }

    const cleanName = sanitizeTextInput(teamName, 80);
    const cleanTag = sanitizeTextInput(teamTag, 10).toUpperCase();
    const cleanWhatsapp = sanitizeTextInput(captainWhatsapp, 30);
    const cleanEmail = sanitizeTextInput(captainEmail, 120);

    if (!cleanName || !cleanTag || !cleanWhatsapp) {
      showToast?.('Sila lengkapkan Nama Pasukan, Tag Pasukan dan WhatsApp Kapten.');
      return;
    }
    if (cleanWhatsapp.replace(/\D/g, '').length < 8) {
      showToast?.('Sila masukkan nombor WhatsApp yang sah (sekurang-kurangnya 8 digit).');
      return;
    }
    if (requiresReceipt && !receiptFile) {
      showToast?.('Sila muat naik gambar resit bayaran untuk sesi berbayar.');
      return;
    }
    if (ocrStatus.scanning) {
      showToast?.('Sila tunggu imbasan OCR resit selesai.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prevent duplicate registration for the same WhatsApp number on the same session
      try {
        const { data: existingRows } = await supabase.rpc('check_registration_status', {
          p_whatsapp: cleanWhatsapp
        });
        const dupInSession = Array.isArray(existingRows)
          ? existingRows.find((r) => r.scrim_id === selectedSession.id && r.status !== 'rejected')
          : null;
        if (dupInSession) {
          await fetchMyRegistrations();
          showToast?.('Team anda sudah berdaftar untuk sesi ini.');
          return;
        }
      } catch {
        // Proceed if RPC check fails transiently
      }

      let uploadedReceiptUrl = null;
      let driveArchiveUrl = null;
      if (receiptFile) {
        const { data: sessionRes } = await supabase.auth.getSession();
        const accessToken = sessionRes?.session?.access_token;

        const archiveReceiptToDrive = async () => {
          try {
            const optimized = await optimizePosterForOcr(receiptFile);
            if (!optimized?.dataUrl) return null;
            const ext = optimized.mimeType.includes('png')
              ? 'png'
              : optimized.mimeType.includes('webp')
                ? 'webp'
                : 'jpg';
            const folderLabel =
              sanitizeTextInput(`Resit Portal - ${selectedSession.title || 'Tournament'}`, 70) ||
              'Resit Portal';
            const receiptFileName =
              sanitizeTextInput(`${cleanTag}_${cleanName}_${Date.now()}.${ext}`, 75) ||
              `resit_${Date.now()}.${ext}`;
            const { data: arcData, error: arcErr } = await supabase.functions.invoke(
              'extract-scrim-standings',
              {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                body: {
                  archiveOnly: true,
                  imageBase64: optimized.dataUrl,
                  mimeType: optimized.mimeType,
                  uploaderName: folderLabel,
                  fileName: receiptFileName
                }
              }
            );
            if (arcErr) return null;
            return arcData?.poster_url && /^https?:\/\//i.test(arcData.poster_url)
              ? arcData.poster_url
              : null;
          } catch {
            // Non-blocking: registration must proceed even if Drive webhook is slow/unavailable
            return null;
          }
        };

        const [uploadedUrl, archivedUrl] = await Promise.all([
          uploadMediaToSupabase(receiptFile, 'receipts'),
          archiveReceiptToDrive()
        ]);
        if (!uploadedUrl) {
          throw new Error('Gagal muat naik resit bayaran.');
        }
        uploadedReceiptUrl = uploadedUrl;
        driveArchiveUrl = archivedUrl;
      }

      const payload = {
        scrim_id: selectedSession.id,
        registered_by: currentUser.id,
        team_name: cleanName,
        team_tag: cleanTag,
        captain_whatsapp: cleanWhatsapp,
        captain_email: cleanEmail || null,
        receipt_image_url: uploadedReceiptUrl,
        ocr_extracted_amount: ocrStatus.ocrExtractedAmount,
        ocr_reference_no: ocrStatus.ocrReferenceNo,
        is_duplicate_ref: ocrStatus.isDuplicateRef,
        status: 'pending_verification'
      };

      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert([payload])
        .select('id, scrim_id, team_name, team_tag, captain_whatsapp, status, created_at')
        .single();

      if (error) throw error;

      setSubmittedRecord({
        ...data,
        sessionTitle: selectedSession.title,
        sessionTiming: selectedSession.session_timing || selectedSession.date,
        receiptDriveUrl: driveArchiveUrl
      });
      setStatusWhatsappInput(cleanWhatsapp);
      setTeamName('');
      setTeamTag('');
      setReceiptFile(null);
      if (receiptPreviewUrl && receiptPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
      setReceiptPreviewUrl('');
      setOcrStatus({
        scanning: false,
        progress: 0,
        done: false,
        ocrExtractedAmount: null,
        ocrReferenceNo: null,
        isDuplicateRef: false,
        error: ''
      });
      await Promise.all([fetchSlotCounts(), fetchMyRegistrations()]);
      showToast?.('Pendaftaran berjaya dihantar! Menunggu pengesahan admin.');
    } catch (err) {
      showToast?.(`Pendaftaran gagal: ${err?.message || 'ralat'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusLookup = async (e) => {
    e?.preventDefault?.();
    const cleanPhone = sanitizeTextInput(statusWhatsappInput, 32);
    if (cleanPhone.replace(/\D/g, '').length < 8) {
      showToast?.('Masukkan nombor WhatsApp sekurang-kurangnya 8 digit.');
      return;
    }
    setIsCheckingStatus(true);
    setHasSearchedStatus(true);
    try {
      const { data, error } = await supabase.rpc('check_registration_status', {
        p_whatsapp: cleanPhone
      });
      if (error) throw error;
      setStatusResults(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast?.(`Semakan gagal: ${err?.message || 'ralat'}`);
      setStatusResults([]);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const sessionMap = useMemo(() => {
    const map = new Map();
    for (const s of scrims) map.set(s.id, s);
    return map;
  }, [scrims]);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 flex flex-col">
      {/* Standalone Compact SCRIM HUB Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/70 backdrop-blur-md">
        <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <div className="h-12 sm:h-13 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/logo.png"
                alt="SCRIM HUB"
                className="w-6 h-6 rounded-md object-cover border border-white/10 shrink-0"
              />
              <span className="text-zinc-600 text-xs font-mono select-none hidden sm:inline">/</span>
              <span className="text-xs font-semibold tracking-tight text-zinc-100 truncate">
                scrimhub
              </span>
              <span className="text-zinc-600 text-xs font-mono select-none">/</span>
              <span className="text-xs font-mono font-semibold text-[#D7FF00] truncate">
                portal-tournament
              </span>
            </div>

            <button
              type="button"
              onClick={onExitPortal}
              title="Kembali ke SCRIM HUB"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl border border-white/[0.08] bg-[#111113] hover:bg-[#17171A] hover:border-white/[0.16] text-xs font-semibold text-zinc-200 hover:text-white transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
              <span>Scrim Hub</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 py-5 sm:py-7 space-y-5 sm:space-y-6">
        {portalSection === 'manage' && canManageRegistrations && (
          <RegistrationManagerTab
            supabase={supabase}
            authorizedScrims={authorizedScrims}
            onAutoSeedSession={onAutoSeedSession}
            showToast={showToast}
            currentUser={currentUser}
            isMasterAdmin={isMasterAdmin}
            onOpenCreateModal={onSavePortalTournament ? openPortalCreateModal : null}
            onOpenEditModal={onSavePortalTournament ? openPortalEditModal : null}
            onTogglePortalRegistration={onTogglePortalRegistration}
            onOpenPortalQuickScore={onOpenPortalQuickScore}
            onShareSessionLink={handleShareSessionLink}
            renderQuickScorer={renderQuickScorer}
            urusResetKey={urusResetKey}
          />
        )}

        {portalSection === 'register' && (
          <div className="space-y-5">
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep('list');
                    syncSessionQueryParam('');
                  }}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    registerStep === 'list'
                      ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  1. Pilih Sesi
                </button>
                <span className="text-zinc-600">→</span>
                <button
                  type="button"
                  disabled={!selectedSession}
                  onClick={() => selectedSession && setRegisterStep('detail')}
                  className={`px-2 py-1 rounded-md transition ${
                    registerStep === 'detail'
                      ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                      : selectedSession
                        ? 'text-zinc-400 hover:text-white cursor-pointer'
                        : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  2. Info Sesi
                </button>
                <span className="text-zinc-600">→</span>
                <span
                  className={`px-2 py-1 rounded-md ${
                    registerStep === 'form'
                      ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                      : 'text-zinc-600'
                  }`}
                >
                  3. Daftar
                </span>
              </div>
            </div>

            {/* STEP 1: PILIH SESI */}
            {registerStep === 'list' && (
              <>
                <section className="rounded-2xl border border-white/[0.08] vercel-grid-surface relative overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
                    <div className="lg:col-span-8 p-5 sm:p-7 space-y-2 min-w-0">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A]/90 text-[11px] font-mono text-zinc-300">
                        <span className="text-[#D7FF00] font-semibold">Langkah 1</span>
                        <span className="text-zinc-600">/</span>
                        <span>Pilih Sesi Tournament</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
                        Senarai Sesi <span className="text-[#D7FF00]">Portal Tournament</span>
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl text-pretty">
                        Pilih sesi kejohanan di bawah untuk melihat butiran penuh termasuk jumlah match, jenis room, baki slot, dan peraturan sebelum mendaftar.
                      </p>
                    </div>

                    <div className="lg:col-span-4 bg-[#050506]/75 p-5 sm:p-6 flex flex-col justify-center">
                      <div className="grid grid-cols-2 divide-x divide-white/[0.08] border border-white/[0.08] rounded-xl bg-[#0A0A0A] text-center">
                        <div className="py-2.5 px-2">
                          <span className="text-[10px] font-mono text-zinc-500 block">SESI TERBUKA</span>
                          <span className="text-sm font-mono font-bold text-[#D7FF00] tabular-nums">{openSessions.length}</span>
                        </div>
                        <div className="py-2.5 px-2">
                          <span className="text-[10px] font-mono text-zinc-500 block">AKAUN</span>
                          <span className={`text-xs font-mono font-bold ${currentUser ? 'text-emerald-400' : 'text-amber-300'}`}>
                            {currentUser ? 'AKTIF' : 'AWAM'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {availableTimings.length > 1 && (
                    <div className="px-4 sm:px-6 py-3 border-t border-white/[0.08] bg-[#0A0A0A]/85">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1">
                          Masa Sesi:
                        </span>
                        {availableTimings.map((t) => {
                          const active = timingFilter === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTimingFilter(t)}
                              className={`px-2.5 py-1 min-h-[34px] rounded-lg text-[11px] font-mono font-medium border transition cursor-pointer ${
                                active
                                  ? 'bg-[#EDEDED] text-zinc-950 border-[#EDEDED] font-bold'
                                  : 'bg-[#09090B] text-zinc-400 border-white/[0.08] hover:text-white hover:border-white/20'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/85 overflow-hidden">
                  <div className="px-4 sm:px-6 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                      Pilih Sesi ({filteredSessions.length})
                    </h2>
                    <span className="text-[11px] font-mono text-zinc-500">Tekan sesi untuk info penuh</span>
                  </div>

                  {filteredSessions.length === 0 ? (
                    <div className="p-10 text-center text-xs text-zinc-500">
                      {openSessions.length === 0
                        ? 'Belum ada tournament dibuka di Portal Tournament buat masa ini.'
                        : 'Tiada tournament terbuka sepadan dengan penapis masa ini.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-white/[0.08]">
                      {filteredSessions.map((session, idx) => {
                        const meta = getSessionSlotMeta(session);
                        const fee = Number(session.entry_fee || 0);
                        const totalMatches = Number(session.total_matches || session.matches?.length || 5);
                        const isRightCol = idx % 2 === 1;
                        const isSecondRowPlus = idx >= 2;
                        const isRegistered = activeRegistrationByScrim.has(session.id);
                        const cardPosterUrl = getPortalSessionPosterUrl(session);
                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              setSubmittedRecord(null);
                              setRegisterStep('detail');
                              syncSessionQueryParam(session.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`group w-full text-left hover:bg-white/[0.03] active:bg-white/[0.04] transition cursor-pointer flex flex-col overflow-hidden border-white/[0.08] ${
                              !isRightCol ? 'md:border-r ' : ''
                            }${isSecondRowPlus ? 'md:border-t' : ''}`}
                          >
                            {cardPosterUrl && (
                              <div className="relative w-full h-36 sm:h-40 overflow-hidden bg-black border-b border-white/[0.08]">
                                <img
                                  src={cardPosterUrl}
                                  alt={`Poster ${session.title}`}
                                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition duration-300"
                                />
                                <div
                                  aria-hidden="true"
                                  className="absolute inset-0 bg-gradient-to-t from-[#09090B]/90 via-transparent to-black/20"
                                />
                              </div>
                            )}
                            <div className="p-4 sm:p-5 flex flex-col gap-3 w-full">
                            {/* Top Meta & Status Bar */}
                            <div className="flex items-center justify-between gap-2 w-full">
                              <div className="flex items-center gap-2 min-w-0">
                                {session.session_timing && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#D7FF00]/10 border border-[#D7FF00]/30 text-[11px] font-mono font-bold text-[#D7FF00] shrink-0">
                                    {session.session_timing}
                                  </span>
                                )}
                                <span className="text-[11px] font-mono text-zinc-400 truncate">
                                  {session.room_type || 'Squad TPP'} · {totalMatches} Match
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isRegistered && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/35">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Berdaftar
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold ${
                                    meta.isFull ? 'text-red-400' : 'text-emerald-400'
                                  }`}
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  {meta.isFull ? 'PENUH' : `${meta.remaining}/${meta.maxSlots} Slot`}
                                </span>
                              </div>
                            </div>

                            {/* Primary Title Row */}
                            <div className="flex items-center justify-between gap-3 w-full">
                              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                                {session.title}
                              </h3>
                              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D7FF00] group-hover:translate-x-0.5 transition shrink-0" />
                            </div>

                            {/* Clean Footer Metadata Strip */}
                            <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] font-mono w-full">
                              <div className="flex items-center gap-3 text-zinc-400">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  {session.date || '-'}
                                </span>
                                <span className="text-zinc-600">·</span>
                                <span className="text-white font-bold">
                                  {fee > 0 ? `RM ${fee.toFixed(2)}` : 'PERCUMA'}
                                </span>
                              </div>

                              {session.prize_pool && (
                                <span className="inline-flex items-center gap-1 text-[#D7FF00] font-bold">
                                  <Trophy className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[160px]">{session.prize_pool}</span>
                                </span>
                              )}
                            </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: MAKLUMAT SESI */}
            {registerStep === 'detail' && selectedSession && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('list');
                      syncSessionQueryParam('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-white/[0.08] bg-[#111113] hover:bg-[#17171A] text-xs font-semibold text-zinc-200 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Kembali ke Senarai Sesi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareSessionLink(selectedSession)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-[#D7FF00]/35 bg-[#D7FF00]/10 hover:bg-[#D7FF00]/20 text-xs font-bold text-[#D7FF00] transition cursor-pointer shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>

                <section className="rounded-2xl border border-white/[0.08] bg-[#09090B] overflow-hidden">
                  <div
                    className={`relative overflow-hidden p-5 sm:p-7 ${
                      selectedPosterUrl
                        ? 'min-h-[220px] sm:min-h-[250px] flex flex-col justify-end'
                        : 'vercel-grid-surface'
                    }`}
                  >
                    {selectedPosterUrl && (
                      <>
                        <img
                          src={selectedPosterUrl}
                          alt={`Poster ${selectedSession.title}`}
                          className="absolute inset-0 w-full h-full object-cover object-center"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/70 to-black/30"
                        />
                      </>
                    )}
                    <div className="relative z-10 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.12] bg-[#0A0A0A]/85 backdrop-blur-sm text-[11px] font-mono text-zinc-300">
                          <span className="text-[#D7FF00] font-semibold">Langkah 2</span>
                          <span className="text-zinc-600">/</span>
                          <span>Maklumat Tournament</span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold drop-shadow ${
                            selectedSlotMeta?.isFull ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          {selectedSlotMeta?.isFull
                            ? 'SLOT PENUH'
                            : `${selectedSlotMeta?.remaining} / ${selectedSlotMeta?.maxSlots} Slot Tersedia`}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        {selectedSession.title}
                      </h1>
                      {selectedSession.host_name && (
                        <p className="text-xs font-mono text-zinc-300">
                          Penganjur: <span className="text-white font-semibold">{selectedSession.host_name}</span>
                          {selectedSession.host_contact ? ` · ${selectedSession.host_contact}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 6-Field Spec Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-white/[0.08] bg-[#09090B]/90">
                    <div className="p-4 border-b border-r border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                        <Ticket className="w-3 h-3 text-[#D7FF00]" />
                        Nama Tournament
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white break-words">{selectedSession.title}</p>
                    </div>

                    <div className="p-4 border-b sm:border-r border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D7FF00]" />
                        Masa &amp; Tarikh
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-[#D7FF00]">
                        {selectedSession.session_timing || 'Akan Diumumkan'}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400">{selectedSession.date || '-'}</p>
                    </div>

                    <div className="p-4 border-b border-r sm:border-r-0 border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                        <Swords className="w-3 h-3 text-[#D7FF00]" />
                        Jumlah Match
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-white">
                        {Number(selectedSession.total_matches || selectedSession.matches?.length || 5)} Match
                      </p>
                    </div>

                    <div className="p-4 border-b sm:border-b-0 sm:border-r border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3 text-[#D7FF00]" />
                        Jenis Room
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {selectedSession.room_type || 'Squad TPP'}
                      </p>
                    </div>

                    <div className="p-4 border-r border-white/[0.08] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#D7FF00]" />
                        Jumlah Slot
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-white">
                        {selectedSlotMeta?.maxSlots} Slot
                        <span className="text-emerald-400 font-normal ml-1.5">
                          ({selectedSlotMeta?.remaining} baki)
                        </span>
                      </p>
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">Harga</span>
                      <p className="text-sm sm:text-base font-mono font-extrabold text-[#D7FF00]">
                        {requiresReceipt ? `RM ${entryFee.toFixed(2)}` : 'PERCUMA'}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-3 p-4 border-t border-white/[0.08] bg-[#D7FF00]/[0.03] flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-[#D7FF00]" />
                        Prize Pool Tournament
                      </span>
                      <p className="text-sm sm:text-base font-mono font-extrabold text-[#D7FF00]">
                        {selectedSession.prize_pool || 'Akan Diumumkan'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Deskripsi Admin */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/90 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/[0.08]">
                    <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-300">
                      Deskripsi &amp; Peraturan Tournament
                    </h2>
                  </div>
                  <div className="p-5">
                    {selectedSession.description ? (
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {selectedSession.description}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">
                        Tiada catatan tambahan diisi oleh penganjur untuk sesi ini.
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA: Masuk Page Borang Pendaftaran */}
                <button
                  type="button"
                  disabled={Boolean(activeUserRegForSession) || selectedSlotMeta?.isFull}
                  onClick={() => {
                    if (activeUserRegForSession) return;
                    setSubmittedRecord(null);
                    setRegisterStep('form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full py-4 px-6 mb-4 min-h-[52px] rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition ${
                    activeUserRegForSession
                      ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300 cursor-not-allowed'
                      : 'bg-[#D7FF00] hover:bg-[#e5ff47] active:scale-[0.99] text-zinc-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {activeUserRegForSession ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Team anda sudah berdaftar</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedSlotMeta?.isFull ? 'Sesi Ini Telah Penuh' : 'Register Sekarang'}</span>
                      {!selectedSlotMeta?.isFull && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 3: BORANG PENDAFTARAN & BAYARAN */}
            {registerStep === 'form' && selectedSession && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setRegisterStep('detail')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-white/[0.08] bg-[#111113] hover:bg-[#17171A] text-xs font-semibold text-zinc-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Kembali ke Maklumat Sesi</span>
                </button>

                {!currentUser ? (
                  <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/90 overflow-hidden p-5 sm:p-8 space-y-6">
                    <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/[0.05]">
                      <Lock className="w-5 h-5 text-[#D7FF00] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h2 className="text-sm font-bold text-white">
                          Log Masuk Diperlukan Untuk Mendaftar ({selectedSession.title})
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Sila daftar akaun atau log masuk terlebih dahulu sebelum mengisi borang pasukan dan memuat naik resit bayaran.
                        </p>
                      </div>
                    </div>
                    <div className="max-w-md mx-auto">{authGateNode}</div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {submittedRecord && (
                      <div className="rounded-2xl border border-[#D7FF00]/40 bg-[#D7FF00]/[0.07] p-4 sm:p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#D7FF00] shrink-0 mt-0.5" />
                          <div className="space-y-1 min-w-0">
                            <h3 className="text-sm font-extrabold text-white">
                              Pendaftaran Berjaya Dihantar!
                            </h3>
                            <p className="text-xs text-zinc-300">
                              Pasukan <strong className="text-white">[{submittedRecord.team_tag}] {submittedRecord.team_name}</strong> kini dalam senarai{' '}
                              <span className="text-amber-300 font-semibold">Pending Verification</span> bagi{' '}
                              <strong className="text-white">{submittedRecord.sessionTitle}</strong>.
                            </p>
                            {submittedRecord.receiptDriveUrl && (
                              <p className="text-[11px] text-emerald-300 flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span>Salinan resit berjaya disimpan ke Google Drive.</span>
                                <a
                                  href={safeExternalUrl(submittedRecord.receiptDriveUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 underline font-semibold hover:text-emerald-200"
                                >
                                  <span>Lihat Fail</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onChangePortalSection('status');
                            handleStatusLookup();
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#D7FF00] text-black text-xs font-extrabold cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Semak Status &amp; Link Lobby</span>
                        </button>
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmitRegistration}
                      className="rounded-3xl border border-white/[0.08] bg-[#09090B]/90 overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-mono text-[#D7FF00] uppercase">
                            Langkah 3 · Borang Pendaftaran
                          </p>
                          <h2 className="text-base font-extrabold text-white">{selectedSession.title}</h2>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-zinc-400 block text-[10px]">YURAN PENYERTAAN</span>
                          <strong className="text-white text-sm">
                            {requiresReceipt ? `RM ${entryFee.toFixed(2)}` : 'PERCUMA'}
                          </strong>
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* DuitNow QR Card when fee > 0 */}
                        {requiresReceipt && (
                          <div className="rounded-2xl border border-white/[0.08] bg-black/60 p-4 flex flex-col sm:flex-row items-center gap-4">
                            {sessionQrUrl ? (
                              <img
                                src={sessionQrUrl}
                                alt={`Kod QR bayaran ${selectedSession.title}`}
                                className="w-36 h-36 rounded-xl object-contain bg-white p-1.5 shrink-0 border border-white/10"
                              />
                            ) : (
                              <div className="w-36 h-36 rounded-xl border border-dashed border-white/[0.15] bg-black flex flex-col items-center justify-center text-zinc-500 text-center p-3 shrink-0">
                                <QrCode className="w-7 h-7 mb-1.5 text-zinc-600" />
                                <span className="text-[10px] font-mono">QR belum dimuat naik oleh host</span>
                              </div>
                            )}
                            <div className="space-y-2 text-xs text-zinc-300">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D7FF00]/10 border border-[#D7FF00]/25 text-[#D7FF00] font-mono font-bold text-[11px]">
                                <QrCode className="w-3.5 h-3.5" />
                                <span>BAYARAN DUITNOW QR</span>
                              </div>
                              <p className="leading-relaxed text-zinc-400">
                                Imbas kod QR dan buat bayaran tepat <strong className="text-white">RM {entryFee.toFixed(2)}</strong>. Muat naik tangkapan skrin resit penuh di bawah untuk imbasan OCR automatik.
                              </p>
                              {selectedSession.host_contact && (
                                <p className="text-[11px] font-mono text-zinc-500">
                                  Host: <span className="text-zinc-300">{selectedSession.host_contact}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                              Nama Pasukan *
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={80}
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              placeholder="Contoh: AURA ESPORTS MY"
                              className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                              Tag Pasukan *
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={10}
                              value={teamTag}
                              onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                              placeholder="AURA"
                              className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm font-mono uppercase text-white placeholder:text-zinc-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                              WhatsApp Kapten *
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={30}
                              value={captainWhatsapp}
                              onChange={(e) => setCaptainWhatsapp(e.target.value)}
                              placeholder="0123456789"
                              className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                              Email (Opsional)
                            </label>
                            <input
                              type="email"
                              maxLength={120}
                              value={captainEmail}
                              onChange={(e) => setCaptainEmail(e.target.value)}
                              placeholder="kapten@team.com"
                              className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Receipt Upload + Client-Side Tesseract OCR */}
                        {requiresReceipt && (
                          <div className="space-y-3">
                            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300">
                              Muat Naik Resit Bayaran *
                            </label>

                            <label className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border border-dashed border-white/[0.16] hover:border-[#D7FF00]/50 bg-black/50 transition cursor-pointer">
                              {receiptPreviewUrl ? (
                                <img
                                  src={receiptPreviewUrl}
                                  alt="Pratonton resit"
                                  className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                                  <ImagePlus className="w-5 h-5 text-[#D7FF00]" />
                                </div>
                              )}
                              <div className="min-w-0 text-center sm:text-left">
                                <p className="text-xs font-bold text-white truncate">
                                  {receiptFile ? receiptFile.name : 'Pilih gambar resit (PNG / JPG / WEBP)'}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  Sistem akan mengimbas jumlah bayaran &amp; nombor rujukan secara automatik.
                                </p>
                              </div>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleReceiptChange}
                                className="hidden"
                              />
                            </label>

                            {ocrStatus.scanning && (
                              <div className="p-3 rounded-xl border border-white/[0.08] bg-black/60 flex items-center gap-2.5 text-xs font-mono text-[#D7FF00]">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span>Mengimbas resit dengan OCR... {ocrStatus.progress}%</span>
                              </div>
                            )}

                            {ocrStatus.done && !ocrStatus.scanning && (
                              <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-black/70 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-300">
                                  <FileCheck2 className="w-3.5 h-3.5 text-[#D7FF00]" />
                                  <span>KEPUTUSAN IMBASAN OCR</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                                    Amaun:{' '}
                                    <strong className="text-white">
                                      {ocrStatus.ocrExtractedAmount != null
                                        ? `RM ${ocrStatus.ocrExtractedAmount.toFixed(2)}`
                                        : 'Tidak dikesan'}
                                    </strong>
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                                    Ref No:{' '}
                                    <strong className="text-white">
                                      {ocrStatus.ocrReferenceNo || 'Tidak dikesan'}
                                    </strong>
                                  </span>
                                </div>
                                {ocrStatus.isDuplicateRef && (
                                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200">
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <span>
                                      Amaran: Nombor rujukan resit ini sudah wujud dalam rekod pangkalan data dan akan ditanda untuk semakan admin.
                                    </span>
                                  </div>
                                )}
                                {ocrStatus.error && (
                                  <p className="text-[11px] text-amber-300">{ocrStatus.error}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={
                            isSubmitting ||
                            ocrStatus.scanning ||
                            selectedSlotMeta?.isFull ||
                            Boolean(activeUserRegForSession)
                          }
                          className="w-full py-3.5 px-5 min-h-[48px] rounded-2xl bg-[#D7FF00] hover:bg-[#e5ff47] text-zinc-950 text-sm font-extrabold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {activeUserRegForSession
                            ? 'Team anda sudah berdaftar'
                            : selectedSlotMeta?.isFull
                              ? 'Sesi Ini Telah Penuh'
                              : isSubmitting
                                ? 'Menghantar Pendaftaran...'
                                : 'Hantar Pendaftaran Pasukan'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {portalSection === 'status' && (
          <div className="space-y-5">
            {/* SCRIM HUB Grid Hero Lookup */}
            <section className="rounded-2xl border border-white/[0.08] vercel-grid-surface relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
                <div className="lg:col-span-8 p-5 sm:p-7 space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A]/90 text-[11px] font-mono text-zinc-300">
                    <span className="text-[#D7FF00] font-semibold">Portal Tournament</span>
                    <span className="text-zinc-600">/</span>
                    <span>Semak Status</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
                    Semak Status Pendaftaran &amp; Lobby WA
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-xl text-pretty">
                    Masukkan nombor WhatsApp kapten yang didaftarkan. Butang sertai WhatsApp Lobby dibuka automatik sebaik resit disahkan admin.
                  </p>
                </div>

                <div className="lg:col-span-4 bg-[#050506]/75 p-5 sm:p-6 flex flex-col justify-center">
                  <div className="grid grid-cols-2 divide-x divide-white/[0.08] border border-white/[0.08] rounded-xl bg-[#0A0A0A] text-center">
                    <div className="py-2.5 px-2">
                      <span className="text-[10px] font-mono text-zinc-500 block">REKOD ANDA</span>
                      <span className="text-sm font-mono font-bold text-[#D7FF00] tabular-nums">
                        {myRegistrations.length}
                      </span>
                    </div>
                    <div className="py-2.5 px-2">
                      <span className="text-[10px] font-mono text-zinc-500 block">HASIL CARIAN</span>
                      <span className="text-sm font-mono font-bold text-white tabular-nums">
                        {hasSearchedStatus ? statusResults.length : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleStatusLookup}
                className="px-4 sm:px-6 py-4 border-t border-white/[0.08] bg-[#0A0A0A]/85 flex flex-col sm:flex-row gap-2.5"
              >
                <input
                  type="tel"
                  value={statusWhatsappInput}
                  onChange={(e) => setStatusWhatsappInput(e.target.value)}
                  placeholder="Masukkan WhatsApp Kapten (cth: 0123456789)"
                  className="flex-1 bg-[#09090B] border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isCheckingStatus}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#D7FF00] hover:bg-[#e5ff47] active:scale-[0.99] text-zinc-950 text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  <span>{isCheckingStatus ? 'Menyemak...' : 'Semak Status'}</span>
                </button>
              </form>
            </section>

            {/* Results Panel */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/85 overflow-hidden">
              {!hasSearchedStatus && myRegistrations.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Masukkan nombor WhatsApp anda di atas untuk melihat status terkini.
                </div>
              ) : (hasSearchedStatus ? statusResults : myRegistrations).length === 0 ? (
                <div className="p-8 text-center space-y-1.5">
                  <p className="text-sm font-bold text-zinc-300">Tiada rekod dijumpai</p>
                  <p className="text-xs text-zinc-500">
                    Pastikan nombor WhatsApp sama seperti yang diisi dalam borang pendaftaran.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.08]">
                  {(hasSearchedStatus ? statusResults : myRegistrations).map((item) => {
                    const sessionInfo = sessionMap.get(item.scrim_id);
                    const lobbyUrl =
                      item.status === 'verified'
                        ? safeExternalUrl(item.whatsapp_lobby_link || sessionInfo?.whatsapp_lobby_link)
                        : null;
                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono font-bold text-[#D7FF00]">
                              [{item.team_tag}]
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white truncate">{item.team_name}</h3>
                            {item.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 border border-[#D7FF00]/40 text-[11px] font-bold text-[#D7FF00]">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified {item.assigned_slot ? `· Slot #${item.assigned_slot}` : ''}
                              </span>
                            ) : item.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/35 text-[11px] font-bold text-red-300">
                                Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-[11px] font-bold text-amber-300">
                                <Clock className="w-3 h-3" />
                                Pending Verification
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-zinc-400">
                            <strong className="text-zinc-200">{item.session_title || sessionInfo?.title}</strong>
                            {(item.event_category || sessionInfo?.event_category) && (
                              <span className="font-mono text-zinc-500">
                                {' '}
                                · {item.event_category || sessionInfo?.event_category}
                              </span>
                            )}
                            {(item.session_timing || sessionInfo?.session_timing) && (
                              <span className="font-mono text-[#D7FF00]/90">
                                {' '}
                                · {item.session_timing || sessionInfo?.session_timing}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {item.status === 'verified' ? (
                            lobbyUrl ? (
                              <a
                                href={lobbyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>Sertai WhatsApp Lobby</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-xs font-mono text-zinc-400">
                                Disahkan — Hubungi host untuk pautan lobby
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-black/50 text-[11px] font-mono text-zinc-400">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Link lobby dibuka selepas Verified</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* SCRIM HUB Brand Footer */}
      <footer className="max-w-[1360px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 pt-4 pb-24">
        <div className="pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <span className="text-[11px] font-mono text-zinc-500">
            © 2026 SCRIM HUB by ry.khor · Portal Tournament
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {currentUser && !canManageRegistrations && onRequestPortalAccess && (
              portalApprovalRecord?.status === 'pending' ? (
                <span className="text-[11px] font-mono text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/25 bg-amber-500/10">
                  Permohonan Urus menunggu kelulusan admin
                </span>
              ) : portalApprovalRecord?.status === 'rejected' ? (
                <span className="text-[11px] font-mono text-zinc-500">
                  Akses Urus tidak diluluskan
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isRequestingAccess}
                  onClick={async () => {
                    setIsRequestingAccess(true);
                    try {
                      await onRequestPortalAccess();
                    } finally {
                      setIsRequestingAccess(false);
                    }
                  }}
                  className="text-[11px] font-mono text-zinc-400 hover:text-white underline underline-offset-4 transition cursor-pointer disabled:opacity-50"
                >
                  {isRequestingAccess ? 'Menghantar...' : 'Penganjur? Mohon akses Urus'}
                </button>
              )
            )}
            <button
              type="button"
              onClick={onExitPortal}
              className="text-xs text-[#D7FF00] hover:underline font-medium transition cursor-pointer"
            >
              Kembali ke SCRIM HUB
            </button>
          </div>
        </div>
      </footer>

      {/* Compact Floating Bottom Navigation Bar (Matches SCRIM HUB Mobile Pill Dock) */}
      <nav
        aria-label="Navigasi Bawah Portal Tournament"
        role="tablist"
        className={`fixed bottom-3 sm:bottom-4 inset-x-0 mx-auto z-50 w-[calc(100%-2.5rem)] pointer-events-auto ${
          canManageRegistrations ? 'max-w-[290px]' : 'max-w-[220px]'
        } ${isPortalFormOpen ? 'hidden pointer-events-none' : ''}`}
      >
        <div className="glass-dock rounded-full px-2 py-1 flex items-center justify-between [text-shadow:0_1px_4px_rgba(0,0,0,0.65)]">
          <button
            type="button"
            role="tab"
            aria-selected={portalSection === 'register'}
            onClick={() => {
              onChangePortalSection('register');
              setRegisterStep('list');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] rounded-full transition-colors select-none active:scale-95 cursor-pointer ${
              portalSection === 'register'
                ? 'text-[#D7FF00]'
                : 'text-zinc-200 hover:text-white'
            }`}
          >
            <Ticket className={`w-4 h-4 ${portalSection === 'register' ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
            <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${portalSection === 'register' ? 'font-bold' : 'font-medium'}`}>
              Daftar
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={portalSection === 'status'}
            onClick={() => onChangePortalSection('status')}
            className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] rounded-full transition-colors select-none active:scale-95 cursor-pointer ${
              portalSection === 'status'
                ? 'text-[#D7FF00]'
                : 'text-zinc-200 hover:text-white'
            }`}
          >
            <Search className={`w-4 h-4 ${portalSection === 'status' ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
            <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${portalSection === 'status' ? 'font-bold' : 'font-medium'}`}>
              Status
            </span>
          </button>

          {canManageRegistrations && (
            <button
              type="button"
              role="tab"
              aria-selected={portalSection === 'manage'}
              onClick={() => {
                onChangePortalSection('manage');
                setUrusResetKey((k) => k + 1);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] rounded-full transition-colors select-none active:scale-95 cursor-pointer ${
                portalSection === 'manage'
                  ? 'text-[#D7FF00]'
                  : 'text-zinc-200 hover:text-white'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${portalSection === 'manage' ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
              <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${portalSection === 'manage' ? 'font-bold' : 'font-medium'}`}>
                Urus
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Modal: Admin Buka / Edit Tournament Portal */}
      {isPortalFormOpen && canManageRegistrations && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsPortalFormOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={editingPortalScrim ? 'Edit Tournament Portal' : 'Buka Tournament Portal'}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-modal rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#D7FF00] font-bold">
                  Portal Tournament
                </p>
                <h2 className="text-base font-extrabold text-white">
                  {editingPortalScrim ? 'Edit Tournament Portal' : 'Buka Tournament Baharu'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPortalFormOpen(false)}
                aria-label="Tutup modal tournament"
                className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePortalForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Nama Tournament *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={ptTitle}
                  onChange={(e) => setPtTitle(e.target.value)}
                  placeholder="cth: Night Scrim Elite Series"
                  className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                    Jenis Room
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={ptRoomType}
                    onChange={(e) => setPtRoomType(e.target.value)}
                    placeholder="cth: Squad TPP / Solo FPP"
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                    Masa Sesi (Custom)
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={ptTiming}
                    onChange={(e) => setPtTiming(e.target.value)}
                    placeholder="cth: 9:30 PM / 3:00 PM"
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                    Tarikh
                  </label>
                  <input
                    type="date"
                    value={ptDate}
                    onChange={(e) => setPtDate(e.target.value)}
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-2.5 py-2.5 min-h-[44px] text-xs font-mono text-white [color-scheme:dark] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                    Jumlah Match
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={ptTotalMatches}
                    onChange={(e) => setPtTotalMatches(e.target.value)}
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                    Harga (RM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ptEntryFee}
                    onChange={(e) => setPtEntryFee(e.target.value)}
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                    Jumlah Slot
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="25"
                    value={ptMaxSlots}
                    onChange={(e) => setPtMaxSlots(e.target.value)}
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Prize Pool Tournament (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={ptPrizePool}
                  onChange={(e) => setPtPrizePool(e.target.value)}
                  placeholder="cth: RM 500 (Top 1 RM 300, Top 2 RM 150, MVP RM 50)"
                  className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Link WhatsApp Lobby (Dibuka selepas Verified)
                </label>
                <input
                  type="url"
                  value={ptWhatsappLink}
                  onChange={(e) => setPtWhatsappLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Poster Background Tournament (Opsional)
                </span>
                {Boolean(modalPosterPreviewUrl) && (
                  <div className="flex items-center justify-between gap-2 p-2 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={modalPosterPreviewUrl}
                        alt="Pratonton poster tournament"
                        className="w-20 h-12 rounded-lg object-cover bg-black shrink-0 border border-white/10"
                      />
                      <span className="text-xs text-zinc-300 truncate">
                        {ptPosterFile ? ptPosterFile.name : 'Poster aktif'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPtPosterFile(null);
                        setPtPosterPreviewUrl('');
                        setPtRemovePoster(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/35 text-red-200 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Padam</span>
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full bg-black/60 hover:bg-white/[0.04] border border-dashed border-white/[0.16] rounded-xl p-3 min-h-[44px] text-zinc-300 cursor-pointer transition">
                  <ImagePlus className="w-4 h-4 text-[#D7FF00]" />
                  <span className="truncate">
                    {ptPosterFile ? ptPosterFile.name : 'Muat Naik Gambar Poster Background'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const picked = e.target.files?.[0] || null;
                      if (!picked) return;
                      const check = validateUploadFile(picked, { maxMb: 5 });
                      if (!check.ok) {
                        showToast?.(check.error);
                        return;
                      }
                      if (ptPosterPreviewUrl && ptPosterPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(ptPosterPreviewUrl);
                      }
                      setPtPosterFile(picked);
                      setPtPosterPreviewUrl(URL.createObjectURL(picked));
                      setPtRemovePoster(false);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <span className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Kod QR DuitNow (Jika Yuran &gt; RM 0)
                </span>
                {Boolean(editingPortalScrim?.qr_image_url) && !ptRemoveQr && !ptQrFile && (
                  <div className="flex items-center justify-between gap-2 p-2 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={editingPortalScrim.qr_image_url}
                        alt="QR Aktif"
                        className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shrink-0"
                      />
                      <span className="text-xs text-zinc-300 truncate">Kod QR sedia ada</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPtQrFile(null);
                        setPtRemoveQr(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/35 text-red-200 text-[11px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Padam QR</span>
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full bg-black/60 hover:bg-white/[0.04] border border-dashed border-white/[0.16] rounded-xl p-3 min-h-[44px] text-zinc-300 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-[#D7FF00]" />
                  <span className="truncate">{ptQrFile ? ptQrFile.name : 'Muat Naik Gambar QR Bayaran'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const picked = e.target.files?.[0] || null;
                      setPtQrFile(picked);
                      if (picked) setPtRemoveQr(false);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Deskripsi, Peraturan &amp; Jadual Tournament
                </label>
                <textarea
                  rows="3"
                  maxLength={1200}
                  value={ptDesc}
                  onChange={(e) => setPtDesc(e.target.value)}
                  placeholder="Isi maklumat lengkap: susunan map, peraturan bilik, masa lobby, hadiah, dll..."
                  className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsPortalFormOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-white/[0.1] text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPortal}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#D7FF00] hover:bg-[#c8ef00] text-black text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {isSavingPortal ? 'Menyimpan...' : editingPortalScrim ? 'Simpan Perubahan' : 'Buka Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
