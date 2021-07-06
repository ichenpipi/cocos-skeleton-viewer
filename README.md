# 骨骼查看器

## 介绍

[Cocos Creator 编辑器扩展]

**用于快速预览骨骼动画，提供独立窗口，也可以附着在编辑器中...**

*目前仅支持 Spine 3.5~3.8 资源，未来应该也会支持 DragonBones 资源。*



## 开源

本扩展项目完全开源，仓库地址：[https://gitee.com/ifaswind/ccc-skeleton-viewer](https://gitee.com/ifaswind/ccc-skeleton-viewer)

如果你觉得这个项目还不错，请不要忘记点 [![star](https://gitee.com/ifaswind/ccc-skeleton-viewer/badge/star.svg?theme=dark)](https://gitee.com/ifaswind/ccc-skeleton-viewer/stargazers)！

*如有使用上的问题，可以在 Gitee 仓库中提 Issue 或者添加我的微信 `im_chenpipi` 并留言。*



## 截图

![screenshot-1](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-1.png)

![screenshot-2](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-2.png)

![screenshot-3](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-3.png)

![screenshot-4](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-4.png)

![screenshot-5](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-5.png)

![screenshot-6](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-6.png)

![screenshot-7](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-7.png)

![screenshot-8](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/screenshot-8.png)

![setting-panel](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/setting-panel.png)



## 运行环境

平台：Windows、macOS

引擎：Cocos Creator 2.x



## 下载 & 安装

### 扩展商店安装

本扩展已上架 Cocos 商店，点击 Cocos Creator 编辑器顶部菜单栏中的 *扩展 -> 扩展商店* 即可打开扩展商店。

在上方搜索栏中输入“**骨骼查看器**”并搜索就可以找到本插件，点进去直接安装即可（建议安装到全局）。

![cocos-store](https://gitee.com/ifaswind/image-storage/raw/master/repositories/ccc-skeleton-viewer/cocos-store.png)

*骨骼查看器：[http://store.cocos.com/app/detail/3008](http://store.cocos.com/app/detail/3008)*



### 自行下载安装

在[此处](https://gitee.com/ifaswind/ccc-skeleton-viewer/releases)或仓库发行版处下载最新的扩展压缩包。

下载完成后将压缩包解压：

- Windows：解压到 `C:\Users\${你的用户名}\.CocosCreator\packages\` 目录下
- macOS：解压到 `~/.CocosCreator/packages/` 目录下

以我的电脑为例，扩展的 `package.json` 文件的完整路径分别为：

- Windows：`C:\Users\Shaun\.CocosCreator\packages\ccc-skeleton-viewer\package.json`
- macOS：`/Users/shaun/.CocosCreator/packages/ccc-skeleton-viewer/package.json`



## 使用说明

### 预览

点击编辑器顶部菜单栏中的 *扩展 -> 骨骼查看器 -> 预览* 即可打开扩展的预览面板。



#### 界面

##### 预览区

面板上半部分是「预览区」：

- 左上角的三个图标分别是：「资源信息」、「选择骨骼动画资源」、「重置」；
- 而右上角为当前正在使用的骨骼动画运行时版本。

*鼠标悬停在「资源信息图标」上即可查看当前的骨骼动画资源信息。*

*当鼠标处于「预览区」中时，滑动鼠标滚轮可以快速缩放预览画面。*



##### 选项区

面板下半部分为「选项区」，包含骨骼动画的一些可选项。

*这些选项只有选择了骨骼动画资源后才会生效。*



#### 附着到编辑器

预览面板可以附着到编辑器窗口内的任意区域（如上方截图中的 7 与 8）。

只需要拖拽到想要的位置并与编辑器窗口交互即可。

*附着后点击面板右上角的「弹出」按钮即可恢复为独立面板。*



#### 选择资源

##### 编辑器内资源

打开预览面板后（或处于附着状态），在编辑器内的「资源管理器」选中任意骨骼资源后，预览面板会自动读取骨骼动画并播放。

你也可以预先选中骨骼资源后再打开预览面板，同样会触发自动读取。

*只有选中了骨骼资源（`json` 或 `skel` 格式）才会进行读取。*



##### 外部资源

点击「预览区」左上角的「选择骨骼动画资源」按钮即可选择外部的动画文件。

*至少需要选择一个骨骼文件（`json` 或 `skel` 格式），纹理（`png` 格式）和图集（`atlas` 格式）可选可不选。*



### 设置

点击编辑器顶部菜单栏中的 *扩展 -> 骨骼查看器 -> 设置* 即可打开扩展的设置面板。

在设置面板中你可以选择一个用来快速打开预览面板的快捷键，也可以自定义一个自己喜欢的快捷键。

不过需要注意的是，并非所有的按键都可以使用，因为有些快捷键已被系统或 Cocos Creator 占用。

*键盘快捷键参考：[https://www.electronjs.org/docs/api/accelerator](https://www.electronjs.org/docs/api/accelerator)*

🥳 Enjoy!



## 更新日志

[发行版](https://gitee.com/ifaswind/ccc-skeleton-viewer/releases)



## 依赖

- [cocos-creator](https://github.com/cocos-creator)
- [electron](https://github.com/electron/electron)
- [vue](https://github.com/vuejs/vue)
- [node-fetch](https://github.com/node-fetch/node-fetch)
- [spine-runtimes](https://github.com/EsotericSoftware/spine-runtimes)



## 许可

本项目使用 [MIT license](https://opensource.org/licenses/MIT) 许可证书。



---



# 公众号

## 菜鸟小栈

😺 我是陈皮皮，一个还在不断学习的游戏开发者，一个热爱分享的 Cocos Star Writer。

🎨 这是我的个人公众号，专注但不仅限于游戏开发和前端技术分享。

💖 每一篇原创都非常用心，你的关注就是我原创的动力！

> Input and output.

![](https://gitee.com/ifaswind/image-storage/raw/master/weixin/official-account.png)



## 开发交流群

皮皮创建了一个**开发交流群**，供小伙伴们交流开发经验、问题求助和摸鱼（划掉）。

感兴趣的小伙伴可以添加我微信 `im_chenpipi` 并留言 `加群`。