const express = require("express");
const net = require("net");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const port = 1053;
const data_path = "/opt/app/data/";

const app = express();
app.set('trust proxy', 'loopback');  // trust only loopback addresses, needed for req.ip
app.use(express.static(path.join(__dirname, './html'))); // optional, to tell nodejs its static html

// Utils

const isIP = ip => net.isIP(ip)>=4;
const cleanIP = ip => isIP(ip) ? ip.startsWith("::ffff:") ? ip.substring(7) : ip : null;
const getIPVersion = ip => net.isIPv6(cleanIP(ip)) ? 'ipv6' : net.isIPv4(cleanIP(ip)) ? 'ipv4' : null;
const cleanIPVersion = ipVersion => (ipVersion === "ipv6" || ipVersion === "ipv4") ? ipVersion : "";
const isValidIPVersion = ipVersion => !(!cleanIPVersion(ipVersion));
const getPathName = (host, domain, ipVersion) => `${data_path}${domain}__${host}.${ipVersion}`;
const isCleanDNSPart = part => /^[a-z0-9]{1,61}$/.test(part);

const isCleanDNS = (host, domain) => {
  let isClean = typeof host === "string" && typeof domain === "string" && host.length + domain.length < 253;
  const dns_test = `${host}.${domain}`.replace(/-/g, ".");
  dns_test.split(".").forEach(part => isClean = isClean ? isCleanDNSPart(part) : false);
  return isClean;
};

const resError = res => res.status(400).send("ERROR");
const resNotFound = res => res.status(404).send("Not Found");
const resSuccess = (result, res) => res.status(result ? 200 : 404).send(result ? result : "Not Found");

// ip_provided = true, means that ip is taken from req.params.ip
// ip_provided = false, means that ip is taken from client
// ipversion_provided = true, means that ipVersion is taken from req.params.ipversion
// ipversion_provided = false, means that ipVersion is taken from IP-address
// host is allowed to be === "@"

const getCleanedInfo = (req, ip_provided=false, ipversion_provided=false) =>  {
  const host = isCleanDNS(req.params.host, "a") ? req.params.host : "";
  const domain = isCleanDNS("a", req.params.domain) ? req.params.domain : "";
  const ip_temp = cleanIP(ip_provided ? req.params.ip : (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip));
  const ip = isIP(ip_temp) ? ip_temp : "";
  const ipVersion = ipversion_provided ? cleanIPVersion(req.params.ipversion) : getIPVersion(ip);
  return isCleanDNS(host, domain) ? [host, domain, ip, ipVersion] : [req.params.host === "@" ? "@" : "", domain, ip, ipVersion];
};

// Existence

const domainExists = domain => domain_names.hasOwnProperty(domain);
const hostExists = (host, domain) => domainExists(domain) && domain_names[domain]?.[host];
const ipVersionExists = (host, domain, ipVersion) => hostExists(host, domain) && domain_names[domain]?.[host]?.[ipVersion];

const ipExists = (host, domain, ip) => {
  const ipVersion = getIPVersion(ip);
  return ipVersionExists(host, domain, ipVersion) && domain_names[domain]?.[host]?.[ipVersion].includes(ip);
};

// Callbacks
// Callbacks fetch first cleaned parameters (cleaned info), then test errors in input, then test existance in dictionary
// callbackIP_insert, does not test existence in dictionary, then something that does not exists can be inserted.

const callbackIP_insert = (req, res, ip_provided=false, callback) => {
  const [host, domain, ip, ipVersion] = getCleanedInfo(req, ip_provided);
  if (!host || !domain || !isCleanDNS(host, domain) || !ip || !ipVersion) return resError(res);
  resSuccess(callback(host, domain, ip), res);
};

const callbackIP = (req, res, ip_provided=false, callback) => {
  const [host, domain, ip, ipVersion] = getCleanedInfo(req, ip_provided);
  if (!host || !domain || !isCleanDNS(host, domain) || !ip || !ipVersion) return resError(res);
  if (!ipExists(host, domain, ip)) return resNotFound(res);
  resSuccess(callback(host, domain, ip), res);
};

