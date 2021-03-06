import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as MusicMetadata from 'music-metadata';
import ITrackMetadata from './ITrackMetadata';
import commander from 'commander';

import crypto from 'crypto';
// import NoSQL from 'nosql';
// import lowdb from 'lowdb';
// import FileSync from 'lowdb/adapters/FileSync';
import Store from './Store';

const fsStat = promisify(fs.stat);
const fsReaddir = promisify(fs.readdir);

const supportedExts = ['.m4a', '.mp3', '.mp4'];
// const coversFolder = './data/covers';

let trackId = 0;
let store;

function createTrackId() {
    return ++trackId;
}


// ref: https://gist.github.com/zfael/a1a6913944c55843ed3e999b16350b50
// async function generateChecksum(data, algorithm?, encoding?) {
//     console.log(data);
//     return crypto
//         .createHash(algorithm || 'md5')
//         .update(data, 'utf8')
//         .digest(encoding || 'hex');
// }

// async function generateFileChecksum(filepath) {
//     const hash = crypto.createHash('md5');
//     const stream = fs.createReadStream(filepath);
//     let data;

//     while (data = await stream.read()) {
//         hash.update(data, 'utf8');
//     }

//     return await hash.digest('hex');
// }

async function extractMetdata(filepath: string): Promise<ITrackMetadata> {
    try {
        const metadata = await MusicMetadata.parseFile(filepath);
        return {path: filepath, name: metadata.common.title, ...metadata.common};
    } catch (error) {
        console.log(`Failed to parse ${filepath}: ${error.message}`);
        // throw error;
    }
}

async function walkTree(filepath) {
    let pathsToVisit = [];
    pathsToVisit.push(filepath);

    while (pathsToVisit.length > 0) {
        const currentPath = pathsToVisit.pop();
        const entries = await fsReaddir(currentPath);

        for (let i=0; i < entries.length; i++) {
            const entryPath = path.join(currentPath, entries[i]);
            const stats = await fsStat(entryPath);

            if (stats.isDirectory()) {
                pathsToVisit.push(entryPath);
            } else if (stats.isFile()) {
                // TODO symlinks
                if (entries[i].indexOf('.') > 0) {
                    const ext = path.extname(entries[i]);
                    if (supportedExts.indexOf(ext) > -1) {
                        const metadata = await extractMetdata(entryPath);
                        // const checksum = await generateFileChecksum(entryPath);
                        if (metadata) {
                            try {
                                const stat = await fsStat(entryPath);

                                metadata.fileCreatedAt = stat.ctime;
                                metadata.fileUpdatedAt = stat.mtime;
                                metadata.addedAt = new Date();

                                await store.addTrack(metadata);
                            } catch (error) {
                                console.log('error', error);
                            }
                        }
                    }
                }
            }
            // console.log(entries[i], stats.isDirectory());
        }
    }
}

async function initStore() {
    store = new Store('./data');
}

async function start(filepath) {
    try {
        await initStore();

        await walkTree(filepath);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

if (process.argv.length < 3) {
    console.error('Please specify the path to index');
    process.exit(1);
}

start(process.argv[2]);
