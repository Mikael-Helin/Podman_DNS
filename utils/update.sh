#!/bin/bash
cp ../src/app.js ~/.local/share/containers/storage/volumes/r53__opt__app__dist/_data
podman restart r53
