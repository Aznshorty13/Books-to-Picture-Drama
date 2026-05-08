import React, { useRef, useState } from 'react';
import { StoryBeat, StoryBible } from '../types';
import { Music, MessageSquare, Type, Mic, Layers, Upload, Save, Download, Play, Plus, Image as ImageIcon, Wand2, Loader2, Volume2 } from 'lucide-react';
import { generateSoundDescriptions } from '../services/geminiService';

interface PostProductionEditorProps {
  beats: StoryBeat[];
  bible: StoryBible | null;
  onUpdateBeats: (beats: StoryBeat[]) => void;
  onUpdateBible: (bible: StoryBible) => void;
}

const PostProductionEditor: React.FC<PostProductionEditorProps> = ({ beats, bible, onUpdateBeats, onUpdateBible }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingSound, setIsGeneratingSound] = useState(false);
  const [progress, setProgress] = useState(0);

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

                // 2. Handle Bible
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
        module: "sound_text"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sound_text_project_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateSoundscape = async () => {
      if (!bible || beats.length === 0) return;
      setIsGeneratingSound(true);
      setProgress(0);

      const BATCH_SIZE = 5;
      let updatedBeats = [...beats];
      const totalBeats = beats.length;
      let processedCount = 0;
      const accumulatedData: Record<number, string> = {};

      try {
        for (let i = 0; i < totalBeats; i += BATCH_SIZE) {
            const chunk = beats.slice(i, i + BATCH_SIZE);
            try {
                const chunkData = await generateSoundDescriptions(chunk, bible);
                Object.assign(accumulatedData, chunkData);
            } catch (e) {
                console.error(`Error processing batch ${i}`, e);
            }
            processedCount += chunk.length;
            setProgress(Math.min(100, Math.round((processedCount / totalBeats) * 100)));
        }

        updatedBeats = beats.map(beat => {
            const desc = accumulatedData[beat.id];
            return desc ? { ...beat, soundDescription: desc } : beat;
        });

        onUpdateBeats(updatedBeats);
      } catch (error) {
          console.error("Sound generation error:", error);
          alert("Failed to generate sound descriptions.");
      } finally {
          setIsGeneratingSound(false);
          setProgress(0);
      }
  };

  return (
    <div className="h-full w-full bg-[#0b1221] text-slate-200 flex flex-col relative overflow-hidden">
        
        {/* Loading Overlay */}
        {isGeneratingSound && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                 <div className="w-full max-w-md space-y-4 text-center">
                    <h3 className="text-xl font-serif text-purple-300 animate-pulse">
                        Designing Soundscape...
                    </h3>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                        Processing beats... {progress}%
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-background/80 backdrop-blur-md z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                    <Music className="w-5 h-5 text-purple-400" />
                </div>
                <h1 className="text-lg font-bold text-white font-serif tracking-tight">
                    Sound & Text <span className="text-purple-400">Lab</span>
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {beats.length > 0 && (
                    <>
                        <button 
                            onClick={handleGenerateSoundscape}
                            disabled={isGeneratingSound}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-purple-900/20 border border-purple-500/50"
                            title="Generate sound descriptions for all beats"
                        >
                            {isGeneratingSound ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            <span className="hidden sm:inline">Generate Soundscape</span>
                        </button>

                        <div className="w-px h-6 bg-slate-700 mx-1"></div>

                        <button 
                            onClick={handleDownloadProjectJSON}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-200 transition-colors border border-slate-600"
                            title="Save Project (JSON)"
                        >
                            <Save className="w-3 h-3" />
                            <span className="hidden sm:inline">Save JSON</span>
                        </button>
                    </>
                )}
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
            </div>
        </header>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col animate-fade-in-up ${beats.length === 0 ? 'items-center justify-center' : ''}`}>
            
            {beats.length === 0 ? (
                /* Empty State Hero */
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-full h-full bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-purple-500/30">
                            <div className="grid grid-cols-2 gap-2 p-2">
                                <Music className="w-8 h-8 text-purple-400" />
                                <Mic className="w-8 h-8 text-pink-400" />
                                <Type className="w-8 h-8 text-indigo-400" />
                                <Layers className="w-8 h-8 text-sky-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-serif font-bold text-slate-100">Sound & Text Editor</h2>
                        <p className="text-lg text-slate-400">
                            Import your visual beats here to add <span className="text-purple-400 font-bold">Sound Effects</span>, 
                            generate <span className="text-pink-400 font-bold">Dialogue Audio</span>, 
                            and overlay <span className="text-indigo-400 font-bold">Text Boxes</span>.
                        </p>
                        <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 text-slate-500 text-sm inline-block">
                            No project loaded. Click "Load JSON" to import beats from the Image Gen Lab.
                        </div>
                    </div>
                </div>
            ) : (
                /* Active Project View */
                <div className="max-w-5xl mx-auto w-full space-y-8 pb-20">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold font-serif text-slate-100">Project Timeline</h2>
                            <p className="text-slate-500 text-sm mt-1">Add audio and text overlays to your visual beats.</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-mono text-slate-400">
                            {beats.length} Scenes Loaded
                        </div>
                    </div>

                    {beats.map((beat, index) => (
                        <div key={beat.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-slate-700 transition-all group">
                             
                             {/* Beat Header */}
                             <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:text-purple-400 group-hover:border-purple-500/50 transition-colors">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-200">{beat.title}</h3>
                                </div>
                                <div className="text-xs font-mono text-slate-600 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">
                                    {beat.visualSetting}
                                </div>
                             </div>

                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                {/* Visual Section (Left/Top) */}
                                <div className="lg:col-span-7 bg-black relative border-b lg:border-b-0 lg:border-r border-slate-800 group/visual">
                                    {beat.selectedImage ? (
                                        <div className="relative aspect-video w-full">
                                            <img src={beat.selectedImage} alt={beat.title} className="w-full h-full object-contain" />
                                            
                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/visual:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg backdrop-blur-md flex items-center gap-2 transition-transform hover:scale-105 shadow-xl">
                                                    <Type className="w-4 h-4" /> Add Text Overlay
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-video flex flex-col items-center justify-center text-slate-700 space-y-3 bg-slate-950">
                                            <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                                                <ImageIcon className="w-8 h-8 opacity-20" />
                                            </div>
                                            <span className="text-xs uppercase tracking-wider font-medium opacity-50">No Visual Selected</span>
                                        </div>
                                    )}
                                </div>

                                {/* Script & Audio Section (Right/Bottom) */}
                                <div className="lg:col-span-5 flex flex-col h-full min-h-[400px] bg-[#0b1221]">
                                    
                                    {/* Action Description */}
                                    <div className="p-6 border-b border-slate-800 bg-slate-900/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-3 bg-slate-600 rounded-full"></div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Narrative Action</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed italic">
                                            {beat.narrativeDescription}
                                        </p>
                                    </div>
                                    
                                    {/* Soundscape Section */}
                                    {beat.soundDescription && (
                                        <div className="px-6 py-4 border-b border-slate-800 bg-purple-900/10">
                                            <div className="flex items-center gap-2 mb-2 text-purple-400">
                                                <Volume2 className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Soundscape & Cues</span>
                                            </div>
                                            <div className="text-sm text-purple-100/80 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                                                {beat.soundDescription}
                                            </div>
                                        </div>
                                    )}

                                    {/* Script Display */}
                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{maxHeight: '400px'}}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Script & Dialogue</span>
                                        </div>
                                        
                                        <div className="space-y-4 pl-2 border-l border-slate-800 ml-1">
                                            {beat.script.split('\n').map((line, i) => {
                                                const trimmed = line.trim();
                                                if(!trimmed) return null;
                                                const colonIdx = trimmed.indexOf(':');
                                                
                                                if(colonIdx > 0) {
                                                    const speaker = trimmed.substring(0, colonIdx);
                                                    const text = trimmed.substring(colonIdx+1);
                                                    const isNarrator = speaker.toLowerCase().includes('narrator');
                                                    
                                                    return (
                                                        <div key={i} className="text-sm">
                                                            <span className={`font-bold mr-2 text-xs uppercase tracking-wide ${isNarrator ? 'text-amber-500/70' : 'text-slate-300'}`}>
                                                                {speaker}
                                                            </span>
                                                            <span className={`${isNarrator ? 'text-slate-500 italic' : 'text-slate-400'}`}>
                                                                {text}
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                                return <div key={i} className="text-sm text-slate-600 italic pl-2">{trimmed}</div>
                                            })}
                                        </div>
                                    </div>

                                    {/* Audio Controls Footer */}
                                    <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                            <span className="text-xs text-slate-500 font-medium">No Audio Generated</span>
                                        </div>
                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/50 rounded-lg text-xs font-bold transition-all">
                                            <Mic className="w-3.5 h-3.5" /> Generate Audio
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default PostProductionEditor;