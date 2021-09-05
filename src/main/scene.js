module.exports = {

    'query-skeleton'(event, uuid) {
        // 获取场景节点
        const root = cc.find('Canvas');
        if (!root) {
            return event.reply(null, null);
        }
        // 获取选中的节点
        const node = root.getChildByUuid(uuid);
        if (!node) {
            return event.reply(null, null);
        }
        // 获取节点上的骨骼组件
        const spine = node.getComponent('sp.Skeleton');
        if (!spine) {
            return event.reply(null, null);
        }
        // 获取骨骼数据
        const skeletonData = spine.skeletonData;
        if (!skeletonData) {
            return event.reply(null, null);
        }
        // 返回资源的 uuid
        event.reply(null, skeletonData._uuid);
    },

};
