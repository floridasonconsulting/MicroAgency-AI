
import React, { useState, useRef, useEffect } from 'react';
import { Client } from '../types';
import { X, Send, MessageSquare, Loader2, Signal, Battery, Phone, Video } from 'lucide-react';
import { simulateAutoResponder } from '../services/geminiService';

interface SMSDemoModalProps {
    client: Client;
    onClose: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const SMSDemoModal: React.FC<SMSDemoModalProps> = ({ client, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: `Hi! Thanks for contacting ${client.businessName}. How can we help you today?`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const responseText = await simulateAutoResponder(client, input, []);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting right now. Please try again.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in">
            {/* Close Button Outside */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
                <X size={32} />
            </button>

            {/* Phone Container */}
            <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden relative h-[700px] flex flex-col">
                {/* Status Bar */}
                <div className="h-12 bg-slate-100 flex justify-between items-end px-6 pb-2 text-slate-900 text-[10px] font-bold z-10">
                    <span>9:41</span>
                    <div className="w-24 h-5 bg-black rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2"></div>
                    <div className="flex gap-1.5 items-center">
                        <Signal size={12} />
                        <span className="text-[10px]">5G</span>
                        <Battery size={14} />
                    </div>
                </div>

                {/* Messages Header */}
                <div className="bg-slate-100/90 backdrop-blur-sm p-4 flex items-center gap-3 border-b border-slate-200 z-10 sticky top-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                        {client.businessName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{client.businessName}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            AI Active via Text
                        </p>
                    </div>
                    <div className="flex gap-3 text-indigo-600">
                        <Phone size={20} className="fill-current opacity-20" />
                        <Video size={24} className="opacity-20" />
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4">
                    <div className="text-center text-xs text-slate-400 my-4">Today 9:41 AM</div>

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[15px] leading-snug shadow-sm ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 text-slate-500 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-slate-50 p-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Text Message"
                            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className={`p-1.5 rounded-full transition-all ${input.trim()
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-slate-200 text-slate-400'
                                }`}
                        >
                            <div className="sr-only">Send</div>
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Home Indicator */}
                <div className="bg-slate-50 h-6 w-full flex justify-center items-start pt-2 rounded-b-[2.5rem]">
                    <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default SMSDemoModal;
