const fetch = require('../../lib/node-fetch');
const PackageUtil = require('./package-util');

/** 本地版本 */
const LOCAL_VERSION = PackageUtil.version;

/** 远程仓库地址 */
const REMOTE_URL = PackageUtil.repository;

/**
 * 更新器
 * @author ifaswind (陈皮皮)
 * @version 20210804
 */
const Updater = {

    /**
     * 远程仓库地址
     * @type {string}
     */
    get remote() {
        return REMOTE_URL;
    },

    /**
     * 分支
     * @type {string}
     */
    branch: 'master',

    /**
     * 获取远端的 package.json
     * @returns {Promise<object>}
     */
    async getRemotePackageJson() {
        const packageJsonUrl = `${Updater.remote}/raw/${Updater.branch}/package.json`;
        // 发起网络请求
        const response = await fetch(packageJsonUrl, {
            method: 'GET',
            cache: 'no-cache',
            mode: 'no-cors',
        });
        // 请求结果
        if (response.status !== 200) {
            return null;
        }
        // 读取 json
        const json = response.json();
        return json;
    },

    /**
     * 获取远端版本号
     * @returns {Promise<string>}
     */
    async getRemoteVersion() {
        const package = await Updater.getRemotePackageJson();
        if (!package) {
            return null;
        }
        const version = package.version || null;
        return version;
    },

    /**
     * 获取本地版本号
     * @returns {string}
     */
    getLocalVersion() {
        return LOCAL_VERSION;
    },

    /**
     * 拆分版本号
     * @param {string} version 版本号文本
     * @returns {number[]}
     * @example
     * splitVersionString('1.2.0');  // [1, 2, 0]
     */
    splitVersionString(version) {
        return (
            version.replace(/-/g, '.')
                .split('.')
                .map(v => (parseInt(v) || 0))
        );
    },

    /**
     * 对比版本号
     * @param {string} a 版本 a
     * @param {string} b 版本 b
     * @returns {-1 | 0 | 1}
     * @example
     * compareVersion('1.0.0', '1.0.1');    // -1
     * compareVersion('1.1.0', '1.1.0');    // 0
     * compareVersion('1.2.1', '1.2.0');    // 1
     * compareVersion('1.2.0.1', '1.2.0');  // 1
     */
    compareVersion(a, b) {
        const acs = Updater.splitVersionString(a),
            bcs = Updater.splitVersionString(b);
        const count = Math.max(acs.length, bcs.length);
        for (let i = 0; i < count; i++) {
            const ac = acs[i],
                bc = bcs[i];
            // 前者缺少分量或前者小于后者
            if (ac == undefined || ac < bc) {
                return -1;
            }
            // 后者缺少分量或前者大于后者
            if (bc == undefined || ac > bc) {
                return 1;
            }
        }
        return 0;
    },

    /**
     * 检查远端是否有新版本
     * @returns {Promise<boolean>}
     */
    async check() {
        // 远端版本号
        const remoteVersion = await Updater.getRemoteVersion();
        if (!remoteVersion) {
            return false;
        }
        // 本地版本号
        const localVersion = Updater.getLocalVersion();
        // 对比版本号
        const result = Updater.compareVersion(localVersion, remoteVersion);
        return (result < 0);
    },

};

module.exports = Updater;
