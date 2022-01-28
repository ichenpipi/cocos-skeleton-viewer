const { BrowserWindow } = require('electron');
const { join } = require('path');
const PackageUtil = require('../eazax/package-util');
const { language, translate } = require('../eazax/editor-main-util');
const { calcWindowPositionByFocused } = require('../eazax/window-util');
const EditorAdapter = require('../common/editor-adapter');

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/** 扩展名称 */
const EXTENSION_NAME = translate('name');

/**
 * 面板管理器 (主进程)
 */
const PanelManager = {

    /** 
     * 预览面板的 WebContents
     * @type {Electron.WebContents}
     */
    viewWebContents: null,

    /**
     * 打开预览面板
     */
    openViewPanel() {
        EditorAdapter.Panel.open(`${PACKAGE_NAME}.view`);
    },

    /**
     * 关闭预览面板
     */
    closeViewPanel() {
        EditorAdapter.Panel.close(`${PACKAGE_NAME}.view`);
    },

    /**
     * 获取预览面板的 WebContents
     * @returns {Electron.WebContents}
     */
    getViewPanelWebContents() {
        if (PanelManager.viewWebContents && !PanelManager.viewWebContents.isDestroyed()) {
            return PanelManager.viewWebContents;
        }
        return null;
    },

    /**
     * 设置面板实例
     * @type {BrowserWindow}
     */
    settings: null,

    /**
     * 打开设置面板
     */
    openSettingsPanel() {
        // 已打开则直接展示
        if (PanelManager.settings) {
            PanelManager.settings.show();
            return;
        }
        // 窗口尺寸和位置（macOS 标题栏高 28px）
        const winSize = [500, 350],
            winPos = calcWindowPositionByFocused(winSize, 'center');
        // 创建窗口
        const win = PanelManager.settings = new BrowserWindow({
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
                contextIsolation: false,
            },
        });
        // 就绪后（展示，避免闪烁）
        win.on('ready-to-show', () => win.show());
        // 关闭后
        win.on('closed', () => (PanelManager.settings = null));
        // 监听按键
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'Escape') PanelManager.closeSettingsPanel();
        });
        // 调试用的 devtools
        // win.webContents.openDevTools({ mode: 'detach' });
        // 加载页面
        const path = join(__dirname, '../renderer/settings/index.html');
        win.loadURL(`file://${path}?lang=${language}`);
    },

    /**
     * 关闭设置面板
     */
    closeSettingsPanel() {
        if (!PanelManager.settings) {
            return;
        }
        PanelManager.settings.hide();
        PanelManager.settings.close();
        PanelManager.settings = null;
    },

};

module.exports = PanelManager;
