import React, { useState } from 'react';
import { StoryBible } from '../types';
import { Users, MapPin, FileText, Download, Edit2, Image as ImageIcon } from 'lucide-react';
import ContextEditor from './ContextEditor';

interface BibleViewProps {
  bible: StoryBible;
  onUpdate: (bible: StoryBible) => void;
}

const BibleView: React.FC<BibleViewProps> = ({ bible, onUpdate }) => {
  const [showEditor, setShowEditor] = useState(false);

  const handleDownload = () => {
    const jsonString = JSON.stringify(bible, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `story-bible-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-8 space-y-8 animate-fade-in-up">
      
      {/* Header with Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
        >
          <Edit2 className="w-4 h-4" />
          Edit Bible
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors border border-primary/20 hover:border-primary/50"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Summary Section */}
      <section className="bg-surface rounded-xl border border-slate-700/50 overflow-hidden shadow-md">
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-slate-100 font-serif">Story Summary</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-300 leading-relaxed font-serif text-lg">{bible.summary}</p>
        </div>
      </section>

      {/* Characters Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-slate-100 font-serif">Characters (Major)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bible.characters.map((char, idx) => (
            <div key={idx} className="bg-surface p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors shadow-sm flex gap-4">
               {/* Character Image */}
               <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                  {char.imageRef ? (
                      <img src={char.imageRef} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                      <Users className="w-8 h-8 text-slate-700" />
                  )}
               </div>
               
               <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-slate-100">{char.name}</h4>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                    {char.role}
                    </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{char.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Settings Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-slate-100 font-serif">Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bible.settings.map((setting, idx) => (
            <div key={idx} className="bg-surface p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors shadow-sm flex gap-4">
                {/* Setting Image */}
               <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                  {setting.imageRef ? (
                      <img src={setting.imageRef} alt={setting.name} className="w-full h-full object-cover" />
                  ) : (
                      <MapPin className="w-8 h-8 text-slate-700" />
                  )}
               </div>

              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-100 mb-2">{setting.name}</h4>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{setting.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="h-8"></div> {/* Spacer */}

      {/* Editor Modal */}
      {showEditor && (
        <ContextEditor
          initialData={bible}
          onSave={(updatedBible) => {
            onUpdate(updatedBible);
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default BibleView;