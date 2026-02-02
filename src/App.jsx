import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowUpRight, Code, Terminal, Cpu, Globe, Play, Pause, Clock } from 'lucide-react';
import './index.css';

// --- AESTHETIC DATA ---

// --- DATA & ASSETS ---
const THEMES = [
  { name: 'Aurora', bg: 'radial-gradient(circle, rgba(76, 29, 149, 0.2), transparent 60%)', blob: '#8b5cf6' },
  { name: 'Sunset', bg: 'radial-gradient(circle, rgba(244, 63, 94, 0.15), transparent 60%)', blob: '#f43f5e' },
  { name: 'Ocean', bg: 'radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 60%)', blob: '#06b6d4' },
  { name: 'Midnight', bg: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 60%)', blob: '#6366f1' },
  { name: 'Forest', bg: 'radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 60%)', blob: '#10b981' },
  { name: 'Cherry', bg: 'radial-gradient(circle, rgba(236, 72, 153, 0.15), transparent 60%)', blob: '#ec4899' },
  { name: 'Gold', bg: 'radial-gradient(circle, rgba(234, 179, 8, 0.15), transparent 60%)', blob: '#eab308' },
  { name: 'Noir', bg: 'radial-gradient(circle, rgba(255, 255, 255, 0.05), transparent 60%)', blob: '#ffffff' },
];

