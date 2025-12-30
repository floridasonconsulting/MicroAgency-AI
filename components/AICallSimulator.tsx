import React, { useState, useRef, useEffect } from 'react';
import {
    Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
    MessageCircle, Send, Clock, CheckCircle, AlertCircle,
    X, User, Bot, AlertTriangle
} from 'lucide-react';
import {
    handleIncomingCall,
    processCallerSpeech,
    getCallSession,
    endCallSession,
    ClientContext,
    TranscriptEntry
} from '../services/aiReceptionistService';

// ============================================================================
// TYPES
// ============================================================================

interface AICallSimulatorProps {
    clientContext: ClientContext;
    onClose: () => void;
    onLeadCaptured?: (lead: { name: string; phone: string; notes: string }) => void;
}

interface SimulatedTranscriptEntry extends TranscriptEntry {
    isTyping?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const AICallSimulator: React.FC<AICallSimulatorProps> = ({
    clientContext,
    onClose,
    onLeadCaptured
}) => {
    const [callState, setCallState] = useState<'idle' | 'ringing' | 'active' | 'ended'>('idle');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<SimulatedTranscriptEntry[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number | null>(null);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // Call timer
    useEffect(() => {
        if (callState === 'active') {
            timerRef.current = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [callState]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startCall = async () => {
        setCallState('ringing');
        setError(null);

        // Simulate ring delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const { sessionId: newSessionId, greeting } = await handleIncomingCall(
                'simulator',
                '+1 (555) 123-4567',
                clientContext
            );

            setSessionId(newSessionId);
            setCallState('active');
            setCallDuration(0);

            // Add greeting to transcript with typing effect
            setTranscript([{
                role: 'ai',
                content: greeting,
                timestamp: new Date().toISOString(),
            }]);

            // Focus input
            setTimeout(() => inputRef.current?.focus(), 100);

        } catch (err) {
            setError('Failed to start call. Please try again.');
            setCallState('idle');
        }
    };

    const endCall = () => {
        if (sessionId) {
            endCallSession(sessionId, 'information');
        }

        setCallState('ended');

        // Extract any lead info from transcript
        const session = sessionId ? getCallSession(sessionId) : null;
        if (session && onLeadCaptured) {
            // Try to extract lead info from conversation
            const fullTranscript = session.transcript.map(t => t.content).join('\n');
            if (session.leadCaptured) {
                onLeadCaptured({
                    name: session.callerName || 'Unknown',
                    phone: session.callerPhone,
                    notes: fullTranscript.slice(0, 500),
                });
            }
        }
    };

    const sendMessage = async () => {
        if (!userInput.trim() || !sessionId || isProcessing) return;

        const messageText = userInput.trim();
        setUserInput('');
        setIsProcessing(true);

        // Add user message to transcript
        setTranscript(prev => [...prev, {
            role: 'caller',
            content: messageText,
            timestamp: new Date().toISOString(),
        }]);

        // Add typing indicator
        setTranscript(prev => [...prev, {
            role: 'ai',
            content: '...',
            timestamp: new Date().toISOString(),
            isTyping: true,
        }]);

        try {
            const { response, shouldEnd } = await processCallerSpeech(
                sessionId,
                messageText,
                clientContext
            );

            // Remove typing indicator and add response
            setTranscript(prev => {
                const withoutTyping = prev.filter(t => !t.isTyping);
                return [...withoutTyping, {
                    role: 'ai',
                    content: response,
                    timestamp: new Date().toISOString(),
                }];
            });

            if (shouldEnd) {
                setTimeout(() => endCall(), 2000);
            }

        } catch (err) {
            // Remove typing indicator
            setTranscript(prev => prev.filter(t => !t.isTyping));
            setError('Failed to get AI response. Please try again.');
        } finally {
            setIsProcessing(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Phone className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{clientContext.businessName}</h3>
                                <p className="text-white/70 text-sm">AI Receptionist</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white p-2"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {callState === 'active' && (
                        <div className="flex items-center justify-center gap-2 text-white/90">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
                        </div>
                    )}
                </div>

                {/* Call States */}
                {callState === 'idle' && (
                    <div className="p-8 text-center">
                        <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Phone className="text-indigo-400" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Test AI Receptionist</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Simulate a phone call to test how the AI handles inquiries
                        </p>
                        <button
                            onClick={startCall}
                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto transition-colors"
                        >
                            <Phone size={20} /> Start Call
                        </button>
                    </div>
                )}

                {callState === 'ringing' && (
                    <div className="p-8 text-center">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Phone className="text-green-400" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Calling...</h3>
                        <p className="text-slate-400 text-sm">Connecting to AI receptionist</p>
                    </div>
                )}

                {callState === 'active' && (
                    <>
                        {/* Transcript */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
                            {transcript.map((entry, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${entry.role === 'caller' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex items-start gap-2 max-w-[85%] ${entry.role === 'caller' ? 'flex-row-reverse' : ''
                                        }`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${entry.role === 'caller' ? 'bg-indigo-600' : 'bg-purple-600'
                                            }`}>
                                            {entry.role === 'caller' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                                        </div>
                                        <div className={`rounded-2xl px-4 py-2 ${entry.role === 'caller'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-slate-700 text-white rounded-tl-none'
                                            } ${entry.isTyping ? 'animate-pulse' : ''}`}>
                                            <p className="text-sm">{entry.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-800 border-t border-slate-700">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Speak or type your message..."
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-4 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={isProcessing}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!userInput.trim() || isProcessing}
                                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>

                            {/* Call Controls */}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-white hover:bg-slate-600'
                                        }`}
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>

                                <button
                                    onClick={endCall}
                                    className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <PhoneOff size={24} />
                                </button>

                                <button
                                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${!isSpeakerOn ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-white hover:bg-slate-600'
                                        }`}
                                >
                                    {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {callState === 'ended' && (
                    <div className="p-8 text-center">
                        <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-400" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Call Ended</h3>
                        <p className="text-slate-400 text-sm mb-2">Duration: {formatDuration(callDuration)}</p>
                        <p className="text-slate-500 text-xs mb-6">{transcript.length} messages exchanged</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setCallState('idle');
                                    setTranscript([]);
                                    setSessionId(null);
                                    setCallDuration(0);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                New Call
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-500/20 border-t border-red-500/30">
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICallSimulator;
