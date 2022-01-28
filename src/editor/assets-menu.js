const RendererEvent = require("../eazax/renderer-event");

// 资源管理器菜单
exports.onAssetMenu = function (assetInfo) {
    if (test(assetInfo.file)) {
        return [
            // 骨骼查看器 -> 预览
            {
                label: 'i18n:ccc-skeleton-viewer.name',
                submenu: [
                    {
                        label: 'i18n:ccc-skeleton-viewer.view',
                        enabled: true,
                        click() {
                            // （主进程）预览
                            RendererEvent.send('view', assetInfo.uuid);
                        },
                    },
                ],
            },
        ];
    }
    return [];
};

/**
 * 测试
 * @param {string} name 
 */
function test(name) {
    return (
        name.endsWith('json') || name.endsWith('skel') ||
        name.endsWith('png') ||
        name.endsWith('atlas') || name.endsWith('txt')
    );
}
