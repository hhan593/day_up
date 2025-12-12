/**
 * @description 节流函数
 * @author 加油！！！
 */

function thorttle1(fn,wait){
  let timer = null;
  return function fns(...arg){
    const context = this;
    if(timer) return ;
    timer = setTimeout(fn.apply(context,arg),wait)
  }
}

function thorttle2(fn,wait){
  let start = Date()
  return function fns(...arg){
    const context = this;
    let newTime = Date();
    if(newTime - start > wait){
      start = newTime;
      fn.apply(context,arg)
    }
  }
}

function thorttle3(fn,wait){
  let start = Date()
  let timer = null;
  return function fns(...arg){
    const context = this;
    let newTime = Date();
    if(newTime - start < wait){
      if(timer) clearTimeout(timer);
      timer = setTimeout(()=>{
        start = newTime;
        fn.apply(context,arg);
      },wait);
    }else{
      start = newTime;
      fn.apply(context,arg);
    }
  }
}