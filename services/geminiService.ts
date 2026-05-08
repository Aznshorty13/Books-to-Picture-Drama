import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, StoryBeat, StoryBible, CharacterPose, CameraShot, VFXData } from "../types";

const API_KEY = process.env.API_KEY;

export const ART_STYLES = [
  { 
    id: 'a1_solo', 
    name: 'A-1 Pictures (Solo Leveling)', 
    description: 'anime style by A-1 Pictures, Solo Leveling art style, sharp digital lines, high contrast blue/purple lighting, glowing particle effects, sung jin-woo aesthetic, detailed eyes, cinematic lighting, manhwa aesthetic' 
  },
  { 
    id: 'ufotable_demon', 
    name: 'Ufotable (Demon Slayer)', 
    description: 'anime style by Ufotable, Demon Slayer art style, fluid animation aesthetic, heavy post-processing, distinct linework, vibrant breathing effects, high budget anime, cinematic composition, kimetsu no yaiba style, volumetric lighting' 
  },
  { 
    id: 'berserk_90s', 
    name: '90s Anime (Berserk)', 
    description: '90s retro anime style, Berserk 1997 art style, hand-drawn cel animation, gritty textures, dark fantasy aesthetic, realistic anatomical proportions, film grain, muted colors, kentaro miura style, vintage anime' 
  },
  { 
    id: 'ghibli_scenic', 
    name: 'Studio Ghibli (Scenic)', 
    description: 'anime style by Studio Ghibli, Hayao Miyazaki art style, hand-painted backgrounds, watercolor textures, vibrant natural colors, soft lighting, detailed environments, whimsical atmosphere, spirited away style' 
  },
  { 
    id: 'mappa_juju', 
    name: 'MAPPA (Jujutsu Kaisen)', 
    description: 'anime style by MAPPA, Jujutsu Kaisen art style, gritty realism, fluid motion blur, dark color palettes, intricate shading, dynamic camera angles, high contrast shadows, shonen aesthetic' 
  },
  { 
    id: 'arcane_paint', 
    name: 'Arcane (Painted)', 
    description: 'Arcane animated series style, Fortiche production style, 3D hand-painted texture look, heavy brushstrokes, dramatic cinematic lighting, stylized realism, oil painting aesthetic, league of legends universe' 
  },
];

// --- PROMPT CONFIGURATION (DEFAULTS) ---

