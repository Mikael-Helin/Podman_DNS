#!/bin/bash

echo "Running entrypoint.sh"

DB_DIR=/opt/app/data
mkdir -p $DB_DIR

# Create table if necessary.
#if [ "$(ls -A $DB_DIR)" ]; then
#   echo "Data directory is not empty, skipping population."
#else
#   echo "Data directory is empty, populating initial data...";
#   sqlite3 $DB_DIR/domains.db "CREATE TABLE dns_records (id INTEGER PRIMARY KEY AUTOINCREMENT, domain_name TEXT NOT NULL, record_type TEXT NOT NULL, ip_address TEXT NOT NULL, ttl INTEGER DEFAULT (3600) NOT NULL, UNIQUE (domain_name, record_type));"
#fi

# Start your main application.
node /opt/app/dist/app.js
