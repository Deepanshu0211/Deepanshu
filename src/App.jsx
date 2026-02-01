import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Twitter, MapPin, ArrowUpRight, Code, Terminal, Cpu, Globe, Play, Pause, Disc, Clock } from 'lucide-react';
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

const QUOTES_API = [
  "Simplicity is the ultimate sophistication.",
  "Make it simple, but significant.",
  "Code is poetry.",
  "Less is more.",
  "Creativity is intelligence having fun.",
  "Design is intelligence made visible."
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
        <p className="font-serif italic text-2xl text-gray-400 mt-2">Creative Developer</p>
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

    // 2. Fetch Actual Quote from API
    fetch('https://api.quotable.io/random?tags=technology,inspirational,creativity&maxLength=50')
      .then(res => res.json())
      .then(data => setQuote(data.content))
      .catch(() => setQuote("Simplicity is the ultimate sophistication."));

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

                {content.type === 'gh' && <a href="https://github.com/Deepanshu0211" className="center-xy text-gray-400 hover:text-white"><Github size={48} strokeWidth={1.5} /></a>}
                {content.type === 'li' && <a href="https://www.linkedin.com/in/deepanshuyad/" className="center-xy text-gray-400 hover:text-white"><Linkedin size={48} strokeWidth={1.5} /></a>}
                {content.type === 'x' && <a href="https://x.com/V3Deepanshu" className="center-xy text-gray-400 hover:text-white"><Twitter size={48} strokeWidth={1.5} /></a>}

                {content.type === 'time' && (
                  <div className="center-xy">
                    <Clock size={32} className="mb-4 opacity-40" />
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
                      <span className="text-xs uppercase tracking-widest opacity-50 mt-1">Let's work together</span>
                    </div>
                    <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <ArrowUpRight size={32} strokeWidth={1.5} />
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
