/**
 * 应用入口文件
 */
require('components/index/ctrl');
require('components/test/ctrl');

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
    routerOption: {
        useHash:false,
        queryTime: 3
    }
});


