import React, { Component } from 'react';

import { CamView } from './CamView';

export class Snap extends Component {

  state = {
    notFound: false
  };
  
  onSnap = (image) => {
    return fetch(`/api/ocr/extract`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image })
    }).then(r => r.json()).then(data => {
      console.log(data);
      const wine = data.bestMatch;
      if (wine) {
        setTimeout(() => {
          this.props.router.push({
            pathname: '/search',
            query: {q: `${wine.name} ${wine.region} ${wine.country} ${wine.year}`, showTop: true}
          });
        }, 300);
      } else {
        this.setState({ notFound: true }, () => {
          this.toggleVideoPlay();
          setTimeout(() => {
            this.setState({ notFound: false });
          }, 2000);
        });
      }
      return data;
    });
  };

  render() {
    return (
      <div>
        {this.state.notFound && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            zIndex: 9999999,
          }}>
            <h3>No wine found ...</h3>
          </div>
        )}
        <CamView onSnap={this.onSnap} remoteControl={f => this.toggleVideoPlay = f} />
      </div>
    );
  }
}
