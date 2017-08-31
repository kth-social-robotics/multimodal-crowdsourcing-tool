import React from 'react';
import request from 'browser-request'

export class ConsentForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {quietPlace: false, headset: false, consent: false, headphones: '', okToSubmit: false}
        this.updateField = this.updateField.bind(this)
        this.submit = this.submit.bind(this)
    }
    updateField(event) {
        var name = event.target.name;
        this.setState({[name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value})
    }
    submit(event) {
        this.setState({okToSubmit: false});
        request.put({
            url:'/consent_form',
            body: JSON.stringify({
                id: this.props.user.id,
                token: this.props.user.token,
                headphones: this.state.headphones
              }),
            json: true
        }, (er, response, body) => {
          this.props.done()
        })
    }
    render() {
        var {quietPlace, headset, consent, headphones} = this.state;
        var okToSubmit = false;
        if (quietPlace && headset && consent && headphones.length > 0) {
            okToSubmit = true;
        }
        return (
          <div id="training-form" style={{marginLeft: 'auto', marginRight: 'auto', marginTop: 80}}>
              <img src="/static/img/headset.png" style={{height: 150, position: 'absolute', right: 50, top: 120}} alt="" />

              <div className="checkbox">
                  <label>
                      <input name="quietPlace" type="checkbox" onChange={this.updateField} className="check-form" value={this.state.quietPlace} /> I'm in a quiet place <span style={{color: 'red'}}>*</span>
                  </label>
              </div>
              <div className="checkbox">
                  <label>
                      <input name="headset" type="checkbox" onChange={this.updateField} className="check-form" value={this.state.headset} /> I'm using a headset <span style={{color: 'red'}}>*</span>
                  </label>
              </div>
              <div className="checkbox">
                  <label>
                      <input name="consent" type="checkbox" onChange={this.updateField} className="check-form" value={this.state.consent} /> I consent to be video and audio recorded. <span style={{color: 'red'}}>*</span>
                  </label>
              </div>
              <label>Your brand of headset <span style={{color: 'red'}}>*</span></label>
                <input name="headphones" type="text" onInput={this.updateField} value={this.state.headphones} className="form-control check-form" style={{width: 200, marginLeft: 'auto', marginRight: 'auto'}} />
                <button type="button" onClick={this.submit}  className="next-vid btn btn-primary btn-lg" disabled={!okToSubmit} style={{marginTop: 50}}>I'm ready, let's start</button>
            </div>
        )
    }
}