export const DEFAULT_DIRECTOR_PROMPTS = {
  analyzer: {
    id: 'analyzer',
    name: "Story Analyzer",
    description: "Gemini 3 Pro. Responsible for breaking down prose into narrative beats and the story bible.",
    system: "You are a director and screenwriter for a Visual Drama. Your goal is to translate prose into a highly detailed series of static images accompanied by a rich, depth-filled script. You prioritize compelling storytelling, ensuring key moments of world-building and character development get their own visual beat. You are an adapter who respects the original author's voice and style above all else.",
    userTemplate: `Analyze the following text for a "Visual Drama" adaptation. 
A Visual Drama consists of a sequence of static illustrations (Visual Keys) accompanied by voice acting and narration (The Script).

TARGET VISUAL STYLE: {{STYLE}}
Keep this visual style in mind when describing settings and action.

{{PREVIOUS_CONTEXT_SECTION}}

Task 1: Create/Update Story Bible.
- Summary: Concise master summary.
- Characters: List all Major characters. Include Minor characters ONLY if they appear in this specific text segment and have dialogue or distinct actions. Do not list generic background extras to avoid overcrowding.
- Settings: Key locations.

Task 2: Extract Visual Drama Beats.
- Break the story down into sequential beats.
- **BALANCE**: Do not compress the story, but avoid excessive micro-management. Focus on beats that meaningfully drive the narrative forward.
- Create a new beat for distinct shifts in action, emotion, or visual focus that significantly add to the cinematic storytelling.
- Include specific beats for "establishing shots" (world building) and "reaction shots" (character development) ONLY if they deepen the atmosphere or emotion.
- Ensure a smooth cinematic flow. Only create a new beat if it meaningfully adds to character development, world-building, or the dramatic arc.
- For each beat, provide:
  1. **Title**: Short identifier.
  2. **Action Summary**: Brief description of physical events.
  3. **Visual Setting**: The scene heading (e.g. EXT. FOREST - DAY). Keep this consistent across beats in the same location.
  4. **Visual Description**: Describe the visible elements of the scene using the author's original descriptive language, vocabulary, and tone.
     - **NO CAMERA TERMS**: Do NOT include camera instructions like "close up", "wide shot", "zoom", or "pan". Focus strictly on the diegetic physical reality (characters, environment, lighting).
     - **STYLE MATCHING**: If the source text is poetic, be poetic. If it is gritty, be gritty. Use the author's specific imagery and adjectives.
  5. **The Script**: 
     - STRICT FORMATTING REQUIRED.
     - **CRITICAL DIALOGUE RULE**: You MUST Use the dialogue strictly from the source text. **Do NOT invent new dialogue.** If the character does not say it in the text, they do not say it in the script.
     - Break the script down line-by-line based on who is speaking or if it is narration.
     - Format for Dialogue: Character Name: "Line of dialogue."
     - Format for Narration: Narrator: Description of action, atmosphere, or context.
     - Format for Thoughts: (Character Name, Thinking): *Internal thought.*
     - Do NOT use prose paragraphs. Use newlines to separate every switch in speaker or mode.
     - **STYLE CRITICAL**: Maintain the exact writing style, vocabulary, and tone of the source text. Do not simplify or modernize the prose. Use the original dialogue verbatim. The source text is from a well established author, respect their voice.

Input Text:
"""
{{INPUT_TEXT}}
"""`
  },
  extractor: {
    id: 'extractor',
    name: "Source Text Extractor",
    description: "Gemini 3 Pro. Maps generated beats back to original text.",
    system: "You are a forensic text analyst. Your task is to extract the exact source text used for specific narrative beats.",
    userTemplate: `Original Source Text:
"""
{{INPUT_TEXT}}
"""

Generated Narrative Beats:
{{BEATS_JSON}}

Task:
For each beat in the JSON, identify the contiguous segment of text from the Original Source Text that corresponds to that beat.
- **INCLUSIVE**: The source text must include ALL text used to generate the visual description, dialogue, environment details, and action for that beat.
- **VERBATIM**: You must extract the text exactly as it appears in the source. Do not rewrite it.
- **CONTEXT**: Ensure the excerpt provides enough context for an artist to visualize the scene accurately.

Return a JSON array mapping beat IDs to their source text.`
  },
  pose: {
    id: 'pose',
    name: "Pose Director",
    description: "Gemini 3 Pro. Defines anatomical body mechanics for characters in each beat.",
    system: `System Role: You are the Pose Director for a high-budget visual drama anime. Your goal is to translate written Scenes into precise, static keyframe pose descriptions.
The Pipeline Context:
Input: The narrative Beat cards and its information.
Your Role (Pose Director): Isolate each character and define their physical body mechanics.
If reference images are provided in the context, use them to understand the character's design and physical capabilities.

CRITICAL INSTRUCTION ON FIDELITY:
You will receive the "sourceText" for each beat. You MUST read this source text to understand the exact intention, subtlety, and intensity of the movement.
- **NO EXAGGERATION**: Do NOT default to exaggerated anime tropes unless the source text explicitly describes high energy action.
- **TONE MATCHING**: If the text is quiet and subtle, the pose must be quiet and subtle. If it is violent, the pose is violent.
- **AUTHOR INTENTION**: Respect the author's original description and style above all else.

RULES:
1. No camera instructions.
2. Analyze the Text: Identify every active entity (characters, monsters, vehicles).
3. Determine the Anchor: Identify if characters are interacting with an object or terrain (e.g., "surfing on a serpent," "hanging from a ledge"). This is the "Anchor."
4. Define the Pose: For each character, describe their body state in anatomical terms suitable for an artist or 3D poser. Focus on:
    - Limbs: Position of arms, legs, hands, and feet (e.g., "knees bent 45 degrees," "left arm extended overhead").
    - Torso/Spine: Twist, arch, or lean (e.g., "leaning forward for balance," "spine arched backward").
    - Head/Gaze: Where are they looking? (e.g., "chin tucked, eyes locked on target").

Use the story bible that was generated. As context for better consistency.`,
    userTemplate: `CONTEXT - STORY BIBLE:
{{BIBLE_JSON}}

TARGET VISUAL STYLE: {{STYLE}}
Ensure poses match the energy and anatomical style of this aesthetic.

INPUT - NARRATIVE BEATS:
{{BEATS_JSON}}`
  },
  camera: {
    id: 'camera',
    name: "Camera Director",
    description: "Gemini 3 Pro. Composes shots, lens choices, and angles.",
    system: `System Role: You are the Camera Director (Cinematographer) for a high-budget visual drama anime. 
Your Goal: Decide how to frame the poses to maximize dramatic impact, WHILE STAYING TRUE TO THE SOURCE TEXT.

CRITICAL INSTRUCTION ON FIDELITY:
- **SOURCE TEXT IS LAW**: You will be provided with the 'sourceText'. You MUST adhere to the scale and intensity described there. 
- **NO HALLUCINATION**: If the text says they are standing quietly, do not create a "dynamic dutch angle action shot".
- **NO EXAGGERATION**: Do not use "Sakuga" distortion or "Fish-eye" unless the text describes supernatural speed or warping. 
- **GROUNDED**: If the scene is conversational, use grounded, standard cinematic framing (Over-the-shoulder, Medium Shot, Close-up).

Instructions:
1. Analyze the Hierarchy: Look at the other beats. Look at the poses in this beat. Determine who is the Focal Point (the subject of the shot) and who is background/context.
2. Define the Lens & Perspective:
    - Action: Use wide-angle (18mm-24mm) to exaggerate movement and foreshortening (e.g., a fist or weapon closer to the camera looks huge).
    - Emotion: Use telephoto (85mm+) to compress the background and isolate the character.
3. Composition Strategy: Describe where the characters are placed. Are they utilizing the "Rule of Thirds"? Is there a "Diagonal Line of Action"?`,
    userTemplate: `CONTEXT - STORY BIBLE:
{{BIBLE_JSON}}

TARGET VISUAL STYLE: {{STYLE}}
Ensure camera work (angles, lens choices) reflects this visual style.

INPUT - NARRATIVE BEATS WITH POSES AND SOURCE TEXT:
{{BEATS_JSON}}`
  },
  vfx: {
    id: 'vfx',
    name: "VFX Director",
    description: "Gemini 3 Pro. Applies lighting, atmosphere, and post-processing.",
    system: `System Role: You are the VFX & Lighting Director for a high-budget visual drama anime. Your job is to apply atmosphere, lighting, and special effects to a pre-composed scene.

CRITICAL INSTRUCTION ON FIDELITY:
You will receive the "sourceText" for each beat. You MUST read this source text to understand the exact intention, subtlety, and intensity of the atmosphere and effects.
- **NO EXAGGERATION**: Do NOT add flashy effects (particles, glows, bloom) or dramatic lighting if the source text describes a mundane, quiet, or daylight scene.
- **SOURCE TEXT IS LAW**: If the text does not mention magic, fire, or rain, DO NOT ADD IT.
- **TONE MATCHING**: If the text is gloomy, the lighting should be gloomy. If it is vibrant, the lighting should be vibrant.

Use the following:
- Narrative Beat: The original text description.
- Source Text: The verbatim text segment.
- Pose Data: Where characters are (from Pose Director).
- Camera Plan: How the shot is framed (from Camera Director).

Your Goal: Define the lighting scheme, color palette, and visual effects (particles, glows, motion blur).

Instructions:
1. Lighting Strategy: Determine the primary light source (e.g., the sun, a magical glow). 
2. Atmosphere: Analyze the environment (e.g., "grey cloudy sky"). How does this affect the scene? (e.g., "Desaturated background to make characters pop").
3. Specific VFX: Extract magical or tech elements ONLY if present in the narrative (e.g., "red glowing ridges," "blue scaled wings").
4. Post-Processing: Add keywords for anime compositing: "Chromatic Aberration," "Motion Blur," "Depth of Field," "Film Grain."`,
    userTemplate: `CONTEXT - STORY BIBLE:
{{BIBLE_JSON}}

TARGET VISUAL STYLE: {{STYLE}}
Ensure lighting, color palette, and effects match this specific art style.

INPUT - BEATS WITH POSES AND CAMERA PLAN AND SOURCE TEXT:
{{BEATS_JSON}}`
  },
  sound: {
    id: 'sound',
    name: "Sound Director",
    description: "Gemini 3 Pro. Generates detailed audio descriptions, SFX cues, and background ambience linked to script timing.",
    system: `System Role: You are the Sound Designer and Foley Artist for a Visual Drama.
Your Goal: Analyze the visual beats and the script to create a detailed soundscape description.

Input: Narrative Beats containing Action, Visual Description, and Script.
Output: A structured description of the audio environment.

Instructions:
1. Analyze the Visual Setting and Action: Determine the background **Ambience** (e.g., "Low hum of a spaceship engine," "Chirping crickets in a quiet forest," "Roar of a cheering crowd").
2. Analyze the Script and Poses: Identify specific **Spot FX** (Sound Effects) that happen during the beat.
3. **TIMING IS CRITICAL**: You must describe *when* the sound happens relative to the dialogue or narration.
   - Example: "Sound of a heavy thud [BEFORE dialogue]."
   - Example: "Rustling cloth [DURING the pause after 'Hello']."
   - Example: "Sword unsheathing [IMMEDIATELY AFTER narration]."

Format your output as a concise but descriptive paragraph or list that an audio engineer can use to build the scene.`,
    userTemplate: `CONTEXT - STORY BIBLE:
{{BIBLE_JSON}}

INPUT - NARRATIVE BEATS WITH SCRIPT:
{{BEATS_JSON}}`
  }
};

