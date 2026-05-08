import React, { useState, useEffect } from 'react';
import { 
    DEFAULT_DIRECTOR_PROMPTS, 
    DEFAULT_IMAGE_PROMPTS, 
    DEFAULT_ASSET_PROMPTS,
    getDirectorPrompts, 
    getImagePrompts, 
    getAssetPrompts,
    saveDirectorPrompts, 
    saveImagePrompts, 
    saveAssetPrompts,
    resetPrompts,
    ART_STYLES 
} from '../services/geminiService';
import { Terminal, Cpu, Clapperboard, Video, Wand2, Copy, Check, BookOpen, Image as ImageIcon, Sparkles, Paintbrush, Save, RotateCcw, AlertCircle, Box, User } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directors' | 'images' | 'styles'>('directors');
  
  // Local editable state
  const [directorPrompts, setDirectorPrompts] = useState<typeof DEFAULT_DIRECTOR_PROMPTS>(DEFAULT_DIRECTOR_PROMPTS);
  const [imagePrompts, setImagePrompts] = useState<typeof DEFAULT_IMAGE_PROMPTS>(DEFAULT_IMAGE_PROMPTS);
  const [assetPrompts, setAssetPrompts] = useState<typeof DEFAULT_ASSET_PROMPTS>(DEFAULT_ASSET_PROMPTS);
  
  const [activeDirector, setActiveDirector] = useState<keyof typeof DEFAULT_DIRECTOR_PROMPTS>('analyzer');
  const [activeImageGenKey, setActiveImageGenKey] = useState<string>('scene'); // General string to hold key for both image/asset
  
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

  // Load active prompts from service on mount
  useEffect(() => {
      setDirectorPrompts(JSON.parse(JSON.stringify(getDirectorPrompts())));
      setImagePrompts(JSON.parse(JSON.stringify(getImagePrompts())));
      setAssetPrompts(JSON.parse(JSON.stringify(getAssetPrompts())));
  }, []);

  const directorIcons = {
    analyzer: BookOpen,
    pose: Cpu,
    camera: Video,
    vfx: Wand2
  };

  const imageIcons = {
      reference: Sparkles,
      scene: ImageIcon
  };

  const assetIcons = {
      textbox: Box,
      sprite: User
  };

  const showNotification = (msg: string, type: 'success' | 'info' = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
      saveDirectorPrompts(directorPrompts);
      saveImagePrompts(imagePrompts);
      saveAssetPrompts(assetPrompts);
      showNotification("Configuration saved successfully!");
  };

  const handleReset = () => {
      if (confirm("Are you sure you want to reset all prompts to their default values? This cannot be undone.")) {
          resetPrompts();
          setDirectorPrompts(JSON.parse(JSON.stringify(getDirectorPrompts())));
          setImagePrompts(JSON.parse(JSON.stringify(getImagePrompts())));
          setAssetPrompts(JSON.parse(JSON.stringify(getAssetPrompts())));
          showNotification("Prompts reset to defaults.", "info");
      }
  };

  // Handlers for updating local state
  const updateDirector = (key: keyof typeof DEFAULT_DIRECTOR_PROMPTS, field: 'system' | 'userTemplate', value: string) => {
      setDirectorPrompts(prev => ({
          ...prev,
          [key]: {
              ...prev[key],
              [field]: value
          }
      }));
  };

  // Generic handler for Image OR Asset prompts since they share structure { id, name, description, template }
  const updateImageOrAssetPrompt = (key: string, field: 'template', value: string) => {
      if (key in imagePrompts) {
          setImagePrompts(prev => ({
              ...prev,
              [key as keyof typeof DEFAULT_IMAGE_PROMPTS]: {
                  ...prev[key as keyof typeof DEFAULT_IMAGE_PROMPTS],
                  [field]: value
              }
          }));
      } else if (key in assetPrompts) {
          setAssetPrompts(prev => ({
              ...prev,
              [key as keyof typeof DEFAULT_ASSET_PROMPTS]: {
                  ...prev[key as keyof typeof DEFAULT_ASSET_PROMPTS],
                  [field]: value
              }
          }));
      }
  };

  const currentDirector = directorPrompts[activeDirector];
  
  // Resolve current image/asset prompt object
  const currentImageGenPrompt = 
    (activeImageGenKey in imagePrompts ? imagePrompts[activeImageGenKey as keyof typeof DEFAULT_IMAGE_PROMPTS] : null) || 
    (activeImageGenKey in assetPrompts ? assetPrompts[activeImageGenKey as keyof typeof DEFAULT_ASSET_PROMPTS] : null);

  return (
    <div className="h-full w-full flex bg-[#0b1221] overflow-hidden relative">
      
      {/* Toast Notification */}
      {notification && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animate-fade-in-down
            ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100' : 'bg-slate-800/90 border-slate-600 text-slate-200'}
          `}>
              <Check className="w-5 h-5" />
              <span className="font-medium">{notification.msg}</span>
          </div>
      )}

      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col z-10">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2 text-slate-200">
              <Terminal className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold font-serif">Prompt Config</h2>
           </div>
           <p className="text-xs text-slate-500 mt-2">Edit the underlying instructions for the AI Directors & Image Generators.</p>
        </div>
        
        {/* Main Tabs */}
        <div className="flex p-2 gap-2 border-b border-slate-800">
             <button 
                onClick={() => setActiveTab('directors')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'directors' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
             >
                 Directors
             </button>
             <button 
                onClick={() => setActiveTab('images')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'images' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
             >
                 Image Gen
             </button>
             <button 
                onClick={() => setActiveTab('styles')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'styles' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
             >
                 Styles
             </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar">
           {activeTab === 'directors' && (
                (Object.keys(directorPrompts) as Array<keyof typeof DEFAULT_DIRECTOR_PROMPTS>).map((key) => {
                    const Icon = directorIcons[key] || Clapperboard;
                    return (
                    <button
                        key={key}
                        onClick={() => setActiveDirector(key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left
                        ${activeDirector === key 
                            ? 'bg-slate-800 text-primary border border-slate-700 shadow-md' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                        `}
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{directorPrompts[key].name}</span>
                    </button>
                    );
                })
           )}

           {activeTab === 'images' && (
                <div className="space-y-4">
                    {/* Core Image Generators */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Core Generators</span>
                        {(Object.keys(imagePrompts) as Array<keyof typeof DEFAULT_IMAGE_PROMPTS>).map((key) => {
                            const Icon = imageIcons[key] || ImageIcon;
                            return (
                            <button
                                key={key}
                                onClick={() => setActiveImageGenKey(key)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left
                                ${activeImageGenKey === key 
                                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md' 
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                                `}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{imagePrompts[key].name}</span>
                            </button>
                            );
                        })}
                    </div>

                    {/* Asset Generators */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Assets & UI</span>
                        {(Object.keys(assetPrompts) as Array<keyof typeof DEFAULT_ASSET_PROMPTS>).map((key) => {
                            const Icon = assetIcons[key] || Box;
                            return (
                            <button
                                key={key}
                                onClick={() => setActiveImageGenKey(key)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left
                                ${activeImageGenKey === key 
                                    ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-md' 
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                                `}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{assetPrompts[key].name}</span>
                            </button>
                            );
                        })}
                    </div>
                </div>
           )}
           
           {activeTab === 'styles' && (
               <div className="text-xs text-slate-500 italic p-2 text-center">
                   Visual styles are currently read-only. Edit Directors or Image Gen templates to change how styles are applied.
               </div>
           )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/80">
            <button 
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-sky-400 text-slate-900 rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
            >
                <Save className="w-4 h-4" /> Save Config
            </button>
            <button 
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-lg text-xs font-medium transition-all"
            >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         {/* Header */}
         <header className="px-8 py-6 border-b border-slate-800 bg-background/80 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-slate-100 font-serif mb-1 flex items-center gap-3">
                {activeTab === 'directors' ? currentDirector.name : 
                 activeTab === 'images' && currentImageGenPrompt ? currentImageGenPrompt.name : 'Art Styles'}
                 <span className="text-xs font-sans font-normal bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">Editable Mode</span>
            </h2>
            <p className="text-slate-400 text-sm">
                {activeTab === 'directors' ? currentDirector.description : 
                 activeTab === 'images' && currentImageGenPrompt ? currentImageGenPrompt.description : 'Preset visual styles injected into generation prompts.'}
            </p>
         </header>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            
            {activeTab === 'directors' && (
                <>
                    {/* System Instruction */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider">
                            <Cpu className="w-4 h-4" />
                            <span>System Instruction</span>
                        </div>
                        <p className="text-xs text-slate-500">Defines the persona and high-level rules for the AI Director.</p>
                        <textarea 
                            value={currentDirector.system}
                            onChange={(e) => updateDirector(activeDirector, 'system', e.target.value)}
                            className="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-6 font-mono text-sm text-slate-300 leading-relaxed shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-y"
                        />
                    </div>

                    {/* User Prompt Template */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-wider">
                            <Terminal className="w-4 h-4" />
                            <span>User Prompt Template</span>
                        </div>
                         <p className="text-xs text-slate-500">The actual prompt sent to the model. Use <code>{'{{...}}'}</code> for variables.</p>
                        <textarea 
                            value={currentDirector.userTemplate}
                            onChange={(e) => updateDirector(activeDirector, 'userTemplate', e.target.value)}
                            className="w-full h-96 bg-slate-900 border border-slate-700 rounded-xl p-6 font-mono text-sm text-indigo-100/90 leading-relaxed shadow-inner focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-y whitespace-pre-wrap"
                        />
                    </div>
                </>
            )}

            {activeTab === 'images' && currentImageGenPrompt && (
                <>
                     {/* Image Generation Template */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                            <ImageIcon className="w-4 h-4" />
                            <span>Image Generation Template</span>
                        </div>
                        <p className="text-xs text-slate-500">The prompt structure used for generating images. <code>{'{{STYLE}}'}</code> injects the selected art style.</p>
                        <textarea 
                            value={currentImageGenPrompt.template}
                            onChange={(e) => updateImageOrAssetPrompt(activeImageGenKey, 'template', e.target.value)}
                            className="w-full h-[600px] bg-slate-900 border border-slate-700 rounded-xl p-6 font-mono text-sm text-emerald-100/90 leading-relaxed shadow-inner focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-y whitespace-pre-wrap"
                        />
                    </div>
                </>
            )}

            {activeTab === 'styles' && (
                <div className="grid grid-cols-1 gap-4">
                    {ART_STYLES.map(style => (
                        <div key={style.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all group">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Paintbrush className="w-4 h-4 text-pink-400" />
                                    <h3 className="font-bold text-slate-200">{style.name}</h3>
                                </div>
                                <span className="text-xs font-mono text-slate-600 bg-slate-800 px-2 py-1 rounded">ID: {style.id}</span>
                            </div>
                            <div className="mt-3">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prompt Injection</div>
                                <div className="font-mono text-sm text-pink-100/80 bg-slate-950/50 p-3 rounded-lg border border-transparent group-hover:border-slate-700/50">
                                    {style.description}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg flex items-center gap-3 text-slate-500 text-sm">
                        <AlertCircle className="w-5 h-5" />
                        To add new styles, modify the <code>services/geminiService.ts</code> file directly. This UI currently supports editing prompt templates only.
                    </div>
                </div>
            )}

         </div>
      </div>

    </div>
  );
};

export default SettingsView;