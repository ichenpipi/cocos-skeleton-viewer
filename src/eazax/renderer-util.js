const { ipcRenderer } = require('electron');
const PackageUtil = require('./package-util');

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/**
 * 渲染进程工具
 * @author ifaswind (陈皮皮)
 * @version 20210730
 */
const RendererUtil = {

    /**
     * 监听事件（一次性）
     * @param {string} channel 频道
     * @param {Function} callback 回调
     */
    once(channel, callback) {
        ipcRenderer.once(`${PACKAGE_NAME}:${channel}`, callback);
    },

    /**
     * 监听事件
     * @param {string} channel 频道
     * @param {Function} callback 回调
     */
    on(channel, callback) {
        ipcRenderer.on(`${PACKAGE_NAME}:${channel}`, callback);
    },

    /**
     * 取消事件监听
     * @param {string} channel 频道
     * @param {Function} callback 回调
     */
    removeListener(channel, callback) {
        ipcRenderer.removeListener(`${PACKAGE_NAME}:${channel}`, callback);
    },

    /**
     * 取消事件的所有监听
     * @param {string} channel 频道
     */
    removeAllListeners(channel) {
        ipcRenderer.removeAllListeners(`${PACKAGE_NAME}:${channel}`);
    },

    /**
     * 发送事件到主进程
     * @param {string} channel 频道
     * @param {...any} args 参数
     */
    send(channel, ...args) {
        ipcRenderer.send(`${PACKAGE_NAME}:${channel}`, ...args);
    },

    /**
     * 发送事件到主进程（同步）
     * @param {string} channel 频道
     * @param {...any} args 参数
     * @returns {Promise<any>}
     */
    sendSync(channel, ...args) {
        return ipcRenderer.sendSync(`${PACKAGE_NAME}:${channel}`, ...args);
    },

    /**
     * 打印信息到 Creator 编辑器控制台
     * @param {'log' | 'info' | 'warn' | 'error' | any} type 
     * @param {any[]?} args 
     */
    print(type, ...args) {
        RendererUtil.send('print', type, ...args);
    },

};

module.exports = RendererUtil;
