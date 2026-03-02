[高频前端面试问题及答案整理 (qq.com)](https://mp.weixin.qq.com/s/BBLcUsXoJZLoHoj2Y4p2XA)

说说你对闭包的理解：

红宝书中说：闭包指的是那些引用了另一个函数作用域中变量的函数，通常是在嵌套函数中实现的。

使用闭包主要是为了设计私有的方法和变量。闭包的优点是可以避免全局变量的污染，缺点是闭包会常驻内存，会增大内存使用量，使用不当很容易造成内存泄露。

闭包有三个特性:
1.函数嵌套函数
2.函数内部可以引用外部的参数和变量
3.参数和变量不会被垃圾回收机制回收

请你谈谈Cookie的弊端：
cookie`虽然在持久保存客户端数据提供了方便，分担了服务器存储的负担，但还是有很多局限性的。
第一：每个特定的域名下最多生成20个`cookie
1.IE6或更低版本最多20个cookie
2.IE7和之后的版本最后可以有50个cookie。
3.Firefox最多50个cookie
4.chrome和Safari没有做硬性限制
IE和Opera 会清理近期最少使用的cookie，Firefox会随机清理cookie。

cookie的最大大约为4096字节，为了兼容性，一般不能超过4095字节。

IE 提供了一种存储可以持久化用户数据，叫做userdata，从IE5.0就开始支持。每个数据最多128K，每个域名下最多1M。这个持久化数据放在缓存中，如果缓存没有清理，那么会一直存在。

优点：极高的扩展性和可用性
1.通过良好的编程，控制保存在cookie中的session对象的大小。
2.通过加密和安全传输技术（SSL），减少cookie被破解的可能性。
3.只在cookie中存放不敏感数据，即使被盗也不会有重大损失。
4.控制cookie的生命期，使之不会永远有效。偷盗者很可能拿到一个过期的cookie。
缺点：
1.`Cookie`数量和长度的限制。每个domain最多只能有20条cookie，每个cookie长度不能超过4KB，否则会被截掉。

2.安全性问题。如果cookie被人拦截了，那人就可以取得所有的session信息。即使加密也与事无补，因为拦截者并不需要知道cookie的意义，他只要原样转发cookie就可以达到目的了。

3.有些状态不可能保存在客户端。例如，为了防止重复提交表单，我们需要在服务器端保存一个计数器。如果我们把这个计数器保存在客户端，那么它起不到任何作用。
浏览器本地存储：
在较高版本的浏览器中，js提供了sessionStorage和globalStorage。在HTML5中提供了localStorage来取代globalStorage。

html5中的Web Storage包括了两种存储方式：sessionStorage和localStorage。

sessionStorage用于本地存储一个会话（session）中的数据，这些数据只有在同一个会话中的页面才能访问并且当会话结束后数据也随之销毁。因此sessionStorage不是一种持久化的本地存储，仅仅是会话级别的存储。

而localStorage用于持久化的本地存储，除非主动删除数据，否则数据是永远不会过期的。

web storage和cookie的区别:
Web Storage的概念和cookie相似，区别是它是为了更大容量存储设计的。Cookie的大小是受限的，并且每次你请求一个新的页面的时候Cookie都会被发送过去，这样无形中浪费了带宽，另外cookie还需要指定作用域，不可以跨域调用。

除此之外，Web Storage拥有setItem,getItem,removeItem,clear等方法，不像cookie需要前端开发者自己封装setCookie，getCookie。

但是cookie也是不可以或缺的：cookie的作用是与服务器进行交互，作为HTTP规范的一部分而存在 ，而Web Storage仅仅是为了在本地“存储”数据而生

浏览器的支持除了IE７及以下不支持外，其他标准浏览器都完全支持(ie及FF需在web服务器里运行)，值得一提的是IE总是办好事，例如IE7、IE6中的userData其实就是javascript本地存储的解决方案。通过简单的代码封装可以统一到所有的浏览器都支持web storage。

localStorage和sessionStorage都具有相同的操作方法，例如setItem、getItem和removeItem等

cookie 和session 的区别：
 1、cookie数据存放在客户的浏览器上，session数据放在服务器上。
 2、cookie不是很安全，别人可以分析存放在本地的COOKIE并进行COOKIE欺骗
    考虑到安全应当使用session。
 3、session会在一定时间内保存在服务器上。当访问增多，会比较占用你服务器的性能
     考虑到减轻服务器性能方面，应当使用COOKIE。
 4、单个cookie保存的数据不能超过4K，很多浏览器都限制一个站点最多保存20个cookie。
 5、所以个人建议：
    将登陆信息等重要信息存放为SESSION
    其他信息如果需要保留，可以放在COOKIE中
CSS 相关问题:
display:none和visibility:hidden的区别？
display:none  隐藏对应的元素，在文档布局中不再给它分配空间，它各边的元素会合拢，
就当他从来不存在。

visibility:hidden  隐藏对应的元素，但是在文档布局中仍保留原来的空间。
CSS中 link 和@import 的区别是？
(1) link属于HTML标签，而@import是CSS提供的; 
(2) 页面被加载的时，link会同时被加载，而@import引用的CSS会等到页面被加载完再加载;
(3) import只在IE5以上才能识别，而link是HTML标签，无兼容问题; 
(4) link可以动态添加样式，属于html标签，可以通过dom进行添加，而@import不可以
position:absolute和float属性的异同：
A：共同点：
对内联元素设置`float`和`absolute`属性，可以让元素脱离文档流，并且可以设置其宽高。

B：不同点：
float仍会占据位置，position会覆盖文档流中的其他元素。
介绍一下box-sizing属性？
box-sizing属性主要用来控制元素的盒模型的解析模式。默认值是content-box。

content-box：让元素维持W3C的标准盒模型。元素的宽度/高度由border + padding + content的宽度/高度决定，设置width/height属性指的是content部分的宽/高

border-box：让元素维持IE传统盒模型（IE6以下版本和IE6~7的怪异模式）。设置width/height属性指的是border + padding + content

标准浏览器下，按照W3C规范对盒模型解析，一旦修改了元素的边框或内距，就会影响元素的盒子尺寸，就不得不重新计算元素的盒子尺寸，从而影响整个页面的布局。

CSS 选择符有哪些？哪些属性可以继承？优先级算法如何计算？CSS3新增伪类有那些？
1.id选择器（ # myid）
2.类选择器（.myclassname）
3.标签选择器（div, h1, p）
4.相邻选择器（h1 + p）
5.子选择器（ul > li）
6.后代选择器（li a）
7.通配符选择器（ * ）
8.属性选择器（a[rel = "external"]）
9.伪类选择器（a: hover, li:nth-child）
CSS中那些属性是可以继承的？
字体： font font-family font-size font-style font-variant font-weight

字母间距：letter-spacing

可见性：visibility

文字展示：line-height text-align text-indent text-transform

字间距：word-spacing

优先级：
!important > id > class > tag 

important 比 内联优先级高,但内联比 id 要高
CSS3新增伪类举例：
p:first-of-type 选择属于其父元素的首个 <p> 元素的每个 <p> 元素。
p:last-of-type  选择属于其父元素的最后 <p> 元素的每个 <p> 元素。
p:only-of-type  选择属于其父元素唯一的 <p> 元素的每个 <p> 元素。
p:only-child    选择属于其父元素的唯一子元素的每个 <p> 元素。
p:nth-child(2)  选择属于其父元素的第二个子元素的每个 <p> 元素。
:enabled  :disabled 控制表单控件的禁用状态。
:checked        单选框或复选框被选中。
position的值， relative和absolute分别是相对于谁进行定位的？
absolute 
        生成绝对定位的元素， 相对于最近一级的不是 static 的父元素来进行定位。

fixed （老IE不支持）
    生成绝对定位的元素，相对于浏览器窗口进行定位。 

relative 
    生成相对定位的元素，相对于其在普通流中的位置进行定位。 

static  默认值。没有定位，元素出现在正常的流中
CSS3有哪些新特性？
CSS3实现圆角（border-radius）
阴影（box-shadow），
对文字加特效（text-shadow、）
线性渐变（gradient）
旋转（transform）
transform:rotate(9deg) scale(0.85,0.90) translate(0px,-30px) skew(-9deg,0deg);//旋转,缩放,定位,倾斜
增加了更多的CSS选择器
多背景 rgba 
在CSS3中唯一引入的伪元素是::selection.
媒体查询
多栏布局
border-image
XML和JSON的区别？
(1).数据体积方面。
JSON相对于XML来讲，数据的体积小，传递的速度更快些。
(2).数据交互方面。
JSON与JavaScript的交互更加方便，更容易解析处理，更好的数据交互。
(3).数据描述方面。
JSON对数据的描述性比XML较差。
(4).传输速度方面。
JSON的速度要远远快于XML。
对BFC规范的理解？
      BFC，块级格式化上下文，一个创建了新的BFC的盒子是独立布局的，盒子里面的子元素的样式不会影响到外面的元素。在同一个BFC中的两个毗邻的块级盒在垂直方向（和布局方向有关系）的margin会发生折叠。
    （W3C CSS 2.1 规范中的一个概念，它决定了元素如何对其内容进行布局，以及与其他元素的关系和相互作用
创建块级格式化是那个下文：

根元素（<html>）

浮动元素（元素的 float 不是 none）

绝对定位元素（元素的 position 为 absolute 或 fixed）

行内块元素（元素的 display 为 inline-block）

表格单元格（元素的 display 为 table-cell，HTML表格单元格默认为该值）

表格标题（元素的 display 为 table-caption，HTML表格标题默认为该值）

匿名表格单元格元素（元素的 display 为 table、``table-row、 table-row-group、``table-header-group、``table-footer-group（分别是HTML table、row、tbody、thead、tfoot 的默认属性）或 inline-table）

overflow 计算值(Computed)不为 visible 的块元素

解释下 CSS sprites，以及你要如何在页面或网站中使用它。
CSS Sprites其实就是把网页中一些背景图片整合到一张图片文件中，再利用CSS的“background-image”，“background- repeat”，“background-position”的组合进行背景定位，background-position可以用数字能精确的定位出背景图片的位置。这样可以减少很多图片请求的开销，因为请求耗时比较长；请求虽然可以并发，但是也有限制，一般浏览器都是6个。对于未来而言，就不需要这样做了，因为有了`http2`。
 https://juejin.cn/post/7016593221815910408#comment

js五百道：https://juejin.cn/post/7023271065392513038#heading-53

所有对象都有原型？所有 JavaScript 中的对象都是位于原型链顶端的 Object 的实例？
错。Object.create(null) 原型就是null，Object.create(null)创建的对象就不是object的实例。

将A元素拖拽并放置到B元素中，B元素需要做哪项操作（）？
event.preventDefault()
event.prevent()
event.drag()
event.drop()

解析：event.preventDefault()用于阻止浏览器的默认行为，防止在拖拽过程中因为拖拽，浏览器所产生的页面跳转等不被希望的行为
9种鼠标事件：
DOM3级事件中定义了9个鼠标事件。

mousedown

mouseup

click

dblclick

mouseover

mouseout

mouseenter

mouseleave

mousemove

页面中的所有元素都支持鼠标事件。除了mouseenter和mouseleave，所有鼠标事件都会冒泡，都可以被取消。

可以对9种鼠标事件分为三类：

mousedown，mousemove，mouseup: 按下，移动，释放鼠标。

click，dblclick: 单击，双击鼠标。

mouseover，mouseout：鼠标从一个元素上移入/移出（冒泡）。

mouseenter，mouseleave: 鼠标从一个元素上移入/移出（不冒泡）。

https://juejin.cn/post/6923929057994211336

使用方法( )可以获取到地理位置所在的经纬度？
Geolocation.getCurrentPosition()
setInterval("alert('welcome');",1000);这段代码的意思是：

每隔一秒钟弹出一个对话框

下面可以声明数字的js代码是：
A. const a = 0xa1 // 16 进制
B. const a = 076 //8 进制
C. const a = 0b21
D. const a = 7e2 // 科学计数法
见红宝书Number那节
以下哪些选项可以将集合A转化为数组？
A. Array.from(A)
B. [].slice.apply(A)
C. [...A]
D. [].map.call(A, o => o)
// 都可以
下列方法可用于阻止事件冒泡的有：
A. event.cancelBubble = true;
B. event.stopPropagation();
C. event.preventDefault();
D. return false;
["0x1", "0x2", "0x3"].map(parseInt) 的结果：
几个问题：进制符号、parseInt、parseFloat符号

请给出 [5<6<3,3<2<4] 代码的运行结果

1 + - + + + - + 1 的结果是

[1, NaN, 0]

console.log(parseInt('0x1', 0));

console.log(parseInt('0x2', 1));

console.log(parseInt('0x3', 2));
规律：

parseInt 的第二个参数 radix 为 0 时，ECMAScript5 将 string 作为十进制数字
的字符串解析；相当于默认解析，也就是第二个参数没有传。

parseInt 的第二个参数 radix 为 1 时，解析结果为 NaN；

parseInt 的第二个参数 radix 在 2—36 之间时（超过这个范围直接返回NaN），如果 string 参数的第一个字符（除空白以外），不属于 radix 指定进制下的字符，解析结果为 NaN。

parseInt("3", 2)执行时，由于"3"不属于二进制字符，解析结果为 NaN。

特列：
如果解析的是十六进制，没有传第二参那么就是按照十六进制解析，如果传第二参且不是16就按照第一个参数的有效数字进行相应进制解析。如parseInt('0x3', 2)第一参虽是16进制，但是后面是2，所以就是按照parseInt('0', 2)这个解析的。
js中的优先级：吐了！！！
https://www.cnblogs.com/ygyy/p/12688701.html

https://juejin.cn/post/6844904048773201927#heading-39

1 + - + + + - + 1 的结果是

+/- 号在 JavaScript 通常有三种用途：

普通加减法: 二元运算符
++/--: 自增自减，一元运算符
+/-: 正负，一元运算符

上面表达式中没有涉及自增与自减的情况，一元运算符的优先级大于二元运算符，上述表达式执行顺序为：
1 + (- (+ (+ (+ (- (+ 1)))))) ----> 1 + 1 = 2
[ 'a', ,'b', ,].length 的结果是

webSocket在红宝书的747
switch语句在比较每个条件的值的时候使用全等操作符！
var str = "我非常喜欢编程";
str.length = 3;
console.log(str);
function side(arr) {
    arr[0] = arr[2];
}
function func1(a, b, c = 3) {
    c = 10;
    side(arguments);
    console.log(a + b + c);
}
function func2(a, b, c) {
    c = 10;
    side(arguments);
    console.log(a + b + c);
}
func1(1, 1, 1);
func2(1, 1, 1);
typeof Function
typeof Object
console.log(Function instanceof Object);
console.log(Object instanceof Function);
var number = 4;
var numberFactorial = (function (number){
    return (number === 0)? 1: number* factorial(number-1)
})(number)
console.log(numberFactorial)
​
数组方法的参数-返回值！！！
27.那些数组方法会修改原数组吗？那些不会？
改变自身值的方法

pop push shift unshift splice sort reverse
// ES6新增
copyWithin
fill
不改变自身值的方法

join // 返回字符串
forEach // 无返回值
concat map filter slice // 返回新数组
every some // 返回布尔值
reduce // 不一定返回什么
indexOf lastIndexOf // 返回数值(索引值)
// ES6新增
find findIndex
28.shift 与 unshift 的返回值分别是什么？
unshift返回插入元素后的新数组长度，shift返回删除的元素值

push返回的是插入元素的新数组长度，pop返回删除的元素值

(async () => {
    console.log(1);
    setTimeout(() => {
        console.log(2);
}, 0);
await new Promise((resolve, reject) => {
    console.log(3);
}).then(() => {
    console.log(4);
});
    console.log(5);
})();

"use strict"
var name = 'Jay'
var person = {
    name: 'Wang',
    pro: {
        name: 'Michael',
        getName: function () {
            return this.name
        }
    }
}
console.log(person.pro.getName)
var people = person.pro.getName
console.log(people())
​
compute(10,100);
var compute = function(A,B) {
    console.info(A * B) ;
};
function compute(A,B){
    console.info(A + B);
}
function compute(A,B){
    console.info((A + B)*2);
}
compute(2,10);
// 片段1
check('first');
function check(ars){
    console.log(ars);
}
// 片段2
check('second');
var check= function(ars){
    console.log(ars);
}
const student = {name: 'ZhangSan'}
// 默认都是 false
Object.defineProperty(student, 'age', {value: 22})
console.log(student)
console.log(Object.keys(student))
// Object.keys() 方法会返回一个由一个给定对象的自身可枚举属性组成的数组，数组中属性名的排列顺序和正常循环遍历该对象时返回的顺序一致。
// 请写出下面ES6代码编译后所产生的ES5代码：
class Person {
     constructor (name) {
          this.name = name;
     }
     greet () {
          console.log(`Hi, my name is ${this.name}`);
     }
     greetDelay (time) {
          setTimeout(() => {
               console.log(`Hi, my name is ${this.name}`);
          }, time);
     }
}
function getPersonInfo (one, two, three) {
    console.log('1', one)
    console.log('2', two)
    console.log('3', three)
}
const person = 'Lydia'
const age = 21
getPersonInfo `${person} is ${age} years old`
// a.js
let a = 1
let b = {}
setTimeout(() => {    
a = 2    
b.b = 2
}, 100)
module.exports = { a, b }

// b.js
const a = require('./a')
console.log(a.a)
console.log(a.b)
setTimeout(() => {    
    console.log(a.a)    
    console.log(a.b)
}, 500)
来几道event loop：
console.log('script start');
​
setTimeout(() => {
    console.log('time1');
}, 1 * 2000);
​
Promise.resolve()
.then(function() {
    console.log('promise1');
}).then(function() {
    console.log('promise2');
});
​
​
async function foo() {
    await bar()
    console.log('async1 end')
}
foo()
​
async function errorFunc () {
    try {
        await Promise.reject('error!!!')
    } catch(e) {
        console.log(e)
    }
    console.log('async1');
    return Promise.resolve('async1 success')
}
errorFunc().then(res => console.log(res))
​
function bar() {
    console.log('async2 end') 
}
​
console.log('script end');
手写题：
https://juejin.cn/post/7033275515880341512#heading-30

原生js灵魂拷问（上下两篇）：！！！
https://juejin.cn/post/7021750693262262308

https://juejin.cn/post/7024349274812973064

arr instanceof Array 判断arr 是不是数组可靠不？
红宝书原话：

自从 ECMAScript 3 做出规定以后，就出现了确定某个对象是不是数组的经典问题。
对于一个网页，或者一个全局作用域而言，使用 instanceof 操作符就能得到满意
的结果：
 
    if (value instanceof Array){
      //对数组执行某些操作
    }
 
  instanceof 操作符的问题在于，它假定只有一个全局执行环境。如果网页中包含
多个框架，那实际上就存在两个以上不同的全局执行环境，从而存在两个以上不同版
本的 Array 构造函数。如果你从一个框架向另一个框架传入一个数组，那么传入的
数组与在第二个框架中原生创建的数组分别具有各自不同的构造函数。
类型转换：
https://juejin.cn/post/6988387082536222734#comment

0,-0,null,NaN,undefined,或空字符串（""） 为 false 外，其余全为 true

计算机网络一点点：
https://www.nowcoder.com/discuss/835790?type=2&channel=-1&source_id=discuss_terminal_discuss_hot_nctrack

Object.is() 与 === 区别:
Object.is() 来进行相等判断时，一般情况下与 === 相同，它处理了一些特殊的情况，比如 +0 和 -0 不再相等，两个 NaN 是相等的。

function Foo(){
    getName = function(){ console.log(1); };
    return this;
}
Foo.getName = function(){ console.log(2); };
Foo.prototype.getName = function(){ console.log(3); };
var getName = function(){ console.log(4); };
function getName(){ console.log(5) };
​
Foo.getName();         
getName();        
Foo().getName();
getName();        
new Foo.getName();
new Foo().getName();
23.字符串是基本类型，那为什么可以调用字符串方法那？:
这是 JavaScript 中的设计。JavaScript 为了便于基本类型操作，提供了三个特殊的引用类型(包装类)，即 Number，String，Boolean ，它们的 [[PrimitiveValue]] 属性存储它们的本身值。基本类型的方法与属性是"借"来的，去向对应包装类"借"来的。

var str = 'zcxiaobao'
str2 = str.toUpperCase()
​
var str = 'zcxiaobao'
// 调用方法，创建String的一个实例
new String(str)
// 调用实例上的方法，并将值返回
str2 = new String(str).toUpperCase()
// 销毁实例
24.修改string.length大小能改变字符串长度吗？为什么？:
var str = '123456';
str.length = 0;
console.log(str, str.length); // 123456 6
很明显，修改 str.length 是无法做到修改字符串的长度的。

str 为原始值，调用 length 相当借用 new String(str).length，修改的是 new String(str) 的 length ，跟原始值 str 无关。

扩展：修改new String()生成字符串的length会生效吗？为什么？
如果将上面代码修改一下，str 是由 new String 产生，修改 length 属性会生效吗？

var str = new String('123456');
str.length = 0;
console.log(str, str.length); // String {"123456"} 6
复制代码
答案告诉我们，还是失败了。

new String() 生成的字符串是对象类型，为啥还不能使用 length 属性。那说明 length 属性，很有可能配置不可写，测试一下上述猜想:

Object.getOwnPropertyDescriptor(str, 'length')
/*
    {
        value: 6, 
        writable: false, 
        enumerable: false, 
        configurable: false
    }
*/
由控制台的打印可知：new String() 生成的字符串的 length 属性不止是不可写，而且是不可枚举、不可配置的。

36. 如何实现数组去重?
使用双重 for 和 splice:
function unique(arr){            
    for(var i=0; i<arr.length; i++){
        for(var j=i+1; j<arr.length; j++){
            if(arr[i]==arr[j]){         
            //第一个等同于第二个，splice方法删除第二个
                arr.splice(j,1);
                // 删除后注意回调j
                j--;
            }
        }
    }
return arr;
}
使用 indexOf 或 includes 加新数组
//使用indexof
function unique(arr) {
    var uniqueArr = []; // 新数组
    for (let i = 0; i < arr.length; i++) {
        if (uniqueArr.indexOf(arr[i]) === -1) {
            //indexof返回-1表示在新数组中不存在该元素
            uniqueArr.push(arr[i])//是新数组里没有的元素就push入
        }
    }
    return uniqueArr;
}
// 使用includes
function unique(arr) {
    var uniqueArr = []; 
    for (let i = 0; i < arr.length; i++) {
        //includes 检测数组是否有某个值
        if (!uniqueArr.includes(arr[i])) {
            uniqueArr.push(arr[i])//
        }
    }
    return uniqueArr;
}
sort 排序后，使用快慢指针的思想
function unique(arr) {
  arr.sort((a, b) => a - b)
  var fast = 1, slow = 0
  while(fast < arr.length) {
    if(arr[slow] === arr[fast]) {
      arr.splice(fast, 1)
    } else {
      slow++
      fast++
    }
  }
}
sort 方法用于从小到大排序(返回一个新数组)，其参数中不带以上回调函数就会在两位数及以上时出现排序错误(如果省略，元素按照转换为的字符串的各个字符的 Unicode 位点进行排序。两位数会变为长度为二的字符串来计算)。

ES6 提供的 Set 去重
function unique(arr) {
    const result = new Set(arr);
    return [...result];
    //使用扩展运算符将Set数据结构转为数组
}
Set 中的元素只会出现一次，即 Set 中的元素是唯一的。

使用哈希表存储元素是否出现(ES6 提供的 map)
function unique(arr) {
    let map = new Map();
    let uniqueArr = new Array();  // 数组用于返回结果
    for (let i = 0; i < arr.length; i++) {
      if(!map.has(arr[i])) { 
        map.set(arr[i], false); 
        uniqueArr.push(arr[i]);
      }
    } 
    return uniqueArr ;
}
map 对象保存键值对，与对象类似。但 map 的键可以是任意类型，对象的键只能是字符串类型。

如果数组中只有数字也可以使用普通对象作为哈希表。

filter 配合 indexOf
function unique(arr) {
    return arr.filter(function (item, index, arr) {
        //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
        //不是那么就证明是重复项，就舍弃
        return arr.indexOf(item) === index;
    })
}
这里有可能存在疑问，我来举个例子：

const arr = [1,1,2,1,3]
arr.indexOf(arr[0]) === 0 // 1 的第一次出现
arr.indexOf(arr[1]) !== 1 // 说明前面曾经出现过1
reduce 配合 includes
function unique(arr){
    let uniqueArr = arr.reduce((acc,cur)=>{
        if(!acc.includes(cur)){
            acc.push(cur);
        }
        return acc;
    },[]) // []作为回调函数的第一个参数的初始值
    return uniqueArr
}
34.你知道forEach如何跳出循环吗？
可见 break 无法在 forEach 中使用（报错）

return 无法中断 forEach ，只是类似于 continue 的功能。

try catch 可以中断 forEach 的，而且是唯一可以中断 forEach 的方式。

可以使用 some 和 every 来替代 forEach 函数: every 在碰到 return false 的时候，中止循环。some 在碰到 return true 的时候，中止循环。

29.new Array() 与 Array.of() 的区别是什么？
Array.of() 方法创建一个具有可变数量参数的新数组实例，而不考虑参数的数量或类型

Array.of(7);       // [7]
Array.of(1, 2, 3); // [1, 2, 3]
​
Array(7);          // [ , , , , , , ]
Array(1, 2, 3);    // [1, 2, 3]
一些大厂的面试题-整！这种算是常考的吧！ 看完！
https://github.com/zcxiaobao/everyday-insist

Number.isNaN() 与 isNaN() 的区别？
https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/isNaN

全局isNaN() 对于非数字会调用Number()转为数字。

和全局函数 isNaN() 相比，Number.isNaN() 不会自行将参数转换成数字，只有在参数是值为 NaN 的数字时，才会返回 true。

const name = 'Lydia Hallie'
const age = 21
​
console.log(Number.isNaN(name)); // false
console.log(Number.isNaN(age)); // false
​
console.log(isNaN(name)); // true
console.log(isNaN(age)); // false
手写：
手写数组去重(9种)：
// 双循环法：
function unique_one(arr) {
  for(var i = 0; i < arr.length; i++) {
    for(var j = i + 1; j < arr.length; j++) {
      if(arr[i] === arr[j]) {
        arr.splice(j, 1)
        j--
      }
    }
  }
​
  return arr
}
​
// indexOf：
function unique_two(arr) {
  const res = []
  arr.map((item) => {
    if(res.indexOf(item) === -1) {
      res.push(item)
    }
  })
​
  return res
}
​
// includes：
function unique_three(arr) {
  const res = []
  arr.map((item) => {
    if(!res.includes(item)) {
      res.push(item)
    }
  })
​
  return res
}
​
// Set 去重：
function unique_four(arr) {
  const res = new Set(arr)
  return [...res]
}
​
// sort + 双指针：
function unique_five(arr) {
  arr.sort((a, b) => a - b)
  var fast = 1, slow = 0
  while(fast < arr.length) {
    if(arr[slow] === arr[fast]) {
      arr.splice(fast, 1)
    } else {
      fast++
      slow++
    }
  }
​
  return arr
}
​
// map + indexOf
function unique_six(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index)
}
​
// Map：
function unique_seven(arr) {
  const map = new Map()
  const res = []
  for(var i = 0; i < arr.length; i++) {
    if(!map.has(arr[i])) {
      map.set(arr[i],true)
      res.push(arr[i])
    }
  }
​
  return res
}
​
// reduce + indexOf：
function unique_nine(arr) {
  const res = arr.reduce((acc, cur) => {
    if(acc.indexOf(cur) == -1) {
      acc.push(cur)
    }
  
    return acc
  }, [])
​
  return res
}
​
// reduce + includes：
function unique_eight(arr) {
  const res = arr.reduce((acc, cur) => {
    if(!acc.includes(cur)) {
      acc.push(cur)
    }
  
    return acc
  }, [])
​
  return res
}
遍历数组的几种方案---不限于这几种：
const arr = [1, 2, 3, 4, [1, 2, 3, [1, 2, 3, [1, 2, 3]]], 5, "string", { name: "弹铁蛋同学" }];
// 遍历数组的方法有太多，本文只枚举常用的几种
// for 循环
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}
// for...of
for (let value of arr) {
  console.log(value);
}
// for...in
for (let i in arr) {
  console.log(arr[i]);
}
// forEach 循环
arr.forEach(value => {
  console.log(value);
});
// entries（）
for (let [index, value] of arr.entries()) {
  console.log(value);
}
// keys()
for (let index of arr.keys()) {
  console.log(arr[index]);
}
// values()
for (let value of arr.values()) {
  console.log(value);
}
// reduce()
arr.reduce((pre, cur) => {
  console.log(cur);
}, []);
// map()
arr.map(value => console.log(value));
判断元素是数组：
const arr = [1, 2, 3, 4, [1, 2, 3, [1, 2, 3, [1, 2, 3]]], 5, "string", { name: "弹铁蛋同学" }];
arr instanceof Array // 存在两个及以上窗口或全局环境时不严谨
// true
arr.constructor === Array // constructor被重写时不严谨
// true
Object.prototype.toString.call(arr) === '[object Array]'
// true
Array.isArray(arr)
// true
flat：
const arr = [1, 2, 3, 4, [1, 2, 3, [1, 2, 3, [1, 2, 3]]], 5, "string", { name: "弹铁蛋同学" }];
​
// 递归调用实现拍平：
function flat_one(arr) {
  var res = []
  arr.forEach(item => {
    if(Array.isArray(item)) {
      res = res.concat(flat(item))
    } else {
      res.push(item)
    }
  });
​
  return res
}
​
// reduce 实现 flat：
function flat_two(arr) {
  return arr.reduce((acc, cur) => {
    return acc.concat(Array.isArray(cur) ? flat_two(cur) : cur)
  }, [])
}
​
// 通过栈实现：
function flat_three(arr) {
  const stack = arr
  const res = []
  while(stack.length) {
    const tmp = arr.pop()
    if(Array.isArray(tmp)) {
      stack.push(...tmp)
    } else {
      res.unshift(tmp)
    }
  }
​
  return res
}
​
//
function flat__three(arr) {
  let arg = [...arr]
  while(arg.some(Array.isArray)) {
    arg = [].concat(...arg)
  }
​
  return arg
}
​
// 通过JSON.stringify 和 JSON.parse
function flat(arr) {
  let str = JSON.stringify(arr)
  str = str.replace(/(\[|\])/g, '')
  return JSON.parse(`[${str}]`)
}
​
// 控制拍平的层数：
function flat_four(arr, num = 1) {
  return num > 0
    ? arr.reduce(
        (pre, cur) =>
          pre.concat(Array.isArray(cur) ? flat_four(cur, num - 1) : cur),
        []
      )
    : arr.slice();
}
​
// 数组原型上重写 flat：
Array.prototype.fakeFlat = function(num = 1) {
  if (!Number(num) || Number(num) < 0) {
    return this;
  }
  let arr = this.concat();    // 获得调用 fakeFlat 函数的数组
  while (num > 0) {           
    if (arr.some(x => Array.isArray(x))) {
      arr = [].concat.apply([], arr);   // 数组中还有数组元素的话并且 num > 0，继续展开一层数组 
    } else {
      break; // 数组中没有数组元素并且不管 num 是否依旧大于 0，停止循环。
    }
    num--;
  }
  return arr;
};
​
Array.prototype.fakeFlat = function(num = 1) {
  if (!Number(num) || Number(num) < 0) {
    return this;
  }
  let arr = [].concat(this);
  return num > 0
    ? arr.reduce(
        (pre, cur) =>
          pre.concat(Array.isArray(cur) ? cur.fakeFlat(--num) : cur),
        []
      )
    : arr.slice();
};
const arr = [1, [3, 4], , ,];
arr.fakeFlat()
// [1, 3, 4]
​
// foEach + 递归
Array.prototype.fakeFlat = function(num = 1) {
  if (!Number(num) || Number(num) < 0) {
    return this;
  }
  let arr = [];
  this.forEach(item => {
    if (Array.isArray(item)) {
      arr = arr.concat(item.fakeFlat(--num));
    } else {
      arr.push(item);
    }
  });
  return arr;
};
手写数组 ES6 的方法： https://juejin.cn/post/7024305368595431454

