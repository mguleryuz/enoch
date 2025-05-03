#!/usr/bin/env bun

/**
 * This script extracts English to Enochian word mappings from the Enochian dictionary PDF
 * and generates a JSON file with these mappings.
 */

import fs from 'node:fs'
import path from 'node:path'
import { PDFExtract } from 'pdf.js-extract'

const INPUT_PDF_PATH = path.join(
  process.cwd(),
  'public',
  'enoch_dictionary.pdf',
)
const OUTPUT_JSON_PATH = path.join(
  process.cwd(),
  'public',
  'enoch_dictionary.json',
)
const pdfExtract = new PDFExtract()

function cleanText(text) {
  if (!text) return ''

  // Simple approach to clean text
  let cleaned = ''

  // Only keep printable ASCII characters
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // Keep only printable ASCII (32-126) and basic whitespace
    if (
      (code >= 32 && code <= 126) ||
      code === 9 ||
      code === 10 ||
      code === 13
    ) {
      cleaned += text[i]
    }
  }

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}

function isValidEnochianEntry(english, enochian) {
  // Skip entries that are clearly not good English to Enochian mappings

  // Skip entries that are too long (likely explanations, not word mappings)
  if (english.length > 30 || enochian.length > 30) return false

  // Skip entries with too many words
  if (english.split(' ').length > 5 || enochian.split(' ').length > 5)
    return false

  // Avoid entries that contain problematic substrings (likely not real entries)
  const problematicStrings = [
    'page',
    'chapter',
    'figure',
    'table',
    'reference',
    'appendix',
    'index',
    'linguistics',
    'language',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    'http',
    'www',
    '.com',
    'p.',
    'vol',
    'edition',
    'dover',
    'journal',
    'publication',
  ]

  const lowerEnglish = english.toLowerCase()
  const lowerEnochian = enochian.toLowerCase()

  for (const str of problematicStrings) {
    if (lowerEnglish.includes(str) || lowerEnochian.includes(str)) {
      return false
    }
  }

  // Avoid entries that are just numbers or single characters
  if (/^\d+$/.test(english) || /^\d+$/.test(enochian)) return false
  if (english.length < 2 || enochian.length < 2) return false

  // Avoid entries that are likely just part of an explanation
  const commonPrefixes = [
    'the ',
    'a ',
    'an ',
    'to ',
    'of ',
    'in ',
    'on ',
    'at ',
    'by ',
    'for ',
  ]
  const commonConnectors = [
    ' is ',
    ' are ',
    ' was ',
    ' were ',
    ' be ',
    ' been ',
    ' being ',
    ' has ',
    ' have ',
    ' had ',
    ' having ',
    ' do ',
    ' does ',
    ' did ',
    ' can ',
    ' could ',
    ' will ',
    ' would ',
    ' should ',
    ' may ',
    ' might ',
    ' must ',
    ' shall ',
  ]

  // If the English part starts with these prefixes and doesn't look like a phrase,
  // it's likely just a fragment
  if (
    commonPrefixes.some((prefix) => lowerEnglish.startsWith(prefix)) &&
    !lowerEnglish.includes(' ')
  ) {
    return false
  }

  // If contains verb connectors, likely a sentence fragment, not a dictionary entry
  if (commonConnectors.some((connector) => lowerEnglish.includes(connector))) {
    return false
  }

  // If both sides contain non-enochian characters like umlauts, likely not a valid entry
  if (/[àáâäæãåāèéêëēėęîïíīįìôöòóœøōõûüùúū]/i.test(enochian)) {
    return false
  }

  return true
}

async function extractDictionaryEntries(pdfData) {
  const dictionary = {}
  const possibleEntries = []

  // First pass: collect all possible dictionary entries
  for (const page of pdfData.pages) {
    let currentLine = ''
    let lastY = -1

    // Sort content by y-coordinate to get proper reading order
    const sortedContent = [...page.content].sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y)
      if (yDiff < 1) return a.x - b.x // Same line, sort by x
      return a.y - b.y // Different lines, sort by y
    })

    // Combine content into lines based on y-coordinates
    for (const item of sortedContent) {
      if (lastY === -1 || Math.abs(item.y - lastY) < 1) {
        // Same line or first item
        currentLine += item.str + ' '
      } else {
        // New line detected
        const cleanedLine = cleanText(currentLine)
        if (cleanedLine) possibleEntries.push(cleanedLine)
        currentLine = item.str + ' '
      }
      lastY = item.y
    }

    // Process the last line
    const cleanedLine = cleanText(currentLine)
    if (cleanedLine) possibleEntries.push(cleanedLine)
  }

  console.log(`Collected ${possibleEntries.length} possible entries to process`)

  // Second pass: Extract dictionary entries using various patterns
  for (const line of possibleEntries) {
    if (!line || line.length < 5) continue

    // Try pattern matching to extract English-Enochian pairs
    tryPatternMatch(line, dictionary)
  }

  // Filter the dictionary to remove obvious errors
  const filteredDictionary = {}
  for (const [english, enochian] of Object.entries(dictionary)) {
    if (isValidEnochianEntry(english, enochian)) {
      // Final cleaning - remove any trailing punctuation
      const cleanedEnglish = english.replace(/[.,;:!?]$/, '').trim()
      const cleanedEnochian = enochian.replace(/[.,;:!?]$/, '').trim()

      if (cleanedEnglish && cleanedEnochian) {
        filteredDictionary[cleanedEnglish] = cleanedEnochian
      }
    }
  }

  return filteredDictionary
}

