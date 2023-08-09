#!/bin/bash
podman build -t r53:testing --target testing ..
podman volume create r53__opt__app__testing

cp ../testing/*.js ~/.local/share/containers/storage/volumes/r53__opt__app__testing/_data
