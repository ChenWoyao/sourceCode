import React, { useContext, createContext, Component } from "react";

const Ctx = createContext({
    model: {},
    changeModel: () => {}
});

class Form extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            model: props.model || {},
        };
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.model) {
            this.setState({
                model: nextProps.model,
            });
        }
    }
    changeModel = (name, value) => {
        this.setState({
            model: { ...this.state.model, [name]: value },
        });
    };
    onSubmit = () => {
        console.log(this.state.model);
    };
    render() {
        return (
            <Ctx.Provider
                value={{
                    model: this.props.model || this.state.model,
                    changeModel: this.changeModel,
                }}
            >
                {this.props.children}
                <button onClick={this.onSubmit}>提交</button>
            </Ctx.Provider>
        );
    }
}

function proxyHoc(WrappedComponent) {
    return class extends Component {
        static contextType = Ctx

        onChange = (event) => {
            const { changeModel } = this.context;
            const { onChange } = this.props;
            const { v_model } = this.props;
            changeModel(v_model, event.target.value);
            if (typeof onChange === "function") {
                onChange(event);
            }
        };

        render() {
            const { model } = this.context;
            const { v_model } = this.props;
            return (
                <WrappedComponent
                    {...this.props}
                    value={model[v_model]}
                    onChange={this.onChange}
                />
            );
        }
    };
}


class Ipt extends Component {
    render() {
        return <input {...this.props}></input>;
    }
}

const Input = proxyHoc(Ipt)

export default class extends Component {
    render() {
        return (
            <Form>
                <Input v_model="name"></Input>
                <Input v_model="pwd"></Input>
            </Form>
        );
    }
}
