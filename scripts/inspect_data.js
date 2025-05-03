import fs from 'node:fs'
import path from 'node:path'

// Load the lexicon and root data
const lexiconPath = path.join(process.cwd(), 'public', 'enochian_lexicon.json')
const rootTablePath = path.join(
  process.cwd(),
  'public',
  'enochian_root_table.json',
)

const lexiconData = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'))
const rootData = JSON.parse(fs.readFileSync(rootTablePath, 'utf-8'))

// Display summary information
console.log(`Lexicon contains ${lexiconData.length} entries`)
console.log(`Root table contains ${rootData.length} entries`)

// Sample of lexicon data
console.log('\nLEXICON SAMPLE:')
console.log(lexiconData.slice(0, 5))

// Sample of root table data
console.log('\nROOT TABLE SAMPLE:')
console.log(rootData.slice(0, 5))

// Check for duplicate words in lexicon
const wordCounts = {}
lexiconData.forEach((entry) => {
  if (wordCounts[entry.word]) {
    wordCounts[entry.word]++
  } else {
    wordCounts[entry.word] = 1
  }
})

const duplicates = Object.entries(wordCounts)
  .filter(([word, count]) => count > 1)
  .sort((a, b) => b[1] - a[1])

console.log('\nDUPLICATE WORDS IN LEXICON:')
console.log(
  duplicates.length > 0
    ? duplicates
        .slice(0, 10)
        .map(([word, count]) => `${word}: ${count} occurrences`)
    : 'No duplicates found',
)

// Check for words with multiple meanings
const wordToMeanings = new Map()
lexiconData.forEach((entry) => {
  if (!wordToMeanings.has(entry.word)) {
    wordToMeanings.set(entry.word, [])
  }
  wordToMeanings.get(entry.word).push(entry.meaning)
})

const wordsWithMultipleMeanings = Array.from(wordToMeanings.entries())
  .filter(([word, meanings]) => meanings.length > 1)
  .slice(0, 10)

console.log('\nWORDS WITH MULTIPLE MEANINGS:')
wordsWithMultipleMeanings.forEach(([word, meanings]) => {
  console.log(`${word}:`)
  meanings.forEach((meaning) => console.log(`  - ${meaning}`))
})
