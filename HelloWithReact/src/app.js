/**
 * 应用入口文件
 */

var loadingHTML = require('common/loading/tpl')();
var errFn = require('common/pageError/logic');
/* 合并资源区 end*/

var basePath = '/';

var mainBox = document.body;
var timer = null;
steel.config({
    version: '1.0',
    basePath: '/',
    jsPath: 'http://res.test.cn/',
    cssPath: 'http://res.test.cn/',
    ajaxPath: '/',
    mainBox: mainBox,
    router: [
            [basePath, 'components/reactdemo/ctrl'],
            [basePath+'index', 'components/reactdemo/ctrl']
    ]
});

//监听loading事件
steel.on('stageChange', function(node){
    clearTimeout(timer);
    steel._destroyByNode(node);
    node.innerHTML = loadingHTML || '';
});
//监听error事件

steel.on('renderError', function(node){
    dataErr = errFn(basePath);
    timer = dataErr.timer;
});
//监听最后一个模块domready完成事件
steel.on('allDomReady', function() {
});