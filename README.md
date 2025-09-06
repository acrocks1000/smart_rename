# Smart Renamer

> **Smart Renamer** is a cross-platform desktop app (built with [Electron](https://electronjs.org)) that helps you clean up messy media filenames. It automatically detects patterns (anime episodes, seasons, posters, etc.), suggests human-readable names, and lets you approve or reject changes with a single click.

---

## ✨ Features

- **Intelligent renaming**  
  Detects titles, seasons, and episodes from messy file names like:  
  ```
  [AnimeFlix.in].Classroom.of.the.Elite.Ep.07.Dual.Audio.720p-poster.jpg
  ```
  ➝  
  ```
  Classroom of the Elite Ep.01-poster.jpg
  ```

- **Poster / cover rule**  
  Files ending in `-poster`, `-cover`, or `-thumb` are auto-set to `Ep.01`.

- **Preserve extensions**  
  Original file extensions (`.mp4`, `.mkv`, `.jpg`, etc.) are always kept.

- **Folder + subfolder support**  
  Select a single folder or include nested subfolders.

- **Interactive UI**  
  Review rename suggestions, accept/reject individually, or edit inline before applying.

- **Backup & revert**  
  Every rename batch is logged in a JSON backup.  
  - **Revert all**: restore the entire batch.  
  - **Revert selected**: load a backup, tick only the files you want to undo, and restore just those.

- **Cross-platform**  
  Runs on Windows, macOS, and Linux.

---

## 📸 Screenshots

*(Add screenshots or GIFs here once you capture the UI in action.)*

---

## 🚀 Getting Started

### Run in Dev Mode

```bash
git clone https://github.com/yourusername/smart-renamer.git
cd smart-renamer
npm install
npm start
```

### Build Distributables

Installers and portable builds are created with [electron-builder](https://www.electron.build/).

For Windows:
```bash
npm run dist:win
```

For Linux (run on Linux):
```bash
npm run dist:linux
```

For macOS (run on macOS):
```bash
npm run dist:mac
```

Output is placed in the `dist/` folder.

---

## 🛠 Tech Stack

- [Electron](https://electronjs.org) – cross-platform desktop framework  
- Vanilla JS + HTML + CSS – lightweight renderer  
- Node.js `fs` + `dialog` – file scanning and renaming  
- [electron-builder](https://www.electron.build) – packaging and distribution  

---

## 📂 Project Structure

```
smart-renamer/
├── main.js          # Main process
├── preload.cjs      # Secure bridge (contextBridge)
├── renderer/
│   └── index.html   # UI + rename logic
├── package.json
```

---

## ⚠️ Notes

- On Windows, run `npm run dist:win` (don’t try `-wml` cross-build).  
- Backups are JSON files named `.smart-renamer-backup-<timestamp>.json` saved in the target folder.  
- If you hit symlink errors while packaging, either run as **Administrator** or enable **Developer Mode** in Windows.

---

## 📜 License

MIT – feel free to fork, modify, and contribute.

---

## 🌟 Repo Metadata (for GitHub)

**Description:**  
> A cross-platform Electron app to smartly rename media files with episode/season detection, poster handling, backup & revert support.

**Topics/Tags:**  
`electron` · `file-rename` · `media-management` · `anime` · `desktop-app` · `file-utilities` · `cross-platform`
