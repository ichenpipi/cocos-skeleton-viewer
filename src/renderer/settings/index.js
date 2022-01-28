const { shell } = require('electron');
const { getUrlParam } = require('../../eazax/browser-util');
const { translate } = require('../../eazax/i18n');
const RendererEvent = require('../../eazax/renderer-event');
const PackageUtil = require('../../eazax/package-util');
const EditorRendererKit = require('../../eazax/editor-renderer-kit');
const ConfigManager = require('../../common/config-manager');

// 导入 Vue 工具函数
const { ref, watch, onMounted, onBeforeUnmount, createApp } = Vue;

/** 当前语言 */
const LANG = getUrlParam('lang');

// 构建 Vue 应用
const App = {

    /**
     * 设置
     * @param {*} props 
     * @param {*} context 
     */
    setup(props, context) {

        // 预设快捷键
        const presets = ref([
            { key: '', name: t('none') },
            { key: 'custom', name: t('customKey') },
            { key: 'F1', name: 'F1' },
            { key: 'F3', name: 'F3' },
            { key: 'F4', name: 'F4' },
            { key: 'F5', name: 'F5' },
            { key: 'F6', name: 'F6' },
            { key: 'CmdOrCtrl+F', name: 'Cmd/Ctrl + F' },
            { key: 'CmdOrCtrl+B', name: 'Cmd/Ctrl + B' },
            { key: 'CmdOrCtrl+Shift+F', name: 'Cmd/Ctrl + Shift + F' },
        ]);
        // 选择
        const selectKey = ref('');
        // 自定义
        const customKey = ref('');
        // 窗口置顶
        const alwaysOnTop = ref(true);
        // 自动检查更新
        const autoCheckUpdate = ref(false);

        // 仓库地址
        const repositoryUrl = PackageUtil.repository;
        // 包名
        const packageName = PackageUtil.name;

        // 监听选择快捷键
        watch(selectKey, (value) => {
            if (value !== 'custom') {
                customKey.value = '';
            }
        });

        // 监听自定义
        watch(customKey, (value) => {
            if (value !== '' && selectKey.value !== 'custom') {
                selectKey.value = 'custom';
            }
        });

        /**
         * 获取配置
         */
        function getConfig() {
            const config = ConfigManager.get();
            if (!config) {
                return;
            }
            // 窗口置顶
            alwaysOnTop.value = config.alwaysOnTop;
            // 自动检查更新
            autoCheckUpdate.value = config.autoCheckUpdate;
            // 快捷键
            const shortcutKey = config.shortcutKey;
            if (!shortcutKey || shortcutKey === '') {
                selectKey.value = '';
                customKey.value = '';
                return;
            }
            // 预设快捷键
            for (let i = 0, l = presets.value.length; i < l; i++) {
                if (presets.value[i].key === shortcutKey) {
                    selectKey.value = shortcutKey;
                    customKey.value = '';
                    return;
                }
            }
            // 自定义快捷键
            selectKey.value = 'custom';
            customKey.value = shortcutKey;
        }

        /**
         * 保存配置
         */
        function setConfig() {
            const config = {
                alwaysOnTop: alwaysOnTop.value,
                autoCheckUpdate: autoCheckUpdate.value,
                shortcutKey: null,
            };
            if (selectKey.value === 'custom') {
                // 自定义输入是否有效
                if (customKey.value === '') {
                    EditorRendererKit.print('warn', translate('customKeyError'));
                    return;
                }
                // 不可以使用双引号（避免 json 值中出现双引号而解析错误，导致插件加载失败）
                if (customKey.value.includes('"')) {
                    customKey.value = customKey.value.replace(/\"/g, '');
                    EditorRendererKit.print('warn', translate('quoteError'));
                    return;
                }
                config.shortcutKey = customKey.value;
            } else {
                config.shortcutKey = selectKey.value;
            }
            // 保存到本地
            ConfigManager.set(config);
            // 重新加载扩展
            RendererEvent.send('reload');
        }

        /**
         * 应用按钮点击回调
         * @param {*} event 
         */
        function onApplyBtnClick(event) {
            // 保存配置
            setConfig();
        }

        /**
         * 翻译
         * @param {string} key 
         */
        function t(key) {
            return translate(LANG, key);
        }

        /**
         * 生命周期：挂载后
         */
        onMounted(() => {
            // 获取配置
            getConfig();
            // 覆盖 a 标签点击回调（使用默认浏览器打开网页）
            const links = document.querySelectorAll('a[href]');
            links.forEach((link) => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const url = link.getAttribute('href');
                    shell.openExternal(url);
                });
            });
            // （主进程）检查更新
            RendererEvent.send('check-update', false);
        });

        /**
         * 生命周期：卸载前
         */
        onBeforeUnmount(() => {

        });

        return {
            presets,
            selectKey,
            customKey,
            alwaysOnTop,
            autoCheckUpdate,
            repositoryUrl,
            packageName,
            onApplyBtnClick,
            t,
        };

    },

};

// 创建实例
const app = createApp(App);
// 挂载
app.mount('#app');
