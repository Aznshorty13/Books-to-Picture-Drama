import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, User, Layout, Download, Loader2, Maximize, Move, Sliders, Link, CheckCircle2 } from 'lucide-react';
import { generateAsset } from '../services/geminiService';
import { StoryBible, AssetState } from '../types';

interface AssetGeneratorProps {
  styleId: string;
  styleDescription: string;
  bible: StoryBible | null;
  assetState: AssetState;
  setAssetState: React.Dispatch<React.SetStateAction<AssetState>>;
}

const AssetGenerator: React.FC<AssetGeneratorProps> = ({ 
    styleId, 
    styleDescription, 
    bible, 
    assetState, 
    setAssetState 
}) => {
  const [activeAssetTab, setActiveAssetTab] = useState<'textbox' | 'sprite'>('textbox');
  const [isGenerating, setIsGenerating] = useState(false);

  // Drag & Resize State
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ type: 'sprite' | 'textbox', mode: 'move' | 'resize', startX: number, startY: number, initialLayout: any } | null>(null);

  // Detect linked characters for Sprites
  const linkedCharacters = useMemo(() => {
      if (!bible || activeAssetTab !== 'sprite') return [];
      const promptLower = assetState.spritePrompt.toLowerCase();
      return bible.characters.filter(char => 
          promptLower.includes(char.name.toLowerCase()) && char.imageRef
      );
  }, [bible, assetState.spritePrompt, activeAssetTab]);

  const updateState = (updates: Partial<AssetState>) => {
      setAssetState(prev => ({ ...prev, ...updates }));
  };

  const updateLayout = (type: 'sprite' | 'textbox', updates: any) => {
      setAssetState(prev => ({
          ...prev,
          layout: {
              ...prev.layout,
              [type]: { ...prev.layout[type], ...updates }
          }
      }));
  };

  const handleGenerate = async () => {
      const prompt = activeAssetTab === 'textbox' ? assetState.textBoxPrompt : assetState.spritePrompt;
      if (!prompt.trim()) return;

      setIsGenerating(true);
      try {
          const promises = Array(4).fill(0).map(() => generateAsset(activeAssetTab, prompt, styleDescription, bible));
          const results = await Promise.all(promises);
          
          if (activeAssetTab === 'textbox') {
              updateState({ 
                  generatedTextBoxes: [...results, ...assetState.generatedTextBoxes],
                  activeTextBox: !assetState.activeTextBox ? results[0] : assetState.activeTextBox 
              });
          } else {
              updateState({ 
                  generatedSprites: [...results, ...assetState.generatedSprites],
                  activeSprite: !assetState.activeSprite ? results[0] : assetState.activeSprite 
              });
          }
      } catch (e) {
          console.error(e);
          alert("Failed to generate asset.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleDownload = (base64: string, prefix: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${prefix}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Drag & Drop Logic ---

  const handleMouseDown = (e: React.MouseEvent, type: 'sprite' | 'textbox', mode: 'move' | 'resize') => {
      e.stopPropagation();
      e.preventDefault();
      
      const element = assetState.layout[type];
      
      setDragging({
          type,
          mode,
          startX: e.clientX,
          startY: e.clientY,
          initialLayout: { ...element }
      });
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!dragging || !stageRef.current) return;

          const stageRect = stageRef.current.getBoundingClientRect();
          const deltaXPct = ((e.clientX - dragging.startX) / stageRect.width) * 100;
          const deltaYPct = ((e.clientY - dragging.startY) / stageRect.height) * 100;

          if (dragging.mode === 'move') {
              updateLayout(dragging.type, {
                  x: Math.max(0, Math.min(100 - dragging.initialLayout.width, dragging.initialLayout.x + deltaXPct)),
                  y: Math.max(0, Math.min(100 - dragging.initialLayout.height, dragging.initialLayout.y + deltaYPct))
              });
          } else if (dragging.mode === 'resize') {
              // Simple bottom-right resize logic
              // Enforce min size
              const newWidth = Math.max(5, dragging.initialLayout.width + deltaXPct);
              const newHeight = Math.max(5, dragging.initialLayout.height + deltaYPct);
              
              updateLayout(dragging.type, {
                  width: newWidth,
                  height: newHeight
              });
          }
      };

      const handleMouseUp = () => {
          setDragging(null);
      };

      if (dragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [dragging]);


  return (
    <div className="w-full h-full flex flex-col p-4 gap-6 overflow-y-auto custom-scrollbar">
        
        {/* Top Section: Layout Composer (Preview) */}
        <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row gap-8">
            {/* The Stage */}
            <div 
                ref={stageRef}
                className="flex-1 relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner group select-none"
            >
                {/* Placeholder Background Grid */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-50 pointer-events-none">
                     {Array.from({ length: 400 }).map((_, i) => (
                         <div key={i} className="border-[0.5px] border-slate-700/20"></div>
                     ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                     <span className="text-4xl font-bold text-slate-700 uppercase tracking-widest">16:9 Stage Preview</span>
                </div>

                {/* Sprite Layer */}
                {assetState.activeSprite && (
                    <div 
                        className="absolute cursor-move group/sprite z-10"
                        style={{ 
                            left: `${assetState.layout.sprite.x}%`, 
                            top: `${assetState.layout.sprite.y}%`, 
                            width: `${assetState.layout.sprite.width}%`,
                            height: `${assetState.layout.sprite.height}%`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'sprite', 'move')}
                    >
                        <div className="relative w-full h-full border-2 border-transparent group-hover/sprite:border-indigo-500/50 transition-colors">
                            <img 
                                src={assetState.activeSprite} 
                                alt="Active Sprite" 
                                className="w-full h-full object-contain drop-shadow-2xl filter brightness-110" 
                                style={{ mixBlendMode: 'multiply' }} 
                            />
                            {/* Resize Handle */}
                            <div 
                                className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 rounded-tl cursor-se-resize opacity-0 group-hover/sprite:opacity-100 transition-opacity z-20"
                                onMouseDown={(e) => handleMouseDown(e, 'sprite', 'resize')}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Text Box Layer */}
                {assetState.activeTextBox && (
                    <div 
                        className="absolute cursor-move group/box z-20"
                        style={{ 
                            left: `${assetState.layout.textbox.x}%`, 
                            top: `${assetState.layout.textbox.y}%`,
                            width: `${assetState.layout.textbox.width}%`,
                            height: `${assetState.layout.textbox.height}%`,
                            opacity: assetState.layout.textbox.opacity
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'textbox', 'move')}
                    >
                        <div className="relative w-full h-full border-2 border-transparent group-hover/box:border-emerald-500/50 transition-colors">
                            <img src={assetState.activeTextBox} alt="Active Box" className="w-full h-full object-fill shadow-2xl drop-shadow-lg" />
                             {/* Resize Handle */}
                            <div 
                                className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-tl cursor-se-resize opacity-0 group-hover/box:opacity-100 transition-opacity z-20"
                                onMouseDown={(e) => handleMouseDown(e, 'textbox', 'resize')}
                            ></div>
                        </div>
                    </div>
                )}

                {!assetState.activeTextBox && !assetState.activeSprite && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
                        Select assets below to preview layout
                    </div>
                )}
            </div>

            {/* Layout Controls - simplified since we have drag n drop now */}
            <div className="w-full lg:w-72 space-y-6">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
                    <Layout className="w-4 h-4" /> Stage Director
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg text-xs text-slate-400">
                    <p className="flex items-center gap-2 mb-2">
                        <Move className="w-4 h-4" /> 
                        <span className="font-bold">Drag</span> elements to position.
                    </p>
                    <p className="flex items-center gap-2">
                        <Maximize className="w-4 h-4" /> 
                        <span className="font-bold">Drag Corners</span> to resize.
                    </p>
                </div>

                {/* Opacity Controls */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                     <div className="space-y-2">
                         <div className="flex justify-between text-xs text-slate-500">
                             <span>UI Box Opacity</span>
                             <span>{Math.round(assetState.layout.textbox.opacity * 100)}%</span>
                         </div>
                         <input 
                            type="range" 
                            min="0.2" 
                            max="1" 
                            step="0.1" 
                            value={assetState.layout.textbox.opacity} 
                            onChange={(e) => updateLayout('textbox', { opacity: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                        />
                    </div>
                </div>

                 <button className="w-full py-2 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 text-xs font-medium mt-4 cursor-not-allowed opacity-50">
                     Save Mockup Layout (Coming Soon)
                 </button>
            </div>
        </div>

        {/* Bottom Section: Asset Generation & Gallery */}
        <div className="flex flex-col md:flex-row gap-6 h-[500px]">
            
            {/* Generator Inputs */}
            <div className="w-full md:w-1/3 bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col shadow-lg">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                     <button
                        onClick={() => setActiveAssetTab('textbox')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeAssetTab === 'textbox' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50' : 'text-slate-500 hover:bg-slate-800'}`}
                     >
                         <Box className="w-4 h-4" /> Text Boxes
                     </button>
                     <button
                        onClick={() => setActiveAssetTab('sprite')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeAssetTab === 'sprite' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/50' : 'text-slate-500 hover:bg-slate-800'}`}
                     >
                         <User className="w-4 h-4" /> Sprites
                     </button>
                </div>
                
                <div className="flex-1 space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                        {activeAssetTab === 'textbox' ? 'Describe the UI' : 'Describe the Character'}
                    </label>
                    
                    {/* Linked Character Indicator */}
                    {activeAssetTab === 'sprite' && linkedCharacters.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-fade-in">
                            {linkedCharacters.map(char => (
                                <div key={char.name} className="flex items-center gap-1.5 px-2 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-xs text-indigo-300 font-medium">
                                    <Link className="w-3 h-3" />
                                    <span>Using Ref: {char.name}</span>
                                    <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea 
                        value={activeAssetTab === 'textbox' ? assetState.textBoxPrompt : assetState.spritePrompt}
                        onChange={(e) => updateState(activeAssetTab === 'textbox' ? { textBoxPrompt: e.target.value } : { spritePrompt: e.target.value })}
                        className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all
                            ${isGenerating ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] text-white'}
                        `}
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize className="w-4 h-4" />}
                        {isGenerating ? 'Generating Assets...' : 'Generate 4 Variations'}
                    </button>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Generated {activeAssetTab === 'textbox' ? 'Text Boxes' : 'Sprites'}</span>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded normal-case text-slate-500">
                        {activeAssetTab === 'textbox' ? assetState.generatedTextBoxes.length : assetState.generatedSprites.length} available
                    </span>
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(activeAssetTab === 'textbox' ? assetState.generatedTextBoxes : assetState.generatedSprites).map((img, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => updateState(activeAssetTab === 'textbox' ? { activeTextBox: img } : { activeSprite: img })}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 group
                                ${(activeAssetTab === 'textbox' ? assetState.activeTextBox : assetState.activeSprite) === img ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-slate-800 hover:border-slate-600'}
                            `}
                        >
                            <img src={img} alt="Asset" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownload(img, activeAssetTab); }}
                                    className="p-1.5 bg-black/60 hover:bg-emerald-600 text-white rounded-full backdrop-blur-md"
                                >
                                    <Download className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {(activeAssetTab === 'textbox' ? assetState.generatedTextBoxes : assetState.generatedSprites).length === 0 && (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-700 rounded-xl">
                            <span className="text-sm">No assets generated yet.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssetGenerator;