# AI API Deep Dive - Explainer Videos V2

## Table of Contents
1. [Overview of AI Pipeline](#overview-of-ai-pipeline)
2. [API Call #1: Content Generation (GPT-5)](#api-call-1-content-generation-gpt-5)
3. [API Call #2: Web Research (GPT-4o)](#api-call-2-web-research-gpt-4o)
4. [API Call #3: Text Section HTML (GPT-5)](#api-call-3-text-section-html-gpt-5)
5. [API Call #4: Visual Generation - Pexels](#api-call-4-visual-generation---pexels)
6. [API Call #5: Visual Generation - Gemini](#api-call-5-visual-generation---gemini)
7. [API Call #6: Chart.js Graph (GPT-5)](#api-call-6-chartjs-graph-gpt-5)
8. [API Call #7: CSS/HTML Diagram (GPT-5)](#api-call-7-csshtml-diagram-gpt-5)
9. [API Call #8: Vision Review (GPT-4o-mini)](#api-call-8-vision-review-gpt-4o-mini)
10. [API Call #9: TTS - OpenAI](#api-call-9-tts---openai)
11. [API Call #10: TTS - ElevenLabs](#api-call-10-tts---elevenlabs)
12. [How HTML Diagrams Work](#how-html-diagrams-work)
13. [Structured Outputs with Pydantic](#structured-outputs-with-pydantic)
14. [Prompt Engineering Strategies](#prompt-engineering-strategies)
15. [API Cost Breakdown](#api-cost-breakdown)

---

## Overview of AI Pipeline

The explainer video generation system makes **10-15 AI API calls** per video, depending on configuration:

```
Video Request
    ↓
1. Content Generation (GPT-5) → ContentStrategy
    ↓ (optional)
2. Web Research (GPT-4o) → Research Summary
    ↓
FOR EACH SLIDE (typically 5-7 slides):
    ↓
3. Text Section HTML (GPT-5) → HTML snippet
    ↓
4. Visual Generation:
   - Pexels API → Stock photo URL
   OR
   - Gemini API → AI-generated image (base64)
   OR
   - Chart.js (GPT-5) → Chart config + HTML
   OR
   - CSS Diagram (GPT-5) → Styled HTML
    ↓
5. Vision Review (GPT-4o-mini) → SlideReview
    ↓ (if rejected, regenerate from step 3)
END LOOP
    ↓
6. TTS (OpenAI or ElevenLabs) → MP3 audio
```

**Total API Calls for a 5-slide video**:
- 1 content generation
- 0-1 web research (optional)
- 5 text HTML generations
- 5 visual generations (Pexels/Gemini/GPT)
- 5 vision reviews (optional, can be 10-15 with retries)
- 1 TTS generation
- **Total: 12-27 API calls per video**

---

## API Call #1: Content Generation (GPT-5)

### Purpose
Generate the complete content strategy for the entire video, including:
- Slide-by-slide breakdown
- Narration scripts
- Visual type selection (pexels/gemini/graph/diagram)
- Layout recommendations
- Timing calculations

### Model
**GPT-5** (`gpt-5` or `gpt-4o` fallback)

### API Method
```python
response = client.beta.chat.completions.parse(
    model="gpt-5",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    response_format=ContentStrategy,  # Pydantic model
    temperature=0.7
)
```

### System Prompt (Simplified)
```
You are an expert explainer video content strategist and scriptwriter.

Your task is to create a complete content strategy for an explainer video.

**Requirements**:
- Create {N} slides (1 intro + {N-2} main + 1 end)
- Total duration: {duration} seconds
- Speaking rate: 150 words per minute
- Style: Clear, engaging, educational

**For each slide, decide**:
1. **Layout** - MUST use EXACTLY one of:
   - `text-left-image-right` (60% text / 40% visual) - RECOMMENDED
   - `text-right-image-left` (40% text / 60% visual)
   - `center` (text only, no visual)

2. **Visual Type** - MUST use EXACTLY one of:
   - `pexels`: Stock photo (provide search keywords)
   - `gemini`: AI-generated image (provide detailed prompt)
   - `graph`: Chart.js chart (provide data structure)
   - `diagram`: CSS/HTML diagram (flowcharts, architectures)
   - `code`: Code block (provide code and language)
   - `table`: HTML table (provide headers and rows)
   - `none`: Text-only slide

3. **Text Content**:
   - Headline (required, keep concise)
   - Subheadline (optional)
   - Body text (optional, 1-2 sentences max)
   - Bullets (optional, any number needed)

4. **Narration**: Write clear voiceover script

**Gemini Image Style Guidelines** (CRITICAL when visual_type="gemini"):

COLOR PALETTE (use these theme colors consistently):
Primary: {primary_color}, Secondary: {secondary_color}, Accent: {accent_color}

1. **For People/Characters (Photorealistic)**:
   - Style: "Professional photorealistic style, high-quality photography"
   - Lighting: "Natural soft lighting, professional studio quality"
   - Quality: "Sharp focus, 4K quality, professional color grading"
   - Detail: "Crisp details, natural skin tones, authentic expressions"

2. **For Diagrams/Flowcharts/Technical**:
   - Style: "Clean professional diagram style, minimal design, high contrast"
   - Colors: "Use theme primary {primary_color} and accent {accent_color}"
   - Layout: "Well-organized layout, clear hierarchy, balanced spacing"
   - Elements: "Rounded corners, subtle shadows, modern flat design, crisp lines"
   - Text: "Clear labels with sans-serif font, high contrast (white text on dark)"
   - Quality: "Crisp edges, well-spaced elements, professional finish"

3. **For Concepts/Abstract**:
   - Style: "Modern minimalist illustration, clean vector style"
   - Colors: "Use theme palette consistently"
   - Composition: "Centered, balanced, generous white space"
   - Quality: "Smooth gradients, crisp edges, professional finish"

**CRITICAL REQUIREMENTS** - Every gemini_prompt MUST include:
1. The core subject/content
2. Appropriate style specification
3. Explicit color palette reference
4. Multiple quality descriptors
5. Background specification
6. Professional finish descriptors

**Example BAD**: "A flowchart showing the process"
**Example GOOD**: "A flowchart showing the 3-step process with labeled boxes
and arrows, clean professional diagram style, use primary color {primary} and
accent color {accent}, rounded rectangles with subtle shadows, clear white
labels on colored boxes, high contrast for readability, minimal design,
white background, crisp lines, well-spaced elements, professional finish"

Generate a professional, engaging explainer video strategy.
```

### User Prompt (Simplified)
```
Create a content strategy for this explainer video:

**Topic**: {title}
**Description**: {description}
**Duration**: {duration} seconds
**Slides**: {num_slides}
**Target Audience**: General audience (assume no prior knowledge)

**Capabilities Available**:
- Graphs/Charts: {enabled/disabled}
- Diagrams: {enabled/disabled}
- Code Blocks: {enabled/disabled}
- Image Source: {pexels/gemini/none}

{OPTIONAL: Web Research Results}
{OPTIONAL: Reference Material}

**Instructions**:
1. Break down the topic into logical sections (one per slide)
2. For each slide, decide the best layout and visual type
3. Write engaging narration that explains concepts clearly
4. Use bullets liberally - add as many points as needed
5. Ensure timing adds up correctly (~150 wpm)
```

### Response Format (Pydantic Structured Output)
```python
class SlideContent(BaseModel):
    headline: Optional[str]
    subheadline: Optional[str]
    body_text: Optional[str]
    bullets: Optional[List[str]]

    visual_type: Literal["pexels", "gemini", "graph", "diagram", "code", "table", "none"]

    # Conditional fields based on visual_type
    pexels_keywords: Optional[str]
    gemini_prompt: Optional[str]
    graph_data: Optional[GraphData]
    diagram_description: Optional[str]
    code_content: Optional[str]
    code_language: Optional[str]
    table_data: Optional[TableData]

    layout: Literal["text-left-image-right", "text-right-image-left", "center"]
    narration: str

class Slide(BaseModel):
    slide_num: int
    type: Literal["intro", "main", "end"]
    duration: float
    start_time: float
    content: SlideContent

class ContentStrategy(BaseModel):
    slides: List[Slide]
    full_script: str
    word_count: int
    total_duration: int
```

### Example Response
```json
{
  "slides": [
    {
      "slide_num": 0,
      "type": "intro",
      "duration": 8.0,
      "start_time": 0.0,
      "content": {
        "headline": "Understanding Machine Learning",
        "subheadline": "A Beginner's Guide",
        "visual_type": "none",
        "layout": "center",
        "narration": "Have you ever wondered how Netflix recommends movies you'll love, or how your phone recognizes your face? The answer is machine learning."
      }
    },
    {
      "slide_num": 1,
      "type": "main",
      "duration": 12.0,
      "start_time": 8.0,
      "content": {
        "headline": "What is Machine Learning?",
        "body_text": "Machine learning is a type of artificial intelligence that allows computers to learn from data without being explicitly programmed.",
        "bullets": [
          "Learns patterns from data",
          "Improves with experience",
          "Makes predictions automatically"
        ],
        "visual_type": "gemini",
        "gemini_prompt": "An abstract illustration of a brain made of interconnected digital nodes and neural pathways, modern minimalist illustration style, clean vector style, use primary color #1F2937 and accent color #3B82F6, smooth gradients transitioning from dark blue to light blue, crisp edges, white background, centered composition, balanced elements, generous white space, professional finish, high quality digital art",
        "layout": "text-left-image-right",
        "narration": "So what is machine learning? At its core, it's a type of artificial intelligence that allows computers to learn from data without being explicitly programmed. Instead of following a set of rules, machine learning systems discover patterns in data and improve their performance over time."
      }
    },
    {
      "slide_num": 2,
      "type": "main",
      "duration": 15.0,
      "start_time": 20.0,
      "content": {
        "headline": "Types of Machine Learning",
        "bullets": [
          "Supervised Learning: Learn from labeled examples",
          "Unsupervised Learning: Find patterns in unlabeled data",
          "Reinforcement Learning: Learn through trial and error"
        ],
        "visual_type": "diagram",
        "diagram_description": "Three boxes showing the three types of machine learning with arrows and simple icons",
        "layout": "text-left-image-right",
        "narration": "There are three main types of machine learning. Supervised learning uses labeled examples to train models. Unsupervised learning finds hidden patterns in unlabeled data. And reinforcement learning teaches systems through trial and error, like training a dog with rewards."
      }
    }
  ],
  "full_script": "Have you ever wondered how Netflix recommends...",
  "word_count": 450,
  "total_duration": 60
}
```

### Token Usage
- **Input tokens**: 800-1500 (system prompt + user prompt + architecture context)
- **Output tokens**: 1000-2500 (depends on number of slides)
- **Cost**: $0.010-0.030 per call (GPT-5: $5 per 1M input, $15 per 1M output)

---

## API Call #2: Web Research (GPT-4o)

### Purpose
Conduct real-time web research to gather accurate, up-to-date information before content generation.

### Model
**GPT-4o** (has web browsing capability)

### API Method
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a research assistant with web browsing capabilities. Provide accurate, well-sourced information."},
        {"role": "user", "content": research_prompt}
    ],
    temperature=0.7
)
```

### User Prompt
```
Research the topic: {topic_title}

Description: {topic_description}

Please conduct web research and provide a comprehensive summary covering:
1. Latest accurate information and statistics
2. Key facts and concepts
3. Common misconceptions to address
4. Current best practices or guidelines
5. Any recent updates or changes to this topic

Focus on authoritative sources and provide a well-structured summary
that can inform an educational explainer video.
```

### Example Response
```
Based on web research:

**Machine Learning in 2025 - Key Facts**

1. **Market Growth**: The global ML market reached $209B in 2024,
   with 38% year-over-year growth (Source: Gartner 2024 Report)

2. **Industry Adoption**:
   - Healthcare: 73% of hospitals use ML for diagnostics
   - Finance: 84% of banks deploy ML for fraud detection
   - Retail: 91% of e-commerce uses ML recommendations

3. **Key Algorithms**:
   - Deep learning dominates image/speech tasks
   - Transformer models (like GPT) for language tasks
   - Random forests for tabular data analysis

4. **Common Misconceptions**:
   - ML ≠ "replacing humans" - it augments human decisions
   - ML requires large datasets (not always true)
   - ML models are not "black boxes" - explainability exists

5. **Recent Updates**:
   - EU AI Act (2024) regulates ML deployment
   - New efficiency algorithms reduce training costs by 60%
   - Edge ML enables on-device processing

Sources: Gartner, MIT Technology Review, WHO Healthcare AI Guidelines
```

### Token Usage
- **Input tokens**: 200-400
- **Output tokens**: 500-1500
- **Cost**: $0.002-0.006 per call (GPT-4o: $2.50 per 1M input, $10 per 1M output)

### Integration with Content Generation
The research summary is injected into the Content Generation prompt:
```python
prompt = f"""
**Web Research Results** (use this latest information to inform content):
{research_context[:3000]}

Now create a content strategy...
"""
```

---

## API Call #3: Text Section HTML (GPT-5)

### Purpose
Generate clean, semantic HTML for the text portion of each slide.

### Model
**GPT-5** (`gpt-5` or `gpt-4o`)

### API Method
```python
response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "You are an expert HTML generator. Output clean, semantic HTML only."},
        {"role": "user", "content": text_html_prompt}
    ],
    temperature=0.3  # Lower temperature for consistent formatting
)
```

### User Prompt
```
Generate HTML for a slide's text section.

**Content**:
- Headline: {headline}
- Subheadline: {subheadline}
- Body: {body_text}
- Bullets: {bullets_json_array}

**Requirements**:
1. Use semantic HTML: <h1> for headline, <h2> for subheadline,
   <p> for body, <ul><li> for bullets
2. NO styling classes needed - CSS is pre-defined in template
3. Use <strong> for emphasized text
4. Use <em> for highlighted terms
5. Keep HTML clean and simple
6. Include ALL bullets provided (no limits!)

**Output**: Return ONLY the HTML, no markdown, no explanation.

Example output:
<h1>Your Headline Here</h1>
<p>Your body text here with <strong>bold text</strong> and <em>highlighted terms</em>.</p>
<ul>
  <li>First bullet point</li>
  <li>Second bullet point</li>
  <li>Third bullet point</li>
</ul>
```

### Example Response
```html
<h1>What is Machine Learning?</h1>
<p>Machine learning is a type of <em>artificial intelligence</em> that allows computers to <strong>learn from data</strong> without being explicitly programmed.</p>
<ul>
  <li>Learns patterns from data</li>
  <li>Improves with experience</li>
  <li>Makes predictions automatically</li>
</ul>
```

### Post-Processing
```python
html = response.choices[0].message.content

# Clean up any markdown artifacts
html = html.replace("```html", "").replace("```", "").strip()

# HTML is then injected into template:
# templates/layouts/text-left-image-right.html
```

### Token Usage
- **Input tokens**: 150-400 per slide
- **Output tokens**: 100-300 per slide
- **Cost**: $0.002-0.007 per slide
- **Total for 5 slides**: $0.010-0.035

---

## API Call #4: Visual Generation - Pexels

### Purpose
Fetch high-quality stock photos for slides.

### API
**Pexels REST API** (not AI, but important for visuals)

### HTTP Request
```python
headers = {"Authorization": PEXELS_API_KEY}
response = requests.get(
    "https://api.pexels.com/v1/search",
    headers=headers,
    params={
        "query": keywords,
        "per_page": 1,
        "orientation": "landscape"
    },
    timeout=10
)
```

### Example Request
```
GET https://api.pexels.com/v1/search?query=artificial+intelligence+technology&per_page=1&orientation=landscape
Authorization: YOUR_API_KEY
```

### Example Response
```json
{
  "total_results": 1247,
  "page": 1,
  "per_page": 1,
  "photos": [
    {
      "id": 8438918,
      "width": 5472,
      "height": 3648,
      "photographer": "John Doe",
      "src": {
        "original": "https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg",
        "large2x": "https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "large": "https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
      }
    }
  ]
}
```

### HTML Generation
```python
img_url = data['photos'][0]['src']['large2x']

html = f'''<img src="{img_url}"
           alt="{keywords}"
           style="max-width:100%; max-height:700px; border-radius:16px; object-fit:contain;">'''
```

### Cost
**Free** (with attribution)

### Error Handling
```python
if response.status_code != 200 or not data['photos']:
    # Fallback to gradient placeholder
    html = f'''<div style="width:600px; height:400px;
               background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               display:flex; align-items:center; justify-content:center;
               border-radius:12px; color:white; font-size:24px;">
        {keywords}
    </div>'''
```

---

## API Call #5: Visual Generation - Gemini

### Purpose
Generate custom AI images using Google's Imagen model.

### Model
**Gemini 3 Pro Image Preview** (`gemini-3-pro-image-preview`)

### API
**Google GenAI SDK** (new `google-genai` package, not legacy `google-generativeai`)

### API Method
```python
from google import genai
from google.genai import types

client = genai.Client(api_key=GEMINI_API_KEY)

# Prepare content
contents = [
    types.Content(
        role="user",
        parts=[types.Part.from_text(text=enhanced_prompt)]
    )
]

# Configure generation
generate_content_config = types.GenerateContentConfig(
    temperature=1,
    top_p=0.95,
    max_output_tokens=32768,
    response_modalities=["TEXT", "IMAGE"],
    safety_settings=[
        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF")
    ],
    image_config=types.ImageConfig(
        aspect_ratio="1:1",
        image_size="1K",
        output_mime_type="image/png"
    )
)

# Generate
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=contents,
    config=generate_content_config
)

# Extract image
for part in response.parts:
    if part.inline_data:
        image_bytes = part.inline_data.data
        mime_type = part.inline_data.mime_type
```

### Prompt Enhancement
The system enhances user prompts with quality guidelines:

**Input** (from Content Agent):
```
A flowchart showing 3 steps with arrows
```

**Enhanced Prompt** (by Design Agent):
```
A flowchart showing 3 steps with arrows, clean professional diagram style,
minimal design, high contrast for readability. Use theme colors:
primary #1F2937 and accent #3B82F6. Layout: well-organized with clear
hierarchy, balanced spacing between elements, generous padding around boxes.
Elements: rounded rectangles with subtle shadows (0 4px 12px rgba(0,0,0,0.1)),
modern flat design, crisp lines with 2px width. Text: clear sans-serif labels
with white text on colored boxes for high contrast, minimum 20px font size.
Quality: crisp edges, well-spaced elements with 30px gaps, professional finish.
Background: clean white background. Arrows: use solid color matching accent,
clear directional flow. Overall composition: centered, balanced, clear visual
hierarchy, suitable for presentation slides at 1080p resolution.
```

### Retry Logic (Exponential Backoff)
```python
GEMINI_MAX_RETRIES = 3

for attempt in range(GEMINI_MAX_RETRIES + 1):
    try:
        response = client.models.generate_content(...)
        return response
    except Exception as e:
        error_msg = str(e).lower()

        # Check if retryable error
        if any(err in error_msg for err in ['rate limit', 'quota', 'timeout', '429', '503', '500']):
            if attempt < GEMINI_MAX_RETRIES:
                wait_time = (attempt + 1) * 2  # 2s, 4s, 6s
                print(f"Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue

        # Non-retryable or max retries exceeded
        return fallback_placeholder(prompt, error_msg)
```

### HTML Generation
```python
# Convert image bytes to base64
image_base64 = base64.b64encode(image_bytes).decode('utf-8')

# Embed in HTML
html = f'''<div style="width:600px; height:400px; display:flex;
           align-items:center; justify-content:center;
           border-radius:12px; overflow:hidden;">
    <img src="data:{mime_type};base64,{image_base64}"
         alt="{prompt[:100]}"
         style="max-width:100%; max-height:100%; object-fit:contain;" />
</div>'''
```

### Error Placeholder
```python
def _create_error_placeholder(prompt: str, error_msg: str) -> str:
    return f'''<div style="width:600px; height:400px;
               background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
               display:flex; flex-direction:column; align-items:center;
               justify-content:center; border-radius:12px;
               color:white; padding:40px; text-align:center;">
        <div style="font-size:24px; font-weight:bold; margin-bottom:16px;">
            ⚠️ Image Generation Failed
        </div>
        <div style="font-size:16px; opacity:0.9; margin-bottom:12px;">
            {error_msg}
        </div>
        <div style="font-size:14px; opacity:0.7; font-style:italic;">
            Prompt: {prompt[:80]}...
        </div>
    </div>'''
```

### Cost
**$0.04 per image** (Google Gemini Imagen pricing)

---

## API Call #6: Chart.js Graph (GPT-5)

### Purpose
Generate Chart.js configuration and HTML canvas for data visualizations.

### Model
**GPT-5** (`gpt-5` or `gpt-4o`)

### API Method
```python
response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "You are an expert Chart.js developer. Output clean HTML and JavaScript only."},
        {"role": "user", "content": graph_prompt}
    ],
    temperature=0.3
)
```

### User Prompt
```
Generate Chart.js code for a graph.

**Graph Data**:
{
  "chart_type": "bar",
  "labels": ["Q1", "Q2", "Q3", "Q4"],
  "datasets": [
    {
      "label": "Revenue",
      "data": [12000, 19000, 15000, 23000],
      "backgroundColor": "#3B82F6"
    }
  ],
  "title": "Quarterly Revenue"
}

**Requirements**:
1. Return TWO parts separated by "---SCRIPT---":
   - Part 1: HTML with <canvas> element (id="chart")
   - Part 2: JavaScript Chart.js configuration

2. Canvas should be sized appropriately (max 800x600)

3. Chart.js config should:
   - Match the data provided
   - Use professional styling
   - Include proper labels
   - Use color scheme: #3B82F6 (blue), #8B5CF6 (purple), #10B981 (green)
   - Disable legend if single dataset
   - Use large readable fonts (20px+)

**Example Output**:
<canvas id="chart" width="800" height="600"></canvas>
---SCRIPT---
<script>
const ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            data: [12000, 19000, 15000, 23000],
            backgroundColor: '#3B82F6',
            borderRadius: 8
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Quarterly Revenue',
                font: { size: 28, weight: 'bold' }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { font: { size: 20 } }
            },
            x: {
                ticks: { font: { size: 20 } }
            }
        }
    }
});
</script>

Output ONLY the code, no markdown, no explanation.
```

### Example Response
```html
<canvas id="chart" width="800" height="600"></canvas>
---SCRIPT---
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
const ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        datasets: [{
            label: 'Revenue ($)',
            data: [12000, 19000, 15000, 23000],
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 2,
            borderRadius: 8,
            hoverBackgroundColor: '#2563EB'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Quarterly Revenue',
                font: { size: 32, weight: 'bold' },
                color: '#1F2937',
                padding: { top: 20, bottom: 20 }
            },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                titleFont: { size: 18 },
                bodyFont: { size: 16 },
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(31, 41, 55, 0.1)',
                    lineWidth: 1
                },
                ticks: {
                    font: { size: 20 },
                    color: '#6B7280',
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 20 },
                    color: '#6B7280'
                }
            }
        }
    }
});
</script>
```

### Parsing Response
```python
output = response.choices[0].message.content
output = output.replace("```html", "").replace("```javascript", "").replace("```", "").strip()

