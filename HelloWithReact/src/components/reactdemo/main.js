var Content = require('./childs/content');
module.exports=React.createClass({
    displayName: 'Reactdemo',
    getInitialState:function(){
      return{
        title:"Main Component"
      }
    },
    change:function(){
        this.setState({title:"Change To New Title"});
    },
    render:function(){
        return(
            <div className="main">
                <h1 onClick={ this.change.bind(this) }>
                    { this.state.title }
                </h1>
                <div>
                    { this.props.data.content }
                </div>
                <Content content={ this.props.data.childcontent }/>
            </div>
        );
    }
});