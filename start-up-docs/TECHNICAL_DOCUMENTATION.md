# Explainer Videos V2 - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Core Components](#core-components)
6. [API Integrations](#api-integrations)
7. [Workflow & Pipeline](#workflow--pipeline)
8. [Features & Capabilities](#features--capabilities)
9. [Visual Types & Layouts](#visual-types--layouts)
10. [Template System](#template-system)
11. [Quality Control](#quality-control)
12. [Cost Tracking](#cost-tracking)
13. [Usage Examples](#usage-examples)
14. [Troubleshooting](#troubleshooting)
15. [API Reference](#api-reference)

---

## Overview

### Purpose
An AI-powered explainer video generation system that automatically creates professional, narrated videos from simple text prompts or JSON configurations. The system uses multiple AI agents working in concert to research, write, design, review, and produce high-quality explainer videos.

### Key Features
- **Fully Automated**: From topic to finished video with one command
- **Multi-Agent Architecture**: Specialized AI agents for content, design, and quality control
- **Multiple AI Providers**: OpenAI GPT-4o/GPT-5, Google Gemini/Imagen, Pexels, ElevenLabs
- **Professional Quality**: Vision-based quality control, brand consistency, accessibility
- **Cost Efficient**: Typical video costs $0.08-$0.33, comprehensive cost tracking
- **Checkpoint Recovery**: Resume from any phase if interrupted
- **Flexible Theming**: Pre-built themes, custom branding, logo switching
- **Rich Visuals**: Stock photos, AI-generated images, charts, diagrams, code blocks

### Technology Stack
- **Language**: Python 3.10+
- **AI Models**: OpenAI GPT-4o/GPT-5, Google Gemini 3 Pro, GPT-4o-mini Vision
- **Rendering**: Playwright (Chromium), MoviePy
- **Audio**: OpenAI TTS, ElevenLabs
- **APIs**: OpenAI, Google Generative AI, Pexels, ElevenLabs

---

## Architecture

### Four-Phase Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT SPECIFICATION                      │
│  (JSON config with topic, preferences, branding, constraints)   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: CONTENT GENERATION                   │
│                                                                  │
│  ContentAgent (GPT-4o/GPT-5)                                    │
│  • Optional web research                                        │
│  • Load reference materials                                     │
│  • Break topic into slide-by-slide narrative                   │
│  • Determine visual types (pexels/gemini/graph/diagram)        │
│  • Calculate timing (150 WPM speaking rate)                    │
│                                                                  │
│  Output: content_strategy.json                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: SLIDE DESIGN                         │
│                                                                  │
│  DesignAgent (GPT-4o/GPT-5 + APIs)                             │
│  For each slide:                                                │
│    • Generate text HTML (GPT)                                   │
│    • Generate visual:                                           │
│      - Pexels: Search stock photos                             │
│      - Gemini: Generate AI images                              │
│      - Graph: Create Chart.js visualizations                   │
│      - Diagram: CSS/HTML flowcharts                            │
│      - Code: Syntax-highlighted code blocks                    │
│      - Table: Styled HTML tables                               │
│    • Process with brand templates                              │
│    • Render HTML → PNG (Playwright/Chromium)                   │
│                                                                  │
│  Optional: VisionReviewer (GPT-4o-mini Vision)                 │
│    • Analyze slide quality (1-10 score)                        │
│    • Check readability, layout, colors, appropriateness        │
│    • Retry if below threshold (up to 5 attempts)               │
│    • Fallback to Pexels if needed                              │
│                                                                  │
│  Output: slide_00.png, slide_01.png, ..., slide_00.html        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 3: VOICE GENERATION                      │
│                                                                  │
│  VoiceGenerator (OpenAI TTS or ElevenLabs)                     │
│  • Convert narration text to speech                            │
│  • Adjust speed to match 150 WPM target                        │
│  • Sync timing with slides                                     │
│                                                                  │
│  Output: audio.mp3 + duration metadata                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 4: VIDEO ASSEMBLY                        │
│                                                                  │
│  VideoAssembler (MoviePy)                                       │
│  • Load slide PNGs + audio MP3                                 │
│  • Sync slides with audio timing                               │
│  • Add crossfade transitions (optional)                        │
│  • Encode H.264/AAC                                            │
│                                                                  │
│  Output: final_video.mp4                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          FINAL OUTPUT                            │
│  • MP4 video file                                               │
│  • Content strategy JSON                                        │
│  • All slides (PNG + HTML)                                      │
│  • Audio file                                                   │
│  • Generation logs                                              │
│  • API cost summary                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Modularity**: Each phase is independent and resumable
2. **Fail-Safe**: Checkpoints allow recovery from interruptions
3. **Quality First**: Vision-based review ensures professional output
4. **Cost Conscious**: API logging, test mode, manual overrides
5. **Flexible**: Multiple AI providers, themes, visual types
6. **Extensible**: Easy to add new agents, templates, or integrations

---

## Installation & Setup

### Prerequisites
- Python 3.10 or higher (required for Google Gemini/Imagen SDK)
- Node.js (for Playwright)
- FFmpeg (for video encoding)

### Step 1: Clone and Setup Python Environment

```bash
cd /home/pete/Documents/projects/10k-a-month/ideas/explainer_videos_v2

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Install Playwright Browsers

```bash
playwright install chromium
```

### Step 3: Configure API Keys

Create a `.env` file in the root directory:

```bash
# Required
OPENAI_API_KEY=sk-proj-...

# For AI-generated images (choose one)
GEMINI_API_KEY=AIza...                    # Google AI Studio
GEMINI_VERTEX_PAPI_KEY=...                # Or Vertex AI

# For stock photos
PEXELS_API_KEY=...

# For premium TTS (optional)
ELEVENLABS_API_KEY=...
```

### Step 4: Verify Installation

```bash
python src/main.py --help
```

---

## Configuration

### Main Configuration File: `src/config.py`

#### AI Models

```python
# Content generation model
CONTENT_MODEL = "gpt-5"              # or "gpt-4o"

# Slide design model
DESIGN_MODEL = "gpt-5"               # or "gpt-4o"

# Vision review model
VISION_MODEL = "gpt-4o"              # GPT-4o Vision

# Gemini model for image generation
GEMINI_MODEL = "gemini-3-pro-image-preview"
```

#### Video Settings

```python
# Default video length (seconds)
DEFAULT_VIDEO_LENGTH = 60

# Default number of slides
DEFAULT_NUM_SLIDES = 5

# Slide resolution
SLIDE_RESOLUTION = (1920, 1080)      # Full HD

# Video framerate
DEFAULT_FPS = 30
```

#### Performance Settings

```python
# Speaking rate calculation
WORDS_PER_MINUTE = 150

# TTS speed adjustment (OpenAI)
TTS_SPEED = 0.83                     # Calibrated for 150 WPM

# Playwright timeout (milliseconds)
PLAYWRIGHT_TIMEOUT = 30000

# Rendering wait time (milliseconds)
RENDER_WAIT_TIME = 2000              # For animations/Chart.js
```

#### Quality Control

```python
# Vision review threshold (1-10)
VISION_REVIEW_THRESHOLD = 7.0

# Maximum retry attempts per slide
MAX_VISION_RETRIES = 5

# Enable vision review by default
ENABLE_VISION_REVIEW = True
```

#### API Retry Settings

```python
# Gemini API retry configuration
GEMINI_MAX_RETRIES = 3
GEMINI_RETRY_DELAY = 2.0             # Base delay in seconds
GEMINI_RETRY_BACKOFF = 2.0           # Exponential backoff multiplier
```

---

## Core Components

### 1. ContentAgent (`src/agents/content_agent.py`)

**Purpose**: Generate the content strategy for the entire video.

**Responsibilities**:
- Break down topic into logical slide sequence
- Determine narration text for each slide
- Select appropriate visual type for each slide
- Calculate slide timing based on narration length
- Optionally perform web research for accuracy
- Integrate reference materials

**Key Methods**:
```python
def generate_content_strategy(
    video_request: VideoRequest,
    output_dir: Path,
    web_research: bool = False
) -> ContentStrategy:
    """
    Generate complete content strategy for video.

    Args:
        video_request: Input specification
        output_dir: Where to save content_strategy.json
        web_research: Enable GPT-4o web research

    Returns:
        ContentStrategy object with slides, narration, visuals
    """
```

**Structured Output Schema**:
```python
class Slide(BaseModel):
    slide_number: int
    title: str
    narration: str
    visual_type: Literal["pexels", "gemini", "graph", "diagram", "code", "table", "none"]
    visual_description: str
    layout: str                          # "text-left-image-right", etc.
    duration_seconds: float

class ContentStrategy(BaseModel):
    topic: str
    slides: List[Slide]
    total_duration: float
    research_summary: Optional[str]
```

**AI Prompt Strategy**:
- Uses GPT-4o/GPT-5 with structured outputs (Pydantic models)
- Provides detailed guidelines for visual selection
- Emphasizes accessibility, clarity, engagement
- Includes timing calculations based on 150 WPM

**Web Research**:
When enabled, uses OpenAI's web search capability to:
- Gather current facts and statistics
- Verify accuracy of information
- Include up-to-date examples
- Cite sources in narration

**Reference Material Integration**:
Reads text files from `manual_configs/reference_material/` and includes them in the prompt context for more accurate, domain-specific content.

---

### 2. DesignAgent (`src/agents/design_agent.py`)

**Purpose**: Generate and render HTML slides from content strategy.

**Responsibilities**:
- Convert narration + visual description into HTML
- Integrate with image APIs (Pexels, Gemini)
- Generate graphs, diagrams, code blocks, tables
- Apply brand templates and theming
- Render HTML to PNG using Playwright

**Key Methods**:
```python
async def generate_slide(
    slide: Slide,
    output_dir: Path,
    template_processor: TemplateProcessor,
    visual_type_override: Optional[str] = None
) -> Path:
    """
    Generate single slide from content strategy.

    Args:
        slide: Slide from content strategy
        output_dir: Where to save PNG and HTML
        template_processor: Brand template handler
        visual_type_override: Force specific visual type

    Returns:
        Path to final PNG file
    """
```

**HTML Generation Process**:

1. **Text HTML Generation** (GPT-4o/GPT-5):
   ```python
   # Prompt includes:
   # - Slide title and narration
   # - Layout specification
   # - Brand colors from template
   # - Accessibility guidelines
   # - HTML structure requirements

   text_html = await generate_text_html(slide, template_params)
   ```

2. **Visual HTML Generation**:
   - **Pexels**: Search stock photos, embed in HTML
   - **Gemini**: Generate AI image, embed base64 in HTML
   - **Graph**: Create Chart.js visualization
   - **Diagram**: Generate CSS/HTML flowchart
   - **Code**: Create syntax-highlighted code block
   - **Table**: Build styled HTML table

3. **Template Processing**:
   ```python
   # Replace placeholders with brand values
   final_html = template_processor.process(text_html, visual_html)
   ```

4. **Rendering** (Playwright):
   ```python
   async with async_playwright() as p:
       browser = await p.chromium.launch()
       page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
       await page.set_content(final_html)
       await page.wait_for_timeout(2000)  # Charts/animations
       await page.screenshot(path=output_png)
   ```

**Visual Type Implementations**:

#### Pexels Integration
```python
def search_pexels(query: str, per_page: int = 1) -> str:
    """
    Search Pexels for stock photos.

    Returns:
        URL to large resolution image
    """
    response = requests.get(
        "https://api.pexels.com/v1/search",
        headers={"Authorization": PEXELS_API_KEY},
        params={"query": query, "per_page": per_page}
    )
    return response.json()["photos"][0]["src"]["large"]
```

#### Gemini/Imagen Integration
```python
async def generate_gemini_image(prompt: str) -> str:
    """
    Generate AI image using Gemini Imagen.

    Returns:
        Base64-encoded PNG string
    """
    # Uses google-genai SDK
    client = genai.Client(api_key=GEMINI_API_KEY)

    # Enhanced prompt with quality guidelines
    enhanced_prompt = f"""
    {prompt}

    Style guidelines:
    - High contrast and crisp lines
    - Professional finish
    - Clean composition
    - Use {PRIMARY_COLOR} and {SECONDARY_COLOR} as accent colors
    - Photorealistic or clean vector style as appropriate
    """

    response = client.models.generate_images(
        model=GEMINI_MODEL,
        prompt=enhanced_prompt,
        number_of_images=1,
        config=GenerateImagesConfig(
            output_image_ratio=ImageAspectRatio.ASPECT_16_9
        )
    )

    # Return base64 PNG
    return base64.b64encode(response.images[0].image_bytes).decode('utf-8')
```

#### Chart Generation
```python
def generate_chart_html(slide: Slide) -> str:
    """
    Generate Chart.js visualization.

    Uses GPT to:
    1. Parse data from visual_description
    2. Select chart type (bar, line, pie, doughnut, radar)
    3. Generate Chart.js config with brand colors
    """
    # GPT returns structured JSON with:
    # - chart_type
    # - data (labels, datasets)
    # - options (title, legend, colors)

    return f"""
    <canvas id="chart"></canvas>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        new Chart(document.getElementById('chart'), {{
            type: '{chart_type}',
            data: {json.dumps(data)},
            options: {json.dumps(options)}
        }});
    </script>
    """
```

---

### 3. VisionReviewer (`src/agents/vision_reviewer.py`)

**Purpose**: Quality control for generated slides using GPT-4o-mini Vision.

**Responsibilities**:
- Analyze slide screenshots for quality issues
- Check text readability, layout, colors, appropriateness
- Provide scored feedback (1-10)
- Trigger regeneration if below threshold
- Suggest fallback strategies

**Key Methods**:
```python
async def review_slide(
    slide_image_path: Path,
    slide: Slide,
    attempt_number: int = 1
) -> VisionReviewResult:
    """
    Analyze slide quality using GPT-4o-mini Vision.

    Args:
        slide_image_path: Path to rendered PNG
        slide: Original slide specification
        attempt_number: Current retry attempt

    Returns:
        VisionReviewResult with score, feedback, approval
    """
```

**Review Criteria**:
```python
class VisionReviewResult(BaseModel):
    approved: bool
    score: float                        # 1-10
    feedback: str

    # Detailed scoring
    text_readable: bool
    layout_appropriate: bool
    visual_appropriate: bool
    colors_good: bool
    chart_clear: bool                   # If applicable

    suggestions: List[str]
    fallback_recommended: bool          # Suggest Pexels fallback
```

**Review Prompt Structure**:
```
Analyze this slide for an explainer video:

Slide Context:
- Title: {slide.title}
- Narration: {slide.narration}
- Visual Type: {slide.visual_type}
- Layout: {slide.layout}

Review Criteria:
1. Text Readability (contrast, size, font)
2. Layout Quality (balance, spacing, hierarchy)
3. Visual Appropriateness (matches content, professional)
4. Color Harmony (consistent with brand)
5. Chart Clarity (if applicable: labels, legend, data)

Scoring:
- 9-10: Excellent, publish-ready
- 7-8: Good, minor improvements
- 5-6: Acceptable, some issues
- 3-4: Poor, needs regeneration
- 1-2: Unacceptable, use fallback

Provide JSON response with score, detailed feedback, and approval.
```

**Retry Logic**:
```python
for attempt in range(1, MAX_VISION_RETRIES + 1):
    review = await review_slide(slide_png, slide, attempt)

    if review.approved or review.score >= VISION_REVIEW_THRESHOLD:
        return slide_png  # Success

    if review.fallback_recommended and attempt >= 3:
        # Switch to Pexels for more reliable visuals
        slide.visual_type = "pexels"

    # Regenerate with feedback
    slide_png = await regenerate_slide(slide, review.feedback)

# After max retries, use best attempt
return select_best_slide(all_attempts)
```

---

### 4. VoiceGenerator (`src/voice_generator.py`)

**Purpose**: Convert narration text to speech audio.

**Responsibilities**:
- Generate MP3 audio from narration
- Adjust speed to match 150 WPM target
- Support multiple TTS providers
- Calculate accurate audio duration
- Handle long narrations (chunking if needed)

**Key Methods**:
```python
def generate_voice(
    narration_text: str,
    output_path: Path,
    provider: Literal["openai", "elevenlabs"] = "openai",
    voice: str = "onyx",
    speed: float = TTS_SPEED
) -> AudioMetadata:
    """
    Generate speech audio from text.

    Args:
        narration_text: Full video narration
        output_path: Where to save MP3
        provider: TTS provider to use
        voice: Voice name (provider-specific)
        speed: Playback speed multiplier

    Returns:
        AudioMetadata with duration, cost, provider
    """
```

**OpenAI TTS**:
```python
# Model: tts-1-hd (high definition)
# Voices: alloy, echo, fable, onyx, nova, shimmer
# Cost: $15 per 1M characters

response = openai.audio.speech.create(
    model="tts-1-hd",
    voice=voice,
    input=narration_text,
    speed=speed  # 0.25-4.0, default 1.0
)

# Save to MP3
response.stream_to_file(output_path)

# Calculate duration
audio = AudioSegment.from_mp3(output_path)
duration = len(audio) / 1000.0  # milliseconds to seconds
```

**ElevenLabs TTS**:
```python
# Voices: Rachel (British), Elizabeth (American)
# Cost: $0.30 per 1K characters

response = requests.post(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
    headers={"xi-api-key": ELEVENLABS_API_KEY},
    json={
        "text": narration_text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "speed": speed
        }
    }
)

# Save MP3
with open(output_path, 'wb') as f:
    f.write(response.content)
```

**Speed Calibration**:
The TTS speed is calibrated to match 150 WPM speaking rate:
```python
# Calculate expected duration
word_count = len(narration_text.split())
target_duration = (word_count / WORDS_PER_MINUTE) * 60  # seconds

# OpenAI TTS tends to speak at ~180 WPM at speed=1.0
# To achieve 150 WPM: speed = 150/180 = 0.83
TTS_SPEED = 0.83
```

---

### 5. VideoAssembler (`src/video_assembler.py`)

**Purpose**: Combine slides and audio into final video.

**Responsibilities**:
- Load slide PNGs and audio MP3
- Sync slides with audio timing
- Add transitions (optional)
- Encode final video (H.264/AAC)
- Handle silent videos (no audio)

**Key Methods**:
```python
def assemble_video(
    slides: List[Path],
    audio_path: Optional[Path],
    output_path: Path,
    content_strategy: ContentStrategy,
    fps: int = DEFAULT_FPS,
    enable_transitions: bool = True,
    transition_duration: float = 0.5
) -> VideoMetadata:
    """
    Assemble final video from slides and audio.

    Args:
        slides: List of PNG paths (in order)
        audio_path: Path to MP3 (None for silent)
        output_path: Where to save MP4
        content_strategy: Timing information
        fps: Video framerate
        enable_transitions: Add crossfade transitions
        transition_duration: Crossfade duration (seconds)

    Returns:
        VideoMetadata with duration, resolution, size
    """
```

**Assembly Process**:

1. **Load Audio (if present)**:
   ```python
   from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

   audio = AudioFileClip(str(audio_path)) if audio_path else None
   total_duration = audio.duration if audio else sum(slide.duration_seconds for slide in content_strategy.slides)
   ```

2. **Create Slide Clips**:
   ```python
   clips = []
   for slide, slide_path in zip(content_strategy.slides, slides):
       clip = ImageClip(str(slide_path))
       clip = clip.set_duration(slide.duration_seconds)
       clip = clip.set_fps(fps)
       clips.append(clip)
   ```

3. **Add Transitions** (if enabled):
   ```python
   if enable_transitions and len(clips) > 1:
       video = concatenate_videoclips(
           clips,
           method="compose",
           transition=crossfadein,
           transition_duration=transition_duration
       )
   else:
       video = concatenate_videoclips(clips, method="compose")
   ```

4. **Add Audio**:
   ```python
   if audio:
       video = video.set_audio(audio)
   ```

5. **Encode and Export**:
   ```python
   video.write_videofile(
       str(output_path),
       fps=fps,
       codec="libx264",           # H.264 video
       audio_codec="aac",         # AAC audio
       temp_audiofile="temp-audio.m4a",
       remove_temp=True,
       preset="medium",           # Encoding speed vs quality
       bitrate="5000k"           # 5 Mbps for HD
   )
   ```

**Timing Synchronization**:
Slides are timed based on narration length:
```python
# From ContentAgent
def calculate_duration(narration: str) -> float:
    word_count = len(narration.split())
    return (word_count / WORDS_PER_MINUTE) * 60

# Slides automatically sync with audio:
# - Slide 1: 0s - 12s (12s duration)
# - Slide 2: 12s - 25s (13s duration)
# - Slide 3: 25s - 40s (15s duration)
# - etc.
```

---

### 6. CheckpointManager (`src/checkpoints.py`)

**Purpose**: Enable resumable video generation.

**Responsibilities**:
- Save progress after each phase
- Load saved state on resume
- Log all operations with timestamps
- Handle phase skipping

**Checkpoint Structure**:
```python
class Checkpoint(BaseModel):
    project_name: str
    timestamp: str
    current_phase: Literal["content", "design", "voice", "assembly", "complete"]
    completed_phases: List[str]

    # Phase-specific data
    content_strategy_path: Optional[Path]
    slides_generated: List[int]          # Slide numbers completed
    audio_path: Optional[Path]
    video_path: Optional[Path]

    # Metadata
    video_request: VideoRequest
    output_dir: Path
    api_calls: List[APICall]
    total_cost: float
```

**Key Methods**:
```python
def save_checkpoint(checkpoint: Checkpoint, output_dir: Path):
    """Save checkpoint to JSON file."""
    checkpoint_path = output_dir / "checkpoint.json"
    with open(checkpoint_path, 'w') as f:
        json.dump(checkpoint.dict(), f, indent=2)

    # Also append to log
    log_message(f"Checkpoint saved: {checkpoint.current_phase}")

def load_checkpoint(output_dir: Path) -> Optional[Checkpoint]:
    """Load checkpoint from JSON file."""
    checkpoint_path = output_dir / "checkpoint.json"
    if checkpoint_path.exists():
        with open(checkpoint_path, 'r') as f:
            return Checkpoint(**json.load(f))
    return None

def resume_from_checkpoint(checkpoint: Checkpoint) -> Path:
    """Resume video generation from saved checkpoint."""
    log_message(f"Resuming from phase: {checkpoint.current_phase}")

    if checkpoint.current_phase == "content":
        # Re-run content generation
        return run_content_phase(checkpoint.video_request, checkpoint.output_dir)
    elif checkpoint.current_phase == "design":
        # Resume slide generation
        return run_design_phase(checkpoint, skip_completed=True)
    # etc.
```

**Usage in Main Pipeline**:
```python
# At start of each phase
checkpoint = Checkpoint(
    current_phase="design",
    completed_phases=["content"],
    content_strategy_path=content_path,
    # ...
)
save_checkpoint(checkpoint, output_dir)

# On error or interruption
try:
    result = run_phase()
except Exception as e:
    log_error(f"Phase failed: {e}")
    # Checkpoint already saved, can resume later
    raise

# To resume
checkpoint = load_checkpoint(output_dir)
if checkpoint:
    resume_from_checkpoint(checkpoint)
```

---

### 7. APILogger (`src/api_logger.py`)

**Purpose**: Track API usage and costs in real-time.

**Responsibilities**:
- Log all API calls with timestamps
- Calculate costs based on usage
- Generate per-session summaries
- Support multiple API providers

**API Call Structure**:
```python
class APICall(BaseModel):
    timestamp: str
    provider: Literal["openai", "gemini", "pexels", "elevenlabs"]
    endpoint: str                        # "chat.completions", "generate_image", etc.
    model: Optional[str]                 # "gpt-4o", "gemini-3-pro", etc.

    # Token/character counts
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    input_chars: Optional[int]

    # Cost calculation
    cost_usd: float

    # Request metadata
    purpose: str                         # "content_generation", "slide_text", etc.
    success: bool
    error: Optional[str]
```

**Cost Calculation**:
```python
# OpenAI Pricing (as of Jan 2025)
OPENAI_PRICING = {
    "gpt-4o": {
        "input": 2.50 / 1_000_000,      # $2.50 per 1M tokens
        "output": 10.00 / 1_000_000     # $10.00 per 1M tokens
    },
    "gpt-4o-mini": {
        "input": 0.15 / 1_000_000,
        "output": 0.60 / 1_000_000
    },
    "gpt-5": {
        "input": 5.00 / 1_000_000,
        "output": 15.00 / 1_000_000
    },
    "tts-1-hd": {
        "per_char": 0.030 / 1_000        # $30 per 1M characters
    }
}

# Gemini Pricing
GEMINI_PRICING = {
    "gemini-3-pro-image": {
        "per_image": 0.04                # $0.04 per image
    }
}

# ElevenLabs Pricing
ELEVENLABS_PRICING = {
    "per_char": 0.30 / 1_000             # $0.30 per 1K characters
}

# Pexels: Free (no cost tracking)

def calculate_cost(call: APICall) -> float:
    if call.provider == "openai":
        if "tts" in call.model:
            return call.input_chars * OPENAI_PRICING["tts-1-hd"]["per_char"]
        else:
            input_cost = call.input_tokens * OPENAI_PRICING[call.model]["input"]
            output_cost = call.output_tokens * OPENAI_PRICING[call.model]["output"]
            return input_cost + output_cost
    elif call.provider == "gemini":
        return GEMINI_PRICING["gemini-3-pro-image"]["per_image"]
    elif call.provider == "elevenlabs":
        return call.input_chars * ELEVENLABS_PRICING["per_char"]
    else:
        return 0.0
```

**Logging Methods**:
```python
def log_api_call(call: APICall, output_dir: Path):
    """Append API call to JSONL log."""
    log_path = output_dir / f"api_calls_{timestamp}.jsonl"
    with open(log_path, 'a') as f:
        f.write(call.json() + '\n')

def generate_summary(output_dir: Path) -> APISummary:
    """Generate cost summary from logs."""
    log_path = output_dir / f"api_calls_{timestamp}.jsonl"
    calls = []

    with open(log_path, 'r') as f:
        for line in f:
            calls.append(APICall(**json.loads(line)))

    # Aggregate by provider
    summary = {
        "total_cost": sum(call.cost_usd for call in calls),
        "by_provider": {},
        "by_purpose": {},
        "call_count": len(calls),
        "failed_calls": sum(1 for call in calls if not call.success)
    }

    for call in calls:
        # By provider
        if call.provider not in summary["by_provider"]:
            summary["by_provider"][call.provider] = {"cost": 0, "calls": 0}
        summary["by_provider"][call.provider]["cost"] += call.cost_usd
        summary["by_provider"][call.provider]["calls"] += 1

        # By purpose
        if call.purpose not in summary["by_purpose"]:
            summary["by_purpose"][call.purpose] = {"cost": 0, "calls": 0}
        summary["by_purpose"][call.purpose]["cost"] += call.cost_usd
        summary["by_purpose"][call.purpose]["calls"] += 1

    return summary

def print_summary(summary: APISummary):
    """Print formatted cost summary to console."""
    print("\n" + "="*60)
    print("API USAGE SUMMARY")
    print("="*60)
    print(f"\nTotal Cost: ${summary['total_cost']:.4f}")
    print(f"Total Calls: {summary['call_count']}")
    print(f"Failed Calls: {summary['failed_calls']}")

    print("\n--- By Provider ---")
    for provider, data in summary["by_provider"].items():
        print(f"  {provider}: ${data['cost']:.4f} ({data['calls']} calls)")

    print("\n--- By Purpose ---")
    for purpose, data in sorted(summary["by_purpose"].items(), key=lambda x: x[1]['cost'], reverse=True):
        print(f"  {purpose}: ${data['cost']:.4f} ({data['calls']} calls)")

    print("="*60 + "\n")
```

**Usage in Agents**:
```python
# In ContentAgent
api_call = APICall(
    timestamp=datetime.now().isoformat(),
    provider="openai",
    endpoint="chat.completions",
    model=CONTENT_MODEL,
    input_tokens=response.usage.prompt_tokens,
    output_tokens=response.usage.completion_tokens,
    cost_usd=calculate_cost(...),
    purpose="content_generation",
    success=True
)
log_api_call(api_call, output_dir)

# In DesignAgent
api_call = APICall(
    timestamp=datetime.now().isoformat(),
    provider="gemini",
    endpoint="generate_image",
    model=GEMINI_MODEL,
    cost_usd=0.04,
    purpose=f"slide_{slide_number}_visual",
    success=True
)
log_api_call(api_call, output_dir)
```

---

## API Integrations

### OpenAI API

**Models Used**:
- `gpt-4o` / `gpt-5`: Content generation, slide design
- `gpt-4o-mini`: Vision review (cheaper for image analysis)
- `tts-1-hd`: Text-to-speech

**Key Features**:
- Structured outputs with Pydantic models
- Web research capability (GPT-4o)
- Vision analysis (GPT-4o-mini)
- High-quality TTS with speed control

**Configuration**:
```python
import openai
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Structured output (beta feature)
response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
    response_format=ContentStrategy  # Pydantic model
)

content_strategy = response.choices[0].message.parsed
```

**Error Handling**:
```python
try:
    response = client.chat.completions.create(...)
except openai.RateLimitError:
    # Wait and retry
    time.sleep(60)
    response = client.chat.completions.create(...)
except openai.APIError as e:
    log_error(f"OpenAI API error: {e}")
    raise
```

---

### Google Gemini/Imagen API

**Models Used**:
- `gemini-3-pro-image-preview`: Text-to-image generation (Imagen 2.0)
- Alternative: `gemini-3-flash-image-preview` (faster, lower quality)

**Key Features**:
- Photorealistic AI image generation
- 16:9 aspect ratio support
- Fast generation (~2-5 seconds)
- Exponential backoff retry logic

**Configuration**:
```python
import google.genai as genai
from google.genai import types

# Initialize client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Or use Vertex AI
client = genai.Client(
    vertexai=True,
    project="your-project-id",
    location="us-central1"
)
```

**Image Generation**:
```python
def generate_image(prompt: str, aspect_ratio: str = "16:9") -> bytes:
    """
    Generate image using Gemini Imagen.

    Args:
        prompt: Detailed image description
        aspect_ratio: "16:9", "1:1", "4:3", etc.

    Returns:
        PNG image bytes
    """
    response = client.models.generate_images(
        model="gemini-3-pro-image-preview",
        prompt=prompt,
        number_of_images=1,
        config=types.GenerateImagesConfig(
            output_image_ratio=getattr(types.ImageAspectRatio, f"ASPECT_{aspect_ratio.replace(':', '_')}")
        )
    )

    return response.images[0].image_bytes
```

**Retry Logic for Rate Limits**:
```python
async def generate_with_retry(prompt: str, max_retries: int = 3) -> bytes:
    """Generate image with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return generate_image(prompt)
        except Exception as e:
            if "rate limit" in str(e).lower() and attempt < max_retries - 1:
                wait_time = GEMINI_RETRY_DELAY * (GEMINI_RETRY_BACKOFF ** attempt)
                log_message(f"Rate limited, waiting {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                raise
```

**Prompt Enhancement**:
The system enhances user prompts with quality guidelines:
```python
def enhance_prompt(user_prompt: str, template_params: dict) -> str:
    """Add quality guidelines and brand colors to prompt."""
    return f"""
    {user_prompt}

    Style Guidelines:
    - Photorealistic rendering with professional finish
    - High contrast and crisp, clean lines
    - Modern, minimalist composition
    - Proper lighting and depth
    - Use {template_params['primary_color']} and {template_params['secondary_color']} as accent colors where appropriate
    - 16:9 aspect ratio, suitable for presentation slides
    - No text or labels in the image
    """
```

---

### Pexels API

**Purpose**: Stock photography search and retrieval.

**Key Features**:
- Large library of free stock photos
- High-resolution images (1920x1080+)
- Keyword-based search
- Fast and reliable fallback option

**Configuration**:
```python
import requests

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
PEXELS_BASE_URL = "https://api.pexels.com/v1"
```

**Search Implementation**:
```python
def search_pexels(query: str, per_page: int = 1, orientation: str = "landscape") -> Optional[str]:
    """
    Search Pexels for stock photos.

    Args:
        query: Search keywords
        per_page: Number of results
        orientation: "landscape", "portrait", "square"

    Returns:
        URL to large resolution image, or None if no results
    """
    response = requests.get(
        f"{PEXELS_BASE_URL}/search",
        headers={"Authorization": PEXELS_API_KEY},
        params={
            "query": query,
            "per_page": per_page,
            "orientation": orientation
        }
    )

    if response.status_code == 200:
        data = response.json()
        if data["total_results"] > 0:
            # Return large resolution image
            return data["photos"][0]["src"]["large2x"]  # or "large"

    return None

def download_image(url: str, output_path: Path):
    """Download image from URL."""
    response = requests.get(url, stream=True)
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
```

**Keyword Optimization**:
The ContentAgent generates optimized Pexels keywords:
```python
# In content strategy generation
visual_description = "A modern office with diverse team collaborating"

# GPT extracts key search terms
pexels_keywords = extract_keywords(visual_description)
# Result: "diverse team office collaboration modern"
```

---

### ElevenLabs API

**Purpose**: Premium text-to-speech (optional alternative to OpenAI TTS).

**Key Features**:
- Higher voice quality and naturalness
- Emotional range and expressiveness
- Multiple accent options

**Voices**:
- Rachel (British accent)
- Elizabeth (American accent)

**Configuration**:
```python
import requests

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

VOICE_IDS = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",
    "elizabeth": "EXAVITQu4vr4xnSDxMaL"
}
```

**TTS Implementation**:
```python
def generate_speech(
    text: str,
    voice: str = "rachel",
    output_path: Path
) -> float:
    """
    Generate speech using ElevenLabs.

    Args:
        text: Text to convert to speech
        voice: Voice name (rachel, elizabeth)
        output_path: Where to save MP3

    Returns:
        Audio duration in seconds
    """
    voice_id = VOICE_IDS[voice]

    response = requests.post(
        f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}",
        headers={"xi-api-key": ELEVENLABS_API_KEY},
        json={
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
    )

    # Save MP3
    with open(output_path, 'wb') as f:
        f.write(response.content)

    # Calculate duration
    audio = AudioSegment.from_mp3(output_path)
    return len(audio) / 1000.0
```

---

## Workflow & Pipeline

### Complete Video Generation Flow

**Command**:
```bash
python src/main.py \
    --config examples/example_linear_regression.json \
    --output outputs/
```

**Step-by-Step Execution**:

#### 1. Initialization
```
[2025-12-16 10:00:00] Starting video generation for: Linear Regression Explained
[2025-12-16 10:00:00] Output directory: outputs/linear_regression_explained/20251216_100000
[2025-12-16 10:00:00] Loading configuration from examples/example_linear_regression.json
```

#### 2. Content Generation (Phase 1)
```
[2025-12-16 10:00:01] Phase 1: Content Generation
[2025-12-16 10:00:01] Using model: gpt-4o
[2025-12-16 10:00:01] Web research: Disabled
[2025-12-16 10:00:01] Generating content strategy...

API Call: OpenAI Chat Completion
- Model: gpt-4o
- Tokens: 850 input / 1200 output
- Cost: $0.0141

[2025-12-16 10:00:15] Content strategy generated: 5 slides, 58 seconds total
[2025-12-16 10:00:15] Saving content_strategy.json
[2025-12-16 10:00:15] Checkpoint saved: Phase 1 complete
```

**Content Strategy Output**:
```json
{
  "topic": "Linear Regression Explained",
  "slides": [
    {
      "slide_number": 0,
      "title": "What is Linear Regression?",
      "narration": "Linear regression is a fundamental machine learning algorithm...",
      "visual_type": "pexels",
      "visual_description": "Scatter plot with trend line",
      "layout": "text-left-image-right",
      "duration_seconds": 12.0
    },
    {
      "slide_number": 1,
      "title": "The Linear Equation",
      "narration": "At its core, linear regression finds a line of best fit...",
      "visual_type": "diagram",
      "visual_description": "y = mx + b equation visualization",
      "layout": "center",
      "duration_seconds": 10.5
    },
    // ... 3 more slides
  ],
  "total_duration": 58.0
}
```

#### 3. Slide Design (Phase 2)
```
[2025-12-16 10:00:16] Phase 2: Slide Design
[2025-12-16 10:00:16] Generating 5 slides...
[2025-12-16 10:00:16] Vision review: Enabled (threshold: 7.0)

--- Slide 0 ---
[2025-12-16 10:00:17] Generating text HTML (GPT-4o)...

API Call: OpenAI Chat Completion
- Model: gpt-4o
- Purpose: Slide 0 text HTML
- Tokens: 400 input / 800 output
- Cost: $0.0090

[2025-12-16 10:00:22] Generating visual (Pexels)...
[2025-12-16 10:00:23] Found Pexels image: scatter plot data visualization
[2025-12-16 10:00:23] Processing with template: template_params.json
[2025-12-16 10:00:23] Rendering HTML to PNG (Playwright)...
[2025-12-16 10:00:26] Saved: slide_00_v1.png

[2025-12-16 10:00:26] Running vision review...

API Call: OpenAI Vision
- Model: gpt-4o-mini
- Purpose: Slide 0 quality review
- Cost: $0.0015

[2025-12-16 10:00:29] Vision review result:
  - Score: 8.5/10
  - Text readable: ✓
  - Layout appropriate: ✓
  - Visual appropriate: ✓
  - Colors good: ✓
  - Status: APPROVED

[2025-12-16 10:00:29] Slide 0 complete (1 attempt)

--- Slide 1 ---
[2025-12-16 10:00:30] Generating text HTML (GPT-4o)...
[2025-12-16 10:00:34] Generating visual (Diagram)...

API Call: OpenAI Chat Completion
- Model: gpt-4o
- Purpose: Slide 1 diagram HTML
- Tokens: 350 input / 600 output
- Cost: $0.0069

[2025-12-16 10:00:38] Rendering HTML to PNG...
[2025-12-16 10:00:41] Saved: slide_01_v1.png
[2025-12-16 10:00:41] Running vision review...
[2025-12-16 10:00:44] Vision review result:
  - Score: 6.0/10
  - Text readable: ✓
  - Layout appropriate: ✗ (diagram too small)
  - Visual appropriate: ✓
  - Colors good: ✓
  - Status: REJECTED
  - Feedback: "Diagram is too small and hard to read. Make equation larger."

[2025-12-16 10:00:44] Regenerating slide 1 with feedback...
[2025-12-16 10:00:48] Saved: slide_01_v2.png
[2025-12-16 10:00:51] Vision review result:
  - Score: 8.0/10
  - Status: APPROVED

[2025-12-16 10:00:51] Slide 1 complete (2 attempts)

// ... Slides 2-4 generation ...

[2025-12-16 10:03:15] All slides generated successfully
[2025-12-16 10:03:15] Checkpoint saved: Phase 2 complete
```

#### 4. Voice Generation (Phase 3)
```
[2025-12-16 10:03:16] Phase 3: Voice Generation
[2025-12-16 10:03:16] Provider: OpenAI TTS
[2025-12-16 10:03:16] Voice: onyx
[2025-12-16 10:03:16] Speed: 0.83 (for 150 WPM)

[2025-12-16 10:03:16] Generating speech for 580 characters...

API Call: OpenAI TTS
- Model: tts-1-hd
- Characters: 580
- Cost: $0.0174

[2025-12-16 10:03:22] Audio generated: 58.3 seconds
[2025-12-16 10:03:22] Saved: linear_regression_explained.mp3
[2025-12-16 10:03:22] Checkpoint saved: Phase 3 complete
```

#### 5. Video Assembly (Phase 4)
```
[2025-12-16 10:03:23] Phase 4: Video Assembly
[2025-12-16 10:03:23] Loading 5 slides...
[2025-12-16 10:03:23] Loading audio (58.3s)...
[2025-12-16 10:03:23] Transitions: Enabled (0.5s crossfade)
[2025-12-16 10:03:23] FPS: 30
[2025-12-16 10:03:23] Resolution: 1920x1080

[2025-12-16 10:03:23] Creating video clips...
[2025-12-16 10:03:24] Adding transitions...
[2025-12-16 10:03:25] Syncing with audio...
[2025-12-16 10:03:25] Encoding video (H.264/AAC)...

Moviepy - Building video outputs/linear_regression_explained/20251216_100000/videos/linear_regression_explained.mp4
Moviepy - Writing audio in temp-audio.m4a
Moviepy - Done.
Moviepy - Writing video linear_regression_explained.mp4
Moviepy - Done !
Moviepy - video ready: linear_regression_explained.mp4

[2025-12-16 10:03:48] Video assembly complete
[2025-12-16 10:03:48] Output: outputs/linear_regression_explained/20251216_100000/videos/linear_regression_explained.mp4
[2025-12-16 10:03:48] Duration: 58.3 seconds
[2025-12-16 10:03:48] Size: 12.4 MB
[2025-12-16 10:03:48] Checkpoint saved: Phase 4 complete
```

#### 6. Summary & Cleanup
```
[2025-12-16 10:03:49] Generation complete!
[2025-12-16 10:03:49] Total time: 3 minutes 49 seconds

============================================================
API USAGE SUMMARY
============================================================

Total Cost: $0.0819
Total Calls: 18
Failed Calls: 0

--- By Provider ---
  openai: $0.0779 (17 calls)
  pexels: $0.0000 (1 call)

--- By Purpose ---
  slide_text_html: $0.0450 (5 calls, $0.0090 avg)
  slide_visual_html: $0.0180 (3 calls, $0.0060 avg)
  vision_review: $0.0075 (5 calls, $0.0015 avg)
  content_generation: $0.0141 (1 call)
  voice_generation: $0.0174 (1 call)

============================================================

Files generated:
✓ videos/linear_regression_explained.mp4
✓ audio/linear_regression_explained.mp3
✓ slides/slide_00_final.png (and 4 more)
✓ content_strategy.json
✓ metadata.json
✓ generation.log
✓ api_calls_20251216_100000.jsonl
✓ api_summary_20251216_100000.json
```

---

### Resume from Checkpoint

**Scenario**: Generation interrupted during Phase 2 (slide 3 of 5).

**Command**:
```bash
python src/main.py --resume outputs/linear_regression_explained/20251216_100000
```

**Execution**:
```
[2025-12-16 10:15:00] Loading checkpoint from outputs/linear_regression_explained/20251216_100000
[2025-12-16 10:15:00] Checkpoint found: Phase 2 (design)
[2025-12-16 10:15:00] Completed slides: 0, 1, 2
[2025-12-16 10:15:00] Remaining slides: 3, 4

[2025-12-16 10:15:01] Resuming Phase 2: Slide Design
[2025-12-16 10:15:01] Skipping slides: 0, 1, 2 (already complete)

--- Slide 3 ---
[2025-12-16 10:15:02] Generating text HTML (GPT-4o)...
// ... continues from where it left off ...
```

---

### Test Mode

**Purpose**: Rapidly test configuration without generating full video.

**Command**:
```bash
python src/main.py \
    --config examples/example_linear_regression.json \
    --test-mode
```

**Behavior**:
- Generates only first 2 slides
- Skips voice generation
- Skips video assembly
- Still runs vision review (if enabled)
- Full API cost tracking

**Output**:
```
[2025-12-16 10:20:00] TEST MODE: Generating only 2 slides
[2025-12-16 10:20:01] Phase 1: Content Generation
[2025-12-16 10:20:10] Content strategy: 5 slides planned (will generate 2)
[2025-12-16 10:20:11] Phase 2: Slide Design
[2025-12-16 10:20:12] Generating slide 0...
[2025-12-16 10:20:25] Generating slide 1...
[2025-12-16 10:20:38] TEST MODE: Skipping remaining slides
[2025-12-16 10:20:38] Phase 3: SKIPPED (test mode)
[2025-12-16 10:20:38] Phase 4: SKIPPED (test mode)
[2025-12-16 10:20:38] Test generation complete!

Cost: $0.0285 (vs ~$0.08 for full video)
Time: 38 seconds (vs ~3-4 minutes for full video)
```

---

## Features & Capabilities

### 1. Manual Mode

**Purpose**: Use pre-written scripts instead of AI content generation.

**Configuration**:
```json
{
  "project_name": "custom_video",
  "manual_mode": true,
  "manual_config_path": "manual_configs/my_script.json"
}
```

**Manual Script Format**:
```json
{
  "slides": [
    {
      "title": "Custom Slide Title",
      "narration": "Exactly what I want to say...",
      "visual_type": "pexels",
      "visual_description": "Office teamwork collaboration",
      "layout": "text-left-image-right"
    },
    {
      "title": "Another Slide",
      "narration": "More custom narration...",
      "visual_type": "local",
      "visual_path": "manual_configs/images/my_chart.png",
      "layout": "text-right-image-left"
    }
  ]
}
```

**Benefits**:
- Full control over script
- Use custom images
- Skip AI content generation costs
- Faster generation (no ContentAgent)

---

### 2. Web Research

**Purpose**: Enhance content accuracy with real-time fact gathering.

**Configuration**:
```json
{
  "web_research_enabled": true,
  "research_focus": "latest statistics and trends"
}
```

**How It Works**:
1. ContentAgent receives topic
2. GPT-4o performs web search
3. Retrieves current facts, statistics, examples
4. Incorporates research into content strategy
5. Cites sources in narration

**Example Output**:
```json
{
  "slide": {
    "narration": "According to a 2024 study, machine learning adoption has grown by 45% in healthcare...",
    "research_summary": "Web research found: McKinsey 2024 AI report, WHO healthcare AI guidelines..."
  }
}
```

**Cost Impact**: +$0.02-0.05 per video (web search tokens)

---

### 3. Reference Material Integration

**Purpose**: Use your own documents as source material.

**Setup**:
```bash
# Place reference documents
mkdir -p manual_configs/reference_material/
cp my_research.txt manual_configs/reference_material/
```

**Configuration**:
```json
{
  "reference_material": [
    "manual_configs/reference_material/my_research.txt",
    "manual_configs/reference_material/product_specs.md"
  ]
}
```

**How It Works**:
- Files are read and included in ContentAgent prompt
- GPT uses them as primary source
- Ensures brand voice, accuracy, compliance
- Reduces hallucination

**Supported Formats**: .txt, .md, .pdf (text extraction)

---

### 4. Custom Branding

**Logo Switching**:
```json
{
  "template_params_path": "templates/template_params.json",
  "logo_override": {
    "path": "templates/logos/my_company_logo.png",
    "dimensions": "150x40"
  }
}
```

**Theme Customization**:
```json
{
  "brand": {
    "logo_path": "templates/logos/acme_corp.png",
    "company_name": "ACME Corp",
    "dimensions": "180x50"
  },
  "colors": {
    "primary": "#FF6B35",
    "secondary": "#004E89",
    "accent": "#FFD23F",
    "background": "#1A1A2E",
    "text": "#FFFFFF"
  },
  "typography": {
    "font_primary": "Roboto",
    "font_secondary": "Open Sans",
    "font_mono": "Fira Code"
  }
}
```

---

### 5. Silent Videos

**Purpose**: Generate video without audio narration.

**Configuration**:
```json
{
  "audio_enabled": false,
  "slide_duration_override": 5.0  // seconds per slide
}
```

**Use Cases**:
- Social media (user-controlled audio)
- Presentations (speaker narration)
- Accessibility (manual voiceover)

---

### 6. Slide Regeneration

**Purpose**: Regenerate specific slides without rebuilding entire video.

**Command**:
```bash
python src/modify_slide.py \
    --output-dir outputs/my_video/20251216_100000 \
    --slide-number 2 \
    --visual-type pexels \
    --visual-description "modern office workspace"
```

**Script** (`src/modify_slide.py`):
```python
def regenerate_slide(
    output_dir: Path,
    slide_number: int,
    visual_type: Optional[str] = None,
    visual_description: Optional[str] = None,
    layout: Optional[str] = None
):
    """Regenerate single slide and update video."""
    # Load content strategy
    content_path = output_dir / "content_strategy.json"
    strategy = ContentStrategy.parse_file(content_path)

    slide = strategy.slides[slide_number]

    # Apply overrides
    if visual_type:
        slide.visual_type = visual_type
    if visual_description:
        slide.visual_description = visual_description
    if layout:
        slide.layout = layout

    # Regenerate slide
    design_agent = DesignAgent()
    new_slide_path = await design_agent.generate_slide(slide, output_dir)

    print(f"Slide {slide_number} regenerated: {new_slide_path}")
    print("Run reassemble_video.py to rebuild video with new slide")
```

---

### 7. Video Reassembly

**Purpose**: Rebuild video after manual slide changes.

**Command**:
```bash
python src/reassemble_video.py \
    --output-dir outputs/my_video/20251216_100000
```

**Script** (`src/reassemble_video.py`):
```python
def reassemble_video(output_dir: Path):
    """Reassemble video from existing slides and audio."""
    # Load content strategy
    strategy = ContentStrategy.parse_file(output_dir / "content_strategy.json")

    # Collect final slides
    slides = []
    for i in range(len(strategy.slides)):
        slide_path = output_dir / "slides" / f"slide_{i:02d}_final.png"
        if not slide_path.exists():
            # Try latest version
            slide_path = max(
                output_dir.glob(f"slides/slide_{i:02d}_v*.png"),
                key=lambda p: int(p.stem.split('_v')[-1])
            )
        slides.append(slide_path)

    # Load audio
    audio_path = output_dir / "audio" / f"{strategy.topic.replace(' ', '_').lower()}.mp3"

    # Reassemble
    video_assembler = VideoAssembler()
    output_video = output_dir / "videos" / f"{strategy.topic.replace(' ', '_').lower()}_v2.mp4"

    video_assembler.assemble_video(
        slides=slides,
        audio_path=audio_path,
        output_path=output_video,
        content_strategy=strategy
    )

    print(f"Video reassembled: {output_video}")
```

---

## Visual Types & Layouts

### Visual Types

#### 1. Pexels (Stock Photos)
```json
{
  "visual_type": "pexels",
  "visual_description": "Team collaboration in modern office"
}
```

**Best For**: General concepts, people, places, objects
**Generation Time**: ~1-2 seconds
**Cost**: Free
**Quality**: High (professional photography)

---

#### 2. Gemini (AI-Generated Images)
```json
{
  "visual_type": "gemini",
  "visual_description": "3D illustration of neural network with glowing nodes and connections, blue and purple gradient, futuristic tech style"
}
```

**Best For**: Custom visualizations, abstract concepts, specific compositions
**Generation Time**: ~2-5 seconds
**Cost**: $0.04 per image
**Quality**: High (Imagen 2.0)

**Prompt Guidelines**:
- Be specific about composition, colors, style
- Mention "professional", "high contrast", "crisp lines"
- Specify lighting and mood
- Include brand colors for consistency
- Avoid text in images (AI text often garbled)

---

#### 3. Graph (Chart.js)
```json
{
  "visual_type": "graph",
  "visual_description": "Bar chart showing model accuracy comparison: Linear Regression 85%, Decision Tree 92%, Random Forest 95%, Neural Network 97%"
}
```

**Chart Types**:
- Bar chart
- Line chart
- Pie chart
- Doughnut chart
- Radar chart
- Scatter plot

**Best For**: Data visualization, comparisons, trends
**Generation Time**: ~3-5 seconds
**Cost**: GPT-4o tokens for data extraction
**Quality**: Professional (Chart.js library)

---

#### 4. Diagram (CSS/HTML)
```json
{
  "visual_type": "diagram",
  "visual_description": "Flowchart showing: Data Collection → Data Cleaning → Feature Engineering → Model Training → Evaluation → Deployment"
}
```

**Diagram Types**:
- Flowcharts
- Process diagrams
- Architecture diagrams
- Venn diagrams
- Timelines

**Best For**: Processes, workflows, relationships
**Generation Time**: ~3-5 seconds
**Cost**: GPT-4o tokens
**Quality**: Clean, minimal, brand-consistent

---

#### 5. Code (Syntax Highlighted)
```json
{
  "visual_type": "code",
  "visual_description": "Python code: from sklearn.linear_model import LinearRegression; model = LinearRegression(); model.fit(X_train, y_train)"
}
```

**Languages Supported**: Python, JavaScript, Java, C++, SQL, etc. (Prism.js)
**Best For**: Technical explanations, tutorials
**Generation Time**: ~2-3 seconds
**Cost**: GPT-4o tokens
**Quality**: Professional syntax highlighting

---

#### 6. Table (HTML)
```json
{
  "visual_type": "table",
  "visual_description": "Comparison table: Algorithm | Accuracy | Training Time | Interpretability; Linear Regression | 85% | 1s | High; Random Forest | 95% | 30s | Medium"
}
```

**Best For**: Feature comparisons, specifications, data grids
**Generation Time**: ~2-3 seconds
**Cost**: GPT-4o tokens
**Quality**: Styled with brand colors, responsive

---

#### 7. Local (Custom Images)
```json
{
  "visual_type": "local",
  "visual_path": "manual_configs/images/custom_chart.png"
}
```

**Best For**: Pre-made assets, logos, specific visuals
**Generation Time**: Instant
**Cost**: Free
**Quality**: Depends on source

---

#### 8. None (Text Only)
```json
{
  "visual_type": "none"
}
```

**Best For**: Title slides, quotes, summaries
**Generation Time**: ~2-3 seconds
**Cost**: GPT-4o tokens
**Quality**: Clean typography

---

### Layout Types

#### 1. text-left-image-right
```
┌──────────────────────────────────┐
│                                  │
│  ┌─────────┐  ┌──────────────┐  │
│  │         │  │              │  │
│  │  TEXT   │  │    IMAGE     │  │
│  │  60%    │  │     40%      │  │
│  │         │  │              │  │
│  └─────────┘  └──────────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Best For**: Standard explanatory slides
**Text Width**: 60%
**Image Width**: 40%

---

#### 2. text-right-image-left
```
┌──────────────────────────────────┐
│                                  │
│  ┌──────────────┐  ┌─────────┐  │
│  │              │  │         │  │
│  │    IMAGE     │  │  TEXT   │  │
│  │     40%      │  │  60%    │  │
│  │              │  │         │  │
│  └──────────────┘  └─────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Best For**: Emphasizing visuals first
**Text Width**: 60%
**Image Width**: 40%

---

#### 3. center
```
┌──────────────────────────────────┐
│                                  │
│      ┌────────────────────┐      │
│      │                    │      │
│      │        TEXT        │      │
│      │       CENTER       │      │
│      │                    │      │
│      └────────────────────┘      │
│                                  │
└──────────────────────────────────┘
```

**Best For**: Title slides, quotes, key takeaways
**Text Width**: 80% (centered)

---

#### 4. text-top-image-bottom
```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │          TEXT (40%)        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │       IMAGE (60%)          │  │
│  │                            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Best For**: Graphs, charts, wide visuals
**Text Height**: 40%
**Image Height**: 60%

---

#### 5. split-50-50
```
┌──────────────────────────────────┐
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │          │  │              │  │
│  │   TEXT   │  │    IMAGE     │  │
│  │   50%    │  │     50%      │  │
│  │          │  │              │  │
│  └──────────┘  └──────────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Best For**: Balanced content-visual split
**Text Width**: 50%
**Image Width**: 50%

---

#### 6. full-visual
```
┌──────────────────────────────────┐
│          ┌────────────┐          │
│          │   TITLE    │          │
│          └────────────┘          │
│                                  │
│        FULLSCREEN IMAGE          │
│         (with overlay)           │
│                                  │
│                                  │
└──────────────────────────────────┘
```

**Best For**: Dramatic visuals, background images
**Text**: Overlay with shadow/gradient for readability

---

## Template System

### Template Structure

**Base Template** (`templates/base_template.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link href="https://fonts.googleapis.com/css2?family={{FONT_PRIMARY}}:wght@300;400;700&family={{FONT_SECONDARY}}:wght@400;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            width: 1920px;
            height: 1080px;
            background: {{BACKGROUND_COLOR}};
            font-family: '{{FONT_PRIMARY}}', sans-serif;
            color: {{TEXT_COLOR}};
            overflow: hidden;
        }

        .slide {
            width: 100%;
            height: 100%;
            padding: {{PADDING_LARGE}}px;
            display: flex;
            flex-direction: column;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: {{PADDING_MEDIUM}}px;
            border-bottom: 2px solid {{PRIMARY_COLOR}};
        }

        .logo {
            height: {{LOGO_HEIGHT}}px;
        }

        .content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .text-section {
            /* Layout-specific styles injected here */
        }

        .visual-section {
            /* Layout-specific styles injected here */
        }

        h1 {
            font-size: {{FONT_SIZE_TITLE}}px;
            font-weight: 700;
            color: {{PRIMARY_COLOR}};
            margin-bottom: {{SPACING_MEDIUM}}px;
        }

        h2 {
            font-size: {{FONT_SIZE_SUBTITLE}}px;
            font-weight: 600;
            color: {{SECONDARY_COLOR}};
        }

        p {
            font-size: {{FONT_SIZE_BODY}}px;
            line-height: 1.6;
            margin-bottom: {{SPACING_SMALL}}px;
        }

        .highlight {
            background: {{ACCENT_COLOR}};
            padding: {{PADDING_SMALL}}px;
            border-radius: {{BORDER_RADIUS}}px;
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <img src="{{LOGO_BASE64}}" alt="Logo" class="logo">
            <span class="company-name">{{COMPANY_NAME}}</span>
        </div>
        <div class="content">
            {{TEXT_HTML}}
            {{VISUAL_HTML}}
        </div>
    </div>
</body>
</html>
```

---

### Template Parameters

**Neutral Theme** (`templates/template_params.json`):
```json
{
  "brand": {
    "logo_path": "templates/logos/logo_neutral.png",
    "company_name": "",
    "dimensions": "150x40"
  },
  "colors": {
    "primary": "#2C3E50",
    "secondary": "#3498DB",
    "accent": "#E74C3C",
    "background": "#ECF0F1",
    "text": "#2C3E50",
    "text_secondary": "#7F8C8D"
  },
  "typography": {
    "font_primary": "Inter",
    "font_secondary": "Roboto",
    "font_mono": "Fira Code",
    "font_size_title": 72,
    "font_size_subtitle": 48,
    "font_size_body": 32,
    "font_size_small": 24,
    "font_weight_bold": 700,
    "font_weight_medium": 600,
    "font_weight_regular": 400
  },
  "spacing": {
    "padding_large": 80,
    "padding_medium": 40,
    "padding_small": 20,
    "spacing_large": 60,
    "spacing_medium": 30,
    "spacing_small": 15,
    "gap_large": 40,
    "gap_medium": 20,
    "gap_small": 10
  },
  "effects": {
    "border_radius": 12,
    "shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "shadow_large": "0 10px 20px rgba(0, 0, 0, 0.15)",
    "opacity_overlay": 0.9
  },
  "animations": {
    "duration": "0.3s",
    "easing": "cubic-bezier(0.4, 0.0, 0.2, 1)"
  }
}
```

---

### TemplateProcessor Usage

**Loading Template**:
```python
from template_processor import TemplateProcessor

processor = TemplateProcessor(
    template_params_path="templates/template_params.json",
    logo_override={"path": "templates/logos/my_logo.png", "dimensions": "180x50"}
)
```

**Processing HTML**:
```python
# Generate HTML with GPT (contains placeholders)
text_html = """
<div class="text-section">
    <h1>{{TITLE}}</h1>
    <p>Machine learning algorithms use {{PRIMARY_COLOR}} to highlight important concepts.</p>
</div>
"""

visual_html = """
<div class="visual-section">
    <img src="https://example.com/image.jpg" alt="Visual">
</div>
"""

# Process with template
final_html = processor.process(text_html, visual_html, layout="text-left-image-right")

# final_html now has:
# - {{TITLE}} replaced with actual title
# - {{PRIMARY_COLOR}} replaced with #2C3E50
# - {{LOGO_BASE64}} embedded
# - Layout-specific CSS applied
```

**Logo Handling**:
```python
def load_logo_as_base64(logo_path: Path) -> str:
    """Convert logo to base64 data URI."""
    with open(logo_path, 'rb') as f:
        logo_bytes = f.read()

    # Detect image type
    if logo_path.suffix.lower() == '.png':
        mime_type = 'image/png'
    elif logo_path.suffix.lower() in ['.jpg', '.jpeg']:
        mime_type = 'image/jpeg'
    else:
        raise ValueError(f"Unsupported logo format: {logo_path.suffix}")

    # Encode as base64
    logo_base64 = base64.b64encode(logo_bytes).decode('utf-8')

    return f"data:{mime_type};base64,{logo_base64}"

# In template processing
template = template.replace("{{LOGO_BASE64}}", load_logo_as_base64(logo_path))
```

---

## Quality Control

### Vision Review System

**Overview**: GPT-4o-mini Vision analyzes rendered slides for quality issues.

**Review Process**:
1. Slide rendered to PNG
2. PNG sent to GPT-4o-mini Vision
3. Model analyzes 5 criteria
4. Returns score (1-10) and detailed feedback
5. If score < threshold: regenerate with feedback
6. After 3 failed attempts: suggest Pexels fallback
7. After 5 attempts: use best attempt

---

### Review Criteria

#### 1. Text Readability
**Checks**:
- Sufficient color contrast (WCAG AA: 4.5:1)
- Font size appropriate (min 24px for body)
- No overlapping text
- Text not obscured by visuals

**Common Issues**:
- Low contrast (e.g., light gray on white)
- Font too small for 1080p
- Text over busy background

**Feedback Example**:
> "Text readability issue: The paragraph text (#7F8C8D) on light background (#ECF0F1) has insufficient contrast (2.8:1, needs 4.5:1). Increase font weight or use darker text color (#2C3E50)."

---

#### 2. Layout Appropriateness
**Checks**:
- Content fits within safe zones
- Proper spacing and padding
- Visual hierarchy clear
- No clipping or overflow

**Common Issues**:
- Content too close to edges
- Unbalanced text/image split
- Crowded composition

**Feedback Example**:
> "Layout issue: The diagram is too small (occupies only 30% of visual area). Increase size to fill 60-70% of the visual section for better readability."

---

#### 3. Visual Appropriateness
**Checks**:
- Visual matches content/narration
- Professional quality
- Not distracting or inappropriate
- Culturally appropriate

**Common Issues**:
- Stock photo doesn't match concept
- AI image has artifacts or weird details
- Visual is irrelevant or generic

**Feedback Example**:
> "Visual appropriateness issue: The image shows a physical office, but the narration discusses remote work and digital collaboration. Use an image of video conferencing or digital workspace instead."

---

#### 4. Color Harmony
**Checks**:
- Colors consistent with brand
- Good contrast between elements
- Accessible for colorblind users
- No jarring color combinations

**Common Issues**:
- Chart uses colors outside brand palette
- Clashing accent colors
- Poor contrast in graphs

**Feedback Example**:
> "Color harmony issue: The chart uses red and green for comparison, which is problematic for colorblind users. Use the brand colors ({{PRIMARY_COLOR}} and {{SECONDARY_COLOR}}) or blue/orange instead."

---

#### 5. Chart/Diagram Clarity
**Checks** (if applicable):
- Labels and legend present
- Data clearly differentiated
- Axes labeled and scaled
- No overlapping elements

**Common Issues**:
- Missing chart legend
- Overlapping bar labels
- Tiny axis labels

**Feedback Example**:
> "Chart clarity issue: The bar chart labels are overlapping. Rotate x-axis labels 45 degrees or reduce font size. Also, add units to the y-axis (e.g., 'Accuracy (%)')."

---

### Scoring Rubric

**9-10 (Excellent)**:
- All criteria met
- Professional quality
- Ready to publish
- No improvements needed

**7-8 (Good)**:
- Minor issues
- Still acceptable quality
- Small improvements beneficial
- Approved by default

**5-6 (Acceptable)**:
- Some issues present
- Usable but not ideal
- Improvements recommended
- May be rejected depending on threshold

**3-4 (Poor)**:
- Multiple issues
- Needs regeneration
- Not professional quality
- Rejected, trigger retry

**1-2 (Unacceptable)**:
- Severe issues
- Completely unusable
- Recommend fallback to Pexels
- Multiple criteria failed

---

### Configuration

**Enable/Disable**:
```python
# In config.py
ENABLE_VISION_REVIEW = True  # or False

# Or in video request JSON
{
  "vision_review_enabled": false
}
```

**Threshold Setting**:
```python
# In config.py
VISION_REVIEW_THRESHOLD = 7.0  # 1-10 scale

# Lower threshold = more lenient (fewer retries)
# Higher threshold = stricter quality (more retries)
```

**Max Retries**:
```python
# In config.py
MAX_VISION_RETRIES = 5

# Prevent infinite loops
# After max retries, use best attempt
```

---

### Manual Review Override

**Save All Attempts**:
The system saves every generation attempt:
```
slides/
├── slide_00_v1.png  # First attempt
├── slide_00_v2.png  # Second attempt (after feedback)
├── slide_00_v3.png  # Third attempt
└── slide_00_final.png  # Symlink to selected version
```

**Select Different Version**:
```bash
# After generation, review all attempts
ls outputs/my_video/20251216_100000/slides/slide_00_*.png

# Choose a different version
ln -sf slide_00_v1.png outputs/my_video/20251216_100000/slides/slide_00_final.png

# Reassemble video
python src/reassemble_video.py --output-dir outputs/my_video/20251216_100000
```

---

## Cost Tracking

### API Pricing (as of January 2025)

#### OpenAI
| Service | Model | Input Cost | Output Cost |
|---------|-------|------------|-------------|
| Chat | gpt-4o | $2.50 / 1M tokens | $10.00 / 1M tokens |
| Chat | gpt-4o-mini | $0.15 / 1M tokens | $0.60 / 1M tokens |
| Chat | gpt-5 | $5.00 / 1M tokens | $15.00 / 1M tokens |
| TTS | tts-1-hd | $15.00 / 1M chars | - |

#### Google Gemini
| Service | Model | Cost |
|---------|-------|------|
| Image Gen | gemini-3-pro-image | $0.04 / image |
| Image Gen | gemini-3-flash-image | $0.02 / image |

#### Pexels
| Service | Cost |
|---------|------|
| Stock Photos | Free (with attribution) |

#### ElevenLabs
| Service | Model | Cost |
|---------|-------|------|
| TTS | Monolingual v1 | $0.30 / 1K chars |

---

### Cost Examples

**Basic Video (60s, 5 slides, Pexels visuals)**:
```
Content generation (GPT-4o):          $0.014
Slide text HTML (GPT-4o, 5 slides):   $0.045
Slide visuals (Pexels):               $0.000
Vision review (GPT-4o-mini, 5):       $0.008
Voice generation (OpenAI TTS):        $0.017
                                      -------
Total:                                $0.084
```

**Premium Video (60s, 5 slides, Gemini visuals, ElevenLabs TTS)**:
```
Content generation (GPT-4o):          $0.014
Slide text HTML (GPT-4o, 5 slides):   $0.045
Slide visuals (Gemini, 5 images):     $0.200
Vision review (GPT-4o-mini, 5):       $0.008
Voice generation (ElevenLabs):        $0.060
                                      -------
Total:                                $0.327
```

**Test Mode (2 slides only)**:
```
Content generation (GPT-4o):          $0.014
Slide text HTML (GPT-4o, 2 slides):   $0.018
Slide visuals (Pexels):               $0.000
Vision review (GPT-4o-mini, 2):       $0.003
Voice/Video assembly:                 SKIPPED
                                      -------
Total:                                $0.035
```

**With Vision Retries (3 attempts per slide)**:
```
Basic cost:                           $0.084
+ Additional vision reviews (10):     $0.015
+ Additional slide regenerations:     $0.030
                                      -------
Total:                                $0.129
```

---

### Cost Optimization Strategies

#### 1. Use Test Mode
```bash
python src/main.py --config examples/my_video.json --test-mode
```
Saves ~60-70% on costs by generating only 2 slides.

#### 2. Disable Vision Review
```json
{"vision_review_enabled": false}
```
Saves $0.008 per video, but may reduce quality.

#### 3. Use Pexels Instead of Gemini
```json
{"visual_type": "pexels"}
```
Saves $0.04 per slide (~$0.20 per 5-slide video).

#### 4. Use GPT-4o Instead of GPT-5
```python
CONTENT_MODEL = "gpt-4o"
DESIGN_MODEL = "gpt-4o"
```
Saves ~50% on model costs.

#### 5. Use OpenAI TTS Instead of ElevenLabs
```json
{"tts_provider": "openai"}
```
Saves ~$0.04 per video.

#### 6. Manual Mode
```json
{"manual_mode": true}
```
Skips content generation entirely (~$0.01 saved).

#### 7. Batch Multiple Videos
Run multiple videos in sequence to amortize setup costs.

---

### Logging and Reports

**Real-Time Logging**:
Every API call is logged to `api_calls_TIMESTAMP.jsonl`:
```jsonl
{"timestamp":"2025-12-16T10:00:15Z","provider":"openai","endpoint":"chat.completions","model":"gpt-4o","input_tokens":850,"output_tokens":1200,"cost_usd":0.0141,"purpose":"content_generation","success":true}
{"timestamp":"2025-12-16T10:00:22Z","provider":"openai","endpoint":"chat.completions","model":"gpt-4o","input_tokens":400,"output_tokens":800,"cost_usd":0.0090,"purpose":"slide_0_text_html","success":true}
{"timestamp":"2025-12-16T10:00:23Z","provider":"pexels","endpoint":"search","cost_usd":0.0000,"purpose":"slide_0_visual","success":true}
```

**Summary Report**:
After generation, a summary is saved to `api_summary_TIMESTAMP.json`:
```json
{
  "timestamp": "2025-12-16T10:03:49Z",
  "video_name": "linear_regression_explained",
  "total_cost_usd": 0.0819,
  "total_calls": 18,
  "failed_calls": 0,
  "by_provider": {
    "openai": {"cost": 0.0779, "calls": 17},
    "pexels": {"cost": 0.0000, "calls": 1}
  },
  "by_purpose": {
    "content_generation": {"cost": 0.0141, "calls": 1},
    "slide_text_html": {"cost": 0.0450, "calls": 5},
    "slide_visual_html": {"cost": 0.0180, "calls": 3},
    "vision_review": {"cost": 0.0075, "calls": 5},
    "voice_generation": {"cost": 0.0174, "calls": 1}
  },
  "token_usage": {
    "total_input_tokens": 5230,
    "total_output_tokens": 3890
  }
}
```

**Console Output**:
```
============================================================
API USAGE SUMMARY
============================================================

Total Cost: $0.0819
Total Calls: 18
Failed Calls: 0

--- By Provider ---
  openai: $0.0779 (17 calls)
  pexels: $0.0000 (1 call)

--- By Purpose ---
  slide_text_html: $0.0450 (5 calls, $0.0090 avg)
  slide_visual_html: $0.0180 (3 calls, $0.0060 avg)
  content_generation: $0.0141 (1 call)
  voice_generation: $0.0174 (1 call)
  vision_review: $0.0075 (5 calls, $0.0015 avg)

============================================================
```

---

## Usage Examples

### Basic Usage

**Example 1: Simple Explainer Video**
```bash
python src/main.py \
    --config examples/example_linear_regression.json \
    --output outputs/
```

**Config** (`examples/example_linear_regression.json`):
```json
{
  "project_name": "linear_regression_explained",
  "topic": "Linear Regression in Machine Learning",
  "video_length_seconds": 60,
  "num_slides": 5,
  "tts_provider": "openai",
  "tts_voice": "onyx",
  "template_params_path": "templates/template_params.json",
  "web_research_enabled": false,
  "vision_review_enabled": true
}
```

---

### Advanced Usage

**Example 2: Custom Branding + Gemini Images**
```bash
python src/main.py \
    --config examples/generative_vs_agentic_ai.json \
    --output outputs/
```

**Config** (`examples/generative_vs_agentic_ai.json`):
```json
{
  "project_name": "generative_vs_agentic_ai",
  "topic": "Generative AI vs Agentic AI: Key Differences",
  "video_length_seconds": 90,
  "num_slides": 7,
  "tts_provider": "elevenlabs",
  "tts_voice": "rachel",
  "template_params_path": "templates/template_params_blue.json",
  "logo_override": {
    "path": "templates/logos/logo_aidc.png",
    "dimensions": "180x50"
  },
  "web_research_enabled": true,
  "vision_review_enabled": true,
  "prefer_gemini_images": true
}
```

---

**Example 3: Manual Mode with Custom Script**
```bash
python src/main.py \
    --config examples/example_manual_mode.json \
    --output outputs/
```

**Config** (`examples/example_manual_mode.json`):
```json
{
  "project_name": "custom_product_demo",
  "manual_mode": true,
  "manual_config_path": "manual_configs/product_demo_script.json",
  "tts_provider": "openai",
  "tts_voice": "nova",
  "template_params_path": "templates/template_params_purple.json"
}
```

**Manual Script** (`manual_configs/product_demo_script.json`):
```json
{
  "slides": [
    {
      "title": "Introducing Product X",
      "narration": "Welcome to Product X, the all-in-one solution for your business needs.",
      "visual_type": "local",
      "visual_path": "manual_configs/images/product_hero.png",
      "layout": "text-right-image-left"
    },
    {
      "title": "Key Features",
      "narration": "Product X offers three core capabilities: automation, analytics, and integration.",
      "visual_type": "diagram",
      "visual_description": "Three circles labeled Automation, Analytics, Integration with connecting lines",
      "layout": "text-left-image-right"
    },
    {
      "title": "Pricing",
      "narration": "Choose from our flexible pricing tiers: Starter at $29, Pro at $99, or Enterprise custom pricing.",
      "visual_type": "table",
      "visual_description": "Pricing table: Plan | Price | Features; Starter | $29 | Basic features; Pro | $99 | Advanced features; Enterprise | Custom | All features",
      "layout": "text-top-image-bottom"
    }
  ]
}
```

---

**Example 4: Test Mode for Rapid Iteration**
```bash
python src/main.py \
    --config examples/example_decision_tree_ml.json \
    --test-mode \
    --output outputs/
```

Generates only first 2 slides for quick testing.

---

**Example 5: Resume from Checkpoint**
```bash
# If generation was interrupted
python src/main.py \
    --resume outputs/linear_regression_explained/20251216_100000
```

---

**Example 6: Regenerate Single Slide**
```bash
# Regenerate slide 2 with Pexels instead of Gemini
python src/modify_slide.py \
    --output-dir outputs/my_video/20251216_100000 \
    --slide-number 2 \
    --visual-type pexels \
    --visual-description "data visualization dashboard with charts"
```

---

**Example 7: Reassemble Video After Manual Edits**
```bash
# After manually editing slides or audio
python src/reassemble_video.py \
    --output-dir outputs/my_video/20251216_100000
```

---

## Troubleshooting

### Common Issues

#### 1. Playwright Not Installed
**Error**:
```
playwright._impl._api_types.Error: Executable doesn't exist
```

**Solution**:
```bash
playwright install chromium
```

---

#### 2. Gemini Rate Limit
**Error**:
```
google.api_core.exceptions.ResourceExhausted: 429 Quota exceeded
```

**Solution**:
- Wait 60 seconds and retry (automatic exponential backoff)
- Or use Pexels fallback: set `"visual_type": "pexels"` in config
- Or reduce generation speed: add delay between slides

---

#### 3. OpenAI Token Limit
**Error**:
```
openai.BadRequestError: This model's maximum context length is 128000 tokens
```

**Solution**:
- Reduce video length or number of slides
- Disable web research
- Use shorter reference materials
- Split into multiple shorter videos

---

#### 4. Vision Review Always Failing
**Error**:
```
Max vision review attempts reached for slide 3, using best attempt
```

**Solution**:
- Lower `VISION_REVIEW_THRESHOLD` (e.g., 6.0 instead of 7.0)
- Disable vision review: `"vision_review_enabled": false`
- Manually review saved attempts and select best one
- Switch to Pexels for problematic visuals

---

#### 5. Audio-Video Sync Issues
**Problem**: Audio doesn't match slide timing.

**Solution**:
- Check `TTS_SPEED` calibration in `config.py`
- Verify `WORDS_PER_MINUTE` matches actual speech rate
- Test with different TTS voices (some speak faster)
- Manually adjust slide durations in content strategy

---

#### 6. Low-Quality Slides
**Problem**: Blurry or pixelated slides.

**Solution**:
- Check `SLIDE_RESOLUTION` is (1920, 1080)
- Use larger Pexels images: `photos[0]["src"]["large2x"]`
- Enable vision review for quality control
- Use Gemini instead of Pexels for custom visuals
- Increase `RENDER_WAIT_TIME` for complex slides

---

#### 7. FFmpeg Not Found
**Error**:
```
FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'
```

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

---

#### 8. Checkpoint Not Loading
**Problem**: Resume fails to load checkpoint.

**Solution**:
- Verify `checkpoint.json` exists in output directory
- Check file is valid JSON: `python -m json.tool checkpoint.json`
- Ensure output directory path is correct
- Start fresh if checkpoint is corrupted

---

#### 9. Template Not Found
**Error**:
```
FileNotFoundError: [Errno 2] No such file or directory: 'templates/template_params.json'
```

**Solution**:
- Verify template file exists
- Use absolute paths or check working directory
- Ensure `template_params_path` in config is correct

---

#### 10. API Key Issues
**Error**:
```
openai.AuthenticationError: Invalid API key
```

**Solution**:
- Check `.env` file exists and has correct keys
- Verify no trailing spaces or quotes in API keys
- Test API key directly: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
- Generate new API key if needed

---

### Debug Mode

**Enable Verbose Logging**:
```python
# In config.py
DEBUG_MODE = True
LOG_LEVEL = "DEBUG"
```

**Or via command line**:
```bash
python src/main.py \
    --config examples/my_video.json \
    --debug \
    --verbose
```

**Output**:
```
[DEBUG] Loading configuration from examples/my_video.json
[DEBUG] Initializing ContentAgent with model: gpt-4o
[DEBUG] API Call: openai.chat.completions.create (gpt-4o)
[DEBUG] Prompt: [...]
[DEBUG] Response tokens: 850 input / 1200 output
[DEBUG] Saved content strategy to: outputs/my_video/20251216_100000/content_strategy.json
[DEBUG] Initializing DesignAgent
[DEBUG] Generating slide 0: What is Linear Regression?
[DEBUG] API Call: openai.chat.completions.create (text HTML)
[DEBUG] Generated text HTML (800 tokens)
[DEBUG] API Call: pexels.search (query: scatter plot data visualization)
[DEBUG] Found 47 results, using first
[DEBUG] Downloaded image: 1920x1280
[DEBUG] Processing with template: template_params.json
[DEBUG] Rendering HTML with Playwright (viewport: 1920x1080)
[DEBUG] Screenshot saved: slide_00_v1.png (1920x1080, 245 KB)
[DEBUG] Running vision review...
[DEBUG] Vision score: 8.5/10 (APPROVED)
```

---

## API Reference

### Main Entry Point

**Function**: `src/main.py::main()`

```python
def main(
    config_path: Optional[Path] = None,
    resume_path: Optional[Path] = None,
    test_mode: bool = False,
    output_dir: Path = Path("outputs"),
    debug: bool = False
) -> Path:
    """
    Main video generation entry point.

    Args:
        config_path: Path to video request JSON
        resume_path: Path to output directory to resume
        test_mode: Generate only 2 slides for testing
        output_dir: Base output directory
        debug: Enable debug logging

    Returns:
        Path to generated video file

    Raises:
        FileNotFoundError: Config file not found
        ValidationError: Invalid config format
        APIError: API call failed
    """
```

**Command Line**:
```bash
python src/main.py --help

usage: main.py [-h] [--config CONFIG] [--resume RESUME] [--test-mode]
               [--output OUTPUT] [--debug]

Generate explainer videos with AI

optional arguments:
  -h, --help          show this help message and exit
  --config CONFIG     Path to video request JSON
  --resume RESUME     Path to output directory to resume
  --test-mode         Generate only 2 slides for testing
  --output OUTPUT     Base output directory (default: outputs)
  --debug             Enable debug logging
```

---

### Video Request Schema

```python
from pydantic import BaseModel, Field
from typing import Optional, Literal, List

class VideoRequest(BaseModel):
    """Video generation request specification."""

    # Required
    project_name: str = Field(..., description="Unique project identifier")

    # Content (one required)
    topic: Optional[str] = Field(None, description="Topic for AI content generation")
    manual_mode: Optional[bool] = Field(False, description="Use manual script")
    manual_config_path: Optional[str] = Field(None, description="Path to manual script JSON")

    # Video settings
    video_length_seconds: int = Field(60, ge=10, le=600, description="Target video length")
    num_slides: int = Field(5, ge=2, le=20, description="Number of slides")

    # TTS settings
    tts_provider: Literal["openai", "elevenlabs"] = Field("openai")
    tts_voice: str = Field("onyx", description="Voice name (provider-specific)")
    audio_enabled: bool = Field(True, description="Generate audio narration")

    # Visual settings
    template_params_path: str = Field("templates/template_params.json")
    logo_override: Optional[dict] = Field(None, description="Custom logo config")
    prefer_gemini_images: bool = Field(False, description="Prefer Gemini over Pexels")

    # Content settings
    web_research_enabled: bool = Field(False, description="Enable GPT-4o web research")
    reference_material: Optional[List[str]] = Field(None, description="Paths to reference docs")

    # Quality settings
    vision_review_enabled: bool = Field(True, description="Enable vision-based quality control")
    vision_review_threshold: float = Field(7.0, ge=1.0, le=10.0)

    # Advanced
    transitions_enabled: bool = Field(True, description="Add crossfade transitions")
    transition_duration: float = Field(0.5, ge=0.0, le=2.0, description="Transition duration (seconds)")
```

---

### Content Strategy Schema

```python
class Slide(BaseModel):
    """Individual slide specification."""

    slide_number: int = Field(..., ge=0)
    title: str = Field(..., max_length=100)
    narration: str = Field(..., max_length=1000)
    visual_type: Literal["pexels", "gemini", "graph", "diagram", "code", "table", "local", "none"]
    visual_description: str = Field(..., max_length=500)
    layout: Literal["text-left-image-right", "text-right-image-left", "center",
                     "text-top-image-bottom", "split-50-50", "full-visual"]
    duration_seconds: float = Field(..., gt=0, le=60)

class ContentStrategy(BaseModel):
    """Complete content strategy for video."""

    topic: str
    slides: List[Slide]
    total_duration: float
    research_summary: Optional[str] = None
```

---

### API Call Schema

```python
class APICall(BaseModel):
    """API call log entry."""

    timestamp: str = Field(..., description="ISO 8601 timestamp")
    provider: Literal["openai", "gemini", "pexels", "elevenlabs"]
    endpoint: str = Field(..., description="API endpoint")
    model: Optional[str] = None

    # Usage
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    input_chars: Optional[int] = None

    # Cost
    cost_usd: float = Field(..., ge=0)

    # Metadata
    purpose: str = Field(..., description="What this call was for")
    success: bool
    error: Optional[str] = None
```

---

### Checkpoint Schema

```python
class Checkpoint(BaseModel):
    """Generation checkpoint for resumability."""

    project_name: str
    timestamp: str
    current_phase: Literal["content", "design", "voice", "assembly", "complete"]
    completed_phases: List[str]

    # Paths
    content_strategy_path: Optional[Path] = None
    audio_path: Optional[Path] = None
    video_path: Optional[Path] = None

    # Progress
    slides_generated: List[int] = Field(default_factory=list)

    # Config
    video_request: VideoRequest
    output_dir: Path

    # Metrics
    api_calls: List[APICall] = Field(default_factory=list)
    total_cost: float = 0.0
```

---

## File Structure Reference

```
explainer_videos_v2/
├── src/
│   ├── main.py                      # Entry point
│   ├── config.py                    # Configuration constants
│   ├── schemas.py                   # Pydantic models
│   ├── agents/
│   │   ├── content_agent.py        # Content generation
│   │   ├── design_agent.py         # Slide design
│   │   └── vision_reviewer.py      # Quality control
│   ├── template_processor.py        # Template handling
│   ├── html_renderer.py             # Playwright rendering
│   ├── voice_generator.py           # TTS generation
│   ├── video_assembler.py           # Video composition
│   ├── api_logger.py                # Cost tracking
│   ├── checkpoints.py               # Resume functionality
│   ├── modify_slide.py              # Single slide regeneration
│   └── reassemble_video.py          # Video rebuilding
├── templates/
│   ├── base_template.html           # HTML template
│   ├── template_params.json         # Neutral theme
│   ├── template_params_blue.json    # Blue theme
│   ├── template_params_purple.json  # Purple theme
│   ├── template_params_green.json   # Green theme
│   └── logos/
│       ├── logo_neutral.png
│       ├── logo_aidc.png
│       └── ... (custom logos)
├── examples/
│   ├── example_linear_regression.json
│   ├── example_decision_tree_ml.json
│   ├── generative_vs_agentic_ai.json
│   ├── test_logo_switching.json
│   └── ... (10+ examples)
├── manual_configs/
│   ├── reference_material/          # Reference docs
│   ├── images/                      # Custom images
│   └── ... (manual scripts)
├── outputs/
│   └── [project_name]/
│       └── [timestamp]/
│           ├── videos/
│           │   └── [project_name].mp4
│           ├── slides/
│           │   ├── slide_00_v1.png
│           │   ├── slide_00_final.png
│           │   └── slide_00.html
│           ├── audio/
│           │   └── [project_name].mp3
│           ├── content_strategy.json
│           ├── metadata.json
│           ├── checkpoint.json
│           ├── generation.log
│           ├── api_calls_[timestamp].jsonl
│           └── api_summary_[timestamp].json
├── requirements.txt
├── .env
└── README.md
```

---

## Conclusion

This technical documentation provides comprehensive coverage of the Explainer Videos V2 system. The project represents a production-ready, enterprise-grade solution for automated explainer video generation with:

- **Professional Quality**: Vision-based quality control, brand consistency, accessibility
- **Cost Efficiency**: Typical videos cost $0.08-$0.33 with comprehensive tracking
- **Flexibility**: Multiple AI providers, themes, visual types, and customization options
- **Reliability**: Checkpoint recovery, error handling, retry logic
- **Extensibility**: Modular architecture, easy to add new agents or integrations

For questions or issues, please refer to the troubleshooting section or contact the development team.

---

**Last Updated**: December 16, 2025
**Version**: 2.0
**Documentation Author**: AI-Assisted Technical Documentation System
