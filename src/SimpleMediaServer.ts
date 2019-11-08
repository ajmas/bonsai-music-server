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
            albumArtist: track.albumartist,
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
            let page = req.query.page || 1;
            let limit = req.query.limit || 20;
            let offset = req.query.offset;
            let sortBy = req.query.sort;

            if (offset) {
                limit = parseInt(limit);
                offset = parseInt(offset);
                page = offset / limit;
            } else {
                limit = parseInt(limit);
                page = parseInt(page);
                offset = limit * (page - 1);
            }

            const options = {
                limit,
                skip: offset,
                sortBy
            };

            console.log(options);

            let results = await store.findTracks({ query: req.query.filter }, options);

            console.log(results.tracks.length, results.total);

            const tracks = results.tracks.map((track) => {
                return externaliseTrack(track);
            })

            const totalPages = Math.ceil(results.total / limit);

            res.json({
                metadata: {
                    total: results.total,
                    page,
                    totalPages,
                    limit
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


