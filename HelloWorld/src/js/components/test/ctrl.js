/**
 * 模块控制器
 */
require('./tpl');

module.exports = function(control) {
	control.set({
		data: {
			txt: 'hello world test!!!'
		},
		tpl: 'components/test/tpl'
	});
};