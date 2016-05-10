module.exports=React.createClass({
    getInitialState:function(){
      return{
        title:"Child Component"
      }
    },
    render:function(){
        return(
            <div className="content">
                <h1>{this.state.title}</h1>
                <p>{this.props.content}</p>
            </div>
        );
    }
});