const express = require("express");
const net = require("net");
const app = express();
const fs = require('fs');
const path = require('path');

const port = 1053;


const ALLOWED_DNS_NAME = /^[a-z]([a-z0-9]{0,61}[a-z0-9])?(\.[a-z]([a-z0-9]{0,61}[a-z0-9])?)*$/;
//const ALLOWED_IPv4 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;

app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'html/index.html'), 'utf8' , (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occurred while reading the file.");
    }
    res.send(data);
  })
});

app.get('/get', (req, res) => {
  console.log(`Received DNS query: ${dnsQuery}`);
  res.send('listing all records');
});

app.get('/get/:dns', (req, res) => {
  const dns = req.params.dns

  if (ALLOWED_DNS_NAME.test(dns)) {
    res.send('216.58.207.238 ' + dns);
  } else { res.send() };

  console.log(`Received DNS query: ${req.query}`);
});

app.get('/get/:dns/:ip', (req, res) => {
  const dns = req.params.dns;
  const ip = req.params.ip;

  if (ALLOWED_DNS_NAME.test(dns)) {
    if (net)
    res.send('216.58.207.238 ' + dns);
  } else { res.send() };

  console.log(`Received DNS query: ${req.query}`);
});


app.listen(port, () => {
  console.log(`DNS over HTTPS app listening at http://localhost:${port}`);
});
