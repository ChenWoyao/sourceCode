import { renderComponent } from '../react-dom/render'
import { enqueueSetState } from '../react/set-state-queue'

class Component {
    constructor( props = {} ) {
        // react源码这里使用symbol做处理的，解决了xss的扩展脚本攻击。
        this.isReactComponent = true;
        this.state = {};
        this.props = props;
    }

    setState( stateChange ) {
        // Object.assign( this.state, stateChange );
        // renderComponent( this );
        enqueueSetState( stateChange, this );
    }
}

export default Component;
