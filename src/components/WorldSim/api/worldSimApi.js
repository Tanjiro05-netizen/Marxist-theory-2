import { supabase } from '../../../supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

// Dev mode UUID for 'dev-admin' user
const DEV_ADMIN_UUID = '00000000-0000-0000-0000-000000000001';

// Convert user ID to valid UUID (handles dev-admin case)
const toValidUserId = (userId) => {
  if (userId === 'dev-admin') return DEV_ADMIN_UUID;
  return userId;
};

// Trait parsing patterns for character descriptions
const TRAIT_PATTERNS = {
  mechanical: /printer|typesetter|press|mechanic|engineer|tinker/i,
  discipline: /soldier|military|fought|army|guard|drill/i,
  rhetoric: /teacher|orator|speaker|preacher|lecturer|writer/i,
  finance: /bookkeeper|clerk|numbers|accountant|banker|merchant/i,
  logistics: /sailor|courier|traveled|shipping|porter|driver/i,
  negotiation: /diplomat|negotiator|mediator|lawyer|arbitrator/i,
};

const WEAKNESS_PATTERNS = {
  impulsive: /impulsive|rash|hot-headed|quick-tempered|hasty/i,
  fearful: /cautious|fearful|anxious|nervous|timid|coward/i,
  talkative: /talkative|gossip|chatty|loud|indiscreet/i,
  idealistic: /idealist|dreamer|romantic|naive|utopian/i,
  sectarian: /sectarian|dogmatic|rigid|inflexible|purist/i,
};

const COVER_ROLE_PATTERNS = {
  typesetter_assistant: /printer|typesetter|press/i,
  factory_fitter: /factory|mechanic|engineer|fitter/i,
  courier: /courier|messenger|traveler|sailor/i,
  clerk: /clerk|bookkeeper|accountant/i,
  student: /student|scholar|teacher|lecturer/i,
  dockhand: /dock|porter|shipping|sailor/i,
};

class WorldSimApi {
  // Parse character description to extract traits
  parseCharacterDescription(description) {
    if (!description || description.trim() === '') {
      // Return null to trigger random generation
      return null;
    }

    const text = description.toLowerCase();
    
    // Parse skills (1-5 scale, default 2)
    const skills = {
      rhetoric: 2,
      logistics: 2,
      discipline: 2,
      mechanical: 2,
      finance: 2,
      negotiation: 2
    };

    // Boost skills based on patterns
    Object.entries(TRAIT_PATTERNS).forEach(([skill, pattern]) => {
      if (pattern.test(text)) {
        skills[skill] = Math.min(5, skills[skill] + 2);
      }
    });

    // Detect weakness
    let weakness = null;
    for (const [w, pattern] of Object.entries(WEAKNESS_PATTERNS)) {
      if (pattern.test(text)) {
        weakness = w;
        break;
      }
    }

    // Detect cover role
    let cover_role = 'courier'; // default
    for (const [role, pattern] of Object.entries(COVER_ROLE_PATTERNS)) {
      if (pattern.test(text)) {
        cover_role = role;
        break;
      }
    }

    // Generate alias from initials or random
    const aliases = ['J.K.', 'M.R.', 'F.W.', 'A.B.', 'H.S.', 'L.P.', 'K.M.', 'E.F.'];
    const alias = aliases[Math.floor(Math.random() * aliases.length)];

    return {
      alias,
      cover_role,
      skills,
      weakness: weakness || 'naive',
      description: description.trim()
    };
  }