手写instanceOf：
function instanceOf(child, father) {
​
  if((typeof child !== 'object' && typeof child !== 'function') || child === null) return false
​
  let fp = father.prototype
  let cp = child.__proto__
  while(cp) {
    if(cp === fp) return true
    cp = cp.__proto__
  }
​
  return false
}
实现数据类型判断函数：
function LH_typeof (obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
}
实现 sleep 函数：
// 通过 sleep：
function sleep_one(time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time)
  })
}
​
sleep_one(1000).then(() => {
  console.log(11);
})
​
// 通过定时器：
function sleep_two(callback, time) {
  if(typeof callback === 'function') setTimeout(callback, time)
}
​
function output() {
  console.log(1111);
}
​
sleep_two(output, 2000)
数组转树：
let input = [
  {
    id: 1,
    val: "学校",
    parentId: null,
  },
  {
    id: 2,
    val: "班级1",
    parentId: 1,
  },
  {
    id: 3,
    val: "班级2",
    parentId: 1,
  },
  {
    id: 4,
    val: "学生1",
    parentId: 2,
  },
  {
    id: 5,
    val: "学生2",
    parentId: 3,
  },
  {
    id: 6,
    val: "学生3",
    parentId: 3,
  },
];
function buildTree(arr, parentId, childrenArray) {
  arr.forEach((item) => {
    if (item.parentId === parentId) {
      item.children = [];
      buildTree(arr, item.id, item.children);
      childrenArray.push(item);
    }
  });
}
function arrayToTree(input, parentId) {
  const array = [];
  buildTree(input, parentId, array);
  return array.length > 0 ? (array.length > 1 ? array : array[0]) : {};
}
const obj = arrayToTree(input, null);
console.log(obj);
把一个JSON对象的key从下划线形式（Pascal）转换到小驼峰形式？
function getCamel(str) {
  let arr = str.split('_')
  const res = arr.map((item, index) => {
    if(index !== 0) {
      return item.slice(0, 1).toUpperCase() + item.slice(1)
    } else {
      return item
    }
  }).join('')
  return res
}
手写 Set：
class Set {
  constructor() {
    this.items = {};
    this.size = 0;
  }
​
  has(element) {
    return element in this.items;
  }
​
  add(element) {
    if(! this.has(element)) {
      this.items[element] = element;
      this.size++;
    }
    return this;
  }
​
  delete(element) {
    if (this.has(element)) {
      delete this.items[element];
      this.size--;
    }
    return this;
  }
​
  clear() {
    this.items = {}
    this.size = 0;
  }
​
  values() {
    let values = [];
    for(let key in this.items) {
      if(this.items.hasOwnProperty(key)) {
        values.push(key);
      }
    }
    return values;
  }
}
手写 Map：
function defaultToString(key) {
  if(key === null) {
    return 'NULL';
  } else if (key === undefined) {
    return 'UNDEFINED'
  } else if (Object.prototype.toString.call(key) === '[object Object]' || Object.prototype.toString.call(key) === '[object Array]') {
    return JSON.stringify(key);
  }
  return key.toString();
}
​
class Map {
  constructor() {
    this.items = {};
    this.size = 0;
  }
​
  set(key, value) {
    if(!this.has(key)) {
      this.items[defaultToString(key)] = value;
      this.size++;
    }
    return this;
  }
​
  get(key) {
    return this.items[defaultToString(key)];
  }
​
  has(key) {
    return this.items[defaultToString(key)] !== undefined;
  }
​
  delete(key) {
    if (this.has(key)) {
      delete this.items[key];
      this.size--;
    }
    return this;
  }
​
  clear() {
    this.items = {}
    this.size = 0;
  }
​
  keys() {
    let keys = [];
    for(let key in this.items) {
      if(this.has(key)) {
        keys.push(key)
      }
    }
    return keys;
  }
​
  values() {
    let values = [];
    for(let key in this.items) {
      if(this.has(key)) {
        values.push(this.items[key]);
      }
    }
    return values;
  }
}
掘金36 道手写题：https://juejin.cn/post/6946022649768181774#heading-11

事件总线（发布订阅模式）：
class EventEmitter {
  constructor() {
      this.cache = {}
  }
  on(name, fn) {
      if (this.cache[name]) {
          this.cache[name].push(fn)
      } else {
          this.cache[name] = [fn]
      }
  }
  off(name, fn) {
      // 没参数的时候就清除所有绑定事件：
      if(!arguments.length) {
        this.cache = {}
        return
      }
​
      // 只有一个参数的时候，清除事件列表：
      if(name && !fn) {
        this.cache[name] = null
        return
      }
​
      let tasks = this.cache[name]
      if (tasks) {
          const index = tasks.findIndex(f => f === fn || f.callback === fn)
          if (index >= 0) {
              tasks.splice(index, 1)
          }
      }
  }
  emit(name, once = false, ...args) {
      if (this.cache[name]) {
          // 创建副本，如果回调函数内继续注册相同事件，会造成死循环
          let tasks = this.cache[name].slice()
          for (let fn of tasks) {
              fn(...args)
          }
          if (once) {
              delete this.cache[name]
          }
      }
  }
}
​
// 测试
let eventBus = new EventEmitter()
let fn1 = function(name, age) {
console.log(`${name} ${age}`)
}
let fn2 = function(name, age) {
console.log(`hello, ${name} ${age}`)
}
eventBus.on('aaa', fn1)
eventBus.on('bbb', fn2)
eventBus.off('aaa')
eventBus.emit('aaa', false, '布兰', 12)
eventBus.emit('bbb', false, '氧化氢', 12)
// '布兰 12'
// 'hello, 布兰 12'
class eventBus {
  constructor() {
    this.event = {}
  }
​
  on(name, fn) {
    if(typeof fn !== 'function') {
      throw TypeError(`${fn} 不是函数`)
    }
​
    if(this.event[name]) {
      this.event[name].push(fn)
    } else {
      this.event[name] = [fn]
    }
  }
​
  off(name, fn) {
    if(!arguments.length) {
      this.event = {}
      return
    }
​
    if(name && !fn) {
      this.event[name] = null
      return
    }
​
    // 拿到绑定的事件列表：
    let tasks = this.event[name]
    for(let i = 0; i < tasks.length; i++) {
      if(tasks[i] === fn) {
        tasks.splice(i, 1)
        i--
      }
    }
  }
​
  emit(name, ...args) {
    let tasks = this.event[name]
    if(!tasks) {
      throw TypeError(`没有 ${name} 这个方法`)
    }
​
    for(let fn of tasks) {
      fn(...args)
    }
  }
}
​
const eBus = new eventBus()
​
eBus.on('log', function(name, method) {
  console.log(`${name} 调用 ${method} 方法`);
})
eBus.on('a', function() {
  console.log('aaa');
})
eBus.emit('a')
eBus.emit('log')
eBus.off('a')
eBus.emit('log')
eBus.emit('a')
解析 URL 参数为对象：
function parseParam(url) {
    const paramsStr = /.+\?(.+)$/.exec(url)[1]; // 将 ? 后面的字符串取出来
    const paramsArr = paramsStr.split('&'); // 将字符串以 & 分割后存到数组中
    let paramsObj = {};
    // 将 params 存到对象中
    paramsArr.forEach(param => {
        if (/=/.test(param)) { // 处理有 value 的参数
            let [key, val] = param.split('='); // 分割 key 和 value
            val = decodeURIComponent(val); // 解码
            val = /^\d+$/.test(val) ? parseFloat(val) : val; // 判断是否转为数字
    
            if (paramsObj.hasOwnProperty(key)) { // 如果对象有 key，则添加一个值
                paramsObj[key] = [].concat(paramsObj[key], val);
            } else { // 如果对象没有这个 key，创建 key 并设置值
                paramsObj[key] = val;
            }
        } else { // 处理没有 value 的参数
            paramsObj[param] = true;
        }
    })
    
    return paramsObj;
}
function parseUrl(url) {
  if(!url.includes('?')) return {}
  var params = url.split('?')[1]
  if(!params.includes('&')) {
    let obj = {}
    let [key, value] = item.split('=')
    obj[key] = decodeURIComponent(value)
​
    return obj
  } else {
    const arr = params.split('&')
    const obj = {}
    let key, value
    arr.forEach(item => {
      [key, value] = item.split('=')
      obj[key] = decodeURIComponent(value)
    })
​
    return obj
  }
}
​
console.log(parseUrl('https://www.nowcoder.com/interview/ai/cover?companyTagId=665&age=100&name=liuhao'));
字符串模板：
function render(template, data) {
  const reg = /\{\{(\w+)\}\}/; // 模板字符串正则
  if (reg.test(template)) { // 判断模板里是否有模板字符串
      const name = reg.exec(template)[1]; // 查找当前模板里第一个模板字符串的字段
      template = template.replace(reg, data[name]); // 将第一个模板字符串渲染
      return render(template, data); // 递归的渲染并返回渲染后的结构
  }
  return template; // 如果模板没有模板字符串直接返回
}
​
​
let template = '我是{{name}}，年龄{{age}}，性别{{sex}}';
let person = {
    name: '布兰',
    age: 12
}
console.log(render(template, person)); // 我是布兰，年龄12，性别undefined
函数柯里化：
function curry(fn) {
  if(typeof fn !== 'function') throw TypeError(`${fn}不是一个函数`)
​
  function curried(...arg) {
    if(arg.length >= fn.length) {
      return fn(...arg)
    } else {
      function more(...arg2) {
        return curried(...arg, ...arg2)
      }
      return more
    }
  }
  return curried
}
​
function add(a, b, c) {
  return a + b + c
}
​
const A = curry(add)
console.log(A(1)(1)(1));
偏函数：
偏函数就是将一个 n 参的函数转换成固定 x 参的函数，剩余参数（n - x）将在下次调用全部传入。

function partial(fn, ...rest) {
  function over(...args) {
    return fn(...rest, ...args)
  }
  return over
}
​
function add(a, b, c) {
  return a + b + c
}
let partialAdd = partial(add, 1)
console.log(partialAdd(2, 3));
jsonp:
const jsonp = ({ url, params, callbackName }) => {
    const generateUrl = () => {
        let dataSrc = ''
        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                dataSrc += `${key}=${params[key]}&`
            }
        }
        dataSrc += `callback=${callbackName}`
        return `${url}?${dataSrc}`
    }
    return new Promise((resolve, reject) => {
        const scriptEle = document.createElement('script')
        scriptEle.src = generateUrl()
        document.body.appendChild(scriptEle)
        window[callbackName] = data => {
            resolve(data)
            document.removeChild(scriptEle)
        }
    })
}
手写ajax：
function getJson(url) {
  return new Promise((resolve, reject) => {
    const xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP')
    xhr.open('GET', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onreadystatechange = function() {
      if(xhr.readyState !== 4) return
      if(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        resolve(xhr.responseText)
      } else {
        reject(new Error(xhr.responseText))
      }
    }
    xhr.send()
  })
}
手写Object.create():
function create(proto, property = undefined) {
  if(typeof proto !== 'object' && typeof proto !== 'function') {
    throw TypeError(`${proto} 只接受对象或null`)
  }
  if(property === null) {
    throw TypeError(`${property} 不能是 null`)
  }
​
  function Foo() {}
  Foo.prototype = proto
  const obj = new Foo()
​
  if(property !== undefined) {
    Object.defineProperties(obj, property)
  }
​
  if(proto === null) {
    obj.__proto__ = null
  }
​
  return obj
}
手写：Object.assign()
function assign(target, ...rest) {
  if(target == null) {
    throw TypeError(`${target} 参数形式不对!`)
  }
  // 如果 traget是原始类型,那么就包装成对象类型:
  let res = Object(target)
  rest.forEach(item => {
    if(item != null) {
      for(let key in item) {
        if(item.hasOwnProperty(key)) {
          res[key] = item[key]
        }
      }
    }
  })
  // 返回目标值:
  return res
}
手写forEach：
可在 MDN 看源码：

Array.prototype.forEach2 = function(callback, thisArg) {
  if (this == null) {
      throw new TypeError('this is null or not defined')
  }
  if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function')
  }
  const O = Object(this)  // this 就是当前的数组
  const len = O.length >>> 0  // 后面有解释
  let k = 0
  while (k < len) {
      if (k in O) {
          callback.call(thisArg, O[k], k, O);
      }
      k++;
  }
}
手写map：
const arr = [1, 3, 4, 5]
​
Array.prototype.map2 = function(callBack, thisArg) {
  if(this == null) throw TypeError(`${this} is null or not defined`)
  if(typeof callBack !== 'function') throw TypeError(`${callBack} is not a function`)
​
  const O = Object(this)
  const len = O.length >>> 0
  const res = new Array(len)
  let k = 0
  while(k < len) {
    if(k in O) {
      res[k] = callBack.call(thisArg, O[k], k, O)
    }
    k++
  }
​
  return res
}
​
console.log(arr.map2(() => {}));
console.log(arr.map(() => {}));
手写filter：
const arr = [1, 3, 4, 5]
​
Array.prototype.filter2 = function(callBack, thisArg) {
  if(this == null) throw TypeError(`${this} is null or not defined`)
  if(typeof callBack !== 'function') throw TypeError(`${callBack} is not a function`)
​
  const O = Object(this)
  const len = O.length >>> 0
  const res = []
  let k = 0
  while(k < len) {
    if(k in O) {
      if(callBack.call(thisArg, O[k], k, O)) {
        res.push(O[k])
      }
    }
    k++
  }
​
  return res
}
手写some：
const arr = [1, 3, 4, 5]
​
Array.prototype.some2 = function(callback, thisArg) {
  if (this == null) {
    throw new TypeError('this is null or not defined')
  }
  if (typeof callback !== "function") {
    throw new TypeError(callback + ' is not a function')
  }
  const O = Object(this)
  const len = O.length >>> 0
  let k = 0
  while (k < len) {
    if (k in O) {
      if (callback.call(thisArg, O[k], k, O)) {
        return true
      }
    }
    k++;
  }
  return false
}
手写reduce：
Array.prototype.reduce2 = function(callback, initialValue) {
  if (this == null) {
    throw new TypeError('this is null or not defined')
  }
  if (typeof callback !== "function") {
    throw new TypeError(callback + ' is not a function')
  }
  const O = Object(this)
  const len = O.length >>> 0
  let k = 0, acc
  
  if (arguments.length > 1) {
    acc = initialValue
  } else {
    // 没传入初始值的时候，取数组中第一个非 empty 的值为初始值
    while (k < len && !(k in O)) {
      k++
    }
    if (k > len) {
      throw new TypeError( 'Reduce of empty array with no initial value' );
    }
    acc = O[k++]
  }
  while (k < len) {
    if (k in O) {
      acc = callback(acc, O[k], k, O)
    }
    k++
  }

  return acc
}
Array.prototype.reduce2 = function(callback, initialValue) {
  if (this == null) {
    throw new TypeError('this is null or not defined')
  }
  if (typeof callback !== "function") {
    throw new TypeError(callback + ' is not a function')
  }
  const O = Object(this)
  const len = O.length >>> 0
  let k = 0, acc
  
  if (arguments.length > 1) {
    acc = initialValue
  } else {
    // 没传入初始值的时候，取数组中第一个非 empty 的值为初始值
    while (k < len && !(k in O)) {
      k++
    }
    if (k > len) {
      throw new TypeError( 'Reduce of empty array with no initial value' );
    }
    acc = O[k++]
  }
  while (k < len) {
    if (k in O) {
      acc = callback(acc, O[k], k, O)
    }
    k++
  }
​
  return acc
}
手写call：
Function.prototype.call2 = function (context) {
  var context = context || window;
  context.fn = this;
​
  var args = [];
  for(var i = 1, len = arguments.length; i < len; i++) {
    args.push('arguments[' + i + ']');
  }
​
  // var result = eval('context.fn(' + args +')');
  var result = context.fn(args)
​
  delete context.fn
  return result;
}
手写apply：
Function.prototype.apply2 = function(context, arr) {
  const context = context || window
  context.fn = this
​
  var result
  if(!arr) {
    result = context.fn()
  } else {
    var args = []
    for (var i = 0, len = arr.length; i < len; i++) {
      args.push(arr[i]);
    }
    result = context.fn(...args)
  }
​
  delete context.fn
  return result
}
浅拷贝：
function shallCopy(obj) {
  if(typeof obj !== 'object') return
  const newObj = Array.isArray(obj) ? [] : {}
  for(let key in obj) {
    if(obj.hasOwnProperty(key)) {
      newObj[key] = obj[key]
    }
  }
​
  return newObj
}
简版深拷贝：
function deepCopy(obj) {
  if(typeof obj !== 'object') return
  const newObj = Array.isArray(obj) ? [] : {}
  for(let key in obj) {
    if(obj.hasOwnProperty(key)) {
      newObj[key] = typeof obj[key] === 'object' ? deepCopy(obj[key]) : obj[key] 
    }
  }

  return newObj
}
复杂般的深拷贝：
基于简单版的基础上，还考虑了内置对象比如 Date、RegExp 等对象和函数。

function deepClone(target) {
​
  const constructor = target.constructor
  if(/^(RegExp|Date)$/i.test(constructor.name)) {
    return new constructor(target)
  }
​
  if(isObject(target)) {
    const newObj = Array.isArray(target) ? [] : {}
    for(let key in target) {
      if(target.hasOwnProperty(key)) {
        newObj[key] = deepClone(target[key])
      }
    }
    return newObj
  } else if(typeof target === 'function') {
    return Object.assign(target)
  } else {
    return target
  }
}
​
function isObject(target) {
  return typeof target === 'object' && target !== null
}
手写五种继承：
原型链继承：
function Animal() {
  this.colors = ['red', 'green', 'blue']
}
​
Animal.prototype.getColor = function() {
  return 'red'
}
​
function Dog() { }
​
Dog.prototype = new Animal()
​
let dog1 = new Dog()
let dog2 = new Dog()
dog1.colors.push('brown')
console.log(dog2.colors);
原型链继承存在的问题：

问题1：原型中包含的引用类型属性将被所有实例共享；

问题2：子类在实例化的时候不能给父类构造函数传参；

借用构造函数实现继承：
function Animal(name) {
    this.name = name
    this.getName = function() {
        return this.name
    }
}
function Dog(name) {
    Animal.call(this, name)
}
Dog.prototype =  new Animal()
借用构造函数实现继承解决了原型链继承的 2 个问题：引用类型共享问题以及传参问题。但是由于方法必须定义在构造函数中，所以会导致每次创建子类实例都会创建一遍方法。

组合继承：
组合继承结合了原型链和盗用构造函数，将两者的优点集中了起来。基本的思路是使用原型链继承原型上的属性和方法，而通过盗用构造函数继承实例属性。这样既可以把方法定义在原型上以实现重用，又可以让每个实例都有自己的属性。

