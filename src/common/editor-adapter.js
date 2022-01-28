/**
 * 编辑器适配器
 */
const EditorAdapter = {

    /**
     * 获取编辑器语言
     * @returns {string} 
     */
    getLanguage() {
        return Editor.I18n.getLanguage();
    },

    /**
     * 获取资源信息
     * @param {string} uuid 
     * @returns {Promise<any>} 
     */
    getAssetInfoByUuid(uuid) {
        return Editor.Message.request('asset-db', 'query-asset-info', uuid);
    },

    /**
     * 获取资源 META
     * @param {string} uuid 
     * @returns {Promise<any>} 
     */
    getAssetMetaByUuid(uuid) {
        return Editor.Message.request('asset-db', 'query-asset-meta', uuid);
    },

    /**
     * 获取资源绝对路径
     * @param {string} uuid 
     * @returns {Promise<string>} 
     */
    getPathByUuid(uuid) {
        return Editor.Message.request('asset-db', 'query-path', uuid);
    },

    /**
     * 获取资源绝对路径
     * @param {string} url 
     * @returns {Promise<string>} 
     */
    getPathByUrl(url) {
        return Editor.Message.request('asset-db', 'query-path', url);
    },

    /**
     * 获取资源 uuid
     * @param {string} path 
     * @returns {Promise<string>} 
     */
    getUuidByPath(path) {
        return Editor.Message.request('asset-db', 'query-uuid', path);
    },

    /**
     * 面板
     */
    Panel: {

        /**
         * 打开面板
         * @param {string} panel 
         */
        open(panel) {
            Editor.Panel.open(panel);
        },

        /**
         * 关闭面板
         * @param {string} panel 
         */
        close(panel) {
            Editor.Panel.close(panel);
        },

    },

    /**
     * 选择
     */
    Selection: {

        /**
         * 清除编辑器选中
         * @param {'asset' | 'node'} type 
         */
        clear(type) {
            Editor.Selection.clear(type);
        },

        /**
         * 清除编辑器选中
         * @param {'asset' | 'node'} type 
         * @param {string} uuid 
         */
        select(type, uuid) {
            Editor.Selection.select(type, uuid);
        },

        /**
         * 获取编辑器选中的类型
         * @returns {'asset' | 'node'} 
         */
        getSelectedType() {
            return Editor.Selection.getLastSelectedType();
        },

        /**
         * 获取编辑器选中
         * @param {'asset' | 'node'} type 
         * @returns {string} 
         */
        getSelected(type) {
            return Editor.Selection.getSelected(type);
        },

    },

};

module.exports = EditorAdapter;
