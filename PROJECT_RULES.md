# Project Rules & Architecture — SCRIM HUB

## 1. Tech Stack & Infrastructure
- **Frontend Core**: React 19 (`react`, `react-dom`) + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss";`)
- **Icons & Graphics**: Lucide React (`lucide-react`) + Custom SVG icons (Instagram, TikTok)
- **Image Export**: `html-to-image` (`toPng`) untuk jana poster resolusi tinggi (2x pixel ratio)
- **Database, Auth & Storage**: Supabase (`@supabase/supabase-js`)
  - Supabase Client: `src/supabaseClient.js`
  - Storage Bucket: `scrim-assets` (folder: `avatars/`, `uploads/`)
  - Auth: Supabase Auth (Email & Password, session listener via `onAuthStateChange`)
- **Linting & Quality**: Oxlint (`oxlint`)
- **Deployment**: Vercel

---

## 2. Struktur Aplikasi & Modul (Current State)
Aplikasi beroperasi sebagai Single Page Application (SPA) bersepadu berpusat pada `src/App.jsx` dengan kawalan navigasi melalui state `activeTab` dan sinkronisasi URL hash:

| Tab / Route | Fungsi & Komponen Utama |
| :--- | :--- |
| **`playground` / `home`** | Landing page, hero section, ringkasan ciri SCRIM HUB, butang pantas ke Scorer. |
| **`scorer`** | Quick Scorer Workspace (5 Match tracker, kiraan mata rasmi, slot manager 2–24 pasukan, jana poster Overall & Single Match, simpan ke Cloud). |
| **`teams`** | Direktori pangkalan data pasukan PUBG Mobile, penapisan tier, dan carian squad. |
| **`history` / `leaderboard`** | Rekod kejohanan/scrim yang telah dihoskan di Supabase (`scrims`), paparan standings penuh dan pecahan mata setiap pusingan. |
| **`hosts`** | Direktori penganjur rasmi berdaftar dengan maklumat kontak dan pautan media sosial. |
| **`showcase`** | Feed video sorotan perlawanan (`TikTokPreviewCard` untuk klip TikTok & Instagram). |
| **`about`** | Panduan sistem mata rasmi PUBG Mobile, FAQ, dan borang maklum balas terus ke developer (`feedbacks`). |
| **`admin`** | Dashboard penganjur untuk urus scrim milik sendiri (`created_by`, `co_hosts`), kemaskini skor live, sunting profil, dan jana poster rasmi. |

### Modals & Interactivity
- **Guide Presentation Modal**: Slider tutorial 4 slaid interaktif (sokongan keyboard: Arrow Left/Right/Esc, trigger melalui URL `#guide`).
- **Quick Action Modal**: Butang pintas (+) terapung untuk mula mengira markah atau cipta scrim baharu.
- **Auth Modal**: Antara muka log masuk & daftar akaun penganjur.
- **Profile & Feedback Modals**: Kemaskini profil hos dan serahan cadangan/pepijat pengguna.

---

## 3. Struktur Data & Skema Supabase

### A. Jadual `scrims`
- `id` (text / primary key)
- `title` (text)
- `event_type` (text, e.g. `'Scrim'`)
- `tier` (text, e.g. `'Tier 1 (Pro)'`)
- `description` (text)
- `date` (text / date, e.g. `'YYYY-MM-DD'`)
- `logo_url` (text)
- `host_name` (text), `host_contact` (text)
- `total_matches` (integer, lalai: 5)
- `matches` (jsonb/array objek perlawanan: `matchNo`, `title`, `map`, `slots`)
- `created_by` (uuid / auth.users id)
- `co_hosts` (array user id yang diberi kebenaran)
- `claim_token` (text unik)
- `is_finished` (boolean)

### B. Jadual `teams`
- `id` (text / primary key)
- `name` (text, nama pasukan)
- `tag` (text, singkatan pasukan)
- `logo_url` (text, pilihan)
- `tier` (text, pilihan)

### C. Jadual `profiles`
- `id` (uuid, sepadan dengan `auth.users.id`)
- `display_name` (text)
- `contact` (text)
- `bio` (text)
- `avatar_url` (text)
- `updated_at` (timestamp)

