#假数据接口目录
####假数据接口使用说明
    . 假数据相对的目录为 connect任务中定义的属性apiPath值，默认为api目录
    . 接口的文件组织方式与真实接口一致
    . 当接口文件书写错误或者请求与设定method不一致时返回500并提示错误
    . 接口文件的编写规则：
        1. 每个接口都是一个nodejs文件
        2. 文件exports中可以定义两个属性
            [1]. method {string} 可选 默认表示该接口支持GET+POST
            [2]. data {string|object|function} 必选 返回的数据 可以是直接字符串结果、对象数据或者处理本次请求的中间件方法（和使用http模块一样）
        3. 文件名除了必须以js为后缀外，其他部分没有命名要求
        4. 访问时没有去掉js后缀

####实例
	/**
	 * 返回字符串的接口实例
	 */
	module.exports = {
		method: 'GET',
		data: 'OK!'
	};

	/**
	 * 直接JSON数据的使用实例
	 */
	module.exports = {
		method: 'GET',
		data: {
			"code": 10004,
			"data": {
				content: 'Hello'
			}
		} 
	};
	
	/**
	 * 直接JSON数据的使用实例
	 */
	module.exports = {
		method: 'GET',
		data: {
			"code": 10004,
			"data": {
				content: '我是子数据。',
				content2: '我是第三层子数据。'
			}
		} 
	};
	
	/**
	 * 使用中间件的接口实例
	 */
	module.exports = {
	  method: 'GET',
	  data: function(req, res, next) {

		if (req.method.toUpperCase() === "GET") {
		  res.json({
			code: 10000, 
			data: '中间件'
		  }); 
		} else {
		  next(); 
		}
	 
	  }
	};