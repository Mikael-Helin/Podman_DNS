#!/bin/bash
cp ../testing/*.js ~/.local/share/containers/storage/volumes/r53__opt__app__testing/_data

podman rm -f r53-test

podman run -t -p 8000:80 --name r53-test \
    -v r53__opt__app__dist:/opt/app/dist:Z \
    -v r53__opt__app__data:/opt/app/data:Z \
    -v r53__opt__app__testing:/opt/app/testing:Z \
    localhost/r53:testing

