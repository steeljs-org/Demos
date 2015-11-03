steel.d("components/test/ctrl", [],function(require, exports, module) {
/**
 * 模块控制器
 */

module.exports = function(control) {
	control.set({
		data: {
			txt: 'hello world test!!!'
		},
		tpl: 'components/test/tpl'
	});
};
});