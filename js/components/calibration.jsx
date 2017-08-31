import React from 'react';
import request from 'browser-request'
import RecordRTC from '../lib/recordrtc';
import vad from 'voice-activity-detection';
import {Webcam} from './webcam.jsx'


class RecognizeFace extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: 'run',
            time: 10
        }
    }

    startStreaming(stream, video) {
        this.refs['webcam'].startRecording()
        this.interval = setInterval(this.tick.bind(this), 1000);
    }

    componentWillUnmount() {
        if(this.interval) clearInterval(this.interval);
    }

    tick() {
        this.setState({time: this.state.time - 1});
        if (this.state.time <= 0) {
            clearInterval(this.interval);
            this.refs['webcam'].stopRecording(() => {
                this.setState({mode: 'done'});
                setTimeout(() => this.props.done(), 2000)
            })
        }
    }


    render() {
        switch (this.state.mode) {
            case 'error':
                var h1style = {position: 'absolute', width: '100%', zIndex: 5, marginTop: '150px', color: '#fff'};
                var style = {position: 'absolute', width: '100%', zIndex: 4, height: '100%', paddingTop: '150px', backgroundColor: '#666'};

                return (
                    <div>
                        <div style={style}></div>
                        <div style={h1style}>
                            <h1>Sorry, we couldn't see your face properly!</h1>
                            <button style={{marginTop: 20}} className="btn btn-primary btn-lg" onClick={() => this.setState({faceRecognized: 'redo'})}>Try again</button>
                        </div>
                    </div>
                )
                break;
            case 'done':
                var style = {
                      position: 'absolute',
                      width: '100%',
                      zIndex: 4,
                      height: '100%',
                      paddingTop: '150px',
                      color: '#fff',
                      backgroundColor: '#222',
                }
                return (
                    <div style={style}>
                        <h1>Great!</h1>
                    </div>
                )
            case 'run':
            default:
                return (
                    <div>
                        <div style={{position: 'absolute', width: '100%', zIndex: 4, height: '100%'}}><h3>Please try to position yourself inside of the box</h3></div>
                        <div style={{position: 'absolute', width: '100%', zIndex: 3, backgroundColor: '#ffffff', height: '100%', opacity: 0.5}}>
                            <div style={{width: '250px', height: '300px', border: '2px dashed #333', marginLeft: 'auto', marginRight: 'auto', marginTop: '80px'}}></div>
                        </div>
                        <Webcam ref="webcam" style={{position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right: 0, zIndex: 2, height: '100%'}} onStreaming={this.startStreaming.bind(this)} user={this.props.user} filenameSuffix='video_calibration' />
                    </div>
                )
                break;
        }
    }
}

class QuietTest extends React.Component {
    constructor(props) {
        super(props);
        this.maxAudio = 100
        this.startTime = 10
        this.state = {
            mode: 'run',
            time: this.startTime,
            audio: this.maxAudio,
            attempt: 0,
            interval: null
        }
        this.tick = this.tick.bind(this)
        this.startStreaming = this.startStreaming.bind(this)
    }

    componentWillUnmount() {
        if(this.state.interval) clearInterval(this.state.interval)
    }

    startStreaming(stream) {
        var options = {
            onUpdate: (val) => {
                if(this.state.audio >= 0) {
                    this.setState({audio: this.state.audio - val})
                } else {
                    this.tick(true);
                }
            }
        }
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioContext = new AudioContext();
        this.setState({vad: vad(audioContext, stream, options)});
        this.refs['webcam'].startRecording()
        this.setState({audio: this.maxAudio, time: this.startTime, interval: setInterval(this.tick, 1000)});
    }

    tick(forceCancel=false) {
        if (!forceCancel) this.setState({time: this.state.time - 1});
        if (this.state.time <= 0 || forceCancel) {
            clearInterval(this.state.interval)
            this.state.vad.disconnect();
            if(this.refs['audio']) this.refs['audio'].pause();
            this.refs['webcam'].stopRecording(() => {
                if (this.state.audio > 0) {
                    this.props.done()
                } else {
                    this.setState({attempt: this.state.attempt + 1, mode: 'error'})
                }
            })
        }
    }
    render() {
        switch (this.state.mode) {
            case 'error':
                var h1style = {position: 'absolute', width: '100%', zIndex: 5, marginTop: '90px', color: '#fff'};
                var style = {position: 'absolute', width: '100%', zIndex: 4, height: '100%', paddingTop: '150px', backgroundColor: '#666'};

                return (
                    <div>
                        <div style={style}></div>
                        <div style={h1style}>
                            <h1>Sorry, we hear too much!</h1>
                            <h3>Please make sure you are using headphones so that you don't pick up sounds from your computer and that you are in a quite environment</h3>
                            <button style={{marginTop: 20}} className="btn btn-primary btn-lg" onClick={() => this.setState({mode: 'run'})}>Try again</button>
                        </div>

                    </div>
                )
                break;
            case 'run':
            default:
                var color = 'green';
                if(this.state.audio < this.maxAudio * 0.5 && this.state.audio > this.maxAudio * 0.25) {
                    color = 'yellow';
                } else if (this.state.audio <= this.maxAudio * 0.25) {
                    color = 'red';
                }
                return (
                    <div>
                        <div style={{position: 'absolute', width: '100%', zIndex: 4, height: '100%'}}>
                            <h3 style={{backgroundColor: '#fff', marginBottom: 0, paddingBottom: 10}}>Now please be quiet for {this.state.time} seconds while we play some sounds</h3><h4 style={{backgroundColor: '#fff', marginTop: 0, paddingBottom: 10}}>Watch out so that the bar on the left doesn't run out</h4>
                            <audio ref="audio" src="/static/audio/sound.mp3" autoPlay/>
                            <div style={{position: 'absolute', bottom: 0, width: '20px', height: '200px'}}><div style={{position: 'absolute', bottom: 0, width: '100%', height: ((this.state.audio/this.maxAudio)*100) + '%', backgroundColor: color}}></div></div>
                        </div>
                        <Webcam ref="webcam" style={{position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right: 0, zIndex: 2, height: '100%'}} onStreaming={this.startStreaming} user={this.props.user} key={this.state.attempt + '-quiet'} filenameSuffix={this.state.attempt + '_quiet_calibration'}  />
                    </div>
                )
                break;
        }
    }
}



