import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import cors from 'cors';

import Store from './Store';
// import jsmediatags from 'jsmediatags';

const readdir = promisify(fs.readdir);
const fsStat = promisify(fs.stat);

const app = express();
let store;

// let allTracks = [];
// let allAlbumNames = [];
// let allAlbums = {};
// let allTracksById = {};

let trackId = 10000;
function createTrackId() {
    return ++trackId;
}

// function loadData(tracks?) {
//     if (!tracks) {
//         const rawLibrary = JSON.parse(fs.readFileSync('./library.json', 'utf8'));
//         if (rawLibrary && rawLibrary.Tracks) {
//             tracks = rawLibrary.Tracks;
//         }
//     }

//     if (tracks) {
//         const albums = {};
//         const keys = Object.keys(tracks);
//         keys.forEach((key) => {
//             let albumName = tracks[key].Album;
//             let album = albums[albumName];
//             if (!album) {
//                 albums[albumName] = {
//                     Name: tracks[key].Album,
//                     Tracks: [{ Name: tracks[key].Name }]
//                 }
//             } else {
//                 album.Tracks.push({
//                     Name: tracks[key].Name
//                 })
//             }
//             allTracks.push(tracks[key]);
//         });
//         allAlbumNames = Object.keys(albums).sort();
//         allAlbums = albums;
//         allTracksById = tracks;
//         console.log(',,,', allAlbumNames.length);
//     }
// }

// async function readTags(filepath) {
//     let trackData;
//     // const fields = ['title', 'artist', 'Artist'];
//     try {
//         let tags: any = await new Promise((resolve, reject) => {
//             jsmediatags.read(filepath, {
//                 onSuccess: function(tag) {
//                     resolve(tag);
//                 },
//                 onError: function(error) {
//                     reject(error);
//                 }
//             });
//         });

//         // console.log(tags.tags);
//         if (tags && tags.tags) {
//             tags = tags.tags;
//             trackData = {
//                 'Track ID': createTrackId(),
//                 Name: tags.title,
//                 artist: tags.artist,
//                 Album: tags.album,
//                 year: tags.year,
//                 track: tags.track,
//                 genre: tags.genre,
//                 path: filepath
//             }
//             console.log(`   name: ${trackData.Name} - album: ${trackData.Album}`);
//         }
//         return trackData;
//     } catch (error) {
//         console.log(filepath);
//         console.log(error);
//         // throw error;
//     }

// }

// async function scanDir(basePath) {
//     const supportedExts = ['.m4a', '.mp3', '.mp4'];

//     let tracks = {};
//     let pathsToVisit = [];
//     pathsToVisit.push(basePath);

//     while (pathsToVisit.length > 0) {
//         const folderPath = pathsToVisit.pop();

//         const entries = await readdir(folderPath);
//         for (let i=0; i < entries.length; i++) {
//             const entryPath = path.join(folderPath, entries[i]);
//             const stats = await fsStat(entryPath);
//             if (stats.isDirectory()) {
//                 pathsToVisit.push(entryPath);
//             } else if (stats.isFile()) {
//                 // TODO symlinks
//                 if (entries[i].indexOf('.') > 0) {
//                     const ext = path.extname(entries[i]);
//                     if (supportedExts.indexOf(ext) > -1) {
//                         console.log('Reading: ', entries[i]);
//                         const tags = await readTags(entryPath);
//                         if (tags) {
//                             tracks[tags['Track ID']] = tags;
//                         }
//                     }

//                 }
//             }
//             console.log(entries[i], stats.isDirectory());
//         }
//     }

//     return tracks;
// }

function externaliseTrack(track) {
    if (track) {
        let cover;
        if ( track.cover ) {
            cover = `http://localhost:8091/tracks/${track._id}/cover`;
        }
        return {
            id: track._id,
            name: track.name,
            artist: track.artist,
            album: track.album,
            year: track.year,
            track: track.track,
            format: track.path.substring(track.path.lastIndexOf('.') + 1),
            genre: track.genre,
            addedAt: track.addedAt,
            cover: cover,
            data: `http://localhost:8091/tracks/${track._id}/data`
        };
    }
    return undefined;
}

function initRoutes() {
    app.get('/tracks', async (req, res, next) => {
        try {

            let tracks = await store.findTracks({ query: req.query.filter });

            console.log(tracks);

            tracks = tracks.map((track) => {
                return externaliseTrack(track);
            })

            res.json({
                metadata: {
                    total: tracks.length
                },
                entries: tracks
            });
        } catch (error) {
            next(error);
        }
    });

    app.get('/tracks/:trackId', async (req, res, next) => {
        try {
            let track = await store.getTrack(req.params.trackId);

            if (!track) {
                throw new Error('404 track not found');
            }

            res.json(externaliseTrack(track));
        } catch (error) {
            next(error);
        }
    });

    app.get('/albums', async (req, res, next) => {
        try {
            let albums = (await store.findAlbums()).map((album) => {
                    return {
                        id: album._id,
                        name: album.name, // externaliseTrack(track);
                        picture: undefined
                    };
                });

            res.json({
                metadata: {
                    total: albums.length
                },
                entries: albums
            });
        } catch (error) {
            next(error);
        }
    });

    app.get('/albums/:name', (req, res, next) => {
        res.json({}); // allAlbums[req.params.name]);
    });

    app.get('/tracks/:trackId/data', async (req, res, next) => {
        try {
            let track = await store.getTrack(req.params.trackId);

            if (track) {
                console.log(track);
                let filePath = track.path;
                if (filePath.startsWith('file:///')) {
                    filePath = filePath.substring(7, track.path.length);
                }
                res.sendFile(decodeURI(filePath));
            } else {
                throw new Error('404 stream not found');
            }

        } catch (error) {
            next(error);
        }
    });

    app.get('/tracks/:trackId/cover', async (req, res, next) => {
        try {
            let track = await store.getTrack(req.params.trackId);

            if (track && track.cover) {
                res.sendFile(track.cover);
            } else {
                throw new Error('404 cover not found');
            }

        } catch (error) {
            next(error);
        }
    });

}

async function start() {
    try {
        store = new Store('./data');

        app.use(cors());

        console.log('setting up routes ... ');
        initRoutes();

        console.log('now listening on 8091');
        app.listen(8091);
    } catch (error) {
        console.error(error);
    }
}

start();


