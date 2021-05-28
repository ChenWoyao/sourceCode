import React from "react";
import ReactDOM from "react-dom";
import App from "../../App";


function render() {
    cursor = 0;
    ReactDOM.render(<App />, document.getElementById("root"));
}

const log = console.log.bind(console);
let memoizedState = [];
let cursor = 0;
function useState(initialValue) {
    memoizedState[cursor] = memoizedState[cursor] || initialValue;
    const currentCursor = cursor;
    function setState(newState) {
        memoizedState[currentCursor] = newState;
        render();
    }
    return [memoizedState[cursor++], setState];
}

function useEffect(callback, depArray) {
    const hasNoDeps = !depArray;
    const deps = memoizedState[cursor];
    const hasChangedDeps = deps
        ? !depArray.every((el, i) => el === deps[i])
        : true;
    if (hasNoDeps || hasChangedDeps) {
        callback();
        memoizedState[cursor] = depArray;
    }
    cursor++;
}

const Home = () => {
    const [count, setCount] = useState(0);
    const [name, setName] = useState("woyao");

    useEffect(() => {
        console.log("count", count);
    }, []);

    useEffect(() => {
        console.log("name", name);
    }, []);

    log("memoizedState", memoizedState);
    return (
        <div>
            <h1>{name}</h1>
            <input
                type="text"
                onChange={(e) => {
                    setName(e.target.value);
                }}
            />
            <div>{count}</div>
            <button
                onClick={() => {
                    setCount(count + 1);
                }}
            >
                点击
            </button>
        </div>
    );
};

export default Home;
