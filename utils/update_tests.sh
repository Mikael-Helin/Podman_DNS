#!/bin/bash
cp ../testing/* ~/.local/share/containers/storage/volumes/r53__opt__app__testing/_data
cp ../src/app.js ~/.local/share/containers/storage/volumes/r53__opt__app__dist/_data
podman restart r53-test
