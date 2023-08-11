#!/bin/bash

start=$(date +%s)
for domain in {0..2}; do
    for host in {0..255}; do
        curl -s "http://localhost:1053/set/domain${domain}/host${host}/1.1.${domain}.${host}" > /dev/null &
        curl -s "http://localhost:1053/set/domain${domain}/host${host}/1.2.${domain}.${host}" > /dev/null &
        curl -s "http://localhost:1053/set/domain${domain}/host${host}/2008::1:${domain}:${host}" > /dev/null &
        curl -s "http://localhost:1053/set/domain${domain}/host${host}/2009::1:${domain}:${host}" > /dev/null &
    done
    wait
done
end=$(date +%s)
runtime=$((end-start))
echo "4 parallel inserts repeated 256x256 times took ${runtime}s"

start=$(date +%s)
for domain in {0..2}; do
    for host in {0..255}; do
        curl -s "http://localhost:1053/unset/ip/domain${domain}/host${host}/1.1.${domain}.${host}" > /dev/null &
        curl -s "http://localhost:1053/unset/ip/domain${domain}/host${host}/1.2.${domain}.${host}" > /dev/null &
        curl -s "http://localhost:1053/unset/ip/domain${domain}/host${host}/2008::1:${domain}:${host}" > /dev/null &
        curl -s "http://localhost:1053/unset/ip/domain${domain}/host${host}/2009::1:${domain}:${host}" > /dev/null &
    done
    wait
done
end=$(date +%s)
runtime=$((end-start))
echo "4 parallel removals repeated 256x256 times took ${runtime}s"

