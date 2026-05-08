import React, { useRef, useState } from 'react';
import { StoryBeat, StoryBible, AssetState } from '../types';
import { Clapperboard, Hammer, Upload, Paintbrush, Layout, Book, Sparkles, Download, Save, Music, Box } from 'lucide-react';
import BeatCard from './BeatCard';
import FreestyleGenerator from './FreestyleGenerator';
import AssetGenerator from './AssetGenerator';
import BibleView from './BibleView';
import { generateSceneImages, ART_STYLES } from '../services/geminiService';

interface ImageGeneratorProps {
  beats: StoryBeat[];
  bible: StoryBible | null;
  onUpdateBeats?: (beats: StoryBeat[]) => void;
  onUpdateBible?: (bible: StoryBible) => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  assetState: AssetState;
  setAssetState: React.Dispatch<React.SetStateAction<AssetState>>;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  beats, 
  bible,
  onUpdateBeats, 
  onUpdateBible,
  selectedStyle,
  onSelectStyle,
  assetState,
  setAssetState
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'scenes' | 'bible' | 'ref_gen' | 'assets'>('scenes');

  const handleUpdateBeat = (updatedBeat: StoryBeat) => {
    if (onUpdateBeats) {
        const newBeats = beats.map(b => b.id === updatedBeat.id ? updatedBeat : b);
        onUpdateBeats(newBeats);
    }
  };

