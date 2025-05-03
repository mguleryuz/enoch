import fs from 'node:fs'
import path from 'node:path'
import { EnochianTranslator } from './src/lib/translator'

async function debugTranslation(): Promise<void> {
  try {
    // Load lexicon data
    const lexiconPath = path.join(
      process.cwd(),
      'public',
      'enochian_lexicon.json',
    )
    const rootTablePath = path.join(
      process.cwd(),
      'public',
      'enochian_root_table.json',
    )

    const lexiconData = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'))
    const rootData = JSON.parse(fs.readFileSync(rootTablePath, 'utf-8'))

    // Create translator
    const translator = new EnochianTranslator(lexiconData, rootData)

    // Test different formats
    const inputs = ['I am light', 'I am', 'I light', 'the third angel is king']

    // Translate each input
    for (const input of inputs) {
      console.log(`\n\n===== Debugging "${input}" =====`)
      const result = translator.translate(input)

      console.log('Words:', result.translationText)
      console.log('Phonetic:', result.phoneticText)
      console.log('Symbols:', result.symbolText)

      // Check the processed words array
      console.log('\nPhrase Matches:')
      Object.entries(result.phraseMatches).forEach(([phrase, translation]) => {
        console.log(`  "${phrase}" → "${translation}"`)
      })

      // Print the construction details
      console.log('\nConstruction Details:')
      Object.entries(result.constructionDetails).forEach(([word, details]) => {
        console.log(`  "${word}" → "${details.result}" (${details.method})`)
      })

      // Let's also try a more direct approach to see how the words are processed
      console.log('\nDirect word-by-word translation:')
      const words = input.split(/\s+/)
      words.forEach((word) => {
        const singleResult = translator.translate(word)
        console.log(`  "${word}" → "${singleResult.translationText}"`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the debug function
debugTranslation()