# Split into HTML and script
if "---SCRIPT---" in output:
    parts = output.split("---SCRIPT---")
    canvas_html = parts[0].strip()
    script = parts[1].strip()
    return canvas_html, script
```

### Integration with Template
```html
<!-- Template: layouts/text-left-image-right.html -->
<div class="visual-section">
    {VISUAL_SECTION}  <!-- Canvas HTML inserted here -->
</div>

<script>
    {SCRIPTS}  <!-- Chart.js script inserted here -->
</script>
```

### Rendering Considerations
The HTMLRenderer waits for Chart.js to render:
```python
with HTMLRenderer() as renderer:
    image_path = renderer.render_html_to_image(
        html,
        output_path,
        wait_for_charts=True,  # Waits 2 seconds for Chart.js animation
        verbose=True
    )
```

### Token Usage
- **Input tokens**: 200-500 per chart
- **Output tokens**: 300-800 per chart
- **Cost**: $0.004-0.015 per chart

---

## API Call #7: CSS/HTML Diagram (GPT-5)

### Purpose
Generate flowcharts, process diagrams, and architecture diagrams using pure CSS and HTML.

### Model
**GPT-5** (`gpt-5` or `gpt-4o`)

### API Method
```python
response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "You are an expert at creating clean, professional diagrams using HTML and CSS. Output only HTML code."},
        {"role": "user", "content": diagram_prompt}
    ],
    temperature=0.3
)
```

### User Prompt
```
Generate a clean CSS/HTML diagram based on this description:
{description}

