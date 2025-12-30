/**
 * Authentication Service
 * Handles subscriber login via Supabase Auth (email/password + magic link)
 */

import { getSupabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
    id: string;
    email: string;
    clientId?: string; // Linked client record
}

export interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
}

export interface SignUpResult {
    success: boolean;
    user?: AuthUser;
    needsEmailConfirmation?: boolean;
    error?: string;
}

export interface SignInResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(
    email: string,
    password: string,
    additionalData?: { businessName?: string; phone?: string }
): Promise<SignUpResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: additionalData,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (data.user) {
            // Check if email confirmation is required
            if (!data.session) {
                return {
                    success: true,
                    needsEmailConfirmation: true,
                };
            }

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email || email,
                },
            };
        }

        return { success: false, error: 'Unknown error during sign up' };
    } catch (err) {
        console.error('[Auth] Sign up error:', err);
        return { success: false, error: 'Sign up failed' };
    }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(
    email: string,
    password: string
): Promise<SignInResult> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (data.user) {
            // Get linked client ID
            const clientId = await getLinkedClientId(data.user.id);

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email || email,
                    clientId,
                },
            };
        }

        return { success: false, error: 'Sign in failed' };
    } catch (err) {
        console.error('[Auth] Sign in error:', err);
        return { success: false, error: 'Sign in failed' };
    }
}

/**
 * Send magic link for passwordless login
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/portal`,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('[Auth] Magic link error:', err);
        return { success: false, error: 'Failed to send magic link' };
    }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error('[Auth] Sign out error:', err);
        return { success: false, error: 'Sign out failed' };
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const clientId = await getLinkedClientId(user.id);

        return {
            id: user.id,
            email: user.email || '',
            clientId,
        };
    } catch (err) {
        console.error('[Auth] Get current user error:', err);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    } catch {
        return false;
    }
}

/**
 * Get linked client ID for auth user
 */
async function getLinkedClientId(authUserId: string): Promise<string | undefined> {
    const supabase = getSupabase();
    if (!supabase) return undefined;

    try {
        // First check if client has auth_user_id column and is linked
        const { data } = await supabase
            .from('clients')
            .select('id')
            .eq('auth_user_id', authUserId)
            .single();

        return data?.id;
    } catch {
        // Column may not exist yet, or no linked client
        return undefined;
    }
}

/**
 * Link auth user to client record
 */
export async function linkUserToClient(authUserId: string, clientId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('clients')
            .update({ auth_user_id: authUserId })
            .eq('id', clientId);

        if (error) {
            console.error('[Auth] Link user to client error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[Auth] Link user to client error:', err);
        return false;
    }
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('[Auth] Reset password error:', err);
        return { success: false, error: 'Failed to send reset email' };
    }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('[Auth] Update password error:', err);
        return { success: false, error: 'Failed to update password' };
    }
}

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
    callback: (user: AuthUser | null) => void
): { unsubscribe: () => void } {
    const supabase = getSupabase();
    if (!supabase) {
        return { unsubscribe: () => { } };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State changed:', event);

        if (session?.user) {
            const clientId = await getLinkedClientId(session.user.id);
            callback({
                id: session.user.id,
                email: session.user.email || '',
                clientId,
            });
        } else {
            callback(null);
        }
    });

    return { unsubscribe: () => subscription.unsubscribe() };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    signUpWithPassword,
    signInWithPassword,
    sendMagicLink,
    signOut,
    getCurrentUser,
    isAuthenticated,
    linkUserToClient,
    resetPassword,
    updatePassword,
    onAuthStateChange,
};
