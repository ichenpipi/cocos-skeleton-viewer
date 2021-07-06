const { readFileSync } = require('fs');
const { join } = require('path');

// ⚠️ 2.4.5 以上版本可以直接导入
// 但是 2.4.5 以下版本无法正常访问 __dirname
// const Vue = require('../../../lib/vue.global.prod');
// const App = require('./index');

// ⚠️ 2.4.5 以下版本只能通过 Editor.url 来获取插件路径
const PACKAGE_NAME = 'ccc-skeleton-viewer';
const PACKAGE_PATH = Editor.url(`packages://${PACKAGE_NAME}/`);
const DIR_PATH = join(PACKAGE_PATH, 'src/renderer/view/');

const Vue = require(join(PACKAGE_PATH, 'lib/vue.global.prod'));
const App = require(join(DIR_PATH, 'index'));

// 创建面板
Editor.Panel.extend({

    /** HTML */
    // template: readFileSync(join(__dirname, 'index.html'), 'utf8'),
    template: readFileSync(join(DIR_PATH, 'index.html'), 'utf8'),

    /**
     * 面板渲染成功
     */
    ready() {
        const root = this.shadowRoot;
        // 加载样式表
        // loadCss(root, join(__dirname, '../../css/cocos-tag.css'));
        // loadCss(root, join(__dirname, '../../css/cocos-class.css'));
        // loadCss(root, join(__dirname, 'index.css'));
        loadCSS(root, join(PACKAGE_PATH, 'src/css/cocos-tag.css'));
        loadCSS(root, join(PACKAGE_PATH, 'src/css/cocos-class.css'));
        loadCSS(root, join(DIR_PATH, 'index.css'));
        // 先替换掉编辑器内置的 Vue
        const oldVue = window.Vue;
        window.Vue = Vue;
        // 创建实例
        const app = Vue.createApp(App);
        // 挂载
        app.mount(root);
        // 把编辑器的 Vue 换回去
        window.Vue = oldVue;
    },

});

/**
 * 加载样式表
 * @param {HTMLElement} root 根元素
 * @param {string} path CSS 文件路径
 */
function loadCSS(root, path) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = path;
    const el = root.querySelector('#app');
    root.insertBefore(link, el);
}
