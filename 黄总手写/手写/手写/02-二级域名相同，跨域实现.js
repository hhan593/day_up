
document.domain = 'test.com'  // 设置domain相同

// 通过iframe嵌入跨域的页面
const iframe = document.createElement('iframe')
iframe.setAttribute('src', 'b.test.com/xxx.html')
iframe.onload = function(){
    // 拿到iframe示例后可以直接访问iframe中的数据
    console.log(iframe.contentWindow.xxx)
}

document.appendChild(iframe)

// a.test.com和b.test.com就是二级域名，都是test.com的子域