const callbackIPVersion = (req, res, ipversion_provided=true, callback) => {
  const [host, domain, _, ipVersion] = getCleanedInfo(req, false, ipversion_provided);
  if (!host || !domain || !isCleanDNS(host, domain) || !ipVersion) return resError(res);
  if (!ipVersionExists(host, domain, ipVersion)) return resNotFound(res);
  resSuccess(callback(host, domain, ipVersion), res);
};

const callbackHost = (req, res, callback) => {
  const [host, domain] = getCleanedInfo(req);
  if (!host || !domain || !isCleanDNS(host, domain)) return resError(res);
  if (!hostExists(host, domain)) return resNotFound(res);
  resSuccess(callback(host, domain), res);
};

const callbackDomain = (req, res, callback) => {
  const [_, domain] = getCleanedInfo(req);
  if (!domain || !isCleanDNS("a", domain)) return resError(res);
  if (!domainExists(domain)) return resNotFound(res);
  resSuccess(callback(domain), res);
};

const callbackAll = (res, callback) => {
  if (Object.keys(domain_names).length == 0) return resNotFound(res);
  return resSuccess(callback(), res);
};

// Index

const getIndexPage = async () => {
  try {
    const data = await fsp.readFile(path.join(__dirname, "./html/index.html"), "utf8");
    return data; }
  catch (err) {
    console.error(err);
    return ""; };
};

app.get("/", async (_, res) => {
  const indexPage = await getIndexPage();
  res.status(indexPage ? 400 : 200).send(indexPage ? indexPage : "");
});

// Get IP
// Return empty string ("") is same as not found

const returnIPStringIPVersion = (host, domain, ipVersion) => domain_names[domain]?.[host]?.[ipVersion] ? `${host}.${domain} ${ipVersion} ${domain_names[domain][host][ipVersion].join(" ")}\n` : "";
const returnIPStringHost = (host, domain) => returnIPStringIPVersion(host, domain, "ipv6") + returnIPStringIPVersion(host, domain, "ipv4");

const returnIPStringDomain = domain => {
  let IPString = "";
  if (domain_names.hasOwnProperty(domain)) for (const host in domain_names[domain]) IPString += returnIPStringHost(host, domain) + "\n";
  return IPString.trimEnd();
};

const returnIPStringAll = () => {
  let IPString = "";
  if (Object.keys(domain_names).length>0) for (const domain in domain_names) IPString += returnIPStringDomain(domain) + "\n";
  return IPString.trimEnd();
};

app.get("/get", (_, res) => callbackAll(returnIPStringAll()));
app.get("/get/:domain", (req, res) => callbackDomain(req, res, domain => returnIPStringDomain(domain)));
app.get("/get/:domain/:host", (req, res) => callbackHost(req, res, (host, domain) => returnIPStringHost(host, domain)));
app.get("/get/:domain/:host/:ipversion", (req, res) => callbackIPVersion(req, res, (host, domain, ipVersion) => returnIPStringIPVersion(host, domain, ipVersion)));

// Set IP

app.get("/set/:domain/:host", (req, res) => callbackIP_insert(req, res, false, (host, domain, ip) => updateIPInHost(host, domain, ip)));
app.get("/set/:domain/:host/:ip", (req, res) => callbackIP_insert(req, res, true, (host, domain, ip) => updateIPInHost(host, domain, ip)));

app.get("/set/:domain/:ip", (req, res) => {
  const { domain, ip } = req.params;
  console.log(`Received domain: ${domain}, IP: ${ip}`);
  return callbackIP_insert(req, res, false, (host, domain, ip) => updateIPInHost(host, domain, ip));
});

// Unset by IPVersion

app.get("/unset/ipversion/:ipversion", (req, res) => callbackIPVersion(req, res, true, (host, domain, ipVersion) => removeIPVersionFromAll(ipVersion)));
app.get("/unset/ipversion/:domain/:ipversion", (req, res) => callbackIPVersion(req, res, true, (host, domain, ipVersion) => removeIPVersionFromDomain(domain, ipVersion)));
app.get("/unset/ipversion/:domain/:host/:ipversion", (req, res) => callbackIPVersion(req, res, true, (host, domain, ipVersion) => removeIPVersionFromHost(host, domain, ipVersion)));

// Unset by DNS

app.get("/unset/dns/:domain", (req, res) => callbackDomain(req, res, domain => removeDomain(domain)));
app.get("/unset/dns/:domain/:host", (req, res) => callbackHost(req, res, (host, domain) => removeHostInDomain(host, domain)));

// Unset by IP

app.get("/unset/ip/:ip", (req, res) => callbackIP(req, res, true, (host, domain, ip) => removeIPFromAll(ip)));
app.get("/unset/ip/:domain/:ip", (req, res) => callbackIP(req, res, true, (host, domain, ip) => removeIPFromDomain(domain, ip)))
app.get("/unset/ip/:domain/:host/:ip", (req, res) => callbackIP(req, res, true, (host, domain, ip) => removeIPFromHost(host, domain, ip)));

app.get("/unset/noip", (req, res) => callbackIP(req, res, false, (host, domain, ip) => removeIPFromAll(ip)));
app.get("/unset/noip/:domain", (req, res) => callbackIP(req, res, false, (host, domain, ip) => removeIPFromDomain(domain, ip)));
app.get("/unset/noip/:domain/:host", (req, res) => callbackIP(req, res, false, (host, domain, ip) => removeIPFromHost(host, domain, ip)));

// Reverse lookup

const lookupHostByIP = (host, domain, ip) => {
  const ipVersion = getIPVersion(ip);
  return (ipVersion && domain_names[domain]?.[host]?.[ipVersion]?.includes(ip)) ? `${host}.${domain}\n` : "";
};

const lookupDomainByIP = (domain, ip) => {
  let result = "";
  const ipVersion = getIPVersion(ip);
  if (ipVersion && domain_names.hasOwnProperty(domain)) for (const host in domain_names[domain]) result += lookupHostByIP(host, domain, ip);
  return result;
};

const lookupAllByIP = ip => {
  let result = "";
  for (const domain in domain_names) result += lookupDomainByIP(domain, ip);
  return result;
};

app.get("/lookup/ip/:ip", (req, res) => callbackIP(req, res, true, (host, domain, ip) => lookupAllByIP(ip)));
app.get("/lookup/ip/:domain/:ip", (req, res) => callbackIP(req, res, true, (host, domain, ip) => lookupDomainByIP(domain, ip)));
app.get("/lookup/ip/:domain/:host/:ip", (req, res) => callbackIP(req, res, true, (host, domain, ip) => lookupHostByIP(host, domain, ip)));

app.get("/lookup/noip", (req, res) => callbackIP(req, res, false, (host, domain, ip) => lookupAllByIP(ip)));
app.get("/lookup/noip/:domain", (req, res) => callbackIP(req, res, false, (host, domain, ip) => lookupDomainByIP(domain, ip)));
app.get("/lookup/noip/:domain/:host", (req, res) => callbackIP(req, res, false, (host, domain, ip) => lookupHostByIP(host, domain, ip)));

// Other

app.get("/dump", (res, req) => callbackAll(req, res, () => dumpDictionary()));
app.get("/reset", (res, req) => callbackAll(req, res, () => removeAll()));

// Dictionary File Management
// Manages dictionary data files in /opt/app/data
// domain_names[domain][host][ipVersion] contains a list of IP-addresses
// /opt/app/data/domain__host.ipVersion contains list of IP-addresses separated by "\n"

const overwriteIP2File = (host, domain, ipVersion) => {
  if (!(host && domain && ipVersion)) return;
  const path = getPathName(host, domain, ipVersion);
  const ips = (domain_names[domain]?.[host]?.[ipVersion] || []).join("\n");
  if (ips) { fsp.writeFile(path, ips, err => { if (err) console.error(err); });};
};

const readIPFromFile = async (host, domain, ipVersion) => {
  const path = getPathName(host, domain, ipVersion);
  try {
    await fsp.access(path); // Checks if the file exists
    return await fsp.readFile(path, "utf8"); }
  catch (err) { return ""; };
};

