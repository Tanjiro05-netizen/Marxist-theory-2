import { useCallback, useRef, useState } from 'react';
import { saveScienceBlockEvidence } from '../../../services/scienceApi';

// Shared evidence handling for interactive blocks. Components own their local
// state; this hook persists snapshots at meaningful moments (reveal, submit,
// check) through the server-authoritative RPC. Visitors without an active
// enrollment get a silent no-op so browsing never crashes.
export const useBlockEvidence = ({ blockId, initialEvidence }) => {
  const [evidence, setEvidence] = useState(initialEvidence?.evidence || {});
  const [state, setState] = useState(initialEvidence?.state || 'started');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(initialEvidence?.updated_at || null);
  const saveRef = useRef(Promise.resolve());

  const save = useCallback(
    (patch = {}, { complete = false, silent = false } = {}) => {
      if (!blockId) return Promise.resolve();
      const nextEvidence = { ...evidence, ...patch };
      setEvidence(nextEvidence);
      if (complete && state !== 'completed') setState('completed');

      const run = async () => {
        setIsSaving(true);
        try {
          await saveScienceBlockEvidence({
            blockId,
            evidence: nextEvidence,
            state: complete ? 'completed' : state === 'completed' ? 'completed' : 'started',
          });
          setSavedAt(new Date().toISOString());
        } catch {
          if (!silent) {
            // Evidence persistence is best-effort for enrolled learners; the
            // lesson completion RPC remains the authoritative gate.
          }
        } finally {
          setIsSaving(false);
        }
      };

      saveRef.current = saveRef.current.then(run, run);
      return saveRef.current;
    },
    [blockId, evidence, state]
  );

  return { evidence, state, isSaving, savedAt, save, setState };
};
