/**
 * 模块控制器
 */

module.exports = function(control) {
	control.set({
		data: '/aj/index',
		tpl: './tpl',
		logic: './logic',
        css: './style'
	});
};