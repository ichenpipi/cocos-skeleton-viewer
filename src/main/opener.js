const { dialog } = require('electron');
const Fs = require('fs');
const Path = require('path');
const EditorAdapter = require('../common/editor-adapter');
const { print, translate } = require('../eazax/editor-main-util');
const MainEvent = require('../eazax/main-event');
const PanelManager = require('./panel-manager');

/**
 * 资源检索器
 */
const Opener = {

    /**
     * 编辑器选择
     * @param {'asset' | 'node'} type 
     * @param {string[]} uuids 
     */
    async identifySelection(type, uuids) {
        if (type === 'asset') {         // 选中资源
            Opener.identifyByUuids(uuids);
        } else if (type === 'node') {   // 选中节点
            const skeletonUuid = await Opener.querySkeletonOnNode(uuids[0]);
            if (skeletonUuid) {
                Opener.identifyByUuids([skeletonUuid]);
            } else {
                Opener.updateView(null);
            }
        } else {
            Opener.updateView(null);
        }
    },

    /**
     * 检查编辑器当前选中
     */
    checkEditorCurSelection() {
        const type = EditorAdapter.Selection.getSelectedType(),
            uuids = EditorAdapter.Selection.getSelected(type);
        if (type && uuids && uuids.length > 0) {
            Opener.identifySelection(type, uuids);
        } else {
            Opener.updateView(null);
        }
    },

    /**
     * 查找节点上引用的骨骼资源
     * @param {string} nodeUuid 
     * @returns {Promise<string>} 
     */
    async querySkeletonOnNode(nodeUuid) {
        const node = await Editor.Message.request('scene', 'query-node', nodeUuid);
        if (node && node['__comps__']) {
            const components = node['__comps__'];
            for (let i = 0; i < components.length; i++) {
                if (components[i].type === 'sp.Skeleton') {
                    const uuid = components[i].value.skeletonData.value.uuid;
                    return (uuid !== '' ? uuid : null);
                }
            }
        }
        return null;
    },

    /**
     * 选择本地文件
     */
    async selectLocalFiles() {
        // 弹窗选择文件
        const result = await dialog.showOpenDialog({
            filters: [{
                name: translate('skeletonAssets'),
                extensions: ['json', 'skel', 'png', 'atlas'],
            }],
            properties: ['openFile', 'multiSelections'],
            message: translate('selectAssets'),
        });
        // 取消
        if (!result || result.canceled) {
            return;
        }
        // 识别选择的文件路径（兼容不同版本的 Electron）
        const paths = result.filePaths || result;
        Opener.identifyByPaths(paths);
    },

    /**
     * 通过 uuid 识别资源
     * @param {string[]} uuids 
     */
    async identifyByUuids(uuids) {
        // 资源路径
        let skeletonPath, texturePath, atlasPath;
        // 遍历选中的资源 uuid
        for (let i = 0; i < uuids.length; i++) {
            const assetInfo = await EditorAdapter.getAssetInfoByUuid(uuids[0]),
                { type, file } = assetInfo;
            if (type === 'sp.SkeletonData') {
                skeletonPath = file;   // 骨骼资源
            } else if (type === 'cc.ImageAsset') {
                texturePath = file; // 纹理资源
            } else if (file.endsWith('.atlas') || file.endsWith('.txt')) {
                atlasPath = file;   // 图集资源
            }
            // 只识别一套资源
            if (skeletonPath && texturePath && atlasPath) {
                break;
            }
        }
        // 未选中骨骼资源
        // if (!skeletonPath) {
        //     return;
        // }
        // 无效
        if (!skeletonPath && !texturePath && !atlasPath) {
            Opener.updateView(null);
            return;
        }
        // 处理路径
        const paths = { skeletonPath, texturePath, atlasPath };
        const assets = Opener.collectAssets(paths);
        Opener.updateView(assets);
    },

    /**
     * 通过路径识别资源
     * @param {string[]} paths 
     */
    identifyByPaths(paths) {
        // 资源路径
        let skeletonPath, texturePath, atlasPath;
        // 遍历选中的文件路径
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i],
                extname = Path.extname(path);
            switch (extname) {
                case '.json':
                case '.skel': {
                    skeletonPath = path;
                    break;
                }
                case '.png': {
                    texturePath = path;
                    break;
                }
                case '.atlas':
                case '.txt': {
                    atlasPath = path;
                    break;
                }
            }
            // 只识别一套资源
            if (skeletonPath && texturePath && atlasPath) {
                break;
            }
        }
        // 未选中骨骼资源
        // if (!skeletonPath) {
        //     print('warn', translate('noSkeleton'));
        //     return;
        // }
        // 无效
        if (!skeletonPath && !texturePath && !atlasPath) {
            // print('warn', translate('noSkeleton'));
            return;
        }
        // 处理路径
        paths = { skeletonPath, texturePath, atlasPath };
        const assets = Opener.collectAssets(paths);
        Opener.updateView(assets);
    },

    /**
     * 收集资源
     * @param {{ skeletonPath: string, texturePath: string, atlasPath: string }} paths 资源路径
     */
    collectAssets(paths) {
        let { skeletonPath, texturePath, atlasPath } = paths;
        const testPath = skeletonPath || texturePath || atlasPath;
        // 骨骼资源
        if (!skeletonPath) {
            // 暴力查找
            skeletonPath = Opener.getRelatedFile(testPath, 'json');
            // 还没有的话再试试 skel 格式
            if (!skeletonPath) {
                skeletonPath = Opener.getRelatedFile(testPath, 'skel');
            }
            // 找不到骨骼啊
            if (!skeletonPath) {
                // print('warn', translate('noSkeleton'));
                return null;
            }
        }
        // 纹理资源
        if (!texturePath) {
            // 暴力查找
            texturePath = Opener.getRelatedFile(testPath, 'png');
            // 找不到纹理啊
            if (!texturePath) {
                print('warn', translate('noTexture'));
                return null;
            }
        }
        // 图集资源
        if (!atlasPath) {
            // 暴力查找
            atlasPath = Opener.getRelatedFile(testPath, 'atlas');
            // 还没有的话再试试 txt 格式
            if (!atlasPath) {
                atlasPath = Opener.getRelatedFile(testPath, 'txt');
            }
            // 还没有的话再试试 atlas.txt 格式
            if (!atlasPath) {
                atlasPath = Opener.getRelatedFile(testPath, 'atlas.txt');
            }
            // 找不到图集啊
            if (!atlasPath) {
                print('warn', translate('noAtlas'));
                return null;
            }
        }
        // 文件类型（json 或 skel）
        const skeletonType = Path.extname(skeletonPath);
        // 打包资源信息
        const assets = {
            // 目录路径
            dir: undefined,
            // 骨骼数据（JSON）
            json: (skeletonType === '.json') ? skeletonPath : undefined,
            // 骨骼数据（二进制）
            skel: (skeletonType === '.skel') ? skeletonPath : undefined,
            // 纹理
            png: texturePath,
            // 图集
            atlas: atlasPath,
        };
        return assets;
    },

    /**
     * 查找相关联的文件路径
     * @param {string} filePath 文件路径
     * @param {string} relatedExt 关联文件的扩展名
     * @returns {string}
     */
    getRelatedFile(filePath, relatedExt) {
        const dirPath = Path.join(Path.dirname(filePath), Path.sep),
            basename = Path.basename(filePath, Path.extname(filePath)).replace(/(-pro|-ess|-pma)/, ''),
            basePath = Path.join(dirPath, basename),
            testList = [
                `${basePath}.${relatedExt}`,
                `${basePath}-pma.${relatedExt}`,
                `${basePath}-pro.${relatedExt}`,
                `${basePath}-ess.${relatedExt}`
            ];
        for (let i = 0; i < testList.length; i++) {
            if (Fs.existsSync(testList[i])) {
                return testList[i];
            }
        }
        return null;
    },

    /**
     * 更新视图
     * @param {{ dir: string, json: string, atlas: string, png: string } | null} assets 
     */
    updateView(assets) {
        const webContents = PanelManager.getViewPanelWebContents();
        if (webContents) {
            MainEvent.send(webContents, 'assets-selected', assets);
        }
    },

};

module.exports = Opener;
