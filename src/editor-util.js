const I18n = require('./i18n');
const Updater = require('./updater');

/** 编辑器语言 */
const LANG = Editor.lang;

/**
 * i18n
 * @param {string} key
 * @returns {string}
 */
function translate(key) {
    return I18n.translate(LANG, key);
}

/** 扩展名称 */
const EXTENSION_NAME = translate('name');

/**
 * 编辑器主进程工具 (Cocos Creator 2.x)
 * @author ifaswind (陈皮皮)
 * @version 20210712
 */
const EditorUtil = {

    /**
     * 语言
     */
    get language() {
        return LANG;
    },

    /**
     * i18n
     * @param {string} key 关键词
     * @returns {string}
     */
    translate,

    /**
     * 打印信息到控制台
     * @param {'log' | 'info' | 'warn' | 'error' | string} type 类型 | 内容
     * @param {any[]} msgs 消息
     */
    print(type, ...msgs) {
        const message = `[${EXTENSION_NAME}] ${msgs.join(' ')}`;
        switch (type) {
            default:
            case 'log': {
                Editor.log(message);
                break;
            }
            case 'info': {
                Editor.info(message);
                break;
            }
            case 'warn': {
                Editor.warn(message);
                break;
            }
            case 'error': {
                Editor.error(message);
                break;
            }
        }
    },

    /**
     * 检查更新
     * @param {boolean} logWhatever 无论有无更新都打印提示
     */
    async checkUpdate(logWhatever) {
        const hasNewVersion = await Updater.check();
        // 打印到控制台
        if (hasNewVersion) {
            const remoteVersion = await Updater.getRemoteVersion();
            EditorUtil.print('info', `${translate('hasNewVersion')}${remoteVersion}`);
            EditorUtil.print('info', translate('releases'));
            EditorUtil.print('info', translate('cocosStore'));
        } else if (logWhatever) {
            EditorUtil.print('info', translate('currentLatest'));
        }
    },

};

module.exports = EditorUtil;
