import React, { Component } from "react";
import { GoogleMap, LoadScript, OverlayView } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 0,
  lng: 0,
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapReference: null,
      tiles: [],
      cachedTiles: [],
    };
  }

  onZoomChanged = () => {
    if (this.state.mapReference !== null) {
      this.calculateTiles();
    }
  };

  onCenterChanged = () => {
    if (this.state.mapReference !== null) {
      this.calculateTiles();
    }
  };

  createMapRequestModel = (hazardLayer, swlng, swlat, nelng, nelat, width, height, zoom) => {
    let finalHazardLayer = hazardLayer;

    if (this.state.mapReference.getZoom() <= 11) {
      finalHazardLayer = hazardLayer + "_Overview";
    }

    let obj = {
      hazardLayer: finalHazardLayer,
      SouthWestLongitude: swlng,
      SouthWestLatitude: swlat,
      NorthEastLongitude: nelng,
      NorthEastLatitude: nelat,
      TileWidth: width,
      TileHeight: height,
      ZoomFactor: zoom,
      CenterLongitude: this.state.mapReference.getCenter().lng(),
      CenterLatitude: this.state.mapReference.getCenter().lat(),
    };

    return obj;
  };

  calculateTiles = async () => {
    let zoomFactor = this.state.mapReference.getZoom();
    let tileWidth = 360;
    let tileHeight = 180;

    for (let i = 0; i < zoomFactor; i++) {
      tileWidth = tileWidth / 2;
      tileHeight = tileHeight / 2;
    }

    let northEastLat = this.state.mapReference.getBounds().getNorthEast().lat();
    let northEastLng = this.state.mapReference.getBounds().getNorthEast().lng();
    let southWestLat = this.state.mapReference.getBounds().getSouthWest().lat();
    let southWestLng = this.state.mapReference.getBounds().getSouthWest().lng();

    let startLat = Math.floor(southWestLat / tileHeight) * tileHeight;
    let startLng = Math.floor(southWestLng / tileWidth) * tileWidth;

    let endLat = Math.ceil(northEastLat / tileHeight) * tileHeight;
    let endLng = Math.ceil(northEastLng / tileWidth) * tileWidth;

    //let tilePixelHeight = this.state.mapReference.getDiv().offsetHeight / ((northEastLat - southWestLat) / tileHeight);
    //let tilePixelWidth = this.state.mapReference.getDiv().offsetWidth / ((northEastLng - southWestLng) / tileWidth);

    let cachedTiles = this.state.cachedTiles;
    let newTiles = [];

    for (let lat = startLat; lat < endLat; lat += tileHeight) {
      for (let lng = startLng; lng < endLng; lng += tileWidth) {
        if (this.IsInVisibleSector(lat, lng, tileWidth, tileHeight)) {
          let cached = false;
          for (let i = 0; i < cachedTiles.length; i++) {
            let item = cachedTiles[i];

            if (item.zoomFactor === zoomFactor && item.bounds.sw.lat === lat + tileHeight && item.bounds.sw.lng === lng + tileWidth && item.bounds.ne.lat === lat && item.bounds.ne.lng === lng) {
              newTiles.push(item);
              cached = true;
              break;
            }
          }

          if (!cached) {
            //let picture = loadMapTileImage(northEastLat, northEastLng, southWestLat, southWestLng, tilePixelWidth, tilePixelHeight, "Your_Picture_Type_Identifier");
            let dateNow = new Date();
            let time = dateNow.getHours() + ":" + dateNow.getMinutes() + ":" + dateNow.getSeconds();

            let newTile = {
              bounds: {
                sw: { lat: lat + tileHeight, lng: lng + tileWidth },
                ne: { lat: lat, lng: lng },
              },
              zoomFactor: zoomFactor,
              color: this.getRandomColor(),
              text: time,
            };
            newTiles.push(newTile);
            cachedTiles.push(newTile);
            this.setState({ tiles: newTiles, cachedTiles: cachedTiles });
          } else {
            this.setState({ tiles: newTiles, cachedTiles: cachedTiles });
          }
        }
      }
    }
  };

  getRandomColor = () => {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  IsInVisibleSector = (lat, lng, tileWidth, tileHeight) => {
    let northEastLat = this.state.mapReference.getBounds().getNorthEast().lat();
    let northEastLng = this.state.mapReference.getBounds().getNorthEast().lng();
    let southWestLat = this.state.mapReference.getBounds().getSouthWest().lat();
    let southWestLng = this.state.mapReference.getBounds().getSouthWest().lng();

    if (lat + tileHeight >= southWestLat && lng + tileWidth >= southWestLng && lat < northEastLat && lng < northEastLng) {
      return true;
    }

    return false;
  };

  onMapLoad = (map) => {
    this.setState({
      mapReference: map,
    });
  };

  render = () => {
    return (
      <>
        <div className="MainContainer">
          <LoadScript googleMapsApiKey={""}>
            <GoogleMap
              options={{
                disableDefaultUI: true,
                fullscreenControl: false,
                zoomControl: false,
                streetViewControl: false,
                rotateControl: false,
                mapTypeControl: false,
                minZoom: 4,
                mapTypeId: "terrain", //satellite, roadmap, hybrid, terrain
              }}
              mapContainerStyle={containerStyle}
              center={center}
              zoom={4}
              onLoad={(map) => this.onMapLoad(map)}
              onZoomChanged={this.onZoomChanged}
              onCenterChanged={this.onCenterChanged}
            >
              {this.state.tiles.map((tile) => (
                <OverlayView className="overlay" mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} bounds={tile.bounds}>
                  <div className="overlayimg" style={{ backgroundColor: tile.color }}>
                    <div className="labelcontainer">
                      <h2>{tile.text}</h2>
                    </div>
                  </div>
                </OverlayView>
              ))}
            </GoogleMap>
          </LoadScript>
        </div>

        <style jsx>
          {`
            .labelcontainer {
              display: block;
              width: 50px;
              text-align: center;
              position: relative;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              -ms-transform: translate(-50%, -50%);
            }
            .MainContainer {
              width: 100%;
              height: 900px;
            }
            .overlay {
              border: none;
            }
            .overlayimg {
              width: 100%;
              height: 100%;
              position: absolute;
              opacity: 0.4;
              background-repeat: no-repeat;
              background-size: cover;
            }
          `}
        </style>
      </>
    );
  };
}
export default App;