**Requirements**:
1. Use semantic HTML with divs and spans
2. Style with inline CSS (no external stylesheets)
3. Use these theme colors:
   - Primary: {primary_color}
   - Secondary: {secondary_color}
   - Accent: {accent_color}
   - Text: {text_color}
4. Create boxes with borders, arrows with CSS, labels with text
5. Use flexbox for layout
6. Make it visually clear and professional
7. Max width: 800px, max height: 600px
8. Use arrows (→, ↓, ←, ↑) or CSS triangles for connections
9. Add subtle shadows: box-shadow: 0 4px 12px rgba(0,0,0,0.1)

**Common patterns**:
- Flowchart: Boxes with arrows between them
- Process flow: Sequential boxes left-to-right or top-to-bottom
- Architecture: Layered boxes showing system components
- Timeline: Horizontal or vertical progression with dates/events

Output ONLY the HTML, no markdown, no explanation.

Example structure:
<div style="display:flex; flex-direction:column; align-items:center;
     gap:20px; padding:40px;">
  <div style="background:{primary}; color:white; padding:20px 40px;
       border-radius:12px; font-size:24px; font-weight:600;">
    Step 1: Input
  </div>
  <div style="font-size:40px; color:{secondary};">↓</div>
  <div style="background:{secondary}; color:white; padding:20px 40px;
       border-radius:12px; font-size:24px; font-weight:600;">
    Step 2: Process
  </div>
  <div style="font-size:40px; color:{accent};">↓</div>
  <div style="background:{accent}; color:white; padding:20px 40px;
       border-radius:12px; font-size:24px; font-weight:600;">
    Step 3: Output
  </div>
