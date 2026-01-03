import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { signInWithPassword, signUpWithPassword, sendMagicLink } from '../services/authService';

interface LoginPageProps {
    onLoginSuccess: (clientId: string) => void;
    onNavigateToDemo?: () => void;
}

type AuthMode = 'login' | 'signup' | 'magic-link' | 'magic-link-sent';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToDemo }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handlePasswordAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                if (password.length < 8) {
                    setError('Password must be at least 8 characters');
                    setLoading(false);
                    return;
                }

                const result = await signUpWithPassword(email, password);
                if (result.success) {
                    if (result.needsEmailConfirmation) {
                        setSuccess('Check your email to confirm your account');
                        setMode('login');
                    } else if (result.user?.clientId) {
                        onLoginSuccess(result.user.clientId);
                    }
                } else {
                    setError(result.error || 'Sign up failed');
                }
            } else {
                const result = await signInWithPassword(email, password);
                if (result.success && result.user?.clientId) {
                    onLoginSuccess(result.user.clientId);
                } else if (result.success && !result.user?.clientId) {
                    setError('No business account linked to this email');
                } else {
                    setError(result.error || 'Login failed');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await sendMagicLink(email);
            if (result.success) {
                setMode('magic-link-sent');
            } else {
                setError(result.error || 'Failed to send magic link');
            }
        } catch (err) {
            setError('Failed to send magic link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        <span className="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
                            Recepticom
                        </span>
                    </h1>
                    <p className="text-slate-400">Subscriber Portal</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Tab Switcher */}
                    {mode !== 'magic-link-sent' && (
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => { setMode('login'); setError(null); }}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setMode('signup'); setError(null); }}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    <div className="p-6">
                        {/* Magic Link Sent State */}
                        {mode === 'magic-link-sent' ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h3>
                                <p className="text-slate-600 mb-6">
                                    We sent a magic link to <strong>{email}</strong>
                                </p>
                                <p className="text-sm text-slate-500 mb-4">
                                    Click the link in your email to sign in instantly.
                                </p>
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                >
                                    Use password instead
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={mode === 'magic-link' ? handleMagicLink : handlePasswordAuth}>
                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                                        <CheckCircle size={16} />
                                        {success}
                                    </div>
                                )}

                                {/* Email Field */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@yourbusiness.com"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Fields (not shown for magic link) */}
                                {mode !== 'magic-link' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {mode === 'signup' && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="••••••••"
                                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            {mode === 'signup' ? 'Create Account' : mode === 'magic-link' ? 'Send Magic Link' : 'Sign In'}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                {/* Divider */}
                                {mode !== 'magic-link' && (
                                    <div className="my-6 flex items-center gap-4">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-sm text-slate-400">or</span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>
                                )}

                                {/* Magic Link Option */}
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => setMode('magic-link')}
                                        className="w-full py-3 border-2 border-slate-200 text-slate-700 font-medium rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={18} className="text-indigo-500" />
                                        Sign in with Magic Link
                                    </button>
                                )}

                                {mode === 'magic-link' && (
                                    <button
                                        type="button"
                                        onClick={() => setMode('login')}
                                        className="w-full py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors"
                                    >
                                        Use password instead
                                    </button>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Demo Link */}
                    {onNavigateToDemo && (
                        <div className="px-6 pb-6">
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-slate-600 mb-2">Don't have an account?</p>
                                <button
                                    onClick={onNavigateToDemo}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center justify-center gap-1 mx-auto"
                                >
                                    Try the interactive demo
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    © 2024 Recepticom. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
