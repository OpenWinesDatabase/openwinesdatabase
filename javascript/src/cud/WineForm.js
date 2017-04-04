import React, { Component } from 'react';
import { CamView } from '../snap/CamView';

export class WineForm extends Component {
    state = {
        name: '',
        year: '',
        region: '',
        country: '',
        externalPhotoUrl : '/assets/images/camera.png',
        id: '',
        photoData : '',
        pictureModeOn : false
    }

    componentDidMount(){
      if(!window.__user){
        this.props.router.push({
          pathname: '/',
        });
      }else {
        if(this.props.params.id) {
          fetch(`/api/wines/${this.props.params.id}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                  'Accept': 'application/json'
              }
          })
          .then(response => {
            if(response.status !== 200) {
              this.props.router.push({
                pathname: '/',
              });
            }
            return response.json()
          })
          .then(data => {
              this.setState({
                  name : data.name,
                  year : data.year,
                  region : data.region,
                  country : data.country,
                  externalPhotoUrl : data.externalPhotoUrl,
                  id : this.props.params.id,
              });
          });
        }
      }
    }

    handleDelete = (event) => {
      fetch(`/api/wines/${this.state.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(result => {
        if(result.status === 200){
          console.log(`Wine ${this.state.id} deleted`);
        } else {
          console.log(`Wine ${this.state.id} could not be deleted`);
        }
      });

      this.props.router.push({
        pathname: '/',
      });
    }

    handleFormSubmit = (event) => {
        fetch(`/api/wines/${this.state.id}`, {
          method: this.state.id?'PUT':'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              name : this.state.name,
              year : this.state.year,
              region : this.state.region,
              country : this.state.country,
              photoData : this.state.photoData,
              externalPhotoUrl : this.state.externalPhotoUrl
            })
          })
          .then(result => {
            console.log("Wine inserted");
          });

          this.props.router.push({
            pathname: '/',
          });
    }

    handleFormChange = (event) => {
        this.setState({
            ...this.state,
            [event.target.name]: event.target.value
        });
    }

    handleSnapPicture = (photoDataURL) => {
      this.setState({
          ...this.state,
          photoData: photoDataURL,
          pictureModeOn : false
      });

      return "";
    }

    handlePictureMode = (event) => {
      console.log("Take Picture");
      this.setState({
          ...this.state,
          pictureModeOn: true
      });
    }

    render() {
        return (
          <div style={{ marginTop: 20 }}>
            {this.state.pictureModeOn && <CamView onSnap={this.handleSnapPicture} />}
            {!this.state.pictureModeOn &&
              <div className="row">
                <div className="col-8 col-md-8">
                    <div className="form-group">
                        <input type="text" className="form-control" name="name" id="name" placeholder="Name" value={this.state.name} onChange={this.handleFormChange} required></input>
                    </div>
                    <div className="form-group">
                        <input type="text" className="form-control" name="year" id="year" placeholder="Year" value={this.state.year} onChange={this.handleFormChange} required></input>
                    </div>

                    <div className="form-group">
                        <input type="text" className="form-control" name="region" id="region" placeholder="Region" value={this.state.region} onChange={this.handleFormChange} required></input>
                    </div>

                    <div className="form-group">
                        <input type="text" className="form-control" name="country" id="country" placeholder="Country" value={this.state.country} onChange={this.handleFormChange} required></input>
                    </div>
                </div>
                <div className="col-4 col-md-4" >
                    <img className="img-responsive" src={this.state.photoData?this.state.photoData:this.state.externalPhotoUrl} onClick={this.handlePictureMode} style={{marginLeft: "auto", marginRight: "auto", display: "block"}} />
                </div>
            </div>}
            {!this.state.pictureModeOn && <div className="row">
              <div className="form-group">
                <div className="col-8 col-md-8" style={{ marginTop: 10 }}>
                  <div className="btn-group">
                    <button className="btn btn-default" onClick={this.handleFormSubmit}><i className="glyphicon glyphicon-hdd" /> {this.state.id?"Update":"Submit"}</button>
                    {this.state.id && <button className="btn btn-default" onClick={this.handleDelete}><i className="glyphicon glyphicon-trash" /> Delete</button>}
                  </div>
                </div>
              </div>
            </div>}
          </div>
        );
    }
}
