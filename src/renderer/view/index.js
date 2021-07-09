const Path = require('path');
const Fs = require('fs');
const I18n = require('../../i18n');
const RendererUtil = require('../../renderer-util');
const SpineUtil = require('../../spine-util');

/** 语言 */
const LANG = Editor.lang;

/**
 * i18n
 * @param {string} key
 * @returns {string}
 */
const translate = (key) => I18n.translate(LANG, key);

/** Vue 应用 */
const App = {

  /**
   * 数据
   */
  data() {
    return {
      // 选项
      viewScale: 1.0,
      skin: '',
      animation: '',
      timeScale: 1,
      loop: true,
      premultipliedAlpha: false,
      drawBones: false,
      drawBoundingBoxes: false,
      drawMeshTriangles: false,
      drawPaths: false,
      // 当前运行时版本
      version: 'unknown',
      // 环境
      canvas: null,
      gl: null,
      shader: null,
      batcher: null,
      mvp: null,
      skeletonRenderer: null,
      assetManager: null,
      // 调试
      debugRenderer: null,
      debugShader: null,
      shapeRenderer: null,
      // 骨骼数据
      skeletonData: null,
      skeleton: null,
      bounds: null,
      animationState: null,
      // 上一帧时间
      lastFrameTime: null,
      // 资源信息
      assets: {
        dir: null,
        json: null,
        skel: null,
        atlas: null,
        png: null,
      },
    };
  },

  /**
   * 计算属性
   */
  computed: {

    /**
     * 皮肤列表
     */
    skins() {
      if (!this.skeletonData || !this.skeletonData.skins) {
        return [];
      }
      return this.skeletonData.skins.map(v => v.name);
    },

    /**
     * 动画列表
     */
    animations() {
      if (!this.skeletonData || !this.skeletonData.animations) {
        return [];
      }
      return this.skeletonData.animations.map(v => v.name);
    },

    /**
     * 调试
     */
    debug() {
      return (
        this.drawBones ||
        this.drawBoundingBoxes ||
        this.drawMeshTriangles ||
        this.drawPaths
      );
    },

    /**
     * 动画时长
     */
    duration() {
      if (!this.animationState) {
        return 0;
      }
      return this.animationState.getCurrent(0).animation.duration;
    },

    /**
     * 资源信息
     */
    assetsInfo() {
      if (!this.assetManager) {
        return `💡 ${translate('noAssets')}`;
      };
      let skeletonPath = '',
        texturePath = '',
        atlasPath = '';
      for (const path in this.assetManager.assets) {
        switch (Path.extname(path)) {
          case '.json':
          case '.skel': {
            skeletonPath = path;
            break;
          }
          case '.png': {
            texturePath = path;
            break;
          }
          case '.atlas': {
            atlasPath = path;
            break;
          }
        }
      }
      return `💀 [Skeleton]\n· ${skeletonPath}\n\n🖼 [Texture]\n· ${texturePath}\n\n🗺 [Atlas]\n· ${atlasPath}`;
    },

  },

  /**
   * 监听属性
   */
  watch: {

    /**
     * 当前皮肤
     * @param {string} value 
     */
    skin(value) {
      // 设置皮肤
      this.setSkin(value);
    },

    /**
     * 当前动画
     * @param {string} value 
     */
    animation(value) {
      // 播放动画
      this.playAnimation(value);
    },

    /**
     * 当前动画
     * @param {number} value 
     */
    timeScale(value) {
      this.setTimeScale(value);
    },

    /**
     * 循环
     * @param {boolean} value 
     */
    loop(value) {
      // 重新播放
      this.playAnimation(this.animation);
    },

  },

  /**
   * 实例函数
   */
  methods: {

    /**
     * i18n
     * @param {string} key 
     */
    i18n(key) {
      return translate(key);
    },

    /**
     * 选择资源按钮点击回调
     */
    onSelectBtnClick() {
      // （主进程）选择资源
      RendererUtil.send('select');
    },

    /**
     * 重置按钮点击回调
     */
    onResetBtnClick() {
      this.reset();
    },

    /**
     * 重置
     */
    reset() {
      // 选项
      this.viewScale = 1;
      this.skin = '';
      this.animation = '';
      this.timeScale = 1;
      this.loop = true;
      this.premultipliedAlpha = false;
      this.drawBones = false;
      this.drawBoundingBoxes = false;
      this.drawMeshTriangles = false;
      this.drawPaths = false;
      // 当前运行时版本
      this.version = 'unknown';
      // 骨骼数据
      this.skeletonData = null;
      this.skeleton = null;
      this.bounds = null;
      this.animationState = null;
      // 清空画布
      const gl = this.gl;
      if (gl) {
        gl.clearColor(0.3, 0.3, 0.3, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      // 环境
      // this.canvas = null;
      // this.gl = null;
      this.shader = null;
      this.batcher = null;
      this.mvp = null;
      this.skeletonRenderer = null;
      this.assetManager = null;
      // 调试
      this.debugRenderer = null;
      this.debugShader = null;
      this.shapeRenderer = null;
      // 上一帧时间
      this.lastFrameTime = null;
      // 资源信息
      this.assets = null;
    },

    /**
     * 获取 Spine 运行时
     */
    getRuntime() {
      console.log('[methods]', 'getRuntime');
      // 资源对应的 Spine 运行时版本
      let version = this.getAssetSpineVersion(this.assets.json || this.assets.skel);
      if (!version) {
        RendererUtil.print('warn', translate('noVersion'));
        return false;
      }
      console.log('Skeleton spine version', version);
      // 处理版本号（保留前两个分量）
      version = version.split('.').slice(0, 2).map(v => parseInt(v)).join('.');
      // 获取目标版本的 Spine 运行时对象
      const spine = SpineUtil.getSpine(version);
      if (!spine) {
        const content = `${translate('noSpineRuntime')} | ${translate('version')}: ${version}`;
        RendererUtil.print('warn', content);
        return false;
      }
      window.spine = spine;
      this.version = spine.version;
      console.log('Spine runtime version', spine.version);
      return true;
    },

    /**
     * 获取资源对应的 Spine 运行时版本
     * @param {string} path 文件路径
     * @returns {string}
     */
    getAssetSpineVersion(path) {
      const fullPath = Path.join((this.assets.dir || ''), path);
      if (!Fs.existsSync(fullPath)) {
        return null;
      }
      const extname = Path.extname(path);
      if (extname === '.json') {
        const data = JSON.parse(Fs.readFileSync(fullPath, 'utf-8'));
        if (data.skeleton) {
          return data.skeleton.spine;
        }
      } else if (extname === '.skel') {
        return '3.8';
      }
      return null;
    },

    /**
     * 初始化 Spine 运行时
     */
    initRuntime() {
      console.log('[methods]', 'initRuntime');
      // 获取画布
      let canvas = this.canvas;
      if (!canvas) {
        canvas = this.canvas = this.$refs.canvas;
      }
      // WebGL
      let gl = this.gl;
      if (!gl) {
        const config = { alpha: false };
        gl = this.gl = canvas.getContext("webgl", config);
        if (!gl) {
          RendererUtil.print('warn', translate('noWebGL'));
          return;
        }
      }

      // Shader
      this.shader = spine.webgl.Shader.newTwoColoredTextured(gl);
      // 处理器
      this.batcher = new spine.webgl.PolygonBatcher(gl);
      // MVP 变换矩阵
      this.mvp = new spine.webgl.Matrix4();
      this.mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
      // 骨骼渲染器
      this.skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);

      // 用于调试的 debugRenderer、debugShader 和 shapeRenderer
      this.debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
      this.debugShader = spine.webgl.Shader.newColored(gl);
      this.shapeRenderer = new spine.webgl.ShapeRenderer(gl);

      // 资源管理器
      this.assetManager = new spine.webgl.AssetManager(gl);
    },

    /**
     * 加载资源
     */
    loadAssets() {
      console.log('[methods]', 'loadAssets');
      if (!this.assetManager) {
        return;
      }
      const assets = this.assets,
        assetManager = this.assetManager;
      // 指定资源目录前缀
      if (assets.dir) {
        assetManager.pathPrefix = assets.dir;
      }
      // 骨骼数据
      if (assets.json) {
        // JSON
        assetManager.loadText(assets.json);
      } else if (assets.skel) {
        // skel（二进制）
        assetManager.loadBinary(assets.skel);
      } else {
        RendererUtil.print('warn', translate('noSkeletonData'));
        return;
      }
      // 图集和纹理
      if (assetManager.loadTextureAtlas) {
        // spine runtime 3.6+
        // loadTextureAtlas 内部会自动加载纹理
        assetManager.loadTextureAtlas(assets.atlas);
      } else {
        // spine runtime 3.5
        assetManager.loadText(assets.atlas);
        assetManager.loadTexture(assets.png);
      }
      // 是否开启纹理预乘
      if (Path.basename(assets.png).includes('pma') ||
        Path.basename(assets.atlas).includes('pma')) {
        this.premultipliedAlpha = true;
      }
      // 等待加载
      requestAnimationFrame(this.loading);
    },

    /**
     * 等待加载
     */
    loading() {
      if (!this.assetManager) {
        return;
      }
      // 文件是否已加载完成
      if (this.assetManager.isLoadingComplete()) {
        // 加载骨骼数据
        const result = this.loadSkeleton();
        if (!result) {
          this.reset();
          return;
        }
        // 设置皮肤
        if (this.skins[0]) {
          // this.skeletonData.defaultSkin.name
          this.setSkin(this.skins[0]);
        }
        // 播放动画
        if (this.animations[0]) {
          this.playAnimation(this.animations[0]);
        }
        // 记录当前帧时间
        this.lastFrameTime = Date.now() / 1000;
        // 下一帧开始渲染
        requestAnimationFrame(this.render);
      } else {
        // 继续等待加载
        requestAnimationFrame(this.loading);
      }
    },

    /**
     * 加载骨骼数据
     */
    loadSkeleton() {
      console.log('[methods]', 'loadSkeleton');
      const assetManager = this.assetManager,
        assets = this.assets;

      // 图集数据
      let atlas = assetManager.get(assets.atlas);
      if (spine.version === '3.5') {
        atlas = new spine.TextureAtlas(atlas);
      }
      // 创建 AtlasAttachmentLoader 对象用于处理部位、网格、包围盒和路径
      const atlasLoader = new spine.AtlasAttachmentLoader(atlas);

      try {
        // 骨骼数据
        if (assets.json) {
          // 创建 skeletonJson 对象用于解析 json 文件
          const skeletonJson = new spine.SkeletonJson(atlasLoader);
          this.skeletonData = skeletonJson.readSkeletonData(assetManager.get(assets.json));
        } else if (assets.skel) {
          // 创建 SkeletonBinary 对象用于解析 skel 文件
          const skeletonBinary = new spine.SkeletonBinary(atlasLoader);
          this.skeletonData = skeletonBinary.readSkeletonData(assetManager.get(assets.skel));
        }
      } catch (error) {
        console.error(error);
        RendererUtil.print('warn', translate('dataMismatch'));
        return false;
      }

      // 创建骨骼对象
      this.skeleton = new spine.Skeleton(this.skeletonData);

      // 计算边界
      this.bounds = this.calculateBounds();

      // 创建 AnimationState 对象用于动画控制
      const animationStateData = new spine.AnimationStateData(this.skeleton.data);
      this.animationState = new spine.AnimationState(animationStateData);

      // Done
      return true;
    },

    /**
     * 设置皮肤
     * @param {string} name 
     */
    setSkin(name) {
      if (!this.skeleton) {
        return;
      }
      this.skin = name;
      // 设置皮肤
      this.skeleton.setSkinByName(name);
      // 重置姿势
      this.skeleton.setSlotsToSetupPose();
    },

    /**
     * 播放动画
     * @param {string} name 
     */
    playAnimation(name) {
      if (!this.skeleton) {
        return;
      }
      this.animation = name;
      // 重置姿势
      this.skeleton.setToSetupPose();
      // 播放动画
      this.animationState.setAnimation(0, name, this.loop);
    },

    /**
     * 设置时间缩放
     * @param {number} value 
     */
    setTimeScale(value) {
      if (!this.skeleton) {
        return;
      }
      this.animationState.timeScale = value;
    },

    /**
     * 计算边界
     * @returns {{ offset: { x: number, y: number }, size: { x: number, y: number } }}
     */
    calculateBounds() {
      const skeleton = this.skeleton;
      skeleton.setToSetupPose();
      skeleton.updateWorldTransform();
      const offset = new spine.Vector2(),
        size = new spine.Vector2();
      skeleton.getBounds(offset, size, []);
      return { offset, size };
    },

    /**
     * 渲染骨骼
     */
    render() {
      if (!this.skeleton) {
        return;
      }
      // 计算帧时间差
      const now = Date.now() / 1000,
        delta = now - this.lastFrameTime;
      // 记录当前帧时间
      this.lastFrameTime = now;

      // 更新 mvp 来适配画布尺寸
      this.resizeView();

      // 清空画布
      const gl = this.gl;
      gl.clearColor(0.3, 0.3, 0.3, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // 应用动画并根据时间差值更新动画时间
      const animationState = this.animationState,
        skeleton = this.skeleton;
      animationState.update(delta);
      animationState.apply(skeleton);
      // 更新骨骼 Transform
      skeleton.updateWorldTransform();

      // 渲染
      const shader = this.shader,
        batcher = this.batcher,
        skeletonRenderer = this.skeletonRenderer;
      // 绑定 shader
      shader.bind();
      // 传递属性
      shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
      shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
      // 渲染骨骼
      batcher.begin(shader);
      // 设置 skeletonRenderer 属性
      skeletonRenderer.premultipliedAlpha = this.premultipliedAlpha;
      // 渲染
      skeletonRenderer.draw(batcher, skeleton);
      batcher.end();
      // 解除 shader 绑定
      shader.unbind();

      // 调试
      if (this.debug) {
        const debugShader = this.debugShader,
          debugRenderer = this.debugRenderer,
          shapeRenderer = this.shapeRenderer;
        // 绑定 shader
        debugShader.bind();
        // 传递属性
        debugShader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
        // 设置 debugRenderer 属性
        debugRenderer.premultipliedAlpha = this.premultipliedAlpha;
        debugRenderer.drawBones = this.drawBones;
        debugRenderer.drawBoundingBoxes = this.drawBoundingBoxes;
        debugRenderer.drawRegionAttachments = this.drawBoundingBoxes;
        debugRenderer.drawMeshHull = this.drawMeshTriangles;
        debugRenderer.drawMeshTriangles = this.drawMeshTriangles;
        debugRenderer.drawPaths = this.drawPaths;
        // 开始渲染
        shapeRenderer.begin(debugShader);
        // 渲染
        debugRenderer.draw(shapeRenderer, skeleton);
        shapeRenderer.end();
        // 解除 shader 绑定
        debugShader.unbind();
      }

      // 持续渲染
      requestAnimationFrame(this.render);
    },

    /**
     * 更新视口尺寸
     */
    resizeView() {
      // 画布尺寸
      const canvas = this.canvas,
        { clientWidth, clientHeight } = canvas;
      if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
      }

      // 骨骼位置以及缩放
      const bounds = this.bounds;
      // 计算中心点
      const centerX = (bounds.offset.x + (bounds.size.x / 2)) || 0,
        centerY = (bounds.offset.y + (bounds.size.y / 2)) || 0;
      // 计算缩放比例
      const ratioX = bounds.size.x / canvas.width,
        ratioY = bounds.size.y / canvas.height;
      let scale = Math.max(ratioX, ratioY) * 1.2;
      if (scale < 1) scale = 1;
      // 自定义缩放
      scale /= this.viewScale;
      // 最终宽高
      const width = canvas.width * scale,
        height = canvas.height * scale;
      // 更新矩阵
      const x = centerX - width / 2,
        y = centerY - height / 2;
      this.mvp.ortho2d(x, y, width, height);
      // 更新视口
      this.gl.viewport(0, 0, canvas.width, canvas.height);
    },

    /**
     * （主进程）资源旋转回调
     * @param {Electron.ipcRendererEvent} event 
     * @param {{ dir?: string, json?: string, skel?: string, atlas: string, png: string }} assets 资源
     */
    onAssetsSelectedEvent(event, assets) {
      console.log('[methods]', 'onAssetsSelectedEvent', assets);
      // 重置
      if (this.assets) {
        this.reset();
      }
      // 未选中资源
      if (!assets) return;
      // 储存
      this.assets = { ...assets };
      // 处理路径
      this.processAssetPaths();
      // 获取运行时
      const result = this.getRuntime();
      if (!result) return;
      // 初始化运行时
      this.initRuntime();
      // 开始加载资源
      this.loadAssets();
    },

    /**
     * 处理资源路径
     */
    processAssetPaths() {
      // ⚠️ Spine Runtime 在 Windows 平台下的问题
      // 使用 loadTextureAtlas 加载图集时会自动加载纹理
      // 但是 loadTextureAtlas 内部调用 loadTexture 时传递的 path 是文件名而不是完整路径
      // 如果没有指定 pathPrefix 属性，loadTexture 就会无法正常加载
      // 所以干脆都改为需要指定 pathPrefix 属性
      const assets = this.assets;
      if (!assets.dir) {
        assets.dir = Path.dirname(assets.json || assets.skel);
      }
      if (!assets.dir.endsWith(Path.sep)) {
        assets.dir += Path.sep;
      }
      if (assets.json) {
        assets.json = Path.basename(assets.json);
      }
      if (assets.skel) {
        assets.skel = Path.basename(assets.skel);
      }
      assets.atlas = Path.basename(assets.atlas);
      assets.png = Path.basename(assets.png);
      console.log('[methods]', 'processAssetPaths', this.assets);
    },

    /**
     * 窗口尺寸变化回调
     */
    onWindowResize() {
      const { layout, properties } = this.$refs,
        layoutStyle = layout.style,
        propertiesStyle = properties.style;
      if (layout.clientWidth >= 800 || layout.clientHeight < 330) {
        if (layout.clientWidth >= 350) {
          // 水平布局
          layoutStyle.flexDirection = 'row';
          propertiesStyle.width = '265px';
          propertiesStyle.marginTop = '0';
          propertiesStyle.marginLeft = '5px';
          propertiesStyle.display = 'flex';
        } else {
          // 隐藏选项
          propertiesStyle.display = 'none';
        }
      } else {
        // 垂直布局
        layoutStyle.flexDirection = 'column';
        propertiesStyle.width = '100%';
        propertiesStyle.marginTop = '5px';
        propertiesStyle.marginLeft = '0';
        propertiesStyle.display = 'flex';
      }
    },

    /**
     * 鼠标滚轮事件回调
     * @param {WheelEvent} event 
     */
    onMouseWheel(event) {
      // 仅在画布上生效
      if (event.path[0] !== this.canvas) {
        return;
      }
      // 缩放
      let scale = this.viewScale;
      // 方向
      if (event.wheelDelta > 0) {
        // 向上（放大）
        scale += 0.1;
      } else {
        // 向下（缩小）
        scale -= 0.1;
      }
      // 处理精度
      scale = Math.round(scale * 10) / 10;
      // 设置缩放
      this.viewScale = scale;
    },

  },

  /**
   * 生命周期：实例被挂载
   */
  async mounted() {
    console.log('mounted', this);
    // 触发窗口尺寸适配逻辑
    this.onWindowResize();
    // 监听鼠标滚轮变化
    window.addEventListener('mousewheel', this.onMouseWheel.bind(this));
    // （主进程）监听资源选择事件
    RendererUtil.on('assets-selected', this.onAssetsSelectedEvent.bind(this));
    // 下一帧
    this.$nextTick(() => {
      // （主进程）已就绪
      RendererUtil.send('ready');
      // （主进程）检查更新
      RendererUtil.send('check-update', false);
    });
    // 延迟执行
    setTimeout(() => {
      // 监听元素尺寸变化
      const observer = new ResizeObserver(entries => {
        this.onWindowResize();
      });
      observer.observe(this.$refs.layout);
    }, 500);
  },

  /**
   * 生命周期：实例销毁前
   */
  beforeDestroy() {
    // 取消事件监听
    RendererUtil.removeAllListeners('assets-selected');
  },

};

module.exports = App;
