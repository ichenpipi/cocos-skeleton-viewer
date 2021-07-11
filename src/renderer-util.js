const { ipcRenderer, shell } = require('electron');

/** 包名 */
const PACKAGE_NAME = require('../package.json').name;

/**
 * 渲染进程工具
 * @author ifaswind (陈皮皮)
 * @version 20210703
 */
const RendererUtil = {

    /**
     * 监听事件（一次性）
     * @param {string} event 事件名
     * @param {Function} callback 回调
     */
    once(event, callback) {
        ipcRenderer.once(`${PACKAGE_NAME}:${event}`, callback);
    },

    /**
     * 监听事件
     * @param {string} event 事件名
     * @param {Function} callback 回调
     */
    on(event, callback) {
        ipcRenderer.on(`${PACKAGE_NAME}:${event}`, callback);
    },

    /**
     * 取消事件监听
     * @param {string} event 事件名
     */
    removeAllListeners(event) {
        ipcRenderer.removeAllListeners(`${PACKAGE_NAME}:${event}`);
    },

    /**
     * 发送事件到主进程
     * @param {string} event 事件名
     * @param {...any} args 参数
     */
    send(event, ...args) {
        ipcRenderer.send(`${PACKAGE_NAME}:${event}`, ...args);
    },

    /**
     * 发送事件到主进程（同步）
     * @param {string} event 事件名
     * @param {...any} args 参数
     * @returns {Promise<any>}
     */
    sendSync(event, ...args) {
        return ipcRenderer.sendSync(`${PACKAGE_NAME}:${event}`, ...args);
    },

    /**
     * 在用户的默认浏览器中打开 URL 
     * @param {string} url 
     */
    openExternal(url) {
        shell.openExternal(url);
    },

    /**
     * 打印信息到 Creator 编辑器控制台
     * @param {'log' | 'info' | 'warn' | 'error' | string} type 类型 | 内容
     * @param {string} content 内容
     */
    print(type, content = undefined) {
        RendererUtil.send('print', {
            type,
            content,
        });
    },

};

module.exports = RendererUtil;
