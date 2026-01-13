# Big Label Maker

A web application for designing single-page labels on 8.5" x 11" paper with auto-fit text, emoji/clipart support, and a custom clipart library.

## Features

- **Page Setup**: Configure page size, orientation, and margins
- **Auto-fit Text**: Automatically sizes text to fill the printable area
- **Emoji Support**: Add emoji decorations with drag-and-drop positioning
- **Clipart Library**: Upload and manage custom clipart (SVG, PNG, JPEG, GIF, WebP)
- **Save/Load Designs**: Persist your label designs to the database
- **Print Ready**: WYSIWYG preview that matches actual print output

## Tech Stack

- **Frontend**: Svelte 4 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
# Clone or navigate to the project directory
cd /path/to/BLM

# Install all dependencies and initialize database
npm run setup
```

### Development

Run both frontend and backend in development mode:

```bash
# Terminal 1: Start backend (port 3001)
npm run dev:backend

# Terminal 2: Start frontend (port 5173)
npm run dev:frontend
```

Or run both concurrently:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Production Build

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

The production server serves the built frontend from the backend at http://localhost:3001.

## Project Structure

```
BLM/
├── frontend/                 # Svelte + Vite frontend
│   ├── src/
│   │   ├── components/       # Svelte components
│   │   │   ├── App.svelte
│   │   │   ├── ControlPanel.svelte
│   │   │   ├── PagePreview.svelte
│   │   │   ├── DraggableElement.svelte
│   │   │   ├── EmojiPicker.svelte
│   │   │   ├── ClipArtLibrary.svelte
│   │   │   └── FileUploader.svelte
│   │   ├── stores/           # Svelte stores
│   │   │   ├── labelStore.js
│   │   │   └── clipartStore.js
│   │   ├── lib/              # Utility functions
│   │   │   └── autofit.js    # Auto-fit algorithm
│   │   ├── app.css           # Global styles
│   │   └── main.js           # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                  # Node.js + Express backend
│   ├── routes/
│   │   ├── clipart.js        # Clipart API endpoints
│   │   └── designs.js        # Designs API endpoints
│   ├── db/
│   │   ├── schema.sql        # Database schema
│   │   ├── init.js           # Database initialization
│   │   └── database.js       # Database connection
│   ├── uploads/              # Uploaded clipart files
│   ├── server.js             # Express server
│   └── package.json
│
├── package.json              # Root package with convenience scripts
└── README.md
```

## API Endpoints

### Clipart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clipart` | List/search clipart |
| GET | `/api/clipart/:id` | Get clipart metadata |
| GET | `/api/clipart/:id/file` | Serve clipart file |
| POST | `/api/clipart` | Upload new clipart |
| PUT | `/api/clipart/:id` | Update clipart metadata |
| DELETE | `/api/clipart/:id` | Delete clipart |

### Designs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/designs` | List saved designs |
| GET | `/api/designs/:id` | Get design with full data |
| POST | `/api/designs` | Save new design |
| PUT | `/api/designs/:id` | Update existing design |
| DELETE | `/api/designs/:id` | Delete design |

## Usage Guide

### Creating a Label

1. **Enter Text**: Type your label text in the "Label Text" field
2. **Configure Font**: Choose font family, style (bold/italic), and color
3. **Adjust Alignment**: Set horizontal and vertical text alignment
4. **Auto-fit**: Keep "Auto-fit text to page" enabled for automatic sizing

### Adding Decorations

1. **Emoji**: Click "Add Emoji" to open the emoji picker, then click to add
2. **Clipart**: Open the Clip Art Library panel to browse or upload images
3. **Positioning**: Drag elements to position them, use arrow keys for fine-tuning

### Page Setup

1. **Size**: Choose US Letter (8.5" x 11") or A4
2. **Orientation**: Portrait or Landscape
3. **Margins**: Adjust margins to define the printable area

### Saving and Loading

1. **Save**: Click "Save" and enter a name for your design
2. **Load**: Click "Load" to see a list of saved designs
3. **New**: Click "New" to start fresh (clears current design)

### Printing

1. Click the "Print" button to open the browser print dialog
2. Ensure "Scale" is set to 100% in print settings
3. The preview matches the actual printed output

## Auto-fit Algorithm

The auto-fit algorithm uses binary search to find the maximum font size that allows text to fit within the printable margins:

1. Uses an off-screen canvas for text measurement
2. Handles multi-line text and word wrapping
3. Accounts for font family, weight, and style
4. Runs in real-time as you type

## Print CSS

The application uses CSS `@page` rules for accurate printing:

- Page size: `letter` (8.5" x 11")
- Zero browser margins
- Color-accurate printing
- Non-print elements hidden during print

## Troubleshooting

### Common Issues

**Database not found**
```bash
npm run init-db
```

**Port already in use**
- Backend: Change PORT in backend (default 3001)
- Frontend: Vite will automatically find an available port

**Clipart not loading**
- Check that the uploads directory exists
- Verify file permissions

**Print preview doesn't match**
- Ensure browser zoom is at 100%
- Check print dialog scaling settings
- Use Chrome or Firefox for best results

## Testing Checklist

- [ ] Create a new label with text
- [ ] Verify auto-fit adjusts font size correctly
- [ ] Add emoji and drag to reposition
- [ ] Upload a custom clipart image
- [ ] Add clipart from library to label
- [ ] Save a design
- [ ] Load a saved design
- [ ] Print preview matches on-screen preview
- [ ] Actual print output matches preview
- [ ] Test portrait and landscape orientations
- [ ] Test different margin settings
- [ ] Test multi-line text
- [ ] Delete clipart from library

## License

MIT
