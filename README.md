# AI Video Editor

https://ai-video.yigee.cn/editor/

A video editor application enhanced with AI capabilities.

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

## Mock Data Implementation

This project includes a mock data service to allow development and testing without a backend server.

### Enabling/Disabling Mock Service

- Mock service is enabled by default in the development environment
- You can toggle it by setting `VITE_ENABLE_MOCK` in the `.env.development` file:

  ```bash
  VITE_ENABLE_MOCK = 'true'  # Enable mock service
  VITE_ENABLE_MOCK = 'false' # Disable mock service (use real backend)
  ```

### Available Mock Resources

The mock implementation provides the following resources:

1. **Media Resources**
   - Videos: Accessible via `/assets/video/xgplayer.mp4`
   - Audio: Accessible via `/assets/audio/jin.mp3` and `/assets/audio/1.mp3`
   - Images: Accessible via `/assets/image/1.png` and `/assets/image/background.jpg`

2. **Mock APIs**
   - Resource listing and pagination
   - Resource search
   - Resource operations (save, delete, rename)
   - User account information
   - Token management

### Extending Mock Data

To extend the mock data implementation:

1. Add new mock files in `src/mock/` directory
2. Register your mock module in `src/mock/index.js`
3. Implement corresponding APIs in your service files

## Production Build

```bash
npm run build
```