function Animal(name) {
  this.name = name
  this.colors = ['black', 'white']
}
Animal.prototype.getName = function() {
  return this.name
}
function Dog(name, age) {
  Animal.call(this, name)
  this.age = age
}
Dog.prototype =  new Animal()
Dog.prototype.constructor = Dog
​
let dog1 = new Dog('奶昔', 2)
dog1.colors.push('brown')
let dog2 = new Dog('哈赤', 1)
console.log(dog2) 
// { name: "哈赤", colors: ["black", "white"], age: 1 }
​
console.log(dog1.getName());
console.log(dog2.getName());
寄生时组合继承：
function Animal(name) {
  this.name = name
  this.colors = ['red', 'green']
}
​
Animal.prototype.getName =  function() {
  return this.name
}
​
function Dog(name, age) {
  Animal.call(this, name)
  this.age = age
}
​
Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.constructor = Dog
​
const dog1 = new Dog('kerry', 10)
const dog2 = new Dog('Tom', 1)
​
dog1.colors.push('black')
console.log(dog1);
console.log(dog2);
console.log(dog1.getName());
console.log(dog2.getName());
class实现继承：
class Animal {
    constructor(name) {
        this.name = name
    } 
    getName() {
        return this.name
    }
}
class Dog extends Animal {
    constructor(name, age) {
        super(name)
        this.age = age
    }
}
Promise.resolve：
Promsie.resolve(value) 可以将任何值转成值为 value 状态是 fulfilled 的 Promise，但如果传入的值本身是 Promise 则会原样返回它。

Promise.resolve = function(value) {
    // 如果是 Promsie，则直接输出它
    if(value instanceof Promise){
        return value
    }
    return new Promise(resolve => resolve(value))
}
实现 resolve 静态方法有三个要点:

传参为一个 Promise, 则直接返回它。

传参为一个 thenable 对象，返回的 Promise 会跟随这个对象，采用它的最终状态作为自己的状态。

其他情况，直接返回以该值为成功状态的promise对象。

Promise.resolve = (param) => {
  if(param instanceof Promise) return param;
  return new Promise((resolve, reject) => {
    if(param && param.then && typeof param.then === 'function') {
      // param 状态变为成功会调用resolve，将新 Promise 的状态变为成功，反之亦然
      param.then(resolve, reject);
    }else {
      resolve(param);
    }
  })
}
Promise.reject：
和 Promise.resolve() 类似，Promise.reject() 会实例化一个 rejected 状态的 Promise。但与 Promise.resolve() 不同的是，如果给 Promise.reject() 传递一个 Promise 对象，则这个对象会成为新 Promise 的值。

Promise.reject = function(reason) {
    return new Promise((resolve, reject) => reject(reason))
}
Promise.finally：
Promise.prototype.finally = function(callback) {
  this.then(value => {
    return Promise.resolve(callback()).then(() => {
      return value;
    })
  }, error => {
    return Promise.resolve(callback()).then(() => {
      throw error;
    })
  })
}
Promise.all：
传入的所有 Promsie 都是 fulfilled，则返回由他们的值组成的，状态为 fulfilled 的新 Promise；

只要有一个 Promise 是 rejected，则返回 rejected 状态的新 Promsie，且它的值是第一个 rejected 的 Promise 的值；

只要有一个 Promise 是 pending，则返回一个 pending 状态的新 Promise；

Promise.all = function(promiseArr) {
    let index = 0, result = []
    return new Promise((resolve, reject) => {
        promiseArr.forEach((p, i) => {
            Promise.resolve(p).then(val => {
                index++
                result[i] = val
                if (index === promiseArr.length) {
                    resolve(result)
                }
            }, err => {
                reject(err)
            })
        })
    })
}
Promise.race：
Promise.race 会返回一个由所有可迭代实例中第一个 fulfilled 或 rejected 的实例包装后的新实例。

Promise.race = function(promiseArr) {
    return new Promise((resolve, reject) => {
        promiseArr.forEach(p => {
            Promise.resolve(p).then(val => {
                resolve(val)
            }, err => {
                rejecte(err)
            })
        })
    })
}
Promise.allSettled：
所有 Promise 的状态都变化了，那么新返回一个状态是 fulfilled 的 Promise，且它的值是一个数组，数组的每项由所有 Promise 的值和状态组成的对象；

如果有一个是 pending 的 Promise，则返回一个状态是 pending 的新实例；

Promise.allSettled = function(promiseArr) {
    let result = []
        
    return new Promise((resolve, reject) => {
        promiseArr.forEach((p, i) => {
            Promise.resolve(p).then(val => {
                result.push({
                    status: 'fulfilled',
                    value: val
                })
                if (result.length === promiseArr.length) {
                    resolve(result) 
                }
            }, err => {
                result.push({
                    status: 'rejected',
                    reason: err
                })
                if (result.length === promiseArr.length) {
                    resolve(result) 
                }
            })
        })  
    })   
}
Promise.any：
空数组或者所有 Promise 都是 rejected，则返回状态是 rejected 的新 Promsie，且值为 AggregateError 的错误；

只要有一个是 fulfilled 状态的，则返回第一个是 fulfilled 的新实例；

其他情况都会返回一个 pending 的新实例；

Promise.any = function(promiseArr) {
    let index = 0
    return new Promise((resolve, reject) => {
        if (promiseArr.length === 0) return 
        promiseArr.forEach((p, i) => {
            Promise.resolve(p).then(val => {
                resolve(val)
                
            }, err => {
                index++
                if (index === promiseArr.length) {
                  reject(new AggregateError('All promises were rejected'))
                }
            })
        })
    })
}
防抖：
只执行一次：

function debounce(fn, wait) {
  let event = null
  return function() {
    if(event) {
      clearTimeout(event)
    }
    event = setTimeout(() => {
      fn.call(this)
    }, wait)
  }
}
节流：
控制执行次数

function throttle(fn, wait) {
  let flag = true
  return function() {
    if(flag) {
      setTimeout(() => {
        fn.call(this)
        flag = true
      }, wait)
      flag = false
    }
  }
}
手写bind：
Function.prototype.Lbind = function(thisArg, ...argArray) {
  // 1、 获取到需要真实调用的函数
  var fn = this
​
  // 2、绑定 this
  thisArg = (thisArg !== null && thisArg !== undefined) ? Object(thisArg) : window
​
  // 3、将函数放入 thisArg 进行调用
  function proxyFn (...arg) {
    thisArg.fn = fn
    // 特殊：对两个传入的参数进行合并
    var result = thisArg.fn(...argArray, ...arg)
    delete thisArg.fn
    return result
  }
​
  // 4、返回结果
  return proxyFn
}
手写new：
// 第一种写法：
function objectFactory() {
    var obj = new Object()
    Constructor = [].shift.call(arguments);
    obj.__proto__ = Constructor.prototype;
    var ret = Constructor.apply(obj, arguments);
    
    // ret || obj 这里这么写考虑了构造函数显示返回 null 的情况
    return typeof ret === 'object' ? ret || obj : obj;
};
​
function person(name, age) {
    this.name = name
    this.age = age
}
let p = objectFactory(person, '布兰', 12)
console.log(p)  // { name: '布兰', age: 12 }
​
​
//第二种写法：
function newOperator(ctor, ...args) {
    if(typeof ctor !== 'function'){
      throw 'newOperator function the first param must be a function';
    }
    let obj = Object.create(ctor.prototype);
    let res = ctor.apply(obj, args);
    
    let isObject = typeof res === 'object' && res !== null;
    let isFunction = typoof res === 'function';
    return isObect || isFunction ? res : obj;
};
JSON.parse：
var json = '{"name":"小姐姐", "age":20}';
var obj = (new Function('return ' + json))();
手写push：
Array.prototype.push = function(...items) {
  let O = Object(this);
  let len = this.length >>> 0;
  let argCount = items.length >>> 0;
  // 2 ** 53 - 1 为JS能表示的最大正整数
  if (len + argCount > 2 ** 53 - 1) {
    throw new TypeError("The number of array is over the max value restricted!")
  }
  for(let i = 0; i < argCount; i++) {
    O[len + i] = items[i];
  }
  let newLength = len + argCount;
  O.length = newLength;
  return newLength;
}
手写pop：
Array.prototype.pop = function() {
  let O = Object(this);
  let len = this.length >>> 0;
  if (len === 0) {
    O.length = 0;
    return undefined;
  }
  len --;
  let value = O[len];
  delete O[len];
  O.length = len;
  return value;
}
事件循环：
setTimeout(function() {
  console.log('setTimeout1');

  new Promise((resolve) => {
    resolve()
  }).then(() => {
    new Promise((resolve) => {
      resolve()
    }).then(() => {
      console.log('then4');
    })
    console.log('then2');
  })
})

new Promise((resolve) => {
  console.log('promise1');
  resolve()
}).then(() => {
  console.log('then1');
})

setTimeout(() => {
  console.log('setTimeout2');
}) 

console.log(2);

queueMicrotask(() => {
  console.log('queueMicrotask');
})

new Promise((resolve) => {
  resolve()
}).then(() => {
  console.log('then3');
})

// promise1 2 then1 queueMicrotask then3 setTimeout1 then2 then4 setTimeout2
// codeWhy
// 返回 4 不推迟
// 返回 thenable 推迟一次
// 返回 Promise.resolve(4); 推迟 2次
Promise.resolve().then(() => {
  console.log(0);
  // return Promise.resolve(4);
  // return new Promise((resolve) => {
  //   resolve(4)
  // })
  // return 4
  // return { 
  //   then(resolve) {
  //     resolve(4)
  //   }
  // }
}).then((res) => {
  console.log(res)
})

Promise.resolve().then(() => {
  console.log(1);
}).then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
}).then(() => {
  console.log(5);
}).then(() =>{
  console.log(6);
})

// 大家先思考一下
来点 Promise 面试题：
https://juejin.cn/post/6844904077537574919#heading-1

Promise.resolve(1)
  .then(2)
  .then(Promise.resolve(3))
  .then(console.log)
.then 或者 .catch 的参数期望是函数，传入非函数则会发生值透传。

async function async1 () {
  console.log('async1 start');
  await new Promise(resolve => {
    console.log('promise1')
  })
  console.log('async1 success');
  return 'async1 end'
}
console.log('srcipt start')
async1().then(res => console.log(res))
console.log('srcipt end')
在async1中await后面的Promise是没有返回值的，也就是它的状态始终是pending状态，因此相当于一直在await，await，await却始终没有响应...

typeof('abc')和 typeof 'abc'都是 string, 那么 typeof 是操作符还是函数?
如果是函数那么typeof(typeof)将返回function,可是浏览器缺报错说明不是函数，另外js高程中明确说typeof是一个操作符不是个函数。

splice和slice你能说说有啥用和区别吗:
https://github.com/zcxiaobao/everyday-insist/blob/master/21interview/baseJS/spliceSlice.md

垃圾清理：
https://juejin.cn/post/6981588276356317214

script标签的defer和async属性有什么区别
MDN关于defer和async属性的说明如下：

不设置async和defer属性， 那么脚本会同步下载并执行， 阻塞后续dom的渲染

设置了defer属性。脚本异步加载，加载完后，在触发domContentLoaded事件之前执行。

设置了async属性。脚本异步加载， 加载完后，立即执行，并阻塞后续dom渲染。不影响domContentLoaded事件的触发

同步任务与异步任务区别
同步任务
同步运行，同步任务是存储在栈上的，每次会同步清楚每个同步任务，一次只能运行一个任务，函数调用后需等到函数执行结束，返回执行的结果，才能进行下一个任务，这样就会导致线程阻塞。

异步任务
异步模式，即与同步模式相反，异步任务是以队列的形式来储存的，可以一起执行多个任务，函数调用后不会立即返回执行的结果，如果前一个人物需要等待，可先执行后面的任务，等到前置任务结果返回后再继续回调 例：

举例说明
天气冷了，早上刚醒来想喝点热水暖暖身子，但这每天起早贪黑996，晚上回来太累躺下就睡，没开水啊，没法子，只好急急忙忙去烧水。 现在早上太冷了啊，不由得在被窝里面多躺了一会，收拾的时间紧紧巴巴，不能空等水开，于是我便趁此去洗漱，收拾自己。 洗漱完，水开了，喝到暖暖的热水，舒服啊！ 舒服完，开启新的996之日，打工人出发！ 烧水和洗漱是在同时间进行的，这就是计算机中的异步。 计算机中的同步是连续性的动作，上一步未完成前，下一步会发生堵塞，直至上一步完成后，下一步才可以继续执行。例如：只有等水开，才能喝到暖暖的热水。

20.js文件为什么要放在文件底部：
https://segmentfault.com/a/1190000004292479

async 和 await 原理：
https://juejin.cn/post/6844904096525189128

