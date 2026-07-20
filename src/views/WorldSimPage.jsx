import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Terminal from '../components/WorldSim/Terminal';
import { worldSimApi } from '../components/WorldSim/api/worldSimApi';

const BOOT_SEQUENCE = [
  { type: 'system', content: 'marx_sim v0.1' },
  { type: 'system', content: '' },
  { type: 'system', content: 'Base/superstructure model loaded.' },
  { type: 'system', content: 'Reproduction schemas initialized.' },
  { type: 'system', content: 'Crisis tendencies: latent.' },
  { type: 'system', content: '' },
  { type: 'system', content: 'No active simulation.' },
  { type: 'system', content: 'Type "create universe" or "create universe --campaign=RELAY_TO_REVOLUTION --difficulty=2"' },
];

const LONDON_OPENING = `Initializing...
Clock: STARTED
Location: London

You wake in a small room. Coal smoke. Ink. Paper everywhere.
Marx and Engels are here. A letter lies open on the desk: GERMANY.
One line underlined twice: "UNITY CONGRESS — LABOR & DEMOCRACY."

Marx gestures to the letter.
"Your information about the conditions there—if you have any—will be of real value."
`;

const HELP_TEXT = `
Available commands:

  help [command]         - Show command documentation
  create universe        - Initialize a new historical-materialist world
  create <entity>        - Create a simulated entity (worker_cell, courier, etc.)
  destroy <entity>       - Remove an entity from the simulation
  set <param> <val>      - Set a global simulation parameter
  evolve <steps>         - Fast-forward simulation by <steps>
  query <x>              - Inspect entity/parameter/status readout
  talk marx              - Dialogue with Marx
  talk engels            - Dialogue with Engels
  reset                  - Reset simulation to initial conditions
  save                   - Save current session
  clear                  - Clear terminal output

Entity types: worker_cell, courier, printshop, safehouse, council_delegate, factory, contact
`;

