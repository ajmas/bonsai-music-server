// import NoSQL from 'nosql';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import Tingo from 'tingodb';
import { ITrackMetadata } from './MusicIndexer';
import * as mime from 'mime-types';

const TingoDB = Tingo().Db;
const fsWriteFile = promisify(fs.writeFile);

class Store {

    storePath: string;
    coversPath: string;
    db: any;

    typeMap = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
    };

    constructor(storePath) {
        this.storePath = path.resolve(storePath);
        this.coversPath = path.join(this.storePath, 'covers');
        // TODO create folder
        this.db = new TingoDB(path.join(storePath,'/media-catalogue.tingo'), {});

    }

    async open() {
        return new Promise((resolve, reject) => {
            this.db.open((error, db) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(db);
                }
            });
        });
    }

    // ref: https://gist.github.com/zfael/a1a6913944c55843ed3e999b16350b50
    private async generateChecksum(data, algorithm?, encoding?) {
        return crypto
            .createHash(algorithm || 'md5')
            .update(data, 'utf8')
            .digest(encoding || 'hex');
    }

    private async writeImage(name, data) {
        const imagePath = path.join(this.coversPath, name);
        fsWriteFile(imagePath, data);
    }

    async addTrack(trackMetadata: ITrackMetadata) {
        if (trackMetadata.picture && trackMetadata.picture.length >= 1) {
            const imgData = Buffer.from(trackMetadata.picture[0].data);
            const ext = mime.extension(trackMetadata.picture[0].format);
            const checksum = await this.generateChecksum(imgData);
            const filename = `${checksum}${ext}`;

            this.writeImage(filename, imgData);
            trackMetadata.cover = filename;
            delete trackMetadata.picture;
        }

        console.log('adding ', trackMetadata.name);

        return await new Promise((resolve, reject) => {
            const Tracks = this.db.collection('tracks');
            Tracks.update({ path: trackMetadata.path }, trackMetadata, { upsert:true, new:true },   (error, entry) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(entry);
                }
            });
        }).then((track) => {
            return new Promise((resolve, reject) => {
                const Albums = this.db.collection('albums');
                const album = {
                    name: trackMetadata.album,
                    // track: track._id,
                    cover: trackMetadata.cover,
                    artist: trackMetadata.artist
                };
                Albums.update({ name: album.name }, album, { upsert:true, new:true }, (error, entry) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(entry);
                    }
                });
            });
        });
    }

    async findTracks(filter: any = {}, options: any = {}) {
        const skip = options.skip || 1;
        const limit = options.limit || 20;
        const sortBy = options.sortBy || 'name';
        console.log('>>>', sortBy);
        // if (!filter || Object.keys(filter).length === 0) {
        //     // return this.db.find({}).promise();
        // } else if (filter.name) {
        //     // return this.db.find({ name: filter.name });
        // } else {
            const Tracks = this.db.collection('tracks');
            let tracks;
            let total;
            tracks = await new Promise((resolve, reject) => {
                try {
                    Tracks.find().sort([sortBy]).skip(skip).limit(limit).toArray((error, entries) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(entries.map((entry) => {
                                if (entry.cover) {
                                    entry.cover = path.join(this.coversPath, entry.cover);
                                }
                                return entry;
                            }));
                        }
                    })
                } catch (error) {
                    reject(error);
                }
            });

            total = await new Promise((resolve, reject) => {
                try {
                    Tracks.find().count((error, count) => {
                        console.log('XXXX', count);
                        if (error) {
                            reject(error);
                        } else {
                            resolve(count);
                        }
                    })
                } catch (error) {
                    reject(error);
                }
            });

            console.log('total', total);
            return {
                tracks,
                total
            }
        // }
    }

    getTrack(trackId) {
        const Tracks = this.db.collection('tracks');

        return new Promise((resolve, reject) => {
            try {
                Tracks.findOne({ _id: trackId}, (error, entry) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (entry.cover) {
                            entry.cover = path.join(this.coversPath, entry.cover);
                        }
                        resolve(entry);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async findAlbums(filter: any = {}, options: any = {}) {
        return new Promise((resolve, reject) => {
            try {
                const Album = this.db.collection('albums');
                Album.find().toArray((error, entries) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(entries);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default Store;
