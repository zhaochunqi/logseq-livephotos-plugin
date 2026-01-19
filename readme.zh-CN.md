# Logseq Live Photos 插件 📸

为 Logseq 添加实况照片支持，增强媒体处理和交互功能。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Logseq Plugin](https://img.shields.io/badge/Logseq-Plugin-blue.svg)](https://logseq.com/)
[![Version](https://img.shields.io/github/v/release/zhaochunqi/logseq-livephotos-plugin)](https://github.com/zhaochunqi/logseq-livephotos-plugin/releases)
[![English](https://img.shields.io/badge/文档-English-blue.svg)](./readme.md)

## 🎬 演示

实况照片插件的实际效果演示：

![实况照片演示](./livephotos.gif)

### 批量自动转换演示

![批量自动转换演示](./batch-auto-conversion-demo.gif)

## ✨ 功能特性

- 📸 **实况照片支持**：将实况照片无缝集成到 Logseq 工作流中
- 🎬 **增强媒体处理**：针对视频和动画内容进行优化
- ⚡ **智能自动转换**：自动检测并将图片/视频对转换为实况照片
- 🎛️ **自定义设置**：配置正则表达式模式、声音默认值和自动转换
- 🔄 **批量处理**：带预览功能转换整个页面或特定块
- ⌨️ **便捷命令**：斜杠命令和面板快捷键，快速访问

## 📝 使用方法

### 手动创建实况照片

使用宏语法创建实况照片：

```
{{renderer :live-photo, 照片URL, 视频URL}}
```

示例：
```
{{renderer :live-photo, ./images/photo-abc123.jpg, ./videos/photo-abc123.mov}}
```

### 自动转换

1. 在插件设置中启用"自动转换"
2. 配置正则表达式模式以匹配文件命名约定
3. 将图片和视频粘贴到 Logseq 中 - 当找到匹配的对时，它们会自动转换为实况照片

### 默认正则表达式模式

默认正则表达式：`^(.*?)-([A-Za-z0-9]{5,6})\\.(jpg|jpeg|png|gif|mov|mp4)$`

这会匹配如下文件：
- `photo-abc123.jpg` 和 `photo-abc123.mov`
- `image-def456.png` 和 `image-def456.mp4`

### 命令

#### 斜杠命令
- `/[实况照片] 插入宏` - 插入实况照片宏模板
- `/[实况照片] 转换页面` - 带预览转换当前页面
- `/[实况照片] 设置` - 打开插件设置

#### 命令面板
- `实况照片：设置` - 打开插件设置
- `实况照片：转换当前页面` - 打开带预览的转换对话框
- `实况照片：快速转换当前页面` - 无预览直接转换

#### 工具栏按钮
- 📷 **转换** - 打开带预览的转换对话框
- ⚡ **快速转换** - 立即转换当前页面
- ⚙️ **设置** - 打开插件设置

### 设置选项

- **正则表达式模式**：自定义文件命名模式检测
- **自动转换**：粘贴媒体文件时启用自动转换
- **启用声音**：控制实况照片的默认音频行为

## 🔗 相关链接

- [GitHub 仓库](https://github.com/zhaochunqi/logseq-livephotos-plugin)
- [问题反馈与支持](https://github.com/zhaochunqi/logseq-livephotos-plugin/issues)
- [English Documentation](./readme.md)

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

本项目在 MIT 许可证下授权 - 详见 [LICENSE](LICENSE) 文件。