import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Shield, Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import * as s from './PendingAccessPage.css.ts';

const PendingAccessPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmitCode = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim() || !user) return;

        setLoading(true);
        setError('');

        try {
            const { data, error: rpcError } = await supabase.rpc('use_invite_code', {
                p_code: inviteCode.toUpperCase(),
                p_user_id: user.id
            });

            if (rpcError) {
                setError('Something went wrong. Please try again.');
            } else if (data && data.success) {
                setSuccess(true);
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setError(data?.error || 'Invalid or already used invite code.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className={s.page}>
            <div className={s.inner}>
                <div className={s.iconWrap}>
                    <Shield size={48} />
                </div>
                <h1 className={s.title}>Invite-Only Access</h1>
                <div className={s.rule} />

                <p className={s.subtitle}>
                    This section is currently available only to invited members.
                    You can still browse the <span className={s.highlight}>Home</span>, <span className={s.highlight}>Digital Library</span>, and <span className={s.highlight}>MarxBot preview</span> pages.
                </p>

                <div className={s.card}>
                    <h2 className={s.cardTitle}>
                        <Sparkles size={20} className={s.cardTitleIcon} />
                        Have an invite code?
                    </h2>

                    {!user ? (
                        <div className={s.loginPrompt}>
                            <p>Log in or register to redeem an invite code.</p>
                            <Link href="/login" className={s.loginLink}>Go to login</Link>
                        </div>
                    ) : success ? (
                        <div className={s.successMsg}>
                            <CheckCircle size={20} />
                            <span>Access granted! Redirecting...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitCode} className={s.form}>
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                className={s.input}
                                placeholder="XXXX-XXXX"
                            />
                            {error && (
                                <div className={s.errorMsg}>
                                    <AlertTriangle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading || !inviteCode.trim()}
                                className={s.submitBtn}
                            >
                                {loading && <Loader2 size={18} />}
                                {loading ? 'Verifying...' : 'Redeem Invite Code'}
                            </button>
                        </form>
                    )}
                </div>

                <button onClick={() => router.push('/home')} className={s.backBtn}>
                    <ArrowLeft size={16} />
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default PendingAccessPage;