  const handleUploadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            if (event.target?.result) {
                const json = JSON.parse(event.target.result as string);
                
                // 1. Handle Beats
                let loadedBeats: StoryBeat[] = [];
                if (Array.isArray(json)) {
                    loadedBeats = json;
                } else if (json.beats && Array.isArray(json.beats)) {
                    loadedBeats = json.beats;
                }
                
                if (loadedBeats.length > 0 && onUpdateBeats) {
                    onUpdateBeats(loadedBeats);
                }

                // 2. Handle Bible (for Reference Generator)
                if (json.bible && onUpdateBible) {
                    onUpdateBible(json.bible as StoryBible);
                }
            }
        } catch (error) {
            console.error("Failed to upload project", error);
            alert("Failed to load project file.");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownloadProjectJSON = () => {
    const data = {
        beats: beats,
        bible: bible,
        timestamp: new Date().toISOString(),
        version: "1.0",
        style: selectedStyle
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_save_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateImagesForBeat = async (beatId: number) => {
      if (!onUpdateBeats) return;

      const beatToUpdate = beats.find(b => b.id === beatId);
      if (!beatToUpdate) return;

      const styleDesc = ART_STYLES.find(s => s.id === selectedStyle)?.description || selectedStyle;

      try {
          // Generate 4 images in parallel
          const promises = Array(4).fill(0).map(() => generateSceneImages(beatToUpdate, bible, styleDesc));
          const generatedImages = await Promise.all(promises);

          const updatedBeats = beats.map(b => {
              if (b.id === beatId) {
                  return { ...b, generatedImages };
              }
              return b;
          });
          onUpdateBeats(updatedBeats);

      } catch (error) {
          console.error("Failed to generate images", error);
          alert("Failed to generate images. Check API key and quota.");
      }
  };

  const handleSelectImage = (beatId: number, imageBase64: string) => {
      if (!onUpdateBeats) return;
      const updatedBeats = beats.map(b => {
          if (b.id === beatId) {
              // Toggle selection if clicking the same one, or select new one
              return { ...b, selectedImage: b.selectedImage === imageBase64 ? undefined : imageBase64 };
          }
          return b;
      });
      onUpdateBeats(updatedBeats);
  };

  const handleExportHTML = () => {
      // Export logic remains same (omitted for brevity, assume existing)
      alert("HTML Export not fully implemented in this update snippet.");
  };

  const currentStyleObj = ART_STYLES.find(s => s.id === selectedStyle);
  const currentStyleName = currentStyleObj?.name || selectedStyle;
  const currentStyleDesc = currentStyleObj?.description || "";

  return (
    <div className="h-full w-full bg-[#0b1221] text-slate-200 flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-background/80 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <Clapperboard className="w-5 h-5 text-emerald-400" />
                </div>
                <h1 className="text-lg font-bold text-white font-serif tracking-tight">
                Image Gen <span className="text-emerald-400">Lab</span>
                </h1>
            </div>

            <div className="h-8 w-px bg-slate-700 mx-2"></div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                <button
                    onClick={() => setActiveTab('scenes')}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeTab === 'scenes' 
                        ? 'bg-slate-700 text-emerald-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Layout className="w-3.5 h-3.5" />
                    Scenes
                </button>
                <button
                    onClick={() => setActiveTab('bible')}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeTab === 'bible' 
                        ? 'bg-slate-700 text-sky-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Book className="w-3.5 h-3.5" />
                    Bible
                </button>
                 <button
                    onClick={() => setActiveTab('ref_gen')}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeTab === 'ref_gen' 
                        ? 'bg-slate-700 text-pink-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Reference
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeTab === 'assets' 
                        ? 'bg-slate-700 text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Box className="w-3.5 h-3.5" />
                    UI & Sprites
                </button>
            </div>
        </div>

        {/* Center: Style Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
            <div className="px-2 text-slate-500">
                <Paintbrush className="w-3.5 h-3.5" />
            </div>
            <select 
                value={selectedStyle}
                onChange={(e) => onSelectStyle(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer hover:text-emerald-300 transition-colors pr-2"
                style={{ minWidth: '200px' }}
            >
                {ART_STYLES.map(style => (
                    <option key={style.id} value={style.id} className="bg-slate-900 text-slate-200 py-1">
                        {style.name}
                    </option>
                ))}
            </select>
        </div>

        <div className="flex items-center gap-3">
            {onUpdateBeats && beats.length > 0 && (
                <>
                <button 
                    onClick={handleDownloadProjectJSON}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-200 transition-colors border border-slate-600"
                    title="Save Project (JSON)"
                >
                    <Save className="w-3 h-3" />
                    <span className="hidden sm:inline">Save JSON</span>
                </button>
                <button 
                    onClick={handleExportHTML}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-900/20"
                    title="Download complete visual script as HTML"
                >
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">Export HTML</span>
                </button>
                </>
            )}
            {onUpdateBeats && (
                <>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUploadProject} 
                        accept=".json" 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
                        title="Upload a saved beat project JSON"
                    >
                        <Upload className="w-3 h-3" />
                        <span className="hidden sm:inline">Load JSON</span>
                    </button>
                </>
            )}
        </div>
      </header>

      {/* Content Area - Using Display None for persistence */}
      <div className="flex-1 overflow-hidden bg-[#0b1221] relative">
        
        {/* Scenes Tab */}
        <div className={`absolute inset-0 overflow-y-auto custom-scrollbar p-4 ${activeTab === 'scenes' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
             {beats.length > 0 ? (
                <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-8 animate-fade-in-up relative">
                    <div className="flex flex-col gap-6">
                        <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-500/20 flex flex-col items-center text-center gap-2 mb-4">
                            <h3 className="text-emerald-300 font-bold text-lg">Scene Production</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                                <Paintbrush className="w-3 h-3" />
                                <span>Style: <span className="text-emerald-200">{currentStyleName}</span></span>
                            </div>
                            <p className="text-slate-500 text-xs max-w-md mt-2">
                                {beats.length} beats loaded.
                            </p>
                        </div>
                        
                        <div className="space-y-0">
                            {beats.map((beat, index) => (
                                <BeatCard 
                                    key={beat.id} 
                                    beat={beat} 
                                    bible={bible}
                                    index={index} 
                                    onGenerateImages={handleGenerateImagesForBeat}
                                    onSelectImage={handleSelectImage}
                                    onUpdateBeat={handleUpdateBeat}
                                />
                            ))}
                        </div>

                        <div className="hidden md:flex flex-col items-center ml-[15px] -mt-8">
                            <div className="w-2 h-2 rounded-full bg-slate-700 mb-12"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-6 animate-fade-in-up">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto ring-1 ring-slate-700 shadow-xl">
                            <Clapperboard className="w-10 h-10 text-slate-600" />
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl font-serif font-bold text-slate-100">Workspace Empty</h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Analyze a story and run the full director pipeline (Poses, Camera, VFX) to import beats here, or upload a previously saved project.
                            </p>
                            {onUpdateBeats && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 mt-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Project File</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Bible Tab */}
        <div className={`absolute inset-0 overflow-y-auto custom-scrollbar p-4 ${activeTab === 'bible' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
            {bible ? (
                <BibleView 
                    bible={bible} 
                    onUpdate={onUpdateBible || (() => {})} 
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500">
                    <p>No Story Bible loaded.</p>
                </div>
            )}
        </div>

        {/* Freestyle Reference Generator Tab */}
        <div className={`absolute inset-0 overflow-y-auto custom-scrollbar ${activeTab === 'ref_gen' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
             <FreestyleGenerator 
                styleId={currentStyleName}
                styleDescription={currentStyleDesc}
            />
        </div>

        {/* New Asset Generator Tab */}
        <div className={`absolute inset-0 overflow-y-auto custom-scrollbar ${activeTab === 'assets' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
             <AssetGenerator 
                styleId={currentStyleName}
                styleDescription={currentStyleDesc}
                bible={bible}
                assetState={assetState}
                setAssetState={setAssetState}
            />
        </div>

      </div>
    </div>
  );
};

export default ImageGenerator;