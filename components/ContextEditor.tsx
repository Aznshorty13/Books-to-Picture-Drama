import React, { useState } from 'react';
import { StoryBible, Character, Setting } from '../types';
import { X, Save, Plus, Trash2, Users, MapPin, FileText, Upload, Image as ImageIcon } from 'lucide-react';

interface ContextEditorProps {
  initialData: StoryBible;
  onSave: (data: StoryBible) => void;
  onClose: () => void;
}

type Tab = 'summary' | 'characters' | 'settings';

const ContextEditor: React.FC<ContextEditorProps> = ({ initialData, onSave, onClose }) => {
  const [data, setData] = useState<StoryBible>(initialData);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const updateSummary = (summary: string) => {
    setData(prev => ({ ...prev, summary }));
  };

  // Helper to process image upload
  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Character Handlers
  const addCharacter = () => {
    setData(prev => ({
      ...prev,
      characters: [...prev.characters, { name: '', role: '', description: '' }]
    }));
  };

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const newChars = [...data.characters];
    newChars[index] = { ...newChars[index], [field]: value };
    setData(prev => ({ ...prev, characters: newChars }));
  };

  const removeCharacter = (index: number) => {
    setData(prev => ({
      ...prev,
      characters: prev.characters.filter((_, i) => i !== index)
    }));
  };

  // Setting Handlers
  const addSetting = () => {
    setData(prev => ({
      ...prev,
      settings: [...prev.settings, { name: '', description: '' }]
    }));
  };

  const updateSetting = (index: number, field: keyof Setting, value: string) => {
    const newSettings = [...data.settings];
    newSettings[index] = { ...newSettings[index], [field]: value };
    setData(prev => ({ ...prev, settings: newSettings }));
  };

  const removeSetting = (index: number) => {
    setData(prev => ({
      ...prev,
      settings: prev.settings.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-100 font-serif">Edit Context Bible</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6 bg-slate-900">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-4 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" /> Summary
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`py-4 px-4 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'characters' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" /> Characters ({data.characters.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-4 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <MapPin className="w-4 h-4" /> Settings ({data.settings.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 custom-scrollbar">
          
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-400">Current Story Summary</label>
              <textarea
                value={data.summary}
                onChange={(e) => updateSummary(e.target.value)}
                className="w-full h-96 p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none font-serif leading-relaxed"
                placeholder="Enter the story summary here..."
              />
            </div>
          )}

          {/* Characters Tab */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              {data.characters.map((char, idx) => (
                <div key={idx} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3 relative group hover:border-slate-600 transition-colors">
                   <button 
                    onClick={() => removeCharacter(idx)}
                    className="absolute top-4 right-4 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Character"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex gap-4">
                      {/* Image Upload Area */}
                      <div className="flex-shrink-0">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ref Image</label>
                          <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden group/image cursor-pointer hover:border-primary transition-colors">
                              {char.imageRef ? (
                                  <img src={char.imageRef} alt={char.name} className="w-full h-full object-cover" />
                              ) : (
                                  <ImageIcon className="w-8 h-8 text-slate-600 group-hover/image:text-slate-400" />
                              )}
                              <input 
                                  type="file" 
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, (b64) => updateCharacter(idx, 'imageRef', b64));
                                  }}
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
                                  <Upload className="w-4 h-4 text-white" />
                              </div>
                          </div>
                      </div>

                      {/* Text Fields */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                <input 
                                    type="text" 
                                    value={char.name}
                                    onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                                <input 
                                    type="text" 
                                    value={char.role}
                                    onChange={(e) => updateCharacter(idx, 'role', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                            <textarea 
                            value={char.description}
                            onChange={(e) => updateCharacter(idx, 'description', e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-primary resize-none"
                            />
                        </div>
                      </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addCharacter}
                className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Character
              </button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {data.settings.map((setting, idx) => (
                <div key={idx} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3 relative group hover:border-slate-600 transition-colors">
                   <button 
                    onClick={() => removeSetting(idx)}
                    className="absolute top-4 right-4 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Setting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-4">
                      {/* Image Upload Area */}
                      <div className="flex-shrink-0">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ref Image</label>
                          <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden group/image cursor-pointer hover:border-primary transition-colors">
                              {setting.imageRef ? (
                                  <img src={setting.imageRef} alt={setting.name} className="w-full h-full object-cover" />
                              ) : (
                                  <ImageIcon className="w-8 h-8 text-slate-600 group-hover/image:text-slate-400" />
                              )}
                              <input 
                                  type="file" 
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, (b64) => updateSetting(idx, 'imageRef', b64));
                                  }}
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
                                  <Upload className="w-4 h-4 text-white" />
                              </div>
                          </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                            <input 
                            type="text" 
                            value={setting.name}
                            onChange={(e) => updateSetting(idx, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                            <textarea 
                            value={setting.description}
                            onChange={(e) => updateSetting(idx, 'description', e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-primary resize-none"
                            />
                        </div>
                      </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addSetting}
                className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Setting
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary hover:bg-sky-400 text-slate-900 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Context
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextEditor;