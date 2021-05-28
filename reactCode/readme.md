本文参考链接： https://juejin.cn/post/6844903593078685709

1. 第一个通过babel实现jsx转成react fiber,
   并实现了render函数将react fiber转成html
   @babel/plugin-transform-react-jsx将函数，类，dom节点转成自己定义的reactElement形式。对于文本节点，则不处理，是什么类型就是什么类型(stirng,number,boolean,undefiend,null)


2. 处理函数式组件和类声明组件怎么转成reactElement, 并实现了生命周期函数
   babel->jsx->reactElement->_render(element, container)->_render(element)
   关于_render函数编译reactElement的处理：
   string->docuement.createTextNode(node)
   function(类组件，函数式组件)function/class -> createComponent(vnode.tag, vnode.attrs):component -> setComponentProps(component, vnode.attrs) -> component.base
   dom->document.createElement->setAttribute->深度遍历

   关于createComponent接受两个参数：vnode.tag, props
   如果是class组件，就返回class的实例
   如果是function组件，就返回自己定义的Component实例，并给实例添加一个render方法，让它返回函数的return结果。return的结果是jsx,通过babel转义后，用_render函数编译成html

   这里实现了下面的生命周期函数，其实就是在renderComponent和setComponentProps的时候，类声明有下面的方法就执行下面的方法。
   然后加入一些限制调节，比如还没有_render的时候，就是没有第一次渲染的时候
   对象没有base尚需经
   componentWillMount
   componentDidMount
   componentWillUpdate
   componentDidUpdate
   componentWillReceiveProps
   componentWillUnmount

