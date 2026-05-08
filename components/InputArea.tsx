import React, { useRef, useState } from 'react';
import { BookOpen, Sparkles, Upload, FileJson, X, Edit2, FileText, Loader2, Zap } from 'lucide-react';
import { AnalysisStatus, StoryBible } from '../types';
import ContextEditor from './ContextEditor';
import { extractTextFromPdf } from '../services/pdfService';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onMegaAnalyze?: () => void;
  status: AnalysisStatus;
  onImportContext: (file: File) => void;
  previousBible: StoryBible | null;
  onClearContext: () => void;
  onUpdateContext: (bible: StoryBible) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  value, 
  onChange, 
  onAnalyze, 
  onMegaAnalyze,
  status, 
  onImportContext,
  previousBible,
  onClearContext,
  onUpdateContext
}) => {
  const isAnalyzing = status === AnalysisStatus.ANALYZING;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  // Handle JSON Context Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportContext(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle PDF Text Import
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPdf(true);
      try {
        const text = await extractTextFromPdf(file);
        onChange(text);
      } catch (error) {
        console.error(error);
        alert("Failed to parse PDF. Please try copying the text manually.");
      } finally {
        setIsProcessingPdf(false);
      }
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-slate-700/50">
      <div className="p-6 border-b border-slate-700/50 bg-slate-900/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <label htmlFor="story-input" className="text-lg font-bold text-slate-200 flex items-center gap-2 font-serif tracking-tight">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>Source Text</span>
        </label>
        <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
          {isProcessingPdf ? 'Reading PDF...' : `${value.length} chars`}
        </span>
      </div>
      
      <div className="flex-1 relative flex flex-col">
        {/* Context Indicator */}
        {previousBible && (
          <div className="mx-6 mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg flex items-center justify-between animate-fade-in-up">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium">
              <FileJson className="w-4 h-4" />
              <span>Previous Bible Context Loaded</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEditor(true)}
                className="p-1.5 hover:bg-indigo-900/40 rounded-lg transition-colors text-indigo-300 hover:text-white"
                title="Edit context"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={onClearContext}
                className="p-1.5 hover:bg-indigo-900/40 rounded-lg transition-colors text-indigo-400 hover:text-red-400"
                title="Remove context"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="relative flex-1 flex flex-col">
           {isProcessingPdf && (
             <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex items-center justify-center">
               <div className="flex flex-col items-center gap-2 text-primary">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <span className="text-sm font-medium">Extracting text from PDF...</span>
               </div>
             </div>
           )}
           <textarea
            id="story-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your story text here... (e.g., Chapter 2)"
            className="w-full flex-1 p-6 bg-transparent text-slate-300 placeholder-slate-600 focus:outline-none resize-none font-serif leading-relaxed text-lg custom-scrollbar"
            disabled={isAnalyzing || isProcessingPdf}
            style={{ border: 'none' }}
          />
        </div>
      </div>

      <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 sticky bottom-0 z-10 space-y-3">
        <div className="flex flex-wrap gap-2">
           {/* Hidden File Inputs */}
           <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <input 
              type="file" 
              ref={pdfInputRef}
              onChange={handlePdfChange}
              accept=".pdf"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing || isProcessingPdf}
              className="flex items-center justify-center gap-2 px-3 py-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:border-slate-600 w-14 sm:w-auto"
              title="Import a previously downloaded Story Bible JSON file."
            >
              <FileJson className="w-5 h-5" />
            </button>

            <button
              onClick={() => pdfInputRef.current?.click()}
              disabled={isAnalyzing || isProcessingPdf}
              className="flex items-center justify-center gap-2 px-3 py-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:border-slate-600 w-14 sm:w-auto"
              title="Upload PDF text."
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              onClick={onAnalyze}
              disabled={!value.trim() || isAnalyzing || isProcessingPdf}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold transition-all shadow-lg
                ${!value.trim() || isAnalyzing || isProcessingPdf
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'}
              `}
              title="Generate basic beats and story bible"
            >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span className="hidden sm:inline">Analyze</span>
            </button>

            {onMegaAnalyze && (
                <button
                    onClick={onMegaAnalyze}
                    disabled={!value.trim() || isAnalyzing || isProcessingPdf}
                    className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold transition-all shadow-lg
                        ${!value.trim() || isAnalyzing || isProcessingPdf
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                        : 'bg-gradient-to-r from-primary to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-slate-900 border border-indigo-400'}
                    `}
                    title="Generate Beats, Bible, Extract Source, and Direct Poses/Camera/VFX in one go."
                >
                     {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-slate-900" />}
                     <span>Mega Generate</span>
                </button>
            )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && previousBible && (
        <ContextEditor 
          initialData={previousBible} 
          onSave={onUpdateContext} 
          onClose={() => setShowEditor(false)} 
        />
      )}
    </div>
  );
};

export default InputArea;