</div>
```

### Example Input
```
Description: "Three-step machine learning workflow:
Data Collection → Model Training → Prediction"
```

### Example Response
```html
<div style="display:flex; flex-direction:column; align-items:center;
     gap:30px; padding:50px; max-width:800px; margin:0 auto;">

  <!-- Step 1: Data Collection -->
  <div style="background:#1F2937; color:white; padding:30px 60px;
       border-radius:16px; font-size:28px; font-weight:600;
       box-shadow:0 8px 16px rgba(0,0,0,0.15); min-width:400px;
       text-align:center; position:relative;">
    <div style="font-size:32px; margin-bottom:10px;">📊</div>
    Data Collection
    <div style="font-size:18px; font-weight:400; margin-top:10px;
         opacity:0.9;">Gather training examples</div>
  </div>

  <!-- Arrow -->
  <div style="display:flex; flex-direction:column; align-items:center;">
    <div style="font-size:48px; color:#3B82F6; line-height:1;">↓</div>
    <div style="width:4px; height:20px; background:#3B82F6;"></div>
  </div>

  <!-- Step 2: Model Training -->
  <div style="background:#3B82F6; color:white; padding:30px 60px;
       border-radius:16px; font-size:28px; font-weight:600;
       box-shadow:0 8px 16px rgba(59,130,246,0.3); min-width:400px;
       text-align:center;">
    <div style="font-size:32px; margin-bottom:10px;">🧠</div>
    Model Training
    <div style="font-size:18px; font-weight:400; margin-top:10px;
         opacity:0.9;">Learn patterns from data</div>
  </div>

  <!-- Arrow -->
  <div style="display:flex; flex-direction:column; align-items:center;">
    <div style="font-size:48px; color:#10B981; line-height:1;">↓</div>
    <div style="width:4px; height:20px; background:#10B981;"></div>
  </div>

  <!-- Step 3: Prediction -->
  <div style="background:#10B981; color:white; padding:30px 60px;
       border-radius:16px; font-size:28px; font-weight:600;
       box-shadow:0 8px 16px rgba(16,185,129,0.3); min-width:400px;
       text-align:center;">
    <div style="font-size:32px; margin-bottom:10px;">🎯</div>
    Prediction
    <div style="font-size:18px; font-weight:400; margin-top:10px;
         opacity:0.9;">Make accurate forecasts</div>
  </div>
</div>
```

### Advanced Example: Branching Flowchart
```html
<div style="display:flex; flex-direction:column; align-items:center;
     padding:40px; max-width:900px;">

  <!-- Start -->
  <div style="background:#1F2937; color:white; padding:20px 40px;
       border-radius:50%; font-size:22px; font-weight:600;">
    Start
  </div>

  <div style="font-size:40px; color:#6B7280; margin:10px 0;">↓</div>

  <!-- Decision Diamond -->
  <div style="width:220px; height:220px; background:#3B82F6;
       transform:rotate(45deg); position:relative;
       box-shadow:0 6px 12px rgba(59,130,246,0.3);">
    <div style="position:absolute; top:50%; left:50%;
         transform:translate(-50%, -50%) rotate(-45deg);
         color:white; font-size:20px; font-weight:600;
         text-align:center; width:180px;">
      Data Available?
    </div>
  </div>

  <!-- Branches -->
  <div style="display:flex; gap:80px; margin-top:40px; width:100%;">

    <!-- Left branch (No) -->
    <div style="flex:1; display:flex; flex-direction:column;
         align-items:center;">
      <div style="font-size:20px; color:#EF4444; font-weight:600;
           margin-bottom:20px;">← No</div>
      <div style="background:#EF4444; color:white; padding:20px 30px;
           border-radius:12px; font-size:20px; text-align:center;
           box-shadow:0 4px 8px rgba(239,68,68,0.3);">
        Collect<br/>More Data
      </div>
    </div>

    <!-- Right branch (Yes) -->
    <div style="flex:1; display:flex; flex-direction:column;
         align-items:center;">
      <div style="font-size:20px; color:#10B981; font-weight:600;
           margin-bottom:20px;">Yes →</div>
      <div style="background:#10B981; color:white; padding:20px 30px;
           border-radius:12px; font-size:20px; text-align:center;
           box-shadow:0 4px 8px rgba(16,185,129,0.3);">
        Proceed to<br/>Training
      </div>
    </div>
  </div>
