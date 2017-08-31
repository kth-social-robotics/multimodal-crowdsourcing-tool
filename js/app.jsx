import React from 'react';
import ReactDOM from 'react-dom';
import DetectRTC from 'detectrtc';
import queryString from 'query-string';
import request from 'browser-request'
import {Webcam} from './components/webcam.jsx'
import {Calibration} from './components/calibration.jsx'
import {ShowVideo} from './components/show_video.jsx'
import {Intro} from './components/intro.jsx'
import {Done} from './components/done.jsx'
import {ConsentForm} from './components/consent_form.jsx'
import {ParticipantId} from './components/participant_id.jsx'


class App extends React.Component {
  constructor(props) {
      super(props);
      this.pages = [
        'participant_id',
        'consent_form',
        'intro',
        'calibration',
        'show_video',
        'show_video',
        'show_video',
        'show_video',
        'show_video',
        'show_video',
        'show_video',
        'done'
      ]
      this.state = {
          hasRequirements: false,
          progress: 0,
          user: {}
      };
      this.done = this.done.bind(this);
      this.setUser = this.setUser.bind(this);
      this.hashChanged = this.hashChanged.bind(this)
  }
  componentWillMount() {
      DetectRTC.load(() => {
          this.setState({hasRequirements: DetectRTC.hasWebcam && DetectRTC.hasMicrophone && DetectRTC.isWebRTCSupported});
      });
  }

  hashChanged() {
      const parsedHash = queryString.parse(location.hash);
      if(parsedHash['asaa2'] && Object.keys(this.state.user).length !== 0) {
          this.setState({progress: parseInt(parsedHash['asaa2'])})
      }
  }

  componentDidMount() {
      window.addEventListener("hashchange", this.hashChanged, false)
  }

  componentWillUnmount() {
      window.removeEventListener("hashchange", this.hashChanged, false)
  }

  setUser(user) {
      this.setState({user: user});
  }

  done(response) {
      if (this.state.progress < this.pages.length-1) {
          request.put({
              url:'/update_step',
              body: JSON.stringify({
                  id: this.state.user.id,
                  token: this.state.user.token,
                  page: this.pages[this.state.progress] + '_' + this.state.progress
                }),
              json: true
          }, (er, response, body) => {
              this.setState({progress:  this.state.progress + 1})
          })
      }
  }

  render() {
      if(!this.state.hasRequirements) {
          return <div>Sorry, you need the latest version of firefox, google chrome or opera, a webcam and a microphone in order to proceed.</div>
      }
      var page;
      switch(this.pages[this.state.progress]) {
          case 'participant_id':
              page = <ParticipantId done={this.done} setUser={this.setUser} key={this.state.progress} />
              break;
          case 'consent_form':
              page = <ConsentForm done={this.done} user={this.state.user} key={this.state.progress} />
              break;
          case 'intro':
              page = <Intro done={this.done} user={this.state.user} key={this.state.progress} />
              break;
          case 'calibration':
              page = <Calibration done={this.done} user={this.state.user} key={this.state.progress} />
              break;
          case 'show_video':
              page = <ShowVideo done={this.done} user={this.state.user} key={this.state.progress} />
              break;
          case 'done':
              page = <Done user={this.state.user} key={this.state.progress} />
              break;
      }
      return <div id="app-frame" style={{height: 'auto', minHeight: 407}}>{page}</div>
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