export const DEFAULT_IMAGE_PROMPTS = {
  reference: {
    id: 'reference',
    name: "Reference Generator",
    description: "Gemini 2.5 Flash Image. Generates concept art for characters and settings.",
    template: `Generate a Concept Art Reference Image.

**VISUAL STYLE (STRICT ADHERENCE):**
{{STYLE}}

**SUBJECT:**
{{PROMPT}}

**QUALITY GUIDELINES:**
- Masterpiece, best quality.
- Detailed textures and lighting matching the specified style.
- Single full image, full bleed.
- NO text, NO UI, NO split screens, NO borders.
- NO camera viewfinder overlays or lens circular borders.`
  },
  scene: {
    id: 'scene',
    name: "Scene Generator",
    description: "Gemini 2.5 Flash Image. Generates final narrative beat keyframes using all director data. Uses [REFERENCE] injection for characters/settings in Bible.",
    template: `Generate a Cinematic Keyframe Illustration.

**VISUAL STYLE (STRICT ADHERENCE REQUIRED):**
{{STYLE}}
(Ensure the image looks exactly like a screenshot from this specific animation style).

**SCENE CONTEXT:**
Setting: {{SETTING}}
Action/Description: {{DESCRIPTION}}

**TECHNICAL DETAILS:**
Camera: {{CAMERA_DETAILS}}
Lighting/VFX: {{VFX_DETAILS}}

**CHARACTER POSES:**
{{POSES_LIST}}

**NEGATIVE PROMPT / CONSTRAINTS:**
- No text overlays, no speech bubbles, no UI elements.
- No split screens, no comic book panels, no borders.
- NO camera viewfinder overlays, NO circular lens borders, NO HUD, NO recording indicators.
- Single unified composition.
- Maintain consistent anatomical proportions appropriate for the style.`
  }
};

