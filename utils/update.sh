#!/bin/bash
cp ../src/app.js ~/.local/share/containers/storage/volumes/r53__opt__app__dist/_data
cp ../src/html/index.html ~/.local/share/containers/storage/volumes/r53__opt__app__dist/_data/html
podman restart r53
