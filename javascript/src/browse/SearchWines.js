import React, {Component} from 'react';
import { Link } from 'react-router';
import { Wines } from './Wines';

export class SearchWines extends Component {

    state = {
        loading: true,
        wines: []
    };

    componentDidMount() {
        fetch(`/api/wines/_search?q=${this.props.location.query.q}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }).then(r => r.json()).then(data => {
            this.setState({
                wines: data.wines,
                loading: false
            });
        });
    }

    render() {
        const wines = this.state.wines;
        const wine = this.state.wines[0];
        if (this.props.location.query.showTop === 'true' && wine) {
            wines.shift();
        }
        return (
            <div className="text-center">
                <div className="page-header">
                  <h1>Wines for "{this.props.location.query.q}"</h1>
                </div>
                {window.__user && <div style={{ marginBottom: 16 }}>
                  <Link to="wine-form">Didn't find your wine ? Add it !</Link>
                </div>}

                {
                    this.state.loading && (
                        <div className="progress" style={{ width: '100%' }}>
                            <div className="progress-bar progress-bar-striped active" role="progressbar" style={{ width: '100%' }}></div>
                        </div>
                    )
                }
                {wine && this.props.location.query.showTop === 'true' && (
                  <div style={{ textAlign: 'center', marginBottom: 40 }} className="showtop">
                      <div className="row">
                          <div className="col-md-12">
                              <h4>Best result:</h4>
                          </div>
                      </div>
                      <div className="row">
                          <div className="col-md-12">
                              <h3>{wine.name}</h3>
                          </div>
                      </div>
                      <div className="row">
                          <div className="col-md-12">
                              <span>
                                  <Link to={{ pathname: '/browse/wines', query: { country: wine.country, region: wine.region } }}>{wine.region}</Link>,&nbsp;
                                  <Link to={{ pathname: '/browse/wines', query: { country: wine.country, region: wine.region } }}>{wine.country}</Link>
                              </span>
                          </div>
                      </div>
                      <div className="row">
                          <div className="col-md-12">
                              <span>{wine.year}</span>
                          </div>
                      </div>
                      <div className="row">
                          <div className="col-md-4 col-md-offset-4">
                              <img className="img-responsive" src={wine.externalPhotoUrl} />
                          </div>
                      </div>
                      <hr/>
                  </div>
                )}
                <Wines wines={this.state.wines} showLinks={true}/>
            </div>
        )
    }

}
