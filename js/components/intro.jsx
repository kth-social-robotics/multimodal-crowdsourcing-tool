import React from 'react';

export class Intro extends React.Component {
    render() {
        var videoUrl = 'SOME-VIDEO-URL';
        return (
            <video src={videoUrl} style={{width: '100%', position: 'absolute', top: '0px', left: '0px', zIndex: 0}} autoPlay onEnded={this.props.done}></video>
        )
    }
}
