import React from './react'
import ReactDOM from './react-dom'


class Counter extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            num: 1
        }
    }
    componentWillMount() {
        console.log('componentWillMount')
    }
    componentDidMount() {
        console.log('componentDidMount')
    }
    componentWillUpdate() {
        console.log('componentWillUpdate')
    }
    componentDidUpdate() {
        console.log('componentDidUpdate')
    }
    componentWillReceiveProps() {
        console.log('componentWillReceiveProps')
    }
    componentWillUnmount() {
        console.log('componentWillUnmount')
    }
    onClick() {
        this.setState({
            num: this.state.num + 1
        })
    }

    render() {
        return (
            <div>
                <h1>count: { this.state.num }</h1>
                <button onClick={ () => this.onClick()}>add</button>
            </div>
        )
    }
}

const Test = (props) => {
    return (
        <div>
            <h1>hello, {new Date().toLocaleTimeString() }</h1>
            <Counter/>
        </div>
    )
}

ReactDOM.render(
    <Test />,
    document.getElementById( 'root' )
)