</div>
```

### Token Usage
- **Input tokens**: 250-600 per diagram
- **Output tokens**: 400-1200 per diagram
- **Cost**: $0.005-0.020 per diagram

---

## API Call #8: Vision Review (GPT-4o-mini)

### Purpose
Analyze rendered slide screenshots for quality issues using computer vision.

### Model
**GPT-4o-mini** (lower cost vision model)

### API Method
```python
# Load slide image as base64
with open(image_path, 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode()

response = client.beta.chat.completions.parse(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": user_prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image_b64}",
                        "detail": "high"  # High detail for text readability
                    }
                }
            ]
        }
    ],
    response_format=SlideReview,  # Pydantic structured output
    temperature=0.3  # Low temperature for consistent reviews
)
```

### System Prompt
```
You are an expert quality reviewer for educational explainer video slides.

Your task is to assess slide quality across multiple dimensions:

**Quality Criteria:**

1. **Text Readability** (Critical)
   - All text must be visible and not cut off
   - Font size should be readable (minimum 18px equivalent)
   - Text should not overflow containers
   - Good contrast between text and background
   - No text overlapping with images

2. **Layout Quality** (Critical)
   - No overlapping elements
   - Proper spacing and padding
   - Aligned elements (not misaligned)
   - Balanced composition
   - Elements within slide boundaries

3. **Visual Appropriateness** (Important)
   - Images: Relevant to the slide topic, professional quality
   - Charts: Data visualization makes sense for the content
   - Diagrams: Clear representation of concept
   - Code: Properly formatted, not too much code
   - Overall: Visual supports the message

4. **Colors & Contrast** (Important)
   - Professional color scheme
   - Sufficient contrast for readability (text vs background)
   - Not too many competing colors
   - Consistent with slide theme

5. **Chart/Graph Clarity** (If applicable)
   - Axis labels present and readable
   - Legend included if multiple datasets
   - Tick labels not overlapping
   - Chart title clear
   - Appropriate scale/range

**Scoring Guide:**
- 9-10: Excellent quality, no issues
- 7-8: Good quality, minor improvements possible
- 5-6: Acceptable but has issues that should be fixed
- 3-4: Poor quality, significant problems
- 1-2: Unusable, major problems

**Decision Making:**
- Set `approved: true` if score >= 7 OR if issues are purely cosmetic
- Set `approved: false` if there are functional problems
  (text cut off, overlap, illegible, wrong image)
- Be specific in issues and suggested_fixes
- Focus on actionable feedback
```

### User Prompt
```
Review this slide (#{slide_num}, type: {slide_type}).

**Expected Content:**
- Headline: "{headline}"
- Body text: "{body_text}"
- Bullet points: {num_bullets} items

**Expected Visual:** {visual_type}
{visual_specific_checks}

**Layout:** {layout}

**Your Task:**
1. Examine the slide carefully
2. Check all quality criteria (text, layout, visual, colors, charts)
3. Identify any specific issues
4. Provide actionable fixes if issues found
5. Give an overall quality score (1-10)
6. Decide if approved based on score and issue severity

**Common Issues to Watch For:**
- Text overflow (headline or bullets cut off at edges)
- Low contrast (light text on light background)
- Overlapping elements (text over image, etc.)
- Irrelevant images (stock photo doesn't match topic)
- Missing chart labels or legends
- Tiny text that's hard to read
- Misaligned elements

Provide your assessment:
```

### Response Format (Pydantic)
```python
class SlideReview(BaseModel):
    approved: bool
    score: int  # 1-10

    # Specific checks
    text_readable: bool
    layout_clean: bool
    visual_appropriate: bool
    colors_good: bool
    chart_clear: Optional[bool]

    # Feedback
    issues: List[str]
    suggested_fixes: List[str]
    reasoning: str
```

### Example Response
```json
{
  "approved": false,
  "score": 5,
  "text_readable": true,
  "layout_clean": false,
  "visual_appropriate": true,
  "colors_good": true,
  "chart_clear": null,
  "issues": [
    "Bullet point text is cut off at the bottom of the slide",
    "Headline overlaps slightly with the top border",
    "Image could be larger to better fill the visual area"
  ],
  "suggested_fixes": [
    "Reduce body text font size by 10% to fit all bullets",
    "Add 20px top padding to prevent headline overlap",
    "Increase image width from 40% to 50% of visual section"
  ],
  "reasoning": "The slide has good color contrast and the visual is relevant, but there are layout issues causing text overflow. The headline is too close to the top edge and the last bullet point is cut off at the bottom. These are functional problems that will affect readability, so the slide should be regenerated with adjusted spacing."
}
```

### Retry Logic
```python
MAX_VISION_RETRIES = 3
APPROVAL_THRESHOLD = 7

for attempt in range(1, MAX_VISION_RETRIES + 1):
    review = await review_slide(slide_png, slide_content)

    if review.approved or review.score >= APPROVAL_THRESHOLD:
        print(f"✅ Slide approved (score: {review.score}/10)")
        return slide_png

    print(f"⚠️ Slide needs improvement (score: {review.score}/10)")
    print(f"   Issues: {', '.join(review.issues[:2])}")

    if attempt >= MAX_VISION_RETRIES:
        print(f"   Using best attempt after {attempt} tries")
        return select_best_slide(all_attempts)

    # Regenerate with feedback
    print(f"   Regenerating with fixes...")
    slide_png = await regenerate_slide(slide, review.suggested_fixes)
```

### Token Usage
- **Input tokens**: 300-600 per review (prompt + image tokens)
- **Output tokens**: 100-250 per review
- **Cost**: $0.001-0.003 per review (GPT-4o-mini: $0.15 per 1M input, $0.60 per 1M output)
- **With retries**: $0.003-0.009 per slide (3 attempts avg)

---

## API Call #9: TTS - OpenAI

### Purpose
Convert narration script to speech audio.

### Model
**tts-1-hd** (high-definition text-to-speech)

### Available Voices
- `alloy` - Neutral, versatile (masculine leaning)
- `echo` - Clear, professional (masculine)
- `fable` - Warm, storytelling (neutral)
- `onyx` - Deep, authoritative (masculine)
- `nova` - Friendly, energetic (feminine)
- `shimmer` - Smooth, calming (feminine)

### API Method
```python
from openai import OpenAI

client = OpenAI(api_key=OPENAI_API_KEY)

response = client.audio.speech.create(
    model="tts-1-hd",
    voice="nova",
    input=script,
    response_format="mp3",
    speed=0.83  # Adjusted to match 150 WPM target
)

# Save to file
response.stream_to_file(output_path)
```

### Speed Calibration
OpenAI TTS default speed (~180 WPM) is faster than the target 150 WPM:

```python
WORDS_PER_MINUTE = 150
DEFAULT_OPENAI_WPM = 180

# Calculate speed adjustment
TTS_SPEED = WORDS_PER_MINUTE / DEFAULT_OPENAI_WPM
# TTS_SPEED = 150 / 180 = 0.83

# OpenAI speed range: 0.25 (slow) to 4.0 (fast)
```

### Example Input
```python
script = """Have you ever wondered how Netflix recommends movies you'll love,
or how your phone recognizes your face? The answer is machine learning.
Machine learning is a type of artificial intelligence that allows computers
to learn from data without being explicitly programmed. Instead of following
a set of rules, machine learning systems discover patterns in data and improve
their performance over time."""

generate_narration(
    script=script,
    output_filename="narration.mp3",
    voice="nova",
    model="tts-1-hd",
    audio_dir=Path("outputs/audio"),
    tts_provider="openai"
)
```

### Output
- **Format**: MP3
- **Sample rate**: 24kHz (tts-1-hd)
- **Bitrate**: 48 kbps
- **File size**: ~0.5 MB per minute of audio

### Duration Calculation
```python
from moviepy import AudioFileClip

audio = AudioFileClip(str(audio_path))
duration = audio.duration  # seconds
audio.close()
```

### Token Usage & Cost
- **Charged per character**: Not tokens
- **Cost**: $15 per 1M characters ($0.015 per 1K chars)
- **Example**: 500-character script = $0.0075

---

## API Call #10: TTS - ElevenLabs

### Purpose
Premium text-to-speech alternative with higher quality voices.

### Available Voices
- **Elizabeth** (voice ID: `HXOwtW4XU7Ne6iOiDHTl`) - American accent, professional
- **Rachel** (voice ID: `21m00Tcm4TlvDq8ikWAM`) - British accent, warm

### API Method
```python
import requests

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELIZABETH_VOICE_ID = "HXOwtW4XU7Ne6iOiDHTl"

url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELIZABETH_VOICE_ID}"
headers = {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json"
}

# ElevenLabs speed adjustment (different scale than OpenAI)
# ElevenLabs default: 1.0 (~160 WPM), range: 0.7-1.5
elevenlabs_speed = min(max(TTS_SPEED * 1.13, 0.7), 1.5)

data = {
    "text": script,
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.5,         # Voice consistency
        "similarity_boost": 0.75, # Clarity
        "speed": elevenlabs_speed # Speaking speed
    }
}