// Creation phase states: null | 'campaign' | 'character' | 'initializing'
const WorldSimPage = () => {
  const { user } = useAuth();
  const [output, setOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [creationPhase, setCreationPhase] = useState(null);
  const [pendingCreation, setPendingCreation] = useState({ campaign: null, difficulty: 2 });
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const hasBooted = useRef(false);

  // Load user sessions on mount
  useEffect(() => {
    if (user?.id) {
      loadUserSessions();
    }
  }, [user?.id]);

  // Boot sequence on mount (use ref to prevent double-run in StrictMode)
  useEffect(() => {
    if (!hasBooted.current) {
      hasBooted.current = true;
      runBootSequence();
    }
  }, []);

  const loadUserSessions = async () => {
    try {
      const sessions = await worldSimApi.getUserSessions(user.id);
      setUserSessions(sessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const runBootSequence = async () => {
    for (let i = 0; i < BOOT_SEQUENCE.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setOutput(prev => [...prev, BOOT_SEQUENCE[i]]);
    }
  };

  const addOutput = useCallback((type, content) => {
    setOutput(prev => [...prev, { type, content }]);
  }, []);

  // Parse CLI flags from create universe command
  const parseCreateUniverseFlags = (command) => {
    const flags = { campaign: null, difficulty: 2 };
    const campaignMatch = command.match(/--campaign=(\S+)/i);
    const difficultyMatch = command.match(/--difficulty=(\d)/i);
    if (campaignMatch) flags.campaign = campaignMatch[1].toUpperCase();
    if (difficultyMatch) flags.difficulty = parseInt(difficultyMatch[1], 10);
    return flags;
  };

  // Initialize the simulation with current pending creation state
  const initializeSimulation = async (characterDescription = '') => {
    setCreationPhase('initializing');
    setIsLoading(true);

    try {
      const campaign = pendingCreation.campaign;
      if (!campaign) {
        addOutput('error', 'No campaign selected.');
        setCreationPhase(null);
        setIsLoading(false);
        return;
      }

      // Parse character description for traits
      const avatar = worldSimApi.parseCharacterDescription(characterDescription);

      // Create session
      const newSession = await worldSimApi.createSessionWithAvatar(
        user.id,
        campaign.id,
        campaign.title,
        pendingCreation.difficulty,
        avatar
      );

      setCurrentSession(newSession);
      await loadUserSessions();

      // Output the London opening scene
      const state = newSession.world_state;
      const avatarInfo = `
--- AVATAR ---
Alias: "${state.avatar?.alias || 'Unknown'}"
Cover: ${state.avatar?.cover_role || 'Unknown'}
Weakness: ${state.avatar?.weakness || 'None detected'}
Skills: ${Object.entries(state.avatar?.skills || {}).map(([k, v]) => `${k}:${v}`).join(' | ')}
`;
      addOutput('response', LONDON_OPENING + avatarInfo);

      // Add initial message
      await worldSimApi.addMessage(newSession.id, 'system', 'Universe created. Simulation initialized.');

      setCreationPhase(null);
      setPendingCreation({ campaign: null, difficulty: 2 });

    } catch (err) {
      console.error('Error initializing simulation:', err);
      addOutput('error', `Failed to initialize: ${err.message}`);
      setCreationPhase(null);
    }
    setIsLoading(false);
  };

  const handleCommand = async (command) => {
    // Add command to output
    addOutput('command', command);

    const trimmedCommand = command.trim();
    const lowerCommand = trimmedCommand.toLowerCase();

    // Handle creation phase inputs
    if (creationPhase === 'campaign') {
      // User is selecting a campaign by number
      const num = parseInt(trimmedCommand, 10);
      if (!isNaN(num) && num >= 1 && num <= availableCampaigns.length) {
        const selected = availableCampaigns[num - 1];
        setPendingCreation(prev => ({ ...prev, campaign: selected }));
        addOutput('system', `Selected: ${selected.title}`);
        addOutput('system', '');
        addOutput('system', 'DESCRIBE YOUR CHARACTER (background, skills, personality):');
        addOutput('system', '(Press Enter to skip for random avatar)');
        setCreationPhase('character');
      } else {
        addOutput('error', `Invalid selection. Enter 1-${availableCampaigns.length}`);
      }
      return;
    }

    if (creationPhase === 'character') {
      // User entered character description (or empty for random)
      await initializeSimulation(trimmedCommand);
      return;
    }

    // Local commands (no API needed)
    if (lowerCommand === 'help') {
      addOutput('response', HELP_TEXT);
      return;
    }

    if (lowerCommand === 'clear') {
      setOutput([]);
      return;
    }

    if (lowerCommand.startsWith('create universe')) {
      // Parse flags
      const flags = parseCreateUniverseFlags(trimmedCommand);
      
      // Load available campaigns
      const campaigns = await worldSimApi.getScenarioPacks();
      setAvailableCampaigns(campaigns);

      if (campaigns.length === 0) {
        addOutput('error', 'No campaigns available.');
        return;
      }

      // Check if campaign was specified via flag
      let selectedCampaign = null;
      if (flags.campaign) {
        selectedCampaign = campaigns.find(c => 
          c.slug.toUpperCase().includes(flags.campaign) || 
          c.title.toUpperCase().includes(flags.campaign)
        );
      }

      if (selectedCampaign) {
        // Campaign specified, go directly to character creation
        setPendingCreation({ campaign: selectedCampaign, difficulty: flags.difficulty });
        addOutput('system', `Campaign: ${selectedCampaign.title}`);
        addOutput('system', `Difficulty: ${flags.difficulty === 1 ? 'Easy' : flags.difficulty === 3 ? 'Hard' : 'Normal'}`);
        addOutput('system', '');
        addOutput('system', 'DESCRIBE YOUR CHARACTER (background, skills, personality):');
        addOutput('system', '(Press Enter to skip for random avatar)');
        setCreationPhase('character');
      } else {
        // No campaign specified, prompt for selection
        setPendingCreation({ campaign: null, difficulty: flags.difficulty });
        addOutput('system', 'Available campaigns:');
        campaigns.forEach((c, i) => {
          addOutput('system', `  ${i + 1}) ${c.slug} - ${c.title}`);
        });
        addOutput('system', '');
        addOutput('system', 'Enter campaign number:');
        setCreationPhase('campaign');
      }
      return;
    }

    if (lowerCommand === 'save') {
      if (currentSession) {
        addOutput('system', 'Session saved.');
        await loadUserSessions();
      } else {
        addOutput('error', 'No active session to save.');
      }
      return;
    }

    if (lowerCommand === 'reset') {
      if (currentSession) {
        setCurrentSession(null);
        setCreationPhase(null);
        addOutput('system', 'Simulation reset. Type "create universe" to begin a new session.');
      } else {
        addOutput('error', 'No active session to reset.');
      }
      return;
    }

    // Commands that require an active session
    if (!currentSession) {
      addOutput('error', 'No active simulation. Type "create universe" to begin.');
      return;
    }

    // Process command through API
    setIsLoading(true);
    try {
      const result = await worldSimApi.processCommand(currentSession.id, command);
      
      // Add the rendered output
      addOutput('response', result.output);

      // Update session state
      setCurrentSession(prev => ({
        ...prev,
        world_state: result.newWorldState,
        current_episode: result.session.current_episode
      }));

    } catch (err) {
      console.error('Error processing command:', err);
      addOutput('error', `Failed to process command: ${err.message}`);
    }
    setIsLoading(false);
  };

  const handleNewSession = () => {
    addOutput('system', 'Type "create universe" to start a new simulation.');
  };

  const handleSaveSession = async () => {
    if (currentSession) {
      addOutput('system', 'Session saved.');
      await loadUserSessions();
    } else {
      addOutput('error', 'No active session to save.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <Link href="/" 
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-2 transition-colors"
      >
        ← Home
      </Link>
      <div className="max-w-6xl mx-auto h-[calc(100vh-100px)]">
        <Terminal
          output={output}
          onCommand={handleCommand}
          isLoading={isLoading}
          sessionTitle={currentSession?.title}
          onNewSession={handleNewSession}
          onSaveSession={handleSaveSession}
          onShowHelp={() => setShowHelp(true)}
          showHelp={showHelp}
          onCloseHelp={() => setShowHelp(false)}
        />
      </div>
    </div>
  );
};

export default WorldSimPage;
