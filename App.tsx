import React, { useState, useCallback } from 'react';
import { BookOpen, Settings, Layers, Clapperboard, Music } from 'lucide-react';
import StoryAnalyzer from './components/StoryAnalyzer';
import ImageGenerator from './components/ImageGenerator';
import SettingsView from './components/SettingsView';
import PostProductionEditor from './components/PostProductionEditor';
import { analyzeText, ART_STYLES } from './services/geminiService';
import { AnalysisResult, AnalysisStatus, StoryBible, StoryBeat, AssetState } from './types';

type AppView = 'analyzer' | 'workspace' | 'post_production' | 'settings';

const App: React.FC = () => {
  // Global State lifted from StoryAnalyzer
  const [inputText, setInputText] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousBible, setPreviousBible] = useState<StoryBible | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  
  // Lifted Workspace State
  const [selectedStyle, setSelectedStyle] = useState<string>('a1_solo');

  // Lifted Asset State (Persistence)
  const [assetState, setAssetState] = useState<AssetState>({
    generatedTextBoxes: [],
    generatedSprites: [],
    activeTextBox: null,
    activeSprite: null,
    textBoxPrompt: "Sci-fi blue holographic dialogue box with sharp edges, wide aspect ratio",
    spritePrompt: "Anime character, female pilot, confident expression, wearing flight suit",
    layout: {
      sprite: { x: 50, y: 15, width: 40, height: 85, opacity: 1 },
      textbox: { x: 5, y: 70, width: 90, height: 25, opacity: 1 }
    }
  });

  // View State
  const [currentView, setCurrentView] = useState<AppView>('analyzer');

  const handleImportContext = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target?.result) {
          const json = JSON.parse(e.target.result as string);
          // Simple validation check
          if (json.characters && json.settings && typeof json.summary === 'string') {
            setPreviousBible(json as StoryBible);
            setErrorMessage(null);
          } else {
            throw new Error("Invalid Story Bible JSON format.");
          }
        }
      } catch (err: any) {
        setErrorMessage("Failed to load context: " + err.message);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleClearContext = useCallback(() => {
    setPreviousBible(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;

    setStatus(AnalysisStatus.ANALYZING);
    setErrorMessage(null);
    setResult(null);
    setAnalysisProgress(0);

    const styleDesc = ART_STYLES.find(s => s.id === selectedStyle)?.description || selectedStyle;

    // Simulate progress while waiting for the API
    const intervalId = setInterval(() => {
      setAnalysisProgress(prev => {
        // Slow down as we approach 90%
        if (prev >= 90) return prev;
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + (Math.random() * increment));
      });
    }, 500);

    try {
      const analysisData = await analyzeText(inputText, previousBible, styleDesc);
      
      clearInterval(intervalId);
      setAnalysisProgress(100);
      
      // Small delay to allow the bar to visually hit 100% before switching view
      setTimeout(() => {
        setResult(analysisData);
        setStatus(AnalysisStatus.COMPLETED);
      }, 500);

    } catch (error: any) {
      clearInterval(intervalId);
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
      setErrorMessage(error.message || "An unexpected error occurred while analyzing the text.");
    }
  }, [inputText, previousBible, selectedStyle]);

  const handleUpdateResultBible = useCallback((newBible: StoryBible) => {
    setResult(prev => {
      if (!prev) return null; // Should ideally create new result if null, but flow typically starts with analyze
      return {
        ...prev,
        bible: newBible
      } as AnalysisResult;
    });
  }, []);
  
  // Handler for uploading a project which may contain a bible (used in Workspace)
  const handleLoadBibleFromProject = useCallback((newBible: StoryBible) => {
      setResult(prev => {
          // If we have a previous result, merge/replace
          if (prev) {
              return { ...prev, bible: newBible };
          }
          // If no previous result, we create a partial one just to hold the bible
          return { beats: [], bible: newBible };
      });
      // Also set as context for future analysis
      setPreviousBible(newBible);
  }, []);

  const handleUpdateBeats = useCallback((newBeats: StoryBeat[]) => {
    setResult(prev => {
      if (!prev) return { beats: newBeats, bible: { summary: '', characters: [], settings: [] } };
      return {
        ...prev,
        beats: newBeats
      };
    });
  }, []);

  const handleNavigateToLab = useCallback(() => {
    setCurrentView('workspace');
  }, []);

  return (
    <div className="h-screen w-screen bg-background text-slate-200 overflow-hidden flex">
      
      {/* Main Navigation Sidebar */}
      <nav className="w-16 md:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 z-50 shadow-2xl">
        
        {/* Logo/Brand */}
        <div className="mb-8 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/20">
          <Layers className="w-6 h-6 text-slate-900" />
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-4 w-full px-2">
          
          <button
            onClick={() => setCurrentView('analyzer')}
            className={`
              w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 group relative
              ${currentView === 'analyzer' 
                ? 'bg-surface text-primary shadow-inner border border-slate-700' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}
            `}
            title="Story Analyzer"
          >
            <BookOpen className={`w-6 h-6 transition-transform group-hover:scale-110 ${currentView === 'analyzer' ? 'scale-110' : ''}`} />
            {currentView === 'analyzer' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />}
          </button>

          <button
            onClick={() => setCurrentView('workspace')}
            className={`
              w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 group relative
              ${currentView === 'workspace' 
                ? 'bg-surface text-emerald-400 shadow-inner border border-slate-700' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}
            `}
            title="Image Gen Lab"
          >
            <Clapperboard className={`w-6 h-6 transition-transform group-hover:scale-110 ${currentView === 'workspace' ? 'scale-110' : ''}`} />
            {currentView === 'workspace' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400 rounded-l-full" />}
          </button>

          <button
            onClick={() => setCurrentView('post_production')}
            className={`
              w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 group relative
              ${currentView === 'post_production' 
                ? 'bg-surface text-purple-400 shadow-inner border border-slate-700' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}
            `}
            title="Sound & Text Lab"
          >
            <Music className={`w-6 h-6 transition-transform group-hover:scale-110 ${currentView === 'post_production' ? 'scale-110' : ''}`} />
            {currentView === 'post_production' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-400 rounded-l-full" />}
          </button>

        </div>

        {/* Bottom Actions */}
        <div className="mt-auto">
          <button 
            onClick={() => setCurrentView('settings')}
            className={`
               w-10 h-10 rounded-full flex items-center justify-center transition-colors
               ${currentView === 'settings' ? 'text-slate-200 bg-slate-800' : 'text-slate-600 hover:text-slate-400'}
            `}
            title="Settings & Config"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        {currentView === 'analyzer' && (
          <StoryAnalyzer 
            inputText={inputText}
            setInputText={setInputText}
            result={result}
            status={status}
            errorMessage={errorMessage}
            onAnalyze={handleAnalyze}
            onImportContext={handleImportContext}
            previousBible={previousBible}
            onClearContext={handleClearContext}
            onUpdateContext={setPreviousBible}
            onUpdateResultBible={handleUpdateResultBible}
            onUpdateBeats={handleUpdateBeats}
            onNavigateToLab={handleNavigateToLab}
            analysisProgress={analysisProgress}
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
          />
        )}
        
        {currentView === 'workspace' && (
          <ImageGenerator 
            beats={result?.beats || []} 
            bible={result?.bible || previousBible || null}
            onUpdateBeats={handleUpdateBeats}
            onUpdateBible={handleLoadBibleFromProject}
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
            assetState={assetState}
            setAssetState={setAssetState}
          />
        )}

        {currentView === 'post_production' && (
          <PostProductionEditor 
            beats={result?.beats || []} 
            bible={result?.bible || previousBible || null}
            onUpdateBeats={handleUpdateBeats}
            onUpdateBible={handleLoadBibleFromProject}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView />
        )}
      </main>

    </div>
  );
};

export default App;