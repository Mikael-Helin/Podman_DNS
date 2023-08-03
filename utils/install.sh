podman build -t r53:production --target production ..
podman volume create r53__opt__app__dist
podman volume create r53__opt__app__data

cp ../src/app.js ~/.local/share/containers/storage/volumes/r53__opt__app__dist/_data/
cp -R ../src/html ~/.local/share/containers/storage/volumes/r53__opt__app__dist/_data/

chmod +x ../shared/entrypoint.sh
chmod +x update.sh
chmod +x run.sh
#chmod +x remove_db.sh
#chmod +x install_tests.sh
#chmod +x update_tests.sh
