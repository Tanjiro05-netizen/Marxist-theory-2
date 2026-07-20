import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, ChevronDown, ChevronUp, ExternalLink, HelpCircle, Lightbulb, Play, X } from 'lucide-react';

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-6 mb-3 border-b border-gray-800 pb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 text-gray-300 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  code: ({ inline, children }) => inline
    ? <code className="bg-black/50 border border-gray-800 px-1.5 py-0.5 text-red-300 text-sm">{children}</code>
    : <pre className="bg-black/60 p-4 overflow-x-auto border border-gray-800"><code className="text-gray-300 text-sm">{children}</code></pre>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-red-800 pl-4 italic text-gray-400">{children}</blockquote>,
  table: ({ children }) => <table className="w-full border-collapse my-4">{children}</table>,
  th: ({ children }) => <th className="border border-gray-700 px-3 py-2 text-left text-white bg-black/40">{children}</th>,
  td: ({ children }) => <td className="border border-gray-700 px-3 py-2 text-gray-300">{children}</td>,
};

const renderMarkdown = (body) => (
  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
    {body || ''}
  </ReactMarkdown>
);

const normalizeAnswer = (value) => `${value || ''}`.trim().toLowerCase();

export const gradeScienceQuestion = (question, answer) => {
  if (!question) return false;
  if (question.question_type === 'numeric') {
    const expected = Number(question.correct_answer);
    const actual = Number(answer);
    const tolerance = Number(question.tolerance || 0);
    if (Number.isNaN(expected) || Number.isNaN(actual)) return false;
    return Math.abs(expected - actual) <= tolerance;
  }
  return normalizeAnswer(answer) === normalizeAnswer(question.correct_answer);
};

