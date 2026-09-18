# Reading text sources and task references

The new exercises use real public-domain prose with newly authored questions. They are not Cambridge questions or official IELTS tests. Attribution appears in the passage view and before starting practice.

| Dataset record | Text source | Editorial treatment | New questions |
| --- | --- | --- | ---: |
| `reading-gold-source-coral` | Charles Darwin, *The Voyage of the Beagle*, Chapter XX, [Project Gutenberg ebook 944](https://www.gutenberg.org/ebooks/944) | Selected sentences and passages regrouped into six labelled sections. Material between extracts is omitted; the passage notice states this. | 6 notes, 6 headings, 6 paragraph matches |
| `reading-gold-source-naturalists` | Charles Darwin, *The Origin of Species*, sixth edition (1872), Historical Sketch, [Project Gutenberg ebook 2009](https://www.gutenberg.org/ebooks/2009) | Selected accounts of Lamarck, Geoffroy Saint-Hilaire and W. Herbert. Intervening accounts and footnotes omitted; historical wording retained. | 7 expert matches, 4 sentence endings |

The source catalogues identify the works as public domain in the USA; Darwin died in 1882. Source ebooks and their [Project Gutenberg licence](https://www.gutenberg.org/policy/license.html) remain available at the linked source pages. No photographs, modern commentary or publisher-created questions are reproduced.

## Task references checked on 2026-09-07

- [Official IELTS Academic Reading format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading): matching information, headings, features, sentence endings, and summary/note/table/flow-chart completion are established task types. This does not establish a current frequency ranking.
- [Engnovate, Cambridge 20 Test 2](https://engnovate.com/ielts-reading-tests/cambridge-ielts-20-academic-reading-test-2/): the user's manatee notes example is Questions 1–6; paragraph matching also appears in this test.
- [Engnovate, Cambridge 20 Test 3](https://engnovate.com/ielts-reading-tests/cambridge-ielts-20-academic-reading-test-3/): the supplied headings, expert-matching and sentence-ending examples are visible here.
- [Official IELTS Academic samples](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test): linked from the Reading focus panel for additional practice.

Engnovate and official sample pages are linked for external practice; their full copyrighted passages and questions are not copied into this dataset. No reliable IELTS site could be identified under the supplied spelling “Juminto”; Engnovate provided the requested reference examples.

## Verification

Run `npm.cmd run build`, then `npm.cmd run test:reading` on Windows. The Reading browser suites use a fresh isolated SQLite database on port 3101. They verify both the existing Reading workflows and the new five-format tasks without adding attempts to the learner's real history.
