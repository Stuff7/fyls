# Fyls

A file explorer, image viewer and video player with extended controls — all in your browser, through the `file://` protocol.

## Build

```bash
nvm use 22.17
npm run build
```

## Usage

1. Open `dist/index.html` in your browser.
2. Enter the path to the **parent** of the directory you want to browse in the **Root directory** field.

   * This is required because browsers only expose names of files inside the selected directory, not its full path.
3. Click **Select directory** and upload the folder you want to explore.
