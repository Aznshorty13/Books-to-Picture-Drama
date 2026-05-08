import React, { useState } from 'react';
import { Camera, AlignLeft, Copy, Check, MessageSquareQuote, MapPin, User, Anchor, Activity, Video, Target, Aperture, Maximize, Wand2, Sun, CloudFog, Sparkles, Layers, Image as ImageIcon, Loader2, Download, ExternalLink, BookOpen, FileText, X, Edit2, Save } from 'lucide-react';
import { StoryBeat, StoryBible } from '../types';
import { refineBeat } from '../services/geminiService';

interface BeatCardProps {
  beat: StoryBeat;
  bible?: StoryBible | null;
  index: number;
  onGenerateImages?: (beatId: number) => void;
  onSelectImage?: (beatId: number, imageBase64: string) => void;
  onUpdateBeat?: (beat: StoryBeat) => void;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, bible, index, onGenerateImages, onSelectImage, onUpdateBeat }) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSourceText, setShowSourceText] = useState(false);
  
  // Edit & Refine States
  const [isEditing, setIsEditing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [editedBeat, setEditedBeat] = useState<StoryBeat>(beat);
  const [isProcessingRefine, setIsProcessingRefine] = useState(false);

  const handleCopy = async () => {
    let text = `#${index + 1} ${beat.title}\n\nACTION SUMMARY:\n${beat.narrativeDescription}\n\nSETTING: ${beat.visualSetting}\n\nVISUAL DESCRIPTION:\n${beat.visualDescriptionPlain}`;
    // ... (rest of copy logic)
    if (beat.poses) {
      text += `\n\nPOSES:\n` + beat.poses.map(p => `- ${p.name} (${p.anchor}): ${p.description}`).join('\n');
    }
    if (beat.camera) {
      text += `\n\nCAMERA:\nLens: ${beat.camera.lens}\nAngle: ${beat.camera.angle}\nFocus: ${beat.camera.focalPoint}\nComposition: ${beat.camera.composition}`;
    }
    if (beat.vfx) {
      text += `\n\nVFX:\nLighting: ${beat.vfx.lighting}\nAtmosphere: ${beat.vfx.atmosphere}\nEffects: ${beat.vfx.specialEffects}\nPost-Process: ${beat.vfx.postProcessing}`;
    }
    text += `\n\nSCRIPT:\n${beat.script}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleGenerateClick = async () => {
      if (onGenerateImages) {
          setIsGenerating(true);
          try {
             await onGenerateImages(beat.id);
          } finally {
             setIsGenerating(false);
          }
      }
  };

  const downloadImage = (base64: string, idx: number) => {
      const link = document.createElement('a');
      link.href = base64;
      link.download = `beat-${beat.id}-img-${idx}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Helper to check if setting is in bible
  const getSettingStatus = () => {
      if (!bible || !beat.visualSetting) return null;
      const match = bible.settings.find(s => beat.visualSetting.toLowerCase().includes(s.name.toLowerCase()));
      if (!match) return null;
      return { inBible: true, hasImage: !!match.imageRef, name: match.name };
  };

  // Helper to check if character is in bible
  const getCharacterStatus = (charName: string) => {
      if (!bible) return null;
      const match = bible.characters.find(c => c.name.toLowerCase() === charName.toLowerCase()) || 
                    bible.characters.find(c => charName.toLowerCase().includes(c.name.toLowerCase()));
      if (!match) return null;
      return { inBible: true, hasImage: !!match.imageRef };
  };

  const settingStatus = getSettingStatus();
  const heroImage = beat.selectedImage || (beat.generatedImages && beat.generatedImages.length > 0 ? beat.generatedImages[0] : null);

  // Edit Handlers
  const handleSaveEdit = () => {
      if (onUpdateBeat) {
          onUpdateBeat(editedBeat);
      }
      setIsEditing(false);
  };

  const handleCancelEdit = () => {
      setEditedBeat(beat);
      setIsEditing(false);
  };

  const updateField = (field: keyof StoryBeat, value: any) => {
      setEditedBeat(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: 'camera' | 'vfx', field: string, value: string) => {
      setEditedBeat(prev => {
          const parentObj = prev[parent] || {} as any;
          return {
              ...prev,
              [parent]: { ...parentObj, [field]: value }
          };
      });
  };

  // Refine Handlers
  const handleRefineSubmit = async () => {
      if (!refineInstruction.trim() || !onUpdateBeat) return;
      
      setIsProcessingRefine(true);
      try {
          const newBeat = await refineBeat(beat, bible || null, refineInstruction);
          onUpdateBeat(newBeat);
          setEditedBeat(newBeat); // Sync edit state
          setIsRefining(false);
          setRefineInstruction("");
      } catch (e) {
          console.error(e);
          alert("Failed to refine beat.");
      } finally {
          setIsProcessingRefine(false);
      }
  };

  return (
    <div className="relative flex gap-6 group">
      {/* Timeline connector */}
      <div className="hidden md:flex flex-col items-center">
        <div className="w-px h-6 bg-slate-700"></div>
        <div className="w-8 h-8 rounded-full bg-surface border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-primary group-hover:text-primary transition-colors z-10">
          {index + 1}
        </div>
        <div className="w-px h-full bg-slate-700 flex-1"></div>
      </div>

      <div className="flex-1 mb-10">
        <div className={`bg-surface rounded-xl border overflow-hidden transition-all shadow-md hover:shadow-xl flex flex-col ${isEditing ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-700/50 hover:border-slate-600'}`}>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 mr-4">
              <span className="md:hidden text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">#{index + 1}</span>
              {isEditing ? (
                  <input 
                    type="text" 
                    value={editedBeat.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-lg font-semibold text-slate-100 w-full focus:border-indigo-500 outline-none"
                  />
              ) : (
                <h3 className="text-lg font-semibold text-slate-100 font-serif tracking-wide">{beat.title}</h3>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onUpdateBeat && (
                  <>
                    <button
                        onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                        className={`p-1.5 rounded-lg transition-all ${isEditing ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50'}`}
                        title={isEditing ? "Save Edits" : "Edit Beat"}
                    >
                        {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                    {!isEditing && (
                        <button
                            onClick={() => setIsRefining(!isRefining)}
                            className={`p-1.5 rounded-lg transition-all ${isRefining ? 'text-purple-400 bg-purple-900/20' : 'text-slate-500 hover:text-purple-400 hover:bg-slate-700/50'}`}
                            title="Refine with AI"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    )}
                  </>
              )}
              {isEditing && (
                  <button 
                    onClick={handleCancelEdit}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                  >
                      <X className="w-4 h-4" />
                  </button>
              )}

              <div className="w-px h-4 bg-slate-700 mx-1"></div>

              {beat.sourceText && (
                <button 
                  onClick={() => setShowSourceText(true)}
                  className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all"
                  title="View Source Text"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={handleCopy}
                className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-700/50 rounded-lg transition-all"
                title="Copy beat to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* AI Refine Input */}
          {isRefining && !isEditing && (
              <div className="px-6 py-4 bg-purple-900/10 border-b border-purple-500/20 flex gap-2 items-center animate-fade-in">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <input 
                    type="text" 
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Describe how to refine this beat (e.g. 'Make the lighting darker', 'Change camera to close-up')..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
                    disabled={isProcessingRefine}
                  />
                  <button
                    onClick={handleRefineSubmit}
                    disabled={isProcessingRefine || !refineInstruction.trim()}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                      {isProcessingRefine ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refine"}
                  </button>
              </div>
          )}

          <div className="p-6 space-y-6">
            
            {/* Action Summary */}
            <div className="flex gap-3 text-slate-400">
               <AlignLeft className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-50" />
               {isEditing ? (
                   <textarea
                    value={editedBeat.narrativeDescription}
                    onChange={(e) => updateField('narrativeDescription', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-indigo-500 outline-none"
                    rows={2}
                   />
               ) : (
                   <p className="text-sm italic opacity-80">{beat.narrativeDescription}</p>
               )}
            </div>

            {/* Visual Key Section */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 relative overflow-hidden group/visual">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
              
              {/* Visual Header */}
              <div className="px-5 py-3 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-900/80">
                <div className="flex items-center gap-2 text-primary">
                  <Camera className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Visual Key</span>
                </div>
                {isEditing ? (
                    <input 
                        type="text"
                        value={editedBeat.visualSetting}
                        onChange={(e) => updateField('visualSetting', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-full md:w-1/2 focus:border-indigo-500 outline-none"
                    />
                ) : (
                    beat.visualSetting && (
                    <div className="flex items-center gap-3 bg-slate-800/50 pl-1 pr-3 py-1 rounded-md border border-slate-700/30">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="uppercase tracking-tight">{beat.visualSetting}</span>
                        </div>
                        {settingStatus && (
                            <div className="flex gap-1.5 border-l border-slate-700 pl-2">
                                <div className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/30 text-sky-300 flex items-center gap-1 shadow-sm">
                                    <BookOpen className="w-3 h-3" />
                                </div>
                            </div>
                        )}
                    </div>
                    )
                )}
              </div>
              
              <div className="p-5">
                {isEditing ? (
                    <textarea 
                        value={editedBeat.visualDescriptionPlain}
                        onChange={(e) => updateField('visualDescriptionPlain', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none leading-relaxed"
                        rows={5}
                    />
                ) : (
                    <p className="text-slate-200 text-sm leading-relaxed">
                    {beat.visualDescriptionPlain || "No description available."}
                    </p>
                )}
              </div>
            </div>

             {/* IMAGE GENERATION SECTION */}
             {onGenerateImages && !isEditing && (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             <ImageIcon className="w-4 h-4" /> Generated Scenes
                         </h4>
                         <button
                            onClick={handleGenerateClick}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all
                                ${isGenerating 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95'}
                            `}
                         >
                             {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                             <span>{isGenerating ? 'Generating...' : beat.generatedImages ? 'Regenerate Images (4)' : 'Generate Images (4)'}</span>
                         </button>
                    </div>
                    {/* (Image display logic same as before, omitted for brevity but preserved in real file) */}
                    {beat.generatedImages && beat.generatedImages.length > 0 && heroImage && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black/40 group/hero shadow-2xl">
                                <img src={heroImage} alt="Main Scene" className="w-full h-full object-contain" />
                                {beat.selectedImage === heroImage ? (
                                    <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-10 backdrop-blur-md bg-opacity-90">
                                        <Check className="w-3.5 h-3.5" /> Selected Main
                                    </div>
                                ) : (
                                    <div className="absolute top-4 left-4 bg-slate-900/60 text-slate-300 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-md z-10">Previewing Variation</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                     <div className="flex justify-end gap-3">
                                         <button onClick={() => setPreviewImage(heroImage)} className="p-3 bg-slate-800/80 hover:bg-white text-white hover:text-slate-900 rounded-xl transition-all border border-white/10 hover:scale-110"><Maximize className="w-5 h-5" /></button>
                                         <button onClick={() => downloadImage(heroImage, 0)} className="p-3 bg-slate-800/80 hover:bg-sky-500 text-white rounded-xl transition-all border border-white/10 hover:scale-110"><Download className="w-5 h-5" /></button>
                                     </div>
                                </div>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                                {beat.generatedImages.map((img, idx) => (
                                    <button key={idx} onClick={() => onSelectImage && onSelectImage(beat.id, img)} className={`relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 group/thumb ${heroImage === img ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-900 opacity-100 scale-105 shadow-lg z-10' : 'opacity-70 hover:opacity-100 border border-slate-700 hover:border-slate-500 hover:scale-105'} ${beat.selectedImage === img && heroImage !== img ? 'ring-1 ring-emerald-500 ring-offset-1 ring-offset-slate-900' : ''}`}>
                                        <img src={img} alt={`Var ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
             )}

            {/* Poses Section */}
            {beat.poses && beat.poses.length > 0 && (
              <div className="bg-indigo-950/20 rounded-lg border border-indigo-500/20 relative overflow-hidden">
                <div className="px-5 py-3 border-b border-indigo-500/10 flex items-center gap-2 bg-indigo-950/30">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Character Poses</span>
                </div>
                <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2">
                  {beat.poses.map((pose, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded p-3 border border-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-indigo-200 text-sm">{pose.name}</span>
                                </div>
                                {pose.anchor && (
                                <div className="flex items-center gap-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                                    <Anchor className="w-3 h-3" />
                                    <span>{pose.anchor}</span>
                                </div>
                                )}
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={editedBeat.poses?.[idx]?.description || ""}
                                    onChange={(e) => {
                                        const newPoses = [...(editedBeat.poses || [])];
                                        newPoses[idx] = { ...newPoses[idx], description: e.target.value };
                                        updateField('poses', newPoses);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                                />
                            ) : (
                                <div className="text-xs text-slate-400 leading-relaxed font-mono">
                                    <Activity className="w-3 h-3 inline mr-1 opacity-50" />
                                    {pose.description}
                                </div>
                            )}
                        </div>
                  ))}
                </div>
              </div>
            )}

            {/* Camera Shot Section */}
            {beat.camera && (
              <div className="bg-rose-950/20 rounded-lg border border-rose-500/20 relative overflow-hidden">
                 <div className="px-5 py-3 border-b border-rose-500/10 flex items-center gap-2 bg-rose-950/30">
                  <Video className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-300">Camera Direction</span>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <Aperture className="w-4 h-4 text-rose-500 mt-0.5" />
                         <div className="w-full">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Lens & Angle</span>
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <input value={editedBeat.camera?.lens} onChange={(e) => updateNestedField('camera', 'lens', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-rose-200 w-full" />
                                    <input value={editedBeat.camera?.angle} onChange={(e) => updateNestedField('camera', 'angle', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-rose-200 w-full" />
                                </div>
                            ) : (
                                <span className="text-sm text-rose-200 font-medium">{beat.camera.lens} • {beat.camera.angle}</span>
                            )}
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <Target className="w-4 h-4 text-rose-500 mt-0.5" />
                         <div className="w-full">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Focal Point</span>
                            {isEditing ? (
                                <input value={editedBeat.camera?.focalPoint} onChange={(e) => updateNestedField('camera', 'focalPoint', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-full" />
                            ) : (
                                <span className="text-sm text-slate-300">{beat.camera.focalPoint}</span>
                            )}
                         </div>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <Maximize className="w-4 h-4 text-rose-500 mt-0.5" />
                      <div className="w-full">
                         <span className="text-[10px] uppercase font-bold text-slate-500 block">Composition Strategy</span>
                         {isEditing ? (
                             <textarea value={editedBeat.camera?.composition} onChange={(e) => updateNestedField('camera', 'composition', e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 w-full" rows={3} />
                         ) : (
                             <p className="text-sm text-slate-300 leading-relaxed font-mono text-xs opacity-90 mt-1">{beat.camera.composition}</p>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* VFX Section */}
            {beat.vfx && (
              <div className="bg-emerald-950/20 rounded-lg border border-emerald-500/20 relative overflow-hidden">
                 <div className="px-5 py-3 border-b border-emerald-500/10 flex items-center gap-2 bg-emerald-950/30">
                  <Wand2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">VFX & Lighting</span>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <Sun className="w-4 h-4 text-emerald-500 mt-0.5" />
                         <div className="w-full">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Lighting Strategy</span>
                            {isEditing ? (
                                <input value={editedBeat.vfx?.lighting} onChange={(e) => updateNestedField('vfx', 'lighting', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-200 w-full" />
                            ) : (
                                <p className="text-sm text-emerald-200 leading-snug">{beat.vfx.lighting}</p>
                            )}
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <CloudFog className="w-4 h-4 text-emerald-500 mt-0.5" />
                         <div className="w-full">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Atmosphere</span>
                            {isEditing ? (
                                <input value={editedBeat.vfx?.atmosphere} onChange={(e) => updateNestedField('vfx', 'atmosphere', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-full" />
                            ) : (
                                <p className="text-sm text-slate-300 leading-snug">{beat.vfx.atmosphere}</p>
                            )}
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5" />
                         <div className="w-full">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Specific VFX</span>
                             {isEditing ? (
                                <input value={editedBeat.vfx?.specialEffects} onChange={(e) => updateNestedField('vfx', 'specialEffects', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-full" />
                            ) : (
                                <p className="text-sm text-slate-300 leading-snug">{beat.vfx.specialEffects}</p>
                            )}
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <Layers className="w-4 h-4 text-emerald-500 mt-0.5" />
                         <div className="w-full">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Post-Processing</span>
                            {isEditing ? (
                                <input value={editedBeat.vfx?.postProcessing} onChange={(e) => updateNestedField('vfx', 'postProcessing', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-full" />
                            ) : (
                                <div className="flex flex-wrap gap-1 mt-1">
                                {beat.vfx.postProcessing.split(',').map((tag, i) => (
                                    <span key={i} className="text-[10px] bg-emerald-900/50 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300/80">
                                    {tag.trim()}
                                    </span>
                                ))}
                                </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Script Section */}
            <div className="pl-2 relative">
               <div className="flex items-center gap-2 mb-3 text-indigo-400">
                <MessageSquareQuote className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Script & Dialogue</span>
              </div>
              
              <div className="pl-4 border-l-2 border-slate-700">
                {isEditing ? (
                    <textarea 
                        value={editedBeat.script}
                        onChange={(e) => updateField('script', e.target.value)}
                        className="w-full h-48 bg-slate-900 border border-slate-700 rounded p-4 font-serif text-lg leading-relaxed text-slate-300 focus:border-indigo-500 outline-none"
                    />
                ) : (
                    beat.script.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    
                    const firstColon = trimmed.indexOf(':');
                    if (firstColon > -1 && firstColon < 50) {
                        const speaker = trimmed.substring(0, firstColon);
                        const content = trimmed.substring(firstColon + 1);
                        const lowerSpeaker = speaker.toLowerCase();
                        
                        const isNarrator = lowerSpeaker.includes('narrator');
                        const isThought = lowerSpeaker.includes('thinking');
                        
                        return (
                        <div key={i} className="mb-4 font-serif text-lg leading-relaxed">
                            <span className={`font-bold mr-2 ${isNarrator ? 'text-amber-500/80 uppercase text-xs tracking-wider' : isThought ? 'text-indigo-400' : 'text-sky-400'}`}>
                            {speaker}:
                            </span>
                            <span className={`${isNarrator ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                            {content}
                            </span>
                        </div>
                        );
                    }
                    return <div key={i} className="mb-4 font-serif text-lg leading-relaxed text-slate-300">{trimmed}</div>
                    })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Full Screen Preview */}
      {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
              <button className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink className="w-8 h-8" />
              </button>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
      )}

      {/* Source Text Modal (unchanged logic) */}
      {showSourceText && beat.sourceText && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowSourceText(false)}>
              <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                           <FileText className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 font-serif">Original Source Text</h3>
                      </div>
                      <button onClick={() => setShowSourceText(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-8 overflow-y-auto custom-scrollbar bg-[#0b1221]">
                      <p className="text-slate-300 font-serif text-lg leading-loose whitespace-pre-wrap italic opacity-90 border-l-4 border-indigo-500/30 pl-6">{beat.sourceText}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BeatCard;