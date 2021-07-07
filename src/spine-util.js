/**
 * Spine 工具
 * @version 20210703
 */
const SpineUtil = {

    /**
     * 缓存
     */
    cache: {
        '3.5': null,
        '3.6': null,
        '3.7': null,
        '3.8': null,
        '4.0': null,
    },

    /**
     * 获取 Spine 运行时
     * @param {string} version 版本
     */
    getSpine(version) {
        const cache = this.cache;
        if (cache[version] === null) {
            const libPath = `../lib/spine-runtimes/${version}/spine-webgl`;
            cache[version] = require(libPath);
            // 注入版本号
            cache[version].version = version;
        }
        return cache[version];
    },

};

module.exports = SpineUtil;