export const DEFAULT_ASSET_PROMPTS = {
  textbox: {
    id: 'textbox',
    name: "UI Text Box Generator",
    description: "Gemini 2.5 Flash Image. Generates dialogue box UI elements for Visual Novels.",
    template: `Generate a 2D Game User Interface Asset: A Visual Novel Dialogue Box.

**STYLE:**
{{STYLE}}
(Match the aesthetic: Sci-fi, Fantasy, Gritty, etc.)

**DESCRIPTION:**
{{PROMPT}}

**MANDATORY LAYOUT REQUIREMENTS:**
- WIDE Aspect Ratio (approx 8:1 or 10:1). This is for the bottom of a 16:9 screen.
- Long horizontal rectangle shape.
- Full width design preferred.
- Isolated on a solid black background for easy masking.
- Include a nameplate area if appropriate for the style.
- Clean vector-like lines, high resolution.
- NO TEXT inside the box.`
  },
  sprite: {
    id: 'sprite',
    name: "Character Sprite Generator",
    description: "Gemini 2.5 Flash Image. Generates half-body character sprites on plain backgrounds.",
    template: `Generate a Character Sprite for a Visual Novel.

**STYLE:**
{{STYLE}}

**CHARACTER DESCRIPTION & EMOTION:**
{{PROMPT}}

**REQUIREMENTS:**
- Half-body or 3/4 body portrait.
- Facing forward or slightly angled (conversational pose).
- Isolated on a solid white background (for easy transparency removal).
- High contrast, clear silhouette.
- NO background scenery.`
  }
};

// --- MUTABLE PROMPT STATE ---

// Initialize with defaults
let activeDirectorPrompts = JSON.parse(JSON.stringify(DEFAULT_DIRECTOR_PROMPTS));
let activeImagePrompts = JSON.parse(JSON.stringify(DEFAULT_IMAGE_PROMPTS));
let activeAssetPrompts = JSON.parse(JSON.stringify(DEFAULT_ASSET_PROMPTS));

// Getters
export const getDirectorPrompts = () => activeDirectorPrompts;
export const getImagePrompts = () => activeImagePrompts;
export const getAssetPrompts = () => activeAssetPrompts;

// Setters
export const saveDirectorPrompts = (newPrompts: any) => {
  activeDirectorPrompts = newPrompts;
};

export const saveImagePrompts = (newPrompts: any) => {
  activeImagePrompts = newPrompts;
};

export const saveAssetPrompts = (newPrompts: any) => {
  activeAssetPrompts = newPrompts;
};

// Reset
export const resetPrompts = () => {
  activeDirectorPrompts = JSON.parse(JSON.stringify(DEFAULT_DIRECTOR_PROMPTS));
  activeImagePrompts = JSON.parse(JSON.stringify(DEFAULT_IMAGE_PROMPTS));
  activeAssetPrompts = JSON.parse(JSON.stringify(DEFAULT_ASSET_PROMPTS));
};

// --- SCHEMAS ---

const characterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the character" },
    role: { type: Type.STRING, description: "Role in the story (e.g. Protagonist, Antagonist, Sidekick)" },
    description: { type: Type.STRING, description: "Physical description and key personality traits" }
  },
  required: ["name", "role", "description"]
};

const settingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the location" },
    description: { type: Type.STRING, description: "Atmospheric and visual description of the setting" }
  },
  required: ["name", "description"]
};

// Define the schema for the Gemini response
// Note: sourceText has been removed from here as it is done in a second pass
const mainSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bible: {
      type: Type.OBJECT,
      description: "The Story Bible containing summary, characters, and settings.",
      properties: {
        summary: { type: Type.STRING, description: "A comprehensive summary of the text." },
        characters: { type: Type.ARRAY, items: characterSchema, description: "List of key characters." },
        settings: { type: Type.ARRAY, items: settingSchema, description: "List of key settings/locations." }
      },
      required: ["summary", "characters", "settings"]
    },
    beats: {
      type: Type.ARRAY,
      description: "A list of narrative beats for a Picture Drama.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A short, punchy title for this beat."
          },
          narrativeDescription: {
            type: Type.STRING,
            description: "A concise summary of the physical action happening in this beat."
          },
          visualSetting: {
            type: Type.STRING,
            description: "The location/scene heading. (e.g. 'INT. CASTLE THRONE ROOM - NIGHT'). Use consistent naming."
          },
          visualDescriptionPlain: {
            type: Type.STRING,
            description: "A description of the scene's visual content using the author's original style and vocabulary. Do NOT use camera terms (e.g. 'close up'). Focus on physical details."
          },
          script: {
            type: Type.STRING,
            description: "The script formatted line-by-line using 'Speaker: Content' format. IMPORTANT: Maintain the author's original writing style, vocabulary, and tone. Use original dialogue verbatim where possible."
          }
        },
        required: ["title", "narrativeDescription", "visualSetting", "visualDescriptionPlain", "script"]
      }
    }
  },
  required: ["bible", "beats"]
};

