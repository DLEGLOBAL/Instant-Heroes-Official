/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, GENRES, ART_STYLES, GENDERS, TONES, LANGUAGES, ComicFace, Beat, Persona } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';

// --- Constants ---
const MODEL_TEXT_NAME = "gemini-3-pro-preview"; // Upgraded to Gemini 3 Pro for superior reasoning
const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview"; // Best for images
const MODEL_TTS_NAME = "gemini-2.5-flash-preview-tts"; // For speech
const MODEL_VIDEO_NAME = "veo-3.1-fast-generate-preview"; // For video animations

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  // Helper functions for API interaction to fix missing reference errors
  const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleAPIError = (error: any) => {
    console.error("API Error detected:", error);
    const msg = error?.message || error?.toString() || "";
    if (msg.includes("Requested entity was not found")) {
      // Reset key selection if the project/key is invalid for this model
      setShowApiKeyDialog(true);
    }
  };

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  
  // Independent State for Character Details (Editable before upload)
  const [heroName, setHeroName] = useState("");
  const [heroTraits, setHeroTraits] = useState("");
  const [friendName, setFriendName] = useState("");
  const [friendTraits, setFriendTraits] = useState("");

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedArtStyle, setSelectedArtStyle] = useState(ART_STYLES[0]);
  const [heroGender, setHeroGender] = useState(GENDERS[0]);
  const [friendGender, setFriendGender] = useState(GENDERS[1]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  const [enableTTS, setEnableTTS] = useState(false);
  const [enableMotion, setEnableMotion] = useState(false); // Global toggle for auto-animation
  
  // Script Mode State
  const [storyMode, setStoryMode] = useState<'ai' | 'script'>('ai');
  const [scriptData, setScriptData] = useState<{base64: string, mimeType: string} | null>(null);
  
  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // --- Transition States ---
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to wrap raw PCM data in a WAV header so browsers can play it naturally
  const addWavHeader = (samples: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
      const buffer = new ArrayBuffer(44 + samples.length);
      const view = new DataView(buffer);

      const writeString = (view: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
          }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + samples.length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
      view.setUint16(32, numChannels * 2, true); // Block align
      view.setUint16(34, 16, true); // Bits per sample
      writeString(view, 36, 'data');
      view.setUint32(40, samples.length, true);

      // Copy PCM data
      const pcmBytes = new Uint8Array(buffer, 44);
      pcmBytes.set(samples);

      return buffer;
  };

  // Helper to decode base64 string to Uint8Array
  const decodeBase64 = (base64: string): Uint8Array => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number): Promise<Beat> => {
    if (!heroRef.current) throw new Error("No Hero");

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";

    // Build History Text
    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const historyText = relevantHistory.map(p => 
      `[Page ${p.pageIndex}] [Visual: ${p.narrative?.visual_directives || 'Standard'}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}") (Scene: ${p.narrative?.scene})`
    ).join('\n');

    // --- 15 AGENT MULTI-AGENT CONTROL SYSTEM ---
    const systemPrompt = `
    ACT AS A VIRTUAL COMIC STUDIO WITH 15 SPECIALIZED AGENTS. 
    You are the 'Publisher' controlling these agents. You must orchestrate their output into a single JSON result.

    THE COUNCIL OF 15 AGENTS:
    1. Showrunner (Plots the complete arc linearly)
    2. Head Writer (Dialogue & Pacing)
    3. Character Supervisor (Enforces: ${heroRef.current.name ? `Hero Name: ${heroRef.current.name}` : 'Hero'}, Traits: ${heroRef.current.traits || 'N/A'}. Co-Star: ${friendRef.current?.name || 'N/A'}, Traits: ${friendRef.current?.traits || 'N/A'})
    4. Continuity Editor (CRITICAL ROLE: You MUST ensure the hero and co-star wear the EXACT SAME COSTUME, have the EXACT SAME HAIRSTYLE, and look identical to previous pages unless a wardrobe change is scripted. MONITOR VISUAL CONSISTENCY STRONGLY.)
    5. Director (Camera Angles: Low, High, Dutch Tilt, Wide. Ensure Cinematic framing.)
    6. Cinematographer (Lighting: Chiaroscuro, Neon, Sunlight. Match the "${selectedArtStyle}" aesthetic.)
    7. Art Director (Enforce Art Style: "${selectedArtStyle}" and Genre: "${selectedGenre}" for EVERY panel. No deviations.)
    8. Set Decorator (Detailed Backgrounds matching the world.)
    9. Costume Designer (Define the outfit on Page 1 and ENFORCE it on every subsequent page. Hero Outfit: Signature ${selectedGenre} attire. DO NOT CHANGE IT RANDOMLY.)
    10. Action Choreographer (Dynamic Poses)
    11. FX Artist (Particle Effects, Speed Lines)
    12. Letterer (Visualizes Bubble Placement)
    13. Physicist (Realistic Weight/Gravity)
    14. Lore Master (World Consistency)
    15. Quality Assurance (Final Polish)

    TASK: GENERATE PAGE ${pageNum} of ${MAX_STORY_PAGES}.
    TARGET LANGUAGE: ${langName}.
    
    AGENTS' INTERNAL MONOLOGUE INSTRUCTIONS:
    - Character Supervisor: Ensure ${heroRef.current.name || 'Hero'} acts according to traits '${heroRef.current.traits || 'Standard'}'.
    - Continuity Editor: CHECK THE PREVIOUS PANELS. IF the hero was wearing a hoodie, they are STILL wearing a hoodie. SAME HAIR. SAME FACE.
    - Art Director: The image MUST look like a "${selectedArtStyle}" image.
    - Director: Choose a cinematic angle appropriate for the emotional beat.
    - Cinematographer: Describe the lighting vividly for the image generator.
    - Head Writer: Write dialogue in ${langName}.
    `;

    let instruction = "";
    let contents: any = "";

    if (storyMode === 'script' && scriptData) {
        instruction = `
        TASK: ADAPT SCRIPT TO PAGE ${pageNum}.
        The Council must analyze the attached PDF script and extract the segment for this page.
        Visual Agents (Director/Cinematographer) must enhance the script's visual description for the image prompt.
        `;
         contents = [
            { inlineData: { mimeType: scriptData.mimeType, data: scriptData.base64 } },
            { text: systemPrompt + instruction + `\nPREVIOUS HISTORY:\n${historyText}` }
        ];
    } else {
        // AI Writer Mode
        let coreDriver = selectedGenre === 'Custom' ? `PREMISE: ${customPremise}` : `GENRE: ${selectedGenre}. TONE: ${storyTone}.`;
        
        instruction = `
        ${coreDriver}
        STORY BEAT: ${pageNum === 1 ? "Inciting Incident" : pageNum === MAX_STORY_PAGES ? "Climax/Resolution" : "Rising Action"}.
        
        AGENT DIRECTIVES:
        - Director: If action is high, use dynamic angles. If emotional, use close-ups.
        - Continuity Editor: Reference previous page events implicitly. Keep clothing identical to Page 1.
        - Character Supervisor: If Hero is 'Shy', they shouldn't shout unless pushed.
        `;
        
        const finalInstructions = `
        OUTPUT FORMAT (JSON ONLY):
        {
          "caption": "Narrative text in ${langName}",
          "dialogue": "Character speech in ${langName}",
          "scene": "General description of the action",
          "visual_directives": "COMBINED OUTPUT OF VISUAL AGENTS (Director + Cinematographer + Art Director + Lighting). E.g. 'Low angle shot, dramatic rim lighting, cinematic depth of field, 85mm lens. Hero wearing [CONSISTENT OUTFIT AS PAGE 1]'.",
          "focus_char": "hero" | "friend" | "other"
        }
        `;
        
        contents = systemPrompt + instruction + `\nPREVIOUS HISTORY:\n${historyText}` + finalInstructions;
    }

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ 
            model: MODEL_TEXT_NAME, 
            contents: contents, 
            config: { responseMimeType: 'application/json' } 
        });
        
        let rawText = res.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(rawText);
        
        // Cleanup
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e) {
        console.error("Beat generation failed", e);
        handleAPIError(e);
        return { 
            caption: "...", 
            scene: `Scene for page ${pageNum}`, 
            visual_directives: "Standard comic view",
            focus_char: 'hero'
        };
    }
  };

  const generatePersona = async (desc: string): Promise<Persona> => {
      // Use selectedArtStyle for persona generation style
      const style = selectedArtStyle;
      try {
          const ai = getAI();
          const res = await ai.models.generateContent({
              model: MODEL_IMAGE_GEN_NAME,
              contents: { text: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
              config: { imageConfig: { aspectRatio: '1:1' } }
          });
          const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (part?.inlineData?.data) return { base64: part.inlineData.data, desc };
          throw new Error("Failed");
      } catch (e) { 
        handleAPIError(e);
        throw e; 
      }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type']): Promise<string> => {
    const contents = [];
    if (heroRef.current?.base64) {
        contents.push({ text: "REFERENCE 1 [HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
    }
    if (friendRef.current?.base64) {
        contents.push({ text: "REFERENCE 2 [CO-STAR]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.current.base64 } });
    }

    // --- PREFIX LOGIC (UPDATED FOR STRICTNESS) ---
    let promptPrefix = "";
    const hasHero = !!heroRef.current?.base64;
    const hasFriend = !!friendRef.current?.base64;
    
    // STRICT UPPERCASE PREFIXES as requested
    if (hasHero && hasFriend) promptPrefix = "IMAGINE THESE EXACT PEOPLE. ";
    else if (hasHero || hasFriend) promptPrefix = "IMAGINE THIS EXACT PERSON. ";

    let promptText = `${promptPrefix} `;
    
    // STRICT STYLE & CONTINUITY ENFORCEMENT
    promptText += ` VISUAL STYLE: ${selectedArtStyle}. GENRE: ${selectedGenre}. `;
    promptText += ` CRITICAL INSTRUCTION: MAINTAIN STRICT CHARACTER CONSISTENCY. The characters MUST look exactly like the provided reference images in terms of face, hair, and body type. `;
    promptText += ` ENSURE THEY ARE WEARING THE SAME CLOTHES AND ACCESSORIES AS PREVIOUS PAGES unless strictly specified otherwise.`;
    promptText += ` Do not change their appearance or outfit randomly. Keep the art style consistent as '${selectedArtStyle}'. `;
    
    // Inject Multi-Agent Visual Directives
    if (beat.visual_directives) {
        promptText += ` VISUAL DIRECTIVES (From Director/Cinematographer): ${beat.visual_directives}. `;
    }

    if (type === 'cover') {
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        promptText += `TYPE: Comic Book Cover. TITLE: "INSTANT HEROES" (OR LOCALIZED TRANSLATION IN ${langName.toUpperCase()}). Main visual: Dynamic action shot of [HERO] (Use REFERENCE 1). High Contrast, Masterpiece. Style: ${selectedArtStyle}.`;
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON". Style: ${selectedArtStyle}.`;
    } else {
        promptText += `TYPE: Vertical comic panel. SCENE: ${beat.scene}. `;
        promptText += `INSTRUCTIONS: Maintain strict character likeness. If scene mentions 'HERO' or '${heroRef.current?.name || 'HERO'}', you MUST use REFERENCE 1. If scene mentions 'CO-STAR' or '${friendRef.current?.name || 'SIDEKICK'}', you MUST use REFERENCE 2.`;
        
        // --- TEXT BUBBLE ENFORCEMENT ---
        promptText += ` CRITICAL FORMATTING: REGARDLESS OF ART STYLE (${selectedArtStyle}), THIS IS A COMIC BOOK PANEL. YOU MUST COMPOSITE VISIBLE SPEECH BUBBLES/CAPTION BOXES INTO THE ARTWORK CONTAINING THE TEXT. `;
        promptText += ` Do not omit text just because the style is realistic. The text is mandatory. `;

        if (beat.caption) promptText += ` INCLUDE CAPTION BOX with the text: "${beat.caption}".`;
        if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE pointing to the speaker with the text: "${beat.dialogue}".`;
    }

    contents.push({ text: promptText });

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: '2:3' } }
        });
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';
    } catch (e) { 
        handleAPIError(e);
        return ''; 
    }
  };

  const generateSpeech = async (text: string): Promise<string> => {
      if (!text.trim() || !enableTTS) return '';
      try {
          const ai = getAI();
          const response = await ai.models.generateContent({
              model: MODEL_TTS_NAME,
              contents: [{ parts: [{ text }] }],
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                  }
              }
          });
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
              const pcmBytes = decodeBase64(base64Audio);
              const wavBuffer = addWavHeader(pcmBytes);
              // Convert ArrayBuffer to Base64 string for data URI
              let binary = '';
              const bytes = new Uint8Array(wavBuffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
              }
              return `data:audio/wav;base64,${btoa(binary)}`;
          }
      } catch (e) {
          console.error("Speech generation failed", e);
          // Don't block the UI for speech failure
      }
      return '';
  };
  
  const generateVideo = async (imageUrl: string, sceneDesc: string): Promise<string> => {
      // 1. Strip the data prefix to get raw base64
      const base64 = imageUrl.split(',')[1];
      if (!base64) return '';

      const prompt = `Cinematic, subtle motion. ${sceneDesc || "Atmospheric movement"}. 4k, high quality, living painting.`;
      
      try {
          const ai = getAI();
          // We must use 9:16 for vertical panels (closest match to 2:3)
          let operation = await ai.models.generateVideos({
              model: MODEL_VIDEO_NAME,
              image: { imageBytes: base64, mimeType: 'image/jpeg' },
              prompt: prompt,
              config: {
                  numberOfVideos: 1,
                  resolution: '720p',
                  aspectRatio: '9:16' 
              }
          });
          
          // Poll for completion
          while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              operation = await ai.operations.getVideosOperation({operation: operation});
          }
          
          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (!videoUri) return '';
          
          // Fetch the actual bytes using the key
          const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
          const videoBlob = await videoRes.blob();
          
          // Convert blob to object URL for local playback
          return URL.createObjectURL(videoBlob);
      } catch (e) {
          console.error("Video generation failed", e);
          handleAPIError(e);
          return '';
      }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      let beat: Beat = { scene: "", focus_char: 'other' };

      if (type === 'cover') {
           // Cover beat is handled in generateImage
      } else if (type === 'back_cover') {
           beat = { scene: "Thematic teaser image", focus_char: 'other' };
      } else {
           beat = await generateBeat(historyRef.current, pageNum % 2 === 0, pageNum);
      }

      if (beat.focus_char === 'friend' && !friendRef.current && type === 'story' && storyMode === 'ai') {
          try {
              const newSidekick = await generatePersona(selectedGenre === 'Custom' ? `A fitting sidekick for this story (${friendGender})` : `Sidekick for ${selectedGenre} story (${friendGender}).`);
              setFriend(newSidekick);
          } catch (e) { beat.focus_char = 'other'; }
      }

      updateFaceState(faceId, { narrative: beat });
      
      // Parallel Generation: Image + Audio
      const imagePromise = generateImage(beat, type);
      
      let audioPromise: Promise<string> = Promise.resolve('');
      if (type === 'story' && enableTTS && (beat.caption || beat.dialogue)) {
          const speechText = `${beat.caption ? `Narrator: ${beat.caption}. ` : ''} ${beat.dialogue || ''}`;
          audioPromise = generateSpeech(speechText);
      }

      const [url, audioUrl] = await Promise.all([imagePromise, audioPromise]);
      updateFaceState(faceId, { imageUrl: url, audioUrl: audioUrl, isLoading: false });

      // Chained Video Generation (if enabled globally)
      if (url && enableMotion) {
          handleRegenerateVideo(faceId, url, beat.scene);
      }
  };
  
  const handleRegenerateVideo = async (faceId: string, imageUrl: string, sceneDesc: string) => {
      updateFaceState(faceId, { isVideoLoading: true });
      const videoUrl = await generateVideo(imageUrl, sceneDesc);
      updateFaceState(faceId, { videoUrl, isVideoLoading: false });
  }

  const generateBatch = async (startPage: number, count: number) => {
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= TOTAL_PAGES && !generatingPages.current.has(p)) {
              pagesToGen.push(p);
          }
      }
      
      if (pagesToGen.length === 0) return;
      pagesToGen.forEach(p => generatingPages.current.add(p));

      const newFaces: ComicFace[] = [];
      pagesToGen.forEach(pageNum => {
          const type = pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story';
          newFaces.push({ id: `page-${pageNum}`, type, isLoading: true, pageIndex: pageNum });
      });

      setComicFaces(prev => {
          const existing = new Set(prev.map(f => f.id));
          return [...prev, ...newFaces.filter(f => !existing.has(f.id))];
      });
      newFaces.forEach(f => { if (!historyRef.current.find(h => h.id === f.id)) historyRef.current.push(f); });

      try {
          for (const pageNum of pagesToGen) {
               await generateSinglePage(`page-${pageNum}`, pageNum, pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story');
               generatingPages.current.delete(pageNum);
          }
      } catch (e) {
          console.error("Batch generation error", e);
      } finally {
          pagesToGen.forEach(p => generatingPages.current.delete(p));
      }
  }

  const handleScriptUpload = async (file: File) => {
      try {
          const base64 = await fileToBase64(file);
          setScriptData({ base64, mimeType: file.type });
      } catch (e) { alert("Script upload failed"); }
  };

  const launchStory = async () => {
    // --- API KEY VALIDATION ---
    const hasKey = await validateApiKey();
    if (!hasKey) return; // Stop if cancelled or invalid
    
    // Ensure Hero data is fully synced
    if (!hero) return; // User must have uploaded a hero at least
    
    // Update refs with the latest text fields
    const finalHero = { ...hero, name: heroName, traits: heroTraits };
    setHero(finalHero); // Updates state and ref
    
    if (friend) {
        const finalFriend = { ...friend, name: friendName, traits: friendTraits };
        setFriend(finalFriend);
    }

    if (storyMode === 'ai' && selectedGenre === 'Custom' && !customPremise.trim()) {
        alert("Please enter a custom story premise.");
        return;
    }
    if (storyMode === 'script' && !scriptData) {
        alert("Please upload a PDF script.");
        return;
    }

    setIsTransitioning(true);
    
    if (storyMode === 'ai') {
        let availableTones = TONES;
        if (selectedGenre === "Teen Drama / Slice of Life" || selectedGenre === "Lighthearted Comedy") {
            availableTones = TONES.filter(t => t.includes("CASUAL") || t.includes("WHOLESOME") || t.includes("QUIPPY"));
        } else if (selectedGenre === "Classic Horror") {
            availableTones = TONES.filter(t => t.includes("INNER-MONOLOGUE") || t.includes("OPERATIC"));
        }
        setStoryTone(availableTones[Math.floor(Math.random() * availableTones.length)]);
    }

    const coverFace: ComicFace = { id: 'cover', type: 'cover', isLoading: true, pageIndex: 0 };
    setComicFaces([coverFace]);
    historyRef.current = [coverFace];
    generatingPages.current.add(0);

    generateSinglePage('cover', 0, 'cover').finally(() => generatingPages.current.delete(0));
    
    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        // FULL BOOK GENERATION TRIGGER - LINEAR
        await generateBatch(1, TOTAL_PAGES); 
    }, 1100);
  };

  const resetApp = () => {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setFriend(null);
      setScriptData(null);
      setHeroName("");
      setHeroTraits("");
      setFriendName("");
      setFriendTraits("");
  };

  // --- REGENERATE SINGLE PAGE ---
  const handleRegenerate = async (pageIndex: number) => {
      const face = comicFaces.find(f => f.pageIndex === pageIndex);
      if (!face) return;
      
      // Clear data and set loading
      updateFaceState(face.id, { imageUrl: undefined, audioUrl: undefined, videoUrl: undefined, isLoading: true });
      generatingPages.current.add(pageIndex);
      
      try {
          await generateSinglePage(face.id, pageIndex, face.type);
      } catch (e) {
          console.error("Regeneration failed", e);
      } finally {
          generatingPages.current.delete(pageIndex);
      }
  };

  // --- DOWNLOADERS ---

  const downloadPDF = () => {
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = comicFaces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    });
    doc.save('Instant-Heroes-Issue.pdf');
  };

  const downloadHTML = async () => {
      // 1. Gather all pages
      const pages = comicFaces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));
      if (pages.length === 0) return;

      // Prepare blobs for videos if they exist (fetch them to embed as data URI or blob ref is complex in single file)
      // For this implementation, we will assume videoUrl is a blob URL (which won't persist) or a remote URL. 
      // Current implementation returns a Blob URL `URL.createObjectURL(videoBlob)`. 
      // Blob URLs are session specific. We need to convert them to Base64 for a standalone HTML file.
      const processedPages = await Promise.all(pages.map(async (p) => {
          let videoBase64 = null;
          if (p.videoUrl && p.videoUrl.startsWith('blob:')) {
               try {
                   const blob = await fetch(p.videoUrl).then(r => r.blob());
                   videoBase64 = await new Promise<string>((resolve) => {
                       const reader = new FileReader();
                       reader.onloadend = () => resolve(reader.result as string);
                       reader.readAsDataURL(blob);
                   });
               } catch (e) { console.warn("Failed to embed video", e); }
          }
          return { ...p, embeddedVideo: videoBase64 };
      }));

      // 2. Construct sheets (Pairs of Front/Back)
      const sheets: { front?: any, back?: any }[] = [];
      const cover = processedPages.find(p => p.pageIndex === 0);
      const page1 = processedPages.find(p => p.pageIndex === 1);
      if (cover) sheets.push({ front: cover, back: page1 });

      for (let i = 2; i <= TOTAL_PAGES; i += 2) {
          const front = processedPages.find(p => p.pageIndex === i);
          const back = processedPages.find(p => p.pageIndex === i + 1);
          if (front || back) {
              sheets.push({ front, back });
          }
      }

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Instant Heroes! Powered by: Rocc$tar AI</title>
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<style>
  :root {
    --page-height: min(90vh, 750px);
    --page-width: calc(var(--page-height) * 0.666);
  }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: 'Comic Neue', sans-serif;
    background-color: #222;
    background-image: radial-gradient(#333 15%, transparent 16%), radial-gradient(#333 15%, transparent 16%);
    background-size: 60px 60px;
    background-position: 0 0, 30px 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    touch-action: none;
  }
  .comic-scene {
    perspective: 3500px;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .book {
    position: relative;
    width: var(--page-width);
    height: var(--page-height);
    transform-style: preserve-3d;
    transition: transform 0.5s ease;
  }
  .book.opened {
    transform: translateX(25%);
  }
  @media (min-width: 1000px) {
    .book.opened { transform: translateX(calc(var(--page-width) / 2)); }
  }
  .paper {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    transform-origin: left center;
    transform-style: preserve-3d;
    transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000);
    cursor: pointer;
  }
  .paper.flipped { transform: rotateY(-180deg); }
  .front, .back {
    position: absolute; width: 100%; height: 100%;
    backface-visibility: hidden;
    overflow: hidden;
    background-color: #0a0a0a;
    transform-style: preserve-3d;
  }
  .front { padding-left: 6px; box-shadow: inset 25px 0 40px -20px rgba(0,0,0,0.6); }
  .back { transform: rotateY(180deg); padding-right: 6px; box-shadow: inset -25px 0 40px -20px rgba(0,0,0,0.6); }
  
  .gloss {
    position: absolute; inset: 0;
    background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.25) 55%, transparent 65%),
                linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 15%);
    pointer-events: none; z-index: 30; mix-blend-mode: screen; opacity: 0.8;
  }
  .panel-container {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    background-color: #fff; padding: 12px; box-sizing: border-box; position: relative;
  }
  .panel-container.full-bleed { padding: 0; background-color: #0a0a0a; }
  .panel-media { width: 100%; height: 100%; object-fit: contain; background: white; }
  video.panel-media { object-fit: cover; }
  .full-bleed .panel-media { object-fit: cover; }
  
  /* Page Numbers */
  .page-number {
    position: absolute;
    bottom: 12px;
    font-family: 'Comic Neue', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #333;
    background: rgba(255,255,255,0.7);
    padding: 2px 8px;
    border-radius: 4px;
    z-index: 50;
    pointer-events: none;
    box-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  }
  .front .page-number { right: 12px; }
  .back .page-number { left: 12px; }

  /* Cover Specifics */
  .paper:first-child { box-shadow: 25px 25px 50px rgba(0,0,0,0.8); }
  .paper:first-child .front { padding-left: 0; box-shadow: none; }
  .paper:first-child .front::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 14px;
    background: linear-gradient(to right, #0a0a0a, #333 20%, #666 30%, #333 50%, #0a0a0a 100%);
    border-right: 1px solid #000; z-index: 25; box-shadow: 2px 0 5px rgba(0,0,0,0.5);
  }
  .paper:first-child .front::after {
    content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 4px;
    background: linear-gradient(to right, rgba(0,0,0,0.7), transparent); z-index: 25;
  }
  .paper:first-child .front .panel-container { padding-left: 14px; }

  /* Audio Button */
  .audio-btn {
    position: absolute; top: 10px; right: 10px;
    background: #ffeb3b; border: 2px solid black; border-radius: 50%;
    width: 40px; height: 40px; font-size: 20px;
    cursor: pointer; z-index: 40; box-shadow: 2px 2px 0 black;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.1s;
  }
  .audio-btn:hover { transform: scale(1.1); }
  .audio-btn:active { transform: scale(0.95); }

  /* Mobile Optimization */
  @media (max-width: 768px) {
    :root { --page-height: min(85vh, 140vw); }
    .comic-scene { perspective: 2000px; height: 100vh; overflow: hidden; }
    /* On mobile, opening the book slides it completely over so the spine is at the left edge of screen */
    .book.opened { transform: translateX(50%); } 
    /* Adjust spine on mobile to be smaller */
    .paper:first-child .front::before { width: 8px; }
    .paper:first-child .front::after { left: 8px; }
    .paper:first-child .front .panel-container { padding-left: 8px; }
    
    /* Better touch targets */
    .audio-btn { width: 50px; height: 50px; font-size: 24px; top: 15px; right: 15px; }
  }
</style>
</head>
<body>
  <div class="comic-scene">
    <div class="book" id="book">
      ${sheets.map((sheet, i) => {
        const zIndex = sheets.length - i;
        
        const renderSide = (side: any) => {
           if (!side) return '<div class="panel-container" style="background:#0a0a0a"></div>';
           const isVideo = !!side.embeddedVideo;
           const mediaTag = isVideo 
              ? `<video src="${side.embeddedVideo}" autoplay loop muted playsinline class="panel-media"></video>`
              : `<img src="${side.imageUrl}" class="panel-media">`;
           
           const pageNum = side.pageIndex;
           const isCover = pageNum === 0;

           return `
          <div class="panel-container ${side.type === 'cover' ? 'full-bleed' : ''}">
            <div class="gloss"></div>
            ${mediaTag}
            ${!isCover && pageNum !== undefined ? `<div class="page-number">${pageNum}</div>` : ''}
            ${side.audioUrl ? `<button class="audio-btn" onclick="playAudio(event, '${side.id}')">🔊</button><audio id="${side.id}" src="${side.audioUrl}"></audio>` : ''}
          </div>`;
        };

        return `
        <div class="paper" id="sheet-${i}" style="z-index: ${zIndex}" onclick="flip(${i})">
           <div class="front">${renderSide(sheet.front)}</div>
           <div class="back">${renderSide(sheet.back)}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <script>
    let currentSheet = 0;
    const totalSheets = ${sheets.length};
    const book = document.getElementById('book');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playFlipSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        
        // Noise buffer
        const bufferSize = audioCtx.sampleRate * 0.3; // 300ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.05)); // Decay envelope
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.linearRampToValueAtTime(300, t + 0.2);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    }

    function flip(index) {
        // Opening book logic
        if (index === 0 && currentSheet === 0) {
            currentSheet = 1;
            book.classList.add('opened');
            updateSheets();
            playFlipSound();
            return;
        }

        // Navigation logic
        if (index < currentSheet) {
            // Clicked a flipped page (left side), go back
            currentSheet = index;
            playFlipSound();
        } else if (index === currentSheet) {
            // Clicked top right page, go forward
             if (currentSheet < totalSheets) {
                currentSheet++;
                playFlipSound();
             }
        }
        
        // Close book if back at 0
        if (currentSheet === 0) book.classList.remove('opened');
        updateSheets();
    }

    function updateSheets() {
        for (let i = 0; i < totalSheets; i++) {
            const sheet = document.getElementById('sheet-' + i);
            if (i < currentSheet) {
                sheet.classList.add('flipped');
                sheet.style.zIndex = i; // Stack upwards on the left
            } else {
                sheet.classList.remove('flipped');
                sheet.style.zIndex = totalSheets - i; // Stack downwards on the right
            }
        }
    }

    function playAudio(e, id) {
        e.stopPropagation(); // Prevent flipping
        const audio = document.getElementById(id);
        if(audio) {
            audio.currentTime = 0;
            audio.play();
        }
    }
  </script>
</body>
</html>`;
    
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Gemini-Heroes-Motion-Comic.html';
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleHeroUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setHero({ ...heroRef.current, base64, desc: "The Main Hero", gender: heroGender }); } catch (e) { alert("Hero upload failed"); }
  };
  const handleFriendUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setFriend({ ...friendRef.current, base64, desc: "The Sidekick/Rival", gender: friendGender }); } catch (e) { alert("Friend upload failed"); }
  };

  const handleSheetClick = (index: number) => {
      if (!isStarted) return;
      if (index === 0 && currentSheetIndex === 0) return;
      if (index < currentSheetIndex) setCurrentSheetIndex(index);
      else if (index === currentSheetIndex && comicFaces.find(f => f.pageIndex === index)?.imageUrl) setCurrentSheetIndex(prev => prev + 1);
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      
      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          hero={hero}
          friend={friend}
          heroName={heroName}
          heroTraits={heroTraits}
          friendName={friendName}
          friendTraits={friendTraits}
          selectedGenre={selectedGenre}
          selectedArtStyle={selectedArtStyle}
          heroGender={heroGender}
          friendGender={friendGender}
          selectedLanguage={selectedLanguage}
          customPremise={customPremise}
          richMode={richMode}
          enableTTS={enableTTS}
          enableMotion={enableMotion}
          storyMode={storyMode}
          scriptData={scriptData}
          onHeroUpload={handleHeroUpload}
          onFriendUpload={handleFriendUpload}
          onHeroNameChange={setHeroName}
          onHeroTraitsChange={setHeroTraits}
          onFriendNameChange={setFriendName}
          onFriendTraitsChange={setFriendTraits}
          onGenreChange={setSelectedGenre}
          onArtStyleChange={setSelectedArtStyle}
          onHeroGenderChange={setHeroGender}
          onFriendGenderChange={setFriendGender}
          onLanguageChange={setSelectedLanguage}
          onPremiseChange={setCustomPremise}
          onRichModeChange={setRichMode}
          onTTSChange={setEnableTTS}
          onMotionChange={setEnableMotion}
          onStoryModeChange={setStoryMode}
          onScriptUpload={handleScriptUpload}
          onLaunch={launchStory}
      />
      
      <Book 
          comicFaces={comicFaces}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          onSheetClick={handleSheetClick}
          onOpenBook={() => setCurrentSheetIndex(1)}
          onDownloadPDF={downloadPDF}
          onDownloadHTML={downloadHTML}
          onReset={resetApp}
          onRegenerate={handleRegenerate}
          onRegenerateVideo={handleRegenerateVideo}
      />
    </div>
  );
};

export default App;