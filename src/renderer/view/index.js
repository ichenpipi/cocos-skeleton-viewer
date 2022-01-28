module.exports = (function () {
    'use strict';

    const { shell } = require('electron');
    const Path = require('path');
    const Fs = require('fs');
    const I18n = require('../../eazax/i18n');
    const RendererEvent = require('../../eazax/renderer-event');
    const EditorRendererKit = require('../../eazax/editor-renderer-kit');
    const { hexToRGB } = require('../../eazax/color-util');
    const SpineRuntime = require('../../common/spine-runtime');
    const EditorAdapter = require('../../common/editor-adapter');

    /** 当前语言 */
    const LANG = EditorAdapter.getLanguage();

    /**
     * i18n
     * @param {string} key
     * @returns {string}
     */
    const translate = (key) => I18n.translate(LANG, key);

    // 元素
    let canvas = null,
        layout = null,
        properties = null;
    // 元素观察者
    let resizeObserver = null;
    // 环境
    let gl = null,
        shader = null,
        batcher = null,
        mvp = null,
        skeletonRenderer = null;
    // 调试
    let debugRenderer = null,
        debugShader = null,
        shapeRenderer = null;
    // 骨骼数据
    let skeleton = null,
        bounds = null;
    // 上一帧时间
    let lastFrameTime = null;
    // 拖动
    let isDragging = false,
        clickOffset = [0, 0];

    // 构建 Vue 应用
    const App = {

        /**
         * 数据
         */
        data() {
            return {
                // 资源信息
                assets: {
                    dir: null,
                    json: null,
                    skel: null,
                    atlas: null,
                    png: null,
                },
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
                // 画布颜色
                canvasColor: '#4c4c4c',
                clearColor: [0.3, 0.3, 0.3],
                // 环境
                assetManager: null,
                // 骨骼数据
                skeletonData: null,
                animationState: null,
                // 拖动
                dragOffset: [0, 0],
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

            /**
             * 偏移
             */
            offset() {
                return `(${this.dragOffset[0]}, ${-this.dragOffset[1]})`;
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
             * 时间缩放
             * @param {number} value 
             */
            timeScale(value) {
                value = parseFloat(value) || 0;
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

            /**
             * 画布颜色
             * @param {string} value 
             */
            canvasColor(value) {
                // 更新画布颜色
                canvas.style.backgroundColor = value;
                // 获取 RGB 格式
                const { r, g, b } = hexToRGB(value);
                // 保存颜色值
                this.clearColor = [r / 255, g / 255, b / 255];
                // 更新 gl 颜色
                if (gl) {
                    gl.clearColor(r / 255, g / 255, b / 255, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                }
            },

        },

        /**
         * 实例函数
         */
        methods: {

            /**
             * 重置
             */
            reset() {
                // 资源信息
                this.assets = null;
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
                // 恢复默认画布颜色
                this.canvasColor = '#2f2f2f';
                // 骨骼数据
                skeleton = null;
                bounds = null;
                this.skeletonData = null;
                this.animationState = null;
                // 清空画布
                gl && gl.clear(gl.COLOR_BUFFER_BIT);
                // 环境
                shader = null;
                batcher = null;
                mvp = null;
                skeletonRenderer = null;
                this.assetManager = null;
                // 调试
                debugRenderer = null;
                debugShader = null;
                shapeRenderer = null;
                // 上一帧时间
                lastFrameTime = null;
                // 拖动
                isDragging = false;
                clickOffset = [0, 0];
                this.dragOffset = [0, 0];
            },

            /**
             * 翻译
             * @param {string} key 
             */
            t(key) {
                return translate(key);
            },

            /**
             * 资源信息按钮点击回调
             */
            onInfoBtnClick() {
                if (!this.assets || !this.assets.dir) {
                    return;
                }
                const { dir, json, skel } = this.assets,
                    skeletonPath = Path.join(dir, (json || skel));
                // 在资源管理器中展示 spine 文件
                shell.showItemInFolder(skeletonPath)
            },

            /**
             * 选择资源按钮点击回调
             */
            onSelectBtnClick() {
                // （主进程）选择资源
                RendererEvent.send('select');
            },

            /**
             * 重置按钮点击回调
             */
            onResetBtnClick() {
                this.reset();
            },

            /**
             * 复位按钮点击回调
             */
            onRepositionBtnClick() {
                isDragging = false;
                clickOffset = [0, 0];
                this.dragOffset = [0, 0];
            },

            /**
             * 获取 Spine 运行时
             */
            getRuntime() {
                // 资源对应的 Spine 运行时版本
                let version = this.getAssetSpineVersion(this.assets.json || this.assets.skel);
                if (!version) {
                    // RendererUtil.print('warn', translate('noVersion'));
                    // return false;
                    console.warn('Unable to identify Spine version of asset!');
                    // 默认使用 3.8 的 Runtime
                    version = "3.8";
                }
                // 处理版本号（保留前两个分量）
                version = version.split('.').slice(0, 2).map(v => parseInt(v)).join('.');
                // 获取目标版本的 Spine 运行时对象
                const spine = SpineRuntime.get(version);
                if (!spine) {
                    const content = `${translate('noSpineRuntime')} | ${translate('version')}: ${version}`;
                    EditorRendererKit.print('warn', content);
                    return false;
                }
                window.spine = spine;
                this.version = spine.version;
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
                // 获取画布
                if (!canvas) {
                    canvas = this.$refs.canvas;
                }
                // WebGL
                if (!gl) {
                    const config = { alpha: false };
                    gl = canvas.getContext("webgl", config);
                    if (!gl) {
                        EditorRendererKit.print('warn', translate('noWebGL'));
                        return;
                    }
                    const color = this.clearColor;
                    gl.clearColor(color[0], color[1], color[2], 1);
                }

                // Shader
                shader = spine.webgl.Shader.newTwoColoredTextured(gl);
                // 处理器
                batcher = new spine.webgl.PolygonBatcher(gl);
                // MVP 变换矩阵
                mvp = new spine.webgl.Matrix4();
                mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
                // 骨骼渲染器
                skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);

                // 用于调试的 debugRenderer、debugShader 和 shapeRenderer
                debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
                debugShader = spine.webgl.Shader.newColored(gl);
                shapeRenderer = new spine.webgl.ShapeRenderer(gl);

                // 资源管理器
                this.assetManager = new spine.webgl.AssetManager(gl);
            },

            /**
             * 加载资源
             */
            loadAssets() {
                const assetManager = this.assetManager;
                if (!assetManager) {
                    return;
                }
                const assets = this.assets;
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
                    EditorRendererKit.print('warn', translate('noSkeletonData'));
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
                    if (this.skins && this.skins[0]) {
                        // this.skeletonData.defaultSkin.name
                        this.setSkin(this.skins[0]);
                    }
                    // 播放动画
                    if (this.animations && this.animations[0]) {
                        this.playAnimation(this.animations[0]);
                    }
                    // 记录当前帧时间
                    lastFrameTime = Date.now() / 1000;
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
                    EditorRendererKit.print('warn', translate('dataMismatch'));
                    return false;
                }

                // 创建骨骼对象
                skeleton = new spine.Skeleton(this.skeletonData);

                // 计算边界
                bounds = this.calculateBounds();

                // 创建 AnimationState 对象用于动画控制
                const animationStateData = new spine.AnimationStateData(skeleton.data);
                this.animationState = new spine.AnimationState(animationStateData);

                // Done
                return true;
            },

            /**
             * 设置皮肤
             * @param {string} name 
             */
            setSkin(name) {
                if (!skeleton) {
                    return;
                }
                this.skin = name;
                // 设置皮肤
                skeleton.setSkinByName(name);
                // 重置姿势
                skeleton.setSlotsToSetupPose();
            },

            /**
             * 播放动画
             * @param {string} name 
             */
            playAnimation(name) {
                if (!skeleton) {
                    return;
                }
                this.animation = name;
                // 重置姿势
                skeleton.setToSetupPose();
                // 播放动画
                this.animationState.setAnimation(0, name, this.loop);
            },

            /**
             * 设置时间缩放
             * @param {number} value 
             */
            setTimeScale(value) {
                if (!skeleton) {
                    return;
                }
                this.animationState.timeScale = value;
            },

            /**
             * 计算边界
             * @returns {{ offset: { x: number, y: number }, size: { x: number, y: number } }}
             */
            calculateBounds() {
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
                if (!skeleton) {
                    return;
                }
                // 计算帧时间差
                const now = Date.now() / 1000,
                    delta = now - lastFrameTime;
                // 记录当前帧时间
                lastFrameTime = now;

                // 更新 mvp 来适配画布尺寸
                this.resizeView();

                // 清空画布
                gl.clear(gl.COLOR_BUFFER_BIT);

                // 应用动画并根据时间差值更新动画时间
                this.animationState.update(delta);
                this.animationState.apply(skeleton);
                // 更新骨骼 Transform
                skeleton.updateWorldTransform();

                // 渲染
                // 绑定 shader
                shader.bind();
                // 传递属性
                shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
                shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);
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
                    // 绑定 shader
                    debugShader.bind();
                    // 传递属性
                    debugShader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);
                    // 设置 debugRenderer 属性
                    debugRenderer.premultipliedAlpha = this.premultipliedAlpha;
                    debugRenderer.drawBones = this.drawBones;
                    debugRenderer.drawBoundingBoxes = this.drawBoundingBoxes;
                    debugRenderer.drawRegionAttachments = this.drawBoundingBoxes;
                    debugRenderer.drawMeshHull = this.drawMeshTriangles;
                    debugRenderer.drawMeshTriangles = this.drawMeshTriangles;
                    debugRenderer.drawPaths = this.drawPaths;
                    debugRenderer.drawSkeletonXY = this.drawBones;
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
                // 更新画布尺寸
                const { clientWidth, clientHeight } = canvas;
                if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
                    canvas.width = clientWidth;
                    canvas.height = clientHeight;
                }
                // 骨骼位置以及缩放
                const canvasWidth = canvas.width,
                    canvasHeight = canvas.height;
                // 计算中心点
                const centerX = (bounds.offset.x + (bounds.size.x / 2)) || 0,
                    centerY = (bounds.offset.y + (bounds.size.y / 2)) || 0;
                // 计算缩放比例
                const ratioX = bounds.size.x / canvasWidth,
                    ratioY = bounds.size.y / canvasHeight;
                let scale = Math.max(ratioX, ratioY) * 1.2;
                if (scale < 1) scale = 1;
                // 自定义缩放
                scale /= this.viewScale;
                // 最终宽高
                const width = canvasWidth * scale,
                    height = canvasHeight * scale;
                // 更新矩阵
                const x = (centerX - (width / 2)) - (this.dragOffset[0] * scale),
                    y = (centerY - (height / 2)) + (this.dragOffset[1] * scale);
                mvp.ortho2d(x, y, width, height);
                // 更新视口
                gl.viewport(0, 0, canvasWidth, canvasHeight);
            },

            /**
             * （主进程）资源旋转回调
             * @param {Electron.ipcRendererEvent} event 
             * @param {{ dir?: string, json?: string, skel?: string, atlas: string, png: string }} assets 资源
             */
            onAssetsSelectedEvent(event, assets) {
                // 重置
                if (this.assets) {
                    this.reset();
                }
                // 未选中资源
                if (!assets) return;
                // 储存
                this.assets = assets;
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
                const assets = this.assets,
                    { dir, json, skel, png, atlas } = assets;
                if (!dir) {
                    assets.dir = Path.dirname(json || skel);
                }
                if (!assets.dir.endsWith(Path.sep)) {
                    assets.dir += Path.sep;
                }
                if (json) {
                    assets.json = Path.basename(json);
                } else if (skel) {
                    assets.skel = Path.basename(skel);
                }
                assets.atlas = Path.basename(atlas);
                assets.png = Path.basename(png);
            },

            /**
             * 画布鼠标滚轮事件回调
             * @param {WheelEvent} event 
             */
            onCanvasMouseWheel(event) {
                if (!this.assets) {
                    return;
                }
                // 当前缩放
                let scale = this.viewScale;
                // 缩放步长
                const step = Math.abs(scale) >= 1 ? 0.1 : 0.05;
                // 方向
                if (event.wheelDelta > 0) {
                    // 向上（放大）
                    scale += step;
                } else {
                    // 向下（缩小）
                    scale -= step;
                }
                // 处理精度
                scale = Math.round(scale * 100) / 100;
                // 设置缩放
                this.viewScale = scale;
            },

            /**
             * 画布鼠标点击事件回调
             * @param {MouseEvent} event 
             */
            onCanvasMouseDown(event) {
                if (!this.assets) {
                    return;
                }
                isDragging = true;
                const x = event.offsetX - this.dragOffset[0],
                    y = event.offsetY - this.dragOffset[1];
                clickOffset = [x, y];
            },

            /**
             * 画布鼠标移动事件回调
             * @param {MouseEvent} event 
             */
            onCanvasMouseMove(event) {
                if (!isDragging) {
                    return;
                }
                const x = event.offsetX - clickOffset[0],
                    y = event.offsetY - clickOffset[1];
                this.dragOffset = [x, y];
            },

            /**
             * 画布鼠标松开事件回调
             * @param {MouseEvent} event 
             */
            onCanvasMouseUp(event) {
                isDragging = false;
                clickOffset = [0, 0];
            },

            /**
             * 画布鼠标离开事件回调
             * @param {MouseEvent} event 
             */
            onCanvasMouseLeave(event) {
                isDragging = false;
                clickOffset = [0, 0];
            },

            /**
             * 布局尺寸变化回调
             */
            onLayoutResize() {
                const layoutStyle = layout.style,
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

        },

        /**
         * 生命周期：挂载后
         */
        mounted() {
            // 收集元素
            canvas = this.$refs.canvas;
            layout = this.$refs.layout;
            properties = this.$refs.properties;
            // 监听画布事件
            canvas.addEventListener('mousewheel', this.onCanvasMouseWheel); // 监听画布鼠标滚轮
            canvas.addEventListener('mousedown', this.onCanvasMouseDown);   // 监听画布鼠标点击
            canvas.addEventListener('mousemove', this.onCanvasMouseMove);   // 监听画布鼠标移动
            canvas.addEventListener('mouseup', this.onCanvasMouseUp);       // 监听画布鼠标松开
            canvas.addEventListener('mouseleave', this.onCanvasMouseLeave); // 监听画布鼠标离开
            // （主进程）监听资源选择事件
            RendererEvent.on('assets-selected', this.onAssetsSelectedEvent);
            // （下一帧）发送事件给主进程
            this.$nextTick(() => {
                RendererEvent.send('ready');                // （主进程）已就绪
                RendererEvent.send('check-update', false);  // （主进程）检查更新
            });
            // 主动触发布局尺寸变化
            this.onLayoutResize();
            // 监听布局尺寸变化
            resizeObserver = new ResizeObserver(entries => {
                this.onLayoutResize();
            });
            resizeObserver.observe(layout);
        },

        /**
         * 生命周期：卸载前
         */
        beforeUnmount() {
            // 清理案发现场
            canvas = null;
            layout = null;
            properties = null;
            gl = null;
            shader = null;
            batcher = null;
            mvp = null;
            skeletonRenderer = null;
            debugRenderer = null;
            debugShader = null;
            shapeRenderer = null;
            skeleton = null;
            bounds = null;
            // 取消监听布局尺寸变化
            resizeObserver.disconnect();
            resizeObserver = null;
            // 取消事件监听
            RendererEvent.removeAllListeners('assets-selected');
            // 发送事件给主进程
            RendererEvent.send('close');
        },

    };
    return App;

}());
