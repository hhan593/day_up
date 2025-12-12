# ES6

## 1.数组

### 1.1数组实例的 copyWithin()

数组实例的 copyWithin 方法，在当前数组内部，将指定位置的成员复制到其他 位置（会覆盖原有成员），然后返回当前数组。也就是说，使用这个方法，会修改 当前数组。

```javascript
Array.prototype.copyWithin(target, start = 0, end = this.length)
```

##### 三个参数（且必须为数值，如果不是则默认转为数值）

target（必需）：从该位置开始替换数据。

start（可选）：从该位置开始读取数据，默认为0。如果为负值，表示倒数。

end（可选）：到该位置前停止读取数据，默认等于数组长度。如果为负值，表示倒数。

```javascript
[1, 2, 3, 4, 5].copyWithin(0, 3)  // [4, 5, 3, 4, 5]
```

代码表示将从3号位直到数组结束的成员（4和5），复制到从0号位开始的位 置，结果覆盖了原来的1和2。因为end没有传，所以默认到数组尽头

### 1.2数组实例的 find() 和 findIndex()

数组实例的 find 方法，用于找出第一个符合条件的数组成员。它的参数是一个回调函数，所有数组成员依次执行该回调函数，直到找出第一个返回值为 true 的成 员，然后返回该成员。如果没有符合条件的成员，则返回 undefined 。

```javascript
[1, 4, -5, 10].find((n) => n < 0) //-5
```

##### find 方法的回调函数可以接受三个参数，依次为当前的值value、当前的位置index和原数组arr

```javascript
[1, 5, 10, 15].find(function(value, index, arr) {
return value > 9;
})
```

##### 数组实例的 findIndex，返回第一个符合条件 的数组成员的位置，如果所有成员都不符合条件，则返回 -1 。

```javascript
[1, 5, 10, 15].findIndex(function(value, index, arr) {
return value > 9;
}) // 2
```

##### 这两个方法都可以发现 NaN ，弥补了数组的 IndexOf 方法的不足。

```javascript
[NaN].indexOf(NaN)
// -1
[NaN].findIndex(y => Object.is(NaN, y))
```

### 1.3数组实例的fill()

fill 方法使用给定值，填充一个数组fill 方法用于空数组的初始化非常方便。数组中已有的元素，会被全部抹去。

```javascript
['a', 'b', 'c'].fill(7)
```

fill 方法还可以接受第二个和第三个参数，用于指定填充的起始位置和结束位置。

fill(填充内容，开始位置，结束位置)

```javascript
['a', 'b', 'c'].fill(7, 1, 2)
// ['a', 7, 'c']
```

 fill 方法从1号位开始，向原数组填充7，到2号位之前结束

### 1.4数组实例的 entries()，keys() 和 values()

它们都返回一个遍历器对象，可以使用for ...of循环进行遍历唯一的区别是

 **keys() 是对键名的遍 历、** 返回index

```javascript
for (let index of ['a', 'b'].keys()) {
console.log(index);
}
// 0
// 1
```

**values() 是对键值的遍历，**返回item

```JavaScript
for (let elem of ['a', 'b'].values()) {
console.log(elem);
}
// 'a'
// 'b'

```

**entries() 是对键值对的遍历**，返回键值对

```javascript
for (let [index, elem] of ['a', 'b'].entries()) {
console.log(index, elem);
}
// 0 "a"
// 1 "b"

```

### 1.5数组实例的 includes()

**Array.prototype.includes** 方法返回一个布尔值，表示某个数组是否包含给定 的值，

```javascript
[1, 2, 3].includes(2) // true
[1, 2, 3].includes(4) // false
[1, 2, NaN].includes(NaN) // true
```

该方法的第二个参数表示搜索的起始位置，默认为 0 。如果第二个参数为负数， 则表示倒数的位置，如果这时它大于数组长度（如第二个参数为 -4 ，但数组长 度为 3 ），则会重置为从 0 开始。

```javascript
[1,2,3].includes(3,3) //false
[1,2,3].includes(3,-1) //true 实际上等同于[1,2,3].includes(3,2)
```

数组的indexOf方法也可以检查是否包含某个值，他的规则为找到参数值的第一个出现位置，所以要去比较是否不等于 -1 ，表达起来不够直观。二是，它内部使用严 格相等运算符（ === ）进行判断，这会导致对 NaN 的误判

