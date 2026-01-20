import React, { useState } from 'react';
import {
    MessageCircle,
    Zap,
    ShieldCheck,
    CheckCircle2,
    Send,
    Bot,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpPage = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hey there! 👋 Welcome to your Support Hub! I'm Kreddy, your friendly AI business assistant. How can I help you improve your business today? You can ask me about recording sales, your trust score, or anything else about Kredibly! 🚀"
        }
    ]);

    const quickQuestions = [
        {
            text: "How do I register a sale?",
            icon: MessageCircle,
            answer: "It's easy! Just open our WhatsApp chat and type your sale naturally. For example: 'Sold 2 shoes to Tobi for 50k'. I'll handle the rest! 📝"
        },
        {
            text: "What is my Trust Score?",
            icon: ShieldCheck,
            answer: "Your Verifiable Trust Score is your business reputation. It grows every time a customer confirms a receipt you sent them! 🌟"
        },
        {
            text: "How to share invoices?",
            icon: Zap,
            answer: "After recording a sale, I automatically generate a link for you. Look for the 'Share' button in your sales list or just forward my WhatsApp reply! 📤"
        },
        {
            text: "Can I manage debts?",
            icon: CheckCircle2,
            answer: "Absolutely! I track who owes you money. You can enable 'Proactive Reminders' in settings so I can nudge you when payment is due. 💸"
        }
    ];

    const handleQuestionClick = (q) => {
        const newMessages = [
            ...messages,
            { id: Date.now(), type: 'user', text: q.text },
            { id: Date.now() + 1, type: 'bot', text: q.answer }
        ];
        setMessages(newMessages);
    };

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Header Content */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    Kreddy Support Hub
                </h1>
                <p style={{ color: '#64748B', fontWeight: 500 }}>
                    Get instant answers and manage your business with AI.
                </p>
            </div>

            {/* Chat Interface Card */}
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '500px',
                height: '700px',
                background: 'white',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: '1px solid #E2E8F0'
            }}>
                {/* Chat Header */}
                    <div style={{
                        background: 'var(--primary)',
                        padding: '24px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <Bot color="var(--primary)" size={28} />
                            </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Kreddy 🌿</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', opacity: 0.9 }}>
                                <span style={{ width: '8px', height: '8px', background: '#86EFAC', borderRadius: '50%', boxShadow: '0 0 8px #86EFAC' }}></span>
                                Online • Ready to help
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Body */}
                <div style={{
                    flex: 1,
                    padding: '24px',
                    overflowY: 'auto',
                    background: '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}
                        >
                            {msg.type === 'bot' && (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'center' }}>
                                    <Bot size={14} color="var(--primary)" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Kreddy</span>
                                </div>
                            )}
                            <div style={{
                                padding: '16px',
                                borderRadius: msg.type === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                                background: msg.type === 'user' ? 'var(--primary)' : 'white',
                                color: msg.type === 'user' ? 'white' : '#1E293B',
                                boxShadow: msg.type === 'bot' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
                                fontSize: '0.95rem',
                                lineHeight: 1.5,
                                border: msg.type === 'bot' ? '1px solid #E2E8F0' : 'none'
                            }}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}

                    {/* Quick Questions Chips */}
                    <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8', marginBottom: '12px' }}>
                            Quick questions:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {quickQuestions.map((q, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleQuestionClick(q)}
                                    style={{
                                        background: 'white',
                                        border: '1px solid #E2E8F0',
                                        padding: '10px 16px',
                                        borderRadius: '100px',
                                        color: 'var(--primary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    {q.icon && <q.icon size={14} />}
                                    {q.text}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '12px'
                    }}>
                        <input
                            type="text"
                            placeholder="Ask Kreddy anything..."
                            style={{
                                flex: 1,
                                padding: '14px',
                                borderRadius: '14px',
                                border: '1.5px solid #E2E8F0',
                                outline: 'none',
                                fontSize: '0.95rem',
                                background: '#F8FAFC'
                            }}
                        />
                        <button
                            className="btn-primary"
                            style={{
                                background: 'var(--primary)',
                                boxShadow: '0 4px 15px rgba(76, 29, 149, 0.3)',
                                width: '48px',
                                height: '48px',
                                padding: 0,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.6 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Powered by Kredibly AI</span>
                        <Sparkles size={12} color="var(--primary)" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
