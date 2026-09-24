import React, { useState } from 'react';
import { Monitor, Smartphone, Maximize2, X } from 'lucide-react';

interface ScreenshotViewerProps {
  desktopScreenshot?: string;
  mobileScreenshot?: string;
  url: string;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
  desktopScreenshot,
  mobileScreenshot,
  url,
}) => {
  const [modalImg, setModalImg] = useState<{ src: string; title: string } | null>(null);

  if (!desktopScreenshot && !mobileScreenshot) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
        No visual viewport screenshots available for this website.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Viewport Visual Inspection</span>
          </h3>
          <p className="text-xs text-slate-400">Desktop (1440x900) vs Mobile (390x844 iPhone Viewport)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Desktop Viewport (2 Cols) */}
        {desktopScreenshot && (
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Desktop Viewport (1440 × 900)</span>
              </span>
              <button
                onClick={() => setModalImg({ src: desktopScreenshot, title: 'Desktop Viewport (1440x900)' })}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Zoom</span>
              </button>
            </div>

            <div
              onClick={() => setModalImg({ src: desktopScreenshot, title: 'Desktop Viewport (1440x900)' })}
              className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer shadow-lg hover:border-cyan-500/50 transition-all"
            >
              <img
                src={desktopScreenshot}
                alt="Desktop Screenshot"
                className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-bold shadow-md">
                  Click to Expand
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Viewport (1 Col) */}
        {mobileScreenshot && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Mobile Viewport (390 × 844)</span>
              </span>
              <button
                onClick={() => setModalImg({ src: mobileScreenshot, title: 'Mobile Viewport (390x844)' })}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:underline"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Zoom</span>
              </button>
            </div>

            <div
              onClick={() => setModalImg({ src: mobileScreenshot, title: 'Mobile Viewport (390x844)' })}
              className="group relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 cursor-pointer shadow-xl max-w-[260px] mx-auto hover:border-indigo-500/50 transition-all"
            >
              <img
                src={mobileScreenshot}
                alt="Mobile Screenshot"
                className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-bold shadow-md">
                  Expand
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {modalImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalImg(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white">{modalImg.title}</span>
              <button
                onClick={() => setModalImg(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] p-2">
              <img src={modalImg.src} alt="Enlarged screenshot" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