const LOFI_STATIONS = [
  { title: "Dreamy Beats", artist: "Lofi Girl", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500&auto=format&fit=crop" },
  { title: "Night Walk", artist: "Chillhop", url: "https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3", img: "https://images.unsplash.com/photo-1534271142436-15082442db1f?q=80&w=500&auto=format&fit=crop" },
  { title: "Study Session", artist: "Jazz Hop", url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", img: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=500&auto=format&fit=crop" },
  { title: "Tokyo Rain", artist: "Vibes", url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=500&auto=format&fit=crop" },
  { title: "Coffee Shop", artist: "Ambience", url: "https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc8c679a5d.mp3", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=500&auto=format&fit=crop" },
  { title: "Retro Synth", artist: "Wave", url: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_5174092497.mp3", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop" },
];

const QUOTES_DB = [
  "Simplicity is the ultimate sophistication.",
  "Make it simple, but significant.",
  "Code is poetry.",
  "Less is more.",
  "Creativity is intelligence having fun.",
  "Design is intelligence made visible.",
  "Digital craftsmanship.",
  "Art challenges technology.",
  "Technology inspires art."
];

const SLOTS = [
  { id: 's1', size: 'span-2x2' },
  { id: 's2', size: 'span-2x1' },
  { id: 's3', size: 'span-2x1' },
  { id: 's4', size: 'span-1x1' },
  { id: 's5', size: 'span-1x2' },
  { id: 's6', size: 'span-1x1' },
  { id: 's7', size: 'span-1x1' },
  { id: 's8', size: 'span-1x1' },
  { id: 's9', size: 'span-1x1' }, // Center align fix needed here often
  { id: 's10', size: 'span-1x1' },
  { id: 's11', size: 'span-4x1' },
];

const CONTENT_TYPES = [
  { type: 'profile', id: 'c-profile' },
  { type: 'music', id: 'c-music' },
  { type: 'title', id: 'c-title' },
  { type: 'status', id: 'c-status' },
  { type: 'tech', id: 'c-tech' },
  { type: 'gh', id: 'c-gh' },
  { type: 'li', id: 'c-li' },
  { type: 'x', id: 'c-x' },
  { type: 'time', id: 'c-time' },
  { type: 'quote', id: 'c-quote' },
  { type: 'notify', id: 'c-notify' },
];

// --- ICONS ---

const GithubIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// --- COMPONENTS ---

const Profile = ({ size }) => {
  if (size === 'span-1x1') return (
    <div className="center-xy p-4">
      <div className="w-12 h-12 rounded-full bg-white mb-2 overflow-hidden"><img src="https://ui-avatars.com/api/?name=D&background=000&color=fff" alt="D" /></div>
      <span className="font-serif italic text-lg">Deepanshu</span>
    </div>
  );
  return (
    <div className="profile-box">
      <div>
        <h1 className="name-huge">Deepanshu.</h1>
        <p className="font-serif italic text-2xl text-gray-400 mt-2">Software Developer & Creative Developer</p>
      </div>
      <div className="tag-pill">
        <MapPin size={12} /> New Delhi
      </div>
    </div>
  );
};

const Music = ({ size }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const [track, setTrack] = useState(LOFI_STATIONS[0]);

  useEffect(() => {
    setTrack(LOFI_STATIONS[Math.floor(Math.random() * LOFI_STATIONS.length)]);
  }, []);

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const isSmall = size === 'span-1x1';

  return (
    <div className="music-box">
      <div className="music-blur-bg" style={{ backgroundImage: `url(${track.img})` }} />
      <audio ref={audioRef} src={track.url} loop onEnded={() => setPlaying(false)} />

      <div className="music-ui">
        {!isSmall && (
          <div className="flex flex-col justify-center overflow-hidden max-w-[60%]">
            <h3 className="text-2xl font-medium truncate">{track.title}</h3>
            <p className="font-serif italic text-lg opacity-80">{track.artist}</p>
          </div>
        )}
        <button className="play-frosted" onClick={toggle}>
          {playing ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" style={{ marginLeft: 4 }} />}
        </button>
      </div>
    </div>
  );
};

const Status = () => (
  <div className="status-box">
    <div className="flex items-center gap-3">
      {/* <div className="blob-pulse" /> */}
      <span className="text-xs font-mono font-bold tracking-widest text-blue-300">STATUS</span>
    </div>
    <div className="text-4xl font-[Clash_Display] font-semibold">Building</div>
  </div>
);

const Tech = ({ size }) => {
  const icons = [Code, Terminal, Cpu, Globe];
  const isVert = size === 'span-1x2';
  return (
    <div className={`tech-row ${isVert ? 'flex-col' : ''}`}>
      {icons.map((I, i) => <div key={i} className="tech-icon-glass"><I size={24} /></div>)}
    </div>
  );
};

const Loader = ({ onDone }) => {
  useEffect(() => { setTimeout(onDone, 2500); }, []);
  return (
    <motion.div className="fixed inset-0 z-[999] bg-black flex items-center justify-center" exit={{ opacity: 0, transition: { duration: 1 } }}>
      <motion.h1
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5 }}
        className="text-8xl font-[Clash_Display] font-medium text-white"
      >
        Deepanshu
      </motion.h1>
    </motion.div>
  );
};

// --- APP ---

const App = () => {
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState(CONTENT_TYPES);
  const [quote, setQuote] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);

  useEffect(() => {
    // 1. Random Theme
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setTheme(randomTheme);
    document.documentElement.style.setProperty('--theme-gradient', randomTheme.bg);
    document.documentElement.style.setProperty('--blob-color', randomTheme.blob);
    document.documentElement.style.setProperty('--blob-glow', `${randomTheme.blob}aa`);

    // 2. Local Instant Quote (API is flaky)
    setQuote(QUOTES_DB[Math.floor(Math.random() * QUOTES_DB.length)]);

    // 3. Shuffle Layout (Pin Profile @ 0)
    const pinned = CONTENT_TYPES[0];
    const others = CONTENT_TYPES.slice(1, -1);
    const footer = CONTENT_TYPES[CONTENT_TYPES.length - 1];

    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    setLayout([pinned, ...others, footer]);
  }, []);

  const swap = (dragId, targetSlotIdx) => {
    const dragIdx = layout.findIndex(c => c.id === dragId);
    if (dragIdx === 0 || targetSlotIdx === 0) return;
    if (dragIdx === -1) return;
    const newL = [...layout];
    const temp = newL[targetSlotIdx];
    newL[targetSlotIdx] = newL[dragIdx];
    newL[dragIdx] = temp;
    setLayout(newL);
  };

  return (
    <>
      <div className="noise" />
      <div className="aurora-blob" />

      <AnimatePresence>{loading && <Loader onDone={() => setLoading(false)} />}</AnimatePresence>

      {!loading && (
        <motion.div className="aesthetic-grid">
          {SLOTS.map((slot, idx) => {
            const content = layout[idx] || { type: 'empty' };
            const isPinned = idx === 0;

            return (
              <motion.div key={slot.id} className={`glass-card ${slot.size}`}>
                {/* Renderer */}
                {content.type === 'profile' && <Profile size={slot.size} />}
                {content.type === 'music' && <Music size={slot.size} />}
                {content.type === 'status' && <Status />}
                {content.type === 'tech' && <Tech size={slot.size} />}

                {content.type === 'title' && (
                  <div className="center-xy">
                    <h2 className="font-serif italic text-6xl opacity-90">{slot.size === 'span-1x1' ? '2026' : 'Portfolio'}</h2>
                  </div>
                )}

                {content.type === 'gh' && (
                  <a href="https://github.com/Deepanshu0211" className="social-card group w-full h-full">
                    <div className="center-xy">
                      <GithubIcon className="w-6 h-6 text-violet-400 group-hover:text-violet-300 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
                    </div>
                  </a>
                )}
                {content.type === 'li' && (
                  <a href="https://www.linkedin.com/in/deepanshuyad/" className="social-card group w-full h-full">
                    <div className="center-xy">
                      <LinkedinIcon className="w-6 h-6 text-sky-400 group-hover:text-sky-300 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                    </div>
                  </a>
                )}
                {content.type === 'x' && (
                  <a href="https://x.com/V3Deepanshu" className="social-card group w-full h-full">
                    <div className="center-xy">
                      <TwitterIcon className="w-6 h-6 text-gray-400 group-hover:text-cyan-100 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                    </div>
                  </a>
                )}

                {content.type === 'time' && (
                  <div className="center-xy">
                    <Clock size={24} className="mb-3 opacity-40" />
                    <span className="font-mono text-2xl">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {content.type === 'quote' && (
                  <div className="center-xy p-6 px-8">
                    <p className="font-serif italic text-2xl leading-tight text-center opacity-80">"{quote}"</p>
                  </div>
                )}

                {content.type === 'notify' && (
                  <a href="mailto:dy3239073@gmail.com" className="notify-btn no-underline">
                    <div className="flex flex-col items-start justify-center h-full">
                      <span className="font-serif italic text-5xl">Say Hi</span>
                      {/* <span className="text-xs uppercase tracking-widest opacity-50 mt-1">Let's work together</span> */}
                    </div>
                    <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <ArrowUpRight size={28} strokeWidth={1.5} />
                    </div>
                  </a>
                )}

                {/* Drag logic */}
                {!isPinned && (
                  <motion.div
                    className="absolute inset-0 z-50 hover:cursor-grab active:cursor-grabbing"
                    drag dragSnapToOrigin
                    onDragEnd={(e, info) => {
                      const els = document.elementsFromPoint(info.point.x, info.point.y);
                      const t = els.find(el => el.getAttribute('data-idx'));
                      if (t) swap(content.id, parseInt(t.getAttribute('data-idx')));
                    }}
                  />
                )}
                <div className="absolute inset-0 pointer-events-none" data-idx={idx} />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </>
  );
};

export default App;
