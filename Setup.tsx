
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { GENRES, ART_STYLES, GENDERS, LANGUAGES, Persona } from './types';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    heroName: string;
    heroTraits: string;
    friendName: string;
    friendTraits: string;
    selectedGenre: string;
    selectedArtStyle: string;
    heroGender: string;
    friendGender: string;
    selectedLanguage: string;
    customPremise: string;
    richMode: boolean;
    enableTTS: boolean;
    enableMotion: boolean;
    storyMode: 'ai' | 'script';
    scriptData: {base64: string, mimeType: string} | null;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onHeroNameChange: (val: string) => void;
    onHeroTraitsChange: (val: string) => void;
    onFriendNameChange: (val: string) => void;
    onFriendTraitsChange: (val: string) => void;
    onGenreChange: (val: string) => void;
    onArtStyleChange: (val: string) => void;
    onHeroGenderChange: (val: string) => void;
    onFriendGenderChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onTTSChange: (val: boolean) => void;
    onMotionChange: (val: boolean) => void;
    onStoryModeChange: (mode: 'ai' | 'script') => void;
    onScriptUpload: (file: File) => void;
    onLaunch: () => void;
}

const Footer = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
        <div className="text-lg md:text-xl font-bold text-yellow-400 tracking-wider uppercase">
            Powered by: Rocc$tar AI
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
            <a href="https://x.com/GRWNX" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors text-xl">Created by @GRWNX</a>
        </div>
    </div>
  );
};

export const Setup: React.FC<SetupProps> = (props) => {
    if (!props.show && !props.isTransitioning) return null;

    return (
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.1) rotate(-5deg); }
                100% { transform: translateY(-200vh) rotate(1080deg) scale(0.5); opacity: 1; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.5) rotate(10deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); opacity: 0; }
             }
          `}</style>
        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="4"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="70" fill="#DC2626" stroke="black" strokeWidth="2" transform="rotate(-5 100 75)">POW!</text>
                </svg>
            </div>
        )}
        
        <div className={`fixed inset-0 z-[200] overflow-y-auto`}
             style={{
                 background: props.isTransitioning ? 'transparent' : 'rgba(0,0,0,0.85)', 
                 backdropFilter: props.isTransitioning ? 'none' : 'blur(6px)',
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          <div className="min-h-full flex items-center justify-center p-4 pb-32 md:pb-24">
            <div className="max-w-[950px] w-full bg-white p-4 md:p-5 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                
                <h1 className="font-comic text-5xl text-red-600 leading-none mb-1 tracking-wide inline-block mr-3" style={{textShadow: '2px 2px 0px black'}}>INSTANT</h1>
                <h1 className="font-comic text-5xl text-yellow-400 leading-none mb-4 tracking-wide inline-block" style={{textShadow: '2px 2px 0px black'}}>HEROES!</h1>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4 text-left">
                    
                    {/* Left Column: Cast */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">1. THE CAST</div>
                        
                        {/* HERO SECTION */}
                        <div className={`p-3 border-4 border-dashed ${props.hero ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'} transition-colors relative group flex flex-col gap-2`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-comic text-lg uppercase font-bold text-blue-900">HERO (REQUIRED)</p>
                                {props.hero && <span className="text-green-600 font-bold font-comic text-sm animate-pulse">✓ READY</span>}
                            </div>
                            
                            {/* Always Visible Inputs */}
                            <input 
                                type="text" 
                                placeholder="HERO NAME" 
                                value={props.heroName} 
                                onChange={(e) => props.onHeroNameChange(e.target.value)}
                                className="w-full font-comic text-lg px-2 py-1 border-2 border-black bg-white text-black uppercase placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                             />
                             <input 
                                type="text" 
                                placeholder="TRAITS (e.g. Brave, Shy)" 
                                value={props.heroTraits} 
                                onChange={(e) => props.onHeroTraitsChange(e.target.value)}
                                className="w-full font-sans text-xs font-bold px-2 py-1 border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                             />
                             <select value={props.heroGender} onChange={(e) => props.onHeroGenderChange(e.target.value)} className="w-full font-comic text-sm p-1 border-2 border-black bg-white text-black uppercase cursor-pointer">
                                 {GENDERS.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                             </select>

                            {/* Image Upload Area */}
                            {props.hero ? (
                                <div className="flex gap-3 items-center mt-1 border-t-2 border-gray-300 pt-2">
                                     <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero Preview" className="w-16 h-16 object-cover border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] bg-white rotate-[-2deg]" />
                                     <label className="cursor-pointer text-xs underline text-blue-600 hover:text-blue-800 uppercase font-bold">
                                         Replace Photo
                                         <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                     </label>
                                </div>
                            ) : (
                                <label className="comic-btn bg-blue-500 text-white text-lg px-3 py-3 block w-full hover:bg-blue-400 cursor-pointer text-center mt-1">
                                    UPLOAD PHOTO 
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>

                        {/* CO-STAR SECTION */}
                        <div className={`p-3 border-4 border-dashed ${props.friend ? 'border-green-500 bg-green-50' : 'border-purple-300 bg-purple-50'} transition-colors relative group flex flex-col gap-2`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-comic text-lg uppercase font-bold text-purple-900">CO-STAR (OPTIONAL)</p>
                                {props.friend && <span className="text-green-600 font-bold font-comic text-sm animate-pulse">✓ READY</span>}
                            </div>

                             {/* Always Visible Inputs */}
                            <input 
                                type="text" 
                                placeholder="CO-STAR NAME" 
                                value={props.friendName} 
                                onChange={(e) => props.onFriendNameChange(e.target.value)}
                                className="w-full font-comic text-lg px-2 py-1 border-2 border-black bg-white text-black uppercase placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                             />
                             <input 
                                type="text" 
                                placeholder="TRAITS (e.g. Evil, Funny)" 
                                value={props.friendTraits} 
                                onChange={(e) => props.onFriendTraitsChange(e.target.value)}
                                className="w-full font-sans text-xs font-bold px-2 py-1 border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                             />
                            <select value={props.friendGender} onChange={(e) => props.onFriendGenderChange(e.target.value)} className="w-full font-comic text-sm p-1 border-2 border-black bg-white text-black uppercase cursor-pointer">
                                 {GENDERS.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                            </select>

                            {/* Image Upload Area */}
                            {props.friend ? (
                                <div className="flex gap-3 items-center mt-1 border-t-2 border-gray-300 pt-2">
                                    <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star Preview" className="w-16 h-16 object-cover border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] bg-white rotate-[2deg]" />
                                    <label className="cursor-pointer text-xs underline text-purple-600 hover:text-purple-800 uppercase font-bold">
                                        Replace Photo
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                    </label>
                                </div>
                            ) : (
                                <label className="comic-btn bg-purple-500 text-white text-lg px-3 py-3 block w-full hover:bg-purple-400 cursor-pointer text-center mt-1">
                                    UPLOAD PHOTO 
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between items-center border-b-4 border-black mb-1 pb-1">
                            <div className="font-comic text-xl text-black">2. THE STORY</div>
                        </div>

                        {/* MODE TOGGLE */}
                        <div className="flex w-full border-4 border-black mb-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                            <button 
                                onClick={() => props.onStoryModeChange('ai')}
                                className={`flex-1 font-comic text-lg py-1 ${props.storyMode === 'ai' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                            >
                                AI WRITER
                            </button>
                            <button 
                                onClick={() => props.onStoryModeChange('script')}
                                className={`flex-1 font-comic text-lg py-1 ${props.storyMode === 'script' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                            >
                                UPLOAD SCRIPT
                            </button>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 border-4 border-black h-full flex flex-col justify-between">
                            <div>
                                {props.storyMode === 'ai' && (
                                    <>
                                        <div className="mb-2">
                                            <p className="font-comic text-base mb-1 font-bold text-gray-800">GENRE (Story Archetype)</p>
                                            <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all">
                                                {GENRES.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                                            </select>
                                        </div>

                                        <div className="mb-2">
                                            <p className="font-comic text-base mb-1 font-bold text-gray-800">ART STYLE (Visuals)</p>
                                            <select value={props.selectedArtStyle} onChange={(e) => props.onArtStyleChange(e.target.value)} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                                                {ART_STYLES.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                                            </select>
                                        </div>

                                        <div className="mb-2">
                                            <p className="font-comic text-base mb-1 font-bold text-gray-800">LANGUAGE</p>
                                            <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                                                {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-black">{l.name}</option>)}
                                            </select>
                                        </div>

                                        {props.selectedGenre === 'Custom' && (
                                            <div className="mb-2">
                                                <p className="font-comic text-base mb-1 font-bold text-gray-800">PREMISE</p>
                                                <textarea value={props.customPremise} onChange={(e) => props.onPremiseChange(e.target.value)} placeholder="Enter your story premise..." className="w-full p-1 border-2 border-black font-comic text-lg h-16 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.2)] text-black bg-white" />
                                            </div>
                                        )}
                                    </>
                                )}

                                {props.storyMode === 'script' && (
                                    <>
                                        {/* Script Upload Area */}
                                        <div className="mb-3">
                                            <p className="font-comic text-base mb-1 font-bold text-gray-800">UPLOAD PDF SCRIPT</p>
                                            <div className={`border-2 border-black border-dashed p-4 text-center ${props.scriptData ? 'bg-green-100 border-green-600' : 'bg-white hover:bg-gray-50'}`}>
                                                {props.scriptData ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-3xl mb-1">📄</span>
                                                        <span className="font-comic text-green-700 font-bold uppercase">Script Loaded</span>
                                                        <label className="text-xs underline cursor-pointer mt-1 text-black">Change File
                                                            <input type="file" accept=".pdf, .txt" className="hidden" onChange={(e) => e.target.files?.[0] && props.onScriptUpload(e.target.files[0])} />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer block">
                                                        <span className="text-2xl block mb-1">📂</span>
                                                        <span className="font-comic text-sm uppercase text-black">Click to Upload PDF</span>
                                                        <input type="file" accept=".pdf, .txt" className="hidden" onChange={(e) => e.target.files?.[0] && props.onScriptUpload(e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <p className="font-comic text-base mb-1 font-bold text-gray-800">VISUAL STYLE</p>
                                            <select value={props.selectedArtStyle} onChange={(e) => props.onArtStyleChange(e.target.value)} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                                                {ART_STYLES.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <p className="font-comic text-base mb-1 font-bold text-gray-800">OUTPUT LANGUAGE</p>
                                            <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                                                {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-black">{l.name}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-1">
                                {props.storyMode === 'ai' && (
                                    <label className="flex items-center gap-2 font-comic text-base cursor-pointer text-black p-1 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-300 transition-colors">
                                        <input type="checkbox" checked={props.richMode} onChange={(e) => props.onRichModeChange(e.target.checked)} className="w-4 h-4 accent-black" />
                                        <span className="text-black">NOVEL MODE (Rich Dialogue)</span>
                                    </label>
                                )}
                                <label className="flex items-center gap-2 font-comic text-base cursor-pointer text-black p-1 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-300 transition-colors">
                                    <input type="checkbox" checked={props.enableTTS} onChange={(e) => props.onTTSChange(e.target.checked)} className="w-4 h-4 accent-black" />
                                    <span className="text-black">VOICE NARRATION (Audio)</span>
                                </label>
                                <label className="flex items-center gap-2 font-comic text-base cursor-pointer text-black p-1 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-300 transition-colors">
                                    <input type="checkbox" checked={props.enableMotion} onChange={(e) => props.onMotionChange(e.target.checked)} className="w-4 h-4 accent-black" />
                                    <span className="text-black">MOTION MODE (Veo 3 Animation)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={props.onLaunch} disabled={!props.hero || props.isTransitioning || (props.storyMode==='script' && !props.scriptData)} className="comic-btn bg-red-600 text-white text-3xl px-6 py-3 w-full hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wider">
                    {props.isTransitioning ? 'LAUNCHING...' : 'START ADVENTURE!'}
                </button>
            </div>
          </div>
        </div>

        {/* Footer is only visible when setup is active */}
        <Footer />
        </>
    );
}
