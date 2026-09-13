import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import BottomNavDock from '../../components/public/BottomNavDock';
import infracheckIcon from '../../../assets/Icon.png';
import CameraAltOutlined from '@mui/icons-material/CameraAltOutlined';
import Send from '@mui/icons-material/Send';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import HelpOutlined from '@mui/icons-material/HelpOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Apakah saya harus bayar atau mendaftar akun?',
    answer:
      'Tidak. InfraCheck 100% gratis dan tidak memerlukan registrasi akun bagi warga. Anda dapat langsung mendokumentasikan kerusakan, mengunggah foto bukti, dan memantau status tindak lanjut secara anonim tanpa birokrasi.',

  },
  {
    id: 2,
    question: 'Bagaimana jika laporan saya tidak segera ditanggapi?',
    answer:
      'Setiap laporan yang mendapatkan konfirmasi dari warga sekitar ("Saya Juga Merasakan") secara otomatis naik status urgensinya dalam sistem pemeringkatan prioritas dinas teknis terkait.',
  },
  {
    id: 3,
    question: 'Bagaimana jaminan privasi data pelapor?',
    answer:
      'InfraCheck memprioritaskan keamanan dan privasi warga. Kami tidak pernah mempublikasikan identitas pribadi pelapor secara terbuka. Verifikasi murni berfokus pada keabsahan bukti fisik fasilitas dan koordinat GPS lokasi.',
  },
  {
    id: 4,
    question: 'Bagaimana cara melacak proses perbaikan infrastruktur?',
    answer:
      'Setiap laporan yang terkirim akan memperoleh Tracking ID unik (contoh: IC-2026-00042). Anda dapat memasukkan kode tiket tersebut kapan saja di menu Lacak Laporan untuk melihat timeline penanganan dari tim lapangan.',
  },
];

const STEPS = [
  {
    title: '01. Temukan & Foto',
    desc: 'Ambil foto bukti titik kerusakan fasilitas publik di sekitar Anda dengan jelas.',
    icon: CameraAltOutlined,
  },
  {
    title: '02. Kirim Laporan',
    desc: 'Pilih kategori fasilitas, isi detail masalah, dan tentukan lokasi instan via GPS.',
    icon: Send,
  },
  {
    title: '03. Konfirmasi Warga',
    desc: 'Warga sekitar dapat ikut mengonfirmasi titik kerusakan untuk mendongkrak prioritas.',
    icon: GroupOutlined,
  },
  {
    title: '04. Pantau Perbaikan',
    desc: 'Pantau status pengerjaan dinas secara transparan hingga fasilitas selesai diperbaiki.',
    icon: CheckCircleOutlined,
  },
];

const CORE_PILLARS = [
  {
    icon: ShieldOutlined,
    title: 'Pengawasan Komunitas',
    desc: 'Partisipasi kolektif warga mengawal kualitas fasilitas umum kota secara langsung.',
  },
  {
    icon: BoltOutlined,
    title: 'Akses Instan Tanpa Hambatan',
    desc: 'Laporkan masalah tanpa login rumit atau birokrasi berbelit. Cepat dan mudah.',
  },
  {
    icon: VisibilityOutlined,
    title: 'Akuntabilitas & Transparansi',
    desc: 'Sistem tracking terbuka untuk memastikan setiap laporan ditindaklanjuti secara nyata.',
  },
];

const STATS = [
  { value: '100%', label: 'Gratis & Terbuka' },
  { value: 'Realtime', label: 'Verifikasi GPS' },
  { value: 'Anonim', label: 'Privasi Terjamin' },
];

const AboutPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(1); // Default open first FAQ

  const toggleFaq = (id) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <PublicLayout>
      <div
        id="about-page-container"
        className="h-full w-full bg-[#111416] text-slate-100 flex flex-col justify-between overflow-hidden relative select-none md:select-auto font-['Poppins',sans-serif]"
      >
        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main
          id="about-main-scroll"
          className="flex-1 w-full max-w-xl mx-auto overflow-y-auto pb-32 scrollbar-none"
        >
          {/* 1. HERO HEADER WITH DIRECT BRAND LOGO */}
          <div
            id="about-hero-header-banner"
            className="w-full bg-gradient-to-b from-[#2e3b68] via-[#354376] to-[#252f52] py-4 px-4 rounded-b-[28px] flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4)] border-b border-[#4d609c]/35 relative overflow-hidden"
          >
            {/* Background Material Subtle Radial Glow Accent */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#5F7ADB]/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#354376]/40 rounded-full blur-lg pointer-events-none" />

            {/* Direct Brand Logo Placement */}
            <div className="relative z-10 flex items-center justify-center">
              <img
                src={infracheckIcon}
                alt="InfraCheck"
                className="h-24 sm:h-28 w-auto max-w-[90%] object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>

          <div className="px-5 pt-6 space-y-6">
            {/* 2. VISION STATEMENT & STATS BENTO (Material 3 Tonal Surface) */}
            <section
              id="about-hero-vision"
              className="bg-[#181b20] border border-[#2e3442] rounded-[28px] p-5 sm:p-6 space-y-5 shadow-lg relative overflow-hidden"
            >
              <div className="text-center space-y-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug font-['Plus_Jakarta_Sans']">
                  Transparansi & Partisipasi untuk Infrastruktur Publik yang Lebih Baik.
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto ">
                  Menghubungkan suara warga dengan aksi nyata pemerintah melalui platform audit digital yang terbuka, terpercaya, dan akuntabel.
                </p>
              </div>

              {/* Stats Highlights Bento Strip */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#2a303d]">
                {STATS.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1f232b] rounded-2xl p-2.5 text-center border border-[#323847] space-y-0.5 flex flex-col justify-center"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-[#93c5fd] font-['Plus_Jakarta_Sans'] leading-tight">
                      {stat.value}
                    </span>
                    <span className="text-[11px] font-bold text-white leading-tight">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. SECTION: APA ITU INFRACHECK */}
            <section
              id="about-section-intro"
              className="bg-[#181b20] border border-[#2e3442] rounded-[28px] p-5 sm:p-6 space-y-4 shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Plus_Jakarta_Sans'] leading-tight">
                      Apa Itu InfraCheck?
                    </h2>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                  InfraCheck adalah platform <span className="text-white font-semibold">civic technology</span> independen yang menjembatani laporan warga dengan dinas terkait melalui sistem pengarsipan audit digital yang terstruktur, transparan, dan terverifikasi secara geografis.
                </p>
              </div>

              {/* Infrastructure Showcase Photo Card with M3 Overlay & Badge */}
              <div className="relative w-full h-44 sm:h-52 rounded-[22px] overflow-hidden border border-[#343a4a] shadow-md bg-[#131518] group">
                <img
                  src="https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1000&q=80"
                  alt="Konstruksi Jembatan Infrastruktur Publik"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111416] via-transparent to-transparent opacity-80" />
              </div>
            </section>

            {/* 4. SECTION: MISI & PRINSIP KAMI (M3 Bento Cards) */}
            <section
              id="about-section-misi"
              className="bg-[#181b20] border border-[#2e3442] rounded-[28px] p-5 sm:p-6 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#2d3340] pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Plus_Jakarta_Sans'] leading-tight">
                    Misi & Prinsip Kami
                  </h2>
                </div>
              </div>

              {/* 3 Core Pillars Bento Stack */}
              <div className="space-y-3">
                {CORE_PILLARS.map((pillar, idx) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-[#1f242d] hover:bg-[#232934] border border-[#323948] hover:border-[#4d609c]/60 rounded-2xl p-3.5 flex items-start gap-3.5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#2b365e] text-blue-200 flex items-center justify-center shrink-0 border border-[#4d609c]/40 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                            {pillar.title}
                          </h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                          {pillar.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. SECTION: CARA KERJA (4 LANGKAH MUDAH) */}
            <section id="about-section-how-it-works" className="space-y-4.5">
              <div className="px-1 space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                  Cara Kerja Platform
                </h2>
                <p className="text-xs text-slate-400">
                  4 langkah mudah bagi warga untuk mengawal perbaikan fasilitas publik:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STEPS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="bg-[#181b20] border border-[#2e3442] hover:border-[#5F7ADB]/60 rounded-[24px] p-4 space-y-3 transition-all hover:bg-[#1d2128] shadow-md group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-[#28355c] text-blue-200 flex items-center justify-center border border-[#4d609c]/40 group-hover:scale-105 transition-transform shadow-xs">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug font-['Plus_Jakarta_Sans']">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 6. SECTION: FAQS (Material 3 Accordion Surfaces) */}
            <section
              id="about-section-faqs"
              className="bg-[#181b20] border border-[#2e3442] rounded-[28px] p-5 sm:p-6 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#2d3340] pb-3">
                <div className="space-y-0.5">
                  <h1 className="text-3xl sm:text-xl font-bold italic text-white tracking-tight font-['Plus_Jakarta_Sans']">
                    FAQs
                  </h1>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[#263152] text-blue-200 flex items-center justify-center border border-[#3e4f84]/40 shrink-0">
                  <HelpOutlined className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2.5">
                {FAQ_ITEMS.map((faq) => {
                  const isOpen = openFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen
                        ? 'bg-[#202530] border-[#5F7ADB]/50 shadow-md'
                        : 'bg-[#1b1f26] border-[#2e3442] hover:border-[#3d4556]'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isOpen ? 'bg-[#5F7ADB] shadow-[0_0_8px_rgba(95,122,219,0.8)]' : 'bg-slate-500'
                              }`}
                          />
                          <span className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                            {faq.question}
                          </span>
                        </div>

                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${isOpen
                            ? 'bg-[#354376] text-blue-200 rotate-180'
                            : 'bg-[#262c37] text-slate-400'
                            }`}
                        >
                          <ExpandMore className="w-4 h-4" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#2c3342] animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 7. SECTION: CTA AJAK WARGA BERKONTRIBUSI (M3 Expressive Card) */}
            <section
              id="about-cta-card"
              className="bg-gradient-to-br from-[#1e263c] via-[#1a2033] to-[#151924] border border-[#3e4c74]/70 rounded-[32px] p-6 text-center space-y-4 shadow-[0_12px_28px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#5F7ADB]/20 rounded-full blur-2xl pointer-events-none" />


              <div className="space-y-1.5 relative z-10">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                  Mulai Berkontribusi untuk Kota Anda
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Laporkan kerusakan fasilitas publik di lingkungan sekitar agar segera ditangani dinas terkait dengan transparansi penuh.
                </p>
              </div>

              <div className="pt-1 relative z-10">
                <Link
                  id="about-cta-btn-laporkan"
                  to="/report/new"
                  className="w-full py-3.5 px-6 rounded-full bg-[#5F7ADB] hover:bg-[#4d69d4] active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide shadow-[0_8px_20px_rgba(95,122,219,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <AddCircleOutlined className="w-4 h-4" />
                  <span>Buat Laporan Kerusakan Baru</span>
                </Link>
              </div>
            </section>
          </div>
        </main>

        {/* 8. MATERIAL YOU BOTTOM NAVIGATION DOCK */}
        <BottomNavDock activeTab="about" />
      </div>
    </PublicLayout>
  );
};

export default AboutPage;

