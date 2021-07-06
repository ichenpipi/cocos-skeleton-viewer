const { BrowserWindow } = require('electron');
const I18n = require('./i18n');

/** 包名 */
const PACKAGE_NAME = require('../package.json').name;

/** 语言 */
const LANG = Editor.lang;

/**
 * i18n
 * @param {string} key
 * @returns {string}
 */
const translate = (key) => I18n.translate(LANG, key);

/** 扩展名称 */
const EXTENSION_NAME = translate('name');

/**
 * 面板管理器
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
        if (this.settingPanel) {
            this.closeSettingPanel();
            return;
        }
        // 创建窗口
        const winSize = [500, 355],
            winPos = this.getPosition(winSize, 'center'),
            win = settingPanel = new BrowserWindow({
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
                skipTaskbar: true,
                alwaysOnTop: true,
                hasShadow: false,
                show: false,
                webPreferences: {
                    nodeIntegration: true,
                },
            });
        // 加载页面（并传递当前语言）
        win.loadURL(`file://${__dirname}/renderer/setting/index.html?lang=${LANG}`);
        // 监听按键（ESC 关闭）
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'Escape') this.closeSettingPanel();
        });
        // 就绪后展示（避免闪烁）
        win.on('ready-to-show', () => win.show());
        // 失焦后（自动关闭）
        win.on('blur', () => this.closeSettingPanel());
        // 关闭后（移除引用）
        win.on('closed', () => (this.settingPanel = null));
        // 调试用的 devtools（detach 模式需要取消失焦自动关闭）
        // win.webContents.openDevTools({ mode: 'detach' });
    },

    /**
     * 关闭面板
     */
    closeSettingPanel() {
        if (!this.settingPanel) {
            return;
        }
        // 先隐藏再关闭
        this.settingPanel.hide();
        // 关闭
        this.settingPanel.close();
        // 移除引用
        this.settingPanel = null;
    },

    /**
     * 获取窗口位置
     * @param {[number, number]} size 窗口尺寸
     * @param {'top' | 'center'} anchor 锚点
     * @returns {[number, number]}
     */
    getPosition(size, anchor) {
        // 根据编辑器窗口的位置和尺寸来计算
        const editorWin = BrowserWindow.getFocusedWindow(),
            editorSize = editorWin.getSize(),
            editorPos = editorWin.getPosition();
        // 注意：原点 (0, 0) 在屏幕左上角
        // 另外，窗口的位置值必须是整数，否则修改无效（像素的最小粒度为 1）
        const x = Math.floor(editorPos[0] + (editorSize[0] / 2) - (size[0] / 2));
        let y;
        switch (anchor || 'top') {
            case 'top': {
                y = Math.floor(editorPos[1]);
                break;
            }
            case 'center': {
                y = Math.floor(editorPos[1] + (editorSize[1] / 2) - (size[1] / 2));
                break;
            }
        }
        return [x, y];
    },

};

module.exports = PanelManager;
