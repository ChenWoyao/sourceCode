// jsx 转成虚拟dom.
// 通过这个将jsx转为虚拟dom, 所以需要引入import React from 'react'
const React = {
    createElement
}
const ReactDOM = {
    render: (vnode, container) => {
        container.innerHTML = "";
        return render(vnode, container);
    },
};

function render(vnode, container) {
    if (typeof vnode === "string") {
        const textNode = document.createTextNode(vnode);
        return container.appendChild(textNode);
    }
    const dom = document.createElement(vnode.tag);
    if (vnode.attrs) {
        Object.keys(vnode.attrs).forEach((key) => {
            const value = vnode.attrs[key];
            setAttribute(dom, key, value);
        });
    }
    vnode.children.forEach((child) => render(child, dom));
    return container.appendChild(dom);
}

function setAttribute(dom, name, value) {
    if (name === "className") name = "class";
    if (/on\w+/.test(name)) {
        name = name.toLowerCase();
        dom[name] = value || "";
        // 如果属性名是style，则更新style对象
    } else if (name === "style") {
        if (!value || typeof value === "string") {
            dom.style.cssText = value || "";
        } else if (value && typeof value === "object") {
            for (let name in value) {
                // 可以通过style={ width: 20 }这种形式来设置样式，可以省略掉单位px
                dom.style[name] =
                    typeof value[name] === "number"
                        ? value[name] + "px"
                        : value[name];
            }
        }
        // 普通属性则直接更新属性
    } else {
        if (name in dom) {
            dom[name] = value || "";
        }
        if (value) {
            dom.setAttribute(name, value);
        } else {
            dom.removeAttribute(name);
        }
    }
}

function createElement( tag, attrs, ...children ) {
    return {
        tag,
        attrs,
        children,
        // name: children[0]
    }
}

// function Test() {
//     return (<div>test</div>)
// }
function tick() {
    const element = (
        <div>
            <h1>Hello, world!</h1>
            <h2>It is {new Date().toLocaleTimeString()}.</h2>
            {/* <Test/> */}
        </div>
    );
    // console.log('element', element, typeof element)
    // 這裡的babelrc中的transform-react-jsx插件，會找出jsx，並将它转成React.createElement的格式
    ReactDOM.render(element, document.getElementById("root"));
}

setInterval(tick, 1000);
