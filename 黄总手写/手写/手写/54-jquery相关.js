// 链式调用
$("#mybtn").css("width","100px")
            .css("height","100px")
            .css("background","red");


// 链式调用原理

var MyJQ = function(){
    
}
MyJQ.prototype = {
    css:function(){
        console.log("设置css样式");
        return this;
    },
    show:function(){
        console.log("将元素显示");
        return this;
    },
    hide:function(){
        console.log("将元素隐藏");
    }
};
var myjq = new MyJQ();
myjq.css().css().show().hide();
