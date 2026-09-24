"use client";

import React, { useState } from "react";

interface ChapterData {
  id: string;
  chapter: string;
  themeClass: string;
  themeColor: string;
  company: string;
  role: string;
  period: string;
  tagline: string;
  headline: string;
  story: string;
  metrics: { value: string; label: string; detail: string }[];
  breakthrough: string;
  quote: string;
  stack: { name: string; color: string }[];
  artifact: {
    type: "lms" | "fullstack" | "finance";
    title: string;
    sub: string;
  };
}

const CHAPTERS: ChapterData[] = [
  {
    id: "chapter-1",
    chapter: "01",
    themeClass: "theme-blue",
    themeColor: "#2448f5",
    company: "IIT Mandi",
    role: "Frontend Developer · AcadLMS",
    period: "JUL 2026 — PRESENT",
    tagline: "CHAPTER 01 · PRODUCTION SCALE",
    headline: "Designing for thousands: When software touches real campus life every single day.",
    story:
      "AcadLMS isn’t a sandbox app—it’s the daily operational backbone for hundreds of students, faculty, and academic administration at IIT Mandi. Stepping in meant confronting real friction: multi-step course registrations, fragmented grade reports, and confusing workflows. I focused on tearing down complexity, crafting responsive UI systems, and ensuring student-facing flows felt instant, accessible, and human.",
    metrics: [
      { value: "1,000+", label: "Active Campus Users", detail: "Daily students & faculty relying on AcadLMS" },
      { value: "−45%", label: "Workflow Friction", detail: "Streamlined course enrollment steps" },
      { value: "99.8%", label: "Production Uptime", detail: "High-concurrency semester registration" },
    ],
    breakthrough: "The most powerful frontend is the one users never have to think about.",
    quote: "If a student has to stop and ask where to click, that’s our bug.",
    stack: [
      { name: "React", color: "#0ea5e9" },
      { name: "Next.js", color: "#111827" },
      { name: "TypeScript", color: "#3178c6" },
      { name: "REST APIs", color: "#8b5cf6" },
      { name: "Design Systems", color: "#ec4899" },
    ],
    artifact: {
      type: "lms",
      title: "acadlms.iitmandi.ac.in/portal",
      sub: "Student Registration & Course Core Engine",
    },
  },
  {
    id: "chapter-2",
    chapter: "02",
    themeClass: "theme-orange",
    themeColor: "#ea580c",
    company: "Ethixweb",
    role: "Full Stack Developer Intern",
    period: "AUG — SEP 2026",
    tagline: "CHAPTER 02 · FULL-STACK CRUCIBLE",
    headline: "Fast cycles, live client releases, and learning how software breathes in production.",
    story:
      "At Ethixweb, velocity was the currency. I operated across the full spectrum—connecting dynamic frontend states to backend database queries, debugging live production issues, and shipping client-requested features on tight turnaround windows. Here, academic theory gave way to the gritty discipline of clean APIs, modular components, and shipping code that another human can read at 2 AM.",
    metrics: [
      { value: "5×", label: "Shipping Velocity", detail: "From concept to live deployment" },
      { value: "100%", label: "Client SLA Delivered", detail: "Zero rollbacks on production features" },
      { value: "12+", label: "Features Shipped", detail: "Full stack API & UI integration" },
    ],
    breakthrough: "Shipping early beats endless perfection, but clean architecture keeps you moving fast.",
    quote: "Speed without clarity is just technical debt in disguise.",
    stack: [
      { name: "React", color: "#0ea5e9" },
      { name: "Node.js", color: "#16a34a" },
      { name: "Tailwind CSS", color: "#06b6d4" },
      { name: "MongoDB", color: "#10b981" },
      { name: "RESTful Architecture", color: "#ea580c" },
    ],
    artifact: {
      type: "fullstack",
      title: "api.ethixweb.internal/v1/deploy",
      sub: "Microservice Pipeline & Client Dashboard",
    },
  },
  {
    id: "chapter-3",
    chapter: "03",
    themeClass: "theme-emerald",
    themeColor: "#059669",
    company: "QSentia",
    role: "Software Development Intern",
    period: "MAY — JUL 2026",
    tagline: "CHAPTER 03 · SIGNALS & CLARITY",
    headline: "Turning dense algorithmic financial intelligence into split-second visual clarity.",
    story:
      "Working at an AI-driven investment platform meant drinking from a firehose of market signals, predictive models, and institutional expectations. My mission was making complex quantitative models understandable at a glance. I engineered interactive data dashboards and real-time visualization interfaces where precision, render speed, and micro-interactions directly empowered multi-million dollar investment decisions.",
    metrics: [
      { value: "<16ms", label: "Render Frame Target", detail: "Butter-smooth real-time ticks & charts" },
      { value: "100k+", label: "Data Points Handled", detail: "High-frequency streaming market feeds" },
      { value: "94.8%", label: "Signal Confidence", detail: "Instant visual comprehension UX" },
    ],
    breakthrough: "When data is overwhelming, great visual ergonomics is a superpower.",
    quote: "Where mathematics meets instant human comprehension.",
    stack: [
      { name: "TypeScript", color: "#3178c6" },
      { name: "Next.js", color: "#111827" },
      { name: "Data Visualization", color: "#059669" },
      { name: "Financial UI Systems", color: "#6366f1" },
    ],
    artifact: {
      type: "finance",
      title: "qsentia.terminal/telemetry-feed",
      sub: "High-Frequency Algorithmic Analytics Stream",
    },
  },
];

