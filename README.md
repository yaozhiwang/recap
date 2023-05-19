<div align="center">

# Recap

Summarize the text you are interested in.

[![license][license-image]][license-url]
[![release][release-image]][release-url]

### Install

[![chrome][chrome-image]][chrome-url]
[![manual][manual-image]][manual-url]

[license-image]: https://img.shields.io/badge/license-GPLv3.0-blue.svg
[license-url]: https://github.com/yaozhiwang/recap/blob/master/LICENSE
[release-image]: https://img.shields.io/github/v/release/yaozhiwang/recap?color=blue
[release-url]: https://github.com/yaozhiwang/recap/releases/latest
[chrome-image]: https://img.shields.io/badge/-Chrome-brightgreen?style=for-the-badge&logo=google-chrome&logoColor=white
[chrome-url]: https://recapext.xyz/chrome?utm_source=github
[manual-image]: https://img.shields.io/badge/-Manual-lightgrey?style=for-the-badge
[manual-url]: #manual-installation

### Screenshots

[![promo][promo-image]][promo-url]

[promo-image]: http://img.youtube.com/vi/1TVeOzhWeA8/0.jpg
[promo-url]: https://www.youtube.com/watch?v=1TVeOzhWeA8

</div>

Reacp is a browser extension to summarize text on webpage with ChatGPT. It splits the article into passages, so that you can easily summarize any part of the article.

## Features

- Auto split article into passages
- Summarize entire page
- Summarize text in a passage
- Recap previous content before a passage
- Summarize user selected text
- Support ChatGPT
- Support official OpenAI API
- Custom prompt
- Toggle enable/disable for individual domain or page
- Support user configuration for different sites
- Dark mode
- Support keyboard shortcuts

## Manual Installation

- Download `recap.zip` from [Releases](https://github.com/yaozhiwang/recap/releases)
- Unzip the file
- In Chrome go to the extensions page (chrome://extensions)
- Enable Developer Mode
- Drag the unzipped folder anywhere on the page to import it (do not delete the folder afterward)

## Build from source

1. Clone the repo
2. Install dependencies with `pnpm`
3. `pnpm run build`
4. Load `build/chrome-mv3-prod` directory to your browser

## Roadmap

Please feel free to submit any feature requests or suggestions by [opening an issue](https://github.com/yaozhiwang/recap/issues/new).

<details>
<summary>Major Milestones</summary>

- [ ] Site adapter
  - [ ] Stackoverflow
  - [ ] Github
  - [ ] Reddit
  - [ ] Quora
  - [ ] Youtube
- [ ] Link preview
  - [ ] Twitter
  - [ ] Google
  - [ ] Hacker News

</details>

<details>
<summary>Incremental Improvements</summary>

- [x] Add prompt help in settings
- [ ] Add Changelog
- [ ] Long text summarization
- [ ] Performance optimization
  - [ ] Remove Plasmo CSUI (it causes certain websites to freeze)
  - [ ] Remove React <!-- https://github.com/parcel-bundler/parcel/issues/3305 -->
- [ ] Support more browsers
- [ ] Encourage users to leave a review on the web store.
- [ ] Support more AI models
- [ ] Github actions for releasing
- [ ] UI improvements
  - [ ] i18n
  - [ ] Handle root font size
  - [ ] AUTO theme detect
  - [ ] Copy-to-clipboard button in panel headers
  - [ ] Stop generating button
  - [ ] Toast in panel
  - [ ] Summarize page button for page title instead of passage button
  - [ ] Add blinking ... at tail of text while generating

</details>

<details>
<summary>Experimental Feature</summary>

- [ ] Give Me the Answer (directly show the most relevant answer on stackoverflow)

</details>
