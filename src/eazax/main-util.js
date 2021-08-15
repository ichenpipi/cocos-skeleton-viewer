const { ipcMain } = require('electron');
const PackageUtil = require('./package-util');

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/**
 * 主进程工具
 * @author ifaswind (陈皮皮)
 * @version 20210815
 */
const MainUtil = {

    /**
     * 监听事件（一次性）
     * @param {string} channel 频道
     * @param {Function} callback 回调
     */
    once(channel, callback) {
        ipcMain.once(`${PACKAGE_NAME}:${channel}`, callback);
    },

    /**
     * 监听事件
     * @param {string} channel 频道
     * @param {Function} callback 回调
     */
    on(channel, callback) {
        ipcMain.on(`${PACKAGE_NAME}:${channel}`, callback);
    },

    /**
     * 取消事件监听
     * @param {string} channel 频道
     * @param {Function} callback 回调
     */
    removeListener(channel, callback) {
        ipcMain.removeListener(`${PACKAGE_NAME}:${channel}`, callback);
    },

    /**
     * 取消事件的所有监听
     * @param {string} channel 频道
     */
    removeAllListeners(channel) {
        ipcMain.removeAllListeners(`${PACKAGE_NAME}:${channel}`);
    },

    /**
     * 发送事件到指定渲染进程
     * @param {Electron.WebContents} webContents 渲染进程事件对象
     * @param {string} channel 频道
     * @param {any[]?} args 参数
     */
    send(webContents, channel, ...args) {
        webContents.send(`${PACKAGE_NAME}:${channel}`, ...args);
    },

    /**
     * 回复事件给渲染进程
     * @param {Electron.IpcMainEvent} ipcMainEvent 事件对象
     * @param {string} channel 频道
     * @param {any[]?} args 参数
     */
    reply(ipcMainEvent, channel, ...args) {
        ipcMainEvent.reply(`${PACKAGE_NAME}:${channel}`, ...args);
    },

};

module.exports = MainUtil;
