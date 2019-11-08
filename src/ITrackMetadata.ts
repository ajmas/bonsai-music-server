import { ICommonTagsResult } from 'music-metadata';

interface ITrackMetadata extends ICommonTagsResult {
    name: string;
    path: string;
    fileCreatedAt?: Date;
    fileUpdatedAt?: Date;
    addedAt?: Date;
    cover?: string;
}

export default ITrackMetadata;