---
title: r53 Personal DNS Manager
date: August 30, 2023
---

# **(STILL INCOMPLETE)** r53 Personal DNS Manager

The r53 Personal DNS Manager is a minimalistic manager to keep records of your DNS entries. It is not a DNS server in itself but a key-value store for your AAAA and A records. Queries are performed over HTTP(S), returning string responses. r53 Personal DNS Manager can handle upto a few hundred requests per second.

## Instructions

All your requests to the r53 Personal DNS Manager are performed using the GET HTTP method. Currently, no other HTTP methods are supported. If something goes wrong, an empty string ("") is returned. The r53 Personal DNS Manager does not currently support returning specific error codes.

Four commands, as paths, are supported:

    get
    set
    unset
    reverse

Each of these commands are used in the URL path, such as

    https://www.r53.be:1053/{path}/{url}/...

### GET

To get the IP-address for hostname.domainname, navigate to

    https://www.r53.be:1053/get/domainname/hostname

This will return the IP-address according to the following pseudo code:

    if (IPv6 for hostname.domainname exists):
        return (IPv6 for hostname.domainname)
    else if (IPv4 for hostname.domainname exists):
        return (IPv4 for hostname.domainname)
    else:
        return ""

If there is no record for example.com, an empty string ("") is returned.

If you prefer to specify the IP version for your query, use the `v` parameter with values `ipv6` or `ipv4`:

    https://www.r53.be:1053/get/domainname/hostname?v=ipv6   # returns IPv6-address
    https://www.r53.be:1053/get/domainname/hostname?v=ipv4   # returns IPv4-address

In case of a failed retrieval (e.g., the entry is malformed or does not exist), an empty string is returned.

### SET

To set an IP address for an URL, r53 Personal DNS Manager automatically detects whether your input is an IPv6 or IPv4 address.

Set the IPv6-address fd00::1 for hostname.domainname:

    https://www.r53.be:1053/set/domainname/hostname/fd00::1

Set the IPv4-address 192.168.0.1 for hostname.domainname:

    https://www.r53.be:1053/set/domainname/hostname/192.168.0.1

You can also assign the "visiting" IP address to an URL by not providing any IP address:

    https://www.r53.be:1053/set/domainname/hostname

Any existing entries for an URL will be:1053 overwritten with new assignments.

If the set operation was successful, the string "OK" is returned. Otherwise, the empty string ("") is returned.

### UNSET

To unset IP addresses for an URL, use the `unset` path.

    https://www.r53.be:1053/unset/ipversion/domainname/hostname/ipv6    # removes all ipv6 addresses for hostname.domainname
    https://www.r53.be:1053/unset/ipversion/domainname/hostname/ipv4    # removes all ipv4 addresses for hostname.domainname
    https://www.r53.be:1053/unset/ip/domainname/hostname/192.168.0.1    # removes 192.168.0.1 from hostname.domainname
    https://www.r53.be:1053/unset/ip/domainname/hostname/fd00::1        # removes 192.168.0.1 from hostname.domainname
    https://www.r53.be:1053/unset/noip/domainname/hostname              # removes visiting IP from hostname.domainname
    https://www.r53.be:1053/unset/dns/domainname/hostname               # removes hostname.domainname
    https://www.r53.be:1053/unset/dns/domainname                        # removes everythign for domainname
    

If the unset operation was successful, "OK" is returned. Otherwise, the empty string "" is returned. Unset removes both IPv6- and IPV4-addresses. If you need to keep one of the addresses, then insert it again.

### GET Revisited

If no URL is provided with the get command, all domains and their associated IP addresses are returned:

    example1.com fd00::1 192.168.0.1
    example2.com fd00::2 192.168.0.2
    example3.com fd00::2
    example4.com 192.168.0.1
    ...

### REVERSE

Reverse lookups are supported. Provide an IP address and all DNS names associated with that IP address are returned.

For example,

    https://www.r53.be:1053/reverse/fd00::2

This could return:

    example2.com
    example3.com

For example, 

    https://www.r53.be:1053/reverse/192.168.0.1

Could return:

    example1.com
    example4.com

### UNSET Revisited

If you provide an IP address instead of an URL for the unset command, all DNS names pointing to that IP address will be:1053 removed:

    https://www.r53.be:1053/unset/fd00::1
    https://www.r53.be:1053/unset/192.168.0.1
