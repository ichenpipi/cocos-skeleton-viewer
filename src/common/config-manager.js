const Path = require('path');
const Fs = require('fs');

/** 配置文件路径 */
const CONFIG_PATH = Path.join(__dirname, '../../config.json');

/** package.json 的路径 */
const PACKAGE_PATH = Path.join(__dirname, '../../package.json');

/** 快捷键消息 */
const SHORTCUT_MESSAGE = 'open-view-panel';

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
     */
    get() {
        const config = ConfigManager.defaultConfig;
        // 配置
        if (Fs.existsSync(CONFIG_PATH)) {
            const localConfig = JSON.parse(Fs.readFileSync(CONFIG_PATH));
            for (const key in config) {
                if (localConfig[key] !== undefined) {
                    config[key] = localConfig[key];
                }
            }
        }
        // 快捷键和置顶
        const packageConfig = ConfigManager.getPackageConfig();
        config.shortcutKey = packageConfig.shortcutKey;
        config.alwaysOnTop = packageConfig.alwaysOnTop;
        // Done
        return config;
    },

    /**
     * 保存配置
     * @param {*} value 配置
     */
    set(value) {
        const config = ConfigManager.defaultConfig;
        // 配置
        for (const key in config) {
            if (value[key] !== undefined) {
                config[key] = value[key];
            }
        }
        Fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        // 快捷键
        ConfigManager.setPackageConfig({
            shortcutKey: value.shortcutKey,
            alwaysOnTop: value.alwaysOnTop,
        });
    },

    /**
     * 获取 package 配置
     * @returns {{ shortcutKey: string, alwaysOnTop: boolean }}
     */
    getPackageConfig() {
        const config = {
            shortcutKey: '',
            alwaysOnTop: false,
        };
        const package = JSON.parse(Fs.readFileSync(PACKAGE_PATH));
        // 快捷键
        const shortcuts = package['contributions']['shortcuts'];
        if (shortcuts && shortcuts.length > 0) {
            config.shortcutKey = shortcuts[0]['win'] || shortcuts[0]['mac'] || '';
        }
        // 置顶
        config.alwaysOnTop = package['panels']['view']['flags']['alwaysOnTop'];
        // Done
        return config;
    },

    /**
     * 设置 package 配置
     * @param {{ shortcutKey: string, alwaysOnTop: boolean }} config 
     */
    setPackageConfig(config) {
        const package = JSON.parse(Fs.readFileSync(PACKAGE_PATH));
        // 快捷键
        let shortcuts = package['contributions']['shortcuts'];
        if (!shortcuts) {
            shortcuts = package['contributions']['shortcuts'] = [];
        }
        let item = shortcuts[0];
        if (!item) {
            item = shortcuts[0] = {
                message: SHORTCUT_MESSAGE,
                mac: '',
                mac: '',
            };
        }
        if (config.shortcutKey != undefined) {
            item['win'] = item['mac'] = config.shortcutKey;
        } else {
            item['win'] = item['mac'] = '';
        }
        // 置顶
        package['panels']['view']['flags']['alwaysOnTop'] = config.alwaysOnTop;
        // 写入
        Fs.writeFileSync(PACKAGE_PATH, JSON.stringify(package, null, 2));
    },

};

module.exports = ConfigManager;
