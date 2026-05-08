import React, { useState } from 'react';
import { StoryBeat, StoryBible, CharacterPose, CameraShot, VFXData } from '../types';
import BeatCard from './BeatCard';
import { Copy, Check, Loader2, User, Video, Wand2, ArrowRight, Clapperboard, Download, FileText } from 'lucide-react';
import { generatePoses, generateCameraShots, generateVFX, ART_STYLES } from '../services/geminiService';

interface BeatListProps {
  beats: StoryBeat[];
  bible: StoryBible;
  onUpdateBeats: (beats: StoryBeat[]) => void;
  onUpdateBeat?: (beat: StoryBeat) => void;
  onNavigateToLab?: () => void;
  selectedStyle?: string;
  onExtractSource?: () => Promise<void>;
}

const BATCH_SIZE = 5; // Process beats in chunks to allow progress updates

const BeatList: React.FC<BeatListProps> = ({ beats, bible, onUpdateBeats, onUpdateBeat, onNavigateToLab, selectedStyle = 'a1_solo', onExtractSource }) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPoses, setIsGeneratingPoses] = useState(false);
  const [isGeneratingCamera, setIsGeneratingCamera] = useState(false);
  const [isGeneratingVFX, setIsGeneratingVFX] = useState(false);
  const [isExtractingSource, setIsExtractingSource] = useState(false);
  const [progress, setProgress] = useState(0);

  if (beats.length === 0) return null;

  const currentStyleDesc = ART_STYLES.find(s => s.id === selectedStyle)?.description || selectedStyle;

  const handleCopyAll = async () => {
    const text = beats.map((b, i) => {
      let content = `#${i + 1} ${b.title}\n\nACTION SUMMARY:\n${b.narrativeDescription}\n\nSETTING: ${b.visualSetting}\n\nVISUAL DESCRIPTION:\n${b.visualDescriptionPlain}`;
      if (b.poses) {
        content += `\n\nPOSES:\n` + b.poses.map(p => `- ${p.name} (${p.anchor}): ${p.description}`).join('\n');
      }
      if (b.camera) {
        content += `\n\nCAMERA:\nLens: ${b.camera.lens}\nAngle: ${b.camera.angle}\nFocus: ${b.camera.focalPoint}\nComposition: ${b.camera.composition}`;
      }
      if (b.vfx) {
        content += `\n\nVFX:\nLighting: ${b.vfx.lighting}\nAtmosphere: ${b.vfx.atmosphere}\nEffects: ${b.vfx.specialEffects}\nPost-Process: ${b.vfx.postProcessing}`;
      }
      content += `\n\nSCRIPT:\n${b.script}`;
      return content;
    }).join('\n\n' + '-'.repeat(30) + '\n\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadProject = () => {
    // We construct a project object, but keep it compatible with simple array uploads too if needed
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
    a.download = `storybeat-production-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExtractSourceClick = async () => {
      if (onExtractSource) {
          setIsExtractingSource(true);
          try {
              await onExtractSource();
          } finally {
              setIsExtractingSource(false);
          }
      }
  };

  // Reusable batch generation logic
  const runBatchGeneration = async <T,>(
    currentBeats: StoryBeat[],
    setIsLoading: (val: boolean) => void,
    apiService: (beats: StoryBeat[], bible: StoryBible, style: string) => Promise<Record<number, T>>,
    mergeData: (beat: StoryBeat, data: T) => StoryBeat
  ): Promise<StoryBeat[]> => {
    setIsLoading(true);
    setProgress(0);
    
    let updatedBeats = [...currentBeats];
    const totalBeats = currentBeats.length;
    let processedCount = 0;
    const accumulatedData: Record<number, T> = {};

    try {
      for (let i = 0; i < totalBeats; i += BATCH_SIZE) {
        const chunk = currentBeats.slice(i, i + BATCH_SIZE);
        try {
          const chunkData = await apiService(chunk, bible, currentStyleDesc);
          Object.assign(accumulatedData, chunkData);
        } catch (e) {
           console.error(`Error processing batch ${i}`, e);
        }
        processedCount += chunk.length;
        setProgress(Math.min(100, Math.round((processedCount / totalBeats) * 100)));
      }

      updatedBeats = currentBeats.map(beat => {
        const data = accumulatedData[beat.id];
        return data ? mergeData(beat, data) : beat;
      });

      onUpdateBeats(updatedBeats);
      return updatedBeats;

    } catch (error) {
      console.error("Generation pipeline error:", error);
      alert("An error occurred during generation.");
      return currentBeats;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleGeneratePoses = () => runBatchGeneration(
    beats, 
    setIsGeneratingPoses, 
    generatePoses, 
    (beat, poses) => ({ ...beat, poses: poses as CharacterPose[] })
  );

  const handleGenerateCamera = () => runBatchGeneration(
    beats,
    setIsGeneratingCamera,
    generateCameraShots,
    (beat, camera) => ({ ...beat, camera: camera as CameraShot })
  );

  const handleGenerateVFX = () => runBatchGeneration(
    beats,
    setIsGeneratingVFX,
    generateVFX,
    (beat, vfx) => ({ ...beat, vfx: vfx as VFXData })
  );

  const handleDirectAll = async () => {
    // Start with current beats
    let current = beats;
    
    // 1. Poses
    current = await runBatchGeneration(
        current,
        setIsGeneratingPoses,
        generatePoses,
        (beat, poses) => ({ ...beat, poses: poses as CharacterPose[] })
    );

    // 2. Camera
    current = await runBatchGeneration(
        current,
        setIsGeneratingCamera,
        generateCameraShots,
        (beat, camera) => ({ ...beat, camera: camera as CameraShot })
    );

    // 3. VFX
    await runBatchGeneration(
        current,
        setIsGeneratingVFX,
        generateVFX,
        (beat, vfx) => ({ ...beat, vfx: vfx as VFXData })
    );
  };

  const hasPoses = beats.some(b => b.poses && b.poses.length > 0);
  const hasCamera = beats.some(b => b.camera);
  const hasVFX = beats.some(b => b.vfx);
  const hasSource = beats.some(b => !!b.sourceText);
  const allVFXGenerated = beats.length > 0 && beats.every(b => !!b.vfx);
  
  const isGenerating = isGeneratingPoses || isGeneratingCamera || isGeneratingVFX || isExtractingSource;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-8 animate-fade-in-up relative">
      
      {/* Sticky Progress Bar Overlay */}
      {isGenerating && !isExtractingSource && (
        <div className="fixed inset-x-0 top-0 z-[100] p-4 bg-slate-900/80 backdrop-blur-md border-b border-primary/20 shadow-2xl flex flex-col items-center justify-center transition-all duration-300">
           <div className="w-full max-w-xl space-y-2">
             <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-primary">
                <span>
                  {isGeneratingPoses && 'Directing Poses...'}
                  {isGeneratingCamera && 'Composing Shots...'}
                  {isGeneratingVFX && 'Adding Visual Effects...'}
                </span>
                <span>{progress}%</span>
             </div>
             <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
             </div>
             <p className="text-center text-[10px] text-slate-500 font-mono">
               Processing batch {Math.min(Math.ceil((progress / 100) * (beats.length / BATCH_SIZE)), Math.ceil(beats.length / BATCH_SIZE))} of {Math.ceil(beats.length / BATCH_SIZE)}
             </p>
           </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 mb-6">
        
         {/* Extract Source Button */}
         {onExtractSource && (
             <button
                onClick={handleExtractSourceClick}
                disabled={isGenerating}
                className={`
                    flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all
                    ${isExtractingSource
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        : hasSource
                            ? 'bg-slate-800 text-indigo-400 border-slate-700 hover:border-indigo-500/50'
                            : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'}
                `}
                title="Extract original source text for each beat"
             >
                 {isExtractingSource ? (
                     <Loader2 className="w-3 h-3 animate-spin" />
                 ) : (
                     <FileText className="w-3 h-3" />
                 )}
                 <span>{isExtractingSource ? 'Extracting...' : hasSource ? 'Re-Extract Source' : 'Extract Source'}</span>
             </button>
         )}

         <div className="w-px h-6 bg-slate-700 mx-1"></div>

        {/* Direct All Button */}
        <button
          onClick={handleDirectAll}
          disabled={isGenerating}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-xs font-bold border rounded-lg transition-all shadow-lg
            bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-violet-500
            ${isGenerating ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105'}
          `}
          title="Run the full director pipeline: Poses -> Camera -> VFX"
        >
          {isGenerating && !isExtractingSource ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Clapperboard className="w-3 h-3" />
          )}
          <span>{isGenerating && !isExtractingSource ? 'Directing...' : 'Direct All'}</span>
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1"></div>

        {/* Pose Director Button */}
        <button
          onClick={handleGeneratePoses}
          disabled={isGenerating}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all
            ${isGeneratingPoses 
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              : hasPoses 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20' 
                : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'}
            ${isGenerating && !isGeneratingPoses ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isGeneratingPoses ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <User className="w-3 h-3" />
          )}
          <span>{isGeneratingPoses ? 'Poses...' : hasPoses ? 'Redo Poses' : 'Poses'}</span>
        </button>

        {/* Camera Director Button */}
        <button
          onClick={handleGenerateCamera}
          disabled={!hasPoses || isGenerating}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all
            ${!hasPoses
              ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-50'
              : isGeneratingCamera 
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : hasCamera
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-500'}
             ${isGenerating && !isGeneratingCamera ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={!hasPoses ? "Generate Poses first" : "Direct Camera Shots"}
        >
          {isGeneratingCamera ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Video className="w-3 h-3" />
          )}
          <span>{isGeneratingCamera ? 'Camera...' : hasCamera ? 'Redo Camera' : 'Camera'}</span>
        </button>

         {/* VFX Director Button */}
         <button
          onClick={handleGenerateVFX}
          disabled={!hasCamera || isGenerating}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all
            ${!hasCamera
              ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-50'
              : isGeneratingVFX 
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : hasVFX
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'}
             ${isGenerating && !isGeneratingVFX ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={!hasCamera ? "Generate Camera first" : "Add Visual Effects"}
        >
          {isGeneratingVFX ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wand2 className="w-3 h-3" />
          )}
          <span>{isGeneratingVFX ? 'VFX...' : hasVFX ? 'Redo VFX' : 'VFX'}</span>
        </button>

        {/* Download Button - Appears with Import to Lab when complete */}
        {allVFXGenerated && (
            <>
                <button
                    onClick={handleDownloadProject}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-900 bg-sky-400 hover:bg-sky-300 border border-sky-400 rounded-lg transition-all"
                    title="Download completed beats"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                </button>

                <button
                onClick={onNavigateToLab}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 border border-emerald-400 rounded-lg transition-all shadow-lg hover:shadow-emerald-400/20 animate-pulse-slow"
                >
                <ArrowRight className="w-4 h-4" />
                <span>Import to Lab</span>
                </button>
            </>
         )}

        <button
          onClick={handleCopyAll}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all bg-slate-800/50"
          title="Copy to Clipboard"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          <span className="sr-only md:not-sr-only">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="space-y-0">
        {beats.map((beat, index) => (
          <BeatCard 
            key={beat.id} 
            beat={beat} 
            bible={bible} 
            index={index} 
            onUpdateBeat={onUpdateBeat}
          />
        ))}
      </div>
      
      {/* End of timeline marker */}
      <div className="hidden md:flex flex-col items-center ml-[15px] -mt-8">
        <div className="w-2 h-2 rounded-full bg-slate-700 mb-12"></div>
      </div>
    </div>
  );
};

export default BeatList;