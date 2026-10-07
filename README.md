# The Last Carriage

An original full-screen mobile browser murder mystery. It is inspired by the atmosphere of classic detective fiction, not an adaptation of The A.B.C. Murders. All story and dialogue are original. The artwork was generated for this game.

## Run
Extract this ZIP. On a desktop, open index.html in a current browser.
For smartphone play, host all files together on a static web host and open the link. No installation, build, backend, external libraries or API keys are required. A phone file-preview app may not execute HTML games.

Optional local server (run in the extracted folder with Python installed):
macOS/Linux: python3 -m http.server 8000 --bind 127.0.0.1
Windows: py -m http.server 8000 --bind 127.0.0.1
Then visit http://localhost:8000. Stop with Ctrl+C.

## Controls
Tap choices to examine scenes and question suspects.
In weapon close-ups, move the inspection-light slider until a detail becomes visible. Hold the record button, use its alternate tap action, or press Enter/Space while focused on it.
Use Notes/Evidence to review clues.
The fullscreen button hides browser controls where supported. Otherwise the game fills the browser viewport.
Sound starts off. Tap Sound off to enable the synthesized atmospheric audio.

## Progress
Progress is saved on this browser/device when localStorage is available. On return, choose Continue saved case. Restart is in the game information menu (top-left title). This does not synchronize between devices.

## Included
index.html: interface
style.css: responsive full-screen styling
game.js: story, interactive weapons, clues, puzzles, audio and local save
assets/: four scene backgrounds and three weapon close-ups

## Verification
JavaScript syntax, the complete nine-clue story, inspection gates, cancelled touch/blur recovery, wrong-answer recovery, the bell puzzle, notebook, save and restart were checked. Live visual browser/phone testing was unavailable.
