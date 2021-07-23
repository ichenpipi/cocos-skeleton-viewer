const { BrowserWindow } = require('electron');

/**
 * 窗口工具（主进程）
 * @author ifaswind (陈皮皮)
 * @version 20210723
 */
const WindowUtil = {

    /**
     * 获取当前聚焦的窗口
     * @returns {BrowserWindow}
     */
    getFocusedWindow() {
        return BrowserWindow.getFocusedWindow();
    },

    /**
     * 计算窗口位置
     * @param {[number, number]} size 窗口尺寸
     * @param {'top' | 'center'} anchor 锚点
     * @returns {[number, number]}
     */
    calcWindowPosition(size, anchor) {
        // 根据当前聚焦的窗口位置和尺寸来计算
        const focusedWin = BrowserWindow.getFocusedWindow(),
            focusedWinSize = focusedWin.getSize(),
            focusedWinPos = focusedWin.getPosition();
        // 注意：原点 (0, 0) 在屏幕左上角
        // 另外，窗口的位置值必须是整数，否则修改无效（像素的最小粒度为 1）
        const x = Math.floor(focusedWinPos[0] + (focusedWinSize[0] / 2) - (size[0] / 2));
        let y;
        switch (anchor) {
            case 'top': {
                y = Math.floor(focusedWinPos[1]);
                break;
            }
            default:
            case 'center': {
                y = Math.floor(focusedWinPos[1] + (focusedWinSize[1] / 2) - (size[1] / 2));
                break;
            }
        }
        return [x, y];
    },

};

module.exports = WindowUtil;
