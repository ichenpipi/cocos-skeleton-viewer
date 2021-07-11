const { ipcMain } = require('electron');

/** 包名 */
const PACKAGE_NAME = require('../package.json').name;

/**
 * 主进程工具
 * @author ifaswind (陈皮皮)
 * @version 20210703
 */
const MainUtil = {

    /**
     * 监听事件（一次性）
     * @param {string} event 事件名
     * @param {Function} callback 回调
     */
    once(event, callback) {
        ipcMain.once(`${PACKAGE_NAME}:${event}`, callback);
    },

    /**
     * 监听事件
     * @param {string} event 事件名
     * @param {Function} callback 回调
     */
    on(event, callback) {
        ipcMain.on(`${PACKAGE_NAME}:${event}`, callback);
    },

    /**
     * 取消事件监听
     * @param {string} event 事件名
     */
    removeAllListeners(event) {
        ipcMain.removeAllListeners(`${PACKAGE_NAME}:${event}`);
    },

    /**
     * 发送事件到指定渲染进程
     * @param {EventEmitter} sender 渲染进程实例
     * @param {string} event 事件名
     * @param {...any} args 参数
     */
    send(sender, event, ...args) {
        sender.send(`${PACKAGE_NAME}:${event}`, ...args);
    },

};

module.exports = MainUtil;
