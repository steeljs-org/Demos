/**
 * 模块控制器
 */

require('./tpl');

module.exports = function(control) {
    control.set({
        data: '/aj/index_child',
        tpl: './tpl',
        logic: './logic'
    });
};