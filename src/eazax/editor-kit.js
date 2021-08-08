const MainUtil = require('./main-util');
const { print, checkUpdate } = require('./editor-util');

/**
 * （渲染进程）检查更新回调
 * @param {Electron.IpcMainEvent} event 
 * @param {boolean} logWhatever 无论有无更新都打印提示
 */
function onCheckUpdateEvent(event, logWhatever) {
    checkUpdate(logWhatever);
}

/**
 * （渲染进程）打印事件回调
 * @param {Electron.IpcMainEvent} event 
 * @param {'log' | 'info' | 'warn' | 'error' | any} type 
 * @param {any[]?} args 
 */
function onPrintEvent(event, type, ...args) {
    print(type, ...args);
}

/**
 * 编辑器套件（主进程）
 * @author ifaswind (陈皮皮)
 * @version 20210804
 */
const EditorKit = {

    /**
     * 注册
     */
    register() {
        MainUtil.on('check-update', onCheckUpdateEvent);
        MainUtil.on('print', onPrintEvent);
    },

    /**
     * 取消注册
     */
    unregister() {
        MainUtil.removeListener('check-update', onCheckUpdateEvent);
        MainUtil.removeListener('print', onPrintEvent);
    },

};

module.exports = EditorKit;
