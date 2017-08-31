import React from 'react';
import RecordRTC from '../lib/recordrtc';
import request from 'browser-request'

export class Webcam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {stream: null};
    }


    startRecording(cb) {
        var videoRecorder = RecordRTC(this.state.stream);
        videoRecorder.startRecording();
        this.setState({videoRecorder: videoRecorder})
        if (cb) cb()
    }

    stopRecording(cb) {
        if(!this.state.videoRecorder) return
        this.state.videoRecorder.stopRecording(() => {
            this.state.videoRecorder.getDataURL((data) => {
                request.post({url:'/upload_video', body: JSON.stringify({
                  id: this.props.user.id,
                  filename_suffix: this.props.filenameSuffix,
                  token: this.props.user.token,
                  file: data.split(',')[1]}),

                }, (er, response) => {
                    // this.setState({video_number: this.state.video_number + 1})
                    if (cb) cb()
                })
            })
        })
    }

    componentWillUnmount() {
        for (let track of this.state.stream.getTracks()) {
            track.stop()
        }
    }

    componentDidMount(prevProps, prevState) {
      if (navigator.mediaDevices === undefined) {
          navigator.mediaDevices = {};
      }
      if (navigator.mediaDevices.getUserMedia === undefined) {
          navigator.mediaDevices.getUserMedia = function(constraints) {
              // First get ahold of the legacy getUserMedia, if present
              var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

              // Some browsers just don't implement it - return a rejected promise with an error
              // to keep a consistent interface
              if (!getUserMedia) {
                  return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
              }

              // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
              return new Promise(function(resolve, reject) {
                  getUserMedia.call(navigator, constraints, resolve, reject);
              });
          }
      }
      navigator.mediaDevices.getUserMedia({audio: true, video: true}).then((stream) => {
          this.setState({stream: stream})
          this.refs['video'].srcObject = stream;
          this.refs['video'].addEventListener('play', () => {
              if (this.props.onStreaming) this.props.onStreaming(stream);
          })

      });
    }

    render() {

        var style = this.props.style  || {position: 'absolute', bottom: '0px', right: '0px', zIndex: 2, width: '200px'}
        return <div><video id="video" ref="video" style={style} muted autoPlay></video></div>
    }
}