```javascript
if(arr.indexOf(el) !== -1) {
    // ...
}
```

使用indexOf判断

```javascript
[NaN].indexof(NaN) // -1
```

includes 使用的是不一样的判断算法，就没有这个问题。

```javascript
[NaN].includes(NaN)
// true
```

##### Map 和 Set 数据结构有一个 has 方法，需要注意与 includes 区分。

 Map 结构的 has 方法，是用来查找键名的，比 如 Map.prototype.has(key) 、 WeakMap.prototype.has(key) 、 Refle ct.has(target, propertyKey) 。

 Set 结构的 has 方法，是用来查找值的，比 如 Set.prototype.has(value) 、 WeakSet.prototype.has(value)

### 1.6数组的空位

数组的空位指，数组的某一个位置没有任何值。比如， Array 构造函数返回的数 组都是空位。

```
Array(3) //[，，，]
```

空位不是undefined,一个位置等于undefined仍然是有值的,空位是没有任何值的,**ES6 则是明确将空位转为 undefined 。**

```javascript
0 in [undefined, undefined, undefined] // true
0 in [, , ,] // false
```

Array.from 方法会将数组的空位，转为 undefined ，也就是说，这个方法不会忽略空位

```javascript
Array.from(['a',,'b'])
// [ "a", undefined, "b" ]
```

扩展运算符（ ... ）也会将空位转为 undefined 。

```javascript
[...['a',,'b']]
// [ "a", undefined, "b" ]
```

```javascript
copyWithin() 会连空位一起拷贝。
[,'a','b',,].copyWithin(2,0) // [,"a",,"a"]
fill() 会将空位视为正常的数组位置。
new Array(3).fill('a') // ["a","a","a"]
for...of 循环也会遍历空位。
let arr = [, ,];
for (let i of arr) {
console.log(1);
}
// 1
// 1
```

数组 arr 有两个空位， for...of 并没有忽略它们。如果改 成 map 方法遍历，空位是会跳过的。 entries() 、 keys() 、 values() 、 find() 和 findIndex() 会将空位处 理成 undefined 。

### 1.7其余

```javascript
   // 参数变量是默认声明的，所以不能用 let 或 const 再次声明。而且默认参数不是一直不变，他是每次调用都会从新传值
      const a = 1;
      const c = 3;
      const add = (a, b = 10, c) => {
        return a + b + c;
      };
      console.log(add(1, 2, 3)); // 6
      console.log(add(1, "", 3)); //13
(function (a) {})
        .length(
          // 1
          function (a = 5) {}
        )
        .length(
          // 0
          function (a, b, c = 5) {}
        ).length; // 2

      /*
        length 属性的返回值，等于函数的参数个数减去指定了默认值的参
        数个数。比如，上面最后一个函数，定义了3个参数，其中有一个参数 c 指定了默
        认值，因此 length 属性等于 3 减去 1 ，最后得到 2 。
        这是因为 length 属性的含义是，该函数预期传入的参数个数。某个参数指定默认
        值以后，预期传入的参数个数就不包括这个参数了。同理，后文的 rest 参数也不会
        计入 length 属性
        */

//尾调用（Tail Call）是函数式编程的一个重要概念，本身非常简单，一句话就能说清楚，就是指某个函数的最后一步是调用另一个函数
      //这是因为在正常模式下，函数内部有两个变量，可以跟踪函数的调用栈。
      // func.arguments ：返回调用时函数的参数。
      // func.caller ：返回调用当前函数的那个函数。
      // 尾调用优化发生时，函数的调用栈会改写，因此上面两个变量就会失真严格模式禁用这两个变量，所以尾调用模式仅在严格模式下生效尾调用模式仅在严格模式下生效。
      function f(x) {
        return g(x);
      }
      //尾调用不一定出现在函数尾部，只要是最后一步操作即可。 函数m和n都属于尾调用，都是f的最后一步操作
      function f(x) {
        if (x > 0) {
          return m(x);
        }
        return n(x);
      }
      //   尾递归优化
      //斐波那契函数 尾递归
      function Fibonacci2(n, ac1 = 1, ac2 = 1) {
        if (n <= 1) {
          return ac2;
        }
        return Fibonacci2(n - 1, ac2, ac1 + ac2);
      }
      // 非尾递归
      function Fibonacci1(n) {
        if (n <= 1) {
          return 1;
        }
        return Fibonacci1(n - 1) + Fibonacci1(n - 2);
      }
      // const result = Fibonacci1(100);
      const result1 = Fibonacci2(1000);
      // console.log(result);
      console.log(result1);
      //就是采用 ES6 的函数默认值
      function factorial(n, total = 1) {
        if (n === 1) return total;
        return factorial(n - 1, n * total);
      }
      factorial(5); //，参数 total 有默认值 1 ，所以调用时不用提供这个值。
  <script>
      //Array.of 方法用于将一组值，转换为数组。 Array.of 总是返回参数值组成的数组。如果没有参数，就返回一个空数组。
      Array.of(3, 11, 8); // [3,11,8]
      Array.of(3); // [3]
      Array.of(3).length; // 1
      console.log([1, 2, 3, 4, 5, 6, 7].copyWithin(0, 3)); // [4, 5, 3, 4, 5]
    </script>
```



