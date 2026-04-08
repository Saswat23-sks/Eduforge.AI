import React, { useState } from 'react';
import { generateCustomLecture } from '../services/gemini';
import { Sparkles, Clock, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

export default function CustomCourseGenerator() {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState('beginner');
  const [tone, setTone] = useState('academic');
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ lecture: string; estimated_duration: string; depth_applied: string; tone_used: string } | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
      const data = await generateCustomLecture(topic, depth, tone, duration);
      setResult(data);
    } catch (error) {
      console.error('Failed to generate custom lecture:', error);
      alert('Failed to generate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold">Custom Course Generator</h2>
          </div>
          <p className="text-slate-400">Generate tailored lecture content based on your specific constraints.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Topic or Concept</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quantum Entanglement, French Revolution, React Hooks"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Depth Level</label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="beginner">Beginner (Foundational)</option>
                <option value="intermediate">Intermediate (Conceptual)</option>
                <option value="advanced">Advanced (Technical)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="academic">Academic (Formal)</option>
                <option value="conversational">Conversational (Engaging)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Duration (Minutes)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="w-12 text-center font-bold text-slate-900">{duration}m</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !topic}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Tailored Content...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Custom Lecture
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              <Clock className="w-4 h-4 text-indigo-500" />
              {result.estimated_duration}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              {result.depth_applied}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              {result.tone_used}
            </div>
          </div>
          <div className="p-8 prose prose-slate max-w-none">
            <Markdown>{result.lecture}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