// Schema for the second pass: Source Text Extraction
const extractionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      beatId: { type: Type.INTEGER, description: "The ID of the beat." },
      sourceText: { type: Type.STRING, description: "The verbatim source text segment." }
    },
    required: ["beatId", "sourceText"]
  }
};

const refineSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        narrativeDescription: { type: Type.STRING },
        visualSetting: { type: Type.STRING },
        visualDescriptionPlain: { type: Type.STRING },
        script: { type: Type.STRING },
        poses: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    anchor: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        },
        camera: {
            type: Type.OBJECT,
            properties: {
                lens: { type: Type.STRING },
                angle: { type: Type.STRING },
                composition: { type: Type.STRING },
                focalPoint: { type: Type.STRING }
            }
        },
        vfx: {
            type: Type.OBJECT,
            properties: {
                lighting: { type: Type.STRING },
                atmosphere: { type: Type.STRING },
                specialEffects: { type: Type.STRING },
                postProcessing: { type: Type.STRING }
            }
        }
    }
};

// --- HELPER FUNCTIONS ---

/**
 * Extracts images from StoryBible and creates a clean text-only copy for JSON injection.
 * Returns the cleaned bible and an array of Gemini content parts (text labels + inline data).
 */
const prepareMultimodalContext = (bible: StoryBible) => {
    // Deep clone to avoid mutating original
    const cleanBible = JSON.parse(JSON.stringify(bible)) as StoryBible;
    const parts: any[] = [];

    // Process Characters
    if (cleanBible.characters) {
        cleanBible.characters.forEach((char: any, index: number) => {
            if (char.imageRef) {
                // Add text label
                parts.push({ text: `[REFERENCE IMAGE] Character: ${char.name}` });
                
                // Add image part
                const match = char.imageRef.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                    parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }

                // Replace in clean bible
                char.imageRef = "(See attached reference image)";
            }
        });
    }

    // Process Settings
    if (cleanBible.settings) {
        cleanBible.settings.forEach((setting: any, index: number) => {
            if (setting.imageRef) {
                 // Add text label
                 parts.push({ text: `[REFERENCE IMAGE] Setting: ${setting.name}` });
                
                 // Add image part
                 const match = setting.imageRef.match(/^data:([^;]+);base64,(.+)$/);
                 if (match) {
                     parts.push({
                         inlineData: {
                             mimeType: match[1],
                             data: match[2]
                         }
                     });
                 }
 
                 // Replace in clean bible
                 setting.imageRef = "(See attached reference image)";
            }
        });
    }

    return { cleanBible, imageParts: parts };
};

// --- API FUNCTIONS ---

export const analyzeText = async (text: string, previousBible: StoryBible | null, style: string): Promise<AnalysisResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // --- STEP 1: ANALYZE STORY AND GENERATE BEATS (No Source Text yet) ---
  
  let cleanPreviousBibleStr = '';
  if (previousBible) {
      const { cleanBible } = prepareMultimodalContext(previousBible);
      cleanPreviousBibleStr = JSON.stringify(cleanBible);
  }

  const contextSection = previousBible 
    ? `PREVIOUS STORY BIBLE CONTEXT (from earlier chapters):
    """
    ${cleanPreviousBibleStr}
    """
    INSTRUCTIONS FOR CONTEXT MERGING:
    1. Update the 'Summary' to integrate the new events with the previous summary.
    2. For 'Characters': Retain existing characters. Add new characters (major or significant minor) introduced in this text. Update descriptions based on new events.
    3. For 'Settings': Add or update settings.` 
    : '';

  const prompt1 = activeDirectorPrompts.analyzer.userTemplate
    .replace('{{STYLE}}', style)
    .replace('{{PREVIOUS_CONTEXT_SECTION}}', contextSection)
    .replace('{{INPUT_TEXT}}', text);

  try {
    const response1 = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt1,
      config: {
        responseMimeType: "application/json",
        responseSchema: mainSchema,
        systemInstruction: activeDirectorPrompts.analyzer.system
      }
    });

    const outputText1 = response1.text;
    if (!outputText1) throw new Error("No response received from Gemini (Analyzer Step).");

    const parsed1 = JSON.parse(outputText1);
    
    // Map to our internal type, assigning IDs temporarily
    const beats: StoryBeat[] = parsed1.beats.map((beat: any, index: number) => ({
      id: index + 1,
      title: beat.title,
      narrativeDescription: beat.narrativeDescription,
      visualSetting: beat.visualSetting,
      visualDescriptionPlain: beat.visualDescriptionPlain,
      script: beat.script,
      // sourceText is deliberately undefined here
    }));

    const bible: StoryBible = {
      summary: parsed1.bible.summary,
      characters: parsed1.bible.characters,
      settings: parsed1.bible.settings
    };

    return { beats, bible };

  } catch (error) {
    console.error("Error in Analysis Step:", error);
    throw error;
  }
};

