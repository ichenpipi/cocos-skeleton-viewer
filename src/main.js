const { dialog } = require('electron');
const Fs = require('fs');
const Path = require('path');
const PanelManager = require('./panel-manager');
const MainUtil = require('./main-util');
const { print, translate, checkUpdate } = require('./editor-util');
const ConfigManager = require('./config-manager');

/**
 * （渲染进程）检查更新回调
 * @param {Electron.IpcMainEvent} event 
 * @param {boolean} logWhatever 无论有无更新都打印提示
 */
function onCheckUpdateEvent(event, logWhatever) {
  checkUpdate(logWhatever);
}

/**
 * （渲染进程）打印事件回调
 * @param {Electron.IpcMainEvent} event 
 * @param {{ type: string, content: string }} options 选项
 */
function onPrintEvent(event, options) {
  const { type, content } = options;
  print(type, content);
}

/**
 * （渲染进程）就绪事件回调
 * @param {Electron.IpcMainEvent} event 
 */
function onReadyEvent(event) {
  // 保存实例
  renderer = event.sender;
  // 检查
  checkCurrentSelection();
}

/**
 * （渲染进程）选择文件事件回调
 * @param {Electron.IpcMainEvent} event 
 */
async function onSelectEvent(event) {
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
  identifyDialogSelection(paths);
}

/**
 * 渲染进程的 EventEmitter
 * @type {EventEmitter}
 */
let renderer = null;

/**
 * 检查编辑器当前选中的资源
 */
function checkCurrentSelection() {
  // 编辑器当前选中资源 uuid
  const uuids = Editor.Selection.curSelection('asset');
  if (uuids.length > 0) {
    // 识别选择的文件 uuid
    identifyEditorSelection(uuids);
  }
}

/**
 * 识别编辑器选中的文件路径
 * @param {string[]} uuids 
 */
function identifyEditorSelection(uuids) {
  // 资源路径
  let spinePath, texturePath, atlasPath;
  // 遍历选中的资源 uuid
  for (let i = 0; i < uuids.length; i++) {
    const assetInfo = Editor.assetdb.assetInfoByUuid(uuids[i]),
      { type, path } = assetInfo;
    if (type === 'spine') {
      // spine 资源
      spinePath = path;
    } else if (type === 'texture') {
      // 纹理资源
      texturePath = path;
    } else if (path.endsWith('.atlas') || path.endsWith('.txt')) {
      // 图集资源
      atlasPath = path;
    }
    // 只识别一套资源
    if (spinePath && texturePath && atlasPath) {
      break;
    }
  }
  // 是否有选中 spine 资源
  if (!spinePath) {
    updateRenderer(null);
    return;
  }
  // 是否有选中图集资源
  if (!texturePath) {
    // 读取 spine 资源的 meta 信息中获取关联的纹理资源
    const spineMeta = Editor.assetdb.loadMetaByPath(spinePath);
    if (spineMeta.textures[0]) {
      texturePath = Editor.assetdb.uuidToFspath(spineMeta.textures[0]);
    }
  }
  // 处理路径
  const paths = { spinePath, texturePath, atlasPath };
  processPaths(paths);
}

/**
 * 识别选择的文件路径
 * @param {string[]} selection 
 * @returns 
 */
function identifyDialogSelection(selection) {
  // 资源路径
  let spinePath, texturePath, atlasPath;
  // 遍历选中的文件路径
  for (let i = 0; i < selection.length; i++) {
    const path = selection[i],
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
  const paths = { spinePath, texturePath, atlasPath };
  processPaths(paths);
}

/**
 * 收集资源
 * @param {{ spinePath: string, texturePath: string, atlasPath: string }} paths 资源路径
 */
function processPaths(paths) {
  let { spinePath, texturePath, atlasPath } = paths;
  // 纹理资源
  if (!texturePath) {
    // 暴力查找
    texturePath = getRelatedFile(spinePath, 'png');
  }
  // 找不到纹理啊
  if (!texturePath) {
    print('warn', translate('noTexture'));
    updateRenderer(null);
    return;
  }
  // 图集资源
  if (!atlasPath) {
    // 暴力查找
    atlasPath = getRelatedFile(spinePath, 'atlas');
    // 还没有的话再试试 txt 格式
    if (!atlasPath) {
      atlasPath = getRelatedFile(spinePath, 'txt');
    }
  }
  // 找不到图集啊
  if (!atlasPath) {
    print('warn', translate('noAtlas'));
    updateRenderer(null);
    return;
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
  // Done
  updateRenderer(assets);
}

/**
 * 查找相关联的文件路径
 * @param {string} filePath 文件路径
 * @param {string} relatedExt 关联文件的扩展名
 * @returns {string}
 */
function getRelatedFile(filePath, relatedExt) {
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
}

/**
 * 更新渲染进程
 * @param {{ dir: string, json: string, atlas: string, png: string }} assets 
 */
function updateRenderer(assets) {
  if (!renderer || renderer.isDestroyed()) {
    renderer = null;
    return;
  }
  MainUtil.send(renderer, 'assets-selected', assets);
}

module.exports = {

  /**
   * 扩展消息
   * @type {{ [key: string]: Function }}
   */
  messages: {

    /**
     * 编辑器选中事件回调
     * @param {Electron.IpcMainEvent} event 
     * @param {string} type 类型
     * @param {string[]} uuids uuids
     */
    'selection:selected'(event, type, uuids) {
      if (!renderer || renderer.isDestroyed()) {
        renderer = null;
        return;
      }
      if (type !== 'asset') {
        return;
      }
      // 检查
      checkCurrentSelection();
    },

    /**
     * 打开预览面板
     */
    'open-view-panel'() {
      PanelManager.openViewPanel();
    },

    /**
     * 打开设置面板
     */
    'open-setting-panel'() {
      PanelManager.openSettingPanel();
    },

    /**
     * 检查更新
     */
    'force-check-update'() {
      checkUpdate(true);
    },

  },

  /**
   * 生命周期：加载
   */
  load() {
    MainUtil.on('check-update', onCheckUpdateEvent);
    MainUtil.on('print', onPrintEvent);
    MainUtil.on('ready', onReadyEvent);
    MainUtil.on('select', onSelectEvent);
    // 自动检查更新
    const config = ConfigManager.get();
    if (config.autoCheckUpdate) {
      // 延迟一段时间
      const delay = 6 * 60 * 1000;
      setTimeout(() => checkUpdate(false), delay);
    }
  },

  /**
   * 生命周期：卸载
   */
  unload() {
    MainUtil.removeAllListeners('check-update');
    MainUtil.removeAllListeners('print');
    MainUtil.removeAllListeners('ready');
    MainUtil.removeAllListeners('select');
  },

};
