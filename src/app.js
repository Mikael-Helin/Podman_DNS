const express = require("express");
const net = require("net");
const fs = require('fs');
const path = require('path');


const port = 1053;
const ALLOWED_DNS_NAME = /^[a-z]([a-z0-9]{0,61}[a-z0-9])?(\.[a-z]([a-z0-9]{0,61}[a-z0-9])?)*$/;
const data_path = "/opt/app/data/";


const app = express();
app.set('trust proxy', 'loopback');  // trust only loopback addresses, needed for req.ip

// Index

app.get("/", (req, res) => {
  fs.readFile(path.join(__dirname, "./html/index.html"), "utf8" , (err, data) => {
    if (err) return res.status(500).send("An error occurred while reading the index file." + err);
    res.send(data); });
});

// Get IP

const readIPFromFile = (dns, version) => {
  const path = `${data_path}${dns}.${version}`;
  if (fs.existsSync(path)) { return fs.readFileSync(path, "utf8"); }; // sync version
  return "";
};

app.get("/get", (req, res) => {
  res.send('listing all records');
});

app.get("/get/:dns", (req, res) => {
  const dns = req.params.dns;
  if (!dns) return res.status(400).send("DNS parameter is missing.");
  if (!ALLOWED_DNS_NAME.test(dns)) return res.status(400).send();
  res.status(200).send(readIPFromFile(dns, "ipv6") || readIPFromFile(dns, "ipv4"));
});

// Set IP

const writeIP2File = (dns, ip) => {
  const path = `${data_path}${dns}.ipv${net.isIP(ip) == 6 ? "6" : "4"}`;
  fs.writeFile(path, ip, (err) => { if (err) { console.error(err); }});
};

const setIP = (dns, ip, res) => {
  if (!dns) { return res.status(400).send("DNS parameter is missing."); };
  if (ALLOWED_DNS_NAME.test(dns) && net.isIP(ip)>=4) {
    writeIP2File(dns, ip); 
    return res.status(200).send("OK"); 
  }
  res.status(400).send("");
};

app.get("/set/:dns", (req, res) => {
  const dns = req.params.dns;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  setIP(dns, ip, res);
});

app.get("/set/:dns/:ip", (req, res) => {
  const dns = req.params.dns;
  const ip = req.params.ip;
  setIP(dns, ip, res);
});

// Unset IP

const unsetIP = (dns, res) => {
  if (net.isIP(dns) >= 4) {
    // dns is actually an IP.address in this code block
    fs.readdir(data_path, (err, files) => {
      if (!err) {
        files.forEach(filename => {
          const fileEnding = filename.slice(-5);
          const ipVersion = net.isIP(dns);
          if ((ipVersion == 6 && fileEnding == ".ipv6") || (ipVersion == 4 && fileEnding == ".ipv4")) {
            const ip = readIPFromFile(filename);
            if (ip == dns) fs.unlinkSync(filename); };});};});}
  else if (dns && ALLOWED_DNS_NAME.test(dns)) {
    ['ipv6', 'ipv4'].forEach(version => {
      const path = `${data_path}${dns}.${version}`;
      if (fs.existsSync(path)) fs.unlinkSync(path); });
    return res.status(200).send("OK"); }
  return res.status(400).send("");
};

app.get("/unset/:dns", (req, res) => {
  const dns = req.params.dns;
  unsetIP(dns, res);
});

// Main

app.listen(port, () => { console.log(`r53 Personal DNS Manager listening at http://localhost:${port}`); });