let const var 区别：
var
存在变量提升

可以重复声明

在函数中使用var声明变量的时候，该变量是局部的

let
不存在变量提升，let声明变量前，该变量不能使用（暂时性死区）

let命令所在的代码块内有效，在块级作用域内有效

let不允许在相同作用域中重复声明，注意是相同作用域，不同作用域有重复声明不会报错

const
const声明一个只读的变量，声明后，值就不能改变

const必须初始化

const并不是变量的值不能改动，而是变量指向的内存地址所保存的数据不得改动

区别
变量提升

ar声明的变量存在变量提升，即变量可以在声明之前调用，值为undefined

let和const不存在变量提升，即它们所声明的变量一定要在声明后使用，否则报错

块级作用域

var不存在块级作用域

let和const存在块级作用域

重复声明

var允许重复声明变量

let和const在同一作用域不允许重复声明变量

修改声明的变量

var和let可以

const声明一个只读的常量。一旦声明，常量的值就不能改变，但对于对象和数据这种引用类型，内存地址不能修改，可以修改里面的值。

箭头函数与普通函数区别
箭头函数没有this，它的this是通过作用域链查到外层作用域的this，且指向函数定义时的this而非执行时。

不可以用作构造函数，不能使用new命令，否则会报错

箭头函数没有arguments对象，如果要用，使用rest参数代替

不可以使用yield命令，因此箭头函数不能用作Generator函数。

不能用call/apply/bind修改this指向，但可以通过修改外层作用域的this来间接修改。

箭头函数没有prototype属性。

map与weakMap的区别：
WeakMap 结构与 Map 结构类似，也是用于生成键值对的集合。

只接受对象作为键名（null 除外），不接受其他类型的值作为键名

键名是弱引用，键值可以是任意的，键名所指向的对象可以被垃圾回收，此时键名是无效的

不能遍历，方法有 get、set、has、delete

set 与 weakSet 区别
WeakSet 结构与 Set 类似，也是不重复的值的集合。

WeakSet 成员都是数组和类似数组的对象，若调用 add() 方法时传入了非数组和类似数组的对象的参数，就会抛出错误。

WeakSet 成员都是弱引用，可以被垃圾回收机制回收，可以用来保存 DOM 节点，不容易造成内存泄漏。

WeakSet 不可迭代，因此不能被用在 for-of 等循环中。

WeakSet 没有 size 属性。

map与object区别
初始化
map 只能通过 new 关键字和构造函数创建

object 可以使用字面量、构造函数、Object.crate的形式创建。

键值
object键值只能使用数组、字符串、符号作为键

map 的键值可以是任意类型

顺序与迭代
object的键值 key 的遍历顺序

首先遍历所有数值键，按照数值升序排列。

其次遍历所有字符串键，按照加入时间升序排列。

最后遍历所有 Symbol 键，按照加入时间升序排列。

map 会维护键值对的插入顺序，因此遍历顺序就是插入顺序

bigInt：
https://juejin.cn/post/6844903974378668039#heading-6

symbol：
https://juejin.cn/post/6844903703242080263

map与object键值key遍历顺序：
object的键值key的遍历顺序
首先遍历所有数值键，按照数值升序排列。

其次遍历所有字符串键，按照加入时间升序排列。

最后遍历所有 Symbol 键，按照加入时间升序排列。

map的键值key的遍历顺序
Map 的遍历顺序就是插入顺序

generator底层原理：
https://juejin.cn/post/6844904096525189128#heading-16

什么是事件委托?
JavaScript高级程序设计: 事件委托就是利用事件冒泡，只指定一个事件处理程序，就可以管理某一类型的所有事件。

事件委托的原理
事件委托也叫事件委派，就是利用 DOM 的冒泡事件流，注册最少的监听器，实现对 DOM 节点的所有子元素进行事件群控。

为什么要使用事件委托
一般来讲，如果一个元素需要注册事件，那我们会直接为此元素注册事件处理程序。那如果有更多的元素，比如一百个，甚至更多；比如我们需要为一百个 li 元素注册想同的点击事件，那就要用循环遍历，注册一百个事件处理程序。在 JS 中，添加到页面上的事件处理程序数量将直接关系到页面的整体运行性能，因为需要不断的与 DOM 节点进行交互，访问 DOM 的次数越多，引起浏览器重绘与重排的次数也就越多，就会延长整个页面的交互就绪时间；同时，对象越多，内容占用就越大。如果要用事件委托，就会将所有的操作放到 JS 程序里面，与 DOM 的操作就只需要交互一次，从而提高性能。

事件委托优点
减少DOM操作，提高性能

随时可以添加子元素，添加的子元素会自动有相应的处理事件

遍历对象属性的方法
ES6 一共有 5 种方法可以遍历对象的属性。

for...in
for...in循环遍历对象自身的和继承的可枚举属性（不含 Symbol 属性）。

Object.keys(obj)
Object.keys 返回一个数组，包括对象自身的（不含继承的）所有可枚举属性（不含 Symbol 属性）的键名。

Object.getOwnPropertyNames(obj)
Object.getOwnPropertyNames 返回一个数组，包含对象自身的所有属性（不含 Symbol 属性，但是包括不可枚举属性）的键名。

Object.getOwnPropertySymbols(obj)
Object.getOwnPropertySymbols 返回一个数组，包含对象自身的所有 Symbol 属性的键名。

Reflect.ownKeys(obj)
Reflect.ownKeys 返回一个数组，包含对象自身的（不含继承的）所有键名，不管键名是 Symbol 或字符串，也不管是否可枚举。

以上的 5 种方法遍历对象的键名，都遵守同样的属性遍历的次序规则。
首先遍历所有数值键，按照数值升序排列。

其次遍历所有字符串键，按照加入时间升序排列。

最后遍历所有 Symbol 键，按照加入时间升序排列。

for ... in 与 Object.keys 区别
for...in循环遍历对象自身的和继承的可枚举属性（不含 Symbol 属性），Object.keys 只遍历对象自身的（不含继承的）所有可枚举属性

1、TCP和UDP的区别
TCP 和UDP都是属于运输层的

1、TCP面向连接（如打电话要先拨号建立连接）;UDP是无连接的，即发送数据之前不需要建立连接

2、TCP提供可靠的服务。也就是说，通过TCP连接传送的数据，无差错，不丢失，不重复，且按序到达;UDP尽最大努力交付，即不保证可靠交付

3、TCP面向字节流，实际上是TCP把数据看成一连串无结构的字节流;UDP是面向报文的；UDP没有拥塞控制，因此网络出现拥塞不会使源主机的发送速率降低（对实时应用很有用，如IP电话，实时视频会议等）

4、每一条TCP连接只能是点到点的;UDP支持一对一，一对多，多对一和多对多的交互通信

5、TCP首部开销20字节;UDP的首部开销小，只有8个字节

2、TCP如何保证可靠传输的
应用数据被分割成 TCP 认为最适合发送的数据块。 

TCP 给发送的每一个包进行编号，接收方对数据包进行排序，把有序数据传送给应用层。 

校验和： TCP 将保持它首部和数据的检验和。这是一个端到端的检验和，目的是检测数据在传输过程中的任何变化。如果收到段的检验和有差错，TCP 将丢弃这个报文段和不确认收到此报文段。 

TCP 的接收端会丢弃重复的数据。 

流量控制： TCP 连接的每一方都有固定大小的缓冲空间，TCP的接收端只允许发送端发送接收端缓冲区能接纳的数据。当接收方来不及处理发送方的数据，能提示发送方降低发送的速率，防止包丢失。TCP 使用的流量控制协议是可变大小的滑动窗口协议。 （TCP 利用滑动窗口实现流量控制） 

拥塞控制： 当网络拥塞时，减少数据的发送。 

ARQ协议： 也是为了实现可靠传输的，它的基本原理就是每发完一个分组就停止发送，等待对方确认。在收到确认后再发下一个分组。 

超时重传： 当 TCP 发出一个段后，它启动一个定时器，等待目的端确认收到这个报文段。如果不能及时收到一个确认，将重发这个报文段。

3、七层网络协议及作用
OSI共七层协议，分别是物理层、数据链路层、网络层、运输层、会话层、表示层和应用层。

![](C:\Users\LiuHao\Desktop\前端\面试题文档\1.png)

4、三次握手和四次挥手
三次握手

TCP三次握手

开始，客户端和服务端都处于 CLOSED 状态。先是服务端主动监听某个端口，处于 LISTEN 状态 

客户端会随机初始化序号（ client_isn ），将此序号置于 TCP 首部的「序号」字段中，同时把 SYN 标志位置为 1 ，表示 SYN 报文。接着把第一个 SYN 报文发送给服务端，表示向服务端发起连接，该报文不包含应用层数据，之后客户端处于 SYN-SENT 状态。 

服务端收到客户端的 SYN 报文后，首先服务端也随机初始化自己的序号（ server_isn ），将此序号填入TCP 首部的「序号」字段中，其次把 TCP 首部的「确认应答号」字段填入 client_isn + 1 , 接着把 SYN和 ACK 标志位置为 1 。最后把该报文发给客户端，该报文也不包含应用层数据，之后服务端处于 SYN-RCVD 状态。 

客户端收到服务端报文后，还要向服务端回应最后一个应答报文，首先该应答报文 TCP 首部 ACK 标志位置为 1 ，其次「确认应答号」字段填入 server_isn + 1 ，最后把报文发送给服务端，这次报文可以携带客户到服务器的数据，之后客户端处于 ESTABLISHED 状态。 

服务器收到客户端的应答报文后，也进入 ESTABLISHED 状态。 

四次挥手

客户端打算关闭连接，此时会发送一个 TCP 首部 FIN 标志位被置为 1 的报文，也即 FIN 报文，之后客户端进 FIN_WAIT_1 状态。 

服务端收到该报文后，就向客户端发送 ACK 应答报文，接着服务端进入 CLOSED_WAIT 状态。 

客户端收到服务端的 ACK 应答报文后，之后进入 FIN_WAIT_2 状态。 

等待服务端处理完数据后，也向客户端发送 FIN 报文，之后服务端进入 LAST_ACK 状态。 

客户端收到服务端的 FIN 报文后，回一个 ACK 应答报文，之后进入TIME_WAIT 状态 

服务器收到了 ACK 应答报文后，就进入了 CLOSED 状态，至此服务端已经完成连接的关闭。 

客户端在经过 2MSL 一段时间后，自动进入 CLOSED 状态，至此客户端也完成连接的关闭。

7、进程和线程的区别
线程：是进程当中的⼀条执⾏流程。同⼀个进程内多个线程之间可以共享代码段、数据段、打开的⽂件等资源，但每个线程各⾃都有⼀套独⽴的寄存器和栈，这样可以确保线程的控制流是相对独⽴的。

进程：编写的代码只是⼀个存储在硬盘的静态⽂件，通过编译后就会⽣成⼆进制可执⾏⽂件，当我们运⾏这个可执⾏⽂件后，它会被装载到内存中，接着 CPU 会执⾏程序中的每⼀条指令，那么这个运⾏中的程序，就被称为「进程（Process）。

从 URL 输入到页面展现到底发生什么？
从URL输入到页面展现到底发生什么？ - 掘金 (juejin.cn)

从输入URL开始建立前端知识体系 - 掘金 (juejin.cn)

字节面试被虐后，是时候搞懂 DNS 了 - 掘金 (juejin.cn)  说实话B站一搜还是很好的

https://www.bilibili.com/video/BV1JZ4y1f7tU?from=search&seid=9229912515884661837&spm_id_from=333.337.0.0

深入理解CSS选择器优先级：
深入理解CSS选择器优先级 - 掘金 (juejin.cn)

你真的了解回流和重绘吗？
你真的了解回流和重绘吗 - 掘金 (juejin.cn)

BFC：
可能是最好的BFC解析了... - 掘金 (juejin.cn)

实现水平垂直居中：
定位+magin负值（知道子元素宽度）：

定位+translate（不知道子元素宽度）：

定位+top/right/bottom/left全0+margin:auto

    .father{
      position: relative;
      width: 200px;
      height: 200px;
      background-color: yellow;
    }
    .child{
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100px;
      height: 100px;
      background-color: red;
      margin: auto;
    }
flex布局：

    .father{
      display: flex;
      width: 200px;
      height: 200px;
      background: yellow;
      align-items:center;
      justify-content:center;
    }
    .child{
      width: 100px;
      height: 100px;
      background-color: red;
    }
flex+margin:auto

    .father{
      display: flex;
      width: 200px;
      height: 200px;
      background: yellow;
    }
    .child{
      margin: auto;
      width: 100px;
      height: 100px;
      background-color: red;
    }
grid布局+margin:auto：

    .father{
      display: grid;
      width: 200px;
      height: 200px;
      background: yellow;
    }
    .child{
      margin: auto;
      width: 100px;
      height: 100px;
      background-color: red;
    }
