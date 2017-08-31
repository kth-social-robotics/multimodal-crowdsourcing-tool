import React from 'react';
import RecordRTC from 'recordrtc';
import request from 'browser-request'
import {Webcam} from './webcam.jsx'

class Why extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        comment: '',
        faceValue: 50,
        voiceValue: 50,
        strengthValue: 50,
        voiceChanged: false,
        faceChanged: false,
        strengthChanged: false,
        otherLexical: '',
        lexical: 'Select one',
        betterCat: ''
      }
      this.submit = this.submit.bind(this)
      this.handleFaceChange = this.handleFaceChange.bind(this)
      this.handleVoiceChange = this.handleVoiceChange.bind(this)
      this.handleStrengthChange = this.handleStrengthChange.bind(this)
      this.readyForSubmit = this.readyForSubmit.bind(this)
      this.changeLexical = this.changeLexical.bind(this)
      this.changeOtherLexical = this.changeOtherLexical.bind(this)
      this.changeBetterCat = this.changeBetterCat.bind(this)
  }

    changeLexical(event) {
        this.setState({lexical: event.target.value})
    }

    changeBetterCat(event) {
        this.setState({betterCat: event.target.value})
    }

    readyForSubmit() {
        return this.state.voiceChanged && this.state.faceChanged && this.state.strengthChanged && this.state.comment !== '' && ((this.state.lexical !== 'Select one' && this.state.lexical !== 'other') || (this.state.lexical === 'other' && this.state.otherLexical !== ''))
    }

    changeOtherLexical(event) {
        this.setState({otherLexical: event.target.value})
    }

    submit() {
        if(this.readyForSubmit()) {
            var lexical = this.state.lexical === 'other' ? this.state.otherLexical : this.state.lexical
            this.props.onSubmit(this.state.comment, this.state.faceValue, this.state.voiceValue, this.state.strengthValue, lexical, this.state.betterCat)
        }
    }

    handleStrengthChange(event) {
        this.setState({strengthValue: event.target.value, strengthChanged: true});
    }

    handleFaceChange(event) {
        this.setState({faceValue: event.target.value, faceChanged: true});
    }

    handleVoiceChange(event) {
        this.setState({voiceValue: event.target.value, voiceChanged: true});
    }

    render() {
        var linkStyle = {textAlign: 'center', cursor: 'pointer'}
        var requiredStar = <span style={{color: 'red'}}>*</span>
        var otherInput = <div><br/></div>
        if(this.state.lexical === 'other'){
            otherInput = <div style={{marginTop: 10, marginBottom: 10}}>Please write it{requiredStar} <input type="text" value={this.state.otherLexical} onInput={this.changeOtherLexical} /></div>
        }
        var text = '';
        var optional = ''

        if(this.props.mode == 'why') {
            text = "What made the virtual agent's response appropriate?"
        } else if (this.props.mode == 'why_own') {
            text = "Why was your feedback more appropriate?"
            optional = (
                <div>
                  Suggest more suiting category than <u><b>{this.props.condition}</b></u> (optional):
                  <input type="text" value={this.state.betterCat} onInput={this.changeBetterCat} />
                </div>
            )
        }

        return (
            <div style={{height: 500}}>
                <div className="col-sm-12">
                    <h4 style={{marginBottom: 30}}>Didn't turn out well? <a style={linkStyle} onClick={this.props.onRedo}>Redo the recording</a></h4>

                    <div className="col-sm-10 col-sm-offset-1">
                        <span>{text}{requiredStar}</span>
                        <textarea
                            style={{ marginBottom: 10}}
                            className="form-control"
                            rows="3"
                            value={this.state.comment}
                            onInput={(event) => this.setState({comment: event.target.value})}>
                        </textarea>
                        How appropriate was the <u><b>facial expression</b></u> of the virtual agent for being <u><b>{this.props.condition}</b></u>{requiredStar}<br/>
                        <input
                          type="range"
                          min="0" max="100"
                          value={this.state.faceValue}
                          onChange={this.handleFaceChange}
                          step="1"/>
                          <br/>
                        How appropriate was the <u><b>voice</b></u> of the virtual agent for being <u><b>{this.props.condition}</b></u>{requiredStar}<br/>
                        <input
                          type="range"
                          min="0" max="100"
                          value={this.state.voiceValue}
                          onChange={this.handleVoiceChange}
                          step="1"/>
                          <br/>
                        How strongly did you feel the virtual agent conveyed being <u><b>{this.props.condition}</b></u>{requiredStar}<br/>
                        <input
                          type="range"
                          min="0" max="100"
                          value={this.state.strengthValue}
                          onChange={this.handleStrengthChange}
                          step="1"/><br/>
                        <span>How would you write the feedback you just gave?{requiredStar} </span>
                        <select value={this.state.lexical} onChange={this.changeLexical}>
                            <option>Select one</option>
                            <option>mh</option>
                            <option>mhm</option>
                            <option>aha</option>
                            <option>yeah</option>
                            <option>sure</option>
                            <option>okay</option>
                            <option>uh-uh</option>
                            <option>really</option>
                            <option>right</option>
                            <option>alright</option>
                            <option>hm</option>
                            <option>other</option>
                        </select>
                        {otherInput}
                        {optional}
                        <br />
                        <button className="btn btn-primary btn-lg" disabled={!this.readyForSubmit()} onClick={this.submit}>Answer</button>
                    </div>
                </div>
            </div>
        )
    }
}

