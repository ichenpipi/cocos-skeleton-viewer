/** 包信息 */
const PACKAGE_JSON = require('../../package.json');

/**
 * 包工具
 * @author ifaswind (陈皮皮)
 * @version 20210713
 */
const PackageUtil = {

    /**
     * 包名
     * @type {string}
     */
    get name() {
        return PACKAGE_JSON.name;
    },

    /**
     * 版本
     * @type {string}
     */
    get version() {
        return PACKAGE_JSON.version;
    },

    /**
     * 仓库地址
     * @type {string}
     */
    get repositoryUrl() {
        return PACKAGE_JSON.repository.url;
    },

};

module.exports = PackageUtil;
