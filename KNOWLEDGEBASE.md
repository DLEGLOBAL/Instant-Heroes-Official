# Knowledge Base: Instant Heroes! Powered by: Rocc$tar AI

## 1. Overview
**Instant Heroes!** is a cutting-edge, AI-driven comic book generator that transforms user-provided photos and premises into fully realized, multi-page digital comic books. It leverages a sophisticated multi-agent AI orchestration system to ensure narrative depth, visual consistency, and cinematic quality.

---

## 2. Core Features & Functions

### 2.1. Character Personalization (The Cast)
- **Hero & Co-Star Integration**: Users can upload photos of themselves or friends. The AI analyzes these images to maintain strict facial and physical likeness across every panel.
- **Trait System**: Define names and personality traits (e.g., "Brave," "Sarcastic," "Shy") which directly influence the AI's dialogue and action choreography.
- **Gender Selection**: Ensures correct pronoun usage and character modeling.

### 2.2. Story Orchestration (The Story)
- **AI Writer Mode**: Generates a complete story arc based on selected Genres (Superhero, Noir, Sci-Fi, etc.) and Tones.
- **Script Adaptation Mode**: Users can upload a PDF script. The AI "Director" agent extracts segments and adapts them into visual comic beats.
- **15-Agent Multi-Agent System**: A proprietary prompt architecture that simulates a full comic studio:
    1. **Showrunner**: Plots the arc.
    2. **Head Writer**: Crafts dialogue.
    3. **Character Supervisor**: Enforces traits.
    4. **Continuity Editor**: Monitors visual consistency (costumes, hair).
    5. **Director**: Chooses camera angles.
    6. **Cinematographer**: Manages lighting.
    7. **Art Director**: Enforces the chosen art style.
    8. **Set Decorator**: Details backgrounds.
    9. **Costume Designer**: Maintains outfit consistency.
    10. **Action Choreographer**: Poses characters.
    11. **FX Artist**: Adds speed lines/particles.
    12. **Letterer**: Places speech bubbles.
    13. **Physicist**: Ensures realistic weight.
    14. **Lore Master**: Maintains world logic.
    15. **Quality Assurance**: Final polish.

### 2.3. Visual & Audio Modalities
- **Art Styles**: Supports diverse aesthetics including "Classic 90s Comic," "Cyberpunk Neon," "Studio Ghibli Anime," "Dark Noir Ink," and more.
- **Voice Narration (TTS)**: Uses Gemini TTS to generate high-quality voiceovers for captions and dialogue.
- **Motion Mode (Veo 3)**: Transforms static panels into "Living Paintings" using video generation for subtle, cinematic movement.

### 2.4. 3D Book Mechanics
- **Authentic Experience**: A custom CSS-based 3D book engine with realistic page-flipping physics.
- **Visual Polish**: Includes "Gloss" reflections, spine binding, and gutter shadows for a tactile feel.
- **Responsive Design**: Adapts from a dual-page spread on desktop to a focused single-page view on mobile.

### 2.5. Export & Sharing
- **PDF Export**: Generates a high-resolution, print-ready PDF of the entire issue.
- **Standalone HTML**: Creates a single, portable HTML file with all images, audio, and videos embedded as Base64 data, allowing users to share their comic as a self-contained interactive app.

---

## 3. Technical Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **AI Models**: 
    - Text: `gemini-3-pro-preview`
    - Images: `gemini-3-pro-image-preview`
    - TTS: `gemini-2.5-flash-preview-tts`
    - Video: `veo-3.1-fast-generate-preview`
- **Libraries**: `jspdf` (PDF generation), `motion/react` (Animations).

---

## 4. Master Prompt for Recreation (Base44/AI Studio)

**Prompt Title:** Instant Heroes! Comic Studio Engine

**System Prompt / Core Directive:**
> Build a full-stack React application titled "Instant Heroes! Powered by: Rocc$tar AI". The app is a sophisticated 3D digital comic book generator. 
> 
> **Key Technical Requirements:**
> 1. **3D Book UI**: Implement a CSS-driven 3D book with `perspective` and `transform-style: preserve-3d`. Pages must flip on click. Include a "gloss" overlay and realistic spine binding.
> 2. **Multi-Agent AI Logic**: Create a function `generateBeat` that uses a 15-agent system prompt (Showrunner, Continuity Editor, etc.) to generate a JSON object containing `caption`, `dialogue`, `scene`, and `visual_directives`.
> 3. **Image Consistency**: Use `gemini-3-pro-image-preview`. Implement a reference image system where user-uploaded photos are passed as `inlineData` to the image model. Enforce strict character likeness and costume continuity via the prompt.
> 4. **Modalities**: 
>    - Integrate `gemini-2.5-flash-preview-tts` for voice narration.
>    - Integrate `veo-3.1-fast-generate-preview` for "Motion Mode" video generation.
> 5. **Setup Screen**: A "Comic-Brutalist" style setup screen with bold borders, yellow/red accents, and "Bangers" typography. Include character uploads, genre/style selectors, and a story mode toggle (AI vs PDF Script).
> 6. **Export Logic**: 
>    - Use `jspdf` for PDF generation.
>    - Implement a "Download HTML" feature that bundles the entire comic (including Base64 media) into a single standalone file.
> 7. **Styling**: Use Tailwind CSS. Background should be a dark "Ben-Day dots" pattern. Buttons should have a "Comic-Pop" feel (thick borders, offset shadows).
> 8. **State Management**: Manage a `comicFaces` array that tracks the state (loading, image, audio, video) for each page (Cover, Pages 1-10, Back Cover).
