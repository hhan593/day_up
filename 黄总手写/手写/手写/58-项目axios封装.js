var instance = axios.create({
    baseURL: 'https://api.example.com',  // 配置全站的默认请求地址
    withCredentials: true, // 跨域请求时需要凭证
    timeout: 10000, // 设置请求超时时间
    headers: headers, // 自定义请求头配置
});




// 添加请求拦截 接收两个函数参数 第一个参数是发送请求前的处理，第二个参数是对请求错误的处理
instance.interceptors.request.use(function(config) {
    var method = config.method.toLowerCase()
    if (method == 'get') {
        config.params = config.params || {};
        config.params.r = Math.random(); // 所有的get请求都带有随机数，防止请求缓存
    } else if ( method== "post" || method == "put" || method == "patch") {
        config.data = JSON.stringify(config.data); // 对请求的data数据做序列化处理
    }
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});


// 添加响应拦截 接收两个函数参数 第一个是对响应数据的处理 第二个是对响应错误的处理
instance.interceptors.response.use(function(res) {
    var showMessage = res.config.showMessage;
    if (res.data.code && res.data.code != 0) {
        if (showMessage) {
            alertMsg(res.data.msg) // 请求报错 弹出报错
        }
        logTracker.portError(JSON.stringify(res)) // 统计报错，上传到监控系统
    }
    return res.data;
}, function(res) {
    var showMessage;
    if (res.config && res.config.showMessage) {
        showMessage = res.config.showMessage;
    }
    if (showMessage) {
        if (res.response) {
            alertMsg('错误码：' + res.response.status + '\n错误内容：' + res.response.statusText)
        } else {
            alertMsg('系统繁忙，请稍后再试。')
        }
    }
    logTracker.portError(JSON.stringify(res))
    return Promise.reject(res);
});


export default qscAjax;