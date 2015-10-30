/**
 * 模块控制器
 */

module.exports = function(control) {
	control.set({
		data: '/aj/index',
		tpl: 'components/index/tpl',
		logic: 'components/index/logic'
	});
};