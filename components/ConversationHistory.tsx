import React from 'react';
import { MessageCircle, Mail, Phone, Bot, User, Clock } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
    id: string;
    direction: 'inbound' | 'outbound';
    channel: 'email' | 'sms' | 'voice';
    content: string;
    aiGenerated: boolean;
    createdAt: string;
}

interface ConversationHistoryProps {
    prospectId: string;
    prospectName: string;
    messages: Message[];
    onClose: () => void;
    onSendReply?: (message: string, channel: 'email' | 'sms') => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
    prospectName,
    messages,
    onClose,
    onSendReply
}) => {
    const [replyText, setReplyText] = React.useState('');
    const [replyChannel, setReplyChannel] = React.useState<'email' | 'sms'>('sms');
    const [isSending, setIsSending] = React.useState(false);

    const handleSend = async () => {
        if (!replyText.trim() || !onSendReply) return;
        setIsSending(true);
        try {
            await onSendReply(replyText, replyChannel);
            setReplyText('');
        } finally {
            setIsSending(false);
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail size={14} />;
            case 'sms': return <MessageCircle size={14} />;
            case 'voice': return <Phone size={14} />;
            default: return <MessageCircle size={14} />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold">Conversation with {prospectName}</h2>
                        <p className="text-sm opacity-90">{messages.length} messages</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                            <p>No messages yet</p>
                            <p className="text-sm">Start the campaign to begin outreach</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 ${msg.direction === 'outbound'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    {/* Message Header */}
                                    <div className={`flex items-center gap-2 text-xs mb-2 ${msg.direction === 'outbound' ? 'text-indigo-200' : 'text-slate-500'
                                        }`}>
                                        <span className="flex items-center gap-1">
                                            {msg.direction === 'outbound'
                                                ? (msg.aiGenerated ? <Bot size={12} /> : <User size={12} />)
                                                : <User size={12} />
                                            }
                                            {msg.direction === 'outbound'
                                                ? (msg.aiGenerated ? 'AI' : 'You')
                                                : prospectName.split(' ')[0]
                                            }
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            {getChannelIcon(msg.channel)}
                                            {msg.channel.toUpperCase()}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    </div>

                                    {/* Message Content */}
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Reply Box */}
                {onSendReply && (
                    <div className="p-4 border-t border-slate-200 bg-white">
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setReplyChannel('sms')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${replyChannel === 'sms'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <MessageCircle size={14} /> SMS
                            </button>
                            <button
                                onClick={() => setReplyChannel('email')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${replyChannel === 'email'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Mail size={14} /> Email
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Type your ${replyChannel.toUpperCase()} reply...`}
                                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!replyText.trim() || isSending}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSending ? '...' : 'Send'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationHistory;
