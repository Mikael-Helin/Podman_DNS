#!/bin/bash

start=$(date +%s)
for j in {1..1000}; do
    curl -s http://localhost:1053 > /dev/null
done
end=$(date +%s)
runtime=$((end-start))
echo "1000x single index page requests took ${runtime}s"


start=$(date +%s)
for j in {1..10}; do
  for i in {1..10000}; do
    curl -s http://localhost:1053 > /dev/null &
  done
  wait # Wait for all background jobs to finish
done
curl -s http://localhost:1053 > /dev/null 
end=$(date +%s)
runtime=$((end-start))
echo "10x 10000-batch index page requests took ${runtime}s"
