import React from 'react';
import { StoryBeat } from '../types';
import { User } from 'lucide-react';

interface PoseEditorProps {
  beats: StoryBeat[];
}

const PoseEditor: React.FC<PoseEditorProps> = ({ beats }) => {
  return (
    <div className="h-full w-full bg-[#0b1221] text-slate-200 flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6 animate-fade-in-up">
        <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-slate-700 shadow-xl">
          <User className="w-10 h-10 text-indigo-400" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-serif font-bold text-slate-100">Character Pose Editor</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            {beats.length > 0 
              ? `Ready to design poses for ${beats.length} narrative beats.` 
              : "Analyze a story in the Analyzer tab to generate beats for posing."}
          </p>
        </div>

        {beats.length > 0 ? (
          <div className="p-6 bg-slate-900/80 rounded-xl border border-slate-800 text-sm text-slate-500 backdrop-blur-sm">
            <p>Select a beat to begin defining character composition and blocking.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {beats.slice(0, 3).map(beat => (
                    <span key={beat.id} className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400">
                        Beat {beat.id}
                    </span>
                ))}
                {beats.length > 3 && <span className="text-xs text-slate-600 self-center">...</span>}
            </div>
          </div>
        ) : (
            <div className="p-4 rounded-lg bg-indigo-900/10 border border-indigo-500/20 text-indigo-300/80 text-sm">
                Go to the Analyzer tab to start your project.
            </div>
        )}
      </div>
    </div>
  );
};

export default PoseEditor;