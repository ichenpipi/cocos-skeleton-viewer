module.exports = {

    /**
     * 查询节点上的骨骼资源
     * @param {*} event 
     * @param {string} uuid 
     * @returns 
     */
    'query-skeleton'(event, uuid) {
        // 获取节点
        const node = cc.engine.getInstanceById(uuid);
        if (!node) {
            event.reply(null, null);
            return;
        }
        // 获取节点上的骨骼组件
        const spine = node.getComponent('sp.Skeleton');
        if (!spine) {
            event.reply(null, null);
            return;
        }
        // 获取骨骼数据
        const skeletonData = spine.skeletonData;
        if (!skeletonData) {
            event.reply(null, null);
            return;
        }
        // 返回资源的 uuid
        event.reply(null, skeletonData._uuid);
    },

};