### D. Jadual `posts`
- `id` (text / primary key)
- `title` (text), `caption` (text)
- `media_type` (text, e.g. `'video'`, `'image'`), `media_url` (text)
- `external_url` (text), `platform` (text, e.g. `'tiktok'`, `'instagram'`)
- `likes` (integer), `date` (text), `tags` (array text)
- `created_at` (timestamp)

### E. Jadual `feedbacks`
- `id` (text), `user_email` (text), `category` (text), `message` (text), `created_at` (timestamp)

### F. Storan / Storage Bucket: `scrim-assets`
- `avatars/`: Gambar profil pengguna/hos.
- `uploads/`: Imej dan aset muat naik kejohanan.

---

## 4. Peraturan Pengiraan Mata & Tiebreaker (PUBG Mobile Standard)

### Sistem Mata:
- **Placement Points**:
  - Posisi 1 (WWCD): 10 mata
  - Posisi 2: 6 mata
  - Posisi 3: 5 mata
  - Posisi 4: 4 mata
  - Posisi 5: 3 mata
  - Posisi 6: 2 mata
  - Posisi 7–8: 1 mata
  - Posisi 9–16+: 0 mata
- **Elimination Points**: 1 mata bagi setiap kill / elim.
- **Total Points**: `Placement Points + Elimination Points`.

### Urutan Tiebreaker (Kedudukan Seri):
1. Jumlah Keseluruhan Mata (**Total Points** - Tertinggi)
2. Mata Posisi Keseluruhan (**Total Placement Points** - Tertinggi)
3. Jumlah Mata Penyingkiran (**Total Elims** - Tertinggi)
4. Bilangan Kemenangan (**Total WWCD** - Terbanyak)
5. Rekod Posisi Terbaik Perlawanan Tunggal (**Best Single Placement** - Terendah/Terbaik)
6. Nombor Slot Pasukan (Terkecil)

---

## 5. UI & Design Guidelines

- **Theme Target**: Dark, high-contrast competitive esports aesthetic.
- **Warna Rasmi**:
  - Latar Belakang: Deep Black / Dark Zinc (`#0A0A0C` / `#09090b` / `#000000`).
  - Tipografi: Putih bersih (`#FFFFFF` / `#F8FAFC`) dengan teks sekunder kelabu sejuk (`#94A3B8`).
  - Aksen Utama: Electric Lime (`#CCFF00` / `#D7FF00`).
- **Status Semasa UI**:
  - Bahagian Penjana Poster dan jadual kedudukan dalaman telah mengikut tema gelap & aksen lime.
  - Kerangka luaran aplikasi (header, shell latar belakang) masih dalam fasa peralihan dari `slate-100` ke tema gelap penuh (*deep black*). Sebarang pembangunan UI baru mesti mematuhi tema gelap rasmi.
- **Responsiveness**:
  - Utamakan reka bentuk Mobile First & Tablet Portrait view.
  - Setiap jadual wajib dibalut dengan pembungkus `overflow-x-auto` bagi memastikan tiada limpahan mendatar (*no viewport horizontal overflow*).
  - Navigasi telefon menggunakan Mobile Bottom Navigation bar yang tersemat rapi (`fixed bottom-0 pb-safe`).

---

## 6. Maintenance & Code Standards

1. **Integriti Skema Supabase**:
   - Jangan ubah nama jadual atau nama lajur database tanpa menyediakan skrip SQL migration bersesuaian.
2. **Penyelarasan Logik Scoring**:
   - Sebarang perubahan logik ranking, scoring, atau fetch data mestilah sentiasa sepadan dengan struktur `matches` dan format JSONB jadual `scrims`.
3. **Resiliensi Tempatan (Local-First Fallback)**:
   - Quick Scorer wajib mengekalkan sokongan simpanan sandaran ke `localStorage` (`scrim_active_match`) agar data penganjur tidak hilang sekiranya terputus talian internet.
4. **Kawalan Kebergantungan (Dependencies)**:
   - Jangan padam atau ubah versi dependency dalam `package.json` atau fail `vite.config.js` melainkan diminta secara spesifik.
5. **Kualiti Kod & Linting**:
   - Pastikan setiap perubahan melepasi semakan `oxlint` dan boleh dibina dengan bersih melalui `npm run build`.