response = requests.post(url, headers=headers, json=data, timeout=120)

if response.status_code == 200:
    with open(output_path, 'wb') as f:
        f.write(response.content)
```

### Voice Settings Explained
```python
voice_settings = {
    "stability": 0.5,
    # 0.0 = More variable, expressive
    # 1.0 = More consistent, stable
    # Recommended: 0.4-0.7 for narration

    "similarity_boost": 0.75,
    # 0.0 = More generic voice
    # 1.0 = Closer to original voice sample
    # Recommended: 0.7-0.9 for clarity

    "speed": 0.94
    # 0.7 = Slow speech
    # 1.0 = Normal speed (~160 WPM)
    # 1.5 = Fast speech
    # Recommended: 0.9-1.0 for explainers
}
```

### Output
- **Format**: MP3
- **Sample rate**: 44.1kHz (higher than OpenAI)
- **Bitrate**: 128 kbps (higher quality)
- **File size**: ~1 MB per minute of audio

### Cost
- **$0.30 per 1K characters** (20x more expensive than OpenAI)
- **Example**: 500-character script = $0.15

### Quality Comparison
| Feature | OpenAI TTS | ElevenLabs |
|---------|-----------|------------|
| Sample rate | 24 kHz | 44.1 kHz |
| Bitrate | 48 kbps | 128 kbps |
| Naturalness | Good | Excellent |
| Emotional range | Limited | High |
| Voice options | 6 | Hundreds |
| Cost | $0.015/1K | $0.30/1K |
| Speed | Faster API | Slower API |

---

## How HTML Diagrams Work

### Overview
The system generates flowcharts, process diagrams, and architecture visualizations using pure HTML and CSS - no SVG, no canvas, just styled divs.

### Why HTML/CSS Diagrams?

1. **Simplicity**: GPT can generate HTML/CSS more reliably than SVG paths
2. **Flexibility**: Easy to adjust spacing, colors, fonts
3. **Accessibility**: Screen readers can read text in divs
4. **Performance**: Fast rendering in Playwright
5. **Theme Integration**: Automatically uses theme colors

### Anatomy of a Diagram

#### 1. Container
```html
<div style="display:flex; flex-direction:column; align-items:center;
     gap:30px; padding:50px; max-width:800px; margin:0 auto;">
    <!-- Diagram content here -->
</div>
```

**Key Properties**:
- `display:flex` - Flexbox for easy alignment
- `flex-direction:column` - Stack elements vertically
- `align-items:center` - Center horizontally
- `gap:30px` - Spacing between elements
- `max-width:800px` - Constrain diagram size

#### 2. Boxes/Nodes
```html
<div style="background:#1F2937; color:white; padding:30px 60px;
     border-radius:16px; font-size:28px; font-weight:600;
     box-shadow:0 8px 16px rgba(0,0,0,0.15); min-width:400px;
     text-align:center;">
    Step 1: Data Collection
</div>
```

**Key Properties**:
- `background` - Fill color (theme primary/secondary/accent)
- `color:white` - Text color (high contrast)
- `padding:30px 60px` - Internal spacing
- `border-radius:16px` - Rounded corners
- `font-size:28px` - Large readable text
- `box-shadow` - 3D depth effect
- `min-width:400px` - Ensure consistent sizing
- `text-align:center` - Center text

#### 3. Arrows/Connectors
```html
<!-- Simple arrow character -->
<div style="font-size:48px; color:#3B82F6; line-height:1;">↓</div>

<!-- Arrow with line -->
<div style="display:flex; flex-direction:column; align-items:center;">
    <div style="font-size:48px; color:#3B82F6;">↓</div>
    <div style="width:4px; height:20px; background:#3B82F6;"></div>
</div>

<!-- CSS triangle arrow -->
<div style="width:0; height:0;
     border-left:20px solid transparent;
     border-right:20px solid transparent;
     border-top:30px solid #3B82F6;"></div>
```

**Unicode Arrows**:
- `→` Right arrow (U+2192)
- `↓` Down arrow (U+2193)
- `←` Left arrow (U+2190)
- `↑` Up arrow (U+2191)
- `↔` Left-right arrow (U+2194)
- `⇒` Double right arrow (U+21D2)

#### 4. Labels/Annotations
```html
<div style="font-size:18px; font-weight:400; margin-top:10px;
     opacity:0.9; color:white;">
    Gather training examples
