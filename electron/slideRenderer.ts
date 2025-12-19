import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { Slide } from '../src/shared/types'

let browser: Browser | null = null

export async function initBrowser(): Promise<void> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true
    })
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}

export async function renderSlideToImage(
  slide: Slide,
  outputPath: string,
  templateParams: any
): Promise<string> {
  await initBrowser()

  if (!browser) {
    throw new Error('Browser not initialized')
  }

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  })

  try {
    const html = generateSlideHTML(slide, templateParams)
    await page.setContent(html, { waitUntil: 'networkidle' })

    // Wait a bit for any images to load
    await page.waitForTimeout(500)

    await page.screenshot({
      path: outputPath,
      type: 'png'
    })

    return outputPath
  } finally {
    await page.close()
  }
}

function generateSlideHTML(slide: Slide, params: any): string {
  const { brand, fonts } = params

  // Generate background style
  let backgroundStyle = ''
  if (slide.backgroundType === 'gradient' && slide.backgroundGradient) {
    backgroundStyle = `background: ${slide.backgroundGradient};`
  } else if (slide.backgroundType === 'image' && slide.backgroundImagePath) {
    backgroundStyle = `background-image: url('file://${slide.backgroundImagePath}'); background-size: cover; background-position: center;`
  } else {
    backgroundStyle = `background-color: ${slide.backgroundColor || brand.backgroundColor};`
  }

  // Generate content based on elements
  let content = ''

  for (const element of slide.elements) {
    const style = `
      left: ${element.x}%;
      top: ${element.y}%;
      width: ${element.width}%;
      height: ${element.height}%;
      ${element.color ? `color: ${element.color};` : ''}
      ${element.fontSize ? `font-size: ${element.fontSize}px;` : ''}
      ${element.fontWeight ? `font-weight: ${element.fontWeight};` : ''}
      ${element.textAlign ? `text-align: ${element.textAlign};` : ''}
    `

    switch (element.type) {
      case 'headline':
        content += `<div class="element headline" style="${style}">${escapeHTML(element.content || '')}</div>`
        break
      case 'subheadline':
        content += `<div class="element subheadline" style="${style}">${escapeHTML(element.content || '')}</div>`
        break
      case 'body':
        content += `<div class="element body-text" style="${style}">${escapeHTML(element.content || '')}</div>`
        break
      case 'bullets':
        const bullets = (element.content || '').split('\n').filter(b => b.trim())
        const bulletsList = bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')
        content += `<div class="element bullets" style="${style}"><ul>${bulletsList}</ul></div>`
        break
      case 'image':
        if (element.imagePath) {
          content += `<div class="element image-container" style="${style}"><img src="file://${element.imagePath}" alt="" /></div>`
        }
        break
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1920px;
      height: 1080px;
      font-family: ${fonts.primary};
      overflow: hidden;
    }

    .slide {
      width: 100%;
      height: 100%;
      position: relative;
      ${backgroundStyle}
    }

    .element {
      position: absolute;
      overflow: hidden;
    }

    .headline {
      font-size: 72px;
      font-weight: 700;
      line-height: 1.2;
      color: ${brand.headlineColor};
    }

    .subheadline {
      font-size: 42px;
      font-weight: 500;
      line-height: 1.4;
      color: ${brand.subheadlineColor};
    }

    .body-text {
      font-size: 32px;
      font-weight: 400;
      line-height: 1.6;
      color: ${brand.bodyColor};
    }

    .bullets {
      font-size: 28px;
      line-height: 1.8;
      color: ${brand.bodyColor};
    }

    .bullets ul {
      list-style: disc;
      padding-left: 40px;
    }

    .bullets li {
      margin-bottom: 12px;
    }

    .image-container {
      border-radius: 8px;
      overflow: hidden;
    }

    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <div class="slide">
    ${content}
  </div>
</body>
</html>`
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function renderAllSlides(
  slides: Slide[],
  outputDir: string,
  templateParams: any,
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  await initBrowser()

  const imagePaths: string[] = []

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const outputPath = path.join(outputDir, `slide_${String(i).padStart(3, '0')}.png`)

    await renderSlideToImage(slide, outputPath, templateParams)
    imagePaths.push(outputPath)

    if (onProgress) {
      onProgress(i + 1, slides.length)
    }
  }

  return imagePaths
}
