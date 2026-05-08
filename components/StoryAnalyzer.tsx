import React, { useState } from 'react';
import { Feather, AlertCircle, Layout, Book, Paintbrush, Zap } from 'lucide-react';
import InputArea from './InputArea';
import BeatList from './BeatList';
import BibleView from './BibleView';
import { AnalysisResult, AnalysisStatus, StoryBible, StoryBeat, CharacterPose, CameraShot, VFXData } from '../types';
import { ART_STYLES, extractSourceText, analyzeText, generatePoses, generateCameraShots, generateVFX } from '../services/geminiService';

interface StoryAnalyzerProps {
  inputText: string;
  setInputText: (text: string) => void;
  result: AnalysisResult | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  onAnalyze: () => void;
  onImportContext: (file: File) => void;
  previousBible: StoryBible | null;
  onClearContext: () => void;
  onUpdateContext: (bible: StoryBible) => void;
  onUpdateResultBible: (bible: StoryBible) => void;
  onUpdateBeats: (beats: StoryBeat[]) => void;
  onNavigateToLab: () => void;
  analysisProgress: number;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
}

const StoryAnalyzer: React.FC<StoryAnalyzerProps> = ({
  inputText,
  setInputText,
  result,
  status,
  errorMessage,
  onAnalyze,
  onImportContext,
  previousBible,
  onClearContext,
  onUpdateContext,
  onUpdateResultBible,
  onUpdateBeats,
  onNavigateToLab,
  analysisProgress,
  selectedStyle,
  onSelectStyle
}) => {
  const [activeTab, setActiveTab] = useState<'beats' | 'bible'>('beats');
  const [isMegaAnalyzing, setIsMegaAnalyzing] = useState(false);

  const handleUpdateBeat = (updatedBeat: StoryBeat) => {
      if (result) {
          const newBeats = result.beats.map(b => b.id === updatedBeat.id ? updatedBeat : b);
          onUpdateBeats(newBeats);
      }
  };

  const handleExtractSource = async () => {
    if (!result || !inputText) return;
    try {
        const extractionMap = await extractSourceText(inputText, result.beats);
        
        const updatedBeats = result.beats.map(beat => ({
            ...beat,
            sourceText: extractionMap[beat.id] || beat.sourceText
        }));

        onUpdateBeats(updatedBeats);
    } catch (error) {
        console.error("Failed to extract source text:", error);
        alert("Failed to extract source text. Please try again.");
    }
  };

  const handleMegaAnalysis = async () => {
    if (!inputText.trim()) return;
    setIsMegaAnalyzing(true);
    // Use the onAnalyze logic but chained
    try {
        const styleDesc = ART_STYLES.find(s => s.id === selectedStyle)?.description || selectedStyle;
        
        // 1. Analyze (Beats + Bible)
        const analysisData = await analyzeText(inputText, previousBible, styleDesc);
        
        // 2. Extract Source Text
        const extractionMap = await extractSourceText(inputText, analysisData.beats);
        let currentBeats: StoryBeat[] = analysisData.beats.map(beat => ({
            ...beat,
            sourceText: extractionMap[beat.id]
        }));
        
        // Update intermediate state (optional, but good for error recovery)
        onUpdateBeats(currentBeats);
        onUpdateResultBible(analysisData.bible);

        // 3. Direct Poses
        // Note: we do this in one big batch for the Mega button, or we could chunk it.
        // For simplicity/stability, we chunk like BeatList does internally?
        // Actually, let's just do simple batching here.
        const BATCH_SIZE = 5;
        let finalBeats: StoryBeat[] = [...currentBeats];
        
        // Helper for batching
        const processBatches = async <T,>(
            inputBeats: StoryBeat[], 
            processor: (b: StoryBeat[], bible: StoryBible, s: string) => Promise<Record<number, T>>,
            merger: (b: StoryBeat, d: T) => StoryBeat
        ) => {
            const accumulated: Record<number, T> = {};
            for (let i = 0; i < inputBeats.length; i += BATCH_SIZE) {
                const chunk = inputBeats.slice(i, i + BATCH_SIZE);
                const chunkData = await processor(chunk, analysisData.bible, styleDesc);
                Object.assign(accumulated, chunkData);
            }
            return inputBeats.map(b => accumulated[b.id] ? merger(b, accumulated[b.id]) : b);
        };

        // Poses
        finalBeats = await processBatches(finalBeats, generatePoses, (b, poses) => ({ ...b, poses: poses as CharacterPose[] }));
        
        // Camera
        finalBeats = await processBatches(finalBeats, generateCameraShots, (b, cam) => ({ ...b, camera: cam as CameraShot }));
        
        // VFX
        finalBeats = await processBatches(finalBeats, generateVFX, (b, vfx) => ({ ...b, vfx: vfx as VFXData }));

        onUpdateBeats(finalBeats);

    } catch (error) {
        console.error("Mega Analysis Failed", error);
        alert("Mega Analysis encountered an error. Check console.");
    } finally {
        setIsMegaAnalyzing(false);
    }
  };

  // Wrapper for the Analyze button to support Mega mode distinct from standard
  const triggerMega = () => {
      // We need to trigger the parent's analyze flow to set status to ANALYZING, 
      // but we override the actual logic here. 
      // Actually, simplest is to just call handleMegaAnalysis directly and manage local loading state,
      // but we need to respect the parent's view state.
      // For now, let's keep them separate buttons.
      handleMegaAnalysis();
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row">
      
      {/* Left Panel: Input */}
      <div className="w-full md:w-1/3 min-w-[350px] max-w-2xl h-full flex flex-col border-r border-slate-800 z-20 shadow-2xl bg-background">
         {/* Small Branding Header for Desktop (Mobile handled differently) */}
         <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Feather className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-bold text-white font-serif tracking-tight">
                StoryBeat <span className="text-primary">Analyzer</span>
                </h1>
            </div>

            {/* Style Selector in Header */}
            <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
                <div className="px-2 text-slate-500">
                    <Paintbrush className="w-3.5 h-3.5" />
                </div>
                <select 
                    value={selectedStyle}
                    onChange={(e) => onSelectStyle(e.target.value)}
                    className="w-full bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer hover:text-primary transition-colors pr-2"
                >
                    {ART_STYLES.map(style => (
                        <option key={style.id} value={style.id} className="bg-slate-900 text-slate-200 py-1">
                            {style.name}
                        </option>
                    ))}
                </select>
            </div>
         </div>
         <div className="flex-1 overflow-hidden">
            <InputArea 
              value={inputText} 
              onChange={setInputText} 
              onAnalyze={onAnalyze}
              onMegaAnalyze={triggerMega}
              status={isMegaAnalyzing ? AnalysisStatus.ANALYZING : status}
              onImportContext={onImportContext}
              previousBible={previousBible}
              onClearContext={onClearContext}
              onUpdateContext={onUpdateContext}
            />
         </div>
      </div>

      {/* Right Panel: Output */}
      <div className="flex-1 h-full flex flex-col bg-slate-900/50 relative overflow-hidden">
        
        {/* Output Header / Tabs */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6 h-full">
            <button
              onClick={() => setActiveTab('beats')}
              disabled={status !== AnalysisStatus.COMPLETED && !isMegaAnalyzing && !result}
              className={`
                h-full flex items-center gap-2 px-2 border-b-2 transition-all text-sm font-semibold tracking-wide uppercase
                ${activeTab === 'beats' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'}
                ${status !== AnalysisStatus.COMPLETED && !isMegaAnalyzing && !result ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Layout className="w-4 h-4" />
              Beats
            </button>
            <button
              onClick={() => setActiveTab('bible')}
              disabled={status !== AnalysisStatus.COMPLETED && !isMegaAnalyzing && !result}
              className={`
                h-full flex items-center gap-2 px-2 border-b-2 transition-all text-sm font-semibold tracking-wide uppercase
                ${activeTab === 'bible' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'}
                ${status !== AnalysisStatus.COMPLETED && !isMegaAnalyzing && !result ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Book className="w-4 h-4" />
              Story Bible
            </button>
          </div>
          
          <div className="hidden md:block text-slate-500 text-xs font-mono">
            {isMegaAnalyzing ? 'Mega Analysis In Progress...' : (status === AnalysisStatus.COMPLETED || result) ? 'Gemini 3 Pro Analysis Ready' : 'Waiting for input...'}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#0b1221]">
          
          {/* Empty State */}
          {status === AnalysisStatus.IDLE && !isMegaAnalyzing && !result && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6">
                <Layout className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-xl font-medium text-slate-400 mb-2">Ready to Analyze</h3>
              <p className="max-w-sm mb-4">Select a <strong>Visual Style</strong> from the sidebar to guide the director.</p>
              <p className="max-w-sm text-sm">Paste your story text on the left. You can also import a previous Story Bible to maintain continuity.</p>
            </div>
          )}

          {/* Error State */}
          {status === AnalysisStatus.ERROR && errorMessage && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="max-w-lg w-full p-6 bg-red-900/10 border border-red-900/50 rounded-xl flex items-start gap-4 text-red-200">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-1">Analysis Failed</h3>
                  <p className="opacity-80">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State with Progress Bar */}
          {(status === AnalysisStatus.ANALYZING || isMegaAnalyzing) && (
            <div className="max-w-4xl mx-auto mt-12 px-8 flex flex-col items-center justify-center min-h-[50vh]">
               {/* Progress Bar Container */}
               <div className="w-full max-w-md space-y-4 text-center mb-16 animate-fade-in-up">
                  <h3 className="text-xl font-serif text-slate-200 animate-pulse">
                      {isMegaAnalyzing ? "Running Full Production Pipeline..." : "Analyzing Story Structure..."}
                  </h3>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300 ease-out"
                      style={{ width: isMegaAnalyzing ? '100%' : `${Math.round(analysisProgress)}%` }} // Mega handles its own sub-loading states usually, simplified for UI
                    >
                        {isMegaAnalyzing && <div className="animate-shimmer w-full h-full bg-white/20"></div>}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-500">
                     <span>Gemini 3 Pro</span>
                     {isMegaAnalyzing && <span className="text-emerald-400 animate-pulse">Processing...</span>}
                  </div>
               </div>

               {/* Skeleton Loader to indicate upcoming content layout */}
               <div className="w-full space-y-8 animate-pulse opacity-30">
                  <div className="flex gap-6">
                    <div className="hidden md:flex flex-col items-center w-8">
                      <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                      <div className="w-8 h-8 rounded-full bg-slate-800 mt-2"></div>
                    </div>
                    <div className="flex-1 bg-surface rounded-xl h-48 border border-slate-800"></div>
                  </div>
               </div>
            </div>
          )}

          {/* Success State */}
          {(status === AnalysisStatus.COMPLETED || result) && !isMegaAnalyzing && result && (
            <>
              {activeTab === 'beats' && (
                <BeatList 
                  beats={result.beats} 
                  bible={result.bible}
                  onUpdateBeats={onUpdateBeats} 
                  onUpdateBeat={handleUpdateBeat}
                  onNavigateToLab={onNavigateToLab}
                  selectedStyle={selectedStyle}
                  onExtractSource={handleExtractSource}
                />
              )}
              {activeTab === 'bible' && (
                <BibleView 
                  bible={result.bible} 
                  onUpdate={onUpdateResultBible} 
                />
              )}
            </>
          )}

          {/* Footer inside content area so it scrolls */}
          <div className="py-12 text-center">
             <p className="text-slate-700 text-xs">Generated with Gemini 3 Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryAnalyzer;