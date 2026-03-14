
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef } from 'react';
import { ComicFace, INITIAL_PAGES, GATE_PAGE } from './types';
import { LoadingFX } from './LoadingFX';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[]; // Needed for cover "printing" status
    onOpenBook: () => void;
    onDownloadPDF: () => void;
    onDownloadHTML: () => void;
    onReset: () => void;
    onRegenerate: (pageIndex: number) => void;
    onRegenerateVideo?: (faceId: string, imageUrl: string, sceneDesc: string) => void;
}

export const Panel: React.FC<PanelProps> = ({ face, allFaces, onOpenBook, onDownloadPDF, onDownloadHTML, onReset, onRegenerate, onRegenerateVideo }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    if (!face) return <div className="w-full h-full bg-gray-950" />;
    if (face.isLoading && !face.imageUrl) return <LoadingFX />;
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}>
            <div className="gloss"></div>
            
            {/* Render Video or Image */}
            {face.videoUrl ? (
                <video 
                    src={face.videoUrl} 
                    className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                />
            ) : (
                face.imageUrl && <img src={face.imageUrl} alt="Comic panel" className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />
            )}
            
            {/* Loading Overlay for Video Generation */}
            {face.isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <span className="font-comic text-yellow-400 text-2xl animate-pulse">🎥 VEO ANIMATING...</span>
                </div>
            )}

            {/* Action Bar (Top Right) for All Pages - Allow regenerating covers too */}
            {!face.isLoading && (
                <div className="absolute top-2 right-2 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Animate Button */}
                    {!face.videoUrl && face.imageUrl && onRegenerateVideo && (
                         <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(face.imageUrl && face.narrative?.scene) onRegenerateVideo(face.id, face.imageUrl, face.narrative.scene); 
                            }}
                            className="bg-purple-500 text-white border-2 border-black p-2 rounded-full hover:scale-110 active:scale-95 shadow-[2px_2px_0_black]"
                            title="Animate with Veo"
                        >
                            🎬
                        </button>
                    )}

                    {face.audioUrl && (
                        <button 
                            onClick={playAudio} 
                            className="bg-yellow-400 border-2 border-black p-2 rounded-full hover:scale-110 active:scale-95 shadow-[2px_2px_0_black]"
                            title="Play Narration"
                        >
                            🔊
                        </button>
                    )}
                    {/* Always allow regeneration if it has a pageIndex */}
                    {face.pageIndex !== undefined && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); if(face.pageIndex !== undefined) onRegenerate(face.pageIndex); }}
                            className="bg-white border-2 border-black p-2 rounded-full hover:scale-110 active:scale-95 shadow-[2px_2px_0_black]"
                            title="Regenerate Page"
                        >
                            🔄
                        </button>
                    )}
                </div>
            )}

            {/* Hidden Audio Element */}
            {face.audioUrl && <audio ref={audioRef} src={face.audioUrl} />}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-20 inset-x-0 flex justify-center z-20">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-10 py-4 text-3xl font-bold hover:scale-105 animate-bounce disabled:animate-none disabled:bg-gray-400 disabled:cursor-wait">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING... ${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES}` : 'READ ISSUE #1'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-24 inset-x-0 flex flex-col items-center gap-4 z-20">
                    <div className="flex gap-4">
                        <button onClick={(e) => { e.stopPropagation(); onDownloadPDF(); }} className="comic-btn bg-blue-500 text-white px-6 py-3 text-lg font-bold hover:scale-105">PDF DOWNLOAD</button>
                        <button onClick={(e) => { e.stopPropagation(); onDownloadHTML(); }} className="comic-btn bg-purple-500 text-white px-6 py-3 text-lg font-bold hover:scale-105">HTML + MOTION</button>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="comic-btn bg-green-500 text-white px-8 py-4 text-2xl font-bold hover:scale-105">CREATE NEW ISSUE</button>
                </div>
            )}
        </div>
    );
}
