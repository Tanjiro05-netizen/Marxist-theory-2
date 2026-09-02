import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SandpackCodeEditor, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';
import { Play, RotateCcw, Eye, EyeOff, Loader2 } from 'lucide-react';

const JS_STARTER = `<!DOCTYPE html>
<html>
<head>
  <title>Output</title>
  <style>
    body { font-family: monospace; padding: 1rem; color: #333; }
    #output { white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    // Use console.log to see output below
  </script>
</body>
</html>`;

const PYTHON_STARTER = `# Write your Python code here
print("Hello, World!")`;

const JAVASCRIPT_STYLES = {
  width: '100%',
  height: '100%',
  backgroundColor: '#1a1f2b',
  borderRadius: '0.5rem',
  border: '1px solid rgba(127, 29, 29, 0.3)',
};

const CodeSandboxBlock = ({ block }) => {
  const { language = 'javascript', starter_code, solution, instructions } = block;
  const isPython = language === 'python';

  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodide, setPyodide] = useState(null);
  const [pythonCode, setPythonCode] = useState(starter_code || PYTHON_STARTER);
  const [pythonOutput, setPythonOutput] = useState('');
  const [pythonRunning, setPythonRunning] = useState(false);
  const [jsCode, setJsCode] = useState(starter_code || JS_STARTER);
  const [showSolution, setShowSolution] = useState(false);

  const pyodideRef = useRef(null);

  // Load Pyodide
  useEffect(() => {
    if (!isPython) return;
    if (pyodideRef.current) return;

    let cancelled = false;
    const load = async () => {
      try {
        const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs');
        if (cancelled) return;
        const p = await loadPyodide({
          stdout: (text) => setPythonOutput((prev) => prev + text + '\n'),
          stderr: (text) => setPythonOutput((prev) => prev + '[err] ' + text + '\n'),
        });
        if (cancelled) return;
        pyodideRef.current = p;
        setPyodide(p);
        setPyodideReady(true);
      } catch (err) {
        console.error('Pyodide load error:', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isPython]);

  const runPython = useCallback(async () => {
    if (!pyodide) return;
    setPythonOutput('');
    setPythonRunning(true);
    try {
      await pyodide.loadPackagesFromImports(pythonCode).catch(() => {});
      await pyodide.runPythonAsync(pythonCode);
    } catch (err) {
      setPythonOutput((prev) => prev + '[error] ' + err.message + '\n');
    } finally {
      setPythonRunning(false);
    }
  }, [pyodide, pythonCode]);

  const resetCode = () => {
    if (isPython) {
      setPythonCode(starter_code || PYTHON_STARTER);
      setPythonOutput('');
    } else {
      setJsCode(starter_code || JS_STARTER);
    }
  };

  return (
    <div className="bg-black/40 rounded-none border border-gray-800 overflow-hidden">
      {instructions && (
        <div className="px-4 py-3 border-b border-gray-800 bg-red-950/10">
          <p className="text-gray-300 text-sm">{instructions}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row" style={{ minHeight: '420px' }}>
        {/* Editor */}
        <div className="flex-1 min-h-[220px]">
          {isPython ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-gray-800">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Python</span>
                <div className="flex items-center gap-2">
                  {!pyodideReady && (
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </span>
                  )}
                  <button
                    onClick={runPython}
                    disabled={!pyodideReady || pythonRunning}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </button>
                  <button
                    onClick={resetCode}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                className="flex-1 bg-[#0b0d12] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-0"
                spellCheck={false}
              />
            </div>
          ) : (
            <SandpackProvider
              template="static"
              files={{ '/index.html': { code: jsCode, active: true } }}
              options={{ visibleFiles: ['/index.html'] }}
              customSetup={{
                entry: '/index.html',
                environment: 'static',
              }}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-gray-800">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">JavaScript / HTML</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetCode}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <SandpackCodeEditor
                  showTabs={false}
                  showLineNumbers
                  showInlineErrors
                  style={JAVASCRIPT_STYLES}
                  wrapContent
                />
              </div>
            </SandpackProvider>
          )}
        </div>

        {/* Output / Preview */}
        <div className="flex-1 min-h-[200px] border-t lg:border-t-0 lg:border-l border-gray-800 bg-[#0b0d12]">
          {isPython ? (
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 bg-black/60 border-b border-gray-800 flex items-center gap-2">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Output</span>
              </div>
              <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
                {pythonOutput || (
                  <span className="text-gray-600 italic">Run your code to see output here</span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 bg-black/60 border-b border-gray-800 flex items-center gap-2">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Preview</span>
              </div>
              <div className="flex-1">
                <SandpackProvider
                  template="static"
                  files={{ '/index.html': { code: jsCode } }}
                  options={{ visibleFiles: ['/index.html'] }}
                >
                  <SandpackPreview
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: '#0b0d12',
                    }}
                  />
                </SandpackProvider>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Solution */}
      {solution && (
        <div className="border-t border-gray-800 bg-black/20">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showSolution ? (
              <>
                <EyeOff className="w-3 h-3" /> Hide Solution
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" /> Show Solution
              </>
            )}
          </button>
          {showSolution && (
            <div className="px-4 pb-4">
              <pre className="bg-black/60 p-3 rounded-none overflow-x-auto border border-gray-800">
                <code className="text-gray-300 text-sm font-mono">{solution}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeSandboxBlock;
