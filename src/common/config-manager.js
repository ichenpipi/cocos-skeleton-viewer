const Path = require('path');
const Fs = require('fs');
const PackageUtil = require('../eazax/package-util');

/** 包名 */
const PACKAGE_NAME = PackageUtil.name;

/** package.json 的路径 */
const PACKAGE_PATH = Path.join(__dirname, '../../package.json');

/** 快捷键行为 */
const ACTION_NAME = 'view';

/** package.json 中的菜单项 key */
const MENU_ITEM_KEY = `i18n:MAIN_MENU.package.title/i18n:${PACKAGE_NAME}.name/i18n:${PACKAGE_NAME}.${ACTION_NAME}`;

/** 配置文件路径 */
const CONFIG_PATH = Path.join(__dirname, '../../config.json');

/**
 * 配置管理器
 */
const ConfigManager = {

    /**
     * 默认配置
     */
    get defaultConfig() {
        return {
            version: '1.0',
            autoCheckUpdate: true,
        };
    },

    /**
     * 读取配置
     * @returns {{ autoCheckUpdate: boolean }}
     */
    get() {
        const configData = ConfigManager.defaultConfig;
        // 配置
        if (Fs.existsSync(CONFIG_PATH)) {
            const localConfig = JSON.parse(Fs.readFileSync(CONFIG_PATH));
            configData.autoCheckUpdate = localConfig.autoCheckUpdate;
        }
        // 快捷键
        const packageData = JSON.parse(Fs.readFileSync(PACKAGE_PATH)),
            menuItem = packageData['main-menu'][MENU_ITEM_KEY];
        configData.hotkey = menuItem['accelerator'] || '';
        // Done
        return configData;
    },

    /**
     * 保存配置
     * @param {{ autoCheckUpdate: boolean }} config 配置
     */
    set(config) {
        const configData = ConfigManager.defaultConfig;
        // 配置
        configData.autoCheckUpdate = config.autoCheckUpdate;
        Fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2));
        // 快捷键
        const packageData = JSON.parse(Fs.readFileSync(PACKAGE_PATH)),
            menuItem = packageData['main-menu'][MENU_ITEM_KEY];
        if (config.hotkey && config.hotkey !== '') {
            menuItem['accelerator'] = config.hotkey;
        } else {
            delete menuItem['accelerator'];
        }
        Fs.writeFileSync(PACKAGE_PATH, JSON.stringify(packageData, null, 2));
    },

};

module.exports = ConfigManager;
