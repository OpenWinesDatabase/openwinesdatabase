import React, { Component } from 'react';

import polyfill from 'webrtc-adapter';

export class CamView extends Component {

  state = {
    playing: false,
    loading: false,
    extracted: null,
    facingMode: true,
  };

  componentDidMount() {
    this.initUserMedia();
    this.getUserMedia();
    setTimeout(this.toggleVideoPlay, 1000);
    document.addEventListener('keyup', this.keyPressed);
    if (this.props.remoteControl) {
      this.props.remoteControl(this.toggleVideoPlay);
    }
  }

  componentWillUnmount() {
    this.video.pause();
    this.video.onprogress = () => '';
    $(this.video).remove();
    delete this.video;
    document.removeEventListener('keyup', this.keyPressed);
  }

  keyPressed = (e) => {
    if (e.keyCode === 32) {
      this.snap();
    }
  };

  getUserMedia() {
    if (this.video.srcObject) {
      this.video.srcObject.getTracks().map(t => t.stop());
    }
    console.log(this.state.facingMode ? 'environment' : 'user');
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: this.props.width || this.detector.clientWidth || 300 },
        height: { ideal: this.props.height || ((this.detector.clientWidth / 3) * 4) || 600 },
        facingMode: { exact: this.state.facingMode ? 'environment' : 'user' },
        frameRate: { ideal: 60, max: 60 },
      }
    }).then(a => a, e => {
      console.log(e);
      return navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.props.width || this.detector.clientWidth || 300 },
          height: { ideal: this.props.height || ((this.detector.clientWidth / 3) * 4) || 600 },
          frameRate: { ideal: 60, max: 60 },
        }
      });
    }).then((stream) => {
      if ('srcObject' in this.video) {
        this.video.srcObject = stream;
      } else {
        this.video.src = window.URL.createObjectURL(stream);
      }
      this.video.onloadedmetadata = () => {
        this.userMediaLoaded();
      };
    });
  }

  userMediaLoaded() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.clientWidth;
    this.canvas.height = this.video.clientHeight;
    this.canvasContext = this.canvas.getContext('2d');
  }

  initUserMedia() {
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = (constraints) => {
        const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }
        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  }

  toggleFacingMode = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    this.video.pause();
    this.setState({ playing: false, facingMode: !this.state.facingMode }, () => {
      this.getUserMedia();
      setTimeout(this.toggleVideoPlay, 1000);
    });
  };

  snap = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log('Snap !!!');
    this.canvasContext.drawImage(this.video, 0, 0, this.video.clientWidth, this.video.clientHeight);
    const image = this.canvas.toDataURL();
    this.setState({ extracted: null, playing: false, loading: true });
    this.video.pause();
    if (this.props.onSnap) {
      const res = this.props.onSnap(image);
      if (res.then) {
        res.then(extracted => {
          this.setState({ extracted, loading: false });
        });
      } else {
        this.setState({ extracted: res, loading: false });
      }
    } else {
      console.log('no onSnap handler, moving along ...');
    }
  };

  toggleVideoPlay = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (this.state.playing) {
      this.video.pause();
      this.setState({ playing: false });
    } else {
      this.video.play();
      this.setState({ playing: true });
    }
  };

  render() {
    return (
      <div id="detector" ref={ref => this.detector = ref} style={this.props.style} className={this.props.className}>
        <video  ref={(video) => { this.video = video; }} style={{ transform: !this.state.facingMode ? 'scaleX(-1)' : '' }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
          {this.state.loading && (
            <div className="progress" style={{ width:'100%' }} >
              <div className="progress-bar progress-bar-striped active" style={{ width:'100%' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
          <div className="btn-group">
            <a className="btn btn-lg btn-default" href="#" role="button" onClick={this.snap}>
              <span className="glyphicon glyphicon-camera" />
            </a>
            {this.state.playing && (
              <a className="btn btn-lg btn-default" href="#" role="button" onClick={this.toggleVideoPlay}>
                <span className="glyphicon glyphicon-pause" />
              </a>
            )}
            {!this.state.playing && (
              <a className="btn btn-lg btn-default" href="#" role="button" onClick={this.toggleVideoPlay}>
                <span className="glyphicon glyphicon-play" />
              </a>
            )}
            <a className="btn btn-lg btn-default" href="#" role="button" onClick={this.toggleFacingMode}>
              <span className="glyphicon glyphicon-refresh" />
            </a>
          </div>
        </div>
      </div>
    );
  }
}