</div>
```

### Complete Example: 3-Step Process Flow

```html
<div style="display:flex; flex-direction:column; align-items:center;
     gap:25px; padding:40px; background:linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
     border-radius:20px;">

  <!-- Title -->
  <h2 style="font-size:36px; font-weight:700; color:#1F2937; margin-bottom:20px;">
    Machine Learning Workflow
  </h2>

  <!-- Step 1 -->
  <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       color:white; padding:25px 50px; border-radius:14px;
       font-size:24px; font-weight:600; box-shadow:0 6px 20px rgba(102, 126, 234, 0.4);
       min-width:350px; text-align:center; position:relative;">
    <div style="font-size:36px; margin-bottom:8px;">📊</div>
    <div>Step 1: Data Collection</div>
    <div style="font-size:16px; font-weight:400; margin-top:8px; opacity:0.95;">
      Gather and prepare training datasets
    </div>

    <!-- Number badge -->
    <div style="position:absolute; top:-15px; left:-15px;
         width:40px; height:40px; border-radius:50%;
         background:#FFD700; color:#1F2937; display:flex;
         align-items:center; justify-content:center;
         font-size:20px; font-weight:700; box-shadow:0 4px 8px rgba(0,0,0,0.2);">
      1
    </div>
  </div>

  <!-- Arrow with label -->
  <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
    <div style="font-size:42px; color:#667eea;">↓</div>
    <div style="width:3px; height:30px; background:linear-gradient(180deg, #667eea 0%, #764ba2 100%);"></div>
    <div style="background:#667eea; color:white; padding:6px 16px;
         border-radius:20px; font-size:14px; font-weight:600;">
      Process
    </div>
  </div>

  <!-- Step 2 -->
  <div style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
       color:white; padding:25px 50px; border-radius:14px;
       font-size:24px; font-weight:600; box-shadow:0 6px 20px rgba(240, 147, 251, 0.4);
       min-width:350px; text-align:center; position:relative;">
    <div style="font-size:36px; margin-bottom:8px;">🧠</div>
    <div>Step 2: Model Training</div>
    <div style="font-size:16px; font-weight:400; margin-top:8px; opacity:0.95;">
      Train AI model on collected data
    </div>

    <div style="position:absolute; top:-15px; left:-15px;
         width:40px; height:40px; border-radius:50%;
         background:#FFD700; color:#1F2937; display:flex;
         align-items:center; justify-content:center;
         font-size:20px; font-weight:700; box-shadow:0 4px 8px rgba(0,0,0,0.2);">
      2
    </div>
  </div>

  <!-- Arrow -->
  <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
    <div style="font-size:42px; color:#f093fb;">↓</div>
    <div style="width:3px; height:30px; background:linear-gradient(180deg, #f093fb 0%, #f5576c 100%);"></div>
    <div style="background:#f093fb; color:white; padding:6px 16px;
         border-radius:20px; font-size:14px; font-weight:600;">
      Deploy
    </div>
  </div>

  <!-- Step 3 -->
  <div style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
       color:white; padding:25px 50px; border-radius:14px;
       font-size:24px; font-weight:600; box-shadow:0 6px 20px rgba(79, 172, 254, 0.4);
       min-width:350px; text-align:center; position:relative;">
    <div style="font-size:36px; margin-bottom:8px;">🎯</div>
    <div>Step 3: Prediction</div>
    <div style="font-size:16px; font-weight:400; margin-top:8px; opacity:0.95;">
      Make accurate forecasts on new data
    </div>

    <div style="position:absolute; top:-15px; left:-15px;
         width:40px; height:40px; border-radius:50%;
         background:#FFD700; color:#1F2937; display:flex;
         align-items:center; justify-content:center;
         font-size:20px; font-weight:700; box-shadow:0 4px 8px rgba(0,0,0,0.2);">
      3
    </div>
  </div>

</div>
```

### Advanced: Branching Flowchart

```html
<div style="padding:50px; max-width:1000px; margin:0 auto;">

  <!-- Start node -->
  <div style="display:flex; justify-content:center; margin-bottom:30px;">
    <div style="width:140px; height:140px; border-radius:50%;
         background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
         display:flex; align-items:center; justify-content:center;
         color:white; font-size:24px; font-weight:700;
         box-shadow:0 8px 20px rgba(102, 126, 234, 0.4);">
      START
    </div>
  </div>

  <div style="text-align:center; font-size:40px; color:#667eea; margin:20px 0;">↓</div>

  <!-- Decision diamond -->
  <div style="display:flex; justify-content:center; margin:30px 0;">
    <div style="width:200px; height:200px; background:#3B82F6;
         transform:rotate(45deg); position:relative;
         box-shadow:0 10px 30px rgba(59, 130, 246, 0.4);">
      <div style="position:absolute; top:50%; left:50%;
           transform:translate(-50%, -50%) rotate(-45deg);
           color:white; font-size:22px; font-weight:600;
           text-align:center; width:170px; line-height:1.3;">
        Data<br/>Available?
      </div>
    </div>
  </div>

  <!-- Branches -->
  <div style="display:flex; justify-content:space-around; margin-top:50px;">

    <!-- Left: NO branch -->
    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
      <div style="font-size:24px; color:#EF4444; font-weight:700;
           background:white; padding:8px 20px; border-radius:20px;
           box-shadow:0 4px 12px rgba(239, 68, 68, 0.3); margin-bottom:30px;">
        ← NO
      </div>

      <div style="background:linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
           color:white; padding:30px 40px; border-radius:16px;
           font-size:22px; font-weight:600; text-align:center;
           box-shadow:0 8px 20px rgba(255, 107, 107, 0.4); min-width:220px;">
        <div style="font-size:32px; margin-bottom:10px;">⚠️</div>
        Collect More<br/>Data
      </div>

      <!-- Loop back arrow -->
      <div style="margin-top:20px; font-size:28px; color:#EF4444;">↑</div>
      <div style="font-size:14px; color:#6B7280; font-weight:600;
           background:#FEE2E2; padding:6px 12px; border-radius:12px; margin-top:10px;">
        Retry
      </div>
    </div>

    <!-- Right: YES branch -->
    <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
      <div style="font-size:24px; color:#10B981; font-weight:700;
           background:white; padding:8px 20px; border-radius:20px;
           box-shadow:0 4px 12px rgba(16, 185, 129, 0.3); margin-bottom:30px;">
        YES →
      </div>

      <div style="background:linear-gradient(135deg, #51cf66 0%, #0ca678 100%);
           color:white; padding:30px 40px; border-radius:16px;
           font-size:22px; font-weight:600; text-align:center;
           box-shadow:0 8px 20px rgba(81, 207, 102, 0.4); min-width:220px;">
        <div style="font-size:32px; margin-bottom:10px;">✅</div>
        Proceed to<br/>Training
      </div>

      <div style="margin-top:20px; font-size:28px; color:#10B981;">↓</div>
      <div style="font-size:14px; color:#6B7280; font-weight:600;
           background:#D1FAE5; padding:6px 12px; border-radius:12px; margin-top:10px;">
        Continue
      </div>
    </div>

  </div>

</div>
```

### GPT Prompt Engineering for Diagrams

The system provides GPT with:

1. **Theme colors** from template
2. **Description** of what to visualize
3. **Common patterns** to follow
4. **Styling requirements** (shadows, borders, etc.)
5. **Layout constraints** (max width/height)

GPT then generates creative HTML/CSS that:
- Uses theme colors consistently
- Creates appropriate shapes and flows
- Adds visual hierarchy
- Includes labels and annotations
- Applies professional styling

### Rendering Process

1. **Generate HTML** (GPT-5)
2. **Inject into template** (TemplateProcessor)
3. **Render with Playwright** (Chromium headless)
4. **Screenshot to PNG** (1920x1080)
5. **Optional vision review** (GPT-4o-mini)

---

## Structured Outputs with Pydantic

### Overview
The system uses OpenAI's **Structured Outputs** feature (beta) to force GPT responses into Pydantic models.

### How It Works

#### 1. Define Pydantic Model
```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class SlideContent(BaseModel):
    headline: Optional[str] = Field(None, description="Main headline")
    bullets: Optional[List[str]] = Field(None, description="Bullet points")
    visual_type: Literal["pexels", "gemini", "graph", "diagram", "code", "table", "none"]
    pexels_keywords: Optional[str] = None
    layout: Literal["text-left-image-right", "text-right-image-left", "center"]
    narration: str = Field(..., description="Voiceover script")

class Slide(BaseModel):
    slide_num: int = Field(..., ge=0)
    type: Literal["intro", "main", "end"]
    duration: float = Field(..., gt=0)
    content: SlideContent

class ContentStrategy(BaseModel):
    slides: List[Slide]
    full_script: str
    word_count: int
    total_duration: int
```

#### 2. Call API with Structured Output
```python
response = client.beta.chat.completions.parse(
    model="gpt-5",
    messages=[...],
    response_format=ContentStrategy  # Pass Pydantic model
)

