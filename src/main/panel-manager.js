const { BrowserWindow } = require('electron');
const { resolve, join } = require('path');
const PackageUtil = require('../eazax/package-util');
const { language, translate } = require('../eazax/editor-util');
const { calcWindowPosition } = require('../eazax/window-util');

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/** 扩展名称 */
const EXTENSION_NAME = translate('name');

/**
 * 面板管理器 (主进程)
 */
const PanelManager = {

    /**
     * 打开预览面板
     */
    openViewPanel() {
        Editor.Panel.open(`${PACKAGE_NAME}.view`);
    },

    /**
     * 面板实例
     * @type {BrowserWindow}
     */
    settingPanel: null,

    /**
     * 打开面板
     */
    openSettingPanel() {
        // 已打开则关闭
        if (PanelManager.settingPanel) {
            // PanelManager.settingPanel.focus();
            PanelManager.closeSettingPanel();
            return;
        }
        // 窗口高度和位置（macOS 标题栏高 28px）
        const winSize = [500, 340],
            winPos = calcWindowPosition(winSize, 'center');
        // 创建窗口
        const win = PanelManager.settingPanel = new BrowserWindow({
            width: winSize[0],
            height: winSize[1],
            minWidth: winSize[0],
            minHeight: winSize[1],
            x: winPos[0],
            y: winPos[1] - 100,
            frame: true,
            title: `${EXTENSION_NAME} | Cocos Creator`,
            autoHideMenuBar: true,
            resizable: true,
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            skipTaskbar: false,
            alwaysOnTop: true,
            hasShadow: true,
            show: false,
            webPreferences: {
                nodeIntegration: true,
            },
        });
        // 加载页面（并传递当前语言）
        const path = join(resolve(__dirname, '..'), '/renderer/setting/index.html');
        win.loadURL(`file://${path}?lang=${language}`);
        // 监听按键（ESC 关闭）
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'Escape') PanelManager.closeSettingPanel();
        });
        // 就绪后（展示，避免闪烁）
        win.on('ready-to-show', () => win.show());
        // 失焦后（关闭窗口）
        win.on('blur', () => PanelManager.closeSettingPanel());
        // 关闭后（移除引用）
        win.on('closed', () => (PanelManager.settingPanel = null));
        // 调试用的 devtools（detach 模式需要取消失焦自动关闭）
        // win.webContents.openDevTools({ mode: 'detach' });
    },

    /**
     * 关闭面板
     */
    closeSettingPanel() {
        if (!PanelManager.settingPanel) {
            return;
        }
        // 先隐藏再关闭
        PanelManager.settingPanel.hide();
        // 关闭
        PanelManager.settingPanel.close();
        // 移除引用
        PanelManager.settingPanel = null;
    },

};

module.exports = PanelManager;
