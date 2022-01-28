'use strict';

const MainEvent = require('../eazax/main-event');
const EditorMainKit = require('../eazax/editor-main-kit');
const { checkUpdate, reload } = require('../eazax/editor-main-util');
const { openRepository } = require('../eazax/package-util');
const ConfigManager = require('../common/config-manager');
const Opener = require('./opener');
const PanelManager = require('./panel-manager');
const Updater = require('../eazax/updater');
const EditorAdapter = require('../common/editor-adapter');

/**
 * 生命周期：加载
 */
function load() {
    // 设置仓库分支
    Updater.branch = 'v3';
    // 监听事件
    EditorMainKit.register();
    MainEvent.on('ready', onReadyEvent);
    MainEvent.on('close', onCloseEvent);
    MainEvent.on('reload', onReloadEvent);
    MainEvent.on('select', onSelectEvent);
    MainEvent.on('view', onViewEvent);
}

/**
 * 生命周期：卸载
 */
function unload() {
    // 取消事件监听
    EditorMainKit.unregister();
    MainEvent.removeAllListeners('ready');
    MainEvent.removeAllListeners('close');
    MainEvent.removeAllListeners('reload');
    MainEvent.removeAllListeners('select');
    MainEvent.removeAllListeners('view');
}

/**
 * （渲染进程）预览面板就绪事件回调
 * @param {Electron.IpcMainEvent} event 
 */
function onReadyEvent(event) {
    // 保存预览面板的 WebContents
    PanelManager.viewWebContents = event.sender;
    // 检查编辑器选中
    Opener.checkEditorCurSelection();
}

/**
 * （渲染进程）预览面板关闭事件回调
 * @param {Electron.IpcMainEvent} event 
 */
function onCloseEvent(event) {
    PanelManager.viewWebContents = null;
}

/**
 * （渲染进程）重新加载事件回调
 * @param {Electron.IpcMainEvent} event 
 */
function onReloadEvent(event) {
    reload();
}

/**
 * （渲染进程）预览事件回调
 * @param {Electron.IpcMainEvent} event 
 */
function onViewEvent(event, uuid) {
    PanelManager.openViewPanel();
    EditorAdapter.Selection.clear('asset');
    EditorAdapter.Selection.select('asset', uuid);
}

/**
 * （渲染进程）选择文件事件回调
 * @param {Electron.IpcMainEvent} event 
 */
function onSelectEvent(event) {
    Opener.selectLocalFiles();
}

/**
 * 编辑器选中事件回调
 * @param {string} type 类型
 * @param {string[]} uuids uuids
 */
function onSelectionSelect(type, uuids) {
    if (PanelManager.getViewPanelWebContents()) {
        Opener.identifySelection(type, uuids);
    }
}

exports.load = load;

exports.unload = unload;

exports.methods = {

    /**
     * 打开预览面板
     */
    openViewPanel() {
        PanelManager.openViewPanel();
    },

    /**
     * 打开设置面板
     */
    openSettingsPanel() {
        PanelManager.openSettingsPanel();
    },

    /**
     * 检查更新
     */
    menuCheckUpdate() {
        checkUpdate(true);
    },

    /**
     * 版本号
     */
    menuVersion() {
        openRepository();
    },

    /**
     * 场景编辑器就绪后
     */
    onSceneReady() {
        // 自动检查更新
        const config = ConfigManager.get();
        if (config.autoCheckUpdate) {
            checkUpdate(false);
        }
    },

    /**
     * 编辑器选中事件回调
     * @param {'asset' | 'node'} type 类型
     * @param {string} uuid uuid
     */
    onSelectionSelect(type, uuid) {
        const uuids = EditorAdapter.Selection.getSelected(type);
        onSelectionSelect(type, uuids);
    },

};
