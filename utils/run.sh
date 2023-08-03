#!/bin/bash
podman run -t -p 1053:1053 --name r53 -v r53__opt__app__dist:/opt/app/dist:Z -v r53__opt__app__data:/opt/app/data r53:production

#file=~/.local/share/containers/storage/volumes/r53__opt__app__data/_data/domains.db
#if [ -f "$file" ]; then
#    echo "Database sucessfully created."
#else
#    echo "Failed to create database."
#fi