3. diff算法
   之前的组件的renderComponent是将整个reactElement重新渲染生成的dom树替换掉以前的
   现在通过diff,让它不要再傻乎乎地重新渲染整个DOM树，而是找出真正变化的部分。
   这里的diff算法原理是:直接对比虚拟DOM和真实DOM，这样就不需要额外保存上一次渲染的虚拟DOM，并且能够一边对比一边更新
   这里需要给reactElement添加一个key属性，否则diff的时候，不知道虚拟dom和哪个原生dom进行diff.
   本次的diff分为
   node diff: {
       虚拟dom 文本类型节点，直接替换文本的内容
       虚拟dom 组件类型，component diff
       虚拟dom HTMLHeadingElement类型
   }
   component diff: 组件名没有发生变化就更新组件属性,进行node diff。
   发生了变化删除原来的组件, 创建新的组件,更新组件属性,进行node diff。

   同节点diff完以后，对同节点的子层进行diff
   children diff(同组节点diff):{
      虚拟dom节点的数组中一次遍历，
      首先查找节点在当前的dom节点数组中是否有同个key的节点
      没有就查找是否有特别相似的节点
      依旧没有就返回null否则返回找到的节点
      对当前的虚拟dom节点和找到的节点进行diff检查是否有更新
      如果有更新或者位置变化就进行下面的操作：
        如果更新前的对应位置为空，说明此节点是新增的
        如果更新后的节点和更新前对应位置的下一个节点一样，说明当前位置的节点被移除了
        否则将它插到当前child的前面
   }

    渲染流程：render(vnode:component, container:HTMLElement, null:dom/null)
    ->diff(null, vnode, container)->diffNode(null, vnode)
    -> {
        1.如果vnode.tag是string(dom): 根据vnode.tag创建dom
        ，更新属性 -> diffChildren(newDom, vnode.children)
        2.如果vonde.tag是constructor function(Component):diffComponent(null, vnode)->createComponent->setComponentProps->renderComponent
        ->diffNode(component.base, component.render())
        ...->dom
    }

   (
       关于react diff算法的规则：
       tree diff: 两棵树只会对同一层次的节点进行比较，新树没有老树的节点就把老树的节点子树删除。反之新建节点子树
       element diff(同一层级的同组子节点, 添加唯一 key 进行区分):
       nextIndex = 0: new Level遍历的下标位置
       oldLevel: [doma(key=a),domb(key=b),domc(key=c),domd(key=d)], lastIndex=0: 记录oldLevel中遍历到的下标
       newLevel: [domb(key=b),doma(key=a),domd(key=d),domc(key=c)]
       step1: newLevel中domb在oldLevel的下标pos为1, 1 > lastIndex 不偏移。
              那么domb在oldLevel的坐标就是0,即nextIndex
              lastIndex=max(pos,lastIndex)=1, nextIndex++
       step2: newLevel中doma在oldLevel的下标pos为0, 0 < lastIndex 需要偏移。
              那么domb在oldLevel的坐标就是1,即nextIndex
              lastIndex=max(pos,lastIndex)=1, nextIndex++,
       step3: newLevel中domd在oldLevel的下标pos为3, 3 > lastIndex 不偏移。
              那么domd在oldLevel的坐标就是2,即nextIndex
              lastIndex=max(pos,lastIndex)=3, nextIndex++,
       step4: newLevel中domc在oldLevel的下标pos为2, 2 < lastIndex 需要偏移。
              那么domc在oldLevel的坐标就是3,即nextIndex
              lastIndex=max(pos,lastIndex)=3, nextIndex++,
       原理在新level中开始遍历，找到当前节点在老level中的位置。如果位置大于目前的索引就不需要偏移，否则偏移。位置就是新集合中的下标

       nextIndex = 0: new Level遍历的下标位置
       oldLevel: [doma(key=a),domb(key=b),domc(key=c),domd(key=d)], lastIndex=0: 记录oldLevel中遍历到的下标
       newLevel: [domb(key=b),dome(key=e),domc(key=c),doma(key=a)]
       step1: newLevel中domb在oldLevel的下标pos为1, 1 > lastIndex 不偏移。
              那么domb在oldLevel的坐标就是0,即nextIndex
              lastIndex=max(pos,lastIndex)=1, nextIndex++
       step2: newLevel中dome在oldLevel中不存在pos为-1, -1 < lastIndex 需要偏移。
              那么dome在oldLevel的坐标就是1,即nextIndex
              lastIndex=max(pos,lastIndex)=1, nextIndex++,
       step3: newLevel中domc在oldLevel的下标pos为2, 2 > lastIndex 不偏移。
              那么domd在oldLevel的坐标就是2,即nextIndex
              lastIndex=max(pos,lastIndex)=2, nextIndex++,
       step4: newLevel中doma在oldLevel的下标pos为0, 0 < lastIndex 需要偏移。
              那么doma在oldLevel的坐标就是3,即nextIndex
              lastIndex=max(pos,lastIndex)=2, nextIndex++,
       step5: newLevel已经遍历完了，然而nextIndex < oldLevel.length, 从nextIndex开始删除oldLevel中剩下的节点即domd
   )

   个人的理解，diff并没有带来多大的优化，只是减少了重绘和重排的操作。因为diff会带来大量的dom移动操作，也是很耗性能的。说白了就是用户体验更好

4. 实现异步的setState
   之前每次执行setState就会执行renderComponent,就会执行diffNode,触发重新渲染。

   对于下面的执行100次遍历操作，react并不会进行100次setState.
   componentDidMount() {
        for ( let i = 0; i < 100; i++ ) {
            this.setState( { num: this.st ate.num + 1 } );
            console.log( this.state.num );    // 会输出什么？
        }
   }
   如果想进行100次setState则要这么写
   componentDidMount() {
        for ( let i = 0; i < 100; i++ ) {
            this.setState( prevState => {
                console.log( prevState.num );
                return {
                    num: prevState.num + 1
                }
            } );
        }
    }
    所以react做了下面的操作：
        1. 异步更新state，将短时间内的多个setState合并成一个
        方法：这里用了promise.resolve.then()来异步执行渲染，结合setStateQueue,renderQueue来控制和记录顺序
        2. 为了解决异步更新导致的问题，增加另一种形式的setState：接受一个函数作为参数，在函数中可以得到前一个状态并返回下一个状态
        方法：给当前实例component添加一个prevState属性，然后component.prevState作为函数的第一个参数, component.props作为第二个参数


