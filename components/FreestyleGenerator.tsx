import React, { useRef, useState } from 'react';
import { Sparkles, Download, Maximize2, X, Loader2, Paintbrush, Image as ImageIcon, Trash2 } from 'lucide-react';
import { generateReferenceImage } from '../services/geminiService';

interface FreestyleGeneratorProps {
  styleId: string;
  styleDescription: string;
}

const FreestyleGenerator: React.FC<FreestyleGeneratorProps> = ({ styleId, styleDescription }) => {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setImages([]); // Clear previous batch
    
    try {
      // Fire 4 requests in parallel to get 4 variations
      // We pass the uploaded image (or undefined) to the service
      const promises = Array(4).fill(0).map(() => generateReferenceImage(prompt, styleDescription, uploadedImage || undefined));
      const results = await Promise.all(promises);
      setImages(results);
    } catch (e) {
      console.error(e);
      alert("Failed to generate images. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (base64: string, index: number) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `ref-gen-${index}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setUploadedImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
      
      {/* Input Section */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
             <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-medium flex items-center gap-2">
                <Paintbrush className="w-3 h-3" />
                <span>Active Style: <span className="text-white">{styleId}</span></span>
            </div>
            
            <div className="flex items-center gap-2">
                {uploadedImage && (
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg pr-2 border border-slate-700">
                        <img src={uploadedImage} alt="Reference" className="w-8 h-8 rounded-l-lg object-cover" />
                        <span className="text-xs text-slate-300">Ref Image Loaded</span>
                        <button 
                            onClick={() => setUploadedImage(null)}
                            className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${uploadedImage ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'}`}
                >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{uploadedImage ? 'Change Image' : 'Add Ref Image'}</span>
                </button>
            </div>
        </div>
        
        <div className="relative">
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate (e.g., 'A futuristic city floating in the clouds during sunset')..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none h-32 text-lg font-serif"
                disabled={loading}
            />
            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`absolute bottom-4 right-4 flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all
                    ${loading || !prompt.trim() 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'}
                `}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>{loading ? 'Generating...' : 'Generate 4 Images'}</span>
            </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1">
         {images.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {images.map((img, idx) => (
                     <div key={idx} className="group relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                         <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-cover" />
                         
                         {/* Overlay Actions */}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                             <button 
                                onClick={() => setPreviewImage(img)}
                                className="p-3 bg-slate-800/80 hover:bg-indigo-600 text-white rounded-full backdrop-blur-sm transition-colors border border-white/10"
                                title="Preview"
                             >
                                 <Maximize2 className="w-5 h-5" />
                             </button>
                             <button 
                                onClick={() => handleDownload(img, idx)}
                                className="p-3 bg-slate-800/80 hover:bg-emerald-600 text-white rounded-full backdrop-blur-sm transition-colors border border-white/10"
                                title="Download"
                             >
                                 <Download className="w-5 h-5" />
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
         ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px]">
                 <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 opacity-20" />
                 </div>
                 <p>Enter a prompt above to generate 4 reference images.</p>
             </div>
         )}
      </div>

      {/* Full Screen Preview */}
      {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors"
              >
                  <X className="w-8 h-8" />
              </button>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
      )}

    </div>
  );
};

export default FreestyleGenerator;