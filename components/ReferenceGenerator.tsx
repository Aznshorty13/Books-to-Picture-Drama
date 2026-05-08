import React from 'react';
import { StoryBible } from '../types';
import { Users, Sparkles, Image as ImageIcon, MapPin, Paintbrush } from 'lucide-react';

interface ReferenceGeneratorProps {
  bible: StoryBible | null;
  selectedStyleId: string;
}

const ReferenceGenerator: React.FC<ReferenceGeneratorProps> = ({ bible, selectedStyleId }) => {
  return (
    <div className="w-full max-w-6xl mx-auto p-8 animate-fade-in-up">
        {bible ? (
            <div className="space-y-12">
                <div className="text-center space-y-4 mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-medium">
                            <Paintbrush className="w-3 h-3" />
                            <span>Using Style: {selectedStyleId}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-slate-100">Character & World Concepts</h2>
                        <p className="text-slate-400 max-w-lg mx-auto">Generate consistent visual references for your Story Bible elements using the selected art style.</p>
                </div>

                {/* Characters Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-xl font-bold text-slate-200 font-serif">Character Sheets</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bible.characters.map((char, idx) => (
                            <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all group flex flex-col shadow-sm hover:shadow-lg hover:shadow-indigo-900/10">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-200 text-lg">{char.name}</h4>
                                        <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded">{char.role}</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600 border border-slate-700/50 overflow-hidden">
                                        {char.imageRef ? (
                                            <img src={char.imageRef} alt={char.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1 leading-relaxed">{char.description}</p>
                                <button className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-indigo-500">
                                    <Sparkles className="w-3 h-3" /> Generate Sheet
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Settings Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-2">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-xl font-bold text-slate-200 font-serif">Environment Concepts</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bible.settings.map((setting, idx) => (
                            <div key={idx} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-all group flex flex-col shadow-sm hover:shadow-lg hover:shadow-indigo-900/10">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-slate-200 text-lg">{setting.name}</h4>
                                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600 border border-slate-700/50 overflow-hidden">
                                       {setting.imageRef ? (
                                            <img src={setting.imageRef} alt={setting.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1 leading-relaxed">{setting.description}</p>
                                <button className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-indigo-500">
                                    <Sparkles className="w-3 h-3" /> Generate Concept
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-slate-700">
                    <Users className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-medium text-slate-400 mb-2">No Context Loaded</h3>
                <p className="text-slate-500 text-center max-w-sm">Analyze a story or upload a project file to see characters and settings here.</p>
            </div>
        )}
    </div>
  );
};

export default ReferenceGenerator;