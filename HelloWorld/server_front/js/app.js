steel.d("app", [],function(require, exports, module) {
/**
 * 应用入口文件
 */

steel.config({
	basePath: ResPath,
    jsPath: ResPath + 'js/',
    cssPath: ResPath + 'css/',
    ajaxPath: '/',
    mainBox: document.body,
    router: [
        ['/index', 'components/index/ctrl'],
        ['/test', 'components/test/ctrl'],
    ],
    routerOption:{
        useHash:false,
        queryTime: 3
    }
});



});