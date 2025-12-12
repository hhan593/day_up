function ajax() {
  let xhr = new XMLHttpRequest(); // 创建对象
  xhr.open("get", "https://www.baidu.com"); // 参数1：请求方式，参数2：请求地址，参数三：是否异步
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        let string = request.responseText;
        let object = JSON.parse(string);
      } // 状态码
    }
  };
  request.senf();
}

// Promise 改写
function ajax() {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest(); // 创建对象
    xhr.open("get", url); // 参数1：请求方式，参数2：请求地址，参数三：是否异步
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("请求失败, 失败的状态码为" + xhr.status));
        }
      }
    };
    xhr.send();
  });
}
let url = "/data.json";
ajax(url)
  .then((res) => console.log(res))
  .catch((reason) => console.log(reason));