export class ShowVideo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {mode: 'start', videoRecorder: null, stream: null, video_id: null, video_counter: 0, like: null, askForRedo: null};
        this.startStreaming = this.startStreaming.bind(this)
        this.ended = this.ended.bind(this)
        this.redo = this.redo.bind(this)
        this.whySubmitted = this.whySubmitted.bind(this)
    }
    vote(like) {
        this.setState({like: like})
        request.put({url:'/set_like', body: JSON.stringify({
          id: this.props.user.id,
          token: this.props.user.token,
          like: like,
          video_id: this.state.video_id
        }), json: true}, (er, response, data) => {
            this.setState({mode: 'pre_record_own'})
        });
    }

    componentDidMount() {
        request.post({url:'/get_videos', body: JSON.stringify({
          id: this.props.user.id,
          token: this.props.user.token
        }), json: true}, (er, response, data) => {
            this.setState({video_id:  data.video_id, condition: data.condition, stimuli_video: data.stimuli_video, original_video: data.original_video});
        });
    }

    startStreaming(stream) {
        this.refs['webcam'].startRecording(() => {
            this.refs['videoPlayer'].play();
        })
    }

    ended() {
      setTimeout(() => {
          this.refs['webcam'].stopRecording(() => {
              if (this.state.like) {
                  this.setState({mode: 'why'})
              } else {
                  this.setState({mode: 'why_own'})
              }
          })
      }, 1000)
    }




    whySubmitted(comment, faceValue, voiceValue, strengthValue, lexical, betterCat) {

      request.put({url:'/set_comment', body: JSON.stringify({
        id: this.props.user.id,
        token: this.props.user.token,
        comment: comment,
        faceValue: faceValue,
        voiceValue: voiceValue,
        lexical: lexical,
        betterCat: betterCat,
        strengthValue: strengthValue,
        video_id: this.state.video_id
      })}, (er, response) => {
          this.props.done();
      })
    }

    redo() {
        this.setState({mode: 'record_own', video_counter: this.state.video_counter + 1})
    }

    render() {
        if(this.state.video_id === null){
            return <div></div>
        }
        switch(this.state.mode) {
            case 'show_vote':
                return (
                    <div>
                        <h4 style={{marginBottom: 20}}>Was the virtual agent's response appropriate given that the virtual agent's attitude was supposed to be <b><u><span style={{fontSize: 25}}>{this.state.condition}</span></u></b> towards the job applicant?</h4>
                        <h4><a style={{textAlign: 'center', cursor: 'pointer'}} onClick={() => this.setState({mode: 'the_video'})}>Replay the video?</a></h4>
                        <div style={{marginTop: 20, marginLeft: 'auto', marginRight: 'auto', width: 500}}>
                        <div style={{float: 'left'}}><span className="thumb fa fa-thumbs-up" onClick={this.vote.bind(this, true)}></span><br /><h4>Yes</h4></div>
                        <div style={{float: 'right'}}><span className="thumb fa fa-thumbs-down" onClick={this.vote.bind(this, false)}></span><br /><h4>No</h4></div>
                        </div>
                    </div>
                )
                break;
            case 'why':
                return <Why mode="why" condition={this.state.condition} onRedo={this.redo} onSubmit={this.whySubmitted} />
                break;
            case 'why_own':
              var text;
                return <Why mode="why_own" condition={this.state.condition} onRedo={this.redo} onSubmit={this.whySubmitted} />
                break;
            case 'pre_record_own':
                return <div><h4 style={{marginTop: 170, textAlign: 'center'}}>We would like you to perform what you would think is the best short feedback for being <span style={{fontSize: 22, textDecoration: 'underline'}}>{this.state.condition}</span> when the counter reaches zero.</h4> <button className="btn btn-primary" onClick={() => this.setState({mode: 'record_own'})}>Start</button></div>
                break;
            case 'record_own':
                var style = {width: '100%', position: 'absolute', top: '0px', left: '0px', zIndex: 0};
                return (
                    <div style={{position: 'relative', width: '100%', height: 407}}>
                        <div style={{top: -40, right: 0, textAlign: 'center', zIndex: 10, width: 'auto', height: 40, position: 'absolute', fontSize: 20, border: '1px solid #999', padding: 10, paddingTop: 5, paddingBottom: 5, borderBottom: '0px none #fff'}}>Be: <b>{this.state.condition}</b></div>
                        <video src={this.state.original_video} ref="videoPlayer" onEnded={this.ended} style={style}></video>
                        <Webcam ref="webcam" onStreaming={this.startStreaming} user={this.props.user} key={this.state.video_counter + '-video'} filenameSuffix={this.state.video_counter + '_' + this.state.video_id + '_video'} />
                    </div>
                )
                break;
            case 'the_video':
                return (
                    <div>
                        <div style={{top: -40, right: 0, zIndex: 10, width: 'auto', textAlign: 'center', height: 40, position: 'absolute', fontSize: 20, border: '1px solid #999', padding: 10, paddingTop: 5, paddingBottom: 5, borderBottom: '0px none #fff'}}>Virtual agent's attitude: <b>{this.state.condition}</b></div>
                        <video src={this.state.stimuli_video} id="new-video-player" style={{width: '100%', position: 'absolute', top: '0px', left: '0px', zIndex: 0}} autoPlay onEnded={() => this.setState({mode: 'show_vote'})}>
                        </video>
                    </div>
                )
                break;
            case 'start':
            default:
                return (<div><h4 style={{marginTop: 170, textAlign: 'center'}}>Next you will now see a video clip where a person <br /> has a very short interaction with a virtual agent.</h4> <button className="btn btn-primary" onClick={() => this.setState({mode: 'the_video'})}>Start</button></div>)

        }
    }
}
