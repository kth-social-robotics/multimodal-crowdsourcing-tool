import React from 'react';
import request from 'browser-request'


export class Done extends React.Component {
  constructor(props) {
      super(props);
      this.state = {comment: '', step: 'comment', code: '', service: '', url: ''}
      this.submit = this.submit.bind(this);
  }

    submit() {
      request.put({url:'/set_last_comment', body: JSON.stringify({
        id: this.props.user.id,
        token: this.props.user.token,
        comment: this.state.comment
      }), json: true}, (er, response, body) => {
          if(body.service == 'pa') {
              window.location = body.url;
              this.setState({step: 'url', url: body.url})
          } else {
              this.setState({step: 'code', code: body.code, service: body.service})
          }
      })
    }

    render() {
        if(this.state.step == 'comment') {
            return (<div><h2>Thanks, one last thing!</h2><div className="col-sm-8 col-sm-offset-2"><h4>Do you have any final comments?</h4><textarea style={{marginTop: 100, marginBottom: 20}} className="form-control" rows="5" value={this.state.comment} onInput={(event) => this.setState({comment: event.target.value})}></textarea><button className="btn btn-primary btn-lg" onClick={this.submit}>Submit</button></div></div>)
        } else if(this.state.step == 'url') {
            return (<div>You are now being redirected to {this.state.url}...</div>)
        } else {
            return (<div>
              <h2>Okay, done!</h2>
              <p>Please go back to {this.state.service} and put this code into the next text box:</p>
              <h3 id='the-code' style={{backgroundColor: '#f6f6f6', border: '1px solid #ccc', width: 250, marginLeft: 'auto', marginRight: 'auto', padding: 20, paddingTop: 15}}>{this.state.code}</h3>
              </div>
            )
        }



    }
}
