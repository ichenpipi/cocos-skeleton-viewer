const zh = require('../../i18n/zh');
const en = require('../../i18n/en');

/**
 * 多语言
 * @author ifaswind (陈皮皮)
 * @version 20210713
 */
const I18n = {

    /**
     * 中文
     */
    zh,

    /**
     * 英文
     */
    en,

    /**
     * 多语言文本
     * @param {string} lang 语言
     * @param {string} key 关键字
     * @returns {string}
     */
    translate(lang, key) {
        if (this[lang] && this[lang][key]) {
            return this[lang][key];
        }
        return key;
    },

};

module.exports = I18n;
