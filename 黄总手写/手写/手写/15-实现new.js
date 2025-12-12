function myNew(fn, ...args){
    if(typeof fn !== 'function'){
        throw fn+'is not a constructor'
    }

    let obj = {};
    
    obj.__proto__ = fn.prototype;

    let res = fn.apply(obj, args);
    
    return res instanceof Object? res: obj;
}


// 测试
function Person(name, age){
    this.name = name;
    this.age = age;
}


console.log(myNew(Person, "ding", 100))