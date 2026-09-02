import React, { useState, useEffect } from 'react';
import { studyApiService } from '../api/study';
import { 
  X, Save, Loader2, Plus, Trash2, ChevronDown, ChevronRight,
  GitBranch, Flag, AlertTriangle, Link, Unlink
} from 'lucide-react';

const NODE_TYPES = [
  { value: 'start', label: 'Start Node', icon: '🚀' },
  { value: 'story', label: 'Story Node', icon: '📖' },
  { value: 'choice', label: 'Choice Node', icon: '🔀' },
  { value: 'ending', label: 'Ending Node', icon: '🏁' }
];

const ENDING_TYPES = [
  { value: 'victory', label: 'Victory', color: 'text-green-400' },
  { value: 'partial', label: 'Partial Victory', color: 'text-yellow-400' },
  { value: 'defeat', label: 'Defeat', color: 'text-red-400' }
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' }
];

const ScenarioEditor = ({ scenario, onSave, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Scenario form
  const [form, setForm] = useState({
    title: '',
    description: '',
    setting: '',
    era: '',
    difficulty: 'medium',
    xp_reward: 50,
    estimated_minutes: 10,
    is_active: true
  });

  // Nodes and choices
  const [nodes, setNodes] = useState([]);
  const [expandedNode, setExpandedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editingChoice, setEditingChoice] = useState(null);

  useEffect(() => {
    if (scenario) {
      loadScenario();
    }
  }, [scenario]);

  const loadScenario = async () => {
    if (!scenario?.id) return;
    
    setLoading(true);
    try {
      const data = await studyApiService.getScenarioWithNodes(scenario.id);
      setForm({
        title: data.title || '',
        description: data.description || '',
        setting: data.setting || '',
        era: data.era || '',
        difficulty: data.difficulty || 'medium',
        xp_reward: data.xp_reward || 50,
        estimated_minutes: data.estimated_minutes || 10,
        is_active: data.is_active !== false
      });
      setNodes(data.nodes || []);
    } catch (err) {
      console.error('Error loading scenario:', err);
    }
    setLoading(false);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    try {
      let savedScenario;
      if (scenario?.id) {
        savedScenario = await studyApiService.updateScenario(scenario.id, form);
      } else {
        savedScenario = await studyApiService.createScenario(form);
      }
      onSave?.(savedScenario);
    } catch (err) {
      console.error('Error saving scenario:', err);
    }
    setSaving(false);
  };

  const handleAddNode = async (type) => {
    if (!scenario?.id) {
      alert('Please save the scenario first before adding nodes.');
      return;
    }

    try {
      const newNode = await studyApiService.createScenarioNode(scenario.id, {
        node_type: type,
        title: `New ${type} node`,
        content: 'Enter your narrative text here...',
        is_start: type === 'start' && nodes.filter(n => n.is_start).length === 0,
        order_index: nodes.length
      });
      setNodes(prev => [...prev, { ...newNode, choices: [] }]);
      setExpandedNode(newNode.id);
      setEditingNode(newNode);
    } catch (err) {
      console.error('Error creating node:', err);
    }
  };

  const handleUpdateNode = async (nodeId, updates) => {
    try {
      await studyApiService.updateScenarioNode(nodeId, updates);
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
      setEditingNode(null);
    } catch (err) {
      console.error('Error updating node:', err);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Delete this node and all its choices?')) return;
    
    try {
      await studyApiService.deleteScenarioNode(nodeId);
      setNodes(prev => prev.filter(n => n.id !== nodeId));
    } catch (err) {
      console.error('Error deleting node:', err);
    }
  };

  const handleAddChoice = async (nodeId) => {
    try {
      const newChoice = await studyApiService.createScenarioChoice(nodeId, {
        choice_text: 'New choice...',
        order_index: (nodes.find(n => n.id === nodeId)?.choices?.length || 0)
      });
      setNodes(prev => prev.map(n => 
        n.id === nodeId 
          ? { ...n, choices: [...(n.choices || []), newChoice] }
          : n
      ));
      setEditingChoice(newChoice);
    } catch (err) {
      console.error('Error creating choice:', err);
    }
  };

  const handleUpdateChoice = async (choiceId, updates) => {
    try {
      await studyApiService.updateScenarioChoice(choiceId, updates);
      setNodes(prev => prev.map(n => ({
        ...n,
        choices: n.choices?.map(c => c.id === choiceId ? { ...c, ...updates } : c)
      })));
      setEditingChoice(null);
    } catch (err) {
      console.error('Error updating choice:', err);
    }
  };

  const handleDeleteChoice = async (nodeId, choiceId) => {
    try {
      await studyApiService.deleteScenarioChoice(choiceId);
      setNodes(prev => prev.map(n => 
        n.id === nodeId 
          ? { ...n, choices: n.choices?.filter(c => c.id !== choiceId) }
          : n
      ));
    } catch (err) {
      console.error('Error deleting choice:', err);
    }
  };

  const getNodeTypeInfo = (type) => NODE_TYPES.find(t => t.value === type) || NODE_TYPES[1];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-none w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">
            {scenario?.id ? 'Edit Scenario' : 'Create New Scenario'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-none transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-red-400 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'nodes'
                ? 'text-red-400 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={!scenario?.id}
          >
            Story Nodes ({nodes.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="The Homestead Strike of 1892"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
                  rows={2}
                  placeholder="A brief description of the scenario"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Historical Setting</label>
                  <input
                    type="text"
                    value={form.setting}
                    onChange={(e) => handleFormChange('setting', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    placeholder="Pennsylvania Steel Mills"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Era/Year</label>
                  <input
                    type="text"
                    value={form.era}
                    onChange={(e) => handleFormChange('era', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    placeholder="1892"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => handleFormChange('difficulty', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">XP Reward</label>
                  <input
                    type="number"
                    value={form.xp_reward}
                    onChange={(e) => handleFormChange('xp_reward', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    min={10}
                    max={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    value={form.estimated_minutes}
                    onChange={(e) => handleFormChange('estimated_minutes', parseInt(e.target.value) || 5)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    min={5}
                    max={60}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => handleFormChange('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Active (visible to users)
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Node Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Add:</span>
                {NODE_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleAddNode(type.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-none text-sm transition-colors"
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Warning if no start node */}
              {nodes.length > 0 && !nodes.some(n => n.is_start) && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-none flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  No start node defined. Mark one node as the start.
                </div>
              )}

              {/* Nodes List */}
              <div className="space-y-2">
                {nodes.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No nodes yet. Add a start node to begin building your scenario.
                  </p>
                ) : (
                  nodes.map((node, index) => {
                    const typeInfo = getNodeTypeInfo(node.node_type);
                    const isExpanded = expandedNode === node.id;
                    
                    return (
                      <div key={node.id} className="bg-gray-800/50 border border-gray-700 rounded-none overflow-hidden">
                        {/* Node Header */}
                        <div className="flex items-center p-3">
                          <button
                            onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors mr-2"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </button>
                          
                          <span className="text-lg mr-2">{typeInfo.icon}</span>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white truncate">{node.title || 'Untitled'}</span>
                              {node.is_start && (
                                <span className="text-[10px] bg-green-600/30 text-green-400 px-1.5 py-0.5 rounded">START</span>
                              )}
                              {node.node_type === 'ending' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  node.ending_type === 'victory' ? 'bg-green-600/30 text-green-400' :
                                  node.ending_type === 'partial' ? 'bg-yellow-600/30 text-yellow-400' :
                                  'bg-red-600/30 text-red-400'
                                }`}>
                                  {node.ending_type?.toUpperCase() || 'ENDING'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{node.content?.substring(0, 60)}...</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 mr-2">
                              {node.choices?.length || 0} choices
                            </span>
                            <button
                              onClick={() => setEditingNode(node)}
                              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                            >
                              <GitBranch className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="p-1.5 hover:bg-red-600/30 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-700 p-3 bg-gray-900/50 space-y-3">
                            {/* Choices */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-400">Choices</span>
                                <button
                                  onClick={() => handleAddChoice(node.id)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Choice
                                </button>
                              </div>
                              
                              {node.choices?.length > 0 ? (
                                <div className="space-y-2">
                                  {node.choices.map((choice, ci) => (
                                    <div key={choice.id} className="flex items-start gap-2 p-2 bg-gray-800 rounded">
                                      <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                                        {String.fromCharCode(65 + ci)}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">{choice.choice_text}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs">
                                          {choice.next_node_id ? (
                                            <span className="text-green-400 flex items-center gap-1">
                                              <Link className="w-3 h-3" />
                                              Linked
                                            </span>
                                          ) : (
                                            <span className="text-gray-500 flex items-center gap-1">
                                              <Unlink className="w-3 h-3" />
                                              No link
                                            </span>
                                          )}
                                          {choice.is_historically_accurate && (
                                            <span className="text-yellow-400">★ Historical</span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => setEditingChoice(choice)}
                                        className="p-1 hover:bg-gray-700 rounded"
                                      >
                                        <GitBranch className="w-3 h-3 text-gray-400" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteChoice(node.id, choice.id)}
                                        className="p-1 hover:bg-red-600/30 rounded"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 italic">No choices yet</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-none transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveScenario}
            disabled={saving || !form.title}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-none transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {scenario?.id ? 'Update Scenario' : 'Create Scenario'}
          </button>
        </div>

        {/* Node Editor Modal */}
        {editingNode && (
          <NodeEditorModal
            node={editingNode}
            nodes={nodes}
            onSave={(updates) => handleUpdateNode(editingNode.id, updates)}
            onClose={() => setEditingNode(null)}
          />
        )}

        {/* Choice Editor Modal */}
        {editingChoice && (
          <ChoiceEditorModal
            choice={editingChoice}
            nodes={nodes}
            onSave={(updates) => handleUpdateChoice(editingChoice.id, updates)}
            onClose={() => setEditingChoice(null)}
          />
        )}
      </div>
    </div>
  );
};

// Node Editor Modal
const NodeEditorModal = ({ node, nodes, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: node.title || '',
    content: node.content || '',
    node_type: node.node_type || 'story',
    is_start: node.is_start || false,
    ending_type: node.ending_type || null,
    ending_insight: node.ending_insight || '',
    image_url: node.image_url || ''
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-none w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-bold text-white">Edit Node</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-none">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Node Type</label>
              <select
                value={form.node_type}
                onChange={(e) => setForm(prev => ({ ...prev, node_type: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {NODE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>

            {form.node_type === 'ending' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ending Type</label>
                <select
                  value={form.ending_type || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, ending_type: e.target.value || null }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select...</option>
                  {ENDING_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {form.node_type === 'ending' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Historical Insight</label>
              <textarea
                value={form.ending_insight}
                onChange={(e) => setForm(prev => ({ ...prev, ending_insight: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
                rows={3}
                placeholder="What actually happened in history..."
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_start"
              checked={form.is_start}
              onChange={(e) => setForm(prev => ({ ...prev, is_start: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-red-500"
            />
            <label htmlFor="is_start" className="text-sm text-gray-300">
              This is the starting node
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-none transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-none transition-colors"
          >
            Save Node
          </button>
        </div>
      </div>
    </div>
  );
};

// Choice Editor Modal
const ChoiceEditorModal = ({ choice, nodes, onSave, onClose }) => {
  const [form, setForm] = useState({
    choice_text: choice.choice_text || '',
    next_node_id: choice.next_node_id || '',
    consequence_preview: choice.consequence_preview || '',
    is_historically_accurate: choice.is_historically_accurate || false,
    concept_demonstrated: choice.concept_demonstrated || ''
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-none w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-bold text-white">Edit Choice</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-none">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Choice Text *</label>
            <textarea
              value={form.choice_text}
              onChange={(e) => setForm(prev => ({ ...prev, choice_text: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
              rows={2}
              placeholder="What the player sees as the choice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Links to Node</label>
            <select
              value={form.next_node_id || ''}
              onChange={(e) => setForm(prev => ({ ...prev, next_node_id: e.target.value || null }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
            >
              <option value="">No link (dead end)</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.title || 'Untitled'} ({n.node_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Consequence Preview (hint)</label>
            <input
              type="text"
              value={form.consequence_preview}
              onChange={(e) => setForm(prev => ({ ...prev, consequence_preview: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
              placeholder="Optional hint about outcome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Concept Demonstrated</label>
            <input
              type="text"
              value={form.concept_demonstrated}
              onChange={(e) => setForm(prev => ({ ...prev, concept_demonstrated: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
              placeholder="e.g., Class solidarity, Individual action"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="historical"
              checked={form.is_historically_accurate}
              onChange={(e) => setForm(prev => ({ ...prev, is_historically_accurate: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-yellow-500"
            />
            <label htmlFor="historical" className="text-sm text-gray-300">
              Historically accurate choice (bonus XP)
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-none transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-none transition-colors"
          >
            Save Choice
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioEditor;