const ScienceQuestion = ({ question, label = 'Check understanding' }) => {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const correct = submitted && gradeScienceQuestion(question, answer);
  const options = question?.options || [];

  const submit = () => {
    if (!answer) return;
    setSubmitted(true);
  };

  return (
    <div className="border border-gray-800 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-3">
        <HelpCircle className="w-4 h-4" />
        {label}
      </div>
      <p className="text-white mb-4">{question?.prompt}</p>

      {question?.question_type === 'multiple_choice' || question?.question_type === 'true_false' ? (
        <div className="space-y-2">
          {(question.question_type === 'true_false' ? ['True', 'False'] : options).map((option) => {
            const selected = answer === option;
            const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(question.correct_answer);
            let stateClass = 'border-gray-800 bg-black/30 hover:border-gray-600';
            if (submitted && isCorrectOption) stateClass = 'border-green-900 bg-green-950/20';
            if (submitted && selected && !isCorrectOption) stateClass = 'border-red-900 bg-red-950/20';
            if (!submitted && selected) stateClass = 'border-red-900 bg-red-950/10';

            return (
              <button
                key={option}
                type="button"
                disabled={submitted}
                onClick={() => setAnswer(option)}
                className={`w-full text-left px-3 py-2 border text-gray-200 transition-colors ${stateClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type={question?.question_type === 'numeric' ? 'number' : 'text'}
          value={answer}
          disabled={submitted}
          onChange={(event) => setAnswer(event.target.value)}
          className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white focus:border-red-500 focus:outline-none"
          placeholder="Enter your answer"
        />
      )}

      {question?.hint && !submitted && (
        <button
          type="button"
          onClick={() => setShowHint((value) => !value)}
          className="mt-3 inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm"
        >
          <Lightbulb className="w-4 h-4" />
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
      )}
      {showHint && <p className="mt-2 text-gray-300 text-sm bg-black/40 border border-gray-800 p-3">{question.hint}</p>}

      <div className="mt-4 flex items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!answer}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
          >
            Check Answer
          </button>
        ) : (
          <div className={`inline-flex items-center gap-2 text-sm font-medium ${correct ? 'text-green-400' : 'text-red-400'}`}>
            {correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {correct ? 'Correct' : `Answer: ${question.correct_answer}`}
          </div>
        )}
        {submitted && (
          <button type="button" onClick={() => { setAnswer(''); setSubmitted(false); }} className="text-sm text-gray-400 hover:text-white">
            Try again
          </button>
        )}
      </div>

      {submitted && question?.explanation && (
        <div className="mt-4 border border-gray-800 bg-black/40 p-3 text-sm text-gray-300">
          {question.explanation}
        </div>
      )}
    </div>
  );
};

const WorkedExample = ({ block }) => {
  const [open, setOpen] = useState(false);
  const content = block.content_json || {};

  return (
    <div className="border border-gray-800 bg-black/30 p-5">
      <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Worked example</div>
      <p className="text-white font-medium mb-4">{content.problem || block.title}</p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {open ? 'Hide solution' : 'Reveal solution'}
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {(content.steps || []).map((step, index) => (
            <div key={`${step}-${index}`} className="flex gap-3 text-gray-300">
              <span className="text-gray-600 font-mono text-sm">{index + 1}</span>
              <div className="flex-1">{renderMarkdown(step)}</div>
            </div>
          ))}
          {content.answer && (
            <div className="border-t border-gray-800 pt-3 text-white">
              <span className="text-gray-400 font-medium">Answer: </span>{content.answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const videoEmbedUrl = (url) => {
  const match = `${url || ''}`.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const LabList = ({ title, items }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-gray-600">{title}</p>
    <ul className="mt-2 space-y-1">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="border-l border-gray-800 pl-2 text-sm text-gray-400">{item}</li>
      ))}
    </ul>
  </div>
);

const SimulationLab = ({ block }) => {
  const content = block?.content_json || {};
  const variables = content.variables || [];
  const tasks = content.tasks || [];
  const observations = content.observations || [];
  const [completedTasks, setCompletedTasks] = useState({});
  const [notes, setNotes] = useState({});
  const completedCount = tasks.filter((_, index) => completedTasks[index]).length;

  const toggleTask = (index) => {
    setCompletedTasks((current) => ({ ...current, [index]: !current[index] }));
  };

  const updateNote = (index, value) => {
    setNotes((current) => ({ ...current, [index]: value }));
  };

  return (
    <section className="border border-gray-800 bg-black/30 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
        <div>
          <p className="text-white font-medium">{block.title || 'Simulation lab'}</p>
          {content.caption && <p className="text-gray-500 text-sm">{content.caption}</p>}
        </div>
        {content.url && (
          <a href={content.url} target="_blank" rel="noreferrer" className="text-purple-300 hover:text-purple-200">
            <ExternalLink className="w-4 h-4 text-gray-500 hover:text-white" />
          </a>
        )}
      </div>

      {(content.prompt || content.setup || variables.length > 0) && (
        <div className="border-b border-gray-800 bg-black/25 p-4">
          {content.prompt && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-600">Investigation</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-300">{content.prompt}</p>
            </div>
          )}
          {content.setup && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-600">Setup</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-300">{content.setup}</p>
            </div>
          )}
          {variables.length > 0 && <LabList title="Variables / Controls" items={variables} />}
        </div>
      )}

      {content.url ? (
        <iframe src={content.url} title={block.title || 'Simulation'} className="w-full h-[420px] bg-black" allowFullScreen />
      ) : (
        <div className="p-6 text-gray-500">Missing simulation URL</div>
      )}

      {(tasks.length > 0 || observations.length > 0) && (
        <div className="border-t border-gray-800 bg-black/35 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-white font-medium">Lab notebook</p>
              <p className="text-sm text-gray-600">Use this while running the simulation.</p>
            </div>
            {tasks.length > 0 && (
              <span className="border border-gray-800 bg-black/40 px-2 py-1 text-xs text-gray-400">
                {completedCount}/{tasks.length} tasks checked
              </span>
            )}
          </div>

          {tasks.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">Task checklist</p>
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <label key={`${task}-${index}`} className="flex items-start gap-3 border border-gray-800 bg-black/25 p-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={Boolean(completedTasks[index])}
                      onChange={() => toggleTask(index)}
                      className="mt-1"
                    />
                    <span className={completedTasks[index] ? 'text-gray-500 line-through' : 'text-gray-300'}>{task}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {observations.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">Observation responses</p>
              <div className="space-y-3">
                {observations.map((prompt, index) => (
                  <label key={`${prompt}-${index}`} className="block border border-gray-800 bg-black/25 p-3">
                    <span className="block text-sm text-gray-300">{prompt}</span>
                    <textarea
                      value={notes[index] || ''}
                      onChange={(event) => updateNote(index, event.target.value)}
                      rows={3}
                      className="mt-2 w-full border border-gray-800 bg-black/45 p-2 text-sm text-white outline-none focus:border-red-700"
                      placeholder="Write your observation here..."
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export const ScienceBlockRenderer = ({ block, questionsById = {} }) => {
  const content = block?.content_json || {};
  const type = block?.block_type;

  if (type === 'rich_text') {
    return <section className="border border-gray-800 bg-black/35 p-5">{renderMarkdown(content.body)}</section>;
  }

  if (type === 'math') {
    return (
      <section className="border border-gray-800 bg-black/30 p-5">
        <div className="text-gray-500 text-xs uppercase tracking-wide mb-3">Math note</div>
        {renderMarkdown(content.body)}
      </section>
    );
  }

  if (type === 'worked_example') {
    return <WorkedExample block={block} />;
  }

  if (type === 'video') {
    const embed = videoEmbedUrl(content.url);
    return (
      <section className="border border-gray-800 bg-black/35 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2 text-white font-medium">
          <Play className="w-4 h-4 text-red-400" />
          {block.title || 'Video'}
        </div>
        {embed ? (
          <iframe src={embed} title={block.title || 'Video'} allowFullScreen className="w-full aspect-video bg-black" />
        ) : (
          <video src={content.url} controls className="w-full aspect-video bg-black" />
        )}
        {content.transcript && <div className="p-4 text-sm text-gray-400 border-t border-gray-800">{content.transcript}</div>}
      </section>
    );
  }

  if (type === 'simulation_embed') {
    return <SimulationLab block={block} />;
  }

  if (type === 'exercise') {
    const question = content.inline_question || questionsById[content.question_id];
    return question ? <ScienceQuestion question={question} label={block.title || 'Check understanding'} /> : (
      <section className="border border-gray-800 bg-black/30 p-5 text-gray-400">Exercise question is not connected yet.</section>
    );
  }

  if (type === 'quiz') {
    return (
      <section className="border border-gray-800 bg-black/30 p-5">
        <p className="text-white font-medium">{block.title || 'Checkpoint quiz'}</p>
        <p className="text-gray-500 text-sm mt-1">Open the course checkpoint to complete this quiz.</p>
      </section>
    );
  }

  if (type === 'callout') {
    const variants = {
      warning: 'border-yellow-900/40 bg-black/30 text-gray-200',
      theorem: 'border-gray-700 bg-black/30 text-gray-200',
      definition: 'border-gray-700 bg-black/30 text-gray-200',
      mistake: 'border-red-900/40 bg-black/30 text-gray-200',
      intuition: 'border-gray-700 bg-black/30 text-gray-200',
    };
    const variant = content.variant || 'intuition';
    return (
      <section className={`border p-5 ${variants[variant] || variants.intuition}`}>
        <p className="uppercase tracking-wide text-xs opacity-70 mb-2">{variant}</p>
        {renderMarkdown(content.body)}
      </section>
    );
  }

  if (type === 'image') {
    return (
      <figure className="border border-gray-800 bg-black/35 p-3">
        {content.url ? <img src={content.url} alt={content.alt || content.caption || ''} className="w-full object-contain max-h-[520px]" /> : null}
        {content.caption && <figcaption className="text-gray-500 text-sm mt-3">{content.caption}</figcaption>}
      </figure>
    );
  }

  return <section className="border border-gray-800 bg-black/35 p-5 text-gray-500">Unsupported block type: {type}</section>;
};

export default ScienceBlockRenderer;
