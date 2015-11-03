steel.d("components/index/ctrl", [],function(require, exports, module) {
/**
 * 模块控制器
 */

module.exports = function(control) {
	control.set({
		data: '/aj/index',
		tpl: './tpl',
		logic: './logic'
	});
};
});