grid:

    .father {
        display: grid;
        width: 200px;
        height: 200px;
        background-color: yellow;
    }
    .child {
      width: 100px;
      height: 100px;
      background-color: red;
      align-self: center;
      justify-self: center;
    }
table-cell/text-align:center/vertical-align:middle/margin:auto

.father {
    width: 200px;
    height: 200px;
    border: 1px solid red;
    display: table-cell;
    text-align: center;
    vertical-align: middle;
}
.child {
    width: 100px;
    height: 100px;
    background: yellow;
    /* display: inline-block; */
    margin: auto;
}
子元素不知道宽高：
定位+translate：

    .father {
        position: relative;
        width: 200px;
        height: 200px;
        background-color: yellow;
    }
    .child {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: red;
    }
table-cell:

    .father {
        display: table-cell;
        width: 200px;
        height: 200px;
        background-color: yellow;
        vertical-align: middle;
        text-align: center;
    }
    .child {
        display: inline-block;
        background-color: red;
    }
flex布局：

    .father {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 200px;
        height: 200px;
        background-color: yellow;
    }
    .child {
        background-color: red;
    }
    .father {
        display: flex;
        width: 200px;
        height: 200px;
        background-color: yellow;
    }
    .child {
      margin: auto;
      background-color: red;
    }
grid布局：

    .father {
        display: grid;
        width: 200px;
        height: 200px;
        background-color: yellow;
    }
    .child {
      margin: auto;
      background-color: red;
    }
    .father {
        display: grid;
        width: 200px;
        height: 200px;
        background-color: yellow;
    }
    .child {
      background-color: red;
      align-self: center;
      justify-self: center;
    }
面试官：你能实现多少种水平垂直居中的布局（定宽高和不定宽高） - 掘金 (juejin.cn)

flex教程：
Flex 布局教程：语法篇 - 阮一峰的网络日志 (ruanyifeng.com)

2.9 line-height 如何继承？
父元素的 line-height 写了具体数值，比如 30px，则子元素 line-height 继承该值。

父元素的 line-height 写了比例，比如 1.5 或 2，则子元素 line-height 也是继承该比例。

父元素的 line-height 写了百分比，比如 200%，则子元素 line-height 继承的是父元素 font-size * 200% 计算出来的值。

内部的[[class]]：
class Class2 {
  get [Symbol.toStringTag]() {
    return "Class2";
  }
}
console.log(Object.prototype.toString.call(new Class2())); // "[object Class2]"
5、 闭包
根据 MDN 中文的定义，闭包的定义如下：

在 JavaScript 中，每当创建一个函数，闭包就会在函数创建的同时被创建出来。可以在一个内层函数中访问到其外层函数的作用域。

也可以这样说：

闭包是指那些能够访问自由变量的函数。 自由变量是指在函数中使用的，但既不是函数参数也不是函数的局部变量的变量。 闭包 = 函数 + 函数能够访问的自由变量。

1.4 根据 0.1+0.2 ! == 0.3，讲讲 IEEE 754 ，如何让其相等？
建议先阅读这篇文章了解 IEEE 754 ：硬核基础二进制篇（一）0.1 + 0.2 != 0.3 和 IEEE-754 标准。 再阅读这篇文章了解如何运算：0.1 + 0.2 不等于 0.3？为什么 JavaScript 有这种“骚”操作？。 

原因总结：

进制转换 ：js 在做数字计算的时候，0.1 和 0.2 都会被转成二进制后无限循环 ，但是 js 采用的 IEEE 754 二进制浮点运算，最大可以存储 53 位有效数字，于是大于 53 位后面的会全部截掉，将导致精度丢失。

对阶运算 ：由于指数位数不相同，运算时需要对阶运算，阶小的尾数要根据阶差来右移（0舍1入），尾数位移时可能会发生数丢失的情况，影响精度。

解决办法：

转为整数（大数）运算。

function add(a, b) {
  const maxLen = Math.max(
    a.toString().split(".")[1].length,
    b.toString().split(".")[1].length
  );
  const base = 10 ** maxLen;
  const bigA = BigInt(base * a);
  const bigB = BigInt(base * b);
  const bigRes = (bigA + bigB) / BigInt(base); // 如果是 (1n + 2n) / 10n 是等于 0n的。。。
  return Number(bigRes);
}
复制代码
这里代码是有问题的，因为最后计算 bigRes 的大数相除（即 /）是会把小数部分截掉的，所以我很疑惑为什么网络上很多文章都说可以通过先转为整数运算再除回去，为了防止转为的整数超出 js 表示范围，还可以运用到 ES6 新增的大数类型，我真的很疑惑，希望有好心人能解答下。

使用 Number.EPSILON 误差范围。

function isEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}
​
console.log(isEqual(0.1 + 0.2, 0.3)); // true
复制代码
Number.EPSILON 的实质是一个可以接受的最小误差范围，一般来说为 Math.pow(2, -52) 。 

8.3 async/await 和 Promise 的关系
async/await 是消灭异步回调的终极武器。

但和 Promise 并不互斥，反而，两者相辅相成。

执行 async 函数，返回的一定是 Promise 对象。

await 相当于 Promise 的 then。

tru...catch 可捕获异常，代替了 Promise 的 catch。

算法：
LeetcodeTop/frontend.md at master · afatcoder/LeetcodeTop (github.com)

https://github.com/vortesnail/leetcode

网络：
这一次，彻底理解 https 原理 - 掘金 (juejin.cn) 主要是如何加密，在图解HTTP 150页

HTTPS 底层原理，面试官直接下跪，唱征服！

聊聊跨域的原理与解决方法

缓存：
HTTP 缓存 - HTTP | MDN (mozilla.org)

模块化：
前端模块化详解(完整版) （这里面没有讲 umd）
可能是最详细的 UMD 模块入门指南

29、Commonjs 和 ES6 Module的区别
取自阿里巴巴淘系技术前端团队的回答：

1、Commonjs是拷贝输出，ES6模块化是引用输出

2、Commonjs是运行时加载，ES6模块化是编译时输出接口

3、Commonjs是单个值导出，ES6模块化可以多个值导出

4、Commonjs是动态语法可写在函数体中，ES6模块化静态语法只能写在顶层

5、Commonjs的this是当前模块化，ES6模块化的this是undefined

ES6+的新语法：带时间的那种
基础很好？总结了38个ES6-ES12的开发技巧，倒要看看你能拿几分？🐶 - 掘金 (juejin.cn)

花里胡哨：
if(obj == 1 && obj == 2 && obj == 3) {
  console.log('我是傻逼');
}
写一个obj使上面代码成立：

// 第一种：
var obj = {
  value: 1,
  valueOf() {
    return this.value++
  }
}
​
// 第二种：
var obj = {
  value: 1,
  toString() {
    return this.value++
  }
}
​
// 第三种：
var obj = {
  value: 1,
  [Symbol.toPrimitive]() {
    return this.value++
  }
}
​
// 第四种：
var obj = [1,2,3]
obj.join = obj.shift
​
// 第五种：
var val = 0;
Object.defineProperty(window, 'obj', { // 这里要window，这样的话下面才能直接使用a变量去 ==
    get: function () {
        return ++val;
    }
});
​
if(obj == 1 && obj == 2 && obj == 3) {
  console.log('我是傻逼');
}
39、JS中如何将页面重定向到另一个页面？
1、使用 location.href：window.location.href =“www.onlineinterviewquestions.com/”

2、使用 location.replace： window.location.replace(" www.onlineinterviewquestions.com/;");

一些js中API的总结-主要看后几个（43开始）：
「万字总结」熬夜总结50个JS的高级知识点，全都会你就是神！！！ - 掘金 (juejin.cn)

如何串行执行多个Promise：
https://juejin.cn/post/6844903801296519182

事件冒泡和事件捕获：
https://juejin.cn/post/6844903834075021326

实现一个简单的双向绑定：
Object.defineProperty和Proxy的区别：

https://juejin.cn/post/6844903710410162183

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <span id="container">1</span>
  <button id="button">点击加 1</button>
  <input id="input" type="text">
  <script>
    const obj = {
      value: 1,
      input: ''
    }
    let spanValue = 1
    Object.defineProperty(obj, 'value', {
      get() {
        return spanValue
      },
      set(newVal) {
        spanValue = newVal
        container.innerHTML = newVal
      }
    })
    Object.defineProperty(obj, 'input', {
      set(newVal) {
        container.innerHTML = newVal
      }
    })
    button.addEventListener('click', function() {
      obj.value++
    })
    input.addEventListener('input', function(e) {
      obj.input = this.value
    })
  </script>
</body>
</html>
HTTP1/HTTP2/HTTP3：
传送门 ☞ #解读 HTTP1/HTTP2/HTTP3

js高频知识点：(常来看看)
js 高频知识点-目录 | 高级前端进阶 (daijl.cn)

~ 操作符的作用？
~ 返回 2 的补码，并且 ~ 会将数字转换为 32 位整数，因此我们可以使用 ~ 来进行取整操作。

~x 大致等同于 -(x+1)。

深入理解浏览器缓存机制：比较好！
深入理解浏览器的缓存机制

谈谈前端的安全知识？XSS、CSRF，以及如何防范。
寒冬求职之你必须要懂的Web安全

50道css面试题：
https://segmentfault.com/a/1190000013325778

Set和Map：
https://juejin.cn/post/6844903855302377486

神三元的灵魂js中：三元同学的文章非常精彩啦，多看看吧
https://juejin.cn/post/6844903986479251464#heading-39

神三元的灵魂js上：
https://juejin.cn/post/6844903974378668039

神三元的灵魂js下：是真的叼！真的是绝绝子！
https://juejin.cn/post/6844904004007247880#heading-36

1. [] == ![]结果是什么？为什么？
解析:

== 中，左右两边都需要转换为数字然后进行比较。

[]转换为数字为0。

![] 首先是转换为布尔值，由于[]作为一个引用类型转换为布尔值为true,

因此![]为false，进而在转换成数字，变为0。

0 == 0 ， 结果为true

2. JS中类型转换有哪几种？
JS中，类型转换只有三种：

转换成数字

转换成布尔值

转换成字符串

转换具体规则如下:

注意"Boolean 转字符串"这行结果指的是 true 转字符串的例子

img

V8如何执行js代码：第26篇：
https://juejin.cn/post/6844904004007247880#26

5.关于process.nextTick的一点说明（又get到了一个知识点）
process.nextTick 是一个独立于 eventLoop 的任务队列。

在每一个 eventLoop 阶段完成后会去检查这个队列，如果里面有任务，会让这部分任务优先于微任务执行。

能不能简单实现一下node中的回调函数机制？
好家伙，竟然是熟悉的发布订阅模式，学到了学到了！https://juejin.cn/post/6844904004007247880#heading-35

HTTP灵魂之问：三元牛逼
https://juejin.cn/post/6844904100035821575

TCP协议灵魂之问：还是三元牛逼
https://juejin.cn/post/6844904070889603085#heading-0

来一道深度优先遍历：
fn([['a', 'b'], ['n', 'm'], ['0', '1']]) 
=> ['an0', 'am0', 'an1', 'am1', 'bn0', 'bm0', 'bn1', 'bm0']

const fn = (arr) => {
  const length = arr.length
  const res = []
  const dfs = (items, str = '', index = 1) => {
    if (index > length) {
      res.push(str)
    } else {
      for (const item of items) {
        dfs(arr[index], str + item, index + 1)
      }
    }
  }
  dfs(arr[0])
  
  return res
}
来一道字节题目：
class U {
  constructor() {
    this.tasks = []
    setTimeout(() => {
      this.next()
    })
  }
  next() {
    const task = this.tasks.shift()
    task && task()
  }
  console(str) {
    const task = () => {
      console.log(str)
      this.next()
    }
    this.tasks.push(task)
    return this
  }
  setTimeout(delay) {
    const task = () => {
      setTimeout(() => {
        this.next()
      }, delay)
    }
    this.tasks.push(task)
    return this
  }
}

const u = new U()

u.console('breakfast').setTimeout(3000).console('lunch').setTimeout(3000).console('dinner')
flex布局：
flex真的很重要！

https://www.ruanyifeng.com/blog/2015/07/flex-grammar.html

三元的浏览器灵魂之问：
https://juejin.cn/post/6844904021308735502

一个牛逼的博主：
https://juejin.cn/post/6987549240436195364#comment

让对象实现可迭代：
var obj = {
  name: 'H2O',
  age: 100,
  address: 'xxxxx'
}
​
obj[Symbol.iterator] = function() {
  let index = 0
  let keys = Object.keys(this)
  let self = this
  
  return {
    next() {
      if(index < keys.length) {
        return {
          value: self[keys[index++]],
          done: false
        }
      } else {
        return {
          value: undefined,
          done: true
        }
      }
    }
  }
}
​
const I = obj[Symbol.iterator]()
console.log(I.next());
console.log(I.next());
console.log(I.next());
console.log(I.next());
for(let value of obj) {
  console.log(value);
}
用 Set 实现合集，交集，差集：

