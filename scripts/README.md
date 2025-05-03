# Enochian Project Scripts

This directory contains utility scripts for the Enochian project.

## Scripts

### generate_enoch_dictionary.js

This script extracts English to Enochian word mappings from the Enochian dictionary PDF and generates a JSON file with these mappings.

#### Usage

```bash
# Run the script
bun scripts/generate_enoch_dictionary.js
```

#### Input/Output

- **Input**: `public/enoch_dictionary.pdf`
- **Output**: `public/enoch_dictionary.json`

#### Dependencies

The script requires the following dependencies:

- pdf.js-extract

#### Notes

The script uses various patterns and heuristics to extract dictionary entries from the PDF. It attempts to clean and filter the entries to ensure high-quality mappings. However, due to the complex nature of PDF extraction, some entries may require manual verification or correction.

The output JSON file contains a mapping of English words/phrases to their Enochian translations in the format:

```json
{
  "english word": "Enochian translation",
  "another english word": "Another Enochian translation"
}
```

#### Algorithm

1. Extract text content from the PDF using pdf.js-extract
2. Process the content page-by-page to reconstruct lines based on y-coordinates
3. Apply various regex patterns to identify English-Enochian pairs
4. Clean and filter the entries to remove obvious errors or non-dictionary content
5. Generate a sorted JSON file with the final mappings
