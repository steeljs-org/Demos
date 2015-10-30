/**
 * WebApp
 */

!function(window, undefined) {

    
var steel = window.steel || {
    v : 0.1,
    t : now()
};



var userAgent = navigator.userAgent,
    document = window.document,
    docElem = document.documentElement,
    head = document.head || getElementsByTagName( 'head' )[ 0 ] || docElem,
    setTimeout = window.setTimeout,
    location = window.location,
    clearTimeout = window.clearTimeout,
    decodeURI = window.decodeURI,
    toString = Object.prototype.toString,
    isHTML5 = !!history.pushState,
    isAddEventListener = document.addEventListener,
    isDebug,
    IE = /msie (\d+\.\d+)/i.test( userAgent ) ? ( document.documentMode || + RegExp[ '$1' ] ) : 0;

var mainBox;

/*
 * log
 */
function log() {
    window.console && window.console.log.apply(console, arguments);
}
/*
 * 空白方法
 */
function emptyFunction() {}
/*
 * id取节点
 * @method getElementById
 * @private
 * @param {string} id
 */
function getElementById( id ) {
    return document.getElementById( id );
}

/*
 * tagName取节点
 * @method getElementsByTagName
 * @private
 * @param {string} tagName
 */
function getElementsByTagName( tagName, el ) {
    return ( el || document ).getElementsByTagName( tagName );
}

/*
 * now
 * @method now
 * @private
 * @return {number} now time
 */
function now() {
    return Date.now ? Date.now() : +new Date();
}
    

var config_list = [];

config_push(function(config) {
    if ('debug' in config) {
        isDebug = config.debug
    }
    mainBox = config.mainBox;
});

steel.config = function(config) {
  for (var i = 0, l = config_list.length; i < l; ++i) {
    config_list[i](config);
  }
};

function config_push(fn) {
  config_list.push(fn);
}

    //已定义的模块容器
var require_defineDeps = {};
var require_defineConstrutors = {};


//已运行的模块容器
var require_runList = {};

//自执行的ns
var require_dataMainId;
var require_mainTimer;
var require_global_loadingNum = 0;

//是否定义
function require_ismodule_defined(ns) {
    return !!require_defineDeps[ns];
}

//是否运行过
function require_ismodule_runed(ns) {
    return ns in require_runList;
}

function require_idFix(id, basePath) {
    if (id.indexOf('.') == 0) {
        id = basePath ? (basePath + id).replace(/\/\.\//, '/') : id.replace(/^\.\//, '');
    }
    while (id.indexOf('../') != -1) {
        id = id.replace(/\w+\/\.\.\//, '');
    }
    return id;
}

function require_nameToPath(name){
    return name.substr(0, name.lastIndexOf('/') + 1);
}



/*
 * parse URL
 * @method core_parseURL
 * @private
 * @param {string} str
 * @return {object}
 * @example
 * core_parseURL( 'http://t.sina.com.cn/profile?beijing=huanyingni' ) === 
    {
        hash : ''
        host : 't.sina.com.cn'
        path : '/profile'
        port : ''
        query : 'beijing=huanyingni'
        protocol : http
        href : 'http://t.sina.com.cn/profile?beijing=huanyingni'
    }
 */
function core_parseURL( url ) {
    var parse_url = /^(?:([A-Za-z]+):(\/{0,3}))?([0-9.\-A-Za-z]+\.[0-9A-Za-z]+)?(?::(\d+))?(?:(\/[^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var names = [ "url", "scheme", "slash", "host", "port", "path", "query", "hash" ];
    var results = parse_url.exec(url);
    var retJson = {};
    for (var i = 0, len = names.length; i < len; i += 1) {
        retJson[names[i]] = results[i] || "";
    }
    return retJson;
}

/*
 * query to json
 * @method core_queryToJson
 * @private
 * @param {string} query
 * @return {json} JSON
 * @example
 * var q1 = 'a=1&b=2&c=3';
 * core_queryToJson( q1 ) === {'a':1,'b':2,'c':3};
 */
function core_queryToJson( query ) {
    
    var queryList = query.split( '&' );
    var retJson  = {};
    
    for( var i = 0, len = queryList.length; i < len; ++i ){
        if ( queryList[ i ] ) {
            var hsh = queryList[ i ].split( '=' );
            var key = hsh[ 0 ];
            var value = hsh[ 1 ] || '';
            retJson[ key ] = retJson[ key ] ? [].concat( retJson[ key ], value ) : value;
        }
    }
    return retJson;
    
}

/**
 * Describe 对url进行解析变化
 * @id  core_URL
 * @alias
 * @param {String} url
 * @param {Object} 
    {
        'isEncodeQuery'  : {Boolean}, //对query编码
        'isEncodeHash'   : {Boolean}  //对hash编码
    }
 * @return {Object}
    {
        setParam    : {Function}
        getParam    : {Function}
        setParams   : {Function}
        setHash     : {Function}
        getHash     : {Function}
        toString    : {Function}
    }
 * @example
 *  alert(
 *      core_URL('http://abc.com/a/b/c.php?a=1&b=2#a=1').
 *      setParam('a', 'abc').
 *      setHash('a', 67889).
 *      setHash('a1', 444444).toString()
 *  );
 */

/*
 * typeof
 */
function core_object_typeof( value ) {
    return value === null ? '' : Object.prototype.toString.call( value ).slice( 8, -1 ).toLowerCase();
}

/*
 * json to query
 * @method core_jsonToQuery
 * @private
 * @param {json} json
 * @return {string} query
 */
function core_jsonToQuery( json ) {
    
    var queryString = [];
    for ( var k in json ) {
        if ( core_object_typeof( json[ k ] ) === 'array' ) {
            for ( var i = 0, len = json[ k ].length; i < len; ++i ) {
                queryString.push( k + '=' + json[ k ][ i ] );
            }
        } else {
            queryString.push( k + '=' + json[ k ] );
        }
    }
    return queryString.join( '&' );
    
}


/*
 * 合并参数，不影响源
 * @param {Object} oSource 需要被赋值参数的对象
 * @param {Object} oParams 传入的参数对象 
 * @param {Boolean} isown 是否仅复制自身成员，不复制prototype，默认为false，会复制prototype
*/
function core_object_parseParam(oSource, oParams, isown){
    var key, obj = {};
    oParams = oParams || {};
    for (key in oSource) {
        obj[key] = oSource[key];
        if (oParams[key] != null) {
            if (isown) {// 仅复制自己
                if (oSource.hasOwnProperty(key)) {
                    obj[key] = oParams[key];
                }
            } else {
                obj[key] = oParams[key];
            }
        }
    }
    return obj;
}


function core_URL(sURL,args){
    var opts = core_object_parseParam({
        'isEncodeQuery'  : false,
        'isEncodeHash'   : false
    },args||{});
    var retJson = {};
    var url_json = core_parseURL(sURL);
    
    
    var query_json = core_queryToJson(url_json.query);
    
    var hash_json = core_queryToJson(url_json.hash);
    
    
    /**
     * Describe 设置query值
     * @method setParam
     * @param {String} sKey
     * @param {String} sValue
     * @example
     */
    retJson.setParam = function(sKey, sValue){
        query_json[sKey] = sValue;
        return this;
    };
    /**
     * Describe 取得query值
     * @method getParam
     * @param {String} sKey
     * @example
     */
    retJson.getParam = function(sKey){
        return query_json[sKey];
    };
    /**
     * Describe 设置query值(批量)
     * @method setParams
     * @param {Json} oJson
     * @example
     */
    retJson.setParams = function(oJson){
        for (var key in oJson) {
            retJson.setParam(key, oJson[key]);
        }
        return this;
    };
    /**
     * Describe 设置hash值
     * @method setHash
     * @param {String} sKey
     * @param {String} sValue
     * @example
     */
    retJson.setHash = function(sKey, sValue){
        hash_json[sKey] = sValue;
        return this;
    };
    /**
     * Describe 设置hash值
     * @method getHash
     * @param {String} sKey
     * @example
     */
    retJson.getHash = function(sKey){
        return hash_json[sKey];
    };
    /**
     * Describe 取得URL字符串
     * @method toString
     * @example
     */
    retJson.valueOf = retJson.toString = function(){
        var url = [];
        var query = core_jsonToQuery(query_json, opts.isEncodeQuery);
        var hash = core_jsonToQuery(hash_json, opts.isEncodeQuery);
        if (url_json.scheme != '') {
            url.push(url_json.scheme + ':');
            url.push(url_json.slash);
        }
        if (url_json.host != '') {
            url.push(url_json.host);
            if(url_json.port != ''){
                url.push(':');
                url.push(url_json.port);
            }
        }
        // url.push('/');
        url.push(url_json.path);
        if (query != '') {
            url.push('?' + query);
        }
        if (hash != '') {
            url.push('#' + hash);
        }
        return url.join('');
    };
    
    return retJson;
};


/**
 * 资源变量
 */
var resource_jsPath;
var resource_cssPath;
var resource_ajaxPath;
var resource_basePath;
var resource_define_apiRule;

//资源列表{url->[[access_cb, fail_cb],....]}
var resource_queue_list = {};

//加载完成的资源列表
var resource_cache_list = {};

function resource_fixUrl(url, type) {
    // var path = (type === 'css' ? resource_cssPath : resource_jsPath);

    switch(type) {
        case 'js':
            path = resource_jsPath;
            break;
        case 'css':
            path = resource_cssPath;
            break;
        case 'ajax':
            path = resource_ajaxPath;
    }
    
    var hrefJson = core_parseURL(location.href);
    var hrefPath = location.origin + hrefJson.path;

    //匹配参数{id} -> ?id=2
    // var urlMatch = url.match(/\{(.*?)\}/g);
    if (type === 'ajax') {
        var urlParams = {};
        var hrefParams = core_queryToJson(hrefJson.query);
        url = url.replace(/\{(.*?)\}/g, function(_, name) {
            if (hrefParams[name]) {
                urlParams[name] = hrefParams[name];
            }        
            return '';
        });
        url = core_URL(url).setParams(urlParams).toString();
    }
    return resource_fixUrl_handle(path, url, resource_basePath, hrefPath);
}

function resource_fixUrl_handle(path, url, basePath, hrefPath) {
    var path = path || basePath || hrefPath;

    return resource_fixUrl_toAbsURL(hrefPath, path + url);
}

function resource_fixUrl_toAbsURL(hrefPath, path) {
    // var href = location.href;
    var baseUrl = hrefPath.slice(0, hrefPath.lastIndexOf('/') + 1);
    // console.log('hrefPath: ', hrefPath);
    // console.log('path: ', path);
    // console.log('baseUrl: ', baseUrl);
    if (/https?:\/\/\w+/.test(path)) {
        return path;
    }
    if (path === 'http://') {
        return 'http:';
    }
    if (path === 'http:') {
        return location.href;
    }
    if(path === 'http:/' || path === '/'){
        return location.origin + '/';
    }

    if (path === '.') {
        return baseUrl;
    }
    if (path.indexOf('./') === 0) {
        path = path.replace(/^\.\//, '');
        return baseUrl + path;
    }

    if (path === '..') {
        // return 
        path = path.replace(/\.\./, '');
        baseUrl = resource_fixUrl_handleTwoDots(baseUrl);
        return baseUrl + path;
    }

    if (/\/[^\/]+/.test(path)) {
        return location.origin + path;
    }

    while (path.indexOf('../') === 0) {
        path = path.replace(/^\.\.\//, '');
        baseUrl = resource_fixUrl_handleTwoDots(baseUrl);
    }

    return baseUrl + path;
}

function resource_fixUrl_handleTwoDots(_baseUrl) {
    var list = [];
    _baseUrl = _baseUrl.slice(0, _baseUrl.length -1);
    list = _baseUrl.split('/');
    list.pop();
    return list.join('/') + '/';
}

/*function a = function(_baseUrl, _path) {
    if (_path.indexOf('../') = 0) {
        _path = _path.replace(/^\.\.\//, '');
        _baseUrl = resource_fixUrl_handleTwoDots(_baseUrl);
        a(_path)
    }
    return _baseUrl + _path;
}*/
/*function resource_fixUrl_toAbsURL(url){
    var directlink = resource_fixUrl_directlink(url);

    if (url === '') {
        var div = core_dom_createElement('div');
        div.innerHTML = '<a href="' + url.replace(/"/g, '%22') + '"/>';
        return div.firstChild.href;
    } 

    return directlink;
};

function resource_fixUrl_directlink(url) {
    var a = resource_fixUrl_a || core_dom_createElement('a');
    a.href = url;
    return a.href;
}*/
/** 
 * 资源队列管理
 * @params
 * url 请求资源地址
 * succ 
 * err
 * access 是否成功
 * data 资源数据
 */

function resource_queue_create(url){
    resource_queue_list[url] = [];
}

function resource_queue_push(url, succ, err){
    resource_queue_list[url].push([succ, err]);
}

function resource_queue_run(url, access, data){
    access = access ? 0 : 1;
    for(var i = 0, len = resource_queue_list[url].length; i < len; i++) {
        resource_queue_list[url][i][access](data, url);
    }
}

function resource_queue_del(url) {
    url in resource_queue_list && (delete resource_queue_list[url]);
}


/*
 * 缓存管理
 * @params
 * obj
 * {
 *   data: data,// 资源数据
 *   expire: null //过期时间
 * }
 */

function resource_cache_create(url) {
    resource_cache_list[url] = [];
}

function resource_cache_set(url, obj) {
    resource_cache_list[url].data = obj.data;
    resource_cache_list[url].expire = obj.expire;
}

function resource_cache_get(url) {
    return resource_cache_list[url];
}

function resource_cache_del(url) {
    if (url in resource_cache_list[url]) {
        delete resource_cache_list[url];
    }
}

/*
 * 创建节点
 * @method core_dom_createElement
 * @private
 * @param {string} tagName
 */
function core_dom_createElement( tagName ) {
    return document.createElement( tagName );
}

var core_uniqueKey_index = 1;
var core_uniqueKey_prefix = 'SL_' + now();

/*
 * 唯一字符串
 * @method core_uniqueKey
 * @private
 * @return {string}
 */
function core_uniqueKey() {
    return core_uniqueKey_prefix + core_uniqueKey_index++;
}

/*
 * 返回指定ID或者DOM的节点句柄
 * @method core_dom_removeNode
 * @private
 * @param {Element} node 节点对象
 * @example
 * core_dom_removeNode( node );
 */
function core_dom_removeNode( node ) {
    node && node.parentNode.removeChild( node );
}



function loader_js(url, callback){
    var entityList = {};
    var opts = {
        'charset': 'UTF-8',
        'timeout': 30 * 1000,
        'args': {},
        'isEncode' : false
    };
    
    var js, requestTimeout;
    
    if (url == '') {
        throw 'scriptLoader: url is null';
    }
    url = /(\.js)$/.test(url) ? url : (url + '.js');
    
    var uniqueID = core_uniqueKey();
    
    
    js = entityList[uniqueID];
    if (js != null && !IE) {
        core_dom_removeNode(js);
        js = null;
    }
    if (js == null) {
        js = entityList[uniqueID] = core_dom_createElement('script');
    }
    
    js.charset = opts.charset;
    js.id = 'scriptRequest_script_' + uniqueID;
    js.type = 'text/javascript';
    if (callback != null) {
        if (IE) {
            js['onreadystatechange'] = function(){
                if (js.readyState.toLowerCase() == 'loaded' || js.readyState.toLowerCase() == 'complete') {
                    try{
                        clearTimeout(requestTimeout);
                        getElementsByTagName("head")[0].removeChild(js);
                        js['onreadystatechange'] = null;
                    }catch(exp){
                        
                    }
                    callback(true);
                }
            };
        }
        else {
            js['onload'] = function(){
                try{
                    clearTimeout(requestTimeout);
                    core_dom_removeNode(js);
                }catch(exp){}
                callback(true);
            };
            
        }
        
    }
    
    js.src = core_URL(url,{
        'isEncodeQuery' : opts['isEncode']
    }).setParams(opts.args).toString();
    
    getElementsByTagName("head")[0].appendChild(js);
    
    if (opts.timeout > 0) {
        requestTimeout = setTimeout(function(){
            try{
                getElementsByTagName("head")[0].removeChild(js);
            }catch(exp){
                
            }
            callback(false);
        }, opts.timeout);
    }
    return js;
}



/*
 * 给节点设置属性
 * @method core_dom_setAttribute
 * @private
 * @param {string} name
 * @param {string} value
 */
function core_dom_setAttribute( el, name, value ) {
    return el.setAttribute( name, value );
}



var core_hideDiv_hideDiv;
/*
 * 向隐藏容器添加节点
 * @method core_hideDiv_appendChild
 * @private
 * @param {Element} el 节点
 */
function core_hideDiv_appendChild( el ) {
    if ( !core_hideDiv_hideDiv ) {
        ( core_hideDiv_hideDiv = core_dom_createElement( 'div' ) ).style.cssText = 'position:absolute;top:-9999px;';
        head.appendChild( core_hideDiv_hideDiv );
    }
    core_hideDiv_hideDiv.appendChild( el );
}

/*
 * 向隐藏容器添加节点
 * @method core_hideDiv_removeChild
 * @private
 * @param {Element} el 节点
 */
function core_hideDiv_removeChild( el ) {
    core_hideDiv_hideDiv && core_hideDiv_hideDiv.removeChild( el );
}



function loader_css( url, callback, load_ID ){
    var link = core_dom_createElement('link');
    var load_div = null;
    var domID = core_uniqueKey();
    var timer = null;
    var _rTime = 3000;
    var url = /(\.css)$/.test(url) ? url : (url + '.css');

    core_dom_setAttribute(link, 'rel', 'Stylesheet');
    core_dom_setAttribute(link, 'type', 'text/css');
    core_dom_setAttribute(link, 'charset', 'utf-8');
    core_dom_setAttribute(link, 'id', load_ID);
    if(IE){
        (link.Stylesheet || link.sheet).addImport(url);
    }else {
        core_dom_setAttribute(link, 'href', url);
        head.appendChild(link);
    }

    load_div = core_dom_createElement('div');
    core_dom_setAttribute(load_div, 'id', load_ID);
    core_hideDiv_appendChild(load_div);

    timer = function(){
        if(parseInt(window.getComputedStyle ? getComputedStyle(load_div, null)['height'] : load_div.currentStyle && load_div.currentStyle['height']) === 42){
            core_hideDiv_removeChild(load_div);
            callback(true);
            return;
        }
        if(--_rTime > 0){
            setTimeout(timer, 10);
        }else {
            log(url + ' timeout!');
            core_hideDiv_removeChild(load_div);
            callback(false);
        }
    };
    setTimeout(timer, 50);
}

/**
 * make an ajax request
 * @alias loader_ajax
 * @param {Object}  {
        'url': '',
        'charset': 'UTF-8',
        'timeout': 30 * 1000,
        'args': {},
        'onComplete': null,
        'onTimeout': null,
        
        'onFail': null,
        'method': 'get', // post or get
        'asynchronous': true,
        'contentType': 'application/x-www-form-urlencoded',
        'responseType': 'text'// xml or text or json
    };
 * @return {Void} 
 * @example
 * loader_ajax(url, {//'url':'/ajax.php',
    
    'args':{'id':123,'test':'true'},
    });
 */





function loader_ajax(url, onComplete){//(url, callback)
    var opts = {
        'charset': 'UTF-8',
        'timeout': 30 * 1000,
        'args': {},
        'onComplete': onComplete || emptyFunction,
        'onTimeout': emptyFunction,
        'uniqueID': null,
        
        'onFail': emptyFunction,
        'method': 'get', // post or get
        'asynchronous': true,
        'header' : {},
        'isEncode' : false,
        'responseType': 'json'// xml or text or json
    };
    
    if (url == '') {
        throw 'ajax need url in parameters object';
    }
    
    var tm;
    
    var trans = getXHR();
    
    var cback = function(){
        if (trans.readyState == 4) {
            clearTimeout(tm);
            var data = '';
            if (opts['responseType'] === 'xml') {
                    data = trans.responseXML;
            }else if(opts['responseType'] === 'text'){
                    data = trans.responseText;
            }else {
                try{
                    if(trans.responseText && typeof trans.responseText === 'string'){
                        
                        // data = $.core.json.strToJson(trans.responseText);
                        data = window['eval']('(' + trans.responseText + ')');
                    }else{
                        data = {};
                    }
                }catch(exp){
                    data = url + 'return error : data error';
                    // throw opts['url'] + 'return error : syntax error';
                }
            }
            if (trans.status == 200) {
                if (opts.onComplete != null) {
                    opts.onComplete(data);
                }
            }else if(trans.status == 0){
                //for abort;
            } else {
                if (opts.onFail != null) {
                    opts.onFail(data, trans);
                }
            }
        }
        /*else {
            if (opts['onTraning'] != null) {
                opts['onTraning'](trans);
            }
        }*/
    };
    trans.onreadystatechange = cback;
    
    if(!opts['header']['Content-Type']){
        opts['header']['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    if(!opts['header']['X-Requested-With']){
        opts['header']['X-Requested-With'] = 'XMLHttpRequest';
    }
    
    if (opts['method'].toLocaleLowerCase() == 'get') {
        var url = core_URL(url, {
            'isEncodeQuery' : opts['isEncode']
        });
        url.setParams(opts['args']);
        url.setParam('__rnd', new Date().valueOf());
        trans.open(opts['method'], url.toString(), opts['asynchronous']);
        try{
            for(var k in opts['header']){
                trans.setRequestHeader(k, opts['header'][k]);
            }
        }catch(exp){
        
        }
        trans.send('');
        
    }
    else {
        trans.open(opts['method'], url, opts['asynchronous']);
        try{
            for(var k in opts['header']){
                trans.setRequestHeader(k, opts['header'][k]);
            }
        }catch(exp){
        
        }
        trans.send(core_jsonToQuery(opts['args'],opts['isEncode']));
    }
    if(opts['timeout']){
        tm = setTimeout(function(){
            try{
                trans.abort();
                opts['onTimeout']({}, trans);
                callback(false, {}, trans);
            }catch(exp){
                
            }
        }, opts['timeout']);
    }

    function getXHR(){
        var _XHR = false;
        try {
            _XHR = new XMLHttpRequest();
        } 
        catch (try_MS) {
            try {
                _XHR = new ActiveXObject("Msxml2.XMLHTTP");
            } 
            catch (other_MS) {
                try {
                    _XHR = new ActiveXObject("Microsoft.XMLHTTP");
                } 
                catch (failed) {
                    _XHR = false;
                }
            }
        }
        return _XHR;
    }
    return trans;
}

function resource_request(url, callback) {
    var apiRule = resource_define_apiRule || onComplete;

    function onComplete(req, params) {
        try {
            if (req.code == '100000') {
                callback(true, req);
            }else {
                log(url + ': The api error code is ' + req.code + '. The error reason is ' + req.msg)
                callback(false, req, params);
            }
        } catch(e) {

        }
    }
    return loader_ajax(url, apiRule);
}

var resource_res = {
    js: function(name, succ, err) {
        resource_res_handle(resource_fixUrl(name, 'js'), succ, err, loader_js);
    },

    css: function(name, succ, err, cssId) {
        resource_res_handle(resource_fixUrl(name, 'css'), succ, err, loader_css, cssId);
    },

    get: function(name, succ, err) {
        resource_res_handle(resource_fixUrl(name, 'ajax'), succ, err, resource_request);//loader_ajax);
    }
};

function resource_res_handle(url, succ, err, loader, cssId) {
    //check 缓存
    var cache = resource_cache_get(url);
    if(cache){
        succ(cache.data);
        return;
    }

    //check 队列    
    if(resource_queue_list[url]){
        resource_queue_push(url, succ, err);
    }else {
        resource_queue_create(url);
        resource_queue_push(url, succ, err);
        //loader
        loader(url, function(access, data) {
            // resource_cache_create(url);
            // resource_cache_set(url, {
            //     data: data,
            //     expire: null
            // });
            resource_queue_run(url, access, data);
            resource_queue_del(url);
        }, cssId);
    }
}

//外部异步调用require方法
function require_global(deps, cb, errcb){
    var ns;
    deps = [].concat(deps);
    function call_cb(ns){
        var runner_result = require_runner(ns);
        cb && cb.apply(this, runner_result);
    }
    for(var i = 0, len = deps.length; i < len; i++){
        ns = deps[i];
        if(!require_ismodule_defined(ns)){
            resource_res.js(ns, function(){
                call_cb(ns);
            }, errcb);
        }else {
            call_cb(ns);
        }
    }
}

//内部同步调用require方法
function require_runner_makeRequire(ns) {
    var basePath = require_nameToPath(ns);
    return require;

    function require(ns){
        if (toString.call(ns).toLowerCase().indexOf('array') != -1) {
            return require_global.apply(this, arguments);
        }
        ns = require_idFix(ns, basePath);

        if (!require_ismodule_defined(ns)) {
            throw '[' + ns + '] 依赖未定义!';
        }
        return require_runList[ns];
    }
}

//运行define列表，并返回实例集
function require_runner(pkg, basePath) {
    // log('%cpkg_runner', 'color:green;font-size:20px;');
    pkg = [].concat(pkg);
    var i, len;
    var ns, nsConstructor, module;
    var resultList = [];

    for (i = 0, len = pkg.length; i < len; i++) {
        ns = pkg[i];
        ns = require_idFix(ns, basePath);
        nsConstructor = require_defineConstrutors[ns];
        if(!nsConstructor){
            resultList.push(undefined);
        }else {
            if (!require_ismodule_runed(ns)) {
                if(require_defineDeps[ns]){
                    require_runner(require_defineDeps[ns], require_nameToPath(ns));
                }
                module = {
                    exports: {}
                };
                require_runList[ns] = nsConstructor.apply(window, [require_runner_makeRequire(ns), module.exports, module]) || module.exports;
            }
            resultList.push(require_runList[ns]);
        }
    }
    return resultList;
}

//全局define
function require_define(ns, deps, construtor) {
    if(require_ismodule_defined[ns]){
        return;
    }
    require_defineDeps[ns] = construtor ? deps : [];
    require_defineConstrutors[ns] = construtor || deps;
    /*//模块自执行
    if(require_dataMainId === ns){
        setTimeout(function(){
            require_runner([ns]);
        });
    }*/
    if((deps = require_defineDeps[ns]) && deps.length){
        setTimeout(function(){
            var loadList = [];
            for(var i = 0, l = deps.length; i < l; i++){
                var depNs = require_idFix(deps[i], require_nameToPath(ns));
                if(!require_ismodule_defined(depNs)){
                    loadList.push(depNs);
                }
            }
            if(loadList.length){
                require_global_loadingNum++;
                require_global(loadList, function(){
                    log(ns + ' deps loaded ok!', '');
                    setTimeout(function(){
                        require_global_loadingNum--;
                        require_main();
                    });
                },function(){
                    log(ns + ' deps loaded error!', '');
                });
            }else {
                require_main();
            }
        });
    }else {
        require_main();
    }
    function require_main(){
        clearTimeout(require_mainTimer);
        if(require_global_loadingNum < 1){
            // if(require_dataMainId === ns){
                require_mainTimer = setTimeout(function(){
                    if(require_dataMainId && require_ismodule_defined(require_dataMainId)){
                       require_runner([ns]); 
                    }
                    
                }, 10);
            // }
        }
    }
}




//定义boot
function require_boot(ns) {
    require_runner([ns]);
}


//调用入口的获取
function require_dataMain(){
    var scripts = getElementsByTagName('script');
    var lastScripts = scripts[scripts.length -1];
    require_dataMainId = lastScripts && lastScripts.getAttribute('data-main') || require_dataMainId;
}
    


//暂不做
    



function resource_config(config) {
    resource_jsPath = config.jsPath;
    resource_cssPath = config.cssPath;
    resource_ajaxPath = config.ajaxPath;
    resource_basePath = config.basePath;
    resource_define_apiRule = config.defApiRule;
}

config_push(resource_config);

    /**
 * 公共对象方法定义文件
 */


//control容器
var render_controlCache = {};
//css容器
var render_cssCache = {};
//渲染列表
var render_childWaitingCache = {};
//资源容器
var render_resContainer = {};
var render_rootScope = {};

var render_base_moduleAttrName = 's-module';
var render_base_moduleAttrValue = 'ismodule';

//id生成器
function render_idMaker(){
    return core_uniqueKey();
}


/**
 * 日志
 */


function core_log() {
    var console = window.console;
    if (!isDebug || !console) {
        return;
    }
    var evalString = [];
    for (var i = 0, l = arguments.length; i < l; ++i) {
        evalString.push('arguments[' + i + ']');
    }
    new Function('console.log(' + evalString.join(',') + ')').apply(this, arguments);
}


function render_error() {
    core_log(arguments);
}
/**
 * 控制逻辑
 */





/*
 * 返回在数组中的索引
 * @method core_array_indexOf
 * @private
 * @param {Array} oElement 
 * @param {Any} oElement 
 *  需要查找的对象
 * @return {Number} 
 *  在数组中的索引,-1为未找到
 */
function core_array_indexOf( oElement, aSource ) {
    if ( aSource.indexOf ) {
        return aSource.indexOf( oElement );
    }
    for ( var i = 0, len = aSource.length; i < len; ++i ) {
        if ( aSource[ i ] === oElement ) {
            return i;
        }
    }
    return -1;
}


function core_array_inArray(oElement, aSource){
    return core_array_indexOf(oElement, aSource) > -1;
}

//解析jade fun
function render_parse(jadeFunStr){
    var g;
    var result = [];
    var ret = [];
    var reg = /<[a-z]+([^>]*?s-(child)[^>]*?)>/g;//|tpl|data|css|logic
    // var reg_child = /(s-child=[^ ]*)/g;
    
    while (g = reg.exec(jadeFunStr)){
        var ele = g[1].replace(/\\\"/g, '"');
        var oEle = ele.replace(/\"/g, '').replace(/ /g, '&');
        var eleObj = core_queryToJson(oEle);
        // var idKey = ele.match(reg_child).join();
        var id = render_idMaker();
        
        eleObj['s-id'] = id;
        eleObj['s-all'] = ele;
        result.push(eleObj);
    }
    // console.log(result);
    return result;
}

//render_addHTML
function render_addHTML(node, html){
    if(IE && IE < 10){
        // node.insertAdjacentHTML('BeforeEnd', html);
        node.innerHTML = html;
    }else {
        var oRange, oFrage;
        oRange = node.ownerDocument.createRange();//node.ownerDocument.createRange();
        oRange.selectNodeContents(node);
        oFrage = oRange.createContextualFragment(html);
        node.appendChild(oFrage);
    }
}





/*
 * 删除数组里的某些元素
 * @method core_array_delete
 * @private
 * @param {Array} oElement 
 * @param {Any} oElement 
 *  需要查找的对象
 * @return {Array} 
 *  清理后的数组
 */
 /**
 * 判断对象是否为数组
 * @param {Array} o
 * @return {Boolean}
 * @example
 * var li1 = [1,2,3]
 * var bl2 = core_array_isArray(li1);
 * bl2 === TRUE
 */


var core_array_isArray = Array.isArray ? function(arr) {
    return Array.isArray(arr);
} : function(arr){
    return 'array' === core_object_typeof(arr);
};
 /**
 * 删除数组中的空数据(like undefined/null/empty string)
 * @alias
 * @param {Array} o
 * @return {Array}
 * @example
 * var li = core_array_clear([1,2,3,undefined]);
 * li === [1,2,3];
 */

/**
 * 查找指定元素在数组内的索引
 * @param {Array} o
 * @param {String|Number|Object|Boolean|Function} value
 * @return {Array}
    索引值的数组
 * @example
 * var li1 = ['a','b','c','a']
 * var li2 = core_array_findout(li1,'a');
 */


function core_array_findout(o, value){
    if (!core_array_isArray(o)) {
        throw 'the findout function needs an array as first parameter';
    }
    var k = [];
    for (var i = 0, len = o.length; i < len; i += 1) {
        if (o[i] === value) {
            k.push(i);
        }
    }
    return k;
};

function core_array_clear(o){
    if (core_array_isArray(o)) {
        throw 'the clear function needs an array as first parameter';
    }
    var result = [];
    for (var i = 0, len = o.length; i < len; i += 1) {
        if (!(core_array_findout([undefined,null,''],o[i]).length)) {
            result.push(o[i]);
        }
    }
    return result;
};
function core_array_delete( oElement, aSource ) {
    if( !core_array_isArray ){
        throw 'the delete function needs an array as second parameter'
    }
    for( var i = 0, len = aSource.length; i < len; i++ ){
        if( oElement === aSource[i] ){
            delete aSource[i]
        }
    }
    return core_array_clear(aSource);
}

//http://www.sharejs.com/codes/javascript/1985
function core_object_equals(x, y){
    // If both x and y are null or undefined and exactly the same
    if ( x === y ) {
        return true;
    }

    // If they are not strictly equal, they both need to be Objects
    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) {
        return false;
    }

    // They must have the exact same prototype chain, the closest we can do is
    // test the constructor.
    if ( x.constructor !== y.constructor ) {
        return false;
    }

    for ( var p in x ) {
        // Inherited properties were tested using x.constructor === y.constructor
        if ( x.hasOwnProperty( p ) ) {
            // Allows comparing x[ p ] and y[ p ] when set to undefined
            if ( ! y.hasOwnProperty( p ) ) {
                return false;
            }

            // If they have the same strict value or identity then they are equal
            if ( x[ p ] === y[ p ] ) {
                continue;
            }

            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( x[ p ] ) !== "object" ) {
                return false;
            }

            // Objects and Arrays must be tested recursively
            if ( ! core_object_equals( x[ p ],  y[ p ] ) ) {
                return false;
            }
        }
    }

    for ( p in y ) {
        // allows x[ p ] to be set to undefined
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) {
            return false;
        }
    }
    return true;
};

/*
 * 给节点设置属性
 * @method core_dom_getAttribute
 * @private
 * @param {string} name

 */
function core_dom_getAttribute( el, name ) {
    return el.getAttribute( name );
}

/*
 * 对象克隆
 * @method core_object_clone
 */
function core_object_clone( obj ) {
    
    var ret = obj;
    
    if ( core_object_typeof( obj ) === 'array' ) {
        ret = [];
        var i = obj.length;
        while ( i-- ) {
            ret[ i ] = core_object_clone( obj[ i ] );
        }
    } else if ( core_object_typeof( obj ) === 'object' ) {
        ret = {};
        for ( var k in obj ) {
            ret[ k ] = core_object_clone( obj[ k ] );
        }
    }
    
    return ret;
    
}


/**
 * @param {Object} o
 * @param {boolean} isprototype 继承的属性是否也在检查之列
 * @example
 * core_obj_isEmpty({}) === true;
 * core_obj_isEmpty({'test':'test'}) === false;
 */
function core_obj_isEmpty(o,isprototype){
    for(var k in o){
        if(isprototype || o.hasOwnProperty(k)){
            return false;
        }
    }
    return true;
}

var render_control_cssPrefix = 'S_CSS_';
//control生成器
function render_control(boxId) {
    
    var tplParseResult = [];
    var childWaitingCache = render_childWaitingCache[boxId] = [];
    //资源容器
    var resContainer = render_resContainer[boxId];
    if (resContainer) {
        resContainer.useTime++;
    } else {
        resContainer = render_resContainer[boxId] = {
            childrenid: {},
            useTime: 1
        };
    }

    var useTime = resContainer.useTime;
    var parentId = resContainer.parentId;
    var box = getElementById(boxId);
    var toDoSetsTimer = null;


    //回调方法变量
    var tplCallbackFn;
    var dataCallbackFn;
    var logicCallbackFn;
    var cssCallbackFn;

    //状态类型 newset|loading|ready
    //
    //tpl,css,data,logic,children,render,
    //tplReady,cssReady,dataReady,logicReady,rendered,logicRunned
 
    var children_noController = {};
    // resContainer.changeResList = {};
    var changeResList = {};
    var toDestroyChildrenid;
    var needToTriggerChildren;

    var forceRender;

    var control = {
        id : boxId,
        setForceRender: function(_forceRender) {
            forceRender = _forceRender;
        },
        get: function(url, type) {
            var result = '';
            /*if(type === 'tpl'){

            }*/
            return result;
        },
        set: function(type, value) {
            if (!boxId) {
                return;
            }
            if(core_object_typeof(type) === 'object') {
                for(var key in type) {
                    control.set(key, type[key]);
                }
                return;
            }

            if(!checkResChanged(type, value)){
                return;
            }
            resContainer[type] = value;
            changeResList[type] = true;
 
            toDoSets();
        },
        _refresh: function() {
            needToTriggerChildren = true;
            changeResList['data'] = true;
            toDoSets();
        },
        _destroy: function() {
            boxId = control._controller = tplParseResult = childWaitingCache = resContainer = parentId = box = toDoSetsTimer = tplCallbackFn = dataCallbackFn = logicCallbackFn = cssCallbackFn = undefined;
        }
    };

    init();

    return control;

    function init() {
        needToTriggerChildren = true;
        //状态
        resContainer.cssReady = true;
        resContainer.dataReady = true;
        resContainer.tplReady = true;
        resContainer.logicReady = true;
        resContainer.rendered = true;
        resContainer.logicRunned = false;
        
        
        //第一层不能使用s-child与s-controller，只能通过render_run执行controller
        //暂且这么解析吧
        var type, attrValue;
        var types = ['css', 'tpl', 'data', 'logic'];
        var realTypeMap = {
            tpl: 'tplFn',
            data: 'real_data',
            logic: 'logicFn'
        };
        for (var i = 0, l = types.length; i < l; ++i) {
            type = types[i];
            if (box) {
                attrValue = core_dom_getAttribute(box, 's-' + type);
                if (attrValue) {
                    if (checkResChanged(type, attrValue)) {
                        changeResList[type] = true;
                        resContainer[type] = attrValue;
                    }
                } else {
                    if (type in resContainer) {
                        delete resContainer[type];
                    }
                    if (realTypeMap[type] && realTypeMap[type] in resContainer) {
                        delete resContainer[realTypeMap[type]];
                    }
                }
            } else if (resContainer.fromParent) {
                if (resContainer[type]) {
                    changeResList[type] = true;
                }
            }          
        }

        toDoSets();
    }

    function toDoSets() {

        clearTimeout(toDoSetsTimer);
        toDoSetsTimer = setTimeout(function() {
            
            var tplChanged = changeResList['tpl'];
            var dataChanged = changeResList['data'];
            var cssChanged = changeResList['css'];
            var logicChanged = changeResList['logic'];
            var childrenChanged = changeResList['children'];
            changeResList = {};

            if (tplChanged || dataChanged) {
                resContainer.rendered = false;
                resContainer.html = '';
                toDestroyChildrenid = core_object_clone(resContainer.childrenid);
            } else {
                toTiggerChildren();
            }

            tplChanged && setTpl();
            dataChanged && setData();
            cssChanged && setCss();
            logicChanged && setLogic();
            childrenChanged && setChildren();
        });

    }

     //检查资源是否改变
    function checkResChanged(type, value) {

        var valueType = core_object_typeof(value);

        if (type === 'data') {
            return true;
        }

        if (valueType === 'function') {
            return !resContainer[type + 'Fn'] || resContainer[type + 'Fn'].toString() !== value.toString();
        }

        if (type === 'tpl' || type === 'logic') {
            return !(resContainer[type + 'Fn'] && resContainer[type + 'Fn'] === require_runner(value)[0]);
        }

        if (type === 'children') {
            return !core_object_equals(resContainer[type], value);
        }

        return resContainer[type] !== value;

    }

    function setData() {
        resContainer.dataReady = false;
        dataCallbackFn = undefined;
        // var last_real_data = resContainer.real_data;
        // resContainer.real_data = undefined;
        var data = resContainer.data;
        if (data === null || data === 'null') {
            toRender({});
            return;
        }
        if (!data) {
            return;
        }
        var dataType = core_object_typeof(data);
        
        if (dataType === 'object') {
            toRender(data);
        } else if (dataType === 'string') {
            var cb = dataCallbackFn = function(ret) {
                if (cb === dataCallbackFn) {
                    // toRender(ret.data);//||
                    toRender(ret.data);
                }
            };
            resource_res.get(data, cb, render_error);
        }
        function toRender(data) {
            resContainer.dataReady = true;
            if (forceRender || !core_object_equals(data, resContainer.real_data)) {
                resContainer.real_data = data;
                render();
            } else {
                toTiggerChildren();
            }
        }
    }

    function setCss() {
        resContainer.cssReady = false; 
        cssCallbackFn = undefined;
        var css = resContainer.css;
        var cb = cssCallbackFn = function(){
            if(cb === cssCallbackFn) {
                resContainer.cssReady = true;
                render();
                //抛出css加载完成事件
            }
        }
        if (css) {
            var linkId = render_control_cssPrefix + resContainer.css.replace(/\//g, '_');
            if (!render_cssCache[linkId]) {
                render_cssCache[linkId] = {};
                render_cssCache[linkId][boxId] = 1;
                resource_res.css(css, cb, render_error, linkId); 
            } else {
                resContainer.cssReady = true;
            }
        }
    }

    function setTpl() {
        resContainer.tplReady = false;
        tplCallbackFn = undefined;
        resContainer.tplFn = null;
        var tpl = resContainer.tpl;
        if(tpl){
            if(core_object_typeof(tpl) === 'function'){
                resContainer.tplFn = tpl;
                toRender();
                return;
            }
            var cb = tplCallbackFn = function(jadefn){
                if(cb === tplCallbackFn){
                    resContainer.tplFn = jadefn;
                    toRender();
                }
            }
            require_global(tpl, cb, render_error);
        }

        function toRender() {
            resContainer.tplReady = true;
            render();
        }
    }

    function setLogic() {
        resContainer.logicReady = false;
        var logicCallbackFn = undefined;
        resContainer.logicFn = null;
        var logic = resContainer.logic;
        resContainer.logicRunned = false;
        if(logic){
            if(core_object_typeof(logic) === 'function'){
                resContainer.logicFn = logic;
                toStartLogic();
            } else {
                var cb = logicCallbackFn = function(fn) {
                    if(cb === logicCallbackFn){
                        fn && (resContainer.logicFn = fn);
                        toStartLogic();
                    }
                    //抛出js加载完成事件
                }
                require_global(logic, cb, render_error);
            }
        }
        function toStartLogic() {
            resContainer.logicReady = true;
            startLogic();
        }
    }

    function setChildren() {
        var children = resContainer.children || {};
        for (var key in children) {
            //如果存在，相应的key则运行
            if (children_noController[key]) {
                render_run(children_noController[key], children[key]);
            }
        }
    }

    function startLogic() {
        if (!resContainer.logicRunned && resContainer.logicFn && resContainer.logicReady && resContainer.rendered) {
            resContainer.logicResult = resContainer.logicFn(box) || {};
            resContainer.logicRunned = true;
        }
    }

    function destroyLogic() {
        resContainer.logicRunned = false;
        if (resContainer.logicResult) {
          resContainer.logicResult.destroy && resContainer.logicResult.destroy();
          delete resContainer.logicResult;
        }
    }

    function destroyCss() {
        var k, key;
        for (k in render_cssCache) {
            for (key in render_cssCache[k]) {
                if (!(key in render_resContainer)) {
                    delete render_cssCache[k][key];
                }
            }
            if (core_obj_isEmpty(render_cssCache[k])) {
                cssDom = getElementById(render_cssCache[k]);
                cssDom && core_dom_removeNode(cssDom);
                delete render_cssCache[k];
            }
        }
    }

    function handleChild() {
        var s_controller, s_child, s_id;
        var parseResultEle;

        var childResContainer;

        for (var i = 0, len = tplParseResult.length; i < len; i++) {
            parseResultEle = tplParseResult[i];
            s_id = parseResultEle['s-id'];
            childResContainer = render_resContainer[s_id] = render_resContainer[s_id] || {
                childrenid: {},
                fromParent: true
            };
            resContainer.childrenid[s_id] = true;
            childResContainer.parentId = boxId;

            childResContainer.tpl = parseResultEle['s-tpl'];
            childResContainer.css = parseResultEle['s-css'];
            childResContainer.data = parseResultEle['s-data'];
            childResContainer.logic = parseResultEle['s-logic'];

            if(s_child = parseResultEle['s-child']) {
                s_child = (s_child === 's-child' ? '' : s_child);
                if(s_child) {
                    s_controller = resContainer.children && resContainer.children[s_child];
                    if (!s_controller) {
                        children_noController[s_child] = s_id;
                    }
                } else {
                    s_controller = parseResultEle['s-controller']
                }
                render_run(s_id, s_controller);//渲染提前
            }
        }
    }

    function render() {
        if(!resContainer.cssReady || !resContainer.dataReady || !resContainer.tplReady || resContainer.rendered) {
            return;
        }
        var tplFn = resContainer.tplFn;
        var real_data = resContainer.real_data;
        if (!tplFn || !real_data) {
            return;
        }

        var html = resContainer.html;
        if (!html) {
            html = resContainer.html = tplFn(real_data);
            resContainer.childrenid = {};
            //子模块分析
            tplParseResult = render_parse(html);
            handleChild();
        }
        var parseResultEle = null;
        //1. box存在，addHTML，运行logic，运行子队列（子模块addHTML）
        //2. box不存在，则进入队列，待渲染
        box = box || getElementById(boxId);
        if (box) {
            //去掉节点上的资源信息
            for(var i = 0, len = tplParseResult.length; i < len; i++){
                parseResultEle = tplParseResult[i];
                html = html.replace(parseResultEle['s-all'], ' ' + render_base_moduleAttrName + '=' + render_base_moduleAttrValue + ' ' + parseResultEle['s-all'] + ' id=' + parseResultEle['s-id']);
            }
            destroyLogic();
            destroyChildren(toDestroyChildrenid);
            box.innerHTML = html;
            destroyCss();
            resContainer.rendered = true;
            startLogic();
            for(var i = 0, l = childWaitingCache.length; i < l; ++i) {
                childWaitingCache[i]();
            }
            childWaitingCache = render_childWaitingCache[boxId] = [];
        } else {
            if (parentId && render_childWaitingCache[parentId]) {
                render_childWaitingCache[parentId].push(render);
            }
        }
    }

    function toTiggerChildren() {
        if (needToTriggerChildren) {
            for (var id in resContainer.childrenid) {
                var childControl = render_controlCache[id];
                if (childControl) {
                    render_run(id, childControl._controller);
                }
            }
        }
        needToTriggerChildren = false;
    }

    function destroyChildren(childrenid) {
        childrenid = childrenid || {};
        for (var id in childrenid) {
            var childResContainer = render_resContainer[id];
            var childControl = render_controlCache[id];
            if (childControl) {
                childControl._destroy();
                delete render_controlCache[id];
            }
            
            if (childResContainer) {
                destroyChildren(childResContainer.childrenid);
                if (childResContainer.logicResult) {
                  childResContainer.logicResult.destroy && childResContainer.logicResult.destroy();
                  delete childResContainer.logicResult;
                }
                delete render_resContainer[id];
            }
        }
        
    }
}
/**
 * querySelectorAll
 * 在非h5下目前只支持标签名和属性选择如div[id=fsd],属性值不支持通配符
 */

var core_dom_querySelectorAll_REG1 = /([^\[]*)(?:\[([^\]=]*)=?['"]?([^\]]*?)['"]?\])?/;

function core_dom_querySelectorAll(dom, select) {
    var result;
    var matchResult;
    var matchTag;
    var matchAttrName;
    var matchAttrValue;
    var elements;
    var elementAttrValue;
    if (dom.querySelectorAll) {
        result = dom.querySelectorAll(select);
    } else {
        if (matchResult = select.match(core_dom_querySelectorAll_REG1)) {
            matchTag = matchResult[1];
            matchAttrName = matchResult[2];
            matchAttrValue = matchResult[3];
            result = getElementsByTagName(matchTag || '*', dom);
            if (matchAttrName) {
                elements = result;
                result = [];
                for (var i = 0, l = elements.length; i < l; ++i) {
                    elementAttrValue = elements[i].getAttribute(matchAttrName);
                    if (elementAttrValue !== null && (!matchAttrValue || elementAttrValue === matchAttrValue)) {
                        result.push(elements[i])
                    }
                }
            }
        }
    }
    return result || [];
}





var render_run_controllerLoadFn = {};

//controller的boot方法
function render_run(box, controller) {
    var boxId, control, controllerLoadFn;
    if (typeof box === 'string') {
        boxId = box;
    } else {
        boxId = box.id;
        if (!boxId) {
            box.id = boxId = render_idMaker();
        }
    }
    if ((box = box || getElementById(boxId)) && box !== document.body) {
        //找到它的父亲
        var parentNode;
        var parentResContainer;
        do {
            parentNode = box.parentNode;
        } while(parentNode && parentNode !== document.body && (!parentNode.id || !(parentResContainer = render_resContainer[parentNode.id])));
        if (parentResContainer) {
            parentResContainer.childrenid[boxId] = true;
        }
    }
    render_run_controllerLoadFn[boxId] = undefined;
    if (controller && typeof controller === 'string') {
        controllerLoadFn = render_run_controllerLoadFn[boxId] = function(controller){
            if (controllerLoadFn === render_run_controllerLoadFn[boxId] && controller) {
                render_run_controllerLoadFn[boxId] = undefined;
                render_run(boxId, controller)
            }
        };
        require_global(controller, controllerLoadFn, render_error);
        return;
    }


    control = render_controlCache[boxId];

    if (control) {
        if (control._controller) {
            control._destroy();
            control = undefined;
        } else if (!controller) {
            control._refresh();
            return;
        }
    }
    render_controlCache[boxId] = control = control || render_control(boxId);

    if (controller) {
        control._controller = controller;
        controller(control, render_rootScope);
    }
}

    var router_base_routerTable = [];
var router_base_mainBox = null;
/**
 * 路由配置
 */



config_push(router_config);

function router_config(config) {
    if (config.router) {
        router_base_routerTable = config.router;
    }
}




function router_match(url) {
    url = url || location.toString();
    var parsedUrl = core_parseURL(url);
    for (var i = 0, len = router_base_routerTable.length; i < len; i++) {
        if(router_base_routerTable[i][0] === parsedUrl.path){
            return router_base_routerTable[i][1];
        }
    }
    return false;
}

/*
 * dom事件绑定
 * @method core_event_addEventListener
 * @private
 * @param {Element} el
 * @param {string} type
 * @param {string} fn
 */
var core_event_addEventListener = isAddEventListener ? 
    function( el, type, fn ) {
        el.addEventListener( type, fn, false );
    }
    :
    function( el, type, fn ) {
        el.attachEvent( 'on' + type, fn );
    };

/*
 * dom ready
 * @method core_dom_ready
 * @private
 * @param {Function} handler
 */
function core_dom_ready( handler ) {
    
    function DOMReady() {
        if ( DOMReady !== emptyFunction ) {
            DOMReady = emptyFunction;
            handler();
        }
    }
    
    if ( /complete/.test( document.readyState ) ) {
        handler();
    } else {
        if ( isAddEventListener ) {
            core_event_addEventListener( document, 'DOMContentLoaded', DOMReady );
        } else {
            core_event_addEventListener( document, 'onreadystatechange', DOMReady );

            //在跨域嵌套iframe时 IE8- 浏览器获取window.frameElement 会出现权限问题
            try {
                var _frameElement = window.frameElement;
            } catch (e) {}

            if ( _frameElement == null && docElem.doScroll ) {
                (function doScrollCheck() {
                    try {
                        docElem.doScroll( 'left' );
                    } catch ( e ) {
                        return setTimeout( doScrollCheck, 25 );
                    }
                    DOMReady();
                })();
            }
        }
        core_event_addEventListener( window, 'load', DOMReady );
    }
    
}


/*
 * preventDefault
 * @method core_event_preventDefault
 * @private
 * @return {Event} e 
 */
function core_event_preventDefault( event ) {
    if ( event.preventDefault ) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
}




var router_listen_queryTime = 3;
var router_listen_count;
var router_listen_lastHref = location.toString();

function router_listen() {
    if (isHTML5) {
        //绑定link
        core_event_addEventListener(document, 'click', function(e) {
            //e.target 是a 有.href　下一步，或者不是a e.target.parentNode 
            //向上查找三层，找到带href属性的节点，如果没有找到放弃，找到后继续
            //router_match 如果有匹配结果，那么要阻止默认行为、当地址变化了的时候假写地址栏history.pushState、render_run(mainBox, match result)
            //                如果没有匹配到结果放弃
            var el = e.target;
            router_listen_count = 1;
            var hrefNode = router_listen_getHrefNode(el);
            var href = hrefNode && hrefNode.href;
            var urlmatch = router_match(href);
            if (!href || urlmatch === false) {
                return;
            }
            core_event_preventDefault(e);
            if (router_listen_lastHref !== href) {
                history.pushState(null, null, href);
            }
            router_listen_lastHref = href;
            // render_run(router_base_mainBox, router_match(href));
            router_listen_handleHrefChenged(href, urlmatch);

        });
        //popstate 事件在第一次被绑定时也会触发，但不是100%，所以加了个延时
        core_dom_ready(function() {
            setTimeout(function() {
                //绑定地址变化 前进后退
                core_event_addEventListener(window, 'popstate', function() {
                    //router_match 如果有结果controller render_run(mainBox, controller);
                    //                如果没有location.reload();
                    var href = location.href;
                    router_listen_lastHref = href;
                    router_listen_handleHrefChenged(href);
                });
            }, 1000);
        });
        
    }
}

function router_listen_getHrefNode(el) {
    if(el && router_listen_count < router_listen_queryTime){
        router_listen_count++;
        if (el.tagName && el.tagName === 'A' && el.href) {
            return el;
        }
        return router_listen_getHrefNode(el.parentNode);
    }    
}

function router_listen_handleHrefChenged(url, urlmatch) {
    var controller = urlmatch || router_match(url);
    if (controller !== false) {
        window.scrollTo(0, 0);
        render_run(mainBox, controller);
    } else {
        location.reload();
    }
}




    //初始化data-main
    require_dataMain();
    steel.d = require_define; 
    steel.res = resource_res;
    steel.run =  render_run;
    steel.boot = function(ns) {
        setTimeout(function() {
            require_boot(ns);
            router_listen();
            if (mainBox) {
                var controller = router_match(location.toString());
                if (controller !== false) {
                    render_run(mainBox, controller);
                }
            }
        });
    };
    window.steel = steel;


}(window);
 

