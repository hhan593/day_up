const ajax = {
    get(url, fn){
        const xhr = XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                fn(xhr.responseText)
            }
        }
        xhr.send()
    },

    post(url, data, fn){
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url, true)
        // true表示异步，就是Ajax名字中的Asynchronous，即Ajax请求发送后，不管服务端是否响应，客户端程序都会继续执行。

        // 如果为false,客户端程序将阻塞来等待服务端的响应，这可能影响客户的体验。
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                fn(xhr.responseText)
            }
        }
        xhr.send(data)
    }
}