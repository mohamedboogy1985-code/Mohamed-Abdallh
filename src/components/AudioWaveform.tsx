import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isActive = isListening || isSpeaking || isProcessing;
      const barCount = 36;
      const spacing = width / barCount;
      const barWidth = Math.max(2, spacing - 3);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isActive) {
          const freqMultiplier = isSpeaking ? 0.35 : isListening ? 0.45 : 0.2;
          const sinWave = Math.sin(phase + i * freqMultiplier);
          const cosWave = Math.cos(phase * 1.5 + i * 0.2);
          const amplitude = (Math.abs(sinWave) * 0.6 + Math.abs(cosWave) * 0.4);
          const maxH = height * 0.85;

          barHeight = Math.max(4, amplitude * maxH);
        }

        const x = i * spacing + (spacing - barWidth) / 2;
        const y = (height - barHeight) / 2;

        // Choose color based on state
        if (isSpeaking) {
          ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + (barHeight / height) * 0.6})`; // sky
        } else if (isListening) {
          ctx.fillStyle = `rgba(52, 211, 153, ${0.4 + (barHeight / height) * 0.6})`; // emerald
        } else if (isProcessing) {
          ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + (barHeight / height) * 0.6})`; // purple
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.25)'; // idle slate
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      phase += isActive ? 0.08 : 0.01;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening, isSpeaking, isProcessing]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={32}
      className="rounded-md bg-slate-900/40"
    />
  );
};
