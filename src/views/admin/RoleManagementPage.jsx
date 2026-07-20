import React, { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Shield,
    UserCheck,
    Plus,
    X,
    Save,
    Loader2,
    AlertTriangle,
    CheckSquare,
    Square,
    History,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const EDITORIAL_ROLE_OPTIONS = ['News', 'Safety', 'Ideologue', 'Writer', 'Teacher'];
const EXPERTISE_PRESETS = ['Medicine/Doctor', 'Medicine Student', 'Chem Student'];
const BASE_ROLE_OPTIONS = ['user', 'admin'];

const normalizeTagList = (values) => {
    if (!Array.isArray(values)) return [];

    const deduped = new Set();
    values.forEach((value) => {
        const cleaned = `${value || ''}`.trim();
        if (cleaned) deduped.add(cleaned);
    });

    return Array.from(deduped);
};

const toComparableTagList = (values) =>
    normalizeTagList(values)
        .map((value) => value.toLowerCase())
        .sort();

const areTagListsEqual = (left, right) => {
    if (left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
};

const normalizeProfileForCompare = (profile) => ({
    role: `${profile?.role || 'user'}`.toLowerCase(),
    is_certified: profile?.is_certified === true,
    editorial_roles: toComparableTagList(profile?.editorial_roles),
    expertise_roles: toComparableTagList(profile?.expertise_roles),
});

const formatAuditTimestamp = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const summarizeChangedFields = (changedFields) => {
    if (Array.isArray(changedFields)) {
        return changedFields.join(', ');
    }

    if (changedFields && typeof changedFields === 'object') {
        return Object.keys(changedFields).join(', ');
    }

    if (typeof changedFields === 'string') {
        return changedFields;
    }

    return 'role fields';
};

const RoleManagementPage = () => {
    const [profiles, setProfiles] = useState([]);
    const [savedProfilesById, setSavedProfilesById] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [isSavingSelected, setIsSavingSelected] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [draftCustomTags, setDraftCustomTags] = useState({});
    const [selectedProfileIds, setSelectedProfileIds] = useState([]);
    const [bulkBaseRole, setBulkBaseRole] = useState(BASE_ROLE_OPTIONS[0]);
    const [bulkEditorialRole, setBulkEditorialRole] = useState(EDITORIAL_ROLE_OPTIONS[0]);
    const [bulkEditorialAction, setBulkEditorialAction] = useState('add');
    const [bulkExpertiseRole, setBulkExpertiseRole] = useState(EXPERTISE_PRESETS[0]);
    const [bulkExpertiseAction, setBulkExpertiseAction] = useState('add');
    const [bulkCertifiedState, setBulkCertifiedState] = useState('certified');
    const [recentRoleAudit, setRecentRoleAudit] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [auditError, setAuditError] = useState('');

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            setError('');

            try {
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('id, username, role, is_certified, editorial_roles, expertise_roles, updated_at')
                    .order('updated_at', { ascending: false, nullsFirst: false });

                if (fetchError) throw fetchError;

                const normalized = (data || []).map((profile) => ({
                    ...profile,
                    role: profile.role || 'user',
                    editorial_roles: normalizeTagList(profile.editorial_roles),
                    expertise_roles: normalizeTagList(profile.expertise_roles),
                }));

                setProfiles(normalized);
                setSavedProfilesById(
                    Object.fromEntries(
                        normalized.map((profile) => [
                            profile.id,
                            normalizeProfileForCompare(profile),
                        ])
                    )
                );
            } catch (err) {
                console.error('Failed to fetch profiles:', err);
                setError(err.message || 'Failed to fetch member profiles.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    const filteredProfiles = useMemo(() => {
        if (!searchQuery.trim()) return profiles;

        const q = searchQuery.trim().toLowerCase();
        return profiles.filter((profile) => {
            const username = `${profile.username || ''}`.toLowerCase();
            const id = `${profile.id || ''}`.toLowerCase();
            const role = `${profile.role || ''}`.toLowerCase();
            const editorial = (profile.editorial_roles || []).join(' ').toLowerCase();
            const expertise = (profile.expertise_roles || []).join(' ').toLowerCase();

            return (
                username.includes(q) ||
                id.includes(q) ||
                role.includes(q) ||
                editorial.includes(q) ||
                expertise.includes(q)
            );
        });
    }, [profiles, searchQuery]);

    const filteredProfileIds = useMemo(
        () => new Set(filteredProfiles.map((profile) => profile.id)),
        [filteredProfiles]
    );

    const selectedFilteredCount = useMemo(
        () => selectedProfileIds.filter((profileId) => filteredProfileIds.has(profileId)).length,
        [filteredProfileIds, selectedProfileIds]
    );

    const selectedProfileIdSet = useMemo(() => new Set(selectedProfileIds), [selectedProfileIds]);

    const dirtyProfileIds = useMemo(() => {
        const dirty = new Set();

        profiles.forEach((profile) => {
            const saved = savedProfilesById[profile.id];
            if (!saved) return;

            const current = normalizeProfileForCompare(profile);
            const changed =
                current.role !== saved.role ||
                current.is_certified !== saved.is_certified ||
                !areTagListsEqual(current.editorial_roles, saved.editorial_roles) ||
                !areTagListsEqual(current.expertise_roles, saved.expertise_roles);

            if (changed) dirty.add(profile.id);
        });

        return dirty;
    }, [profiles, savedProfilesById]);

    const selectedDirtyProfiles = useMemo(
        () => profiles.filter((profile) => selectedProfileIdSet.has(profile.id) && dirtyProfileIds.has(profile.id)),
        [dirtyProfileIds, profiles, selectedProfileIdSet]
    );

    const selectedProfileCount = selectedProfileIds.length;
    const selectedDirtyCount = selectedDirtyProfiles.length;

    const allFilteredSelected = filteredProfiles.length > 0 && selectedFilteredCount === filteredProfiles.length;

    const countAdminsWithOverrides = (roleOverrides = {}) => {
        return profiles.reduce((count, candidate) => {
            const candidateRole = `${roleOverrides[candidate.id] ?? candidate.role ?? 'user'}`.toLowerCase();
            return count + (candidateRole === 'admin' ? 1 : 0);
        }, 0);
    };

    useEffect(() => {
        setSelectedProfileIds((prev) => prev.filter((profileId) => profiles.some((profile) => profile.id === profileId)));
    }, [profiles]);

    const refreshRoleAudit = async () => {
        setLoadingAudit(true);
        setAuditError('');

        try {
            const { data, error: auditFetchError } = await supabase
                .from('profile_role_audit_log')
                .select('id, target_profile_id, actor_id, changed_fields, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (auditFetchError) {
                if (auditFetchError.code === '42P01') {
                    setRecentRoleAudit([]);
                    return;
                }
                throw auditFetchError;
            }

            setRecentRoleAudit(data || []);
        } catch (auditLoadErr) {
            console.error('Failed to fetch role audit log:', auditLoadErr);
            setAuditError(auditLoadErr.message || 'Failed to fetch role audit history.');
        } finally {
            setLoadingAudit(false);
        }
    };

    useEffect(() => {
        refreshRoleAudit();
    }, []);

    const buildProfilePayload = (profile) => ({
        role: profile.role || 'user',
        is_certified: profile.is_certified === true,
        editorial_roles: normalizeTagList(profile.editorial_roles),
        expertise_roles: normalizeTagList(profile.expertise_roles),
        updated_at: new Date().toISOString(),
    });

    const patchProfileState = (profileId, patch) => {
        setProfiles((prev) =>
            prev.map((profile) =>
                profile.id === profileId
                    ? {
                          ...profile,
                          ...patch,
                      }
                    : profile
            )
        );
    };

    const toggleProfileSelection = (profileId) => {
        setSelectedProfileIds((prev) => {
            if (prev.includes(profileId)) {
                return prev.filter((id) => id !== profileId);
            }

            return [...prev, profileId];
        });
    };

    const toggleSelectAllFiltered = () => {
        const filteredIds = filteredProfiles.map((profile) => profile.id);

        setSelectedProfileIds((prev) => {
            const isEveryFilteredSelected = filteredIds.every((profileId) => prev.includes(profileId));

            if (isEveryFilteredSelected) {
                return prev.filter((profileId) => !filteredIds.includes(profileId));
            }

            return Array.from(new Set([...prev, ...filteredIds]));
        });
    };

    const applyBulkBaseRole = () => {
        if (selectedProfileIds.length === 0) return;
        setError('');

        setProfiles((prev) =>
            prev.map((profile) =>
                selectedProfileIdSet.has(profile.id)
                    ? {
                          ...profile,
                          role: bulkBaseRole,
                      }
                    : profile
            )
        );

        setSuccess(
            `Applied base role "${bulkBaseRole}" to ${selectedProfileIds.length} selected profile${selectedProfileIds.length === 1 ? '' : 's'}.`
        );
    };

    const applyBulkEditorialRole = () => {
        if (selectedProfileIds.length === 0) return;
        setError('');

        setProfiles((prev) =>
            prev.map((profile) => {
                if (!selectedProfileIdSet.has(profile.id)) return profile;

                const current = normalizeTagList(profile.editorial_roles);
                const hasRole = current.some((role) => role.toLowerCase() === bulkEditorialRole.toLowerCase());

                const next =
                    bulkEditorialAction === 'add'
                        ? hasRole
                            ? current
                            : [...current, bulkEditorialRole]
                        : current.filter((role) => role.toLowerCase() !== bulkEditorialRole.toLowerCase());

                return {
                    ...profile,
                    editorial_roles: normalizeTagList(next),
                };
            })
        );

        setSuccess(
            `${bulkEditorialAction === 'add' ? 'Added' : 'Removed'} editorial role "${bulkEditorialRole}" for ${selectedProfileIds.length} selected profile${selectedProfileIds.length === 1 ? '' : 's'}.`
        );
    };

    const applyBulkExpertiseRole = () => {
        if (selectedProfileIds.length === 0) return;
        setError('');

        setProfiles((prev) =>
            prev.map((profile) => {
                if (!selectedProfileIdSet.has(profile.id)) return profile;

                const current = normalizeTagList(profile.expertise_roles);
                const hasRole = current.some((role) => role.toLowerCase() === bulkExpertiseRole.toLowerCase());

                const next =
                    bulkExpertiseAction === 'add'
                        ? hasRole
                            ? current
                            : [...current, bulkExpertiseRole]
                        : current.filter((role) => role.toLowerCase() !== bulkExpertiseRole.toLowerCase());

                return {
                    ...profile,
                    expertise_roles: normalizeTagList(next),
                };
            })
        );

        setSuccess(
            `${bulkExpertiseAction === 'add' ? 'Added' : 'Removed'} expertise role "${bulkExpertiseRole}" for ${selectedProfileIds.length} selected profile${selectedProfileIds.length === 1 ? '' : 's'}.`
        );
    };

    const applyBulkCertification = () => {
        if (selectedProfileIds.length === 0) return;
        setError('');
        const shouldCertify = bulkCertifiedState === 'certified';

        setProfiles((prev) =>
            prev.map((profile) =>
                selectedProfileIdSet.has(profile.id)
                    ? {
                          ...profile,
                          is_certified: shouldCertify,
                      }
                    : profile
            )
        );

        setSuccess(
            `Marked ${selectedProfileIds.length} selected profile${selectedProfileIds.length === 1 ? '' : 's'} as ${shouldCertify ? 'certified' : 'not certified'}.`
        );
    };

    const toggleEditorialRole = (profileId, roleName) => {
        setProfiles((prev) =>
            prev.map((profile) => {
                if (profile.id !== profileId) return profile;

                const current = normalizeTagList(profile.editorial_roles);
                const hasRole = current.some((role) => role.toLowerCase() === roleName.toLowerCase());

                const next = hasRole
                    ? current.filter((role) => role.toLowerCase() !== roleName.toLowerCase())
                    : [...current, roleName];

                return {
                    ...profile,
                    editorial_roles: normalizeTagList(next),
                };
            })
        );
    };

    const toggleExpertisePreset = (profileId, tagName) => {
        setProfiles((prev) =>
            prev.map((profile) => {
                if (profile.id !== profileId) return profile;

                const current = normalizeTagList(profile.expertise_roles);
                const hasTag = current.some((tag) => tag.toLowerCase() === tagName.toLowerCase());

                const next = hasTag
                    ? current.filter((tag) => tag.toLowerCase() !== tagName.toLowerCase())
                    : [...current, tagName];

                return {
                    ...profile,
                    expertise_roles: normalizeTagList(next),
                };
            })
        );
    };

    const removeExpertiseTag = (profileId, tagToRemove) => {
        setProfiles((prev) =>
            prev.map((profile) => {
                if (profile.id !== profileId) return profile;

                return {
                    ...profile,
                    expertise_roles: normalizeTagList(
                        (profile.expertise_roles || []).filter(
                            (tag) => tag.toLowerCase() !== tagToRemove.toLowerCase()
                        )
                    ),
                };
            })
        );
    };

    const addCustomTag = (profileId) => {
        const nextTag = `${draftCustomTags[profileId] || ''}`.trim();
        if (!nextTag) return;

        setProfiles((prev) =>
            prev.map((profile) => {
                if (profile.id !== profileId) return profile;

                return {
                    ...profile,
                    expertise_roles: normalizeTagList([...(profile.expertise_roles || []), nextTag]),
                };
            })
        );

        setDraftCustomTags((prev) => ({
            ...prev,
            [profileId]: '',
        }));
    };

    const saveProfile = async (profile) => {
        setSavingId(profile.id);
        setError('');
        setSuccess('');

        const saved = savedProfilesById[profile.id];
        const wasAdmin = saved?.role === 'admin';
        const willBeAdmin = `${profile.role || 'user'}`.toLowerCase() === 'admin';

        if (wasAdmin && !willBeAdmin) {
            const projectedAdminCount = countAdminsWithOverrides({
                [profile.id]: `${profile.role || 'user'}`.toLowerCase(),
            });

            if (projectedAdminCount === 0) {
                setError('Cannot demote the last admin account. Promote another member first.');
                setSavingId(null);
                return;
            }
        }

        try {
            const payload = buildProfilePayload(profile);

            const { error: updateError } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', profile.id);

            if (updateError) throw updateError;

            patchProfileState(profile.id, payload);
            setSavedProfilesById((prev) => ({
                ...prev,
                [profile.id]: normalizeProfileForCompare({
                    ...profile,
                    ...payload,
                }),
            }));
            setSuccess(`Saved roles for ${profile.username || profile.id.slice(0, 8)}.`);
            await refreshRoleAudit();
        } catch (err) {
            console.error('Failed to save profile roles:', err);
            setError(err.message || 'Failed to update profile roles.');
        } finally {
            setSavingId(null);
        }
    };

    const saveSelectedProfiles = async () => {
        if (selectedDirtyProfiles.length === 0) return;

        setIsSavingSelected(true);
        setError('');
        setSuccess('');

        const roleOverrides = Object.fromEntries(
            selectedDirtyProfiles.map((profile) => [profile.id, `${profile.role || 'user'}`.toLowerCase()])
        );

        const projectedAdminCount = countAdminsWithOverrides(roleOverrides);
        if (projectedAdminCount === 0) {
            setError('Cannot demote the last admin account. Promote another member first.');
            setIsSavingSelected(false);
            return;
        }

        try {
            for (const profile of selectedDirtyProfiles) {
                const payload = buildProfilePayload(profile);

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update(payload)
                    .eq('id', profile.id);

                if (updateError) {
                    throw new Error(`${profile.username || profile.id.slice(0, 8)}: ${updateError.message}`);
                }

                patchProfileState(profile.id, payload);
                setSavedProfilesById((prev) => ({
                    ...prev,
                    [profile.id]: normalizeProfileForCompare({
                        ...profile,
                        ...payload,
                    }),
                }));
            }

            setSuccess(
                `Saved ${selectedDirtyProfiles.length} selected profile${selectedDirtyProfiles.length === 1 ? '' : 's'}.`
            );
            await refreshRoleAudit();
        } catch (err) {
            console.error('Failed to save selected profiles:', err);
            setError(err.message || 'Failed to save selected profiles.');
        } finally {
            setIsSavingSelected(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#12131A] text-white px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold inline-flex items-center gap-2">
                        <Shield size={24} /> Member Role Management
                    </h1>
                    <p className="text-gray-400 mt-1">Assign editorial roles and custom profession/study tags.</p>
                </div>

                <div className="mb-6 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full bg-[#181A23] border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-white"
                        placeholder="Search by username, id, role, or tags..."
                    />
                </div>

                <section className="mb-6 bg-[#181A23] border border-gray-800 rounded-2xl p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                                Bulk role actions
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {selectedProfileCount} selected profile{selectedProfileCount === 1 ? '' : 's'}
                                {selectedDirtyCount > 0 ? ` • ${selectedDirtyCount} unsaved` : ''}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={toggleSelectAllFiltered}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                                {allFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                {allFilteredSelected
                                    ? `Unselect filtered (${selectedFilteredCount})`
                                    : `Select filtered (${filteredProfiles.length})`}
                            </button>
                            <button
                                type="button"
                                onClick={saveSelectedProfiles}
                                disabled={selectedDirtyCount === 0 || isSavingSelected}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSavingSelected ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSavingSelected
                                    ? 'Saving selected...'
                                    : selectedDirtyCount > 0
                                        ? `Save selected (${selectedDirtyCount})`
                                        : 'No selected changes'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="bg-[#0F1118] border border-gray-700 rounded-xl p-3 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Base role</p>
                            <select
                                value={bulkBaseRole}
                                onChange={(event) => setBulkBaseRole(event.target.value)}
                                className="w-full bg-[#0A0B11] border border-gray-700 rounded-lg px-2.5 py-2 text-xs"
                            >
                                {BASE_ROLE_OPTIONS.map((roleOption) => (
                                    <option key={`bulk-base-${roleOption}`} value={roleOption}>
                                        {roleOption}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={applyBulkBaseRole}
                                disabled={selectedProfileCount === 0}
                                className="w-full px-3 py-2 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Apply to selected
                            </button>
                        </div>

                        <div className="bg-[#0F1118] border border-gray-700 rounded-xl p-3 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Editorial roles</p>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={bulkEditorialAction}
                                    onChange={(event) => setBulkEditorialAction(event.target.value)}
                                    className="bg-[#0A0B11] border border-gray-700 rounded-lg px-2 py-2 text-xs"
                                >
                                    <option value="add">Add</option>
                                    <option value="remove">Remove</option>
                                </select>
                                <select
                                    value={bulkEditorialRole}
                                    onChange={(event) => setBulkEditorialRole(event.target.value)}
                                    className="bg-[#0A0B11] border border-gray-700 rounded-lg px-2 py-2 text-xs"
                                >
                                    {EDITORIAL_ROLE_OPTIONS.map((roleOption) => (
                                        <option key={`bulk-editorial-${roleOption}`} value={roleOption}>
                                            {roleOption}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={applyBulkEditorialRole}
                                disabled={selectedProfileCount === 0}
                                className="w-full px-3 py-2 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Apply to selected
                            </button>
                        </div>

                        <div className="bg-[#0F1118] border border-gray-700 rounded-xl p-3 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Expertise roles</p>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={bulkExpertiseAction}
                                    onChange={(event) => setBulkExpertiseAction(event.target.value)}
                                    className="bg-[#0A0B11] border border-gray-700 rounded-lg px-2 py-2 text-xs"
                                >
                                    <option value="add">Add</option>
                                    <option value="remove">Remove</option>
                                </select>
                                <select
                                    value={bulkExpertiseRole}
                                    onChange={(event) => setBulkExpertiseRole(event.target.value)}
                                    className="bg-[#0A0B11] border border-gray-700 rounded-lg px-2 py-2 text-xs"
                                >
                                    {EXPERTISE_PRESETS.map((roleOption) => (
                                        <option key={`bulk-expertise-${roleOption}`} value={roleOption}>
                                            {roleOption}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={applyBulkExpertiseRole}
                                disabled={selectedProfileCount === 0}
                                className="w-full px-3 py-2 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Apply to selected
                            </button>
                        </div>

                        <div className="bg-[#0F1118] border border-gray-700 rounded-xl p-3 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Certification</p>
                            <select
                                value={bulkCertifiedState}
                                onChange={(event) => setBulkCertifiedState(event.target.value)}
                                className="w-full bg-[#0A0B11] border border-gray-700 rounded-lg px-2.5 py-2 text-xs"
                            >
                                <option value="certified">Set certified</option>
                                <option value="not_certified">Set not certified</option>
                            </select>
                            <button
                                type="button"
                                onClick={applyBulkCertification}
                                disabled={selectedProfileCount === 0}
                                className="w-full px-3 py-2 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Apply to selected
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mb-6 bg-[#181A23] border border-gray-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300 inline-flex items-center gap-2">
                            <History size={16} /> Recent role change audit
                        </h2>
                        <button
                            type="button"
                            onClick={refreshRoleAudit}
                            disabled={loadingAudit}
                            className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loadingAudit ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    {auditError && <p className="text-xs text-red-300 mb-2">{auditError}</p>}

                    {loadingAudit ? (
                        <p className="text-xs text-gray-400">Loading role audit entries...</p>
                    ) : recentRoleAudit.length === 0 ? (
                        <p className="text-xs text-gray-400">No audit entries yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {recentRoleAudit.map((entry) => (
                                <div key={entry.id} className="bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2">
                                    <p className="text-xs text-gray-200">
                                        Target <span className="font-mono">{entry.target_profile_id}</span>
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {summarizeChangedFields(entry.changed_fields)}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Actor: {entry.actor_id || 'system'} • {formatAuditTimestamp(entry.created_at) || 'Unknown time'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {dirtyProfileIds.size > 0 && (
                    <div className="mb-4 p-3 bg-amber-900/30 border border-amber-500/40 rounded-lg text-amber-200 text-sm">
                        {dirtyProfileIds.size} profile{dirtyProfileIds.size === 1 ? '' : 's'} with unsaved changes.
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-900/40 border border-red-500/30 rounded-lg text-red-300 text-sm inline-flex items-center gap-2">
                        <AlertTriangle size={15} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="bg-[#181A23] border border-gray-800 rounded-2xl p-8 text-gray-400">Loading members...</div>
                ) : filteredProfiles.length === 0 ? (
                    <div className="bg-[#181A23] border border-gray-800 rounded-2xl p-8 text-gray-400">No matching members found.</div>
                ) : (
                    <div className="space-y-4">
                        {filteredProfiles.map((profile) => {
                            const profileIsDirty = dirtyProfileIds.has(profile.id);
                            const profileIsSelected = selectedProfileIdSet.has(profile.id);

                            return (
                                <article
                                    key={profile.id}
                                    className={`bg-[#181A23] border rounded-2xl p-5 ${
                                        profileIsSelected ? 'border-sky-500/60' : 'border-gray-800'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleProfileSelection(profile.id)}
                                                className="mt-0.5 text-gray-300 hover:text-white"
                                                aria-label={profileIsSelected ? 'Unselect profile' : 'Select profile'}
                                            >
                                                {profileIsSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>

                                            <div>
                                                <h2 className="text-lg font-semibold text-white">
                                                    {profile.username || 'Unnamed Member'}
                                                </h2>
                                                <p className="text-xs text-gray-500 mt-1 font-mono">{profile.id}</p>
                                                {profileIsSelected && (
                                                    <p className="text-xs text-sky-300 mt-1">Selected for bulk actions</p>
                                                )}
                                                {profileIsDirty && (
                                                    <p className="text-xs text-amber-300 mt-1">Unsaved role changes</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-400">Base role</label>
                                            <select
                                                value={profile.role || 'user'}
                                                onChange={(event) =>
                                                    patchProfileState(profile.id, { role: event.target.value })
                                                }
                                                className="bg-[#0F1118] border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm"
                                            >
                                                {BASE_ROLE_OPTIONS.map((roleOption) => (
                                                    <option key={`${profile.id}-${roleOption}`} value={roleOption}>
                                                        {roleOption}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <section>
                                        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3">Editorial Roles</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {EDITORIAL_ROLE_OPTIONS.map((roleOption) => {
                                                const isEnabled = (profile.editorial_roles || []).some(
                                                    (role) => role.toLowerCase() === roleOption.toLowerCase()
                                                );
                                                return (
                                                    <button
                                                        key={roleOption}
                                                        type="button"
                                                        onClick={() => toggleEditorialRole(profile.id, roleOption)}
                                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                                                            isEnabled
                                                                ? 'bg-red-600/30 border-red-500 text-red-200'
                                                                : 'bg-[#0F1118] border-gray-700 text-gray-300 hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {roleOption}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={profile.is_certified === true}
                                                onChange={(event) =>
                                                    patchProfileState(profile.id, {
                                                        is_certified: event.target.checked,
                                                    })
                                                }
                                                className="rounded border-gray-600 bg-[#0F1118]"
                                            />
                                            <UserCheck size={14} /> Certified
                                        </label>
                                    </section>

                                    <section>
                                        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3">Expertise Roles</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {EXPERTISE_PRESETS.map((preset) => {
                                                const isEnabled = (profile.expertise_roles || []).some(
                                                    (tag) => tag.toLowerCase() === preset.toLowerCase()
                                                );

                                                return (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => toggleExpertisePreset(profile.id, preset)}
                                                        className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                                                            isEnabled
                                                                ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                                                                : 'bg-[#0F1118] border-gray-700 text-gray-300 hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {preset}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(profile.expertise_roles || []).map((tag) => (
                                                <span
                                                    key={`${profile.id}-${tag}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800 text-xs text-gray-200"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExpertiseTag(profile.id, tag)}
                                                        className="text-gray-400 hover:text-red-300"
                                                        aria-label={`Remove ${tag}`}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={draftCustomTags[profile.id] || ''}
                                                onChange={(event) =>
                                                    setDraftCustomTags((prev) => ({
                                                        ...prev,
                                                        [profile.id]: event.target.value,
                                                    }))
                                                }
                                                placeholder="Add custom tag"
                                                className="flex-1 bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addCustomTag(profile.id)}
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 transition-colors"
                                            >
                                                <Plus size={14} /> Add
                                            </button>
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-5 pt-4 border-t border-gray-800 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => saveProfile(profile)}
                                        disabled={savingId === profile.id || isSavingSelected || !profileIsDirty}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {savingId === profile.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Save size={14} />
                                        )}
                                        {savingId === profile.id
                                            ? 'Saving...'
                                            : isSavingSelected
                                                ? 'Bulk save in progress'
                                                : profileIsDirty
                                                    ? 'Save Changes'
                                                    : 'No Changes'}
                                    </button>
                                </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManagementPage;
