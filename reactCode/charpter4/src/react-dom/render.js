import { diffNode, diff } from "./diff";

export function renderComponent( component ) {

    let base;

    const renderer = component.render();

    if ( component.base && component.componentWillUpdate ) {
        component.componentWillUpdate();
    }

    base = diffNode( component.base, renderer );

    if ( component.base ) {
        if ( component.componentDidUpdate ) component.componentDidUpdate();
    } else if ( component.componentDidMount ) {
        component.componentDidMount();
    }

    component.base = base;
    base._component = component;

}

function render(vnode, container, dom) {
    return diff(dom, vnode, container);
}

export default render;
