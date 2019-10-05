import axios from 'axios';
import asyncPool from "tiny-async-pool";
import { ExifImage } from 'exif';

const exifImage = (image) => {
  return new Promise((resolve, reject) => {
    new ExifImage({
      image 
    }, (err, data) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

const parseGPS = (gpsExif) => {
  const convertDMSToDD = (dms, direction) => {
    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];

    let dd = degrees + minutes/60 + seconds/(60*60);
    // Don't do anything for N or E
    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } 
    return dd;
  }

  return {
    longitude: convertDMSToDD(gpsExif.GPSLongitude, gpsExif.GPSLongitudeRef),
    latitude: convertDMSToDD(gpsExif.GPSLatitude, gpsExif.GPSLatitudeRef),
    altitude: gpsExif.GPSAltitude - gpsExif.GPSAltitudeRef
  }
}

const extractExifs = async (urls, token=null) => {
  const extractLLA = async (url) => {
    const exif = new Exif(url, token);
    return await exif.extractGPSAsArray();
  };

  return await asyncPool(3, urls, extractLLA);
}

class Exif {
  constructor(url, token=null) {
    this.url = url;
    this.token = token;
  }

  async extractGPS() {
    if (this.lla)
      return this.lla;

    try {
      const exif = await this._fetchImage();
      if (exif && exif.gps && 'GPSLatitude' in exif.gps && 'GPSLongitude' in exif.gps && 'GPSAltitude' in exif.gps) {
        this.lla =  parseGPS(exif.gps);
        return this.lla;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async extractGPSAsArray() {
    const lla = await this.extractGPS();

    if (lla) {
      return [lla.latitude, lla.longitude, lla.altitude];
    }
    return null;

  }

  async _fetchImage() {
    try {
      const headers = {
        // 'Range': 'bytes=0-100'
      };

      if (this.token)
        headers['Authorization'] = `bearer ${this.token}`;

      const response = await axios.get(this.url, {
        responseType: 'arraybuffer',
        headers
      });

      this.image = response.data;
      this.exif = await exifImage(this.image);
      return this.exif;
    } catch (e) {
      throw e;
    }
  }
}

export {
  Exif,
  extractExifs
};