const deleteIPFile = (host, domain, ipVersion) => {
  if (!(host && domain && ipVersion)) return;
  const path = getPathName(host, domain, ipVersion);
  if (fs.existsSync(path)) fs.unlinkSync(path);
};

const populateDictionary = async () => {
  let domain_names2 = {};
  const files = await fsp.readdir(data_path);
  for (const filename of files) {
    const ipVersion = filename.slice(-5).slice(1);
    if (isValidIPVersion(ipVersion)) {
      const [domain, host] = filename.slice(0, -5).split("__");
      domain_names2[domain] = domain_names2[domain] || {};
      domain_names2[domain][host] = domain_names2[domain][host] || {};
      domain_names2[domain][host][ipVersion] = await readIPFromFile(host, domain, ipVersion);
    }
  }
  return domain_names2;
};

const dumpDictionary = () => {
  for (const domain  in domain_names) {
    if (domain_names.hasOwnProperty(domain)) {
      for (const host in domain_names[domain]) {
        if (domain_names[domain].hasOwnProperty(host)) {
          for (const ipVersion in domain_names[domain][host]) {
            if (domain_names[domain][host].hasOwnProperty(ipVersion)) overwriteIP2File(host, domain, ipVersion); };};};};};
};

// Dictionary Altering Functions
// cmdDestinationSource cmdWhoWhere

const updateIPInHost = (host, domain, ip) => {
  const ipVersion = getIPVersion(ip);
  if (!ipVersion) return false;
  domain_names[domain] = domain_names[domain] || {};
  domain_names[domain][host] = domain_names[domain][host] || {};
  domain_names[domain][host][ipVersion] = domain_names[domain][host][ipVersion] || [];
  if (!ipExists(host, domain, ip)) domain_names[domain][host][ipVersion].push(ip);
  overwriteIP2File(host, domain, ipVersion);
  return true;
};

const removeIPFromHost = (host, domain, ip) => {
  const ipVersion = getIPVersion(ip);
  if (domain_names[domain]?.[host]?.[ipVersion]?.includes(ip)) {
    domain_names[domain][host][ipVersion] = domain_names[domain][host][ipVersion].filter(ip2 => ip2 !== ip);
    if (domain_names[domain][host][ipVersion].length>0 ) overwriteIP2File(host, domain, ipVersion)
    else {
      deleteIPFile(host, domain, ipVersion);
      delete domain_names[domain][host][ipVersion];
      if (Object.keys(domain_names[domain][host]).length === 0) {
        delete domain_names[domain][host];
        if (Object.keys(domain_names[domain]).length === 0) delete domain_names[domain]; };};};
};

const removeIPFromDomain = (domain, ip) => { if (domain_names.hasOwnProperty(domain)) for (const host in domain_names[domain]) removeIPFromHost(host, domain, ip); };
const removeIPFromAll = ip => { for (const domain in domain_names) removeIPFromDomain(domain, ip); };

const removeIPVersionFromHost = (host, domain, ipVersion) => {
  let notFound = true;
  if (domain_names[domain]?.[host]?.[ipVersion]) {
    notFound = false;
    deleteIPFile(host, domain, ipVersion);
    delete domain_names[domain][host][ipVersion];
    if (Object.keys(domain_names[domain][host]).length === 0) { 
      delete domain_names[domain][host];
      if (Object.keys(domain_names[domain]).length === 0) delete domain_names[domain]; };};
  return notFound;
};

const removeIPVersionFromDomain = (domain, ipVersion) => {
  let notFound = true;
  if (domain_names.hasOwnProperty(domain)) 
    for (const host in domain_names[domain]) 
      if (!removeIPVersionFromHost(host, domain, ipVersion)) notFound = false;
  return notFound;
};

const removeIPVersionFromAll = ipVersion => {
  let notFound = true;
  if (Object.keys(domain_names).length>0)
    for (const domain in domain_names)
      if (!removeIPVersionFromDomain(domain, ipVersion)) notFound = false;
  return notFound;
};

