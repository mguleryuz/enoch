import fs from 'node:fs'
import path from 'node:path'
import { EnochianTranslator } from '../src/lib/translator'

export const getTranslator = () => {
  // Load the lexicon and root data from disk for testing
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

  // Read and parse the files
  const lexiconData = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'))
  const rootData = JSON.parse(fs.readFileSync(rootTablePath, 'utf-8'))

  // Create translator with real data
  const translator = new EnochianTranslator(lexiconData, rootData)
  return translator
}
