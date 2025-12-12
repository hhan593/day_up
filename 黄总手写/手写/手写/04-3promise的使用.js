// 封装 ajax 请求：传入回调函数 success 和 fail
function ajax(url, success, fail) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            success(xmlhttp.responseText);
        } else {
            fail(new Error('接口请求失败'));
        }
    };
};




new Promise((resolve, reject) => {
    ajax('a.json', (res) => {
        console.log('a接口返回的内容：' + res);
        resolve();
    });
})
    .then((res) => {
        console.log('a成功');
        new Promise((resolve, reject) => {
            ajax('b.json', (res) => {
                console.log('b接口返回的内容：' + res);
                resolve();
            });
        });
    })
    .then((res) => {
        // 因为上面在b接口的时候，并没有 return，也就是没有返回值。那么，这里的链式操作then，其实是针对一个空的 promise 对象进行then操作
        console.log('b成功');
    });

//   a接口返回的内容
//   a成功
//   b成功
//   b接口返回的内容