const removeHostInDomain = (host, domain) => {
  let notFound = true;
  if (domain_names[domain]?.[host])
    ["ipv6", "ipv4"].forEach(ipVersion => {
      if (!removeIPVersionFromHost(host, domain, ipVersion)) notFound = false; });
  return notFound;
};

const removeDomain = domain => { if (domain_names.hasOwnProperty(domain)) for (const host in domain_names) removeHostInDomain(host, domain); };

const removeAll = () => { if (Object.keys(domain_names).length>0) for (const domain in domain_names) removeDomain(domain); };

// Writes named.conf.local

const addDomain2NamedConfLocal = domain => {
  if (!(domain in domain_names)) {
    let conflocal = `zone "${domain}" {
  type master;
  file "/etc/bind/zones/${domain}.db";
};

`;

  fs.appendFile("/etc/bind/named.conf.local", conflocal, function (err) {
    if (err) throw err;
    console.log('Saved!');});};
};

const overWriteNamedConfLocal = async () => {
  const filename = "/etc/bind/named.conf.local";
  if (fs.existsSync(filename)) fs.unlinkSync(filename);
  for (const domain in domain_names) addDomain2NamedConfLocal(domain);
};

const removeDomainFromNamedConfLocal = domain => {
  if (domain in domain_names) delete domain_names[domain];
  writeDomainsBind();
};

// Bind zones -  writes /etc/bind/zones/${domain}.db` from domain_names[domain] or delete zones
// For a given domain, operate on all its hosts, i.e. host is not function argument.

const updateZone = domain => {
  if (domain in domain_names && domain_names[domain].length>0) {
    const db = `$TTL 86400
@       IN      SOA     ns.r53.be. admin.r53.be. (
                        ${Date.now()}   ; serial number
                        3600            ; refresh period
                        900             ; retry interval
                        604800          ; expire time
                        86400 )         ; minimum TTL

        IN      NS      ns.r53.be.
        IN      A       192.168.0.3
        IN      AAAA    fc00::3

`;
    for (const host in domain_names[domain]) {
      if (domain_names[domain].hasOwnProperty(host)) {
        if ("ipv6" in domain_names[domain][host] && domain_names[domain][host]["ipv6"].length>0) {
          domain_names[domain][host]["ipv6"].forEach(ip => db += `${host} IN  AAAA  ${ip}\n` );};
        if ("ipv4" in domain_names[domain][host] && domain_names[domain][host]["ipv4"].length>0) {
          domain_names[domain][host]["ipv4"].forEach(ip => db += `${host} IN  A  ${ip}\n` );};};};
    
    fsp.writeFile(`/etc/bind/zones/${domain}.db`, db, err => { if(err) { console.error(err); };});};
};

const updateAllZones = () => { if (Object.keys(domain_names).length>0) for (domain in domain_names) updateZone(domain); };

const deleteDomainZone = domain => {
  const filename = `/etc/bind/zones/${domain}.db`;
  if (!(domain in domain_names) && fs.existsSync(filename)) fs.unlinkSync(filename);
};

const deleteDanglingZones = () => {
  const all_domain_file_names = populateDictionary();
  for (const domain in all_domain_file_names) { 
    if(!(domain in domain_names)) { 
      removeDomainFromNamedConfLocal(domain);
      deleteDomainZone(domain) };};
};

// Main

let domain_names = {};

const main = async () => {
  domain_names = await populateDictionary();
  await overWriteNamedConfLocal();
  await updateAllZones();
  await deleteDanglingZones();
  app.listen(port, () => { console.log(`r53 Personal DNS Manager listening at http://localhost:${port}`); });
};

if (require.main === module) main();

module.exports = {
  cleanIP,
  isCleanDNS,
  getCleanedInfo,
  updateIPInHost,
  returnIPStringHost,
  returnIPStringDomain,
  returnIPStringAll,
  removeIPFromHost,
  removeIPFromDomain,
  removeIPFromAll,
  removeIPVersionFromHost,
  removeIPVersionFromDomain,
  removeIPVersionFromAll,
  removeHostInDomain,
  removeDomain,
  removeAll,
  hostExists,
  domainExists,
  ipExists,
  ipVersionExists
};