function tryPatternMatch(line, dictionary) {
  // Pattern 1: English - Enochian or English — Enochian
  const pattern1 =
    /([A-Za-z][A-Za-z\s,'"-]+?)(?:\s+-\s+|\s+—\s+|\s+–\s+)([A-Za-z][A-Za-z\s]+)/i

  // Pattern 2: English : Enochian or English = Enochian
  const pattern2 =
    /([A-Za-z][A-Za-z\s,'"-]+?)(?:\s+[=:]\s+)([A-Za-z][A-Za-z\s]+)/i

  // Pattern 3: English (Enochian)
  const pattern3 = /([A-Za-z][A-Za-z\s,'"-]+?)(?:\s+\(([A-Za-z][A-Za-z\s]+)\))/i

  // Pattern 4: Enochian: English
  const pattern4 =
    /([A-Za-z][A-Za-z\s]+?)(?:\s+[:]\s+)([A-Za-z][A-Za-z\s,'"-]+)/i

  // Try direct patterns first
  for (const pattern of [pattern1, pattern2, pattern3, pattern4]) {
    const match = line.match(pattern)
    if (match) {
      // Patterns 1-3: English to Enochian
      if (pattern !== pattern4) {
        const english = cleanText(match[1]).toLowerCase()
        const enochian = cleanText(match[2])

        if (english && enochian && english.length > 1) {
          dictionary[english] = enochian
          return true
        }
      }
      // Pattern 4: Enochian to English (reversed)
      else {
        const enochian = cleanText(match[1])
        const english = cleanText(match[2]).toLowerCase()

        if (english && enochian && english.length > 1) {
          dictionary[english] = enochian
          return true
        }
      }
    }
  }

  // Fallback for entries with separators
  const separators = [':', '-', '=', '—', '–']
  for (const sep of separators) {
    const parts = line.split(sep)
    if (parts.length === 2) {
      const part1 = cleanText(parts[0])
      const part2 = cleanText(parts[1])

      // Determine which part is English and which is Enochian
      // This is a simplistic approach and may need refinement

      if (part1 && part2 && part1.length > 1 && part2.length > 1) {
        // If the line starts with a capitalized word, likely English-Enochian
        if (/^[A-Z]/.test(part1)) {
          dictionary[part1.toLowerCase()] = part2
          return true
        }
      }
    }
  }

  return false
}

async function processPDF() {
  try {
    console.log(`Reading PDF file: ${INPUT_PDF_PATH}`)

    // Extract PDF data
    const pdfData = await pdfExtract.extract(INPUT_PDF_PATH, {})
    console.log(`Successfully extracted PDF with ${pdfData.pages.length} pages`)

    console.log('Extracting dictionary entries...')
    const dictionary = await extractDictionaryEntries(pdfData)

    // Sort the dictionary by keys for better readability
    const sortedDictionary = Object.keys(dictionary)
      .sort()
      .reduce((obj, key) => {
        obj[key] = dictionary[key]
        return obj
      }, {})

    // Log statistics
    const entryCount = Object.keys(sortedDictionary).length
    console.log(`Extracted ${entryCount} dictionary entries`)

    // Save to JSON file
    console.log(`Writing dictionary to: ${OUTPUT_JSON_PATH}`)
    fs.writeFileSync(
      OUTPUT_JSON_PATH,
      JSON.stringify(sortedDictionary, null, 2),
    )

    console.log('Dictionary generation complete!')

    // Provide some sample entries for verification
    const sampleEntries = Object.entries(sortedDictionary).slice(0, 15)
    if (sampleEntries.length > 0) {
      console.log('\nSample entries:')
      sampleEntries.forEach(([english, enochian]) => {
        console.log(`  ${english} => ${enochian}`)
      })
    }
  } catch (error) {
    console.error('Error processing PDF:', error)
    process.exit(1)
  }
}

// Execute the main function
processPDF()
