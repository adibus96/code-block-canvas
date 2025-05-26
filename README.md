# CodeBlock Canvas

An interactive digital whiteboard for visualizing code structures and program flow. Drag, drop, and connect code snippets to create dynamic flowcharts that bridge the gap between abstract concepts and tangible code.

## Features

- **Interactive CodeBlocks**: Drag and drop code snippets on an infinite canvas
- **Visual Connections**: Draw arrows between CodeBlocks to represent program flow
- **Syntax Highlighting**: Automatic code highlighting for multiple programming languages
- **Real-time Editing**: Edit code directly within CodeBlocks
- **Export/Import**: Save and load your canvas diagrams

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click "Add Code Block" to create a new code block on the canvas
2. Drag code blocks around to position them
3. Click on a code block to select it
4. Use the toolbar to add connections between blocks

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and development server
- **Konva.js** - 2D canvas library for interactive graphics
- **Vue-Konva** - Vue bindings for Konva
- **PrismJS** - Syntax highlighting library

## Project Structure

```
src/
├── components/
│   ├── Canvas.vue      # Main canvas component
│   └── CodeBlock.vue   # Individual code block component
├── App.vue             # Root application component
└── main.js            # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
