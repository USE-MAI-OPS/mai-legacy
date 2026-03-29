"use client";

import React, { useRef, useState } from "react";
import { Play, X } from "lucide-react";

/**
 * DemoVideoSection — 60-second product demo embed for the landing page.
 *
 * To activate:
 *   1. Drop `product-demo.mp4` into `public/demo/`
 *   2. Drop `product-demo-thumb.jpg` into `public/demo/`
 *   3. Set DEMO_VIDEO_ENABLED = true below
 *
 * The component renders null when disabled so it has zero impact while the
 * video is pending production.
 */

const DEMO_VIDEO_ENABLED = false;
const VIDEO_SRC = "/demo/product-demo.mp4";
const THUMB_SRC = "/demo/product-demo-thumb.jpg";

export function DemoVideoSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  if (!DEMO_VIDEO_ENABLED) return null;

  function openModal() {
    setModalOpen(true);
    // Play with audio in modal
    setTimeout(() => {
      if (modalVideoRef.current) {
        modalVideoRef.current.play();
      }
    }, 50);
  }

  function closeModal() {
    setModalOpen(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
      modalVideoRef.current.currentTime = 0;
    }
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Inline preview — autoplay, muted, looping (GIF-style)              */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary/70 mb-2">
            See it in action
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            60 seconds. That&apos;s all it takes.
          </h2>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer group border border-border/30"
          onClick={openModal}
          role="button"
          aria-label="Play product demo video"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openModal()}
        >
          {/* Muted autoplay loop for ambient preview */}
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={THUMB_SRC}
            autoPlay
            muted
            loop
            playsInline
            className="w-full aspect-video object-cover"
          />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 shadow-xl group-hover:scale-110 transition-transform duration-200">
              <Play className="w-7 h-7 text-primary fill-primary ml-1" />
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md">
            1:00
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Fullscreen modal — with audio                                       */}
      {/* ------------------------------------------------------------------ */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              ref={modalVideoRef}
              src={VIDEO_SRC}
              controls
              className="w-full rounded-xl shadow-2xl aspect-video bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
