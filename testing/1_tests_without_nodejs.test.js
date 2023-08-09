const {
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
    removeAll } = require('../dist/app.js');

test('Testing cleanIP with invalid input', () => {
    const inputs = ["", "text", null, undefined, true, false, 99, "$£$đ", [], {}, "1.2.3", "fd:00000:1"];
    inputs.forEach(input => {
        const expected_output = null;
        const output = cleanIP(input);
        expect(output).toBe(expected_output);
    });
});

test('Testing cleanIP with valid input', () => {
    const inputs = ["1.2.3.4", "fd::1"];
    inputs.forEach(input => {
        const expected_output = input;
        const output = cleanIP(input);
        expect(output).toBe(expected_output);
    });
});

test('Testing cleanIP with ::ffff:1.2.3.4', () => {
    input = "::ffff:1.2.3.4";
    const expected_output = "1.2.3.4";
    const output = cleanIP(input);
    expect(output).toBe(expected_output);
});

test('Testing isCleanDNS with invalid input', () => {
    inputs = ["", ".text", "text.", "te..xt", "-test", "test-", "te--st", 99, "$£$đ", [], {}, ["test"], {"key": "value"}, "fd:00000:1", null, undefined, true, false];
    inputs.forEach(host => {
        inputs.forEach(domain => {
            const expected_output = false;
            const output = isCleanDNS(host, domain);
            expect(output).toBe(expected_output);
        });
    });
});

test('Testing isCleanDNS with valid input', () => {
    inputs = ["a", "0", "e0", "f.1", "g-2"];
    inputs.forEach(host => {
        inputs.forEach(domain => {
            const expected_output = true;
            const output = isCleanDNS(host, domain);
            expect(output).toBe(expected_output);
        });
    });
});

test('Testing insert 1.2.3.4 for host.domain', () => {
    const [host, domain, ip] = ["host", "domain", "1.2.3.4"];
    const expected_output = true;
    const output = updateIPInHost(host, domain, ip); 
    expect(output).toBe(expected_output);
});

test('Testing insert IP-addresses for host.domain', () => {

    ["1.2.3.4", "1.2.3.4", "4.3.2.1", "2008::1", "2008::1"].forEach(ip => {
        const [host, domain] = ["host", "domain"];
        const expected_output = true;
        const output = updateIPInHost(host, domain, ip);
        expect(output).toBe(expected_output);
    });
});

test('Testing returnIPStringHost for host.domain', () => {
    const [host, domain] = ["host", "domain"];
    const expected_output = "host.domain ipv6 2008::1\nhost.domain ipv4 1.2.3.4 4.3.2.1\n";
    const output = returnIPStringHost(host, domain); 
    expect(output).toBe(expected_output);
});

test('Testing returnIPStringDomain for domain', () => {
    const domain = "domain";
    updateIPInHost("localhost", domain, "::1");
    const expected_output = "host.domain ipv6 2008::1\nhost.domain ipv4 1.2.3.4 4.3.2.1\n\nlocalhost.domain ipv6 ::1";
    const output = returnIPStringDomain(domain);
    expect(output).toBe(expected_output);
});

test('Testing returnIPStringAll', () => {
    const expected_output = "host.domain ipv6 2008::1\nhost.domain ipv4 1.2.3.4 4.3.2.1\n\nlocalhost.domain ipv6 ::1";
    const output = returnIPStringAll();
    expect(output).toBe(expected_output);
});

test('Testing failed removeIPVersionFromDomain', () => {
    const expected_output = true;
    const output = removeIPVersionFromAll("ipv2");
    expect(output).toBe(expected_output);
});

test('Testing removeIPVersionFromDomain with ipv4', () => {
    const expected_output = false;
    const output = removeIPVersionFromAll("ipv4");
    expect(output).toBe(expected_output);
});

test('Testing returnIPStringAll after ipv4 removal', () => {
    const expected_output = "host.domain ipv6 2008::1\n\nlocalhost.domain ipv6 ::1";
    const output = returnIPStringAll();
    expect(output).toBe(expected_output);
});

test('Testing failed exists', () => {
    const expected_output = true;
    const output = removeIPVersionFromAll("ipv4");
    expect(output).toBe(expected_output);
});
