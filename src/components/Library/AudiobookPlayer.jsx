import React, { useEffect, useRef } from 'react';
import { Headphones, Play, Pause, X } from 'lucide-react';
import * as s from './AudiobookPlayer.css.ts';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

const POINTS = 64;

const useAudioVisualizer = (analyserRef, canvasRef, isPlaying) => {
  const rafRef = useRef(null);
  const smoothRef = useRef(new Float32Array(POINTS).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const smooth = smoothRef.current;
    const lerp = 0.12;

    const drawWave = (c, w, h, points, yBase, amplitude, alpha, lineW) => {
      c.beginPath();
      c.moveTo(0, yBase);
      for (let i = 0; i <= POINTS; i++) {
        const x = (i / POINTS) * w;
        const v = i < POINTS ? points[i] : points[POINTS - 1];
        const y = yBase - v * amplitude;
        if (i === 0) {
          c.lineTo(x, y);
        } else {
          const prevX = ((i - 1) / POINTS) * w;
          const prevV = (i - 1) >= 0 ? points[Math.max(0, i - 1)] : v;
          const prevY = yBase - prevV * amplitude;
          const cpx = (prevX + x) / 2;
          c.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      c.lineTo(w, yBase + 10);
      c.lineTo(0, yBase + 10);
      c.closePath();
      const grad = c.createLinearGradient(0, yBase - amplitude, 0, yBase);
      grad.addColorStop(0, `rgba(200,30,30,${alpha})`);
      grad.addColorStop(0.6, `rgba(200,30,30,${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(200,30,30,0)`);
      c.fillStyle = grad;
      c.fill();
      c.strokeStyle = `rgba(200,30,30,${Math.min(1, alpha * 2.2)})`;
      c.lineWidth = lineW;
      c.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const x = (i / POINTS) * w;
        const v = i < POINTS ? points[i] : points[POINTS - 1];
        const y = yBase - v * amplitude;
        if (i === 0) {
          c.moveTo(x, y);
        } else {
          const prevX = ((i - 1) / POINTS) * w;
          const prevV = points[Math.max(0, i - 1)];
          const prevY = yBase - prevV * amplitude;
          const cpx = (prevX + x) / 2;
          c.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      c.stroke();
    };

    const draw = () => {
      const c = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      c.clearRect(0, 0, w, h);

      const analyser = analyserRef.current;
      const now = Date.now() / 1000;

      if (!analyser) {
        for (let i = 0; i < POINTS; i++) {
          const target = 0.08 + 0.05 * Math.sin(now * 0.8 + i * 0.18)
                       + 0.03 * Math.sin(now * 1.3 + i * 0.3);
          smooth[i] += (target - smooth[i]) * 0.06;
        }
      } else {
        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < POINTS; i++) {
          const idx = Math.floor(Math.pow(i / POINTS, 1.4) * (bufLen * 0.75));
          const raw = data[idx] / 255;
          const drift = 0.02 * Math.sin(now * 0.6 + i * 0.2);
          const target = raw * 0.85 + drift + 0.03;
          smooth[i] += (target - smooth[i]) * lerp;
        }
      }

      const yBase = h * 0.88;
      drawWave(c, w, h, smooth, yBase, h * 0.72, 0.18, 1);
      const offset = new Float32Array(POINTS);
      for (let i = 0; i < POINTS; i++) {
        offset[i] = smooth[i] * 0.6 + 0.02 * Math.sin(now * 1.1 + i * 0.25);
      }
      drawWave(c, w, h, offset, yBase + 2, h * 0.55, 0.10, 0.7);
      const gentle = new Float32Array(POINTS);
      for (let i = 0; i < POINTS; i++) {
        gentle[i] = smooth[i] * 0.3 + 0.04 * Math.sin(now * 0.5 + i * 0.15);
      }
      drawWave(c, w, h, gentle, yBase + 4, h * 0.38, 0.06, 0.5);

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, isPlaying, analyserRef]);
};

const AudiobookPlayer = ({ book, onClose }) => {
  const { isPlaying, togglePlay, seekTo, analyserRef, initAudio } = useAudioPlayer();
  const canvasRef = useRef(null);

  // Attempt to initialize audio context (useful if they haven't interacted yet, though usually started by playAudiobook)
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  useAudioVisualizer(analyserRef, canvasRef, isPlaying);

  if (!book) return null;

  return (
    <div className={s.player}>
      <div className={s.playerTop}>
        <div className={s.playerCoverWrap}>
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className={s.playerCover} />
          ) : (
            <div className={s.playerCoverFallback}>
              <Headphones size={36} />
            </div>
          )}
          {isPlaying && <div className={s.playerCoverGlow} />}
        </div>
        <div className={s.playerInfo}>
          <div className={s.playerNowPlaying}>
            <div className={s.nowPlayingDot} />
            <span className={s.nowPlayingLabel}>
              {isPlaying ? 'Now playing' : 'Paused'}
            </span>
          </div>
          <h2 className={s.playerTitle}>{book.title}</h2>
          <p className={s.playerAuthor}>{book.author || 'Unknown author'}</p>
        </div>
        
        <button 
            type="button" 
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-95 ml-auto mr-6"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <button type="button" className={s.playerClose} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={s.visualizerWrap}>
        <canvas
          ref={canvasRef}
          width={960}
          height={120}
          className={s.visualizerCanvas}
        />
        <div className={s.visualizerFade} />
      </div>

      {book.chapters && book.chapters.length > 0 && (
        <div className={s.chapters}>
          <p className={s.chaptersLabel}>Chapters</p>
          <div className={s.chaptersList}>
            {book.chapters.map((ch, idx) => (
              <button
                key={idx}
                type="button"
                className={s.chapterBtn}
                onClick={() => seekTo(ch.start_seconds || 0)}
              >
                <div className={s.chapterIndex}>{idx + 1}</div>
                <span>{ch.title}</span>
                <Play size={12} className={s.chapterPlay} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudiobookPlayer;
