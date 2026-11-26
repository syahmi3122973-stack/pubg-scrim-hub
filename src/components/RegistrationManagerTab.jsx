import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileSearch,
  Lock,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Unlock,
  X,
  XCircle
} from 'lucide-react';
import { safeExternalUrl, safeMediaUrl } from '../utils/security';

function normalizeWhatsAppDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = `6${digits}`;
  }
  return digits;
}

export default function RegistrationManagerTab({
  supabase,
  authorizedScrims = [],
  onAutoSeedSession,
  showToast,
  currentUser,
  onOpenCreateModal = null,
  onOpenEditModal = null,
  onTogglePortalRegistration = null
}) {
  const [registrations, setRegistrations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timingFilter, setTimingFilter] = useState('Semua Masa');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const hasLoadedRef = useRef(false);

  const authorizedScrimMap = useMemo(() => {
    const map = new Map();
    for (const s of authorizedScrims) {
      map.set(s.id, s);
    }
    return map;
  }, [authorizedScrims]);

  const authorizedIdsKey = useMemo(
    () =>
      authorizedScrims
        .map((s) => s.id)
        .filter(Boolean)
        .sort()
        .join('|'),
    [authorizedScrims]
  );

  const fetchRegistrations = useCallback(async (isManual = false) => {
    const ids = authorizedIdsKey ? authorizedIdsKey.split('|') : [];
    if (!supabase || ids.length === 0) {
      setRegistrations([]);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      hasLoadedRef.current = true;
      return;
    }

    if (hasLoadedRef.current || isManual) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('*')
        .in('scrim_id', ids)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(Array.isArray(data) ? data : []);
      hasLoadedRef.current = true;
    } catch (err) {
      showToastRef.current?.(`Gagal muat pendaftaran: ${err?.message || 'ralat rangkaian'}`);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, authorizedIdsKey]);

  useEffect(() => {
    fetchRegistrations(false);
  }, [fetchRegistrations]);

  useEffect(() => {
    if (!previewReceipt) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') setPreviewReceipt(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewReceipt]);

  // Dynamic custom timings derived strictly from sessions created by admins
  const availableTimings = useMemo(() => {
    const set = new Set();
    for (const s of authorizedScrims) {
      const timing = String(s.session_timing || '').trim();
      if (timing) set.add(timing);
    }
    return ['Semua Masa', ...Array.from(set)];
  }, [authorizedScrims]);

  useEffect(() => {
    if (!availableTimings.includes(timingFilter)) {
      setTimingFilter('Semua Masa');
    }
  }, [availableTimings, timingFilter]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const scrim = authorizedScrimMap.get(reg.scrim_id);
      if (!scrim) return false;
      if (timingFilter !== 'Semua Masa' && String(scrim.session_timing || '').trim() !== timingFilter) {
        return false;
      }
      if (sessionFilter !== 'all' && reg.scrim_id !== sessionFilter) return false;
      if (statusFilter !== 'Semua' && reg.status !== statusFilter) return false;
      return true;
    });
  }, [registrations, authorizedScrimMap, timingFilter, sessionFilter, statusFilter]);

  const counts = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let duplicate = 0;
    for (const reg of registrations) {
      if (reg.status === 'pending_verification') pending += 1;
      if (reg.status === 'verified') verified += 1;
      if (reg.is_duplicate_ref) duplicate += 1;
    }
    return { total: registrations.length, pending, verified, duplicate };
  }, [registrations]);

  const handleVerifyRegistration = async (reg) => {
    const scrim = authorizedScrimMap.get(reg.scrim_id);
    if (!scrim || processingId) return;
    setProcessingId(reg.id);
    try {
      const seedResult = await onAutoSeedSession(scrim, reg);
      if (seedResult?.error) {
        throw new Error(seedResult.error);
      }
      const assignedSlot = seedResult?.assignedSlot ?? null;
      const verifiedAt = new Date().toISOString();
      const { error } = await supabase
        .from('tournament_registrations')
        .update({
          status: 'verified',
          assigned_slot: assignedSlot,
          verified_at: verifiedAt,
          verified_by: currentUser?.id || null
        })
        .eq('id', reg.id);

      if (error) throw error;

      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === reg.id
            ? {
                ...item,
                status: 'verified',
                assigned_slot: assignedSlot,
                verified_at: verifiedAt,
                verified_by: currentUser?.id || null
              }
            : item
        )
      );
      showToast?.(
        `${reg.team_name} disahkan${assignedSlot ? ` & auto-seed ke Slot #${assignedSlot}` : ''}!`
      );
    } catch (err) {
      showToast?.(`Gagal sahkan pendaftaran: ${err?.message || 'ralat'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRegistration = async (reg) => {
    if (processingId) return;
    setProcessingId(reg.id);
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: currentUser?.id || null
        })
        .eq('id', reg.id);

      if (error) throw error;

      setRegistrations((prev) =>
        prev.map((item) => (item.id === reg.id ? { ...item, status: 'rejected' } : item))
      );
      showToast?.(`Pendaftaran ${reg.team_name} ditanda ditolak.`);
    } catch (err) {
      showToast?.(`Gagal tolak pendaftaran: ${err?.message || 'ralat'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const buildWhatsAppReplyUrl = (reg, scrim) => {
    const digits = normalizeWhatsAppDigits(reg.captain_whatsapp);
    if (!digits) return null;
    const lobbyLink = safeExternalUrl(scrim?.whatsapp_lobby_link) || '';
    const slotText = reg.assigned_slot ? `Slot #${reg.assigned_slot}` : 'Roster Disahkan';
    const messageLines = [
      `Hai kapten [${reg.team_tag}] ${reg.team_name},`,
      `Pendaftaran anda untuk *${scrim?.title || 'Sesi Scrim'}* (${scrim?.session_timing || scrim?.date || ''}) telah *DISAHKAN* (${slotText}).`,
      lobbyLink ? `\nLink WhatsApp Lobby:\n${lobbyLink}` : ''
    ].filter(Boolean);
    return safeExternalUrl(`https://wa.me/${digits}?text=${encodeURIComponent(messageLines.join('\n'))}`);
  };

  return (
    <div className="space-y-4">
      {/* Header Matrix Panel (Matches SCRIM HUB About / Direktori Penganjur) */}
      <div className="rounded-2xl border border-white/[0.08] vercel-grid-surface relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A]/90 text-[11px] font-mono text-zinc-300">
              <span className="text-[#D7FF00] font-semibold">Admin</span>
              <span className="text-zinc-600">/</span>
              <span>Registration Manager</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Pengesahan Resit &amp; Auto-Seed Pasukan
            </h2>
            <p className="text-xs text-zinc-400">
              Semak hasil imbasan OCR, kesan resit berganda, dan sahkan pasukan terus ke slot leaderboard.
            </p>
          </div>

          <div className="lg:col-span-5 bg-[#050506]/75 p-4 sm:p-6 flex flex-col justify-center gap-3">
            <div className={`grid ${counts.duplicate > 0 ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-white/[0.08] border border-white/[0.08] rounded-xl bg-[#0A0A0A] text-center font-mono tabular-nums`}>
              <div className="py-2 px-2">
                <span className="text-[10px] text-zinc-500 block">MENUNGGU</span>
                <span className="text-sm font-bold text-amber-300">{counts.pending}</span>
              </div>
              <div className="py-2 px-2">
                <span className="text-[10px] text-zinc-500 block">DISAHKAN</span>
                <span className="text-sm font-bold text-[#D7FF00]">{counts.verified}</span>
              </div>
              {counts.duplicate > 0 && (
                <div className="py-2 px-2">
                  <span className="text-[10px] text-zinc-500 block">DUPLIKAT</span>
                  <span className="text-sm font-bold text-red-400">{counts.duplicate}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => fetchRegistrations(true)}
                disabled={isRefreshing}
                aria-label="Muat semula senarai pendaftaran"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-w-[136px] min-h-[42px] rounded-xl border border-white/[0.12] bg-[#0F0F12] hover:bg-[#18181C] text-xs font-semibold text-zinc-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Menyegar...' : 'Segar Semula'}</span>
              </button>
              {typeof onOpenCreateModal === 'function' && (
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl bg-[#D7FF00] hover:bg-[#e5ff47] active:scale-[0.98] text-zinc-950 text-xs font-extrabold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Buka Tournament</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fast Filter Bar: Session Select + Dynamic Custom Timings + Status */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/[0.08] bg-[#0A0A0A]/85 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1">Masa:</span>
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

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              aria-label="Tapis sesi kejohanan"
              className="bg-black/70 border border-white/[0.1] focus:border-[#D7FF00]/60 rounded-xl px-3 py-1.5 min-h-[38px] text-xs text-zinc-200 focus:outline-none max-w-[210px]"
            >
              <option value="all">Semua Sesi ({authorizedScrims.length})</option>
              {authorizedScrims.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.05]">

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'Semua', label: 'Semua' },
                { id: 'pending_verification', label: 'Menunggu' },
                { id: 'verified', label: 'Disahkan' },
                { id: 'rejected', label: 'Ditolak' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 min-h-[34px] rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-white/[0.14] text-white border-white/30'
                      : 'bg-black/40 text-zinc-400 border-white/[0.06] hover:text-zinc-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Portal Tournaments Managed Strip (when inside Portal Tournament) */}
      {(typeof onOpenEditModal === 'function' || typeof onOpenCreateModal === 'function') && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#09090B]/85 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-white/[0.08] flex items-center justify-between gap-2">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-300">
              Tournament Portal Anda ({authorizedScrims.length})
            </h3>
            {authorizedScrims.length === 0 && typeof onOpenCreateModal === 'function' && (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="text-xs font-bold text-[#D7FF00] hover:underline cursor-pointer"
              >
                + Buka Tournament Pertama
              </button>
            )}
          </div>
          {authorizedScrims.length === 0 ? (
            <div className="p-4 text-xs text-zinc-500">
              Belum ada tournament dibuka di Portal Tournament. Klik <strong className="text-zinc-300">Buka Tournament</strong> di atas untuk membuka pendaftaran bagi pasukan.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {authorizedScrims.map((s) => (
                <div key={s.id} className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">{s.title}</span>
                      {s.event_category && (
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-zinc-300">
                          {s.event_category}
                        </span>
                      )}
                      {s.session_timing && (
                        <span className="px-2 py-0.5 rounded bg-[#D7FF00]/10 text-[10px] font-mono font-bold text-[#D7FF00]">
                          {s.session_timing}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          s.is_finished
                            ? 'bg-zinc-800/80 text-zinc-400 border-white/10'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {s.is_finished ? 'Ditutup' : 'Terbuka'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Tarikh: {s.date || '-'} · Yuran: {Number(s.entry_fee || 0) > 0 ? `RM ${Number(s.entry_fee).toFixed(2)}` : 'PERCUMA'} · Slot: {s.max_slots || 16}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {typeof onOpenEditModal === 'function' && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D7FF00]" />
                        <span>Edit</span>
                      </button>
                    )}
                    {typeof onTogglePortalRegistration === 'function' && (
                      <button
                        type="button"
                        onClick={() => onTogglePortalRegistration(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition cursor-pointer"
                      >
                        {s.is_finished ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Buka Semula</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tutup Daftar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Registration Rows Panel */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#09090B]/85 backdrop-blur-sm overflow-hidden">
        {isInitialLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400 font-mono">
            Memuatkan senarai pendaftaran...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileSearch className="w-7 h-7 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">Tiada pendaftaran dijumpai</p>
            <p className="text-xs text-zinc-500">
              Pendaftaran baru yang masuk dari Portal Tournament akan dipaparkan di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {filteredRegistrations.map((reg) => {
              const scrim = authorizedScrimMap.get(reg.scrim_id);
              const receiptUrl = safeMediaUrl(reg.receipt_image_url);
              const waReplyUrl = reg.status === 'verified' ? buildWhatsAppReplyUrl(reg, scrim) : null;
              const isBusy = processingId === reg.id;

              return (
                <div
                  key={reg.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-white/[0.015] transition"
                >
                  {/* Receipt Thumbnail */}
                  <div className="shrink-0">
                    {receiptUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewReceipt({ url: receiptUrl, teamName: reg.team_name, refNo: reg.ocr_reference_no })}
                        className="group relative w-20 h-20 rounded-2xl border border-white/[0.1] overflow-hidden bg-black block cursor-pointer"
                        aria-label={`Lihat resit ${reg.team_name}`}
                      >
                        <img
                          src={receiptUrl}
                          alt={`Resit ${reg.team_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </span>
                      </button>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border border-dashed border-white/[0.1] bg-black/40 flex flex-col items-center justify-center text-[10px] font-mono text-zinc-500 text-center px-1">
                        <span>{Number(scrim?.entry_fee || 0) > 0 ? 'Tiada Resit' : 'PERCUMA'}</span>
                      </div>
                    )}
                  </div>

                  {/* Team & OCR Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono font-bold text-[#D7FF00]">
                        [{reg.team_tag}]
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">{reg.team_name}</h3>

                      {reg.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D7FF00]/15 border border-[#D7FF00]/40 text-[11px] font-bold text-[#D7FF00]">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified {reg.assigned_slot ? `· Slot #${reg.assigned_slot}` : ''}
                        </span>
                      ) : reg.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/35 text-[11px] font-bold text-red-300">
                          <XCircle className="w-3 h-3" />
                          Ditolak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-[11px] font-bold text-amber-300">
                          <Clock className="w-3 h-3" />
                          Pending Verification
                        </span>
                      )}

                      {reg.is_duplicate_ref && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-[11px] font-extrabold text-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          DUPLICATE REF
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-200">{scrim?.title}</span>
                      {scrim?.event_category && (
                        <span className="font-mono text-[11px] text-zinc-400">{scrim.event_category}</span>
                      )}
                      {scrim?.session_timing && (
                        <span className="font-mono text-[11px] text-[#D7FF00]/90">{scrim.session_timing}</span>
                      )}
                      <span className="font-mono">WA: {reg.captain_whatsapp}</span>
                      {reg.captain_email && <span className="truncate">{reg.captain_email}</span>}
                    </div>

                    {/* OCR Strip */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300">
                        OCR Amaun:{' '}
                        <strong className="text-white">
                          {reg.ocr_extracted_amount != null
                            ? `RM ${Number(reg.ocr_extracted_amount).toFixed(2)}`
                            : 'Tidak dikesan'}
                        </strong>
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-300">
                        Ref No:{' '}
                        <strong className={reg.is_duplicate_ref ? 'text-red-300' : 'text-white'}>
                          {reg.ocr_reference_no || 'Tidak dikesan'}
                        </strong>
                      </span>
                      {Number(scrim?.entry_fee || 0) > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-zinc-400">
                          Yuran Sesi: <strong className="text-zinc-200">RM {Number(scrim.entry_fee).toFixed(2)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {reg.status !== 'verified' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleVerifyRegistration(reg)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#D7FF00] hover:bg-[#c8ef00] text-black text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isBusy ? 'Memproses...' : 'Verify & Auto-Seed'}</span>
                        </button>
                        {reg.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRejectRegistration(reg)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>
                        )}
                      </>
                    )}

                    {reg.status === 'verified' && waReplyUrl && (
                      <a
                        href={waReplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Hantar Lobby WA</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Image Zoom Modal */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewReceipt(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Pratonton resit ${previewReceipt.teamName}`}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-white/[0.12] bg-[#09090B] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Resit — {previewReceipt.teamName}</p>
                {previewReceipt.refNo && (
                  <p className="text-[11px] font-mono text-zinc-400">Ref: {previewReceipt.refNo}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceipt(null)}
                aria-label="Tutup pratonton resit"
                className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewReceipt.url}
                alt={`Resit ${previewReceipt.teamName}`}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