## 2.对象的扩展

### 2.1属性的简洁表示法

ES6 允许在大括号里面，直接写入变量和函数，作为对象的属性和方法。这样的书写更加简洁

```javascript
  let name = '琪琪';
        let change = function(){
            console.log('我们可以改变你!!');
        }

        const school = {
            name,
            change,
            improve(){
                console.log("我们可以提高你的技能");
            }
        }
```

### 2.2属性名表达式

JavaScript 定义对象的属性，有两种方法。

```javascript
// 方法一
obj.foo = true;
// 方法二
obj['a' + 'bc'] = 123;
```

ES6 允许字面量定义对象时，用方法二（表达式）作为对象的属性名，即把表达式 放在方括号内，表达式还可以用于定义方法名。

```javascript
let propKey = 'foo';
let obj = {
[propKey]: true,
['a' + 'bc']: 123 //即abc:123
    ['h' + 'ello']() {
return 'hi';
}
};

```

### 2.3方法的name属性

函数的 name 属性，返回函数名。对象方法也是函数，因此也有 name 属性。

```javascript
const proson  = {
    sayname(){
        conlose.log('hello !')
    }
}
proson.sayName.name // "sayName"
```

方法的 name 属性返回函数名（即方法名）。

如果对象的方法是一个 Symbol 值，那么 name 属性返回的是这个 Symbol 值的描 述。

```javascript
const key1 = Symbol('description');
const key2 = Symbol();
let obj = {
[key1]() {},
[key2]() {},
};
obj[key1].name // "[description]"
obj[key2].name // ""
```

### Object.is 

```javascript
 //   1. Object.is 判断两个值是否完全相等
        console.log(Object.is(120, 120));// ===
        console.log(Object.is(NaN, NaN));// ===
        console.log(NaN === NaN);// ===
```

### Object.assign

Object.assign 方法用于对象的合并，将源对象（source）的所有可枚举属性， 复制到目标对象（target）

```javascript
const config1 = {
            host: 'localhost',
            port: 3306,
            name: 'root',
            pass: 'root',
            test: 'test'
        };
        const config2 = {
            host: 'http://atguigu.com',
            port: 33060,
            name: 'atguigu.com',
            pass: 'iloveyou',
            test2: 'test2'
        }
        console.log(Object.assign(config1, config2));

```

***Object.assign方法的*第一个参数是目标对象，后面的参数都是源对象**。如果目标对象与源对象有同名属性或者多个源对象有同名属性，则后面的属性会覆盖前面的属性。

```javascript
var target = { a: 1, b: 1 };
var source1 = { b: 2, c: 2 };
var source2 = { c: 3 };
Object.assign(target, source1, source2);
target // {a:1, b:2, c:3}

```

如果只有一个参数， Object.assign 会直接返回该参数。如果该参数不是对象则会先转换成对象然后返回。但是由于 undefined 和 null 无法转成对象，所以如果它们作为参数，就会报错。

```javascript
Object.assign(undefined) // 报错
Object.assign(null) // 报错
```

如果非对象参数出现在源对象的位置（即非首参数），那么处理规则有所不同。首 先，这些参数都会转成对象，如果无法转成对象，就会跳过。这意味着，如 果 undefined 和 null 不在首参数，就不会报错。

