# r53 personal DNS manager

The r53 personal DNS manager is a minimalistic manager to keep records of your DNS entires. Queries are done over HTTP(S) where strings are returned. Basically, r53 personal DNS manager is a key-value store for your AAAA records and A records, not a DNS server.

## Instructions

With r53 personal DNS manager, all your requests are done with the GET verb only. There is no support for other HTTP verbs.

If something goes wrong, an empty string "" is returned, there are no error codes for r53 personal DNS manager at the moment.

There exists four commands

    get
    set
    unset
    reverse

and all commands are used in the URL path.

##

### GET

To get the IP-address for example.com browse to

    https://www.r53.be/get/example.com

which then returns the IP-address according to following pseudo code

    if (IPv6 for example.com exists):
        return (IPv6 for example.com)
    else if (IPv4 for example.com exists):
        return (IPv4 for example.com)
    else:
        return ""

i.e. if there exists no record of example.com then an empty string "" is returned.

You may prefer to specify IPv6-address or IPv4-address for your retrieval, then you just query with v=ipv6 or v=ipv6

    https://www.r53.be/get/example.com?v=ipv6   # returns IPv6-address
    https://www.r53.be/get/example.com?v=ipv4   # returns IPv4-address

When retireval of an IP-address fails, for example your entry is malformatted or does not exists, an empty string is returned.

##

### SET

When setting an IP-address to an URL. r53 DNS manager automatically detects if your input is an IPv6-address or an IPv4-address.

To set the IPv6-address fd00::1 for example.com just browse to

    https://www.r53.be/set/example.com/fd00::1

And to set the IPv4-address 192.168.0.1 for example.com just browse to

    https://www.r53.be/set/example.com/192.168.0.1

You can also set the IP-address without providing any IP-address, in that case the IP-address visiting the site www.r53.be is assigned to the url

    https://www.r53.be/set/example.com

If some IP-address is already assigned for an URL, then another assignation will overwrite the old value.

If set was successfull, then the string "OK" is returned else the empty string "" is returned.

##

### UNSET

To unset IP-addresses for an URL we use the unset path.

    https://www.r53.be/unset/example.com

If unset was successfull, then the string "OK" is returned else the empty string "" is returned.

##

### GET revisited

If no URL id prvoded with the get, then all domains and their IP-addresses are retunred.

    example1.com fd00::1 192.168.0.1
    example2.com fd00::2 192.168.0.2
    example3.com fd00::2
    example4.com 192.168.0.1
    ...

##

### REVERSE

You can do reverse lookups, that is you provide an IP-address and all DNS names matching the IP-address are retuned

    https://www.r53.be/reverse/fd00::2

returns for example

    example2.com
    example3.com

and

    https://www.r53.be/reverse/192.168.0.1

returns for example

    example1.com
    example4.com

