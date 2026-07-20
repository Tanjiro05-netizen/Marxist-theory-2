import React, { useEffect, useState, useMemo } from 'react';
import {
    Mail,
    Search,
    Send,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Users,
    Clock,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const WaitlistAdminPage = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Broadcast state
    const [subject, setSubject] = useState('');
    const [htmlBody, setHtmlBody] = useState('');
    const [sending, setSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState(null);

    const fetchSubscribers = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error: fetchError } = await supabase
                .from('waitlist')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setSubscribers(data || []);
        } catch (err) {
            console.error('Failed to fetch waitlist:', err);
            setError(err.message || 'Failed to fetch waitlist subscribers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const filteredSubscribers = useMemo(() => {
        if (!searchQuery.trim()) return subscribers;
        const q = searchQuery.trim().toLowerCase();
        return subscribers.filter((s) => s.email.toLowerCase().includes(q));
    }, [subscribers, searchQuery]);

    const recentCount = useMemo(() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return subscribers.filter((s) => new Date(s.created_at) > weekAgo).length;
    }, [subscribers]);

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this subscriber from the waitlist?')) return;
        setDeletingId(id);
        setError('');
        try {
            const { error: delError } = await supabase
                .from('waitlist')
                .delete()
                .eq('id', id);
            if (delError) throw delError;
            setSubscribers((prev) => prev.filter((s) => s.id !== id));
            setSuccess('Subscriber removed.');
        } catch (err) {
            setError(err.message || 'Failed to remove subscriber.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleBroadcast = async () => {
        if (!subject.trim() || !htmlBody.trim()) {
            setError('Subject and email body are required.');
            return;
        }
        setSending(true);
        setError('');
        setSuccess('');

        try {
            const { data, error: fnError } = await supabase.functions.invoke('waitlist-broadcast', {
                body: {
                    subject: subject.trim(),
                    html_body: htmlBody.trim(),
                },
            });

            if (fnError) {
                throw new Error(fnError.message || 'Failed to send broadcast.');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            const errNote = data?.errors?.length ? ` (${data.errors.length} batch errors)` : '';
            setSuccess(`Broadcast sent to ${data?.total_sent || 0} of ${data?.total_subscribers || 0} subscribers${errNote}.`);
            setSubject('');
            setHtmlBody('');
            setShowPreview(false);
        } catch (err) {
            setError(err.message || 'Failed to send broadcast.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#12131A] text-white px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold inline-flex items-center gap-2">
                        <Mail size={24} /> Waitlist Management
                    </h1>
                    <p className="text-gray-400 mt-1">View subscribers, manage the waitlist, and send broadcast emails.</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-4 bg-green-900/30 border border-green-700 rounded-xl px-4 py-3 flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-green-300">{success}</p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#181A23] border border-gray-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide mb-2">
                            <Users size={14} /> Total Subscribers
                        </div>
                        <p className="text-2xl font-bold text-white">{subscribers.length}</p>
                    </div>
                    <div className="bg-[#181A23] border border-gray-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide mb-2">
                            <Clock size={14} /> Last 7 Days
                        </div>
                        <p className="text-2xl font-bold text-white">{recentCount}</p>
                    </div>
                    <div className="bg-[#181A23] border border-gray-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide mb-2">
                            <Mail size={14} /> Notify Preferences
                        </div>
                        <p className="text-sm text-gray-300">
                            {subscribers.filter((s) => s.notify_invite_codes).length} invite codes
                            {' · '}
                            {subscribers.filter((s) => s.notify_public_beta).length} public beta
                        </p>
                    </div>
                </div>

                {/* Broadcast Composer */}
                <section className="mb-6 bg-[#181A23] border border-gray-800 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300 mb-4 flex items-center gap-2">
                        <Send size={16} /> Broadcast Email
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Marxist.info — Invite Codes Now Available"
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
                                Email Body (HTML supported)
                            </label>
                            <textarea
                                value={htmlBody}
                                onChange={(e) => setHtmlBody(e.target.value)}
                                rows={10}
                                placeholder={`<h2>Great news, comrade!</h2>\n<p>Invite codes are now available...</p>\n<p><a href="https://marxist.info/login">Claim your spot →</a></p>`}
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 resize-y"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                disabled={!htmlBody.trim()}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {showPreview ? 'Hide Preview' : 'Preview'}
                            </button>

                            <button
                                type="button"
                                onClick={handleBroadcast}
                                disabled={sending || !subject.trim() || !htmlBody.trim() || subscribers.length === 0}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Sending to {subscribers.length} subscribers...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} />
                                        Send to {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>

                        {showPreview && htmlBody.trim() && (
                            <div className="mt-4 bg-[#0a0a0f] border border-gray-700 rounded-xl overflow-hidden">
                                <div className="px-4 py-2 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wide">
                                    Email Preview
                                </div>
                                <div
                                    className="p-6 text-gray-300 text-sm leading-relaxed"
                                    style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                                    dangerouslySetInnerHTML={{ __html: htmlBody }}
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Subscriber Table */}
                <section className="bg-[#181A23] border border-gray-800 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300 flex items-center gap-2">
                            <Users size={16} /> Subscribers ({filteredSubscribers.length})
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search emails..."
                                    className="bg-[#0F1118] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white w-64 placeholder:text-gray-600"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={fetchSubscribers}
                                disabled={loading}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                            <Loader2 size={16} className="animate-spin" />
                            Loading subscribers...
                        </div>
                    ) : filteredSubscribers.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            {searchQuery ? 'No subscribers match your search.' : 'No waitlist subscribers yet.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700 text-left text-xs text-gray-400 uppercase tracking-wide">
                                        <th className="pb-2 pr-4">Email</th>
                                        <th className="pb-2 pr-4">Joined</th>
                                        <th className="pb-2 pr-4">Invite Codes</th>
                                        <th className="pb-2 pr-4">Public Beta</th>
                                        <th className="pb-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubscribers.map((sub) => (
                                        <tr key={sub.id} className="border-b border-gray-800/50 hover:bg-[#0F1118] transition-colors">
                                            <td className="py-3 pr-4">
                                                <span className="text-white font-mono text-xs">{sub.email}</span>
                                            </td>
                                            <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">
                                                {formatDate(sub.created_at)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${sub.notify_invite_codes ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                                    {sub.notify_invite_codes ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${sub.notify_public_beta ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                                    {sub.notify_public_beta ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(sub.id)}
                                                    disabled={deletingId === sub.id}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                                                    title="Remove from waitlist"
                                                >
                                                    {deletingId === sub.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default WaitlistAdminPage;
