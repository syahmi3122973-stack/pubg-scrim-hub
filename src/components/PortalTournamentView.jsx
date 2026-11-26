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
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  Users
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
  onAutoSeedSession
}) {
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [timingFilter, setTimingFilter] = useState('Semua Masa');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [slotCounts, setSlotCounts] = useState({});

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

  // Open sessions eligible for registration
  const openSessions = useMemo(() => {
    return scrims.filter((s) => !s.is_finished && !s.is_draft);
  }, [scrims]);

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
    <div className="min-h-screen bg-[#070709] text-zinc-100">
      {/* Standalone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070709]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExitPortal}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-zinc-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>SCRIM HUB</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <span className="text-[#D7FF00] font-bold">PORTAL TOURNAMENT</span>
                <span>/</span>
                <span className="truncate">scrim.rykhor.my</span>
              </div>
            </div>
          </div>

          <nav aria-label="Navigasi Portal Tournament" className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangePortalSection('register')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition cursor-pointer ${
                portalSection === 'register'
                  ? 'bg-[#D7FF00] text-black border-[#D7FF00]'
                  : 'bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Daftar Sesi</span>
            </button>
            <button
              type="button"
              onClick={() => onChangePortalSection('status')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition cursor-pointer ${
                portalSection === 'status'
                  ? 'bg-[#D7FF00] text-black border-[#D7FF00]'
                  : 'bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semak Status</span>
            </button>
            {canManageRegistrations && (
              <button
                type="button"
                onClick={() => onChangePortalSection('manage')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition cursor-pointer ${
                  portalSection === 'manage'
                    ? 'bg-white text-black border-white'
                    : 'bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pengurusan</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {portalSection === 'manage' && canManageRegistrations && (
          <RegistrationManagerTab
            supabase={supabase}
            authorizedScrims={authorizedScrims}
            onAutoSeedSession={onAutoSeedSession}
            showToast={showToast}
            currentUser={currentUser}
          />
        )}

        {portalSection === 'register' && (
          <>
            {/* Grid Hero Header matching Team Matrix / About */}
            <section className="rounded-2xl border border-white/[0.08] vercel-grid-surface relative overflow-hidden">
              <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2.5 min-w-0">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A]/90 text-[11px] font-mono text-zinc-300">
                    <span className="text-[#D7FF00] font-semibold">Portal Tournament</span>
                    <span className="text-zinc-600">/</span>
                    <span>Pendaftaran &amp; Resit</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Daftar Slot Scrim &amp; Kejohanan
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                    Pilih kategori, semak baki slot semasa, imbas QR DuitNow dan muat naik resit dengan pengesahan OCR automatik.
                  </p>
                </div>

                <div className="flex items-center gap-5 text-xs font-mono tabular-nums text-zinc-300 shrink-0">
                  <span>
                    <strong className="text-[#D7FF00] font-bold">{openSessions.length}</strong> Sesi Terbuka
                  </span>
                  <span>
                    <strong className="text-white font-bold">{currentUser ? 'Aktif' : 'Perlu Login'}</strong> Status Akaun
                  </span>
                </div>
              </div>

              {currentUser && (
                <div className="px-4 sm:px-6 py-3 border-t border-white/[0.08] bg-[#0A0A0A]/80 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PORTAL_CATEGORIES.map((cat) => {
                      const active = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold border transition cursor-pointer ${
                            active
                              ? 'bg-[#D7FF00] text-black border-[#D7FF00]'
                              : 'bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Timing Filter Chips derived from admin session settings */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.05]">
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
                          className={`px-2.5 py-1 min-h-[34px] rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            active
                              ? 'bg-white text-black border-white'
                              : 'bg-black/50 text-zinc-400 border-white/[0.08] hover:text-white hover:border-white/20'
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
                        Tiada sesi terbuka sepadan dengan penapis kategori/masa ini.
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
            {/* Grid Hero Lookup */}
            <section className="rounded-2xl border border-white/[0.08] vercel-grid-surface relative overflow-hidden">
              <div className="p-5 sm:p-7 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A]/90 text-[11px] font-mono text-zinc-300">
                  <span className="text-[#D7FF00] font-semibold">Portal Tournament</span>
                  <span className="text-zinc-600">/</span>
                  <span>Semak Status</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Semak Status Pendaftaran &amp; Link Lobby
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                  Masukkan nombor WhatsApp kapten yang digunakan semasa pendaftaran. Butang WhatsApp Lobby akan dibuka secara automatik selepas admin mengesahkan resit anda.
                </p>
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
                  className="flex-1 bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isCheckingStatus}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#D7FF00] hover:bg-[#c8ef00] text-black text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
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
    </div>
  );
}