```javascript
 let obj = {a: 1};

 Object.assign(obj, undefined) === obj // true 

Object.assign(obj, null) === obj // true
```

 其他类型的值（即数值、字符串和布尔值）不在首参数，也不会报错。但是，除了 字符串会以数组形式，拷贝入目标对象，其他值都不会产生效果。

**Object.assign 拷贝的属性是有限制的，只拷贝源对象的自身属性（不拷贝继承 属性），也不拷贝不可枚举的属性（ enumerable: false ）**。

**Object.assign 方法实行的是浅拷贝，而不是深拷贝。也就是说，如果源对象某 个属性的值是对象，那么目标对象拷贝得到的是这个对象的引用。**

```javascript
Object.assign({b: 'c'},
Object.defineProperty({}, 'invisible', {
enumerable: false,
value: 'hello'
})
)
// { b: 'c' }
```

对于嵌套的对象，遇到同名属性时，Object.assign的处理解决方法是替换，而不是添加

```javascript
var target = { a: { b: 'c', d: 'e' } }
var source = { a: { b: 'hello' } }
Object.assign(target, source)
// { a: { b: 'hello' } }就是相当于后面的如果有和target相同的属性直接用自己的
```

**用处：**

（1）为对象添加属性

（2）为对象添加方法

（3）克隆对象(浅克隆)

（4）合并多个对象

（5）为属性指定默认值

**ES6 规定，所有 Class 的原型的方法都是不可枚举的**

### 属性的遍历

ES6 一共有5种方法可以遍历对象的属性。 

（1）for...in for...in 循环遍历对象自身的和继承的可枚举属性（不含 Symbol 属性）。 

（2）Object.keys(obj) Object.keys 返回一个数组，包括对象自身的（不含继承的）所有可枚举属性 （不含 Symbol 属性）。 

（3）Object.getOwnPropertyNames(obj) Object.getOwnPropertyNames 返回一个数组，包含对象自身的所有属性（不含 Symbol 属性，但是包括不可枚举属性）。

 （4）Object.getOwnPropertySymbols(obj) Object.getOwnPropertySymbols 返回一个数组，包含对象自身的所有 Symbol 属性。

 （5）Reflect.ownKeys(obj) Reflect.ownKeys 返回一个数组，包含对象自身的所有属性，不管属性名是 Symbol 或字符串，也不管是否可枚举。 以上的5种方法遍历对象的属性，都遵守同样的属性遍历的次序规则。

- 首先遍历所有属性名为数值的属性，按照数字排序。
- 其次遍历所有属性名为字符串的属性，按照生成时间排序。 
- 最后遍历所有属性名为 Symbol 值的属性，按照生成时间排序。

```javascript
Reflect.ownKeys({ [Symbol()]:0, b:0, 10:0, 2:0, a:0 })
// ['2', '10', 'b', 'a', Symbol()]

```

### 对象的扩展运算符

（1）解构赋值 对象的解构赋值用于从一个对象取值，相当于将所有可遍历的、但尚未被读取的属 性，分配到指定的对象上面。所有的键和它们的值，都会拷贝到新对象上面。

```javascript
let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x // 1
y // 2
z // { a: 3, b: 4 }
```

上面代码中，变量 z 是解构赋值所在的对象。它获取等号右边的所有尚未读取的 键（ a 和 b ），将它们连同值一起拷贝过来。 

由于解构赋值要求等号右边是一个对象，所以如果等号右边 是 undefined 或 null ，就会报错，因为它们无法转为对象。

```javascript
let {x,y,...z} =null //报错
let {s,y,..z} = undefined //报错
```

解构赋值必须是最后一个参数，否则会报错。

```javascript
let { ...x, y, z } = obj; // 句法错误
let { x, ...y, ...z } = obj; // 句法错误
```

**注意，解构赋值的拷贝是浅拷贝，即如果一个键的值是复合类型的值（数组、对 象、函数）、那么解构赋值拷贝的是这个值的引用，而不是这个值的副本。**

```javascript
 let o1 = { a: 1 };
      let o2 = { b: 2 };
      o2.__proto__ = o1;
      let { ...o3 } = o2;
      console.log(o3); // { b: 2 }
      console.log(o3.a); // undefined
```

