const { shell } = require('electron');
const { getUrlParam } = require('../../eazax/browser-util');
const I18n = require('../../eazax/i18n');
const RendererUtil = require('../../eazax/renderer-util');
const ConfigManager = require('../../common/config-manager');
const PackageUtil = require('../../eazax/package-util');

/** 语言 */
const LANG = getUrlParam('lang');

/**
 * i18n
 * @param {string} key
 * @returns {string}
 */
const translate = (key) => I18n.translate(LANG, key);

// 应用
const App = {

  /**
   * 数据
   */
  data() {
    return {
      // 预设快捷键
      presets: [
        { key: '', name: translate('none') },
        { key: 'custom', name: translate('customKey') },
        { key: 'F1', name: 'F1' },
        { key: 'F3', name: 'F3' },
        { key: 'F4', name: 'F4' },
        { key: 'F5', name: 'F5' },
        { key: 'F6', name: 'F6' },
        { key: 'CmdOrCtrl+F', name: 'Cmd/Ctrl + F' },
        { key: 'CmdOrCtrl+B', name: 'Cmd/Ctrl + B' },
        { key: 'CmdOrCtrl+Shift+F', name: 'Cmd/Ctrl + Shift + F' },
      ],
      // 选择
      selectKey: '',
      // 自定义
      customKey: '',
      // 自动检查更新
      autoCheckUpdate: false,
      // 仓库地址
      repositoryUrl: PackageUtil.repositoryUrl,
      // 包名
      packageName: PackageUtil.name,
    };
  },

  /**
   * 监听器
   */
  watch: {

    /**
     * 选择快捷键
     */
    selectKey(value) {
      if (value !== 'custom') {
        this.customKey = '';
      }
    },

    /**
     * 自定义
     */
    customKey(value) {
      if (value !== '' && this.selectKey !== 'custom') {
        this.selectKey = 'custom';
      }
    },

  },

  /**
   * 实例函数
   */
  methods: {

    /**
     * 翻译
     * @param {string} key 
     */
    t(key) {
      return translate(key);
    },

    /**
     * 应用按钮点击回调
     * @param {*} event 
     */
    onApplyBtnClick(event) {
      // 保存配置
      this.setConfig();
    },

    /**
     * 获取配置
     */
    getConfig() {
      const config = ConfigManager.get();
      if (!config) return;
      // 自动检查更新
      this.autoCheckUpdate = config.autoCheckUpdate;
      // 快捷键
      const hotkey = config.hotkey;
      if (!hotkey || hotkey === '') {
        this.selectKey = '';
        this.customKey = '';
        return;
      }
      // 预设快捷键
      const presets = this.presets;
      for (let i = 0, l = presets.length; i < l; i++) {
        if (presets[i].key === hotkey) {
          this.selectKey = hotkey;
          this.customKey = '';
          return;
        }
      }
      // 自定义快捷键
      this.selectKey = 'custom';
      this.customKey = hotkey;
    },

    /**
     * 保存配置
     */
    setConfig() {
      const config = {
        autoCheckUpdate: this.autoCheckUpdate,
        hotkey: null,
      };
      if (this.selectKey === 'custom') {
        const customKey = this.customKey;
        // 自定义输入是否有效
        if (customKey === '') {
          RendererUtil.print('warn', translate('customKeyError'));
          return;
        }
        // 不可以使用双引号（避免 json 值中出现双引号而解析错误，导致插件加载失败）
        if (customKey.includes('"')) {
          this.customKey = this.customKey.replace(/\"/g, '');
          RendererUtil.print('warn', translate('quoteError'));
          return;
        }
        config.hotkey = customKey;
      } else {
        config.hotkey = this.selectKey;
      }
      // 保存到本地
      ConfigManager.set(config);
    },

  },

  /**
   * 生命周期：实例被挂载
   */
  mounted() {
    // 获取配置
    this.getConfig();
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
    RendererUtil.send('check-update', false);
  },

  /**
   * 生命周期：实例销毁前
   */
  beforeDestroy() {

  },

};

// 创建实例
const app = Vue.createApp(App);
// 挂载
app.mount('#app');
