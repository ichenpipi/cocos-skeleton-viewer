const I18n = require('./i18n');
const PackageUtil = require('./package-util');
const Updater = require('./updater');

/** 编辑器语言 */
const LANG = Editor.lang;

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/** 扩展名称 */
const EXTENSION_NAME = I18n.translate(LANG, 'name');

/**
 * 编辑器工具 (主进程) (Cocos Creator 2.x)
 * @author ifaswind (陈皮皮)
 * @version 20210726
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
    translate(key) {
        return I18n.translate(LANG, key);
    },

    /**
     * 打印信息到控制台
     * @param {'log' | 'info' | 'warn' | 'error' | any} type
     * @param {any[]?} args 
     */
    print(type, ...args) {
        const header = `[${EXTENSION_NAME}]`;
        switch (type) {
            case 'log': {
                Editor.log(header, ...args);
                break;
            }
            case 'info': {
                Editor.info(header, ...args);
                break;
            }
            case 'warn': {
                Editor.warn(header, ...args);
                break;
            }
            case 'error': {
                Editor.error(header, ...args);
                break;
            }
            default: {
                Editor.log(header, type, ...args);
            }
        }
    },

    /**
     * 检查更新
     * @param {boolean} logWhatever 无论有无更新都打印提示
     */
    async checkUpdate(logWhatever) {
        // 编辑器本次启动是否已经检查过了
        if (!logWhatever && (Editor[PACKAGE_NAME] && Editor[PACKAGE_NAME].hasCheckUpdate)) {
            return;
        }
        Editor[PACKAGE_NAME] = { hasCheckUpdate: true };
        // 是否有新版本
        const hasNewVersion = await Updater.check();
        // 打印到控制台
        const { print, translate } = EditorUtil;
        if (hasNewVersion) {
            const remoteVersion = await Updater.getRemoteVersion();
            print('info', `${translate('hasNewVersion')}${remoteVersion}`);
            print('info', translate('releases'));
            print('info', translate('cocosStore'));
        } else if (logWhatever) {
            print('info', translate('currentLatest'));
        }
    },

};

module.exports = EditorUtil;