class SpeakTest extends React.Component {
    constructor(props) {
        super(props);
        this.maxAudio = 50
        this.startTime = 10
        this.state = {
            mode: 'run',
            time: this.startTime,
            audio: 0,
            attempt: 0,
            interval: null
        }
        this.tick = this.tick.bind(this)
        this.startStreaming = this.startStreaming.bind(this)
    }

    startStreaming(stream) {
        var options = {
            onUpdate: (val) => {
              if (this.state.audio <= this.maxAudio) {
                  this.setState({audio: this.state.audio + val})
              } else {
                  this.tick(true)
              }
            }
        }
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioContext = new AudioContext();
        this.setState({vad: vad(audioContext, stream, options)});
        this.refs['webcam'].startRecording()
        this.setState({audio: 0, time: this.startTime, interval: setInterval(this.tick, 1000)});
    }

    componentWillUnmount() {
        if(this.state.interval) clearInterval(this.state.interval)
    }

    tick(forceCancel=false) {
        if(!forceCancel) this.setState({time: this.state.time - 1});
        if (this.state.time <= 0 || forceCancel) {
            clearInterval(this.state.interval)
            this.state.vad.disconnect()
            this.refs['webcam'].stopRecording(() => {
                if (this.state.audio >= this.maxAudio) {
                    this.props.done()
                } else {
                    this.setState({attempt: this.state.attempt + 1, mode: 'error'})
                }
            })
        }
    }

    render() {
        switch (this.state.mode) {
            case 'error':
                var h1style = {position: 'absolute', width: '100%', zIndex: 5, marginTop: '90px', color: '#fff'};
                var style = {position: 'absolute', width: '100%', zIndex: 4, height: '100%', paddingTop: '150px', backgroundColor: '#666'};

                return (
                    <div>
                        <div style={style}></div>
                        <div style={h1style}>
                            <h1>Sorry, we couldn't hear you!</h1>
                            <h3>Please make sure you are using your microphone is placed close to your mouth</h3>
                            <button style={{marginTop: 20}} className="btn btn-primary btn-lg" onClick={() => this.setState({mode: 'run'})}>Try again</button>
                        </div>

                    </div>
                )
                break;
            case 'run':
            default:
                var color = 'green';
                if(this.state.audio < 50 && this.state.audio > 20) {
                    color = 'yellow';
                } else if (this.state.audio <= 20) {
                    color = 'red';
                }
                return (
                    <div>
                        <div style={{position: 'absolute', width: '100%', zIndex: 4, height: '100%'}}>
                            <h3 style={{backgroundColor: '#fff'}}>Now please speak for {this.state.time} seconds</h3>
                            <div style={{position: 'absolute', bottom: 0, width: '20px', height: '200px'}}><div style={{position: 'absolute', bottom: 0, width: '100%', height: ((this.state.audio/50)*100) + '%', backgroundColor: color}}></div></div>
                        </div>
                        <Webcam ref="webcam" style={{position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right: 0, zIndex: 2, height: '100%'}} onStreaming={this.startStreaming} user={this.props.user} key={this.state.attempt + '-speak'} filenameSuffix={this.state.attempt + '_speak_calibration'} />
                    </div>
                )
                break;
        }
    }
}


export class Calibration extends React.Component {
    constructor(props) {
        super(props);
        this.state = {mode: 0};
        this.modes = ['intro', 'face', 'quiet', 'speak']
        this.nextMode = this.nextMode.bind(this)
    }

    nextMode() {
        if(this.state.mode < this.modes.length - 1) {
            this.setState({mode: this.state.mode + 1})
        } else {
            this.props.done()
        }
    }

    render() {
        switch(this.modes[this.state.mode]) {
            case 'face':
                return <RecognizeFace user={this.props.user} done={this.nextMode} />
                break;
            case 'quiet':
                return <QuietTest user={this.props.user} done={this.nextMode} />
                break;
            case 'speak':
                return <SpeakTest user={this.props.user} done={this.nextMode} />
                break;
            case 'intro':
            default:
                return (
                    <div>
                        <h4 style={{marginTop: 170, textAlign: 'center'}}>We will now calibrate the setup. Please follow the instructions on the screen</h4> <button className="btn btn-primary" onClick={this.nextMode}>Start</button>
                    </div>
                )
                break;

        }
    }
}
