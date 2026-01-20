# Live Photos Converter 功能说明

## 新增功能

### 1. 自动配对转换
- **功能**: 自动分析当前页面中的图片和视频，并根据正则表达式匹配成对转换
- **使用**: 
  - 命令面板: `Live Photos: Convert Current Page`
  - 快速转换: `Live Photos: Quick Convert Current Page` (无预览)

### 2. 设置界面
- **正则表达式配置**: 可自定义文件匹配规则
- **默认正则**: `^(.*?)-(\\w{5})\\.(jpg|jpeg|png|gif|mov|mp4)$`
- **设置访问**: 
  - 命令面板: `Live Photos: Settings`
  - 插件设置界面

### 3. 匹配逻辑
- **层级要求**: 必须是同级且连续的block
- **媒体类型**: 支持 `.jpg`, `.jpeg`, `.png`, `.gif`, `.mov`, `.mp4`
- **匹配算法**: 基于文件名相似度(60%以上)和正则匹配
- **转换结果**: 将两个block合并为一个renderer语句

### 4. 使用流程
1. 在Logseq页面中连续插入图片和视频
2. 使用转换命令触发分析
3. 系统显示找到的配对预览
4. 确认后自动转换为: `{{renderer :live-photo, image_url, video_url}}`

### 5. 技术实现
- **BlockAnalyzer**: 负责分析页面结构和媒体提取
- **SettingsManager**: 管理用户设置
- **LivePhotoConverter**: 处理转换逻辑和UI交互

## 示例

### 输入:
```
![20250711-PACKrvgAD-01-hiT3vM](https://assets.logseq.zhaochunqi.com/logseq-assets/20260120/20250711-PACKrvgAD-01-hiT3vM.jpg)
![20250711-PACKrvgAD-01-GvN7in](https://assets.logseq.zhaochunqi.com/logseq-assets/20260120/20250711-PACKrvgAD-01-GvN7in.mov)
```

### 输出:
```
{{renderer :live-photo, https://assets.logseq.zhaochunqi.com/logseq-assets/20260120/20250711-PACKrvgAD-01-hiT3vM.jpg, https://assets.logseq.zhaochunqi.com/logseq-assets/20260120/20250711-PACKrvgAD-01-GvN7in.mov}}
```