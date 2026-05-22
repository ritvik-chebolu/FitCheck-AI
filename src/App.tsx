/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  User, 
  Sparkles, 
  ShoppingBag, 
  Rss, 
  ArrowRight, 
  X, 
  Check,
  ChevronRight,
  Info,
  Maximize2
} from 'lucide-react';
import Webcam from 'react-webcam';
import { cn } from './lib/utils';
import { AppState, ClothingItem, UserProfile } from './types';
import { GeminiService } from './services/geminiService';

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [identifiedItems, setIdentifiedItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [arResult, setArResult] = useState<{ 
    summary: string;
    imageUrl: string;
  } | null>(null);
  const [activeItem, setActiveItem] = useState<ClothingItem | null>(null);
  const [visualMatchImage, setVisualMatchImage] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);

  const handleStart = (useDemo: boolean) => {
    if (useDemo) {
      const baseUrl = import.meta.env.BASE_URL;
      setUserProfile({ photo: `${baseUrl}base-image.jpg` });
      setVisualMatchImage(`${baseUrl}visual-match.jpg`);
      setIdentifiedItems([
        {
          id: "demo-1",
          name: "Combination Bomber Jacket",
          brand: "ZARA",
          price: "$89.90",
          description: "Light brown textured bomber jacket with ribbed collar and zip closure.",
          category: "top",
          imageUrl: `${baseUrl}visual-match.jpg`,
          productUrl: "https://www.zara.com/us/en/combination-bomber-jacket-p05070321.html",
          productImageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80"
        },
        {
          id: "demo-2",
          name: "Regular Fit T-shirt",
          brand: "H&M",
          price: "$12.99",
          description: "White basic crew neck t-shirt in soft cotton jersey.",
          category: "top",
          imageUrl: `${baseUrl}visual-match.jpg`,
          productUrl: "https://www2.hm.com/en_us/productpage.1285130001.html?utm_term=",
          productImageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"
        },
        {
          id: "demo-3",
          name: "Wide Fit Jeans",
          brand: "UNIQLO",
          price: "$49.90",
          description: "Light blue wide fit denim jeans with a relaxed silhouette.",
          category: "bottom",
          imageUrl: `${baseUrl}visual-match.jpg`,
          productUrl: "https://www.uniqlo.com/us/en/products/E482868-000/00?colorDisplayCode=65&sizeDisplayCode=033&pldDisplayCode=020&campaignid=21890889566&device=c&network=x",
          productImageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80"
        },
        {
          id: "demo-4",
          name: "Mt. Maddsen Mid Waterproof Hiking Boots",
          brand: "Timberland",
          price: "$120.00",
          description: "Brown leather waterproof mid-height hiking boots.",
          category: "shoes",
          imageUrl: `${baseUrl}visual-match.jpg`,
          productUrl: "https://www.rei.com/product/239978/timberland-mt-maddsen-mid-waterproof-hiking-boots-mens?sku=2399780047&store=80&CAWELAID=120217890018609822&CAGPSPN=pla&CAAGID=109205918845&CATCI=pla-451714960503",
          productImageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80"
        }
      ]);
    }
    setState('assistant');
  };

  const capture = useCallback(async () => {
    if (visualMatchImage) {
      setVisualMatchImage(null);
      setIdentifiedItems([]);
      setActiveItem(null);
      setArResult(null);
      return;
    }
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setLoading(true);
      try {
        setVisualMatchImage(imageSrc);
        const items = await GeminiService.identifyClothing(imageSrc);
        setIdentifiedItems(items);
        setState('assistant');
      } catch (error) {
        console.error("Capture error:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [visualMatchImage]);

  const handleTryOn = async (item: ClothingItem) => {
    const userPhoto = userProfile.photo;
    if (!userPhoto) {
      alert("Please upload your photo on the right sidebar first to activate the AR Mirror.");
      return;
    }
    
    setLoading(true);
    setActiveItem(item);
    setArResult(null); // Clear old tags
    try {
      const result = await GeminiService.generateARImage(
        userPhoto, 
        item.imageUrl, 
        item.description, 
        item.name
      );
      setArResult(result);
    } catch (error) {
      console.error("Try on error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (state === 'landing') {
    return <LandingPage onStart={handleStart} />;
  }

  return (
    <div className="h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-12 py-8 border-b artistic-border bg-white/50 backdrop-blur-sm z-50">
        <div className="flex items-center gap-12">
          <span className="serif-italic text-4xl font-light">vto.</span>
          <nav className="hidden md:flex gap-8 text-[10px] uppercase tracking-[0.25em] font-bold opacity-60">
            <button onClick={() => setState('assistant')} className={cn("hover:opacity-100 transition-opacity", state === 'assistant' && "opacity-100 border-b border-black pb-1")}>Discover</button>
            <button className="hover:opacity-100 cursor-not-allowed transition-opacity group relative">
              Wardrobe
              <span className="absolute -top-3 -right-6 text-[6px] bg-black text-white px-1.5 py-0.5 rounded-full object-none group-hover:opacity-100">SOON</span>
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 rounded-full border artistic-border overflow-hidden bg-[#E2DFD8] flex items-center justify-center">
            {userProfile.photo ? (
              <img src={userProfile.photo} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold">AM</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* Left Sidebar: Visual Search */}
        <aside className="col-span-12 md:col-span-3 border-r artistic-border p-8 flex flex-col gap-8 bg-[#F3F2EE] overflow-y-auto">
          <div>
            <h2 className="serif-italic text-2xl mb-6">Visual Match</h2>
            
            <div className="aspect-[3/4] bg-white border border-black/5 rounded-3xl flex flex-col items-center justify-center p-4 relative group shadow-sm overflow-hidden mb-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={1}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${visualMatchImage ? 'opacity-0 pointer-events-none' : 'grayscale-[0.5] hover:grayscale-0 opacity-100'}`}
                videoConstraints={{ facingMode: "environment" }}
                mirrored={false}
                disablePictureInPicture={true}
                forceScreenshotSourceSize={false}
                imageSmoothing={true}
                onUserMedia={() => {}}
                onUserMediaError={() => {}}
              />
              {!visualMatchImage && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 rounded-2xl m-2 flex items-center justify-center flex-col gap-2 z-10">
                  {!loading && (
                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white drop-shadow-md opacity-80">Refining Lens</span>
                  )}
                </div>
              )}
              {visualMatchImage && (
                <img src={visualMatchImage} className="absolute inset-0 w-full h-full object-cover z-20" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={capture}
                disabled={loading}
                className="bg-black text-white py-4 rounded-full text-[9px] uppercase tracking-widest font-bold flex flex-col items-center justify-center gap-1 hover:bg-zinc-800 transition-colors"
              >
                <Camera size={14} />
                Snap
              </button>
              <button 
                onClick={() => document.getElementById('clothing-upload-input')?.click()}
                disabled={loading}
                className="bg-white border artistic-border text-black py-4 rounded-full text-[9px] uppercase tracking-widest font-bold flex flex-col items-center justify-center gap-1 hover:bg-zinc-50 transition-colors"
              >
                <Upload size={14} />
                Upload
              </button>
              <input 
                id="clothing-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64 = event.target?.result as string;
                      setLoading(true);
                      setVisualMatchImage(base64);
                      try {
                        const items = await GeminiService.identifyClothing(base64);
                        setIdentifiedItems(items);
                        // Auto-select the first item for preview if found
                        if (items.length > 0) handleTryOn(items[0]);
                      } catch (err) {
                        console.error("Upload error:", err);
                      } finally {
                        setLoading(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex-1">
            <p className="micro-label mb-6">Identified Items</p>
            <div className="space-y-6">
              {identifiedItems.length > 0 ? identifiedItems.map(item => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 group cursor-pointer"
                  onClick={() => handleTryOn(item)}
                >
                  <div className="w-16 h-16 bg-white rounded-xl shadow-sm border artistic-border overflow-hidden p-1">
                    <div className="w-full h-full rounded-lg overflow-hidden">
                      <img 
                        src={item.productImageUrl || item.imageUrl} 
                        className="w-full h-full object-cover origin-center" 
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-[10px] opacity-60 uppercase tracking-wider">{item.brand}</p>
                    {item.productUrl && (
                      <a 
                        href={item.productUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                      >
                        View Product
                      </a>
                    )}
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </motion.div>
              )) : (
                <div className="text-center py-8 opacity-30">
                  <ShoppingBag size={32} className="mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">No items snapped</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center: AR Virtual Mirror */}
        <section className="col-span-12 md:col-span-6 relative p-10 flex flex-col items-center justify-center bg-white overflow-hidden">
          <div className="absolute top-10 left-10 flex items-center gap-4 z-20">
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold py-2 px-6 border border-black rounded-full bg-white/50 backdrop-blur-sm">
              Live AR Mode
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-1 h-1 bg-black rounded-full"
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeItem ? (
              <motion.div 
                key={activeItem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-[450px] aspect-[4/5]"
              >
                {/* Person Placeholder / User Photo */}
                <div className="absolute inset-0 bg-[#E2DFD8] rounded-[100px] overflow-hidden flex items-center justify-center shadow-2xl border-8 border-white">
                  {userProfile.photo ? (
                    <div className="relative w-full h-full">
                      {arResult?.imageUrl && !loading ? (
                         <motion.img 
                           key="ar-result"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ duration: 1 }}
                           src={arResult.imageUrl} 
                           className="w-full h-full object-cover" 
                         />
                      ) : (
                         <img src={userProfile.photo} className="w-full h-full object-cover" />
                      )}

                      {/* AR Scanning Effect */}
                      <AnimatePresence>
                        {loading && (
                          <motion.div
                            initial={{ top: "-10%" }}
                            animate={{ top: "110%" }}
                            exit={{ opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-white/50 backdrop-blur-md shadow-[0_0_15px_white] z-50 pointer-events-none"
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent flex items-center justify-center">
                      <p className="font-serif italic text-4xl opacity-10">Aura Scan Active</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="text-center group cursor-pointer" onClick={() => setState('assistant')}>
                <div className="w-64 h-64 rounded-full border border-black/5 flex items-center justify-center p-8 group-hover:border-black/20 transition-colors">
                  <div className="text-center">
                    <Sparkles size={32} className="mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Waiting for Scan</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

          <div className="mt-12 flex gap-4">
             <button className="px-8 py-4 bg-black text-white rounded-full text-[10px] uppercase tracking-widest font-bold shadow-xl active:scale-95 transition-transform">
               Mirror Capture
             </button>
             <button 
              onClick={() => setActiveItem(null)}
              className="px-8 py-4 border border-black rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-colors"
            >
               Reset View
             </button>
          </div>
        </section>

        {/* Right Sidebar: Personal Style & Curated Feed */}
        <aside className="col-span-12 md:col-span-3 border-l border-[#1A1A1A]/10 p-8 flex flex-col bg-[#FDFCFB] overflow-y-auto">
          <div className="mb-10">
            <h2 className="serif-italic text-2xl mb-6">My Style</h2>
            <p className="micro-label mb-4">Reference Photo</p>
            
            <div 
              className="aspect-[4/5] bg-white border border-dashed border-[#1A1A1A]/20 rounded-[32px] overflow-hidden flex flex-col items-center justify-center p-4 relative group hover:border-black/40 transition-colors cursor-pointer"
              onClick={() => document.getElementById('user-photo-upload')?.click()}
            >
              {userProfile.photo ? (
                <>
                  <img src={userProfile.photo} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white">Change Photo</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Upload size={24} className="mx-auto mb-3 opacity-20" />
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-30 leading-relaxed">
                    Upload Your Photo<br />For Better Fit
                  </p>
                </div>
              )}
              <input 
                id="user-photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      setUserProfile(prev => ({ ...prev, photo: base64 }));
                      GeminiService.recommendStyle(base64, "Analyze body type and style potential").then(advice => {
                        setUserProfile(prev => ({ ...prev, bodyType: advice }));
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            {userProfile.photo && (
              <p className="mt-4 text-[10px] opacity-40 leading-relaxed italic text-center">
                AI Analysis active for your uploaded physique.
              </p>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="serif-italic text-2xl">Curated Feed</h2>
              <Info size={16} className="opacity-20" />
            </div>
            
            <div className="space-y-8 pb-8">
              {[
                { id: 1, name: "The Minimalist Set", score: "94% Fit Accuracy", color: "#EDE9E3" },
                { id: 2, name: "Terracotta Evening", score: "88% Skin Match", color: "#E5EBE5" },
              ].map(item => (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="group relative cursor-pointer"
                >
                  <div 
                    className="aspect-[4/5] rounded-[32px] overflow-hidden mb-4 relative shadow-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    <img 
                      src={`https://picsum.photos/seed/vto-${item.id}/400/500`} 
                      alt={item.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs font-bold leading-none mb-2">{item.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">{item.score}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-[#1A1A1A]/10 mt-auto">
            <button className="w-full bg-[#1A1A1A] text-white py-5 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-2xl hover:bg-black transition-colors">
              Full Style Report
            </button>
          </div>
        </aside>
      </main>

      {/* Bottom Micro Status Bar */}
      <footer className="px-12 py-5 border-t artistic-border flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 z-50 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div>Engine: Gemini 3 Flash Preview</div>
          <p className="normal-case tracking-normal max-w-sm text-center md:text-left text-[9px] opacity-80 leading-relaxed font-medium">
            Privacy: By uploading an image, you allow AI models to process and suggest styles. Images are not permanently stored or tracked.
          </p>
        </div>
        <div className="flex items-center gap-4 text-center">
          <a href="https://www.linkedin.com/in/ritvik-chebolu" target="_blank" rel="noopener noreferrer" className="hover:text-black hover:opacity-100 transition-colors uppercase tracking-[0.2em] underline decoration-dotted underline-offset-4">Connect with me on LinkedIn</a>
          <span className="opacity-50">|</span>
          <span>© 2026 Ritvik Chebolu</span>
        </div>
      </footer>
      
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-sm flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-16 h-16 border border-[#1A1A1A]/10 border-t-[#1A1A1A] rounded-full"
          />
        </div>
      )}
    </div>
  );
}

function LandingPage({ onStart }: { onStart: (useDemo: boolean) => void }) {
  const [useDemo, setUseDemo] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-[#FAF9F6] overflow-hidden"
    >
      {/* Decorative Branding */}
      <div className="absolute top-12 left-12">
        <span className="serif-italic text-2xl font-light">vto.</span>
      </div>

      <div className="relative z-10 text-center max-w-xl px-6 flex flex-col items-center">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center mb-12 shadow-2xl"
        >
          <Sparkles className="text-white" size={24} />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-serif italic font-light text-6xl md:text-8xl tracking-tighter mb-8 leading-[0.9]"
        >
          The Curated <br /><span className="text-zinc-300">Fitting Room</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#1A1A1A]/60 mb-6 leading-relaxed max-w-sm mx-auto text-sm uppercase tracking-widest font-medium"
        >
          AI-powered visual search and personalized virtual styling for the modern wardrobe.
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col items-center gap-3 mb-8"
        >
          <label className="flex items-center gap-2 cursor-pointer text-[11px] uppercase tracking-wider text-black/80 font-bold hover:text-black transition-colors">
            <input 
              type="checkbox" 
              checked={useDemo} 
              onChange={e => setUseDemo(e.target.checked)} 
              className="accent-black w-4 h-4 cursor-pointer" 
            />
            Use Demo Mode (Test Images)
          </label>
          <p className="text-[9px] text-black/40 max-w-sm text-center leading-relaxed">
            By enabling this, test images will be pre-loaded into the app. AI usage involves processing photo data globally. We do not permanently store uploads. Subject to Terms & Conditions.
          </p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => onStart(useDemo)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group bg-black text-white px-12 py-6 rounded-full font-bold flex items-center gap-4 shadow-3xl mx-auto text-[10px] uppercase tracking-[0.2em]"
        >
          Enter Studio
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={14} />
        </motion.button>
      </div>

      {/* Decorative Side Elements */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block opacity-5 select-none pointer-events-none">
        <p className="font-serif italic text-[15vw] leading-none whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Aura Scan</p>
      </div>
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 hidden lg:block opacity-10 select-none pointer-events-none rotate-180">
        <p className="font-serif italic text-[20vw] leading-none whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>Curated</p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-4"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Powered by Gemini 3 Flash Preview</p>
        <div className="w-px h-12 bg-black/10" />
      </motion.div>
    </motion.div>
  );
}

