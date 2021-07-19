const Fs = require('fs');
const Path = require('path');
const { promisify } = require('util');

/**
 * 文件工具 (Promise)
 * @author ifaswind (陈皮皮)
 * @version 20210711
 */
const FileUtil = {

    /**
     * 获取文件状态
     * @param {Fs.PathLike} path 路径
     * @returns {Promise<Fs.stats>}
     */
    stat: promisify(Fs.stat),

    /**
     * 读取文件夹
     * @param {Fs.PathLike} path 路径
     * @returns {Promise<string[]>}
     */
    readdir: promisify(Fs.readdir),

    /**
     * 读取文件
     * @param {Fs.PathLike} path 路径
     * @returns {Promise<Buffer>}
     */
    readFile: promisify(Fs.readFile),

    /**
     * 写入文件
     * @param {Fs.PathLike} path 路径
     * @param {string | NodeJS.ArrayBufferView} data 数据
     * @param {Fs.WriteFileOptions?} options 选项
     * @returns {Promise<void>}
     */
    writeFile: promisify(Fs.writeFile),

    /**
     * 复制文件/文件夹
     * @param {Fs.PathLike} srcPath 源路径
     * @param {Fs.PathLike} destPath 目标路径
     */
    async copy(srcPath, destPath) {
        if (!Fs.existsSync(srcPath)) {
            return;
        }
        const stats = await FileUtil.stat(srcPath);
        if (stats.isDirectory()) {
            if (!Fs.existsSync(destPath)) {
                Fs.mkdirSync(destPath);
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
     * 删除文件/文件夹
     * @param {Fs.PathLike} path 路径
     */
    async delete(path) {
        if (!Fs.existsSync(path)) {
            return;
        }
        const stats = await FileUtil.stat(path);
        if (stats.isDirectory()) {
            const names = await FileUtil.readdir(path);
            for (const name of names) {
                FileUtil.delete(Path.join(path, name));
            }
            Fs.rmdirSync(path);
        } else if (stats.isFile()) {
            Fs.unlinkSync(path);
        }
    },

    /**
     * 遍历文件/文件夹并执行函数
     * @param {Fs.PathLike} path 路径
     * @param {(filePath: Fs.PathLike, stat: Fs.Stats) => void} handler 处理函数
     */
    async map(path, handler) {
        if (!Fs.existsSync(path)) {
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
