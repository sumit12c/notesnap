# NoteSnap 📸

An intelligent screenshot capture and note-taking application that automatically extracts text from screen captures using OCR and leverages Google Gemini AI to generate structured, organized notes from your study sessions and meetings.

## Features 🎯

- **Automated Screen Capture**: Periodic screenshot capture at configurable intervals (5-60 seconds)
- **OCR Text Extraction**: Real-time optical character recognition using Tesseract.js to extract text from screenshots
- **AI-Powered Note Generation**: Google Gemini integration to intelligently organize and structure captured content
- **Session Statistics**: Track study time, focus score, screenshot count, and word count
- **Live Capture List**: View and manage all captures in real-time with thumbnails
- **Export to DOCX**: Generate professional Word documents with your organized notes
- **Smart Pause Detection**: Automatically pause capturing when the app loses focus
- **Desktop Notifications**: Get notified during capture and processing activities
- **Settings Management**: Customizable capture intervals, language settings, and theme preferences
- **Session Recovery**: Recover and restore session data after crashes
- **Responsive UI**: Intuitive interface built with React and Tailwind CSS

## Tech Stack 🛠️

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **AI/ML**: Google Gemini API, Tesseract.js (OCR)
- **Document Generation**: DOCX library
- **UI Components**: Lucide React icons, Motion animations
- **Build**: Vite, esbuild
- **Development**: tsx, TypeScript

## Prerequisites 📋

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))

## Installation 🚀

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notesnap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Verify TypeScript configuration**
   ```bash
   npm run lint
   ```

## Usage 🎬

### Development

Start the development server:
```bash
npm run dev
```

This will:
- Start the Express backend server (server.ts)
- Launch the Vite dev server for hot module reloading
- Open the application at `http://localhost:5173`

### Production Build

Build the project:
```bash
npm run build
```

This creates:
- Optimized frontend bundle in `dist/`
- Compiled Node.js server as `dist/server.cjs`

Start the production server:
```bash
npm start
```

### Clean Build

Remove all build artifacts:
```bash
npm run clean
```

## Configuration ⚙️

Configure NoteSnap through the Settings modal in the app:

- **Gemini API Key**: Your Google Gemini API credentials
- **Capture Interval**: Time between screenshots (5-60 seconds)
- **OCR Language**: Language for text extraction (default: English)
- **Document Title**: Title for exported DOCX files
- **Auto-Pause**: Automatically pause when app loses focus
- **Desktop Notifications**: Enable/disable system notifications
- **Theme**: Light or dark mode

## Project Structure 📁

```
notesnap/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # React entry point
│   ├── types.ts                   # TypeScript interfaces
│   ├── index.css                  # Global styles
│   ├── components/
│   │   ├── CaptureStatusIndicator.tsx    # Capture status display
│   │   ├── LiveCapturesList.tsx          # Real-time capture list
│   │   ├── SessionStatsPanel.tsx         # Session statistics
│   │   ├── SettingsModal.tsx             # Settings configuration
│   │   ├── ProcessingOverlay.tsx         # AI processing progress
│   │   └── DownloadsModal.tsx            # Export management
│   └── utils/
│       └── docxExporter.ts               # DOCX document generation
├── server.ts                      # Express backend server
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Project dependencies
└── index.html                     # HTML entry point
```

## Key Components 🔧

### App.tsx
Main application component managing:
- Capture session lifecycle
- OCR processing
- Gemini AI integration
- Session state and statistics
- UI state management

### CaptureStatusIndicator
Displays real-time capture status including:
- Active capture indicator
- Session duration
- Pause/resume controls
- Capture count

### SessionStatsPanel
Shows comprehensive session metrics:
- Study time vs total session time
- Focus score calculation
- Screenshot and word count
- Streak tracking

### DownloadsModal
Manages document export:
- DOCX generation from captured content
- Gemini-processed structured notes
- File download management

## API Integration 🔌

### Google Gemini API
The app uses Google Gemini to:
1. Analyze extracted text from screenshots
2. Organize content into structured notes
3. Generate coherent summaries
4. Create well-formatted documents

### Endpoints
- Backend runs on configurable port (default: typically 5173 for dev)
- All API communication is handled through the Express backend

## Scripts 📝

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build frontend and backend for production |
| `npm start` | Run production server |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Check TypeScript for type errors |

## Development Tips 💡

### Adding New Components
1. Create component in `src/components/`
2. Export from the component file
3. Import and use in `App.tsx`

### Modifying Capture Logic
Edit capture interval and strategy in `App.tsx` capture effect handlers

### Customizing Exports
Modify `src/utils/docxExporter.ts` to change document structure or formatting

### Styling
- Uses Tailwind CSS for utility-first styling
- Configured via `tailwindcss` and `@tailwindcss/vite`
- Customize in `index.css` and component className attributes

## Environment Variables 🔐

Create a `.env` file with:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Refer to `.env.example` for template.

## Browser Support 🌐

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES2020 support

## Troubleshooting 🔍

### "API Key Invalid"
- Verify your Gemini API key in Settings
- Check that the key has appropriate permissions
- Ensure `.env` file is properly configured

### OCR Not Working
- Check browser console for Tesseract.js errors
- Ensure sufficient memory for OCR processing
- Try a smaller screenshot resolution

### Captures Not Appearing
- Verify capture interval is properly set
- Check browser developer tools for JavaScript errors
- Ensure the browser window has focus

### Build Failures
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version compatibility (v18+)
- Try `npm run clean` followed by `npm run build`

## Performance Considerations ⚡

- Screenshot capture is async to prevent UI blocking
- OCR processing happens in a Web Worker
- Gemini API calls are batched for efficiency
- Consider increasing capture interval on lower-end devices

## License 📄

This project is provided as-is for educational and personal use.

## Contributing 🤝

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support 💬

For issues, questions, or suggestions, please open an issue in the repository.

---

**Made with ❤️ for smarter note-taking and productivity**