对象 o3 复制了 o2 ，但是只复制了 o2 自身的属性，没有复制它 的原型对象 o1 的属性

### 拓展运算符

扩展运算符（ ... ）用于取出参数对象的所有可遍历属性，拷贝到当前对象之 中。

```javascript
let z = { a: 3, b: 4 };
let n = { ...z };
n // { a: 3, b: 4 }
```

这等同于使用 Object.assign 方法。

```javascript
 let aClone = { ...a }; 

// 等同于

 let aClone = Object.assign({}, a);
```

上面的例子只是拷贝了对象实例的属性，如果想完整克隆一个对象，还拷贝对象原 型的属性，可以采用下面的写法。

```javascript
// 写法一 
const clone1 = { 
  __proto__: Object.getPrototypeOf(obj), 
  ...obj }; 
// 写法二 
const clone2 = Object.assign( Object.create(Object.getPrototypeOf(obj)),
obj )
```

扩展运算符可以用于合并两个对象

```javascript
t ab = { ...a, ...b };
// 等同于
let ab = Object.assign({}, a, b);
```

如果把自定义属性放在扩展运算符前面，就变成了设置新对象的默认属性值

```javascript
let aWithDefaults = { x: 1, y: 2, ...a };
// 等同于
let aWithDefaults = Object.assign({}, { x: 1, y: 2 }, a);
// 等同于
let aWithDefaults = Object.assign({ x: 1, y: 2 }, a);

```

与数组的扩展运算符一样，对象的扩展运算符后面可以跟表达式D:\flont\ES6-ES11\es6Code\ArrayOf.html

如果扩展运算符后面是一个空对象，则没有任何效果。

如果扩展运算符的参数是 null 或 undefined ，这两个值会被忽略，不会报错。 

```javascript
let emptyObject = { ...null, ...undefined };
```

###  Null 传导运算符

```javascript
const firstName = message?.body?.user?.firstName || 'default';
```

上面代码有三个 ?. 运算符，只要其中一个返回 null 或 undefined ，就不再往 下运算，而是返回 undefined 

**“Null 传导运算符”有四种用法**。

 obj?.prop // 读取对象属性

 obj?.[expr] // 同上

 func?.(...args) // 函数或对象方法的调用

 new C?.(...args) // 构造函数的调用 传导运算符之所以写成 obj?.prop ，而不是 obj?prop ，是为了方便编译器能够 区分三元运算符 ?: （比如 obj?prop:123 ）

```javascript
// 如果 a 是 null 或 undefined, 返回 undefined
// 否则返回 a.b.c().d
a?.b.c().d
// 如果 a 是 null 或 undefined，下面的语句不产生任何效果
// 否则执行 a.b = 42
a?.b = 42
// 如果 a 是 null 或 undefined，下面的语句不产生任何效果
delete a?.b

```

## Symbol

**ES6 引入了一种新的原始数据类型 Symbol ，表示独一无二的值。它是 JavaScript 语言的第七种数据类型，前六种是： undefined 、 null 、布尔值 （Boolean）、字符串（String）、数值（Number）、对象（Object）。**

Symbol 值通过 Symbol 函数生成。这就是说，对象的属性名现在可以有两种类 型，一种是原来就有的字符串，另一种就是新增的 Symbol 类型。凡是属性名属于 Symbol 类型，就都是独一无二的，可以保证不会与其他属性名产生冲突。

```javascript
let s = Symbol();
typeof s
// "symbol
```

Symbol 函数前不能使用 new 命令，否则会报错。这是因为生成的 Symbol 是一个原始类型的值，不是对象。也就是说，由于 Symbol 值不是对象， 所以不能添加属性。基本上，它是一种类似于字符串的数据类型

Symbol 函数可以接受一个字符串作为参数，表示对 Symbol 实例的描述，主要是 为了在控制台显示，或者转为字符串时，比较容易区分。

```javascript
var s1 = Symbol('foo');
var s2 = Symbol('bar');
s1 // Symbol(foo)
s2 // Symbol(bar)
s1.toString() // "Symbol(foo)"
s2.toString() // "Symbol(bar)
```

**注意， Symbol 函数的参数只是表示对当前 Symbol 值的描述，因此相同参数 的 Symbol 函数的返回值是不相等的。*每一个symbo都是唯一的