const arr1 = [1,2,3,4,5,6]
const arr2 = [3,4,5,6,7,8,9,10]

const bingji = (arr1, arr2) => {
  return [...new Set(arr1.concat(arr2))]
}

const jiaoji = (arr1, arr2) => {
  const temp = new Set(arr1)
  return Array.from(new Set(arr2)).filter(item => {
    return temp.has(item)
  })
} 

const chaji = (arr1, arr2) => {
  const temp1 = new Set(arr1)
  const temp2 = new Set(arr2)
  const res = []
  for(let item of temp1) {
    !temp2.has(item) && res.push(item)
  }
  return res
}

console.log(bingji(arr1, arr2));
console.log(jiaoji(arr1, arr2));
console.log(chaji(arr1, arr2));
双飞翼布局：
方法一：父盒子绝对定位+padding+左右子盒子左右定位

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    .father {
      height: 400px;
      background-color: pink;
      position: relative;
      padding: 0 200px;
    }
    .left,.right {
      width: 200px;
      height: 300px;
      background-color: yellow;
      position: absolute;
      top: 0;
    }
    .left {
      left: 0;
    }
    .right {
      right: 0;
    }
    .center {
      background-color: blue;
      height: 350px;
    }
    </style>
</head>
<body>
  <div class="father">
    <div class="left"></div>
    <div class="center"></div>
    <div class="right"></div>
  </div>
</body>
</html>
方法二：flex布局

父盒子flex，左右子盒子固定宽高，中间盒子flex: 1即可

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    * {
      margin: 0;
      padding: 0;
    }
​
    .father {
      display: flex;
      background-color: pink;
      height: 600px;
    }
    .left, .right {
      width: 200px;
      height: 400px;
      background-color: yellow;
    }
    .center {
      flex: 1;
      background-color: blue;
    }
  </style>
</head>
<body>
  <div class="father">
    <div class="left"></div>
    <div class="center"></div>
    <div class="right"></div>
  </div>
</body>
</html>
方法3：利用bfc块级格式化上下文，实现两侧固定中间自适应

左右固定宽高，进行浮动。中间overflow：hidden，center放最后一个孩子位置

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    * {
      margin: 0;
      padding: 0;
    }
​
    .father {
      background-color: pink;
      height: 600px;
    }
    .left, .right {
      width: 200px;
      height: 400px;
      background-color: yellow;
    }
    .left {
      float: left;
    }
    .right {
      float: right;
    }
    .center {
      overflow: hidden;
      background-color: blue;
      height: 300px;
    }
  </style>
</head>
<body>
  <div class="father">
    <div class="left"></div>
    <div class="right"></div>
    <div class="center"></div>
  </div>
</body>
</html>
3.23. 解析字符串中的数字和将字符串强制类型转换为数字的返回结果都是数 字，它们之间的区别是什么?
解析允许字符串（如 parseInt() ）中含有非数字字符，解析按从左到右的顺序，如果遇 到非数字字符就停止。而转换（如 Number ()）不允许出现非数字字符，否则会失败并返回 NaN

3.33. 如何实现数组的随机排序：
// 生成随机数大于等于 min 小于 max的随机数字：
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// 生成随机的下标，然后放入新数组：
function randomSort(arr) {
  var result = [];
  while (arr.length > 0) {
    var randomIndex = Math.floor(Math.random() * arr.length);
    result.push(arr[randomIndex]);
    arr.splice(randomIndex, 1);
  }
  return result;
}

// 
function randomSort(arr) {
  var index,
  randomIndex,
  temp,
  len = arr.length;

  for (index = 0; index < len; index++) {
    randomIndex = Math.floor(Math.random() * (len - index)) + index;
    temp = arr[index];
    arr[index] = arr[randomIndex];
    arr[randomIndex] = temp;
    // 解构赋值：
    //[array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  
  return arr;
}
console.log(undefined - 2); // NaN
IP协议的首部结构：
版本号

首部长度

服务类型

总长度

标识

标志

片偏移

生成时间

协议

头部校验和

源IP地址

目标IP地址

选项

数据部分

Ipv6

基本首部、扩展首部1-N，数据

字节的一些面经：
https://www.nowcoder.com/discuss/180861?type=0&order=0&pos=22&page=1&source_id=discuss_tag_nctrack&channel=-1&ncTraceId=5b40e987a6dd491f947880d831aa201a.236.16460153197313909&gio_id=AC388471007A6F340785B33E009EC12E-1646015317133

牛逼:
https://www.nowcoder.com/discuss/845491
前端模块化：
前端模块化：CommonJS,AMD,CMD,ES6 - 掘金 (juejin.cn)

document.write和innerHTML的区别：
简述document.write和 innerHTML的区别百度笔试题牛客网 (nowcoder.com)

面经：

https://www.nowcoder.com/discuss/737366?type=0&order=0&pos=30&page=2&source_id=discuss_tag_nctrack&channel=-1&ncTraceId=18cce24d5ebe4985a4cfabc8fd5b0053.648.16460364984829668&gio_id=AC388471007A6F340785B33E009EC12E-1646015317133

原码和反码和补码：

// 正数：
原码 === 反码 === 补码
// 负数：
反码 === 除符号位其他位按位取反
补码 === 反码 + 1

例如 [+7]原 = 00000111，[+7]反 = 00000111，[+7]补 = 00000111；
[-7]原 = 10000111，[-7]反 = 11111000，[-7]补 = 11111001
toPrecision 和 toFixed 和 Math.round 的区别：
// toPrecision 用于处理精度，精度是从左至右第一个不为 0 的数开始数起。
var numObj = 5.123456;
console.log("numObj.toPrecision()  is " + numObj.toPrecision());  //输出 5.123456
console.log("numObj.toPrecision(5) is " + numObj.toPrecision(5)); //输出 5.1235
console.log("numObj.toPrecision(2) is " + numObj.toPrecision(2)); //输出 5.1
console.log("numObj.toPrecision(1) is " + numObj.toPrecision(1)); //输出 5
// 注意：在某些情况下会以指数表示法返回
console.log((1234.5).toPrecision(2)); // "1.2e+3"

//toFixed 是对小数点后指定位数取整，从小数点开始数起。
var numObj = 12345.6789;

numObj.toFixed();         // 返回 "12346"：进行四舍六入五看情况，不包括小数部分
numObj.toFixed(1);        // 返回 "12345.7"：进行四舍六入五看情况

numObj.toFixed(6);        // 返回 "12345.678900"：用0填充
(1.23e+20).toFixed(2);    // 返回 "123000000000000000000.00"
(1.23e-10).toFixed(2);    // 返回 "0.00"
2.34.toFixed(1);          // 返回 "2.3"
2.35.toFixed(1)           // 返回 '2.4'. Note it rounds up
2.55.toFixed(1)           // 返回 '2.5'. Note it rounds down - see warning above
-2.34.toFixed(1);         // 返回 -2.3 （由于操作符优先级，负数不会返回字符串）
(-2.34).toFixed(1);       // 返回 "-2.3" （若用括号提高优先级，则返回字符串）


Math.round 是将一个数字四舍五入到一个整数。
weakMap和weakSet：
[通过JavaScript垃圾回收机制来理解WeakSet/WeakMap中对象的弱引用 - 简书 (jianshu.com)](https://www.jianshu.com/p/c99dd69a8f2c

Map和Object的对比：
Map - JavaScript | MDN (mozilla.org)

Map	Object
意外的键	Map 默认情况不包含任何键。只包含显式插入的键。	一个 Object 有一个原型, 原型链上的键名有可能和你自己在对象上的设置的键名产生冲突。备注：虽然 ES5 开始可以用 Object.create(null) 来创建一个没有原型的对象，但是这种用法不太常见。
键的类型	一个 Map的键可以是任意值，包括函数、对象或任意基本类型。	一个Object 的键必须是一个 String 或是Symbol。
键的顺序	Map 中的 key 是有序的。因此，当迭代的时候，一个 Map 对象以插入的顺序返回键值。	一个 Object 的键是无序的备注：自ECMAScript 2015规范以来，对象确实保留了字符串和Symbol键的创建顺序； 因此，在只有字符串键的对象上进行迭代将按插入顺序产生键。
Size	Map 的键值对个数可以轻易地通过size 属性获取	Object 的键值对个数只能手动计算
迭代	Map 是 iterable 的，所以可以直接被迭代。	迭代一个Object需要以某种方式获取它的键然后才能迭代。
性能	在频繁增删键值对的场景下表现更好。	在频繁添加和删除键值对的场景下未作出优化。
恶心心：
function Foo() {
  getName = function() {
    console.log(1);
  };
  return this;
}
Foo.getName = function() {
  console.log(2);
};
Foo.prototype.getName = function() {
  console.log(3);
};
var getName = function() {
  console.log(4);
};
function getName() {
  console.log(5);
}

Foo.getName(); // 2
getName(); // 4
Foo().getName(); //1
getName(); // 1
new Foo.getName(); // 2
new Foo().getName(); // 3
new new Foo().getName(); // 3
一道考察运算符优先级的JavaScript面试题◔ ‸◔? - SegmentFault 思否

总结：括号最牛逼，. [] new带参 函数调用其次，new不带参最后

MDN：运算符优先级 - JavaScript | MDN (mozilla.org)

进程间通信方式：
(93条消息) 进程间8种通信方式详解在努力！-CSDN博客进程间通信方式

听说你很会玩for循环？那从var到async/await玩死你！
https://juejin.cn/post/6844903474212143117

隐藏页面中的某个元素的方法有哪些？
https://juejin.cn/post/6844903874705227789#heading-24

JSON.parse(JSON.stringify(obj)) 是最简单的实现方式，但是有一些缺陷：
对象的属性值是函数时，无法拷贝。

原型链上的属性无法拷贝

不能正确的处理 Date 类型的数据

不能处理 RegExp

会忽略 symbol

会忽略 undefined

预编译：看着一篇就够了！
https://github.com/zcxiaobao/everyday-insist/blob/master/21interview/deepJS/precompiler.md

css实现进度条：
https://juejin.cn/post/7033668584026931214

发布订阅模式和观察者模式：
https://juejin.cn/post/7055441354054172709

我的理解是：观者者模式是只要观察的东西变了，就立马通知更新（VueX），发布订阅模式是只有你订阅的东西变了才会通知更新，如果其他东西变了但是你没有订阅，那么也不会通知你更新的（Vue中的事件通信emit on）

这题也是没谁了。。。无语住了。。。考验return后面。。。
function foo1() 
{
 return {
     bar: "hello"
 };
}
 
function foo2()
{
 return
 {
     bar: "hello"
 };
}
var a=foo1();
var b=foo2();
console.log(a) //Object {bar: "hello"}
console.log(b) //underfind
//仔细看就知道了
CSS面试题：
https://juejin.cn/post/6844904185847087111

Reflect：主要是概述
Reflect - ES6 教程 - 网道 (wangdoc.com)

27. Html5中datalist是什么：
<datalist>标签，用来定义选项列表，与input元素配合使用钙元素，来定义input可能的值。

datalist及其选项不会被显示出来，他仅仅是合法的输入列表值。

  <input id="fruits" list="fruit" />
  <datalist id="fruit">
    <option value="apple">
    <option value="orange">
    <option value="banana">
  </datalist>
拿捏浮动：
https://juejin.cn/post/6844903504545316877

静态方法和原型方法：
https://juejin.cn/post/6997672120285134861

25.一个高度自适应的div，里面有两个div，一个高度100px，希望另一个填满剩下的高度问题怎么解决？
方案一： .content { height: calc(100%-100px); }

方案二：.container { position:relative; } .content { position: absolute; top: 100px; bottom: 0; }

方案三：.container { display:flex; flex-direction:column; } .content { flex:1; }

CSS：
https://juejin.cn/post/6844904185847087111

Sass：
https://juejin.cn/post/6971458017267187719

21种方式进行性能优化：
https://juejin.cn/post/6904517485349830670

v-model：浅析原理
<template>
  <div class="home">
​
    <div class="top">
      <input type="text" id="input" :value="returnValue" @input="returnValue = $event.target.value">
      <label for="input">{{returnValue}}</label>
    </div>
  </div>
</template>
进制转化：

Function 和 Object 原型之说：
https://blog.csdn.net/weixin_41784648/article/details/108252962、

特殊记忆：Function.protype 不是一个对象，而是一个函数，并且 Function.prototype._proto__指向Object.prototype，且Function._proto__等于Function.prototype

image-20220313180726031

offsetHeight scrollHeight clientHeight有什么区别？
offsetHeight：border + padding + content

clientHeight：padding + content

scrollHeight：padding + 实际内容尺寸

leetcode 原子数量
一个牛逼的博主：https://www.processon.com/view/link/61c53fb31efad45a2b42afd9#map 真 ™ 顶