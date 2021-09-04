const { dialog } = require('electron');
const Fs = require('fs');
const Path = require('path');
const { print, translate } = require('../eazax/editor-main-util');

const Opener = {

    /**
     * 渲染进程的 EventEmitter
     * @type {EventEmitter}
     */
    renderer: null,

    selectedInEditor(type, uuids) {
        if (type === 'asset') {
            Opener.checkCurrentSelection();
        } else if (type === 'node') {

        }
    },

    /**
     * 检查编辑器当前选中的资源
     */
    checkEditorSelection() {
        // 编辑器当前选中资源 uuid
        const uuids = Editor.Selection.curSelection('asset');
        if (uuids.length > 0) {
            // 识别选择的文件 uuid
            Opener.identifyByUuids(uuids);
        }
    },

    /**
     * 选择本地文件
     */
    async openLocal() {
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
    identifyByUuids(uuids) {
        // 资源路径
        let spinePath, texturePath, atlasPath;
        // 遍历选中的资源 uuid
        for (let i = 0; i < uuids.length; i++) {
            const assetInfo = Editor.assetdb.assetInfoByUuid(uuids[i]),
                { type, path } = assetInfo;
            if (type === 'spine') {
                spinePath = path;   // Spine 资源
            } else if (type === 'texture') {
                texturePath = path; // 纹理资源
            } else if (path.endsWith('.atlas') || path.endsWith('.txt')) {
                atlasPath = path;   // 图集资源
            }
            // 只识别一套资源
            if (spinePath && texturePath && atlasPath) {
                break;
            }
        }
        // 是否有选中 Spine 资源
        if (!spinePath) {
            Opener.updateRenderer(null);
            return;
        }
        // 是否有选中图集资源
        if (!texturePath) {
            // 读取 Spine 资源的 meta 信息中获取关联的纹理资源
            const spineMeta = Editor.assetdb.loadMetaByPath(spinePath);
            if (spineMeta.textures[0]) {
                texturePath = Editor.assetdb.uuidToFspath(spineMeta.textures[0]);
            }
        }
        // 处理路径
        let paths = { spinePath, texturePath, atlasPath };
        paths = Opener.processPaths(paths);
        Opener.updateRenderer(paths);
    },

    /**
     * 通过路径识别资源
     * @param {string[]} files 
     */
    identifyByPaths(files) {
        // 资源路径
        let spinePath, texturePath, atlasPath;
        // 遍历选中的文件路径
        for (let i = 0; i < files.length; i++) {
            const path = files[i],
                extname = Path.extname(path);
            switch (extname) {
                case '.json':
                case '.skel': {
                    spinePath = path;
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
            if (spinePath && texturePath && atlasPath) {
                break;
            }
        }
        // 是否有选中 spine 资源
        if (!spinePath) {
            print('warn', translate('noSkeleton'));
            return;
        }
        // 处理路径
        let paths = { spinePath, texturePath, atlasPath };
        paths = Opener.processPaths(paths);
        Opener.updateRenderer(paths);
    },

    /**
     * 收集资源
     * @param {{ spinePath: string, texturePath: string, atlasPath: string }} paths 资源路径
     */
    processPaths(paths) {
        let { spinePath, texturePath, atlasPath } = paths;
        // 纹理资源
        if (!texturePath) {
            // 暴力查找
            texturePath = Opener.getRelatedFile(spinePath, 'png');
        }
        // 找不到纹理啊
        if (!texturePath) {
            print('warn', translate('noTexture'));
            return null;
        }
        // 图集资源
        if (!atlasPath) {
            // 暴力查找
            atlasPath = Opener.getRelatedFile(spinePath, 'atlas');
            // 还没有的话再试试 txt 格式
            if (!atlasPath) {
                atlasPath = Opener.getRelatedFile(spinePath, 'txt');
            }
            // 还没有的话再试试 atlas.txt 格式
            if (!atlasPath) {
                atlasPath = Opener.getRelatedFile(spinePath, 'atlas.txt');
            }
        }
        // 找不到图集啊
        if (!atlasPath) {
            print('warn', translate('noAtlas'));
            return null;
        }
        // 文件类型（json 或 skel）
        const spineType = Path.extname(spinePath);
        // 打包资源信息
        const assets = {
            // 目录路径
            dir: undefined,
            // 骨骼数据（JSON）
            json: (spineType === '.json') ? spinePath : undefined,
            // 骨骼数据（二进制）
            skel: (spineType === '.skel') ? spinePath : undefined,
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
     * 更新渲染进程
     * @param {{ dir: string, json: string, atlas: string, png: string }} assets 
     */
    updateRenderer(assets) {
        if (!Opener.renderer || Opener.renderer.isDestroyed()) {
            Opener.renderer = null;
            return;
        }
        MainEvent.send(Opener.renderer, 'assets-selected', assets);
    },

};

module.exports = Opener;
