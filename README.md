# Bonsai Music Server

**Development Level:** Experimenting

The intent of this project is to create a simple music server that can
catalogue a collection of audio files and serve them up via a REST
interface.

One of the main philosphies is that it should be able to be run with
very minimal configuration. So simply of installation and execution
should be kept in mind when adding features.

At this point there we are not looking to support cataloging other media
types.

One of the other outcomes, that would be cool to see, is to create a
reference REST API that anyone can replicate. The idea being that if we
create a reference API with multiple implementations, then client
applications can be combined with any of the servers that match the
spec. In this view any feedback on improving the API would be
appreciated.

# Installing

The server is written using NodeJS and as such you should ensure you
have a both a recent version of NodeJS and npm installed.

Now run:

    npm install

# Running

To index a folder:

    npm run indexer -- <folder>

To run the server:

    npm run server

# Authors & Credits

Written by André John Mas <andrejohn.mas@gmail.com>.

# License

This project uses the MIT license. For details see the [LICENSE.md](./license.md) file.