# Response is automatically parsed
strategy = response.choices[0].message.parsed
# strategy is a ContentStrategy instance
```

#### 3. Validation
Pydantic automatically validates:
- **Required fields**: Must be present
- **Types**: String, int, float, bool, list, etc.
- **Constraints**: `ge=0` (greater than or equal), `gt=0` (greater than), `max_length`, etc.
- **Enums**: `Literal` enforces specific values
- **Nested models**: Validates entire tree

### Benefits

1. **Type Safety**: No need to manually parse JSON
2. **Validation**: Automatic constraint checking
3. **Documentation**: Field descriptions guide GPT
4. **Consistency**: GPT must follow schema exactly
5. **Error Handling**: Pydantic raises clear errors

### Example Error
```python
# GPT returns invalid layout
{
  "layout": "custom-layout"  # Not in Literal options
}

# Pydantic raises ValidationError
ValidationError: 1 validation error for SlideContent
layout
  Input should be 'text-left-image-right',
  'text-right-image-left' or 'center'
  (type=literal_error)
```

### All Structured Outputs in System

1. **ContentStrategy** - Content Agent output
2. **SlideReview** - Vision Reviewer output
3. **GraphData** - Chart.js configuration
4. **TableData** - HTML table configuration

---

## Prompt Engineering Strategies

### 1. Explicit Constraints
```
**Requirements**:
- Create {N} slides (1 intro + {N-2} main + 1 end)
- Total duration: {duration} seconds
- Speaking rate: 150 words per minute

**Layout** - MUST use EXACTLY one of:
   - `text-left-image-right`
   - `text-right-image-left`
   - `center`

DO NOT create custom layout names.
```

### 2. Examples (Few-Shot Learning)
```
**BAD Example**: "A flowchart showing the process"

**GOOD Example**: "A flowchart showing the 3-step process with labeled
boxes and arrows, clean professional diagram style, use primary color
{primary} and accent color {accent}, rounded rectangles with subtle shadows,
clear white labels on colored boxes, high contrast for readability..."
```

### 3. Color Injection
```
**COLOR PALETTE** (use these theme colors consistently):
Primary: {primary_color}
Secondary: {secondary_color}
Accent: {accent_color}
Background: {background_color}
```

### 4. Style Guidelines
```
**For Diagrams/Flowcharts/Technical**:
   - Style: "Clean professional diagram style, minimal design, high contrast"
   - Colors: "Use theme primary {primary_color} and accent {accent_color}"
   - Layout: "Well-organized layout, clear hierarchy, balanced spacing"
   - Elements: "Rounded corners, subtle shadows, modern flat design"
   - Text: "Clear labels with sans-serif font, high contrast"
   - Quality: "Crisp edges, well-spaced elements, professional finish"
```

### 5. Critical Requirements (Emphasis)
```
**CRITICAL REQUIREMENTS** - Every gemini_prompt MUST include:
1. The core subject/content
2. Appropriate style specification
3. Explicit color palette reference
4. Multiple quality descriptors
5. Background specification
6. Professional finish descriptors
```

### 6. Contextual Examples
```
**Common patterns**:
- Flowchart: Boxes with arrows between them
- Process flow: Sequential boxes left-to-right or top-to-bottom
- Architecture: Layered boxes showing system components

Example structure:
<div style="display:flex; flex-direction:column; align-items:center;">
  <div style="background:{primary}; padding:20px;">Step 1</div>
  <div style="font-size:40px;">↓</div>
  <div style="background:{secondary}; padding:20px;">Step 2</div>
</div>
```

### 7. Output Format Specification
```
**Output**: Return ONLY the HTML, no markdown, no explanation.

Output ONLY the code, no markdown, no explanation.

Return TWO parts separated by "---SCRIPT---":
   - Part 1: HTML with <canvas> element
   - Part 2: JavaScript Chart.js configuration
```

### 8. Architecture Context
```python
# Inject relevant architecture documentation
self.architecture_doc = self._load_architecture_doc()

system_prompt = f"""
...

**Architecture Context**:
{self._get_architecture_excerpt()}
"""
```

### 9. Temperature Tuning
```python
# Creative tasks (content generation)
temperature=0.7

# Consistent formatting (HTML generation)
temperature=0.3

# Factual analysis (vision review)
temperature=0.3
```

### 10. Structured Output Enforcement
```python
# Use Pydantic models to enforce schema
response_format=ContentStrategy

# Descriptions guide GPT
Field(..., description="Voiceover script for this slide")

# Literals enforce exact values
Literal["pexels", "gemini", "graph", "diagram", "code", "table", "none"]
```

---

## API Cost Breakdown

### Per-Video Cost Analysis (5-slide video, 60s)

#### Configuration: Basic (Pexels + OpenAI TTS)
```
1. Content Generation (GPT-5)           $0.014
   - 800 input + 1200 output tokens

2. Text HTML (GPT-5, 5 slides)         $0.045
   - 250 input + 200 output × 5 slides

3. Pexels Images (5 slides)            $0.000 (free)

4. Vision Review (GPT-4o-mini, 5)      $0.008
   - 400 input + 150 output × 5 slides

5. TTS (OpenAI, 500 chars)             $0.008

Total:                                  $0.075
```

#### Configuration: Premium (Gemini + ElevenLabs TTS)
```
1. Content Generation (GPT-5)           $0.014

2. Text HTML (GPT-5, 5 slides)         $0.045

3. Gemini Images (5 slides)            $0.200
   - $0.04 per image × 5

4. Vision Review (GPT-4o-mini, 5)      $0.008

5. TTS (ElevenLabs, 500 chars)         $0.150

Total:                                  $0.417
```

#### Configuration: With Web Research + Retries
```
1. Web Research (GPT-4o)               $0.004

2. Content Generation (GPT-5)           $0.014

3. Text HTML (GPT-5, 5 slides)         $0.045

4. Mixed Visuals (3 Pexels + 2 Gemini) $0.080

5. Vision Review with Retries          $0.024
   - 5 slides × 3 attempts × $0.0016

6. TTS (OpenAI)                        $0.008

Total:                                  $0.175
```

### Cost Optimization

**Cheapest Configuration**:
- Pexels images (free)
- OpenAI TTS ($0.008)
- Disable vision review (save $0.008)
- **Total: ~$0.06 per video**

**Highest Quality**:
- Gemini images ($0.20)
- ElevenLabs TTS ($0.15)
- Vision review with retries ($0.024)
- **Total: ~$0.42 per video**

### Bulk Pricing

| Videos | Basic Config | Premium Config |
|--------|-------------|----------------|
| 10 | $0.75 | $4.17 |
| 100 | $7.50 | $41.70 |
| 1,000 | $75.00 | $417.00 |

---

## Summary

This system orchestrates **10-15 AI API calls** to generate professional explainer videos:

1. **Content Agent (GPT-5)**: Generate slide-by-slide content strategy
2. **Web Research (GPT-4o)**: Optional real-time fact gathering
3. **Text HTML (GPT-5)**: Convert content to semantic HTML (5× per video)
4. **Visual Generation**: Pexels, Gemini, or GPT-generated diagrams (5× per video)
5. **Vision Review (GPT-4o-mini)**: Quality assurance with retry logic (5-15× per video)
6. **TTS (OpenAI/ElevenLabs)**: Convert script to speech

The system uses:
- **Structured Outputs** (Pydantic) for type-safe responses
- **Prompt Engineering** with color injection, examples, and constraints
- **Retry Logic** with exponential backoff for reliability
- **Pure HTML/CSS** for diagrams (no SVG complexity)
- **Cost Tracking** to monitor API usage

**Total Cost**: $0.06-0.42 per 60-second video depending on configuration.

---

**Document Version**: 1.0
**Last Updated**: December 19, 2025
**Author**: AI-Assisted Technical Documentation
