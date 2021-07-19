/**
 * 浏览器工具
 * @author ifaswind (陈皮皮)
 * @version 20210621
 */
const BrowserUtil = {

    /**
     * 获取当前 Url 中的参数
     * @param {string} key 键
     * @returns {string}
     */
    getUrlParam(key) {
        if (!window || !window.location) {
            return null;
        }
        const query = window.location.search.replace('?', '');
        if (query === '') {
            return null;
        }
        const substrings = query.split('&');
        for (let i = 0; i < substrings.length; i++) {
            const keyValue = substrings[i].split('=');
            if (decodeURIComponent(keyValue[0]) === key) {
                return decodeURIComponent(keyValue[1]);
            }
        }
        return null;
    },

};

module.exports = BrowserUtil;