  // Create session with custom avatar
  async createSessionWithAvatar(userId, scenarioPackId, title, difficulty = 2, customAvatar = null) {
    try {
      const pack = await this.getScenarioPackWithEpisodes(scenarioPackId);
      if (!pack) throw new Error('Scenario pack not found');

      // Generate initial world state with custom or random avatar
      const initialState = this.generateInitialState(pack, difficulty, customAvatar);

      const { data, error } = await supabase
        .from('world_sim_sessions')
        .insert({
          user_id: toValidUserId(userId),
          scenario_pack_id: scenarioPackId,
          title: title || pack.title,
          difficulty,
          world_state: initialState,
          current_episode: 1,
          achievements_earned: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating session with avatar:', err);
      throw err;
    }
  }

  // Get all active scenario packs
  async getScenarioPacks() {
    try {
      const { data, error } = await supabase
        .from('world_sim_scenario_packs')
        .select('*')
        .eq('is_active', true)
        .order('slug', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching scenario packs:', err);
      return [];
    }
  }

  // Get a specific scenario pack with episodes
  async getScenarioPackWithEpisodes(packId) {
    try {
      const { data, error } = await supabase
        .from('world_sim_scenario_packs')
        .select(`
          *,
          episodes:world_sim_episodes(*)
        `)
        .eq('id', packId)
        .single();

      if (error) throw error;

      if (data?.episodes) {
        data.episodes.sort((a, b) => a.episode_number - b.episode_number);
      }

      return data;
    } catch (err) {
      console.error('Error fetching scenario pack:', err);
      return null;
    }
  }

  // Get user's sessions
  async getUserSessions(userId) {
    try {
      const { data, error } = await supabase
        .from('world_sim_sessions')
        .select(`
          *,
          scenario_pack:world_sim_scenario_packs(title, slug)
        `)
        .eq('user_id', toValidUserId(userId))
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user sessions:', err);
      return [];
    }
  }

  // Create a new session
  async createSession(userId, scenarioPackId, title, difficulty = 2) {
    try {
      // Get the scenario pack for initial state
      const pack = await this.getScenarioPackWithEpisodes(scenarioPackId);
      if (!pack) throw new Error('Scenario pack not found');

      // Generate initial world state
      const initialState = this.generateInitialState(pack, difficulty);

      const { data, error } = await supabase
        .from('world_sim_sessions')
        .insert({
          user_id: toValidUserId(userId),
          scenario_pack_id: scenarioPackId,
          title: title || pack.title,
          difficulty,
          world_state: initialState,
          current_episode: 1,
          achievements_earned: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  }

  // Generate initial world state from scenario pack
  generateInitialState(pack, difficulty, customAvatar = null) {
    const conditions = pack.starting_conditions || {};
    const difficultyMod = difficulty === 1 ? -5 : difficulty === 3 ? 5 : 0;

    // Generate random values within ranges
    const getRandomInRange = (min, max) => {
      const numMin = typeof min === 'number' ? min : 0;
      const numMax = typeof max === 'number' ? max : 100;
      return Math.floor(Math.random() * (numMax - numMin + 1)) + numMin + difficultyMod;
    };

    const meters = {
      heat: getRandomInRange(conditions.heat?.min, conditions.heat?.max),
      infiltration_risk: getRandomInRange(conditions.infiltration_risk?.min, conditions.infiltration_risk?.max),
      militancy: getRandomInRange(conditions.militancy?.min, conditions.militancy?.max),
      consciousness: getRandomInRange(conditions.consciousness?.min, conditions.consciousness?.max),
      trust: getRandomInRange(conditions.trust?.min, conditions.trust?.max),
      program_clarity: getRandomInRange(conditions.program_clarity?.min, conditions.program_clarity?.max),
      union_influence: getRandomInRange(conditions.union_influence?.min, conditions.union_influence?.max),
      reformist_pull: getRandomInRange(conditions.reformist_pull?.min, conditions.reformist_pull?.max),
      factionalism: getRandomInRange(conditions.factionalism?.min, conditions.factionalism?.max),
      state_stability: getRandomInRange(conditions.state_stability?.min, conditions.state_stability?.max),
      employer_cohesion: getRandomInRange(conditions.employer_cohesion?.min, conditions.employer_cohesion?.max),
      international_momentum: getRandomInRange(conditions.international_momentum?.min, conditions.international_momentum?.max),
      rumor_level: getRandomInRange(conditions.rumor_level?.min, conditions.rumor_level?.max),
      funds: conditions.funds?.min || 'low',
      print_capacity: conditions.print_capacity?.min || 'none'
    };

    // Clamp numeric values
    Object.keys(meters).forEach(key => {
      if (typeof meters[key] === 'number') {
        meters[key] = Math.max(0, Math.min(100, meters[key]));
      }
    });

    // Use custom avatar or generate random one
    let avatar;
    if (customAvatar) {
      avatar = customAvatar;
    } else {
      const coverRoles = ['typesetter_assistant', 'printer_apprentice', 'courier', 'factory_fitter', 'dockhand', 'student'];
      const weaknesses = ['talkative', 'impulsive', 'fearful', 'idealistic', 'sectarian', 'naive'];
      const aliases = ['J.K.', 'M.R.', 'F.W.', 'A.B.', 'H.S.', 'L.P.'];

      avatar = {
        alias: aliases[Math.floor(Math.random() * aliases.length)],
        cover_role: coverRoles[Math.floor(Math.random() * coverRoles.length)],
        skills: {
          rhetoric: Math.floor(Math.random() * 4) + 1,
          logistics: Math.floor(Math.random() * 4) + 1,
          discipline: Math.floor(Math.random() * 4) + 1,
          mechanical: Math.floor(Math.random() * 4) + 1,
          finance: Math.floor(Math.random() * 4) + 1,
          negotiation: Math.floor(Math.random() * 4) + 1
        },
        weakness: weaknesses[Math.floor(Math.random() * weaknesses.length)]
      };
    }

    return {
      meters,
      entities: pack.starting_entities || [],
      unlocks: ['help', 'query', 'talk'],
      time: { week: 1, day: 1 },
      location: { node: 'london', sector: 'study' },
      avatar
    };
  }

  // Update session
  async updateSession(sessionId, updates) {
    try {
      const { data, error } = await supabase
        .from('world_sim_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  }

  // Delete session
  async deleteSession(sessionId) {
    try {
      const { error } = await supabase
        .from('world_sim_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  }

  // Get session with messages
  async getSessionWithMessages(sessionId) {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('world_sim_sessions')
        .select(`
          *,
          scenario_pack:world_sim_scenario_packs(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: messages, error: messagesError } = await supabase
        .from('world_sim_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return { ...session, messages: messages || [] };
    } catch (err) {
      console.error('Error fetching session with messages:', err);
      return null;
    }
  }

  // Add message to session
  async addMessage(sessionId, role, content, modelUsed = null) {
    try {
      const { data, error } = await supabase
        .from('world_sim_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          model_used: modelUsed
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding message:', err);
      throw err;
    }
  }

  // Process command through state engine (DeepSeek)
  async processStateUpdate(command, worldState, episode, scenarioPack) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/world-sim-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          command,
          worldState,
          episode,
          scenarioPack
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'State engine error');
      }

      return await response.json();
    } catch (err) {
      console.error('Error processing state update:', err);
      throw err;
    }
  }

  // Render output through render engine (Kimi)
  async renderOutput(command, worldState, stateUpdate, episode, scenarioPack, messageHistory) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${SUPABASE_URL}/functions/v1/world-sim-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          command,
          worldState,
          stateUpdate,
          episode,
          scenarioPack,
          messageHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Render engine error');
      }

      const data = await response.json();
      return data.output;
    } catch (err) {
      console.error('Error rendering output:', err);
      throw err;
    }
  }

  // Full command processing pipeline
  async processCommand(sessionId, command) {
    try {
      // Get current session state
      const session = await this.getSessionWithMessages(sessionId);
      if (!session) throw new Error('Session not found');

      // Add user message
      await this.addMessage(sessionId, 'user', command);

      // Process through state engine
      const stateUpdate = await this.processStateUpdate(
        command,
        session.world_state,
        session.current_episode,
        session.scenario_pack
      );

      // Apply state updates
      const newWorldState = this.applyStateDeltas(session.world_state, stateUpdate);

      // Render output
      const renderedOutput = await this.renderOutput(
        command,
        newWorldState,
        stateUpdate,
        session.current_episode,
        session.scenario_pack,
        session.messages
      );

      // Save assistant message
      await this.addMessage(sessionId, 'assistant', renderedOutput, 'kimi');

      // Update session with new state
      const updatedSession = await this.updateSession(sessionId, {
        world_state: newWorldState,
        current_episode: stateUpdate.episode_progress?.next_episode || session.current_episode
      });

      return {
        output: renderedOutput,
        stateUpdate,
        newWorldState,
        session: updatedSession
      };
    } catch (err) {
      console.error('Error processing command:', err);
      throw err;
    }
  }

  // Apply state deltas to world state
  applyStateDeltas(currentState, stateUpdate) {
    const newState = JSON.parse(JSON.stringify(currentState));

    // Apply meter deltas
    if (stateUpdate.state_deltas) {
      Object.entries(stateUpdate.state_deltas).forEach(([key, delta]) => {
        if (delta !== null && delta !== undefined) {
          if (typeof delta === 'number' && typeof newState.meters[key] === 'number') {
            newState.meters[key] = Math.max(0, Math.min(100, newState.meters[key] + delta));
          } else if (typeof delta === 'string') {
            newState.meters[key] = delta;
          }
        }
      });
    }

    // Add new entities
    if (stateUpdate.new_entities?.length > 0) {
      newState.entities = [...(newState.entities || []), ...stateUpdate.new_entities];
    }

    // Remove entities
    if (stateUpdate.removed_entities?.length > 0) {
      newState.entities = (newState.entities || []).filter(
        e => !stateUpdate.removed_entities.includes(e.id || e.name)
      );
    }

    // Add unlocks
    if (stateUpdate.unlocks?.length > 0) {
      newState.unlocks = [...new Set([...(newState.unlocks || []), ...stateUpdate.unlocks])];
    }

    // Advance time
    if (stateUpdate.time_advance) {
      newState.time = newState.time || { week: 1, day: 1 };
      newState.time.day += stateUpdate.time_advance.days || 0;
      newState.time.week += stateUpdate.time_advance.weeks || 0;
      while (newState.time.day > 7) {
        newState.time.day -= 7;
        newState.time.week += 1;
      }
    }

    return newState;
  }
}

export const worldSimApi = new WorldSimApi();