export const extractSourceText = async (text: string, beats: StoryBeat[]): Promise<Record<number, string>> => {
  if (!API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Simplify beats for the extraction prompt to save context
  const beatsForExtraction = beats.map(b => ({
      id: b.id,
      title: b.title,
      summary: b.narrativeDescription,
      script: b.script
  }));

  const prompt = activeDirectorPrompts.extractor.userTemplate
      .replace('{{INPUT_TEXT}}', text)
      .replace('{{BEATS_JSON}}', JSON.stringify(beatsForExtraction));

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema,
            systemInstruction: activeDirectorPrompts.extractor.system
        }
    });
    
    const outputText = response.text;
    const extractionMap: Record<number, string> = {};

    if (outputText) {
        const extractedData = JSON.parse(outputText);
        extractedData.forEach((item: any) => {
            extractionMap[item.beatId] = item.sourceText;
        });
    }

    return extractionMap;

  } catch (error) {
      console.error("Error extracting source text:", error);
      throw error;
  }
};

const poseSchema: Schema = {
  type: Type.ARRAY,
  description: "A list of pose definitions for each beat.",
  items: {
    type: Type.OBJECT,
    properties: {
      beatId: { type: Type.INTEGER, description: "The ID of the beat this pose set belongs to." },
      entities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the entity (character/monster)." },
            anchor: { type: Type.STRING, description: "Interaction with object/terrain (e.g., 'standing on ground', 'sitting on chair')." },
            description: { type: Type.STRING, description: "Anatomical description of limbs, torso, and head/gaze." }
          },
          required: ["name", "anchor", "description"]
        }
      }
    },
    required: ["beatId", "entities"]
  }
};

export const generatePoses = async (beats: StoryBeat[], bible: StoryBible, style: string): Promise<Record<number, CharacterPose[]>> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 1. Prepare Multimodal Context (Strip base64 from JSON, keep as parts)
  const { cleanBible, imageParts } = prepareMultimodalContext(bible);

  // 2. Simplify input context
  // CRITICAL: Include sourceText here so the Pose Director can use it.
  const simplifiedBeats = beats.map(b => ({
    id: b.id,
    action: b.narrativeDescription,
    setting: b.visualSetting,
    visual: b.visualDescriptionPlain,
    sourceText: b.sourceText
  }));

  // 3. Build Prompt Text
  const promptText = activeDirectorPrompts.pose.userTemplate
    .replace('{{STYLE}}', style)
    .replace('{{BIBLE_JSON}}', JSON.stringify(cleanBible))
    .replace('{{BEATS_JSON}}', JSON.stringify(simplifiedBeats));

  // 4. Construct Content Parts (Text + Images)
  const contentParts = [
      { text: promptText },
      ...imageParts
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contentParts.length > 1 ? [{ role: 'user', parts: contentParts }] : promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: poseSchema,
        systemInstruction: activeDirectorPrompts.pose.system
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response received for poses.");
    }

    const parsed = JSON.parse(outputText);
    
    const poseMap: Record<number, CharacterPose[]> = {};
    parsed.forEach((item: any) => {
      poseMap[item.beatId] = item.entities.map((e: any) => ({
        name: e.name,
        anchor: e.anchor,
        description: e.description
      }));
    });

    return poseMap;

  } catch (error) {
    console.error("Error generating poses:", error);
    throw error;
  }
};

const cameraSchema: Schema = {
  type: Type.ARRAY,
  description: "A list of camera definitions for each beat.",
  items: {
    type: Type.OBJECT,
    properties: {
      beatId: { type: Type.INTEGER, description: "The ID of the beat." },
      shot: {
        type: Type.OBJECT,
        properties: {
          lens: { type: Type.STRING, description: "Lens choice (e.g., '18mm Wide Angle', '85mm Telephoto')." },
          angle: { type: Type.STRING, description: "Camera angle (e.g., 'Low Angle', 'Dutch Angle')." },
          composition: { type: Type.STRING, description: "Description of character placement and composition strategy." },
          focalPoint: { type: Type.STRING, description: "The primary subject or focal point of the shot." }
        },
        required: ["lens", "angle", "composition", "focalPoint"]
      }
    },
    required: ["beatId", "shot"]
  }
};

export const generateCameraShots = async (beats: StoryBeat[], bible: StoryBible, style: string): Promise<Record<number, CameraShot>> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 1. Prepare Multimodal Context
  const { cleanBible, imageParts } = prepareMultimodalContext(bible);

  // 2. Prepare Beats Context
  const fullContextBeats = beats.map(b => ({
    id: b.id,
    action: b.narrativeDescription,
    setting: b.visualSetting,
    visual: b.visualDescriptionPlain,
    sourceText: b.sourceText,
    poses: b.poses 
  }));

  // 3. Build Prompt
  const promptText = activeDirectorPrompts.camera.userTemplate
    .replace('{{STYLE}}', style)
    .replace('{{BIBLE_JSON}}', JSON.stringify(cleanBible))
    .replace('{{BEATS_JSON}}', JSON.stringify(fullContextBeats));

  // 4. Construct Payload
  const contentParts = [
      { text: promptText },
      ...imageParts
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contentParts.length > 1 ? [{ role: 'user', parts: contentParts }] : promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: cameraSchema,
        systemInstruction: activeDirectorPrompts.camera.system
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response received for camera shots.");
    }

    const parsed = JSON.parse(outputText);
    
    const cameraMap: Record<number, CameraShot> = {};
    parsed.forEach((item: any) => {
      cameraMap[item.beatId] = {
        lens: item.shot.lens,
        angle: item.shot.angle,
        composition: item.shot.composition,
        focalPoint: item.shot.focalPoint
      };
    });

    return cameraMap;

  } catch (error) {
    console.error("Error generating camera shots:", error);
    throw error;
  }
};

