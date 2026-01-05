import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Client } from '../types';
import { Phone, Mic, MicOff, X, Volume2, Loader2, Signal } from 'lucide-react';

interface VoiceDemoModalProps {
  client: Client;
  onClose: () => void;
}

// --- AUDIO UTILS ---

function base64ToBytes(base64: string) {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceDemoModal: React.FC<VoiceDemoModalProps> = ({ client, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const ai = new GoogleGenAI({ apiKey });

  useEffect(() => {
    mountedRef.current = true;
    startSession();
    return () => {
      mountedRef.current = false;
      stopSession();
    };
  }, []);

  const startSession = async () => {
    if (!apiKey) {
      console.error("API Key missing");
      setStatus('error');
      return;
    }

    try {
      // 1. Initialize Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      // 2. Setup Input Stream
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !mountedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i += 100) sum += Math.abs(inputData[i]);
        setVolumeLevel(Math.min(100, (sum / (inputData.length / 100)) * 500));

        // PCM Conversion
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          int16[i] = inputData[i] * 32768;
        }
        const base64Data = bytesToBase64(new Uint8Array(int16.buffer));

        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          });
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      // 3. Connect to Gemini Live
      const config = {
        model: 'gemini-1.5-flash',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the AI Receptionist for ${client.businessName}. Answer professionally.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: client.config.voiceId === 'shimmer' ? 'Fenrir' : 'Puck' } }
          }
        }
      };

      const session = await ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            if (mountedRef.current) setStatus('connected');
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (!mountedRef.current) return;
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const audioBytes = base64ToBytes(audioData);
              const audioBuffer = await decodeAudio(audioBytes, audioContextRef.current);
              playAudio(audioBuffer, audioContextRef.current);
            }
          },
          onclose: () => {
            if (mountedRef.current && status !== 'ended') setStatus('ended');
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            if (mountedRef.current) setStatus('error');
          }
        }
      });

      if (!mountedRef.current) {
        session.close();
        return;
      }
      sessionRef.current = session;

    } catch (error) {
      console.error("Failed to start session:", error);
      if (mountedRef.current) setStatus('error');
    }
  };

  const stopSession = () => {
    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // Disconnect nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    // Close context
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) { console.warn(e); }
      }
      audioContextRef.current = null;
    }
    // Close session
    if (sessionRef.current) {
      try {
        // @ts-ignore
        if (typeof sessionRef.current.close === 'function') sessionRef.current.close();
      } catch (e) { }
      sessionRef.current = null;
    }
    setStatus('ended');
  };

  const handleHangup = () => {
    stopSession();
    onClose();
  };

  const decodeAudio = async (data: Uint8Array, ctx: AudioContext) => {
    const int16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, int16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
      channelData[i] = int16[i] / 32768.0;
    }
    return buffer;
  };

  const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
    if (ctx.state === 'closed') return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden relative h-[600px] flex flex-col">
        <div className="h-6 bg-black w-full flex justify-center items-center">
          <div className="w-20 h-4 bg-black rounded-b-xl absolute top-0 z-20"></div>
          <div className="w-full flex justify-between px-6 text-white text-[10px] font-bold z-10 pt-1">
            <span>9:41</span>
            <div className="flex gap-1"><Signal size={12} /><div className="w-4 h-2.5 bg-white rounded-[2px]"></div></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center pt-16 text-white px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 relative">
            {status === 'connected' && <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></div>}
            <span className="text-3xl font-bold text-white">{client.businessName.charAt(0)}</span>
          </div>
          <h2 className="text-2xl font-bold text-center leading-tight mb-1">{client.businessName}</h2>
          <p className="text-indigo-200 text-sm mb-8">AI Receptionist</p>
          <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 mb-8">
            {status === 'connecting' && <><Loader2 size={14} className="animate-spin text-white" /> <span className="text-xs font-medium">Connecting...</span></>}
            {status === 'connected' && <><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> <span className="text-xs font-medium">Live</span></>}
            {status === 'error' && <><div className="w-2 h-2 bg-red-500 rounded-full"></div> <span className="text-xs font-medium">Failed</span></>}
            {status === 'ended' && <span className="text-xs font-medium">Call Ended</span>}
          </div>
          {status === 'connected' && (
            <div className="h-16 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((n, i) => (
                <div key={i} className="w-1.5 bg-indigo-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, Math.random() * (volumeLevel / 2 + 10) * n)}px`, opacity: 0.8 }}></div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md pb-12 pt-8 px-8 rounded-t-3xl">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <button onClick={() => setIsMuted(!isMuted)} className={`flex flex-col items-center gap-2 ${isMuted ? 'text-white' : 'text-slate-300'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-colors ${isMuted ? 'bg-white text-slate-900' : 'bg-white/10'}`}>{isMuted ? <MicOff /> : <Mic />}</div>
              <span className="text-[10px]">Mute</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-slate-300"><div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl"><Volume2 /></div><span className="text-[10px]">Speaker</span></button>
            <button className="flex flex-col items-center gap-2 text-slate-300 opacity-50"><div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl"><Phone /></div><span className="text-[10px]">Keypad</span></button>
          </div>
          <div className="flex justify-center">
            <button onClick={handleHangup} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-transform hover:scale-105 active:scale-95">
              <Phone size={28} className="rotate-[135deg]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceDemoModal;