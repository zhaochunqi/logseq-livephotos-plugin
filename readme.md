# Logseq Live Photos Plugin 📸

Add live photos support to Logseq with enhanced media handling and interactive features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Logseq Plugin](https://img.shields.io/badge/Logseq-Plugin-blue.svg)](https://logseq.com/)
[![Version](https://img.shields.io/github/v/release/zhaochunqi/logseq-livephotos-plugin)](https://github.com/zhaochunqi/logseq-livephotos-plugin/releases)
[![中文文档](https://img.shields.io/badge/文档-中文-red.svg)](./readme.zh-CN.md)

## 🎬 Demo

Here's a demo of the Live Photos Plugin in action:

![Live Photos Demo](./livephotos.gif)

### Batch Auto-Conversion Demo

![Batch Auto-Conversion Demo](./batch-auto-conversion-demo.gif)

## ✨ Features

- 📸 **Live Photos Support**: Seamlessly integrate live photos into your Logseq workflow
- 🎬 **Enhanced Media Handling**: Optimized for video and animated content
- ⚡ **Smart Auto-Conversion**: Automatically detect and convert image/video pairs into live photos
- 🎛️ **Customizable Settings**: Configure regex patterns, sound defaults, and auto-conversion
- 🔄 **Batch Processing**: Convert entire pages or specific blocks with preview
- ⌨️ **Convenient Commands**: Slash commands and palette shortcuts for quick access



## 📝 Usage

### Basic Usage

1. Install the plugin from Marketplace or manually
2. Restart Logseq
3. Access live photos features through the toolbar buttons or slash commands
4. Add live photos to your notes and pages
5. Configure settings as needed

### Manual Live Photo Creation

Create live photos using the macro syntax:

```
{{renderer :live-photo, photo_url, video_url}}
```

Example:
```
{{renderer :live-photo, ./images/photo-abc123.jpg, ./videos/photo-abc123.mov}}
```

### Auto-Conversion

1. Enable "Auto Convert" in plugin settings
2. Configure the regex pattern to match your file naming convention
3. Paste images and videos into Logseq - they'll be automatically converted to live photos when matching pairs are found

### Default Regex Pattern

The default regex pattern: `^(.*?)-([A-Za-z0-9]{5,6})\\.(jpg|jpeg|png|gif|mov|mp4)$`

This matches files like:
- `photo-abc123.jpg` and `photo-abc123.mov`
- `image-def456.png` and `image-def456.mp4`

### Commands

#### Slash Commands
- `/[Live Photos] insert macro` - Insert live photo macro template
- `/[Live Photos] convert page` - Convert current page with preview
- `/[Live Photos] settings` - Open plugin settings

#### Command Palette
- `Live Photos: Settings` - Open plugin settings
- `Live Photos: Convert Current Page` - Convert with preview dialog
- `Live Photos: Quick Convert Current Page` - Convert without preview

#### Toolbar Buttons
- 📷 **Convert** - Open conversion dialog with preview
- ⚡ **Quick Convert** - Convert current page immediately
- ⚙️ **Settings** - Open plugin settings

### Settings

- **Regex Pattern**: Customize file naming pattern detection
- **Auto Convert**: Enable automatic conversion when pasting media files
- **Enable Sound**: Control default audio behavior for live photos

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/zhaochunqi/logseq-livephotos-plugin)
- [Issues & Support](https://github.com/zhaochunqi/logseq-livephotos-plugin/issues)
- [中文文档](./readme.zh-CN.md) (Chinese Documentation)
