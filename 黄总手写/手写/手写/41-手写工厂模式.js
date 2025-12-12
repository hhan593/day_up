function createObject(name, age){
    var obj = new Object();
    obj.name = name
    obj.age = age
    obj.sayHello = function(){
        console.log(this.name)
    }
    return obj
}

let s1 = createObject("hhh", "21")
s1.sayHello()