const vfxSchema: Schema = {
  type: Type.ARRAY,
  description: "A list of VFX and Lighting definitions for each beat.",
  items: {
    type: Type.OBJECT,
    properties: {
      beatId: { type: Type.INTEGER, description: "The ID of the beat." },
      vfx: {
        type: Type.OBJECT,
        properties: {
          lighting: { type: Type.STRING, description: "Primary light source and lighting strategy (e.g., Rim lighting, God rays)." },
          atmosphere: { type: Type.STRING, description: "Environmental atmosphere and color palette (e.g., Desaturated, Foggy)." },
          specialEffects: { type: Type.STRING, description: "Specific magical or technical elements (e.g., Emission, Bloom, Particles)." },
          postProcessing: { type: Type.STRING, description: "Anime compositing keywords (e.g., Chromatic Aberration, Motion Blur)." }
        },
        required: ["lighting", "atmosphere", "specialEffects", "postProcessing"]
      }
    },
    required: ["beatId", "vfx"]
  }
};

export const generateVFX = async (beats: StoryBeat[], bible: StoryBible, style: string): Promise<Record<number, VFXData>> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 1. Prepare Multimodal Context
  const { cleanBible, imageParts } = prepareMultimodalContext(bible);

  // 2. Prepare Beats Context
  const fullContextBeats = beats.map(b => ({
    id: b.id,
    narrative: b.narrativeDescription,
    sourceText: b.sourceText,
    poses: b.poses,
    camera: b.camera
  }));

  // 3. Build Prompt
  const promptText = activeDirectorPrompts.vfx.userTemplate
    .replace('{{STYLE}}', style)
    .replace('{{BIBLE_JSON}}', JSON.stringify(cleanBible))
    .replace('{{BEATS_JSON}}', JSON.stringify(fullContextBeats));

  // 4. Construct Payload
  const contentParts = [
      { text: promptText },
      ...imageParts
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contentParts.length > 1 ? [{ role: 'user', parts: contentParts }] : promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: vfxSchema,
        systemInstruction: activeDirectorPrompts.vfx.system
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response received for VFX.");
    }

    const parsed = JSON.parse(outputText);
    
    const vfxMap: Record<number, VFXData> = {};
    parsed.forEach((item: any) => {
      vfxMap[item.beatId] = {
        lighting: item.vfx.lighting,
        atmosphere: item.vfx.atmosphere,
        specialEffects: item.vfx.specialEffects,
        postProcessing: item.vfx.postProcessing
      };
    });

    return vfxMap;

  } catch (error) {
    console.error("Error generating VFX:", error);
    throw error;
  }
};

// --- Sound Director Schema ---
const soundSchema: Schema = {
  type: Type.ARRAY,
  description: "A list of sound descriptions for each beat.",
  items: {
    type: Type.OBJECT,
    properties: {
      beatId: { type: Type.INTEGER, description: "The ID of the beat." },
      soundDescription: { type: Type.STRING, description: "A detailed description of the soundscape, including ambience and timed SFX cues." }
    },
    required: ["beatId", "soundDescription"]
  }
};

export const generateSoundDescriptions = async (beats: StoryBeat[], bible: StoryBible): Promise<Record<number, string>> => {
  if (!API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // 1. Prepare Context (No images needed for sound really, but let's keep text bible)
  const { cleanBible } = prepareMultimodalContext(bible);

  // 2. Prepare Beats
  const beatsContext = beats.map(b => ({
    id: b.id,
    action: b.narrativeDescription,
    setting: b.visualSetting,
    script: b.script
  }));

  // 3. Build Prompt
  const promptText = activeDirectorPrompts.sound.userTemplate
      .replace('{{BIBLE_JSON}}', JSON.stringify(cleanBible))
      .replace('{{BEATS_JSON}}', JSON.stringify(beatsContext));

  try {
      const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: promptText,
          config: {
              responseMimeType: "application/json",
              responseSchema: soundSchema,
              systemInstruction: activeDirectorPrompts.sound.system
          }
      });

      const outputText = response.text;
      if (!outputText) throw new Error("No response received for Sound descriptions.");

      const parsed = JSON.parse(outputText);
      const soundMap: Record<number, string> = {};
      
      parsed.forEach((item: any) => {
          soundMap[item.beatId] = item.soundDescription;
      });

      return soundMap;
  } catch (error) {
      console.error("Error generating sound descriptions:", error);
      throw error;
  }
};


