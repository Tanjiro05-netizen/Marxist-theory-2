import React, { useState, useRef, useEffect } from 'react';
import { Bot, HelpCircle, Plus, Save, Trash2, X, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './worldsim.css';

const Terminal = ({ 
  output, 
  onCommand, 
  isLoading, 
  sessionTitle,
  onNewSession,
  onSaveSession,
  onShowHelp,
  showHelp,
  onCloseHelp
}) => {
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showMarxBotTooltip, setShowMarxBotTooltip] = useState(false);
  const router = useRouter();
  const [customInput, setCustomInput] = useState('');
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const customInputRef = useRef(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus custom input when modal opens
  useEffect(() => {
    if (showCustomModal) {
      customInputRef.current?.focus();
    }
  }, [showCustomModal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const command = inputValue.trim();
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    setInputValue('');
    onCommand(command);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim() || isLoading) return;
    const action = customInput.trim();
    setCommandHistory(prev => [...prev, action]);
    setCustomInput('');
    setShowCustomModal(false);
    onCommand(action);
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomModal(false);
      setCustomInput('');
    }
  };

  return (
    <div className="worldsim-terminal h-full flex flex-col">
      {/* Header */}
      <div className="worldsim-header">
        <div className="worldsim-title">
          MARX_SIM {sessionTitle && `// ${sessionTitle}`}
        </div>
        <div className="worldsim-controls">
          <button 
            className="worldsim-btn" 
            onClick={onNewSession}
            title="New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            className="worldsim-btn" 
            onClick={onSaveSession}
            title="Save Session"
          >
            <Save className="w-4 h-4" />
          </button>
          <button 
            className="worldsim-btn" 
            onClick={onShowHelp}
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="relative flex items-center gap-2 ml-2 pl-2 border-l border-phosphor/20">
            <Bot className="w-4 h-4 text-phosphor-dim" />
            <button
              onClick={() => {
                setShowMarxBotTooltip(true);
                setTimeout(() => setShowMarxBotTooltip(false), 2000);
              }}
              className="relative w-9 h-5 rounded-full transition-colors duration-200 bg-gray-700"
              title="MarxBot — Coming Soon"
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 translate-x-0 bg-gray-400"
              />
            </button>
            <button
              onClick={() => router.push('/marxbot')}
              className="flex items-center gap-1 text-xs text-phosphor-dim hover:text-phosphor font-mono whitespace-nowrap transition-colors"
              title="Open MarxBot page"
            >
              MarxBot
              <ExternalLink className="w-3 h-3" />
            </button>
            {showMarxBotTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-black border border-phosphor/30 rounded text-xs text-phosphor font-mono whitespace-nowrap z-50">
                MarxBot — Coming Soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Output area */}
      <div className="worldsim-output flex-1" ref={outputRef}>
        {output.map((block, index) => (
          <OutputBlock key={index} block={block} />
        ))}
        {isLoading && (
          <div className="worldsim-loading">
            <span>Processing</span>
            <div className="worldsim-loading-dots">
              <span className="worldsim-loading-dot"></span>
              <span className="worldsim-loading-dot"></span>
              <span className="worldsim-loading-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="worldsim-input-container">
        <span className="worldsim-prompt">marx_sim&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="worldsim-input"
          placeholder={isLoading ? 'Processing...' : 'Enter command...'}
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />
        {!isLoading && <span className="worldsim-cursor"></span>}
        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          disabled={isLoading}
          className="worldsim-custom-btn"
        >
          Custom
        </button>
      </form>

      {/* Custom Action Modal */}
      {showCustomModal && (
        <div className="worldsim-modal-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="worldsim-custom-modal" onClick={e => e.stopPropagation()}>
            <div className="worldsim-modal-header">&gt; CUSTOM_ACTION</div>
            <div className="worldsim-modal-divider"></div>
            <div className="worldsim-modal-body">
              <p className="worldsim-modal-hint">
                Describe any action. The simulation will<br />
                interpret and respond accordingly.
              </p>
              <div className="worldsim-modal-input-wrapper">
                <span className="worldsim-modal-prompt">&gt;</span>
                <textarea
                  ref={customInputRef}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  className="worldsim-modal-textarea"
                  placeholder="Tell Marx I am from the future..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="worldsim-modal-footer">
              <span className="worldsim-modal-key">[ESC: cancel]</span>
              <span className="worldsim-modal-key">[ENTER: execute]</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="worldsim-help">
          <div className="flex justify-between items-center mb-2">
            <span className="worldsim-help-title">COMMANDS</span>
            <button onClick={onCloseHelp} className="text-phosphor-dim hover:text-phosphor">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">help</span>
            <span className="worldsim-help-cmd-desc">Show help</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">create universe</span>
            <span className="worldsim-help-cmd-desc">Init world</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">create &lt;entity&gt;</span>
            <span className="worldsim-help-cmd-desc">Create entity</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">query &lt;x&gt;</span>
            <span className="worldsim-help-cmd-desc">Inspect</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">evolve &lt;n&gt;</span>
            <span className="worldsim-help-cmd-desc">Fast-forward</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">talk marx</span>
            <span className="worldsim-help-cmd-desc">Dialogue</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">set &lt;p&gt; &lt;v&gt;</span>
            <span className="worldsim-help-cmd-desc">Set param</span>
          </div>
          <div className="worldsim-help-cmd">
            <span className="worldsim-help-cmd-name">save</span>
            <span className="worldsim-help-cmd-desc">Save session</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Output block component
const OutputBlock = ({ block }) => {
  if (block.type === 'command') {
    return (
      <div className="worldsim-block">
        <span className="text-phosphor-dim">marx_sim&gt; </span>
        <span className="text-phosphor">{block.content}</span>
      </div>
    );
  }

  if (block.type === 'system') {
    return (
      <div className="worldsim-block text-phosphor-dim text-sm">
        {block.content}
      </div>
    );
  }

  if (block.type === 'error') {
    return (
      <div className="worldsim-block text-danger">
        ERROR: {block.content}
      </div>
    );
  }

  // Default: render as preformatted text
  return (
    <div className="worldsim-block">
      <pre className="text-phosphor whitespace-pre-wrap text-sm leading-relaxed">
        {block.content}
      </pre>
    </div>
  );
};

export default Terminal;
