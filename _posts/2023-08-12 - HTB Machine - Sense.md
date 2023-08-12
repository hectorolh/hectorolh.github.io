---
layout: post
title: HTB Machine - Sense
subtitle: Writeup
cover-img: 
thumbnail-img: 
share-img: 
tags: [ HTB,Hack the Box,Web,Vulnerability Assessment,Outdated Software,Security Tools,Authentication,Remote Code Execution,Clear Text Credentials,Sensitive Data Exposure,PHP]
---
Ping analisys: Linux box
Scans:
```
sudo nmap -sS 10.10.10.60 -p- --open --min-rate 5000 -n -Pn -oG ./nmap/allports
sudo nmap -sCV 10.10.10.60 -p80,443 -oN ./nmap/targeted

whatweb http://10.10.10.60
http://10.10.10.60 [301 Moved Permanently] Country[RESERVED][ZZ], HTTPServer[lighttpd/1.4.35], IP[10.10.10.60], RedirectLocation[https://10.10.10.60/], lighttpd[1.4.35]
ERROR Opening: https://10.10.10.60/ - SSL_connect returned=1 errno=0 state=error: dh key too small
```
Heading to the website we are presented with a login panel for PFsense. pfSense is a firewall and router software distribution based on FreeBSD. It offers features such as unified threat management, load balancing, multiple WAN, and more. Searching for default credential we notice they are not useful. 

Lets try and fuzz the site. 
```zsh
ffuf -c -t 200 -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -u https://10.10.10.60/FUZZ -ic -e .txt
```
Lots of options but after checking each one we are redirected to blank pages. All except changelog and system-users which contain a user that we can try in the login panel. We dont have a password but we can try the usual suspects and the default one. 

It worked. The user and the default pass granted us access to the management panel. We can see the version of pfsense. Doing a bit of research we come a accross a CVE that our version could be vulnerable. 

*CVE-2016-10709: it describes a command injection vulnerability in a PHP page on pfSense via a GET parameter. This vulnerability exists in the `_rrd_graph_img.php` page of pfSense version <= 2.2.6 and allows a non-administrative authenticated attacker to inject arbitrary operating system commands and execute them as the root user via the `graph` GET parameter.*

At this point I'm going to use Metasploit module unix/http/pfsense_graph_injection_exec. It is all straight forward after we fill the options on the module to get a root shell and snatch both flags easily. 