export const refineBeat = async (beat: StoryBeat, bible: StoryBible | null, instruction: string): Promise<StoryBeat> => {
    if (!API_KEY) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Prepare context
    const cleanBible = bible ? JSON.parse(JSON.stringify(bible)) : {};
    
    const prompt = `
    You are a script doctor and visual director.
    
    TASK: Refine the provided narrative beat based on the USER INSTRUCTION.
    
    CONTEXT - STORY BIBLE:
    ${JSON.stringify(cleanBible)}
    
    CURRENT BEAT JSON:
    ${JSON.stringify(beat)}
    
    USER INSTRUCTION:
    "${instruction}"
    
    OUTPUT:
    Return a JSON object containing ONLY the fields that need to be updated. 
    You can update narrativeDescription, visualDescriptionPlain, script, poses, camera, or vfx.
    Ensure strict JSON validity.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: refineSchema
            }
        });

        const outputText = response.text;
        if (!outputText) throw new Error("No response from refine");

        const updates = JSON.parse(outputText);
        return { ...beat, ...updates };

    } catch (error) {
        console.error("Refine Error:", error);
        throw error;
    }
};

export const generateAsset = async (type: 'textbox' | 'sprite', prompt: string, styleDescription: string, bible?: StoryBible | null): Promise<string> => {
    if (!API_KEY) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const template = type === 'textbox' ? activeAssetPrompts.textbox.template : activeAssetPrompts.sprite.template;
    
    const finalPrompt = template
        .replace('{{PROMPT}}', prompt)
        .replace('{{STYLE}}', styleDescription);

    const parts: any[] = [];

    // Inject Character Reference if generating sprite and bible is available
    if (type === 'sprite' && bible && bible.characters) {
        const promptLower = prompt.toLowerCase();
        bible.characters.forEach(char => {
            if (char.imageRef && promptLower.includes(char.name.toLowerCase())) {
                 const match = char.imageRef.match(/^data:([^;]+);base64,(.+)$/);
                 if (match) {
                     parts.push({ text: `[REFERENCE] Use this image as a strict visual reference for the character: ${char.name}. Match their design exactly.` });
                     parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
            }
        });
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
            imageConfig: { aspectRatio: '16:9' } // Visual Drama / Game standard
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};

export const generateReferenceImage = async (prompt: string, styleDescription: string, referenceImage?: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const parts: any[] = [];
  
  if (referenceImage) {
      const match = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
          parts.push({
              inlineData: {
                  mimeType: match[1],
                  data: match[2]
              }
          });
      }
  }

  // Use the constant template
  const finalPrompt = activeImagePrompts.reference.template
    .replace('{{PROMPT}}', prompt)
    .replace('{{STYLE}}', styleDescription);
  
  parts.push({ text: finalPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: parts },
    config: {
      imageConfig: { aspectRatio: '16:9' }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
};

export const generateSceneImages = async (beat: StoryBeat, bible: StoryBible | null, style: string): Promise<string> => {
    if (!API_KEY) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const parts: any[] = [];

    // Smart Character Reference Injection
    // Scan beat description and poses for character names in the bible that have images
    if (bible && bible.characters) {
        const fullTextToCheck = (beat.narrativeDescription + " " + beat.visualDescriptionPlain + " " + (beat.poses?.map(p => p.name).join(' ') || '')).toLowerCase();
        
        bible.characters.forEach(char => {
            if (char.imageRef && fullTextToCheck.includes(char.name.toLowerCase())) {
                const match = char.imageRef.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                     parts.push({ text: `[REFERENCE] Use this image as a strict visual reference for the character: ${char.name}. Match their design exactly.` });
                     parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
            }
        });
        
        // Settings reference injection
        bible.settings.forEach(setting => {
             if (setting.imageRef && beat.visualSetting.toLowerCase().includes(setting.name.toLowerCase())) {
                const match = setting.imageRef.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                     parts.push({ text: `[REFERENCE] Use this image as a strict visual reference for the location: ${setting.name}. Match the environment design.` });
                     parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
             }
        });
    }

    // Use constant template
    const cameraDetails = beat.camera 
        ? `Lens: ${beat.camera.lens}, Angle: ${beat.camera.angle}, Focus: ${beat.camera.focalPoint}, Comp: ${beat.camera.composition}` 
        : 'Cinematic standard';
    
    const vfxDetails = beat.vfx 
        ? `Light: ${beat.vfx.lighting}, Atmosphere: ${beat.vfx.atmosphere}, FX: ${beat.vfx.specialEffects}` 
        : 'Dramatic lighting';
    
    const posesList = beat.poses 
        ? beat.poses.map(p => `- ${p.name}: ${p.description}`).join('\n') 
        : 'Dynamic action';

    const promptText = activeImagePrompts.scene.template
        .replace('{{STYLE}}', style)
        .replace('{{SETTING}}', beat.visualSetting)
        .replace('{{DESCRIPTION}}', beat.visualDescriptionPlain)
        .replace('{{CAMERA_DETAILS}}', cameraDetails)
        .replace('{{VFX_DETAILS}}', vfxDetails)
        .replace('{{POSES_LIST}}', posesList);

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
          imageConfig: { aspectRatio: '16:9' }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};