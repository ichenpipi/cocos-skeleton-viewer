'use strict';

const { readFileSync } = require('fs');
const { join } = require('path');

// 插件内置的 Vue
const Vue = require('../../../lib/vue.global.prod');
// 面板代码
const App = require('./index');

// 面板 Vue 实例
let app = null;

// html 文本
exports.template = readFileSync(join(__dirname, 'index.html'), 'utf8');

// 样式文本
exports.style = '';

// 渲染后 html 选择器
exports.$ = {
    app: '#app',
};

// 面板上的方法
exports.methods = {};

// 面板上触发的事件
exports.listeners = {};

// 当面板渲染成功后触发
exports.ready = async function () {
    const root = this.$.app.parentNode;

    // 加载样式表
    loadCss(root, join(__dirname, '../../eazax/css/cocos-tag.css'));
    loadCss(root, join(__dirname, '../../eazax/css/cocos-class.css'));
    loadCss(root, join(__dirname, 'index.css'));

    // 先替换掉编辑器内置的 Vue（理论上 3.x 编辑器不内置 Vue）
    const builtinVue = window.Vue;
    window.Vue = Vue;

    // 创建 Vue 实例
    app = Vue.createApp(App);
    // 挂载 Vue 实例
    app.mount(root);

    // 把编辑器的 Vue 换回去
    window.Vue = builtinVue;
};

// 尝试关闭面板的时候触发
exports.beforeClose = async function () {
    // 卸载 Vue 实例
    app.unmount();
};

// 当面板实际关闭后触发
exports.close = async function () { };

/**
 * 加载样式表
 * @param {HTMLElement} root 根元素
 * @param {string} path CSS 文件路径
 */
function loadCss(root, path) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = path;
    const el = root.querySelector('#app');
    root.insertBefore(link, el);
}
