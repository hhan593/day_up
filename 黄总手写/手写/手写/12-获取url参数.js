// 1. URLSearchParams方法
// 创建一个URLSearchParams实例
// const URLSearchParams1 = new URLSearchParams(window.location.search);

// 把键值对列表转发成一个对象
// const params = Object.fromEntries(URLSearchParams1.entries())


// fromEntries
const entries = new Map([
    ['foo', 'bar'],
    ['baz', 42]
]);

const obj = Object.fromEntries(entries);

console.log(obj);
// Object { foo: "bar", baz: 42 }



//   Object.entries()方法返回一个给定对象自身可枚举属性的键值对数组
const object1 = {
    a: 'somestring',
    b: 42
};
  
for (const [key, value] of Object.entries(object1)) {
    console.log(`${key}: ${value}`);
}
  
  // expected output:
  // "a: somestring"
  // "b: 42"




//   2. split
function getParams(url){
    const res = []
    if(url.includes('?')){
        const str = url.split('?')[1]
        const arr = str.split("&")
        arr.forEach(item => {
            const key = item.split('=')[0]
            const val = item.split('=')[1]
            res[key] = decodeURIComponent(val) // 解码
        })
    }
    return res;
}


// {user: '阿飞', age: '16'}