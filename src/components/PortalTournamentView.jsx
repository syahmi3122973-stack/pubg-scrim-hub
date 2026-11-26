import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  Upload,
  Users,
  X
} from 'lucide-react';
import RegistrationManagerTab from './RegistrationManagerTab';
import { scanReceiptImage } from '../utils/receiptOcr';
import { safeExternalUrl, safeMediaUrl, sanitizeTextInput, validateUploadFile } from '../utils/security';

const PORTAL_CATEGORIES = ['Semua', 'Night Scrim', 'Mid Scrim', 'Fast Tour'];

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
  authorizedScrims = [],
  onAutoSeedSession,
  onSavePortalTournament = null,
  onTogglePortalRegistration = null
}) {
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [timingFilter, setTimingFilter] = useState('Semua Masa');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [slotCounts, setSlotCounts] = useState({});

  // Admin Create/Edit Portal Tournament Modal state
  const [isPortalFormOpen, setIsPortalFormOpen] = useState(false);
  const [editingPortalScrim, setEditingPortalScrim] = useState(null);
  const [ptTitle, setPtTitle] = useState('');
  const [ptCategory, setPtCategory] = useState('Night Scrim');
  const [ptTiming, setPtTiming] = useState('');
  const [ptDate, setPtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ptEntryFee, setPtEntryFee] = useState('0');
  const [ptMaxSlots, setPtMaxSlots] = useState(16);
  const [ptWhatsappLink, setPtWhatsappLink] = useState('');
  const [ptDesc, setPtDesc] = useState('');
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
        .limit(15);
      if (!error && Array.isArray(data)) {
        setMyRegistrations(data);
      }
    } catch {
      // Ignore silent read failure
    }
  }, [supabase, currentUser]);

  useEffect(() => {
    if (portalSection === 'status' && currentUser?.id) {
      fetchMyRegistrations();
    }
  }, [portalSection, currentUser, fetchMyRegistrations]);

  // STRICT ISOLATION: ONLY tournaments opened inside Portal Tournament (portal_enabled === true)
  const openSessions = useMemo(() => {
    return scrims.filter((s) => Boolean(s.portal_enabled) && !s.is_finished && !s.is_draft);
  }, [scrims]);

  const openPortalCreateModal = () => {
    setEditingPortalScrim(null);
    setPtTitle('');
    setPtCategory('Night Scrim');
    setPtTiming('');
    setPtDate(new Date().toISOString().split('T')[0]);
    setPtEntryFee('0');
    setPtMaxSlots(16);
    setPtWhatsappLink('');
    setPtDesc('');
    setPtQrFile(null);
    setPtRemoveQr(false);
    setIsPortalFormOpen(true);
  };

  const openPortalEditModal = (scrim) => {
    if (!scrim) return;
    setEditingPortalScrim(scrim);
    setPtTitle(scrim.title || '');
    setPtCategory(scrim.event_category || 'Night Scrim');
    setPtTiming(scrim.session_timing || '');
    setPtDate(scrim.date || new Date().toISOString().split('T')[0]);
    setPtEntryFee(String(scrim.entry_fee ?? 0));
    setPtMaxSlots(Math.min(25, Math.max(2, Number(scrim.max_slots || 16))));
    setPtWhatsappLink(scrim.whatsapp_lobby_link || '');
    setPtDesc(scrim.description || '');
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
      let qrUrl = editingPortalScrim?.qr_image_url || null;
      if (ptQrFile) {
        qrUrl = await uploadMediaToSupabase(ptQrFile, 'qr-codes');
      } else if (ptRemoveQr) {
        qrUrl = null;
      }

      const payload = {
        title: cleanTitle,
        event_category: ptCategory,
        session_timing: sanitizeTextInput(ptTiming, 40) || null,
        date: ptDate || new Date().toISOString().split('T')[0],
        entry_fee: Number(Math.max(0, Number.parseFloat(ptEntryFee) || 0).toFixed(2)),
        max_slots: Math.min(25, Math.max(2, Number.parseInt(ptMaxSlots, 10) || 16)),
        whatsapp_lobby_link: safeExternalUrl(ptWhatsappLink),
        description: sanitizeTextInput(ptDesc, 400),
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

  // Dynamic custom timings derived strictly from open sessions in the selected category
  const availableTimings = useMemo(() => {
    const set = new Set();
    for (const s of openSessions) {
      if (categoryFilter !== 'Semua' && s.event_category !== categoryFilter) continue;
      const timing = String(s.session_timing || '').trim();
      if (timing) set.add(timing);
    }
    return ['Semua Masa', ...Array.from(set)];
  }, [openSessions, categoryFilter]);

  useEffect(() => {
    if (!availableTimings.includes(timingFilter)) {
      setTimingFilter('Semua Masa');
    }
  }, [availableTimings, timingFilter]);

  const filteredSessions = useMemo(() => {
    return openSessions.filter((s) => {
      if (categoryFilter !== 'Semua' && s.event_category !== categoryFilter) return false;
      if (timingFilter !== 'Semua Masa' && String(s.session_timing || '').trim() !== timingFilter) {
        return false;
      }
      return true;
    });
  }, [openSessions, categoryFilter, timingFilter]);

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
    if (filteredSessions.length === 0) {
      setSelectedSessionId('');
      return;
    }
    const stillVisible = filteredSessions.some((s) => s.id === selectedSessionId);
    if (!stillVisible) {
      const firstOpen = filteredSessions.find((s) => !getSessionSlotMeta(s).isFull) || filteredSessions[0];
      setSelectedSessionId(firstOpen.id);
    }
  }, [filteredSessions, selectedSessionId, getSessionSlotMeta]);

  const selectedSession = useMemo(
    () => filteredSessions.find((s) => s.id === selectedSessionId) || null,
    [filteredSessions, selectedSessionId]
  );

  const selectedSlotMeta = useMemo(
    () => (selectedSession ? getSessionSlotMeta(selectedSession) : null),
    [selectedSession, getSessionSlotMeta]
  );

  const entryFee = Number(selectedSession?.entry_fee || 0);
  const requiresReceipt = entryFee > 0;
  const sessionQrUrl = safeMediaUrl(selectedSession?.qr_image_url);

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
      let uploadedReceiptUrl = null;
      if (receiptFile) {
        const uploadedUrl = await uploadMediaToSupabase(receiptFile, 'receipts');
        if (!uploadedUrl) {
          throw new Error('Gagal muat naik resit bayaran.');
        }
        uploadedReceiptUrl = uploadedUrl;
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
        sessionTiming: selectedSession.session_timing || selectedSession.date
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
      await fetchSlotCounts();
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
      {/* Standalone SCRIM HUB Geist Header Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/70 backdrop-blur-md">
        <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <div className="h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={onExitPortal}
                title="Kembali ke SCRIM HUB"
                className="inline-flex items-center gap-2 px-2.5 py-1.5 min-h-[38px] rounded-xl border border-white/[0.08] bg-[#111113] hover:bg-[#17171A] hover:border-white/[0.16] text-xs font-semibold text-zinc-200 hover:text-white transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                <img
                  src="/logo.png"
                  alt="SCRIM HUB"
                  className="w-5 h-5 rounded object-cover border border-white/10 hidden sm:block"
                />
                <span>Scrim Hub</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 min-w-0">
                <span className="select-none hidden sm:inline">/</span>
                <span className="text-[#D7FF00] font-semibold truncate">portal-tournament</span>
                <span className="hidden md:inline-block ml-1.5 text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.02] text-zinc-400">
                  ry.khor
                </span>
              </div>
            </div>

            <nav
              aria-label="Navigasi Portal Tournament"
              role="tablist"
              className="flex items-stretch h-full gap-1 sm:gap-2 overflow-x-auto no-scrollbar"
            >
              <button
                type="button"
                role="tab"
                aria-selected={portalSection === 'register'}
                onClick={() => onChangePortalSection('register')}
                className={`vercel-tab inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 h-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  portalSection === 'register'
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Ticket className={`w-3.5 h-3.5 ${portalSection === 'register' ? 'text-[#D7FF00]' : 'text-zinc-500'}`} />
                <span>Daftar Sesi</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={portalSection === 'status'}
                onClick={() => onChangePortalSection('status')}
                className={`vercel-tab inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 h-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  portalSection === 'status'
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Search className={`w-3.5 h-3.5 ${portalSection === 'status' ? 'text-[#D7FF00]' : 'text-zinc-500'}`} />
                <span>Semak Status</span>
              </button>
              {canManageRegistrations && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={portalSection === 'manage'}
                  onClick={() => onChangePortalSection('manage')}
                  className={`vercel-tab inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 h-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    portalSection === 'manage'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${portalSection === 'manage' ? 'text-[#D7FF00]' : 'text-zinc-500'}`} />
                  <span>Pengurusan</span>
                </button>
              )}
            </nav>
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
            onOpenCreateModal={onSavePortalTournament ? openPortalCreateModal : null}
            onOpenEditModal={onSavePortalTournament ? openPortalEditModal : null}
            onTogglePortalRegistration={onTogglePortalRegistration}
          />
        )}

        {portalSection === 'register' && (
          <>
            {/* SCRIM HUB Grid Hero Overview (Matches About & Direktori Penganjur) */}
            <section className="rounded-2xl border border-white/[0.08] vercel-grid-surface relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
                <div className="lg:col-span-8 p-5 sm:p-7 space-y-2.5 min-w-0">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A]/90 text-[11px] font-mono text-zinc-300">
                    <span className="text-[#D7FF00] font-semibold">Portal Tournament</span>
                    <span className="text-zinc-600">/</span>
                    <span>Pendaftaran &amp; Resit</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
                    Daftar Slot Kejohanan <span className="text-[#D7FF00]">SCRIM HUB</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl text-pretty">
                    Pilih kategori kejohanan, pantau baki slot semasa, imbas QR DuitNow dan muat naik resit dengan pengesahan OCR automatik.
                  </p>
                </div>

                <div className="lg:col-span-4 bg-[#050506]/75 p-5 sm:p-6 flex flex-col justify-center">
                  <div className="grid grid-cols-3 divide-x divide-white/[0.08] border border-white/[0.08] rounded-xl bg-[#0A0A0A] text-center">
                    <div className="py-2.5 px-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 block">TERBUKA</span>
                      <span className="text-sm font-mono font-bold text-[#D7FF00] tabular-nums">{openSessions.length}</span>
                    </div>
                    <div className="py-2.5 px-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 block">MASA</span>
                      <span className="text-sm font-mono font-bold text-white tabular-nums">
                        {Math.max(0, availableTimings.length - 1)}
                      </span>
                    </div>
                    <div className="py-2.5 px-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 block">AKAUN</span>
                      <span className={`text-xs font-mono font-bold ${currentUser ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {currentUser ? 'AKTIF' : 'LOGIN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {currentUser && (
                <div className="px-4 sm:px-6 py-3 border-t border-white/[0.08] bg-[#0A0A0A]/85 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PORTAL_CATEGORIES.map((cat) => {
                      const active = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? 'bg-[#D7FF00] text-black border-[#D7FF00] font-bold'
                              : 'bg-[#111114] text-zinc-300 border-white/[0.08] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Timing Filter Chips derived from admin session settings */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
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

            {/* Auth Gate when user is not logged in */}
            {!currentUser ? (
              <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/90 overflow-hidden p-5 sm:p-8 space-y-6">
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/[0.05]">
                  <Lock className="w-5 h-5 text-[#D7FF00] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-white">Log Masuk Diperlukan Untuk Mendaftar &amp; Muat Naik Resit</h2>
                    <p className="text-xs text-zinc-400">
                      Sila daftar akaun atau log masuk terlebih dahulu sebelum memilih sesi, melihat QR bayaran, dan menghantar resit pasukan anda.
                    </p>
                  </div>
                </div>
                <div className="max-w-md mx-auto">{authGateNode}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Open Sessions List */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/85 overflow-hidden">
                    <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                        Pilih Sesi ({filteredSessions.length})
                      </h2>
                      <span className="text-[11px] font-mono text-zinc-500">Slot Langsung</span>
                    </div>

                    {filteredSessions.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        {openSessions.length === 0
                          ? 'Belum ada tournament dibuka di Portal Tournament buat masa ini.'
                          : 'Tiada tournament terbuka sepadan dengan penapis kategori/masa ini.'}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.08]">
                        {filteredSessions.map((session) => {
                          const meta = getSessionSlotMeta(session);
                          const isSelected = selectedSession?.id === session.id;
                          const fee = Number(session.entry_fee || 0);
                          return (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => setSelectedSessionId(session.id)}
                              className={`w-full text-left p-4 transition cursor-pointer block ${
                                isSelected
                                  ? 'bg-[#D7FF00]/[0.07] border-l-2 border-l-[#D7FF00]'
                                  : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {session.event_category && (
                                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono font-semibold text-zinc-300">
                                        {session.event_category}
                                      </span>
                                    )}
                                    {session.session_timing && (
                                      <span className="px-2 py-0.5 rounded-md bg-[#D7FF00]/10 border border-[#D7FF00]/30 text-[10px] font-mono font-bold text-[#D7FF00]">
                                        {session.session_timing}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-sm font-bold text-white truncate">{session.title}</h3>
                                  <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {session.date || '-'}
                                    </span>
                                    <span>{fee > 0 ? `RM ${fee.toFixed(2)}` : 'PERCUMA'}</span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                                      meta.isFull
                                        ? 'bg-red-500/15 text-red-300 border-red-500/35'
                                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    }`}
                                  >
                                    <Users className="w-3 h-3" />
                                    {meta.isFull ? 'PENUH' : `${meta.remaining}/${meta.maxSlots} Baki`}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: QR + Form */}
                <div className="lg:col-span-7 space-y-4">
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

                  {selectedSession ? (
                    <form
                      onSubmit={handleSubmitRegistration}
                      className="rounded-3xl border border-white/[0.08] bg-[#09090B]/90 overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-mono text-[#D7FF00] uppercase">Borang Pendaftaran Pasukan</p>
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
                          disabled={isSubmitting || ocrStatus.scanning || selectedSlotMeta?.isFull}
                          className="w-full py-3.5 px-5 min-h-[48px] rounded-2xl bg-[#D7FF00] hover:bg-[#c8ef00] text-black text-sm font-extrabold transition cursor-pointer disabled:opacity-50"
                        >
                          {selectedSlotMeta?.isFull
                            ? 'Sesi Ini Telah Penuh'
                            : isSubmitting
                              ? 'Menghantar Pendaftaran...'
                              : 'Hantar Pendaftaran Pasukan'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/85 p-8 text-center text-xs text-zinc-400">
                      Pilih satu sesi terbuka di sebelah kiri untuk memulakan pendaftaran.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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
      <footer className="max-w-[1360px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 py-6">
        <div className="pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <span className="text-[11px] font-mono text-zinc-500">
            © 2026 SCRIM HUB by ry.khor · Portal Tournament
          </span>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => onChangePortalSection('register')}
              className="text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Daftar Sesi
            </button>
            <button
              type="button"
              onClick={() => onChangePortalSection('status')}
              className="text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Semak Status
            </button>
            <button
              type="button"
              onClick={onExitPortal}
              className="text-[#D7FF00] hover:underline font-medium transition cursor-pointer"
            >
              Kembali ke SCRIM HUB
            </button>
          </div>
        </div>
      </footer>

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
                    Kategori Acara
                  </label>
                  <select
                    value={ptCategory}
                    onChange={(e) => setPtCategory(e.target.value)}
                    className="w-full bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none"
                  >
                    <option value="Night Scrim" className="bg-zinc-950 text-white">Night Scrim</option>
                    <option value="Mid Scrim" className="bg-zinc-950 text-white">Mid Scrim</option>
                    <option value="Fast Tour" className="bg-zinc-950 text-white">Fast Tour</option>
                  </select>
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

              <div className="grid grid-cols-3 gap-2.5">
                <div>
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
                    Yuran (RM)
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
                    Max Slot
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
                  Penerangan Ringkas (Opsional)
                </label>
                <textarea
                  rows="2"
                  maxLength={400}
                  value={ptDesc}
                  onChange={(e) => setPtDesc(e.target.value)}
                  placeholder="Peraturan ringkas, jadual lobby atau maklumat hadiah..."
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