export default function InteractiveJourney() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeChapter = CHAPTERS[activeIdx];

  return (
    <div className="journey-interactive-container">
      {/* Top Header Bar */}
      <div className="journey-header-bar">
        <div className="journey-header-left">
          <span className="section-id">03 / THE CHRONICLES</span>
          <h2 className="story-main-title">
            Not just a résumé.
            <br />
            <em>Real stories.</em>
          </h2>
        </div>
        <div className="journey-header-right">
          <p className="story-intro-desc">
            Code written under real constraints, for real users. Each role was a crucible that shaped how I think, build, and ship.
          </p>
          {/* <div className="story-side-badge">
            <span className="status-live-pulse" />
            <span>3 Production Chapters · Active & Ongoing</span>
          </div> */}
        </div>
      </div>

      {/* Modern Interactive Chapter Stepper */}
      <div className="journey-stepper-bar" role="tablist" aria-label="Experience chapters">
        {CHAPTERS.map((ch, idx) => {
          const isSelected = idx === activeIdx;
          return (
            <button
              key={ch.id}
              role="tab"
              aria-selected={isSelected}
              className={`stepper-node-btn ${ch.themeClass} ${isSelected ? "is-active" : ""}`}
              onClick={() => setActiveIdx(idx)}
            >
              <div className="stepper-node-indicator">
                <span className="stepper-num">{ch.chapter}</span>
                <span className="stepper-pulse" />
              </div>
              <div className="stepper-meta">
                <span className="stepper-company">{ch.company}</span>
                <span className="stepper-role">{ch.role.split("·")[0]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Featured Chapter Stage */}
      <div className={`journey-featured-stage ${activeChapter.themeClass}`} key={activeChapter.id}>
        <div className="stage-top-meta">
          <div className="stage-eyebrows">
            <span className="stage-tagline">{activeChapter.tagline}</span>
            <span className="stage-separator">•</span>
            <span className="stage-period">{activeChapter.period}</span>
          </div>
          <span className="stage-status-pill">
            <span className="pulse-dot" />
            {activeIdx === 0 ? "LIVE ECOSYSTEM" : "COMPLETED CHAPTER"}
          </span>
        </div>

        {/* Main Stage Body */}
        <div className="stage-body">
          <div className="stage-title-group">
            <h3 className="stage-company-title">{activeChapter.company}</h3>
            <span className="stage-role-badge">{activeChapter.role}</span>
          </div>

          <h4 className="stage-headline">{activeChapter.headline}</h4>
          <p className="stage-story">{activeChapter.story}</p>

          {/* Systems & Tools */}
          <div className="stage-tools-section">
            <span className="tools-title">CORE STACK</span>
            <div className="stage-tools-list">
              {activeChapter.stack.map((t) => (
                <span key={t.name} className="tool-chip">
                  <span className="tool-bullet" style={{ background: t.color }} />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dual Callout: Takeaway & Core Principle */}
        <div className="stage-dual-callout">
          <div className="callout-left">
            <span className="callout-eyebrow">THE TAKEAWAY</span>
            <p className="callout-breakthrough">{activeChapter.breakthrough}</p>
          </div>
          <div className="callout-right">
            <span className="callout-eyebrow">CORE PRINCIPLE</span>
            <span className="callout-quote">// “{activeChapter.quote}”</span>
          </div>
        </div>
      </div>
    </div>
  );
}
