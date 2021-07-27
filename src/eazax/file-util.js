const Fs = require('fs');
const Path = require('path');
const { promisify } = require('util');

/**
 * 文件工具 (Promise 化)
 * @author ifaswind (陈皮皮)
 * @version 20210726
 */
const FileUtil = {

    /**
     * 获取文件状态
     * @param {Fs.PathLike} path 路径
     * @returns {Promise<Fs.stats>}
     */
    stat: promisify(Fs.stat),

    /**
     * 创建文件夹
     * @param {Fs.PathLike} path 路径
     * @param {Fs.MakeDirectoryOptions?} options 选项
     * @returns {Promise<void>}
     */
    mkdir: promisify(Fs.mkdir),

    /**
     * 读取文件夹
     * @param {Fs.PathLike} path 路径
     * @param {any} options 选项
     * @returns {Promise<string[]>}
     */
    readdir: promisify(Fs.readdir),

    /**
     * 移除文件夹
     * @param {Fs.PathLike} path 路径
     * @param {Fs.RmDirOptions?} options 选项
     * @returns {Promise<void>}
     */
    rmdir: promisify(Fs.rmdir),

    /**
     * 读取文件
     * @param {Fs.PathLike} path 路径
     * @param {any} options 选项
     * @returns {Promise<Buffer>}
     */
    readFile: promisify(Fs.readFile),

    /**
     * 创建文件
     * @param {Fs.PathLike} path 路径
     * @param {string | NodeJS.ArrayBufferView} data 数据
     * @param {Fs.WriteFileOptions?} options 选项
     * @returns {Promise<void>}
     */
    writeFile: promisify(Fs.writeFile),

    /**
     * 移除文件
     * @param {Fs.PathLike} path 路径
     * @returns {Promise<void>}
     */
    unlink: promisify(Fs.unlink),

    /**
     * 测试路径是否存在
     * @param {Fs.PathLike} path 路径
     * @returns {Promise<boolean>}
     */
    exists: promisify(Fs.exists),

    /**
     * 测试路径是否存在 (同步)
     * @param {Fs.PathLike} path 路径
     */
    existsSync: Fs.existsSync,

    /**
     * 复制文件/文件夹
     * @param {Fs.PathLike} srcPath 源路径
     * @param {Fs.PathLike} destPath 目标路径
     */
    async copy(srcPath, destPath) {
        if (!(await FileUtil.exists(srcPath))) {
            return;
        }
        const stats = await FileUtil.stat(srcPath);
        if (stats.isDirectory()) {
            if (!(await FileUtil.exists(destPath))) {
                await FileUtil.mkdir(destPath);
            }
            const names = await FileUtil.readdir(srcPath);
            for (const name of names) {
                FileUtil.copy(Path.join(srcPath, name), Path.join(destPath, name));
            }
        } else if (stats.isFile()) {
            await FileUtil.writeFile(destPath, await FileUtil.readFile(srcPath));
        }
    },

    /**
     * 移除文件/文件夹 (递归)
     * @param {Fs.PathLike} path 路径
     */
    async remove(path) {
        if (!(await FileUtil.exists(path))) {
            return;
        }
        const stats = await FileUtil.stat(path);
        if (stats.isDirectory()) {
            const names = await FileUtil.readdir(path);
            for (const name of names) {
                FileUtil.remove(Path.join(path, name));
            }
            await FileUtil.rmdir(path);
        } else if (stats.isFile()) {
            await FileUtil.unlink(path);
        }
    },

    /**
     * 遍历文件/文件夹并执行函数
     * @param {Fs.PathLike} path 路径
     * @param {(filePath: Fs.PathLike, stat: Fs.Stats) => void} handler 处理函数
     */
    async map(path, handler) {
        if (!(await FileUtil.exists(path))) {
            return;
        }
        const stats = await FileUtil.stat(path);
        if (stats.isFile()) {
            handler(path, stats);
        } else {
            const names = await FileUtil.readdir(path);
            for (const name of names) {
                await FileUtil.map(Path.join(path, name), handler);
            }
        }
    },

};

module.exports = FileUtil;
