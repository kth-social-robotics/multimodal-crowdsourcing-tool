import React from 'react';
import request from 'browser-request'


export class ParticipantId extends React.Component {
    constructor(props) {
        super(props);
        this.state = {participantId: '', okToSubmit: true}
        this.changeText = this.changeText.bind(this);
        this.submit = this.submit.bind(this);
    }
    changeText(event) {
        this.setState({participantId: event.target.value});
    }
    getParameterByName(name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    submit() {
        if(this.state.okToSubmit) {
          this.setState({okToSubmit: false});
          var source = this.getParameterByName('q');
          request.post({
              url:'/create_participant',
              body: JSON.stringify({participant_id: this.state.participantId, source: source ? source : 'pa'}),
              json: true
          }, (er, response, body) => {
              this.props.setUser(body)
              this.props.done()
          })
        }
    }
    render() {
        return (
          <div>
              <div id="desc" style={{marginTop: 130, padding: 20, textAlign: 'center'}}>
                  <input type="text" id="participant-id" placeholder="PARTICIPANT ID" style={{textAlign: 'center', width: 200, height: 50, fontSize: 20}} value={this.state.participantId} onInput={this.changeText} />
              </div>
              <button type="button" name="button" onClick={this.submit} className="btn btn-primary btn-lg" disabled={this.state.participantId.length === 0 && this.state.okToSubmit ? true : false} id='start'>Start</button>
          </div>
        )
    }
}
