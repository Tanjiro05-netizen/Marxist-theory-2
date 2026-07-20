import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { studyApiService } from '../../components/Knowledge/api/study';
import ScenarioEditor from '../../components/Knowledge/Admin/ScenarioEditor';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, 
  Loader2, AlertTriangle, BookOpen, Clock, Target, Flame,
  RefreshCw, GitBranch
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  expert: 'text-red-400'
};

const ScenarioAdminPage = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studyApiService.getAllScenariosAdmin();
      setScenarios(data);
    } catch (err) {
      setError('Failed to load scenarios');
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleCreate = () => {
    setEditingScenario(null);
    setShowEditor(true);
  };

  const handleEdit = (scenario) => {
    setEditingScenario(scenario);
    setShowEditor(true);
  };

  const handleSave = async (savedScenario) => {
    setShowEditor(false);
    setEditingScenario(null);
    await fetchScenarios();
  };

  const handleDelete = async (scenarioId) => {
    try {
      await studyApiService.deleteScenario(scenarioId);
      setDeleteConfirm(null);
      await fetchScenarios();
    } catch (err) {
      console.error('Failed to delete scenario:', err);
      setError('Failed to delete scenario');
    }
  };

  const handleToggleActive = async (scenario) => {
    try {
      await studyApiService.updateScenario(scenario.id, { is_active: !scenario.is_active });
      await fetchScenarios();
    } catch (err) {
      console.error('Failed to toggle scenario:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-purple-400" />
              Scenario Management
            </h1>
            <p className="text-gray-400 mt-1">Create interactive historical scenarios (Choose Your Own Adventure)</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchScenarios}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Scenario
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No scenarios found.</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              Create Your First Scenario
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(scenario => (
              <div 
                key={scenario.id} 
                className={`bg-gray-800/50 border rounded-xl overflow-hidden ${
                  scenario.is_active ? 'border-gray-700' : 'border-gray-800 opacity-60'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{scenario.title}</h3>
                      {scenario.setting && (
                        <p className="text-sm text-gray-500">{scenario.setting} {scenario.era && `(${scenario.era})`}</p>
                      )}
                    </div>
                    {!scenario.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  {scenario.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{scenario.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{scenario.estimated_minutes} min
                    </span>
                    <span className={`flex items-center gap-1 ${DIFFICULTY_COLORS[scenario.difficulty]}`}>
                      <Target className="w-3.5 h-3.5" />
                      {scenario.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-3.5 h-3.5" />
                      {scenario.xp_reward} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(scenario)}
                      className={`p-2 rounded-lg transition-colors ${
                        scenario.is_active
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                      title={scenario.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {scenario.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(scenario)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Scenario
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(scenario)}
                      className="p-2 bg-gray-700 hover:bg-red-600/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showEditor && (
        <ScenarioEditor
          scenario={editingScenario}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingScenario(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-600/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Scenario?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete <strong className="text-white">{deleteConfirm.title}</strong>? 
              This will also delete all story nodes and choices. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioAdminPage;
