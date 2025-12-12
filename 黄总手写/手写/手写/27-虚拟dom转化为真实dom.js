let vnode = { 
    tag: 'DIV', 
    attrs: { 
        id:'app' 
    }, 
    children: [
        { 
            tag: 'SPAN', 
            children: [ 
                { 
                    tag: 'A', 
                    children: [] 
                } 
            ] 
        }, 
        { 
            tag: 'SPAN', 
            children: [ 
                { 
                    tag: 'A', 
                    children: [] 
                }, 
                { 
                    tag: 'A', 
                    children: [] 
                } 
            ] 
        } 
    ] 
}
//  把上诉虚拟Dom转化成下方真实Dom 
// <div id="app"> 
//     <span> 
//         <a></ a> 
//     </span> 
//     <span> 
//         <a></ a> 
//         <a></ a> 
//     </span> 
// </div>

// 1. 
function _render(vnode){
    if(typeof vnode === 'number'){
        vnode = String(vnode)
    }
    if(typeof vnode === "string"){
        return document.createTextNode(vnode)
    }
    const dom = document.createElement(vnode.tag)
    if(vnode.attrs){
        // 遍历属性
        Object.keys(vnode.attrs).forEach((key) => {
            const value = vnode.attrs[key];
            dom.setAttribute(key, value);
        });
    }

    // 子数组进行递归操作
    vnode.children.forEach((child) => {
        dom.appendChild(_render(child))
    })
}

