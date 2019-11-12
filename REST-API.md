# Bonsai Music Server REST API

**Version:** v0

The API documented here is what should be expected from the Bonsai
Music Server or clones. Feedback for future iterations are always
appreciated.

## Redirection

If an API endpoint moves, but maintains
compatibility with the requested endpoint,
then a 301 HTTP response will be retuned with the
new location.

## Paging

### General

All endpoints that return a collection of resources, such as a list
of tracks, support paging. These responses are structured with a
`metadata` block and an `entries` block for holding the items. For
example:

```
{
  "metadata":{
      "offset": 0,
      "limit": 20,
      "total": 0,
      "pages": 1,
      "page": 0
  },
  "entries": []
}
```

With paging, the client can specify either an `offset` or a `page` as
parameter. The `limit` defines the number of entries returned per page,
with the default being `20`. The `pages` and `total` values represent
the total number of pages available and the total number of entries
available, respectively.

### Sorting

Where sorting is supported by a given endpoint, the following query
options are recognised:

  - `sort:`: the name of the field (virtual or real) to sort by
  - `sortdir:`: the sort direction
     - `ascending:`: 1 or asc
     - `descending:`: -1 or desc

## Endpoints

### GET /api/appinfo

Returns information on the application. Basic information includes

  - `name:`: Application name
  - `version:`: Application version
  - `locales:`: Array of available locales.
  - `authRequired:`: Whether authentication is required
  - `apiVersion:`: Version of the API

Optional build information:

  - `gitBranch:`: Git branch number
  - `gitHash:`: Git hash
  - `buildDate:`: Build date, in ISO8601 format

#### Example

```
{
    "name": "Bonsai Music Server"
    "version" "0.5.0",
    "locales": ["en-GB"],
    "authRequired": false
    "gitHash": "b8e4ac55d382aa974bb1d25bb9aff67a73581e57,
    "buildDate": "2092-11-21T16:55:31Z"
}
```

### GET /api/tracks/:trackId

Gets the track with the specified `trackId`

#### Request Options

None

### GET /api/tracks

Lists the available tracks in the media server.

#### Request Options

  - `q`: multi-field query
  - `artist`: artsit name
  - `albumartist`: album artist name
  - `album`: album name

Note, for any search item there must be a minimum number of 3 characters,
with the following special formats (influenced by regular
expressions):

  - `^abc`: a string that starts with 'abc'
  - `abc$`: as tring that ends with 'abc'
  - `^abc$`: as tring that is exactly 'abc'

Also includes query options for paging.

#### Response

The response format is follows the paging result structure, with entries
in the format defined in the `/api/tracks/:trackId` end point.

### GET /api/albums/:albumId

Gets the album with the specified `albumId`

### GET /api/albums

Lists the albums tracks in the media server

#### Request Options

  - `q`: multi-field query
  - `name`: album name

Note, for any search item there must be a minimum number of 3 characters,
with the following special formats (influenced by regular
expressions):

  - `^abc`: a string that starts with 'abc'
  - `abc$`: as tring that ends with 'abc'
  - `^abc$`: as tring that is exactly 'abc'

Also includes query options for paging.

### GET /api/artists/:artistId

Get the artist with the specified `artistId`

### GET /api/artists

Lists the artists in the media server.

#### Request Options

  - `q`: multi-field query
  - `name`: artist name

Note, for any search item there must be a minimum number of 3 characters,
with the following special formats (influenced by regular
expressions):

  - `^abc`: a string that starts with 'abc'
  - `abc$`: as tring that ends with 'abc'
  - `^abc$`: as tring that is exactly 'abc'

Also includes query options for paging.

#### Response

The response format is follows the paging result structure, with entries
in the format defined in the `/api/tracks/:trackId` end point.


### GET /api/artists/:artistId/image

Returns an image depicting the artist, if available.

## Fields

### Track:

  - `id:`: track id
  - `name:`: track name
  - `artist:`: artist name of the track
  - `albumartist:`: artist name of the associated album
  - `album:`: name of the album
  - `year:`: year of the track
  - `addedAt:`: time track was added to server
  - `track`
    - `no`: number of track
    - `of`: of total number
  - `format:`: file format - container/encoding
  - `genre:`: the genre of the track
  - `cover:`: URL of the track cover
  - `data:`: URL of the file data

Additional fields may be present, but not yet documented, , though some
that may be include art described as part of the [music-metadata](https://github.com/borewit/music-metadata/blob/HEAD/doc/common_metadata.md) project.

Any client code should make provisions for when expected fields are missing.

### Album

  - `id:`: album id
  - `name:`: name of the album
  - `artist:`: name of the album's artist
  - `cover:`: URL of the track cover
  - `tracks:`: list of tracks that are part of the album
  - `compilation:`: whether this is a compilation
  - `genre:`: genres covered by album

Additional fields may be present, but not yet documented.

Any client code should make provisions for when expected fields are missing.

### Artist

  - `id:`: artist id
  - `name:`: name of the artist
  - `picture:`: picture of the artist

Additional fields may be present, but not yet documented

Any client code should make provisions for when expected fields are missing.

## Error Responses

Error responses are generally provided in the form of HTTP Status codes,
with a default response body being:

```
{
    "status": 404,
    "message": "artist not found"
}
```

To support localisation, an optional property 'errorKey' may be provided.
For example:

```
{
    "status": 404,
    "message": "artist not found",
    "errorKey": "not.found.artist"
}
```

Note, that while no specific format is guaranteed, it is encouraged to
prefix with a general type and suffix with a specific type. Examples:

  - `not.found.artist`: Artist could not be found
  - `not.found.track`: Track could not be found


## Limitations

 - It is possible that two or more artists with the same name will be
   treated as the same artist. If you are lucky, the implementation is
   smart enough to make the distinction, but YMMV.

